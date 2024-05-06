const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();
const mysql = require('mysql2/promise');
const port = 3001;
const auditRoutes = require('./PostForm'); // นำเข้า Router ที่คุณสร้าง


app.use(cors());
app.use(bodyParser.json());
app.use(express.json());


dotenv.config();


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL!');
        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
    }
})();


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

app.get('/auditList', async (req, res, next) => {
    try{
        const [rows] = await pool.query(`
        SELECT 
        ag.*, 
        COUNT(aq.AUDIT_GROUP_ID) as NUM_QUESTIONS, 
        SUM(aq.K_SCORE) as TOTAL_K_SCORE
        FROM audit_group ag
        LEFT JOIN audit_question aq ON ag.AUDIT_GROUP_ID = aq.AUDIT_GROUP_ID
        GROUP BY ag.AUDIT_GROUP_ID;
        `);
        res.json(rows);
    } catch (error) {
        next(error);
    }
})

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

app.get('/AuditHistory', async (req, res, next) => {
    try {
        // Get the audit_group from the query string
        const { plant_no } = req.query;

        // Check if the audit_group parameter is provided
        if (!plant_no) {
            res.status(400).json({ error: "Audit group parameter is required" });
            return;
        }

        // Execute the query with the audit_group parameter
        const [rows] = await pool.query(`
        SELECT
        ar.AUDIT_ID,
        p.NAME,
        CASE 
            WHEN COUNT(ag.AUDIT_GROUP_ID) = (SELECT COUNT(*) FROM audit_group) THEN 1
            ELSE 0 
        END AS isComplete,
        SUM(ar.K_SCORE) * 2 AS actual_score,
        (
            SELECT SUM(K_SCORE)
            FROM audit_question aq
        ) * 2 AS total_score,
        (
            SELECT MIN(create_date)
            FROM audit_result
            WHERE AUDIT_ID = ar.AUDIT_ID
        ) AS create_date,
        (
            SELECT MAX(update_date)
            FROM audit_result
            WHERE AUDIT_ID = ar.AUDIT_ID
        ) AS update_date,
        MAX(u.NAME) AS firstname,
        MAX(u.LASTNAME) AS lastname
    FROM
        audit_result ar
        INNER JOIN audit_group ag ON ar.AUDIT_GROUP_ID = ag.AUDIT_GROUP_ID
        INNER JOIN plant p ON ar.PLANT_NO = p.PLANT_NO
        LEFT JOIN users u ON u.USER_ID = ar.CREATE_BY_USER_ID
    WHERE ar.PLANT_NO = ?
    GROUP BY
        ar.AUDIT_ID, p.NAME
    ORDER BY
        ar.AUDIT_ID DESC;
    
    
    
        `, [plant_no]);

        // Return the result as JSON
        res.json(rows);
    } catch (error) {
        // Forward errors to the error-handling middleware
        next(error);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
