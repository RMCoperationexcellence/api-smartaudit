const pool = require('../../../config/db');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res, next) => {
    
    try {
        const { plant_no } = req.query;
        const [rows] = await pool.query('SELECT * FROM plant LIMIT 10');
        res.json(rows);
    } catch (error) {
        next(error);
    }
});


router.get('/all', async (req, res, next) => {
    
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT p.*, 
       CASE 
           WHEN ar.PLANT_NO IS NOT NULL THEN '1' 
           ELSE '0' 
       END AS audit_status
FROM plant p
LEFT JOIN audit_result ar ON ar.PLANT_NO = p.PLANT_NO;`
        );
        res.json(rows);
    } catch (error) {
        next(error);
    }
});



module.exports = router;