// AuditformGet.js
const pool = require('../config/db');
const express = require('express');
const router = express.Router();

router.get('/auditgroup', async (req, res, next) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM audit_group`);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get('/question', async (req, res, next) => {
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

router.get('/auditgroupresult', async (req, res, next) => {
    try {
        const { plant_no } = req.query;
        const [rows] = await pool.query(`
            SELECT 
                ag.*, 
                ar.PLANT_NO, 
                ar.CREATE_BY_USER_ID, 
                ar.UPDATE_DATE
            FROM 
                audit_group ag
            JOIN (
                SELECT 
                    AUDIT_GROUP_ID, 
                    MAX(UPDATE_DATE) AS MaxUpdateDate
                FROM 
                    audit_result
                WHERE 
                    PLANT_NO = ?
                GROUP BY 
                    AUDIT_GROUP_ID
            ) AS max_ar ON max_ar.AUDIT_GROUP_ID = ag.AUDIT_GROUP_ID
            LEFT JOIN 
                audit_result ar ON ar.AUDIT_GROUP_ID = max_ar.AUDIT_GROUP_ID
                AND ar.UPDATE_DATE = max_ar.MaxUpdateDate
            WHERE 
                ar.PLANT_NO = ?;
        `, [plant_no, plant_no]);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
