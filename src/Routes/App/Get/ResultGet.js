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


router.get('/auditV2', async (req, res, next) => {
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


router.get('/ResultDetail', async (req, res, next) => {
    try {
        const { AUDIT_RESULT_ID } = req.query;

        const pool = await poolPromise;
        const result = await pool.request()
            .input('AUDIT_RESULT_ID', sql.VarChar, AUDIT_RESULT_ID)
            .query(`
            SELECT *
            FROM audit_result ar 
            WHERE AUDIT_RESULT_ID = @AUDIT_RESULT_ID
            `);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});


router.get('/summaryAllDiv', async (req, res, next) => {
    try {

        const pool = await poolPromise;
        const result = await pool.request()
            .query(`
            WITH PlantHaveData AS (
                SELECT DISTINCT ar.PLANT_NO
                FROM audit_result ar
                ),
                TotalScores AS (
                    SELECT
                        AUDIT_GROUP_ID,
                        SUM(CAST(K_SCORE AS DECIMAL(10, 2))) * 3 AS TotalScore
                    FROM
                        audit_question
                    GROUP BY
                        AUDIT_GROUP_ID
                ),ActualScores AS (
                    SELECT
                        ar.PLANT_NO,
                        ar.AUDIT_GROUP_ID,
                        SUM(CAST(ar.K_SCORE AS DECIMAL(10, 2)) * aq.K_SCORE) AS ActualScore
                    FROM
                        audit_result ar
                    LEFT JOIN audit_question aq ON aq.QUESTION_ID = ar.QUESTION_ID
                    GROUP BY
                        ar.PLANT_NO,
                        ar.AUDIT_GROUP_ID
                )	, MustPassCount AS (
                    SELECT
                        ar.PLANT_NO,
                        COUNT(ar.AUDIT_RESULT_ID) AS MustPassCount
                    FROM
                        audit_result ar
                    LEFT JOIN
                        audit_question aq ON aq.QUESTION_ID = ar.QUESTION_ID
                    LEFT JOIN
                        audit_group ag ON ag.AUDIT_GROUP_ID = ar.AUDIT_GROUP_ID
                    WHERE
                        aq.isMust = 1
                        AND ar.isFinished = 0
                    GROUP BY
                        ar.PLANT_NO
                ), PassTable AS (
                    SELECT
                        p.PLANT_NO,
                        ag.AUDIT_GROUP_ID,
                        ag.NAME AS 'group_name',
                        COALESCE(mp.MustPassCount, 0) AS MustPassCount,
                        COALESCE(act.ActualScore, 0) AS ActualScore,
                        COALESCE(ts.TotalScore, 0) AS TotalScore,
                        CASE 
                            WHEN COALESCE(ts.TotalScore, 0) = 0 THEN 0  -- To handle division by zero
                            ELSE ROUND(COALESCE(act.ActualScore, 0) / COALESCE(ts.TotalScore, 0) * 100, 2)
                        END AS Percentage,
                        CASE
                            WHEN ROUND(COALESCE(act.ActualScore, 0) / COALESCE(ts.TotalScore, 0) * 100, 2) < 80 THEN 0
                            ELSE 1
                        END AS 'isPass'
                    FROM
                        plant p
                    CROSS JOIN
                        audit_group ag
                    LEFT JOIN
                        TotalScores ts ON ts.AUDIT_GROUP_ID = ag.AUDIT_GROUP_ID
                    LEFT JOIN
                        ActualScores act ON act.AUDIT_GROUP_ID = ag.AUDIT_GROUP_ID AND act.PLANT_NO = p.PLANT_NO
                    LEFT JOIN
                        MustPassCount mp ON mp.PLANT_NO = p.PLANT_NO
                    LEFT JOIN 
                        location_lnk ll ON ll.PLANT_NO = p.PLANT_NO
                    LEFT JOIN 
                        division d ON d.DIVISION_NO = ll.DIVISION_NO
                    LEFT JOIN 
                        department d2 ON d2.DEPT_NO = ll.DEPT_NO
                    LEFT JOIN 
                        [section] s ON s.SECT_NO = ll.SECT_NO
                ), PassTableAggregated AS (
                    SELECT
                        pt.PLANT_NO,
                        MAX(pt.isPass) AS isPass -- If any of the audit groups passed, the plant passed
                    FROM
                        PassTable pt
                    GROUP BY
                        pt.PLANT_NO
                )
                -- Main query using PassTable
                SELECT
                    d.DIVISION_NO,
                    d.NAME,
                    COUNT(p.PLANT_NO) AS 'PlantTotal',
                    COUNT(PHD.PLANT_NO) AS 'PlantWithDataCount',
                    COUNT(DISTINCT CASE WHEN pta.isPass = 1 THEN pta.PLANT_NO END) AS PassingPlantCount,
                     CASE 
                        WHEN COUNT(p.PLANT_NO) = 0 THEN 0
                        ELSE ROUND((COUNT(DISTINCT CASE WHEN pta.isPass = 1 THEN pta.PLANT_NO END) * 100.0) / COUNT(p.PLANT_NO), 2)
                    END AS percentPass
                FROM division d
                LEFT JOIN location_lnk ll ON ll.DIVISION_NO = d.DIVISION_NO
                LEFT JOIN plant p ON p.PLANT_NO = ll.PLANT_NO AND (p.PLANT_NO LIKE 'Z%' OR p.PLANT_NO LIKE '1%' OR p.PLANT_NO LIKE '3%')
                LEFT JOIN PlantHaveData PHD ON PHD.PLANT_NO = p.PLANT_NO
                LEFT JOIN PassTableAggregated pta ON pta.PLANT_NO = p.PLANT_NO
                WHERE d.STATUS = 'A'
                GROUP BY d.DIVISION_NO, d.NAME, d.sequence
                ORDER BY d.sequence ASC;
            `);

        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
