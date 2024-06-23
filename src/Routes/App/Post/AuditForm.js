const { sql, poolPromise } = require('../../../config/db');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    const data = req.body;
    if (!data || (Array.isArray(data) && data.length === 0)) {
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
                    create_by_user_id,
                    isFinished,
                    Question_Score: questionScore, // Use a different name for destructured variable
                } = item;

                const auditGroupId = parseInt(audit_group_id, 10);
                const questionId = parseInt(question_id, 10);
                const choiceNo = parseInt(choice_no, 10);
                const kScore = parseFloat(k_score);
                const isFinishedVal = isFinished === null ? null : (isFinished === 1 ? 1 : 0);

                const randomId = 'AUDIT' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
                const parsedQuestionScore = parseInt(questionScore, 10); // Change the name here too

                await transaction.request()
                    .input('audit_result_id', sql.VarChar, randomId)
                    .input('audit_group_id', sql.Int, auditGroupId)
                    .input('question_id', sql.Int, questionId)
                    .input('plant_no', sql.VarChar, plant_no)
                    .input('choice_no', sql.Int, choiceNo)
                    .input('choice_results', sql.NVarChar, choice_results)
                    .input('k_score', sql.Float, kScore)
                    .input('create_by_user_id', sql.VarChar, create_by_user_id)
                    .input('isFinished', sql.Int, isFinishedVal)
                    .query(`
                        MERGE INTO audit_result AS target
                        USING (VALUES (@audit_result_id, @audit_group_id, @question_id, @plant_no, @choice_no, @choice_results, @k_score, @create_by_user_id, @isFinished)) AS source (AUDIT_RESULT_ID, AUDIT_GROUP_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID, ISFINISHED)
                        ON (target.AUDIT_GROUP_ID = source.AUDIT_GROUP_ID AND target.QUESTION_ID = source.QUESTION_ID AND target.PLANT_NO = source.PLANT_NO)
                        WHEN MATCHED THEN
                            UPDATE SET 
                                CHOICE_NO = source.CHOICE_NO,
                                CHOICE_RESULTS = source.CHOICE_RESULTS,
                                K_SCORE = source.K_SCORE,
                                CREATE_BY_USER_ID = source.CREATE_BY_USER_ID,
                                UPDATE_DATE = GETDATE(),
                                ISFINISHED = source.ISFINISHED
                        WHEN NOT MATCHED THEN
                            INSERT (AUDIT_RESULT_ID, AUDIT_GROUP_ID, QUESTION_ID, PLANT_NO, CHOICE_NO, CHOICE_RESULTS, K_SCORE, CREATE_BY_USER_ID, ISFINISHED)
                            VALUES (source.AUDIT_RESULT_ID, source.AUDIT_GROUP_ID, source.QUESTION_ID, source.PLANT_NO, source.CHOICE_NO, source.CHOICE_RESULTS, source.K_SCORE, source.CREATE_BY_USER_ID, source.ISFINISHED);
                    `);
            }

            await transaction.commit();
            res.json({ success: true, message: 'Audit results saved successfully' });
        } catch (err) {
            console.error('Error executing SQL:', err);
            await transaction.rollback();
            res.status(500).json({ success: false, message: 'Error executing SQL. Transaction rolled back.', error: err.message });
        }
    } catch (error) {
        console.error('Error establishing SQL connection:', error);
        res.status(500).json({ success: false, message: 'Error establishing SQL connection.', error: error.message });
    }
});


router.post('/update', async (req, res) => {
    const data = req.body;
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return res.status(400).json({ success: false, message: 'At least one entry is required' });
    }

    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const item of data) {
                const {
                    audit_result_id,
                    FactoryHead_choice,
                    FactoryHead_desc,
                    DeptManager_choice,
                    DeptManager_desc,
                    DivManager_choice,
                    DivManager_desc,
                } = item;

                await transaction.request()
                    .input('audit_result_id', sql.VarChar, audit_result_id)
                    .input('FactoryHead_choice', sql.Int, FactoryHead_choice)
                    .input('FactoryHead_desc', sql.NVarChar, FactoryHead_desc)
                    .input('DeptManager_choice', sql.Int, DeptManager_choice)
                    .input('DeptManager_desc', sql.NVarChar, DeptManager_desc)
                    .input('DivManager_choice', sql.Int, DivManager_choice)
                    .input('DivManager_desc', sql.NVarChar, DivManager_desc)
                    .query(`
                        UPDATE audit_result
                        SET
                            FactoryHead_choice = @FactoryHead_choice,
                            FactoryHead_desc = @FactoryHead_desc,
                            DeptManager_choice = @DeptManager_choice,
                            DeptManager_desc = @DeptManager_desc,
                            DivManager_choice = @DivManager_choice,
                            DivManager_desc = @DivManager_desc
                        WHERE audit_result_id = @audit_result_id;
                    `);
            }

            await transaction.commit();
            res.json({ success: true, message: 'Audit results updated successfully' });
        } catch (err) {
            console.error('Error executing SQL:', err);
            await transaction.rollback();
            res.status(500).json({ success: false, message: 'Error executing SQL. Transaction rolled back.', error: err.message });
        }
    } catch (error) {
        console.error('Error establishing SQL connection:', error);
        res.status(500).json({ success: false, message: 'Error establishing SQL connection.', error: error.message });
    }
});

module.exports = router;
