// login.js from node.js
const { sql, poolPromise } = require('../config/db'); // Import the poolPromise correctly
const express = require('express');
const jwt = require('jsonwebtoken'); // Import JWT library
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
            const user = rows[0]; // Assume the first record is the user
            if (password && password.length >= 8) {
                // Generate a JWT token including the user's name
                res.json({ success: true, user }); // Return user data along with the token
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
