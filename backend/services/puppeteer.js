const puppeteer = require('puppeteer');
const path = require('path');

// تعريف Logger بسيط في حال لم يكن معرفاً لتجنب الأخطاء
const logger = global.logger || console;

// دالة بديلة لـ waitForTimeout لأنها ملغاة في النسخ الحديثة
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function captureFrames({ htmlPath, sessionDir, width, height, duration, fps, jobId, onProgress }) {
  const totalFrames = duration * fps;
  const frameInterval = 1000 / fps;

  let browser;

  try {
    logger.info(`[${jobId}] تشغيل متصفح Chromium...`);

    browser = await puppeteer.launch({
      headless: 'new', // استخدام الوضع الجديد
      // الأولوية لمتغير البيئة من Docker، ثم المسار الافتراضي في Linux
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage', // مهم جداً لتجنب امتلاء الذاكرة المشتركة في Docker
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--disable-web-security',
        '--font-render-hinting=none', // تحسين دقة الخطوط
        '--disable-font-subpixel-positioning',
        '--no-first-run',
        '--no-zygote',
        '--window-size=' + width + ',' + height
      ],
      defaultViewport: {
        width,
        height,
        deviceScaleFactor: 1
      }
    });

    const page = await browser.newPage();

    await page.setViewport({ 
      width, 
      height,
      deviceScaleFactor: 1
    });

    // --- بداية حقن سكربت التحكم بالوقت (كما هو) ---
    await page.evaluateOnNewDocument((frameIntervalMs) => {
      window.__virtualTime = 0;
      window.__timers = [];
      window.__timerIdCounter = 1;
      window.__rafCallbacks = [];
      window.__rafIdCounter = 1;

      const originalSetTimeout = window.setTimeout;
      const originalSetInterval = window.setInterval;
      const originalClearTimeout = window.clearTimeout;
      const originalClearInterval = window.clearInterval;
      const originalDateNow = Date.now;
      const originalPerfNow = performance.now.bind(performance);
      const originalRAF = window.requestAnimationFrame;
      const originalCAF = window.cancelAnimationFrame;

      Date.now = function() { return window.__virtualTime; };
      performance.now = function() { return window.__virtualTime; };

      window.setTimeout = function(callback, delay = 0, ...args) {
        const id = window.__timerIdCounter++;
        const executeAt = window.__virtualTime + delay;
        window.__timers.push({ id, callback, args, executeAt, type: 'timeout' });
        return id;
      };

      window.setInterval = function(callback, delay = 0, ...args) {
        const id = window.__timerIdCounter++;
        const executeAt = window.__virtualTime + delay;
        window.__timers.push({ id, callback, args, executeAt, delay, type: 'interval' });
        return id;
      };

      window.clearTimeout = function(id) { window.__timers = window.__timers.filter(t => t.id !== id); };
      window.clearInterval = function(id) { window.__timers = window.__timers.filter(t => t.id !== id); };

      window.requestAnimationFrame = function(callback) {
        const id = window.__rafIdCounter++;
        window.__rafCallbacks.push({ id, callback });
        return id;
      };

      window.cancelAnimationFrame = function(id) { window.__rafCallbacks = window.__rafCallbacks.filter(r => r.id !== id); };

      window.__advanceTime = function(newTime) {
        const oldTime = window.__virtualTime;
        window.__virtualTime = newTime;

        const rafCallbacks = [...window.__rafCallbacks];
        window.__rafCallbacks = [];
        rafCallbacks.forEach(({ callback }) => {
          try { callback(window.__virtualTime); } catch (e) { console.error('RAF callback error:', e); }
        });

        const timersToExecute = window.__timers.filter(t => t.executeAt <= newTime);
        window.__timers = window.__timers.filter(t => t.executeAt > newTime);

        timersToExecute.forEach(timer => {
          if (timer.type === 'interval') {
            window.__timers.push({ ...timer, executeAt: timer.executeAt + timer.delay });
          }
        });

        timersToExecute.sort((a, b) => a.executeAt - b.executeAt);

        timersToExecute.forEach(timer => {
          try { timer.callback(...timer.args); } catch (e) { console.error('Timer callback error:', e); }
        });

        document.querySelectorAll('*').forEach(el => {
          const computed = getComputedStyle(el);
          if (computed.animationName && computed.animationName !== 'none') {
            el.style.animationDelay = `-${newTime}ms`;
            el.style.animationPlayState = 'paused';
          }
        });

        document.getAnimations().forEach(animation => {
          animation.currentTime = newTime;
        });
      };
    }, frameInterval);
    // --- نهاية حقن السكربت ---

    // تحميل الصفحة
    await page.goto(`file://${htmlPath}`, { 
      waitUntil: ['load', 'networkidle0'],
      timeout: 60000 // زيادة المهلة إلى 60 ثانية للأمان
    });

    // انتظار تحميل الخطوط
    logger.info(`[${jobId}] انتظار تحميل الخطوط...`);
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => resolve());
        } else {
          resolve();
        }
      });
    });

    // استخدام sleep بدلاً من waitForTimeout
    await sleep(1000); // زيادة وقت الانتظار قليلاً لضمان استقرار العناصر

    // تشغيل الإطار الأول
    await page.evaluate(() => {
      window.__advanceTime(0);
    });

    logger.info(`[${jobId}] بدء التقاط ${totalFrames} إطار...`);

    for (let i = 0; i < totalFrames; i++) {
      const framePath = path.join(sessionDir, `frame_${String(i).padStart(5, '0')}.jpg`);
      const currentTime = i * frameInterval;

      await page.evaluate((time) => {
        window.__advanceTime(time);
      }, currentTime);

      // انتظار قصير جداً لتحديث الـ Paint
      await sleep(10); 

      await page.screenshot({
        path: framePath,
        type: 'jpeg',
        quality: 95, // تقليل الجودة قليلاً (95) لتسريع المعالجة وتوفير المساحة
        omitBackground: false,
        captureBeyondViewport: false
      });

      const progress = Math.round((i / totalFrames) * 100);
      if (onProgress && i % Math.ceil(fps / 2) === 0) {
        onProgress(progress);
      }

      if (i % fps === 0) {
        logger.info(`[${jobId}] التقاط: ${progress}%`);
      }
    }

    await browser.close();
    logger.info(`[${jobId}] ✅ اكتمل التقاط ${totalFrames} إطار`);

    if (onProgress) onProgress(100);

    return sessionDir;

  } catch (error) {
    logger.error(`[${jobId}] خطأ في Puppeteer:`, error);
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    throw new Error(`فشل التقاط الإطارات: ${error.message}`);
  }
}

module.exports = { captureFrames };
