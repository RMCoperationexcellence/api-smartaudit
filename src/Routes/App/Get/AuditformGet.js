const { sql, poolPromise } = require('../../../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();

router.get('/auditgroup', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM audit_group');
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/auditQuestionResult', async (req, res, next) => {
    try {
        const { audit_group_id, plant_no } = req.query;

        if (!audit_group_id && !plant_no) {
            return res.status(400).json({ error: "Required parameters are missing" });
        }

        const pool = await poolPromise;
        let sqlQuery;
        let request = pool.request();

        if (audit_group_id) {
            sqlQuery = 'SELECT * FROM audit_result WHERE audit_group_id = @audit_group_id AND plant_no = @plant_no';
            request.input('audit_group_id', sql.Int, audit_group_id)
                   .input('plant_no', sql.VarChar, plant_no);
        } else {
            sqlQuery = `
            WITH LatestAuditResult AS (
                SELECT 
                    ar.audit_group_id, 
                    MAX(ar.update_date) AS UPDATE_DATE
                FROM audit_result ar
                WHERE ar.plant_no = @plant_no
                GROUP BY ar.audit_group_id
            ),
            LatestAuditUser AS (
                SELECT 
                    ar.audit_group_id, 
                    ar.create_by_user_id, 
                    ar.update_date
                FROM audit_result ar
                INNER JOIN LatestAuditResult lar
                    ON ar.audit_group_id = lar.audit_group_id
                    AND ar.update_date = lar.UPDATE_DATE
                WHERE ar.plant_no = @plant_no
            )
            SELECT 
                lar.audit_group_id, 
                lar.UPDATE_DATE, 
                CONCAT(e.name, ' ', e.sname) AS CREATE_BY_USER_NAME
            FROM LatestAuditResult lar
            INNER JOIN LatestAuditUser lau
                ON lar.audit_group_id = lau.audit_group_id
                AND lar.UPDATE_DATE = lau.update_date
            LEFT JOIN emp e
                ON e.emp = lau.create_by_user_id;                     
        `;

            request.input('plant_no', sql.VarChar, plant_no);
        }

        const result = await request.query(sqlQuery);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/question', async (req, res, next) => {
    try {
        const { audit_group } = req.query;

        if (!audit_group) {
            res.status(400).json({ error: "Audit group parameter is required" });
            return;
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('audit_group', sql.Int, audit_group)
            .query('SELECT * FROM audit_question WHERE AUDIT_GROUP_ID = @audit_group');

        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/auditgroupresult', async (req, res, next) => {
    try {
        const { plant_no } = req.query;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('plant_no', sql.VarChar, plant_no)
            .query(`
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
                        PLANT_NO = @plant_no
                    GROUP BY 
                        AUDIT_GROUP_ID
                ) AS max_ar ON max_ar.AUDIT_GROUP_ID = ag.AUDIT_GROUP_ID
                LEFT JOIN 
                    audit_result ar ON ar.AUDIT_GROUP_ID = max_ar.AUDIT_GROUP_ID
                    AND ar.UPDATE_DATE = max_ar.MaxUpdateDate
                WHERE 
                    ar.PLANT_NO = @plant_no;
            `);

        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
