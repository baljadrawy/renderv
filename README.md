# 🎬 محول كود الويب إلى فيديو

تطبيق ويب متقدم لتحويل أكواد HTML/CSS/JavaScript إلى فيديوهات عالية الجودة (MP4/GIF)

## ✨ المميزات

### الواجهة الأمامية
- ✅ **محرر كود متقدم** مع تبويبات لـ HTML/CSS/JavaScript
- 👁️ **معاينة مباشرة** في الوقت الفعلي
- 📦 **قوالب جاهزة** للأنيميشن (تدرج، جزيئات، نص، أشكال)
- 💾 **حفظ تلقائي** في المتصفح
- ⌨️ **اختصارات لوحة مفاتيح** (Ctrl+S للحفظ، Ctrl+Enter للتحويل)
- 📱 **تصميم متجاوب** يعمل على جميع الأجهزة
- 🎨 **واجهة عصرية** بتصميم Dark Mode

### خيارات الإخراج
- **الدقة:**
  - 📱 ريلز/تيك توك (1080×1920)
  - ⬜ مربع (1080×1080)
  - 🖥️ أفقي (1920×1080)
- **التنسيق:** MP4 أو GIF
- **المدة:** 1-60 ثانية
- **FPS:** 24/30/60 إطار في الثانية

### الخادم الخلفي
- 🚀 **معالجة قوية** باستخدام Puppeteer + FFmpeg
- ⚡ **سرعة عالية** مع جودة ممتازة
- 🔒 **حماية** بنظام Token بسيط
- 📊 **تتبع التقدم** في الوقت الفعلي
- 🗑️ **تنظيف تلقائي** للملفات المؤقتة
- 📝 **سجلات** مفصلة لكل عملية

## 📦 المتطلبات

### البرمجيات المطلوبة
```bash
- Node.js (v18+)
- FFmpeg
- Google Chrome/Chromium
- PM2 (للإنتاج)
```

### مواصفات الخادم المقترحة
```
- CPU: 2+ vCPUs
- RAM: 4GB+
- Storage: 50GB+ SSD
- OS: Ubuntu 22.04 أو أحدث
```

## 🚀 التثبيت

### 1. تثبيت المتطلبات

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# تثبيت FFmpeg
sudo apt install -y ffmpeg

# تثبيت Chrome
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google.list
sudo apt update
sudo apt install -y google-chrome-stable

# تثبيت PM2
sudo npm install -g pm2
```

### 2. تنزيل المشروع

```bash
# استنساخ المشروع
git clone https://github.com/yourusername/web-to-video-converter.git
cd web-to-video-converter

# تثبيت Dependencies
npm install
```

### 3. التكوين

```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل الإعدادات
nano .env
```

محتوى `.env`:
```bash
# Server
PORT=3000
NODE_ENV=production

# Security (غيّر هذا!)
AUTH_TOKEN=your-secret-token-here-change-this-12345

# Paths
TEMP_DIR=/home/appuser/temp
OUTPUT_DIR=/home/appuser/output
LOG_DIR=/home/appuser/logs

# FFmpeg
FFMPEG_PATH=/usr/bin/ffmpeg

# Limits
MAX_DURATION=60
MAX_FPS=60
CLEANUP_INTERVAL=3600000
```

### 4. إنشاء المجلدات

```bash
mkdir -p temp output logs
chmod 755 temp output logs
```

### 5. التشغيل

**للتطوير:**
```bash
npm run dev
```

**للإنتاج:**
```bash
npm start
# أو
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🌐 إعداد Nginx (اختياري)

```bash
# تثبيت Nginx
sudo apt install -y nginx

# إنشاء ملف التكوين
sudo nano /etc/nginx/sites-available/video-converter
```

محتوى الملف:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300s;
    }

    location /output/ {
        alias /home/appuser/output/;
        expires 7d;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/video-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔐 SSL (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📖 الاستخدام

### من الواجهة الأمامية

1. افتح المتصفح على `http://your-server-ip:3000`
2. اكتب أو الصق كود HTML/CSS/JavaScript
3. اختر الإعدادات (الدقة، التنسيق، المدة، FPS)
4. اضغط "تحويل إلى فيديو"
5. انتظر اكتمال المعالجة
6. حمّل الفيديو

### من API

```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token-here-change-this-12345" \
  -d '{
    "html": "<div style=\"text-align:center;padding:50px;\"><h1>Test</h1></div>",
    "css": "body { background: linear-gradient(45deg, #667eea, #764ba2); }",
    "js": "",
    "resolution": "Square",
    "format": "MP4",
    "duration": 5,
    "fps": 30
  }'
```

## 🎨 القوالب الجاهزة

### 1. تدرج متحرك
تدرج ألوان متحرك بشكل سلس

### 2. جزيئات
جزيئات متحركة مع خطوط تربطها

### 3. نص متحرك
نص بأنيميشن موجي

### 4. أشكال
أشكال عضوية متحركة ومتغيرة

## ⌨️ اختصارات لوحة المفاتيح

- **Ctrl + S** - حفظ الكود
- **Ctrl + Enter** - بدء التحويل
- **Tab** - التنقل بين الحقول

## 🛠️ إدارة النظام

### مراقبة PM2
```bash
pm2 monit
pm2 logs video-converter
pm2 status
```

### إعادة التشغيل
```bash
pm2 restart video-converter
```

### تحديث التطبيق
```bash
git pull
npm install
pm2 restart video-converter
```

### التنظيف اليدوي
```bash
# حذف ملفات مؤقتة أقدم من يوم
find temp -mtime +1 -delete

# حذف فيديوهات أقدم من 7 أيام
find output -mtime +7 -delete
```

## 📊 المراقبة والسجلات

### عرض السجلات
```bash
# سجلات PM2
pm2 logs video-converter

# سجلات التطبيق
tail -f logs/combined.log
tail -f logs/error.log
```

### التحقق من الأداء
```bash
# استخدام CPU والذاكرة
htop

# المساحة المتاحة
df -h

# حجم المجلدات
du -sh temp output
```

## 🐛 حل المشاكل

### المشكلة: Puppeteer لا يعمل
```bash
# تثبيت Dependencies المفقودة
sudo apt install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### المشكلة: نفاد المساحة
```bash
# تنظيف شامل
rm -rf temp/*
rm -rf output/*
```

### المشكلة: بطء الأداء
- زيادة موارد الخادم (CPU/RAM)
- تقليل FPS أو الدقة
- استخدام preset أسرع في FFmpeg (medium بدلاً من slow)

## 📝 ملاحظات

- **الأمان**: غيّر AUTH_TOKEN في `.env` فوراً!
- **الحد الأقصى**: مدة 60 ثانية افتراضياً (قابل للتعديل)
- **التخزين**: الملفات تُحذف تلقائياً بعد 24 ساعة
- **الاستخدام الشخصي**: هذا المشروع مُحسّن للاستخدام الشخصي

## 🤝 المساهمة

المساهمات مرحب بها! افتح Issue أو Pull Request.

## 📄 الترخيص

MIT License

## 👨‍💻 المطور

صُمم وطُور بـ ❤️ للاستخدام الشخصي

---

## 🎯 الخطوات القادمة

- [ ] إضافة دعم الصوت
- [ ] تحسين الأداء
- [ ] إضافة قوالب أكثر
- [ ] دعم الترجمة
- [ ] API أكثر تقدماً

---

**معاينة الواجهة:** افتح `demo.html` في المتصفح لمعاينة الواجهة بدون خادم!
