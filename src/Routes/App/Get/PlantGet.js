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




module.exports = router;