// userExam.js

const createMySQLPool = require('../../config/dbRMCOP');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        console.log('Received request to fetch users.');
        const { plant_no } = req.query;
        const pool = await createMySQLPool();

        const sql = `
        SELECT
        e.environment_id,
        e.environment_title,
        CASE 
            WHEN ec.is_defect = 1 THEN 'ตรวจแล้ว-ผิดปกติ'
            WHEN ec.is_defect = 0 AND ec.environment_no IS NOT NULL THEN 'ตรวจแล้ว-ปกติ'
            ELSE 'ไม่มีผลตรวจ'
        END AS 'data-result',
        ec.create_date,
        ec.create_user
    FROM 
        environment e
    LEFT JOIN 
        environment_check ec ON ec.environment_no = e.environment_id
        AND DATE(ec.create_date) = CURDATE()
    LEFT JOIN 
        factory f ON f.factory_id = ec.factory_id
WHERE f.plant_no = ?
        `;

        const [rows] = await pool.query(sql, [plant_no]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        next(error);
    }
});

module.exports = router;
