const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs').promises;

// تعريف Logger لتجنب الأخطاء
const logger = global.logger || console;

// تحديد مسار FFmpeg بناءً على البيئة أو الافتراضي
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

/**
 * دالة إنشاء الفيديو من الصور
 * ملاحظة: يجب تمرير duration لحساب شريط التقدم بدقة
 */
function createVideo({ framesDir, outputDir, format, fps, width, height, duration, jobId, onProgress }) {
  return new Promise(async (resolve, reject) => {
    
    // تأكد من وجود مجلد الإخراج
    await fs.mkdir(outputDir, { recursive: true });

    const outputFileName = `video_${jobId}_${Date.now()}.${format.toLowerCase()}`;
    const outputPath = path.join(outputDir, outputFileName);
    const inputPattern = path.join(framesDir, 'frame_%05d.jpg');

    // حساب إجمالي الإطارات المتوقعة لضبط شريط التقدم
    const totalFrames = duration * fps;

    const command = ffmpeg();

    // إعداد المدخلات
    command
      .input(inputPattern)
      .inputFPS(fps); // تحديد FPS للمدخلات ضروري لضبط الزمن

    // إعدادات المخرجات حسب الصيغة
    if (format === 'MP4') {
      command
        .videoCodec('libx264')
        .outputOptions([
          '-preset fast',          // توازن جيد بين السرعة والجودة لسيرفرات Render
          '-crf 23',               // القيمة 23 هي المعيارية للجودة العالية (أقل حجماً وأسرع من 16)
          '-pix_fmt yuv420p',      // ضروري جداً لتشغيل الفيديو على QuickTime و Windows و Android
          '-movflags +faststart',  // يسمح بتشغيل الفيديو أثناء التحميل (Web Optimized)
          '-tune animation'        // تحسين الضغط للرسوم المتحركة (ممتاز لتطبيقك)
        ])
        // فلتر لضمان أن الأبعاد زوجية (مطلب تقني لـ H.264)
        .videoFilters([
           `scale=${width}:${height}:force_original_aspect_ratio=decrease`,
           'pad=ceil(iw/2)*2:ceil(ih/2)*2'
        ]);

    } else if (format === 'GIF') {
      command
        .complexFilter([
          // تقليل الألوان وتحسينها للـ GIF
          `fps=${fps},scale=${width}:${height}:flags=lanczos,split[s0][s1]`,
          '[s0]palettegen=stats_mode=diff[p]',
          '[s1][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle'
        ]);
    }

    // التنفيذ
    command
      .output(outputPath)
      .on('start', (cmdLine) => {
        logger.info(`[${jobId}] بدء FFmpeg`);
      })
      .on('progress', (progress) => {
        // حساب النسبة يدوياً لأن progress.percent قد يكون غير دقيق مع الصور
        let percent = 0;
        
        if (progress.frames && totalFrames > 0) {
          percent = Math.round((progress.frames / totalFrames) * 100);
        } else if (progress.percent) {
          percent = Math.round(progress.percent);
        }

        // التأكد من أن النسبة منطقية (لا تتجاوز 99 قبل الانتهاء)
        percent = Math.min(Math.max(percent, 0), 99);

        if (onProgress) {
          onProgress(percent);
        }
        
        // تسجيل التقدم كل 20% لتقليل الضجيج في السجلات
        if (percent % 20 === 0 && percent > 0) {
          logger.info(`[${jobId}] معالجة الفيديو: ${percent}%`);
        }
      })
      .on('end', () => {
        logger.info(`[${jobId}] ✅ تم إنشاء الفيديو: ${outputFileName}`);
        if (onProgress) onProgress(100);
        resolve(outputPath);
      })
      .on('error', (err) => {
        logger.error(`[${jobId}] خطأ في FFmpeg: ${err.message}`);
        reject(new Error(`فشل تحويل الفيديو: ${err.message}`));
      })
      .run();
  });
}

module.exports = { createVideo };
