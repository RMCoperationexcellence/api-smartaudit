// Node.js Express PostForm.js
const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
});

// Test database connection
const connectToDatabase = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL!');
        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        process.exit(1); // ออกจากระบบถ้าไม่สามารถเชื่อมต่อกับฐานข้อมูลได้
    }
};

(async () => {
    await connectToDatabase();
})();

router.post('/', async (req, res) => {
    const { audit_group_id, audit_type_id, audit_id, question_id, plant_no, choice_no,choice_results, k_score, create_by_user_id } = req.body;
    
    // Check if create_by_user_id is undefined or null, set it to null if so
    const userId = create_by_user_id === undefined ? null : create_by_user_id;

    // Validate request data
    if (!audit_group_id || !audit_type_id || !audit_id || !question_id || !plant_no || !choice_results || !k_score || userId === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Execute SQL query
        const connection = await pool.getConnection();
        try {
            const [result] = await connection.query(`
                INSERT INTO audit_result (AUDIT_GROUP_ID, AUDIT_TYPE_ID, AUDIT_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                AS new
                ON DUPLICATE KEY UPDATE
                CHOICE_NO = new.CHOICE_NO,
                CHOICE_RESULTS = new.CHOICE_RESULTS,
                K_SCORE = new.K_SCORE,
                CREATE_BY_USER_ID = new.CREATE_BY_USER_ID;
            `, [audit_group_id, audit_type_id, audit_id, question_id, plant_no, choice_no, choice_results, k_score, userId]);

            if (result.affectedRows === 1) {
                res.json({ success: true, message: 'Audit result saved successfully' });
            } else {
                throw new Error('Failed to save audit result');
            }
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


module.exports = router;
