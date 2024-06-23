const { sql, poolPromise } = require('../../../config/db');
const express = require('express');
const router = express.Router();

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
