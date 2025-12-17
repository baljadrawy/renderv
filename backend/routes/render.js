const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

// استدعاء الخدمات
const { captureFrames } = require('../services/puppeteer');
const { createVideo } = require('../services/ffmpeg');
const authMiddleware = require('../middleware/auth');

// تعريف Logger لتجنب الأخطاء إذا لم يكن معرفاً عالمياً
const logger = global.logger || console;

const RESOLUTIONS = {
  'HD_Vertical': { width: 1080, height: 1920, name: 'ريلز/تيك توك' },
  'Square': { width: 1080, height: 1080, name: 'مربع' },
  'HD_Horizontal': { width: 1920, height: 1080, name: 'أفقي' }
};

// تخزين حالة المهام في الذاكرة
const jobs = new Map();

// حماية المسار (اختياري)
if (process.env.AUTH_TOKEN) {
  router.use(authMiddleware);
}

/**
 * Endpoint لمتابعة التقدم (SSE)
 */
router.get('/progress/:jobId', (req, res) => {
  const { jobId } = req.params;

  // إعداد الهيدرز الخاصة بـ Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // إذا لم تكن المهمة موجودة (ربما تم تنظيفها أو الرابط خطأ)
  if (!jobs.has(jobId)) {
    res.write(`data: ${JSON.stringify({ progress: 0, stage: 'error', message: 'المهمة غير موجودة أو انتهت صلاحيتها' })}\n\n`);
    return res.end();
  }

  const job = jobs.get(jobId);
  job.listeners.push(res);

  // إرسال الحالة الحالية فور الاتصال
  res.write(`data: ${JSON.stringify({ 
    progress: job.progress, 
    stage: job.stage, 
    message: job.message,
    result: job.result // النتيجة النهائية في حال كانت مكتملة
  })}\n\n`);

  // تنظيف المستمع عند إغلاق العميل للاتصال
  req.on('close', () => {
    const idx = job.listeners.indexOf(res);
    if (idx > -1) job.listeners.splice(idx, 1);
  });
});

/**
 * Endpoint لبدء عملية التحويل
 */
router.post('/', async (req, res) => {
  const startTime = Date.now();
  const jobId = uuidv4();

  // استقبال البيانات مع تعيين قيم افتراضية
  const {
    html = '',
    css = '',
    js = '',
    resolution = 'HD_Vertical',
    format = 'MP4',
    duration = 15,
    fps = 30
  } = req.body;

  // --- التحقق من المدخلات (Validation) ---
  if (!html || html.length > 500000) {
    return res.status(400).json({ success: false, error: 'كود HTML مطلوب ويجب أن يكون أقل من 500KB' });
  }

  const maxDuration = parseInt(process.env.MAX_DURATION) || 60;
  if (duration < 1 || duration > maxDuration) {
    return res.status(400).json({ success: false, error: `المدة يجب أن تكون بين 1-${maxDuration} ثانية` });
  }

  if (!RESOLUTIONS[resolution]) {
    return res.status(400).json({ success: false, error: 'دقة الفيديو غير مدعومة' });
  }

  const maxFps = parseInt(process.env.MAX_FPS) || 60;
  if (fps < 1 || fps > maxFps) {
    return res.status(400).json({ success: false, error: `FPS يجب أن يكون بين 1-${maxFps}` });
  }

  if (!['MP4', 'GIF'].includes(format)) {
    return res.status(400).json({ success: false, error: 'التنسيق يجب أن يكون MP4 أو GIF' });
  }

  // --- إنشاء سجل المهمة ---
  jobs.set(jobId, {
    progress: 0,
    stage: 'starting',
    message: 'جاري التحضير...',
    listeners: [],
    startTime
  });

  // إرسال JobId للمستخدم فوراً
  res.json({ success: true, jobId });

  // --- بدء المعالجة في الخلفية ---
  const sessionDir = path.resolve(process.env.TEMP_DIR || './temp', jobId);

  // دالة مساعدة لتحديث الحالة وإبلاغ المستمعين
  const updateProgress = (progress, stage, message, result = null) => {
    const job = jobs.get(jobId);
    if (job) {
      job.progress = progress;
      job.stage = stage;
      job.message = message;
      if (result) job.result = result;
      
      job.listeners.forEach(listener => {
        try {
          listener.write(`data: ${JSON.stringify({ progress, stage, message, result })}\n\n`);
        } catch (e) { console.error(e); }
      });
    }
  };

  try {
    logger.info(`[${jobId}] بدء مهمة جديدة: ${resolution}, ${duration}s, ${format}`);
    updateProgress(5, 'preparing', 'جاري تجهيز الملفات...');

    // إنشاء المجلد المؤقت
    await fs.mkdir(sessionDir, { recursive: true });

    // تجميع ملف HTML الكامل
    // ملاحظة: الخطوط fonts-noto المثبتة في Docker ستعمل هنا تلقائياً
    const fullHTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    /* Reset */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      margin: 0; 
      padding: 0; 
      overflow: hidden;
      background: #000;
      /* استخدام الخطوط المثبتة في النظام (Docker) */
      font-family: 'Noto Sans Arabic', 'Noto Sans', 'Noto Color Emoji', sans-serif;
    }
    /* User CSS */
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    // منع الأخطاء العشوائية من إيقاف التسجيل
    window.onerror = function(msg, url, line) { console.log('Page Error:', msg); return true; };
    
    /* User JS */
    ${js}
  </script>
</body>
</html>`;

    const htmlPath = path.join(sessionDir, 'index.html');
    await fs.writeFile(htmlPath, fullHTML, 'utf8');

    // 1. التقاط الإطارات (Puppeteer)
    updateProgress(10, 'capturing', 'جاري التقاط الإطارات...');
    const { width, height } = RESOLUTIONS[resolution];

    await captureFrames({
      htmlPath,
      sessionDir,
      width,
      height,
      duration,
      fps,
      jobId,
      onProgress: (percent) => {
        // توزيع النسبة: الالتقاط يأخذ من 10% إلى 80%
        const adjustedProgress = 10 + (percent * 0.7);
        updateProgress(Math.round(adjustedProgress), 'capturing', `التقاط الإطارات: ${percent}%`);
      }
    });

    // 2. تحويل إلى فيديو (FFmpeg)
    updateProgress(80, 'encoding', 'جاري معالجة الفيديو النهائي...');
    
    const outputPath = await createVideo({
      framesDir: sessionDir,
      outputDir: process.env.OUTPUT_DIR || './output',
      format,
      fps,
      width,
      height,
      duration,
      jobId,
      onProgress: (percent) => {
        // توزيع النسبة: التحويل يأخذ من 80% إلى 98%
        const adjustedProgress = 80 + (percent * 0.18);
        updateProgress(Math.round(adjustedProgress), 'encoding', `المعالجة النهائية: ${percent}%`);
      }
    });

    // 3. اكتمال المهمة
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileName = path.basename(outputPath);
    let fileSize = 0;
    try { fileSize = (await fs.stat(outputPath)).size; } catch(e) {}

    const resultData = {
      success: true,
      downloadUrl: `/output/${fileName}`,
      fileName,
      processingTime: `${processingTime}s`,
      resolution: RESOLUTIONS[resolution].name,
      format,
      fileSize
    };

    logger.info(`[${jobId}] ✅ تم بنجاح في ${processingTime}s`);
    updateProgress(100, 'complete', 'تم الانتهاء بنجاح!', resultData);

    // تنظيف الملفات المؤقتة بعد وقت قصير (المجلد temp)
    setTimeout(async () => {
      try {
        await fs.rm(sessionDir, { recursive: true, force: true });
      } catch (e) { logger.error(`Error cleaning temp: ${e.message}`); }
    }, 10000); // 10 ثواني بعد الانتهاء

    // تنظيف المهمة من الذاكرة بعد دقيقتين
    setTimeout(() => {
      if (jobs.has(jobId)) jobs.delete(jobId);
    }, 120000);

  } catch (error) {
    logger.error(`[${jobId}] فشل المهمة: ${error.message}`);
    updateProgress(0, 'error', `حدث خطأ: ${error.message}`);
    
    // تنظيف في حال الخطأ
    try {
      await fs.rm(sessionDir, { recursive: true, force: true });
    } catch {}
  }
});

module.exports = router;
