const pool = require('../../../config/db');
const express = require('express');
const router = express.Router();

router.get('/audit', async (req, res, next) => {
    try {
        const { plant_no } = req.query;
        const sql = `SELECT *
        FROM audit_result ar
        WHERE ar.PLANT_NO = ?
        AND ar.create_date >= CURDATE() - INTERVAL 7 DAY;`
        const parameter = [plant_no];
        const [rows] = await pool.query(sql, parameter);
        res.json(rows);
    } catch (error) {
        next(error);
    }
});




module.exports = router;