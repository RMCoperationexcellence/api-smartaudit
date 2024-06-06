// userExam.js

const createMySQLPool = require('../../config/dbRMCOP');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        console.log('Received request to fetch users.');
        const { plant_no } = req.query;
        const pool = await createMySQLPool();

        const sql = `
            SELECT f.PLANT_NO,
                   u.users_id,
                   u.preflix,
                   u.fullname,
                   u.email,
                   IFNULL(ect.EXAM, 0) AS EXAM,
                   IFNULL(oct.OJT, 0) AS OJT,
                   IFNULL(pct.PRACTICE, 0) AS PRACTICE,
                   IFNULL(rct.RESKILL, 0) AS RESKILL
            FROM users u
            LEFT JOIN (
                SELECT cr.exam_by_user_id AS users_id,
                       1 AS EXAM
                FROM course_result cr
                WHERE cr.course_group_id IN (1, 2, 3, 4) 
                AND cr.is_exam_pass = 1 
                GROUP BY cr.exam_by_user_id
                HAVING COUNT(DISTINCT cr.course_group_id) = 4
            ) AS ect ON ect.users_id = u.users_id
            LEFT JOIN (
                SELECT os.uid AS users_id,
                       1 AS OJT
                FROM OJTExamSession os
                WHERE os.ojtExamID IN (1, 2, 3, 4)
                AND os.isFinish = 1
                GROUP BY os.uid
                HAVING COUNT(DISTINCT os.ojtExamID) = 4
            ) AS oct ON oct.users_id = u.users_id
            LEFT JOIN (
                SELECT pes.uid AS users_id,
                       1 AS PRACTICE
                FROM PracticalExamSession pes
                WHERE pes.ojtExamID IN (1, 2, 3, 4)
                AND pes.isFinish = 1
                GROUP BY pes.uid
                HAVING COUNT(DISTINCT pes.ojtExamID) = 4
            ) AS pct ON pct.users_id = u.users_id
            LEFT JOIN (
                SELECT rs.uid AS users_id,
                       1 AS RESKILL
                FROM ReskillLog rs
                WHERE rs.ojtExamID IN (1, 2, 3, 4)
                AND rs.isFinish = 1
                GROUP BY rs.uid
                HAVING COUNT(DISTINCT rs.ojtExamID) = 4
            ) AS rct ON rct.users_id = u.users_id
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
                AND f.plant_no = ?;
        `;

        const [rows] = await pool.query(sql, [plant_no]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        next(error);
    }
});

module.exports = router;
