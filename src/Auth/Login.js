const { sql, poolPromise } = require('../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();

router.post('/', async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.VarChar, username.toLowerCase())
            .query('SELECT * FROM emp WHERE LOWER(USERN) = @username');

        const rows = result.recordset;

        if (rows.length > 0) {
            if (password && password.length >= 8) {
                res.json({ success: true, token: "YourSecretTokenHere" });
            } else {
                res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง' });
            }
        } else {
            res.status(401).json({ success: false, message: 'ไม่พบชื่อผู้ใช้นี้อยู่ในระบบ' });
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
