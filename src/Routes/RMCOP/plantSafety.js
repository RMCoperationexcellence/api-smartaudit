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
        lsrg.life_saving_rule_group_id,
        lsrg.life_saving_rule_group_title,
            CASE 
                WHEN lsr.is_defect = 1 THEN 'ตรวจแล้ว-ผิดปกติ'
                WHEN lsr.is_defect = 0 AND lsr.life_saving_rule_group_no IS NOT NULL THEN 'ตรวจแล้ว-ปกติ'
                ELSE 'ไม่มีข้อมูล'
            END AS 'data-result',
            lsr.create_date,
            lsr.create_user
        FROM life_saving_rule_group lsrg
        LEFT JOIN life_saving_rule lsr ON lsr.life_saving_rule_group_no = lsrg.life_saving_rule_group_id
            AND DATE(lsr.create_date) = CURDATE()
        LEFT JOIN 
            factory f ON f.factory_id = lsr.factory_id
            AND f.plant_no = ?
        `;

        const [rows] = await pool.query(sql, [plant_no]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        next(error);
    }
});

module.exports = router;
