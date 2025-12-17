# استخدام نسخة Node.js خفيفة مبنية على Debian
FROM node:20-slim

# تحديث النظام وتثبيت المتطلبات الضرورية (FFmpeg, Chromium, Fonts)
# fonts-noto ضروري جداً لدعم اللغة العربية في الفيديو
RUN apt-get update && apt-get install -y \
    ffmpeg \
    chromium \
    fonts-noto \
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# تحديد مجلد العمل
WORKDIR /app

# نسخ ملفات تعريف الحزم وتثبيتها
COPY package*.json ./
RUN npm install

# نسخ باقي ملفات المشروع
COPY . .

# إنشاء المجلدات الضرورية يدوياً لضمان وجودها
RUN mkdir -p temp output logs

# إعداد متغيرات البيئة الخاصة بـ Puppeteer لاستخدام كروم المثبت في النظام
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# فتح المنفذ
EXPOSE 5000

# أمر التشغيل
CMD ["node", "backend/server.js"]

