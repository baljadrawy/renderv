const puppeteer = require('puppeteer');
const path = require('path');

async function captureFrames({ htmlPath, sessionDir, width, height, duration, fps, jobId }) {
  const totalFrames = duration * fps;
  const frameInterval = 1000 / fps;
  
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
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
    await page.waitForTimeout(1000);

    logger.info(`[${jobId}] بدء التقاط ${totalFrames} إطار...`);

    // التقاط الإطارات
    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(sessionDir, `frame_${String(i).padStart(5, '0')}.png`);
      
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

      // انتظار دقيق بين الإطارات
      await page.waitForTimeout(frameInterval);
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
