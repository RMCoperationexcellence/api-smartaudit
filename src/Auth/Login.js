const pool = require('../config/db');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res, next) => {
    
    const { username, password } = req.body;

    try {
        // ใช้ LOWER ทั้งในคำสั่ง SQL และการส่งค่าจาก client เพื่อไม่สนใจตัวพิมพ์ใหญ่หรือเล็ก
        const [rows] = await pool.query('SELECT * FROM emp WHERE LOWER(USERN) = LOWER(?)', [username]);

        // ถ้ามีผู้ใช้ในระบบ
        if (rows.length > 0) {
            if (password && password.length >= 8) {
                res.json({ success: true, token: "YourSecretTokenHere" });
            } else {
                res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง' });
            }
        } else {
            // ไม่พบชื่อผู้ใช้
            res.status(401).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้อยู่ในระบบ' });
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
