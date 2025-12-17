const fs = require('fs');
const path = require('path');
const glob = require('glob');

// الإعدادات
const TEMP_DIR = process.env.TEMP_DIR || './temp';
const OUTPUT_DIR = process.env.OUTPUT_DIR || './output';
const MAX_AGE_MS = 60 * 60 * 1000; // حذف الملفات الأقدم من ساعة
const CHECK_INTERVAL = 30 * 60 * 1000; // التحقق كل 30 دقيقة

function cleanDirectory(directory) {
  glob(path.join(directory, '*'), (err, files) => {
    if (err) {
      if (global.logger) global.logger.error(`Cleanup glob error: ${err.message}`);
      return;
    }

    const now = Date.now();
    files.forEach(file => {
      fs.stat(file, (err, stats) => {
        if (err) return;

        if (now - stats.mtime.getTime() > MAX_AGE_MS) {
          // إذا كان مجلداً (مثل مجلدات الجلسات في temp)
          if (stats.isDirectory()) {
            fs.rm(file, { recursive: true, force: true }, (err) => {
              if (!err && global.logger) global.logger.info(`Deleted old dir: ${file}`);
            });
          } 
          // إذا كان ملفاً (مثل الفيديوهات في output)
          else {
            fs.unlink(file, (err) => {
              if (!err && global.logger) global.logger.info(`Deleted old file: ${file}`);
            });
          }
        }
      });
    });
  });
}

function scheduleCleanup() {
  if (global.logger) global.logger.info('🧹 Cleanup scheduler started');
  
  // تنظيف أولي عند التشغيل
  cleanDirectory(TEMP_DIR);
  cleanDirectory(OUTPUT_DIR);

  // جدولة التنظيف الدوري
  setInterval(() => {
    cleanDirectory(TEMP_DIR);
    cleanDirectory(OUTPUT_DIR);
  }, CHECK_INTERVAL);
}

module.exports = { scheduleCleanup };
