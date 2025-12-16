const fs = require('fs').promises;
const path = require('path');

async function cleanupOldFiles() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 ساعة

  try {
    const tempDir = process.env.TEMP_DIR || './temp';
    const outputDir = process.env.OUTPUT_DIR || './output';
    
    // تنظيف temp
    try {
      const tempFiles = await fs.readdir(tempDir);
      for (const file of tempFiles) {
        const filePath = path.join(tempDir, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > maxAge) {
            await fs.rm(filePath, { recursive: true, force: true });
            logger.info(`🗑️  تم حذف ملف مؤقت: ${file}`);
          }
        } catch (err) {
          // تجاهل الأخطاء على ملفات فردية
        }
      }
    } catch (err) {
      logger.error(`خطأ في تنظيف temp: ${err.message}`);
    }

    // تنظيف output (اختياري - احذف الفيديوهات القديمة)
    const maxOutputAge = 7 * 24 * 60 * 60 * 1000; // 7 أيام
    
    try {
      const outputFiles = await fs.readdir(outputDir);
      
      for (const file of outputFiles) {
        const filePath = path.join(outputDir, file);
        try {
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtimeMs > maxOutputAge) {
            await fs.unlink(filePath);
            logger.info(`🗑️  تم حذف فيديو قديم: ${file}`);
          }
        } catch (err) {
          // تجاهل الأخطاء
        }
      }
    } catch (err) {
      logger.error(`خطأ في تنظيف output: ${err.message}`);
    }

    logger.info('✅ اكتمل التنظيف التلقائي');

  } catch (error) {
    logger.error(`خطأ عام في التنظيف: ${error.message}`);
  }
}

function scheduleCleanup() {
  const interval = parseInt(process.env.CLEANUP_INTERVAL) || 3600000; // ساعة واحدة افتراضياً
  
  // تشغيل فوري
  cleanupOldFiles();
  
  // جدولة دورية
  setInterval(cleanupOldFiles, interval);
  
  logger.info(`⏰ جدولة التنظيف كل ${interval / 1000 / 60} دقيقة`);
}

module.exports = { cleanupOldFiles, scheduleCleanup };
