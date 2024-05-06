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
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Connected to MySQL!');
        connection.release();
    } catch (error) {
        console.error('Error connecting to MySQL:', error);
        process.exit(1); // Exit the process if unable to connect to the database
    }
})();

router.post('/', async (req, res) => {
    const { audit_group_id, audit_type_id, audit_id, question_id, plant_no, choice_results, k_score, create_by_user_id } = req.body;
    
    // Check if create_by_user_id is undefined or null, set it to null if so
    const userId = create_by_user_id === undefined ? null : create_by_user_id;

    // Validate request data
    if (!audit_group_id || !audit_type_id || !audit_id || !question_id || !plant_no || !choice_results || !k_score || userId === undefined) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Execute SQL query
        const [result] = await pool.query(`
            INSERT INTO audit_result (AUDIT_GROUP_ID, AUDIT_TYPE_ID, AUDIT_ID, QUESTION_ID, PLANT_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            CHOICE_RESULTS = VALUES(CHOICE_RESULTS),
            K_SCORE = VALUES(K_SCORE),
            CREATE_BY_USER_ID = VALUES(CREATE_BY_USER_ID);
        `, [audit_group_id, audit_type_id, audit_id, question_id, plant_no, choice_results, k_score, userId]);

        // Check if the query was successful
        if (result.affectedRows === 1) {
            res.json({ success: true, message: 'Audit result saved successfully' });
        } else {
            throw new Error('Failed to insert audit result');
        }
    } catch (error) {
        console.error('Error executing SQL:', error.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


module.exports = router;
