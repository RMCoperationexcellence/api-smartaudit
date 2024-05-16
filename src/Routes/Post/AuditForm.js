const pool = require('../../config/db');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = Array.isArray(req.body) ? req.body : [req.body]; // Ensure data is always an array

    // Validate incoming data
    if (data.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one entry is required' });
    }

    try {
        const connection = await pool.getConnection();
        try {
            for (const item of data) {
                const { audit_group_id, question_id, plant_no, choice_no, choice_results, k_score, create_by_user_id } = item;
                const userId = create_by_user_id === undefined ? null : create_by_user_id;

                await connection.query(`
                    INSERT INTO audit_result (AUDIT_GROUP_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    CHOICE_NO = VALUES(CHOICE_NO),
                    CHOICE_RESULTS = VALUES(CHOICE_RESULTS),
                    K_SCORE = VALUES(K_SCORE),
                    CREATE_BY_USER_ID = VALUES(CREATE_BY_USER_ID);
                `, [audit_group_id, question_id, plant_no, choice_no, choice_results, k_score, userId]);
            }

            res.json({ success: true, message: 'Audit results saved successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error executing SQL:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;
