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
