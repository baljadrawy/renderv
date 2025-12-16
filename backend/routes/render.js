const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

const { captureFrames } = require('../services/puppeteer');
const { createVideo } = require('../services/ffmpeg');
const authMiddleware = require('../middleware/auth');

const RESOLUTIONS = {
  'HD_Vertical': { width: 1080, height: 1920, name: 'ريلز/تيك توك' },
  'Square': { width: 1080, height: 1080, name: 'مربع' },
  'HD_Horizontal': { width: 1920, height: 1080, name: 'أفقي' }
};

// حماية بسيطة (اختياري - يمكن إزالته للاستخدام الشخصي)
if (process.env.AUTH_TOKEN) {
  router.use(authMiddleware);
}

router.post('/', async (req, res) => {
  const startTime = Date.now();
  const jobId = uuidv4();
  
  const {
    html = '',
    css = '',
    js = '',
    resolution = 'HD_Vertical',
    format = 'MP4',
    duration = 15,
    fps = 30
  } = req.body;

  // Validation
  if (!html || html.length > 500000) {
    return res.status(400).json({ 
      success: false, 
      error: 'كود HTML مطلوب ويجب أن يكون أقل من 500KB' 
    });
  }

  const maxDuration = parseInt(process.env.MAX_DURATION) || 60;
  if (duration < 1 || duration > maxDuration) {
    return res.status(400).json({ 
      success: false, 
      error: `المدة يجب أن تكون بين 1-${maxDuration} ثانية` 
    });
  }

  if (!RESOLUTIONS[resolution]) {
    return res.status(400).json({ 
      success: false, 
      error: 'دقة غير مدعومة' 
    });
  }

  const maxFps = parseInt(process.env.MAX_FPS) || 60;
  if (fps < 1 || fps > maxFps) {
    return res.status(400).json({ 
      success: false, 
      error: `FPS يجب أن يكون بين 1-${maxFps}` 
    });
  }

  if (!['MP4', 'GIF'].includes(format)) {
    return res.status(400).json({ 
      success: false, 
      error: 'التنسيق يجب أن يكون MP4 أو GIF' 
    });
  }

  const sessionDir = path.join(process.env.TEMP_DIR || './temp', jobId);
  
  try {
    logger.info(`[${jobId}] بدء عملية جديدة - ${resolution} - ${duration}s - ${format}`);
    
    // إنشاء مجلد الجلسة
    await fs.mkdir(sessionDir, { recursive: true });

    // 1. إنشاء ملف HTML
    const fullHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      overflow: hidden;
      background: #000;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    ${js}
  </script>
</body>
</html>`;

    const htmlPath = path.join(sessionDir, 'index.html');
    await fs.writeFile(htmlPath, fullHTML, 'utf8');

    // 2. التقاط الإطارات
    const { width, height } = RESOLUTIONS[resolution];
    logger.info(`[${jobId}] التقاط ${duration * fps} إطار...`);
    
    await captureFrames({
      htmlPath,
      sessionDir,
      width,
      height,
      duration,
      fps,
      jobId
    });

    // 3. إنشاء الفيديو
    logger.info(`[${jobId}] إنشاء ${format}...`);
    
    const outputPath = await createVideo({
      framesDir: sessionDir,
      outputDir: process.env.OUTPUT_DIR || './output',
      format,
      fps,
      width,
      height,
      jobId
    });

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`[${jobId}] ✅ اكتمل في ${processingTime}s`);

    // الاستجابة
    const fileName = path.basename(outputPath);
    res.json({
      success: true,
      jobId,
      downloadUrl: `/output/${fileName}`,
      fileName,
      processingTime: `${processingTime}s`,
      resolution: RESOLUTIONS[resolution].name,
      format,
      fileSize: (await fs.stat(outputPath)).size
    });

    // تنظيف الملفات المؤقتة (بعد 5 دقائق)
    setTimeout(async () => {
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
        logger.info(`[${jobId}] تم تنظيف الملفات المؤقتة`);
      } catch (err) {
        logger.error(`[${jobId}] خطأ في التنظيف: ${err.message}`);
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    logger.error(`[${jobId}] خطأ: ${error.message}`, { stack: error.stack });
    
    // تنظيف عند الخطأ
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch {}

    res.status(500).json({
      success: false,
      error: 'فشل إنشاء الفيديو',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
