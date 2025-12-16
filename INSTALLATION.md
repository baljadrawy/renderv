# 📦 دليل التثبيت الكامل - Frontend + Backend

دليل شامل لتثبيت وتشغيل المشروع كاملاً 🚀

---

## 📋 المتطلبات الأساسية

### 1. Node.js (v18+)
```bash
# تحقق من النسخة
node --version
npm --version

# التثبيت على Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs

# على macOS
brew install node

# على Windows
# حمّل من: https://nodejs.org
```

### 2. FFmpeg
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ffmpeg

# macOS
brew install ffmpeg

# Windows
# حمّل من: https://ffmpeg.org/download.html
# أضف المسار إلى PATH

# تحقق من التثبيت
ffmpeg -version
```

### 3. Google Chrome/Chromium (لـ Puppeteer)
```bash
# Ubuntu/Debian
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google.list
sudo apt update
sudo apt install -y google-chrome-stable

# macOS
brew install --cask google-chrome

# Windows
# حمّل من: https://www.google.com/chrome/
```

---

## 🚀 التثبيت السريع

### الخطوة 1: فك الضغط
```bash
unzip web-to-video-converter-FULL.zip
cd web-to-video-converter
```

### الخطوة 2: تثبيت Dependencies
```bash
npm install
```

**هذا سيثبت:**
- express
- puppeteer
- fluent-ffmpeg
- winston
- helmet
- cors
- uuid
- وغيرها...

### الخطوة 3: إعداد البيئة
```bash
# نسخ ملف البيئة
cp .env.example .env

# تعديل الإعدادات
nano .env
```

**محتوى .env:**
```env
# Server
PORT=3000
NODE_ENV=production

# Security (غيّر هذا!)
AUTH_TOKEN=your-secret-token-change-this

# Paths (سيتم إنشاؤها تلقائياً)
TEMP_DIR=./temp
OUTPUT_DIR=./output
LOG_DIR=./logs

# FFmpeg (اتركه فارغاً ليتم اكتشافه تلقائياً)
FFMPEG_PATH=

# Limits
MAX_DURATION=60
MAX_FPS=60
RATE_LIMIT=20
CLEANUP_INTERVAL=3600000
```

### الخطوة 4: التشغيل
```bash
# للتطوير (مع إعادة تشغيل تلقائية)
npm run dev

# للإنتاج
npm start

# أو باستخدام PM2 (موصى به للإنتاج)
npm run pm2
```

**✅ تم! افتح:** `http://localhost:3000`

---

## 🖥️ التثبيت على خادم سحابي

### تثبيت على Ubuntu Server

#### 1. تحديث النظام
```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. تثبيت Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs
```

#### 3. تثبيت FFmpeg
```bash
sudo apt install -y ffmpeg
```

#### 4. تثبيت Chrome
```bash
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google.list
sudo apt update
sudo apt install -y google-chrome-stable
```

#### 5. تثبيت PM2
```bash
sudo npm install -g pm2
```

#### 6. رفع المشروع
```bash
# باستخدام Git
git clone https://github.com/yourusername/web-to-video-converter.git
cd web-to-video-converter

# أو رفع الملفات يدوياً
# scp -r ./web-to-video-converter user@server:/home/user/
```

#### 7. إعداد المشروع
```bash
npm install
cp .env.example .env
nano .env  # عدّل الإعدادات
```

#### 8. تشغيل بـ PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 9. إعداد Nginx (اختياري)
```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/video-converter
```

**محتوى الملف:**
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
        proxy_read_timeout 300s;
    }

    location /output/ {
        alias /home/user/web-to-video-converter/output/;
        expires 7d;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/video-converter /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 10. SSL (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔧 استكشاف الأخطاء

### المشكلة: Puppeteer لا يعمل

**الحل: تثبيت dependencies المفقودة**
```bash
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

### المشكلة: FFmpeg لا يعمل

**الحل:**
```bash
# التحقق من التثبيت
ffmpeg -version

# إعادة التثبيت
sudo apt remove ffmpeg
sudo apt install -y ffmpeg
```

### المشكلة: خطأ في الصلاحيات

**الحل:**
```bash
# إعطاء الصلاحيات المناسبة
chmod -R 755 temp output logs
chown -R $USER:$USER temp output logs
```

### المشكلة: Port مشغول

**الحل:**
```bash
# تغيير Port في .env
PORT=3001

# أو إيقاف العملية التي تستخدم Port 3000
sudo lsof -i :3000
sudo kill -9 <PID>
```

---

## 📊 التحقق من التثبيت

### اختبار API
```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "html": "<h1>Test</h1>",
    "css": "h1 { color: red; }",
    "js": "",
    "resolution": "Square",
    "format": "MP4",
    "duration": 5,
    "fps": 30
  }'
```

### اختبار Health Check
```bash
curl http://localhost:3000/health
```

**الاستجابة المتوقعة:**
```json
{
  "status": "OK",
  "uptime": 123.456,
  "timestamp": "2024-12-16T08:00:00.000Z"
}
```

---

## 🛠️ أوامر PM2 المفيدة

```bash
# عرض الحالة
pm2 status

# عرض السجلات
pm2 logs web-to-video-converter

# إعادة التشغيل
pm2 restart web-to-video-converter

# إيقاف
pm2 stop web-to-video-converter

# حذف
pm2 delete web-to-video-converter

# مراقبة الأداء
pm2 monit
```

---

## 📁 هيكل المجلدات

```
web-to-video-converter/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   └── render.js
│   ├── services/
│   │   ├── puppeteer.js
│   │   └── ffmpeg.js
│   ├── middleware/
│   │   └── auth.js
│   └── utils/
│       └── cleanup.js
├── frontend/
│   ├── index.html
│   ├── demo.html
│   ├── css/
│   └── js/
├── temp/              (يتم إنشاؤه تلقائياً)
├── output/            (يتم إنشاؤه تلقائياً)
├── logs/              (يتم إنشاؤه تلقائياً)
├── .env
├── .env.example
├── .gitignore
├── package.json
├── ecosystem.config.js
└── README.md
```

---

## 🔒 الأمان

### نصائح مهمة:
1. **غيّر AUTH_TOKEN** في `.env` فوراً
2. لا ترفع ملف `.env` على GitHub
3. استخدم HTTPS في الإنتاج
4. فعّل firewall على الخادم
5. حدّث Dependencies بانتظام

---

## 🎯 الاستخدام

### واجهة المستخدم
```
افتح: http://localhost:3000
أو: http://your-domain.com
```

### API
```bash
curl -X POST http://localhost:3000/api/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d @payload.json
```

---

## 📈 المراقبة

### عرض السجلات
```bash
# سجلات PM2
pm2 logs web-to-video-converter

# سجلات التطبيق
tail -f logs/combined.log
tail -f logs/error.log
```

### مراقبة الأداء
```bash
# استخدام الموارد
pm2 monit

# حالة النظام
htop
df -h
```

---

## 🔄 التحديثات

### تحديث المشروع
```bash
git pull origin main
npm install
pm2 restart web-to-video-converter
```

### تحديث Dependencies
```bash
npm update
npm audit fix
```

---

## ✅ قائمة التحقق

قبل التشغيل في الإنتاج:

- [ ] Node.js مثبت (v18+)
- [ ] FFmpeg مثبت
- [ ] Chrome مثبت
- [ ] npm install اكتمل
- [ ] .env معدّل بشكل صحيح
- [ ] AUTH_TOKEN تم تغييره
- [ ] PM2 مثبت
- [ ] Nginx معدّ (اختياري)
- [ ] SSL مفعّل (موصى به)
- [ ] Firewall مفعّل
- [ ] النسخ الاحتياطي معدّ

---

**الآن أنت جاهز للانطلاق!** 🚀

للمساعدة: راجع README.md أو افتح Issue على GitHub
