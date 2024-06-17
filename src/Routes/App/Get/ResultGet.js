const { sql, poolPromise } = require('../../../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();

router.get('/audit', async (req, res, next) => {
    try {
        const { plant_no } = req.query;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('plant_no', sql.VarChar, plant_no)
            .query(`
            SELECT
            ar.AUDIT_RESULT_ID,
            ag.NAME,
            aq.QUESTION_TEXT,
            ar.CHOICE_NO,
            ar.CHOICE_RESULTS,
            ar.isFinished,
            aq.K_SCORE as 'QUESTION_SCORE',
            ar.K_SCORE as 'RESULT_SCORE',
            ar.FactoryHead_choice,
            ar.DeptManager_choice,
            ar.DivManager_choice,
            ar.PLANT_NO,
            ar.UPDATE_DATE,
            CASE
        WHEN ar.isFinished = 1 THEN 'ผ่าน Verify'
        WHEN ar.isFinished = 0 THEN 'ไม่ผ่าน Verify'
    END AS VERIFY_STATUS,
            CONCAT(e.name, ' ', e.sname) AS CREATE_BY_USER_NAME
            FROM audit_result ar
            LEFT JOIN audit_group ag ON ag.AUDIT_GROUP_ID = ar.AUDIT_GROUP_ID
            LEFT JOIN audit_question aq ON aq.QUESTION_ID = ar.QUESTION_ID
            LEFT JOIN emp e ON e.EMP = ar.CREATE_BY_USER_ID
                WHERE ar.PLANT_NO = @plant_no
                AND ar.create_date >= DATEADD(DAY, -7, GETDATE());
            `);

        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
