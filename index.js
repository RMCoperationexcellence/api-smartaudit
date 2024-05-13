const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./src/config/db');  // Importing pool from db.js
const auditRoutes = require('./PostForm');
const auditFormRoutes = require('./src/Routes/AuditformGet');

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());



// สร้าง route สำหรับการ login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE USERNAME = ?', [username]);

        // ถ้ามีผู้ใช้ในระบบ
        if (rows.length > 0) {
            const user = rows[0];
            
            // เปรียบเทียบรหัสผ่าน
            if (user.PASSWORD === password) {
                // รหัสผ่านถูกต้อง
                res.json({ success: true, token: "YourSecretTokenHere" });
            } else {
                // รหัสผ่านไม่ถูกต้อง
                res.status(401).json({ success: false, message: 'Password is incorrect' });
            }
        } else {
            // ไม่พบชื่อผู้ใช้
            res.status(401).json({ success: false, message: 'Username is incorrect' });
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

app.get('/plantList', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM plant');
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

app.get('/auditType', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audit_type');
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

app.get('/AuditQuestion', async (req, res, next) => {
    try {
        // Get the audit_group from the query string
        const { audit_group } = req.query;

        // Check if the audit_group parameter is provided
        if (!audit_group) {
            res.status(400).json({ error: "Audit group parameter is required" });
            return;
        }

        // Execute the query with the audit_group parameter
        const [rows] = await pool.query(`
            SELECT *
            FROM audit_question
            WHERE AUDIT_GROUP_ID = ?
        `, [audit_group]);

        // Return the result as JSON
        res.json(rows);
    } catch (error) {
        // Forward errors to the error-handling middleware
        next(error);
    }
});

app.use('/auditResult', auditRoutes);
app.use('/auditForm', auditFormRoutes);


app.get('/getUserId', async (req, res) => {
    try {
        const { username } = req.user; // คำขอจะต้องมีข้อมูลผู้ใช้ที่ยืนยันแล้ว
        const result = await db.query('SELECT USER_ID FROM users WHERE USERNAME = ?', [username]);
        const userId = result[0].USER_ID;
        res.json({ userId });
    } catch (error) {
        console.error('Failed to get user ID:', error);
        res.status(500).json({ error: 'Failed to get user ID' });
    }
});

app.get('/AuditResultForm', async (req, res, next) => {
    try {
        const { audit_group_id, audit_type_id, audit_id, plant_no } = req.query;

        if (!audit_group_id || !audit_type_id || !audit_id || !plant_no) {
            res.status(400).json({ error: "Required parameters are missing" });
            return;
        }

        const [rows] = await pool.query(`
            SELECT
                AUDIT_GROUP_ID,
                AUDIT_TYPE_ID,
                AUDIT_ID,
                PLANT_NO,
                QUESTION_ID,
                CHOICE_NO
            FROM audit_result
            WHERE
                AUDIT_GROUP_ID = ?
                AND AUDIT_TYPE_ID = ?
                AND AUDIT_ID = ?
                AND PLANT_NO = ?
        `, [audit_group_id, audit_type_id, audit_id, plant_no]);

        res.json(rows); 
    } catch (error) {
        next(error); // Forward errors to the error-handling middleware
    }
});


app.listen(port, () => {
    console.log(`Server running on ${port}`);
});
