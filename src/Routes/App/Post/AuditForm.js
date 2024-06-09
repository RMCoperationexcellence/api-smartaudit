const { sql, poolPromise } = require('../../../config/db');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = Array.isArray(req.body) ? req.body : [req.body];

    if (data.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one entry is required' });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const item of data) {
                const {
                    audit_group_id,
                    question_id,
                    plant_no,
                    choice_no,
                    choice_results,
                    k_score,
                    create_by_user_id
                } = item;

                const auditGroupId = parseInt(audit_group_id, 10);
                const questionId = parseInt(question_id, 10);
                const choiceNo = parseInt(choice_no, 10);
                const kScore = parseFloat(k_score);

                if (isNaN(auditGroupId) || isNaN(questionId) || isNaN(choiceNo) || isNaN(kScore)) {
                    return res.status(400).json({ success: false, message: 'Invalid data types' });
                }

                const randomId = 'AUDIT' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

                await transaction.request()
                    .input('audit_result_id', sql.VarChar, randomId)
                    .input('audit_group_id', sql.Int, auditGroupId)
                    .input('question_id', sql.Int, questionId)
                    .input('plant_no', sql.VarChar, plant_no)
                    .input('choice_no', sql.Int, choiceNo)
                    .input('choice_results', sql.NVarChar, choice_results)
                    .input('k_score', sql.Float, kScore)
                    .input('create_by_user_id', sql.VarChar, create_by_user_id)
                    .query(`
                        MERGE INTO audit_result AS target
                        USING (VALUES (@audit_result_id, @audit_group_id, @question_id, @plant_no, @choice_no, @choice_results, @k_score, @create_by_user_id)) AS source (AUDIT_RESULT_ID, AUDIT_GROUP_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID)
                        ON (target.AUDIT_GROUP_ID = source.AUDIT_GROUP_ID AND target.QUESTION_ID = source.QUESTION_ID AND target.PLANT_NO = source.PLANT_NO)
                        WHEN MATCHED THEN
                            UPDATE SET 
                                CHOICE_NO = source.CHOICE_NO,
                                CHOICE_RESULTS = source.CHOICE_RESULTS,
                                K_SCORE = source.K_SCORE,
                                CREATE_BY_USER_ID = source.CREATE_BY_USER_ID
                        WHEN NOT MATCHED THEN
                            INSERT (AUDIT_RESULT_ID, AUDIT_GROUP_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID)
                            VALUES (source.AUDIT_RESULT_ID, source.AUDIT_GROUP_ID, source.QUESTION_ID, source.PLANT_NO, source.CHOICE_NO, source.CHOICE_RESULTS, source.K_SCORE, source.CREATE_BY_USER_ID);
                    `);
            }

            await transaction.commit();
            res.json({ success: true, message: 'Audit results saved successfully' });
        } catch (err) {
            console.error('Error executing SQL:', err);
            await transaction.rollback();
            res.status(500).json({ success: false, message: 'Error executing SQL. Transaction rolled back.' });
        }
    } catch (error) {
        console.error('Error establishing SQL connection:', error);
        res.status(500).json({ success: false, message: 'Error establishing SQL connection.' });
    }
});

module.exports = router;
