const { poolPromise } = require('../../../config/db'); // Import the poolPromise correctly
const express = require('express');
const router = express.Router();
const sql = require('mssql'); // Import the sql module from mssql

router.get('/', async (req, res, next) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`SELECT * FROM plant p WHERE p.LAT NOT LIKE '%NULL%' AND p.COMPCODE = 130`);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

router.get('/Master', async (req, res, next) => {
    const { DivNo, DeptNo, SectNo } = req.query;
    try {
        const pool = await poolPromise;
        const request = pool.request();

        if (DivNo) {
            request.input('divNo', sql.Int, DivNo);
        }
        if (DeptNo) {
            request.input('DeptNo', sql.Int, DeptNo);
        }
        if (SectNo) {
            request.input('SectNo', sql.Int, SectNo);
        }

        let query = `
            SELECT DISTINCT d.*
            FROM division d
        `;

        if (DivNo) {
            query = `
                SELECT DISTINCT ll.DEPT_NO, d2.NAME
                FROM location_lnk ll
                LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
                LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
                LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
                WHERE ll.DIVISION_NO = @DivNo
                AND d2.NAME IS NOT NULL;
            `;
        }

        if (DivNo && DeptNo){
            query = `
            SELECT DISTINCT ll.SECT_NO, s.NAME
            FROM location_lnk ll
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            WHERE ll.DIVISION_NO = @DivNo AND ll.DEPT_NO = @DeptNo
            AND d2.NAME IS NOT NULL            
            `;
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});


router.get('/PlantData', async (req, res, next) => {
    const { DivNo, DeptNo, SectNo } = req.query;
    try {
        const pool = await poolPromise;
        const request = pool.request();

        if (DivNo) {
            request.input('divNo', sql.Int, DivNo);
        }
        if (DeptNo) {
            request.input('DeptNo', sql.Int, DeptNo);
        }                                                    
        if (SectNo) {
            request.input('SectNo', sql.Int, SectNo);
        }


        if (DivNo) {
            query = `
                SELECT DISTINCT ll.PLANT_NO, p.NAME
                FROM location_lnk ll
                LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
                LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
                LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
                LEFT JOIN plant p ON p.PLANT_NO = ll.PLANT_NO
                WHERE ll.DIVISION_NO = @DivNo
                AND d2.NAME IS NOT NULL;
            `;
        }

        if (DivNo && DeptNo){
            query = `
            SELECT DISTINCT ll.PLANT_NO, p.NAME
            FROM location_lnk ll
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            LEFT JOIN plant p ON p.PLANT_NO = ll.PLANT_NO
            WHERE ll.DIVISION_NO = @DivNo AND ll.DEPT_NO = @DeptNo
            AND d2.NAME IS NOT NULL            
            `;
        }

        if (DivNo && DeptNo && SectNo){
            query = `
            SELECT DISTINCT ll.PLANT_NO, p.NAME
            FROM location_lnk ll
            LEFT JOIN division d ON d.DIVISION_NO = ll.DIVISION_NO
            LEFT JOIN department d2 ON d2.DEPT_NO = ll.DEPT_NO
            LEFT JOIN [section] s ON s.SECT_NO = ll.SECT_NO
            LEFT JOIN plant p ON p.PLANT_NO = ll.PLANT_NO
            WHERE ll.DIVISION_NO = @DivNo AND ll.DEPT_NO = @DeptNo AND ll.SECT_NO = @SectNo
            AND d2.NAME IS NOT NULL            
            `;
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
