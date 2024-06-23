const { sql, poolPromise } = require('../config/db');
const express = require('express');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js'); // Import crypto-js for encryption
const router = express.Router();

// Encryption functions
const encrypt = (text) => {
    return CryptoJS.AES.encrypt(text, 'SmartAudit2024').toString();
};

router.post('/', async (req, res, next) => {
    const { username, password } = req.body;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('username', sql.VarChar, username.toLowerCase())
            .query(`
                SELECT e.*, pl.[level]
                FROM emp e
                LEFT JOIN pos_level pl ON pl.POS = e.POS
                WHERE LOWER(e.USERN) = @username
            `);

        const rows = result.recordset;

        if (rows.length > 0) {
            const user = rows[0];
            if (password && password.length >= 8) {
                const token = jwt.sign({ username: user.USERN }, 'your_secret_key', { expiresIn: '1h' });

                // Encrypting the level
                const encryptedLevel = encrypt(user.level.toString());

                // Return encrypted level along with other user data and token
                res.json({ success: true, user: { ...user, level: encryptedLevel, token } });
            } else {
                res.status(401).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง' });
            }
        } else {
            res.status(401).json({ success: false, message: 'ชื่อผู้ใช้งานไม่ถูกต้องหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง' });
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
