require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const rateLimit = require('express-rate-limit');

// استدعاء المسارات
const renderRouter = require('./routes/render');
// تأكد من وجود ملف projects.js أو قم بتعليق هذا السطر مؤقتاً
const projectsRouter = require('./routes/projects'); 
const { scheduleCleanup } = require('./utils/cleanup');

const app = express();
const PORT = process.env.PORT || 5000;

// إعداد Trust Proxy (ضروري لـ Render و Rate Limiting)
app.set('trust proxy', 1);

// إعداد Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
    // في Docker، الكتابة للملفات قد لا تكون مفيدة لأنها تختفي عند إعادة التشغيل
    // الـ Console هو الأهم في Render
  ]
});

global.logger = logger;

// إنشاء المجلدات الضرورية
const dirs = [
  process.env.TEMP_DIR || './temp',
  process.env.OUTPUT_DIR || './output',
  process.env.LOG_DIR || './logs'
];

dirs.forEach(dir => {
  const absolutePath = path.resolve(dir); // تحويل لمسار مطلق للأمان
  if (!fs.existsSync(absolutePath)) {
    fs.mkdirSync(absolutePath, { recursive: true });
    logger.info(`Created directory: ${absolutePath}`);
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // تعطيل CSP مؤقتاً لتشغيل السكربتات المضمنة
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGIN || '*'
    : '*'
}));

app.use(express.json({ limit: '50mb' })); // زيادة الحد لاستقبال صور Base64 إن لزم

// تقديم ملفات الواجهة الأمامية (Frontend)
// التعديل: استخدام path.join لضمان المسار الصحيح داخل Docker
app.use(express.static(path.join(__dirname, '../frontend')));

// تقديم ملفات الفيديو الناتجة
app.use('/output', express.static(path.resolve(process.env.OUTPUT_DIR || './output')));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.RATE_LIMIT || 50, // رفع الحد قليلاً للتجربة
  message: { success: false, error: 'تجاوزت حد الطلبات المسموح به' }
});

app.use('/api/', limiter);

// Routes
app.use('/api/render', renderRouter);
app.use('/api/projects', projectsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime() });
});

// توجيه أي طلب آخر للصفحة الرئيسية (SPA Fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack });
  res.status(500).json({ 
    success: false, 
    error: 'حدث خطأ في الخادم' 
  });
});

// تشغيل السيرفر
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // تشغيل التنظيف التلقائي
  scheduleCleanup();
});
