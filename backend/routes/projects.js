const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// استخدام Logger العام المعرف في server.js
const logger = global.logger || console;

// إعداد الاتصال بقاعدة البيانات مع دعم SSL لـ Render
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// اختبار الاتصال عند البدء
pool.connect((err, client, release) => {
    if (err) {
        logger.error('Error acquiring client', err.stack);
    } else {
        logger.info('✅ Database connected successfully');
        release();
    }
});

// --- API Endpoints ---

// 1. جلب قائمة المشاريع
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, name, resolution, format, duration, fps, created_at, updated_at FROM projects ORDER BY updated_at DESC'
        );
        res.json({ success: true, projects: result.rows });
    } catch (error) {
        logger.error('Error fetching projects:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المشاريع' });
    }
});

// 2. جلب مشروع محدد
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المشروع غير موجود' });
        }

        res.json({ success: true, project: result.rows[0] });
    } catch (error) {
        logger.error('Error fetching project:', error);
        res.status(500).json({ success: false, error: 'فشل في جلب المشروع' });
    }
});

// 3. حفظ مشروع جديد
router.post('/', async (req, res) => {
    try {
        const { name, html_code, css_code, js_code, resolution, format, duration, fps } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'اسم المشروع مطلوب' });
        }

        const result = await pool.query(
            `INSERT INTO projects (name, html_code, css_code, js_code, resolution, format, duration, fps)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, name, created_at`,
            [name, html_code || '', css_code || '', js_code || '', resolution || 'HD_Vertical', format || 'MP4', duration || 15, fps || 30]
        );

        logger.info(`Project saved: ${result.rows[0].id} - ${name}`);
        res.json({ success: true, project: result.rows[0], message: 'تم حفظ المشروع بنجاح' });
    } catch (error) {
        logger.error('Error saving project:', error);
        res.status(500).json({ success: false, error: 'فشل في حفظ المشروع' });
    }
});

// 4. تحديث مشروع موجود
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, html_code, css_code, js_code, resolution, format, duration, fps } = req.body;

        const result = await pool.query(
            `UPDATE projects 
             SET name = $1, html_code = $2, css_code = $3, js_code = $4, 
                 resolution = $5, format = $6, duration = $7, fps = $8, updated_at = CURRENT_TIMESTAMP
             WHERE id = $9
             RETURNING id, name, updated_at`,
            [name, html_code, css_code, js_code, resolution, format, duration, fps, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المشروع غير موجود' });
        }

        logger.info(`Project updated: ${id} - ${name}`);
        res.json({ success: true, project: result.rows[0], message: 'تم تحديث المشروع بنجاح' });
    } catch (error) {
        logger.error('Error updating project:', error);
        res.status(500).json({ success: false, error: 'فشل في تحديث المشروع' });
    }
});

// 5. حذف مشروع
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id, name', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'المشروع غير موجود' });
        }

        logger.info(`Project deleted: ${id}`);
        res.json({ success: true, message: 'تم حذف المشروع بنجاح' });
    } catch (error) {
        logger.error('Error deleting project:', error);
        res.status(500).json({ success: false, error: 'فشل في حذف المشروع' });
    }
});

module.exports = router;
