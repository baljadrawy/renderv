const puppeteer = require('puppeteer');
const path = require('path');

async function captureFrames({ htmlPath, sessionDir, width, height, duration, fps, jobId }) {
  const totalFrames = duration * fps;
  const frameInterval = 1000 / fps;
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.CHROMIUM_PATH || '/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security',
        '--window-size=' + width + ',' + height
      ],
      defaultViewport: {
        width,
        height
      }
    });

    const page = await browser.newPage();
    
    await page.setViewport({ 
      width, 
      height,
      deviceScaleFactor: 1
    });

    // تحميل الصفحة
    await page.goto(`file://${htmlPath}`, { 
      waitUntil: ['load', 'networkidle0'],
      timeout: 30000
    });

    // انتظار تحميل كامل
    await page.waitForTimeout(500);

    // حقن سكربت التحكم بالوقت
    await page.evaluate(() => {
      // إيقاف جميع الأنيميشن CSS
      const style = document.createElement('style');
      style.id = 'animation-control';
      style.textContent = `
        *, *::before, *::after {
          animation-play-state: paused !important;
          transition: none !important;
        }
      `;
      document.head.appendChild(style);

      // حفظ الوقت الافتراضي
      window.__animationTime = 0;
      
      // إنشاء دالة لتحديث وقت الأنيميشن
      window.__setAnimationTime = function(timeMs) {
        window.__animationTime = timeMs;
        
        // تحديث CSS animations
        document.querySelectorAll('*').forEach(el => {
          const computed = getComputedStyle(el);
          if (computed.animationName && computed.animationName !== 'none') {
            el.style.animationDelay = `-${timeMs}ms`;
          }
        });
        
        // تحديث Web Animations API
        document.getAnimations().forEach(animation => {
          animation.currentTime = timeMs;
        });
      };
    });

    logger.info(`[${jobId}] بدء التقاط ${totalFrames} إطار...`);

    // التقاط الإطارات
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(sessionDir, `frame_${String(i).padStart(5, '0')}.png`);
      const currentTime = i * frameInterval;
      
      // تعيين وقت الأنيميشن للإطار الحالي
      await page.evaluate((time) => {
        window.__setAnimationTime(time);
      }, currentTime);
      
      // انتظار قصير للسماح بتحديث الرسم
      await page.waitForTimeout(10);
      
      await page.screenshot({
        path: framePath,
        type: 'png',
        omitBackground: false,
        captureBeyondViewport: false
      });

      // Log التقدم كل ثانية
      if (i % fps === 0) {
        const progress = Math.round((i / totalFrames) * 100);
        logger.info(`[${jobId}] التقاط: ${progress}%`);
      }
    }

    await browser.close();
    logger.info(`[${jobId}] ✅ اكتمل التقاط ${totalFrames} إطار`);
    
    return sessionDir;

  } catch (error) {
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    throw new Error(`فشل التقاط الإطارات: ${error.message}`);
  }
}

module.exports = { captureFrames };
