// userExam.js
const createMySQLPool = require('../../config/dbRMCOP');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        console.log('Received request to fetch users.');
        const pool = await createMySQLPool();
        const { plant_no } = req.query;
        const parameter = [plant_no];
        const sql = `
        WITH EXAM_CTE AS (
            SELECT u.users_id,
                   CASE
                       WHEN EXISTS (
                           SELECT 1
                           FROM course_result cr
                           WHERE cr.course_group_id IN (1, 2, 3, 4) 
                           AND cr.is_exam_pass = 1 
                           AND cr.exam_by_user_id = u.users_id
                           GROUP BY cr.exam_by_user_id
                           HAVING COUNT(DISTINCT cr.course_group_id) = 4
                       ) THEN 1 
                       ELSE 0
                   END AS EXAM
            FROM users u
        ),
        OJT_CTE AS(
            SELECT u.users_id,
            CASE
                WHEN EXISTS(
                    SELECT 1
                    FROM OJTExamSession os
                    WHERE os.ojtExamID IN (1, 2, 3, 4)
                    AND os.isFinish = 1
                    AND os.uid = u.users_id
                    GROUP BY os.uid
                    HAVING COUNT(DISTINCT os.ojtExamID) = 4
                ) THEN 1 ELSE 0
            END AS OJT
            FROM users u )
        ,
        PRACTICE_CTE AS(
            SELECT u.users_id,
            CASE
                WHEN EXISTS(
                    SELECT 1
                    FROM PracticalExamSession pes
                    WHERE pes.ojtExamID IN (1, 2, 3, 4)
                    AND pes.isFinish = 1
                    AND pes.uid = u.users_id
                    GROUP BY pes.uid
                    HAVING COUNT(DISTINCT pes.ojtExamID) = 4
                ) THEN 1 ELSE 0
            END AS PRACTICE
            FROM users u )
        ,
        RESKILL_CTE AS(
            SELECT u.users_id,
            CASE
                WHEN EXISTS(
                    SELECT 1
                    FROM ReskillLog rs
                    WHERE rs.ojtExamID IN (1, 2, 3, 4)
                    AND rs.isFinish = 1
                    AND rs.uid = u.users_id
                    GROUP BY rs.uid
                    HAVING COUNT(DISTINCT rs.ojtExamID) = 4
                ) THEN 1 ELSE 0
            END AS RESKILL
            FROM users u )
        SELECT f.PLANT_NO,
               u.users_id,
               u.preflix,
               u.fullname,
               u.email,
               ect.EXAM,
               oct.OJT,
               pct.PRACTICE,
               rct.RESKILL
        FROM users u
        LEFT JOIN EXAM_CTE ect ON ect.users_id = u.users_id
        LEFT JOIN OJT_CTE oct ON oct.users_id = u.users_id
        LEFT JOIN PRACTICE_CTE pct ON pct.users_id = u.users_id
        LEFT JOIN RESKILL_CTE rct ON rct.users_id = u.users_id
        LEFT JOIN UserFactoryMapper ufm ON ufm.uid = u.users_id
        LEFT JOIN cpac_chain cc ON cc.cpac_chain_id = ufm.chainID
        LEFT JOIN cpac_csc cc2 ON cc2.cpac_csc_id = ufm.cscID
        LEFT JOIN factory f ON f.factory_id = ufm.factoryID
        WHERE
            u.is_active = 1
            AND u.fullname NOT LIKE '%0310%'
            AND u.fullname NOT LIKE '%0%'
            AND u.fullname NOT LIKE '%rmc%'
            AND u.fullname NOT LIKE '%ทดสอบ%'
            AND u.fullname NOT LIKE '%ตูน%'
            AND u.fullname NOT LIKE '%rmc%'
            AND u.email NOT LIKE '%pantapos%'
            AND u.email NOT LIKE '%chakrapb%'
            AND u.positionID NOT IN (44,-1)
            AND cc.is_active = 1
            AND cc2.is_active = 1
            AND f.is_active = 1
            AND f.plant_no = ?
        ORDER BY u.users_id;        
        `
        const [rows] = await pool.query(sql, parameter);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        next(error);
    }
});

module.exports = router;
