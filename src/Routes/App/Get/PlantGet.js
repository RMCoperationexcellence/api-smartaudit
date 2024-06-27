const { poolPromise } = require('../../../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();
const sql = require('mssql'); // Import the sql module from mssql

// Helper function to log the query with parameters replaced
function logQuery(query, params) {
    Object.keys(params).forEach(key => {
        const regex = new RegExp(`@${key}`, 'g');
        query = query.replace(regex, params[key]);
    });
    console.log('query:', query);
}

router.get('/', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM plant p WHERE p.LAT NOT LIKE '%NULL%' AND p.COMPCODE = 130`);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/Master', async (req, res, next) => {
    const { DivNo, DeptNo, SectNo } = req.query;
    try {
        const pool = await poolPromise;
        const request = pool.request();
        const params = {};

        if (DivNo) {
            request.input('divNo', sql.Int, DivNo);
            params['divNo'] = DivNo;
        }
        if (DeptNo) {
            request.input('DeptNo', sql.Int, DeptNo);
            params['DeptNo'] = DeptNo;
        }
        if (SectNo) {
            request.input('SectNo', sql.Int, SectNo);
            params['SectNo'] = SectNo;
        }

        let query = `
            SELECT DISTINCT d.*
            FROM division d WHERE d.STATUS = 'A'
            ORDER BY d.sequence
        `;

        if (DivNo) {
            query = `
                SELECT DISTINCT ll.DEPT_NO, d2.NAME
                FROM location_lnk ll
                LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
                LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
                LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
                WHERE ll.DIVISION_NO = @divNo AND d2.DEPT_NO IS NOT NULL
            `;
        }

        if (DivNo && DeptNo){
            query = `
            SELECT DISTINCT ll.SECT_NO, s.NAME
            FROM location_lnk ll
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @divNo AND ll.DEPT_NO = @DeptNo
            `;
        }

        logQuery(query, params);
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/PlantData', async (req, res, next) => {
    const { DivNo, DeptNo, SectNo, StartDate, EndDate } = req.query;
    try {
        const pool = await poolPromise;
        const request = pool.request();
        const params = {};

        if (DivNo) {
            request.input('divNo', sql.Int, DivNo);
            params['divNo'] = DivNo;
        }
        if (DeptNo) {
            request.input('DeptNo', sql.Int, DeptNo);
            params['DeptNo'] = DeptNo;
        }
        if (SectNo) {
            request.input('SectNo', sql.Int, SectNo);
            params['SectNo'] = SectNo;
        }
        if (StartDate) {
            request.input('StartDate', sql.Date, StartDate);
            params['StartDate'] = StartDate;
        }
        if (EndDate) {
            request.input('EndDate', sql.Date, EndDate);
            params['EndDate'] = EndDate;
        }       

        let query = '';

        if (DivNo) {
            query = `
            WITH TotalScores AS (
                SELECT
                    AUDIT_GROUP_ID,
                    SUM(CAST(K_SCORE AS DECIMAL(10, 2))) * 3 AS TotalScore
                FROM
                    audit_question
                GROUP BY
                    AUDIT_GROUP_ID
            ), ActualScores AS (
                SELECT
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID,
                    SUM(CAST(ar.K_SCORE AS DECIMAL(10, 2))) * 3 AS ActualScore
                FROM
                    audit_result ar
                GROUP BY
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID
            ), MustPassCount AS (
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
            )
            SELECT
                d2.NAME as 'department_name',
                s.NAME as 'sector_name',
                p.PLANT_NO,
                p.NAME AS 'plant_name',
                ag.AUDIT_GROUP_ID,
                ag.NAME AS 'group_name',
                COALESCE(mp.MustPassCount, 0) AS MustPassCount,
                COALESCE(act.ActualScore, 0) AS ActualScore,
                COALESCE(ts.TotalScore, 0) AS TotalScore
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
            LEFT JOIN location_lnk ll ON ll.PLANT_NO = p.PLANT_NO
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @divNo
            AND d2.NAME IS NOT NULL
            ORDER BY
            d2.NAME,
            p.PLANT_NO,
            ag.AUDIT_GROUP_ID
            `;
        }

        if (DivNo && DeptNo){
            query = `
            WITH TotalScores AS (
                SELECT
                    AUDIT_GROUP_ID,
                    SUM(CAST(K_SCORE AS DECIMAL(10, 2))) * 3 AS TotalScore
                FROM
                    audit_question
                GROUP BY
                    AUDIT_GROUP_ID
            ), ActualScores AS (
                SELECT
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID,
                    SUM(CAST(ar.K_SCORE AS DECIMAL(10, 2))) * 3 AS ActualScore
                FROM
                    audit_result ar
                GROUP BY
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID
            ), MustPassCount AS (
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
            )
            SELECT
                d2.NAME as 'department_name',
                s.NAME as 'sector_name',
                p.PLANT_NO,
                p.NAME AS 'plant_name',
                ag.AUDIT_GROUP_ID,
                ag.NAME AS 'group_name',
                COALESCE(mp.MustPassCount, 0) AS MustPassCount,
                COALESCE(act.ActualScore, 0) AS ActualScore,
                COALESCE(ts.TotalScore, 0) AS TotalScore
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
            LEFT JOIN location_lnk ll ON ll.PLANT_NO = p.PLANT_NO
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @divNo AND ll.DEPT_NO = @DeptNo
            AND d2.NAME IS NOT NULL
            ORDER BY
            d2.NAME,
                ll.DEPT_NO,
                p.PLANT_NO,
                ag.AUDIT_GROUP_ID
                ASC          
            `;
        }

        if (DivNo && DeptNo && SectNo){
            query = `
            WITH TotalScores AS (
                SELECT
                    AUDIT_GROUP_ID,
                    SUM(CAST(K_SCORE AS DECIMAL(10, 2))) * 3 AS TotalScore
                FROM
                    audit_question
                GROUP BY
                    AUDIT_GROUP_ID
            ), ActualScores AS (
                SELECT
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID,
                    SUM(CAST(ar.K_SCORE AS DECIMAL(10, 2))) * 3 AS ActualScore
                FROM
                    audit_result ar
                GROUP BY
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID
            ), MustPassCount AS (
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
            )
            SELECT
                d2.NAME as 'department_name',
                s.NAME as 'sector_name',
                p.PLANT_NO,
                p.NAME AS 'plant_name',
                ag.AUDIT_GROUP_ID,
                ag.NAME AS 'group_name',
                COALESCE(mp.MustPassCount, 0) AS MustPassCount,
                COALESCE(act.ActualScore, 0) AS ActualScore,
                COALESCE(ts.TotalScore, 0) AS TotalScore
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
            LEFT JOIN location_lnk ll ON ll.PLANT_NO = p.PLANT_NO
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @divNo AND ll.DEPT_NO = @DeptNo AND ll.SECT_NO = @SectNo
            AND d2.NAME IS NOT NULL
            ORDER BY
            d2.NAME,
                ll.DEPT_NO,
                ll.SECT_NO,
                p.PLANT_NO,
                ag.AUDIT_GROUP_ID
                ASC           
            `;
        }

        if (DivNo && DeptNo && SectNo && StartDate && EndDate) {
            query = `
            WITH TotalScores AS (
                SELECT
                    AUDIT_GROUP_ID,
                    SUM(CAST(K_SCORE AS DECIMAL(10, 2))) * 3 AS TotalScore
                FROM
                    audit_question
                GROUP BY
                    AUDIT_GROUP_ID
            ), ActualScores AS (
                SELECT
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID,
                    SUM(CAST(ar.K_SCORE AS DECIMAL(10, 2))) * 3 AS ActualScore
                FROM
                    audit_result ar
                WHERE
                    ar.UPDATE_DATE BETWEEN @StartDate AND @EndDate
                GROUP BY
                    ar.PLANT_NO,
                    ar.AUDIT_GROUP_ID
            ), MustPassCount AS (
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
                    AND ar.UPDATE_DATE BETWEEN @StartDate AND @EndDate
                GROUP BY
                    ar.PLANT_NO
            )
            SELECT
                d2.NAME as 'department_name',
                s.NAME as 'sector_name',
                p.PLANT_NO,
                p.NAME AS 'plant_name',
                ag.AUDIT_GROUP_ID,
                ag.NAME AS 'group_name',
                COALESCE(mp.MustPassCount, 0) AS MustPassCount,
                COALESCE(act.ActualScore, 0) AS ActualScore,
                COALESCE(ts.TotalScore, 0) AS TotalScore
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
            LEFT JOIN location_lnk ll ON ll.PLANT_NO = p.PLANT_NO
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @DivNo AND ll.DEPT_NO = @DeptNo AND ll.SECT_NO = @SectNo
            AND d2.NAME IS NOT NULL
            ORDER BY
            d2.NAME,
                ll.DEPT_NO,
                ll.SECT_NO,
                p.PLANT_NO,
                ag.AUDIT_GROUP_ID
                ASC 
            `;
        }
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;