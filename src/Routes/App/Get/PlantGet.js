const { poolPromise } = require('../../../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const pool = await poolPromise; // Await the poolPromise to get the pool instance
        const result = await pool.request().query('SELECT * FROM plant'); // Use the request method to execute the query
        res.json(result.recordset); // Access the recordset to get the rows
    } catch (error) {
        next(error);
    }
});

router.get('/all', async (req, res, next) => {
    try {
        const pool = await poolPromise; // Await the poolPromise to get the pool instance
        const result = await pool.request().query(`
            SELECT DISTINCT p.*, 
                CASE 
                    WHEN ar.PLANT_NO IS NOT NULL THEN '1' 
                    ELSE '0' 
                END AS audit_status
            FROM plant p
            LEFT JOIN audit_result ar ON ar.PLANT_NO = p.PLANT_NO;
        `);
        res.json(result.recordset); // Access the recordset to get the rows
    } catch (error) {
        next(error);
    }
});

module.exports = router;
