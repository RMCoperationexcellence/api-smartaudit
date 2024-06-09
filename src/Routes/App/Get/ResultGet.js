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
                SELECT *
                FROM audit_result ar
                WHERE ar.PLANT_NO = @plant_no
                AND ar.create_date >= DATEADD(DAY, -7, GETDATE());
            `);

        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
