const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const pool = require('./src/config/db');  // Importing pool from db.js
const auditFormRoutes = require('./src/Routes/App/Get/AuditformGet');
const auditLogin = require('./src/Auth/Login');
const PlantRoutes = require('./src/Routes/App/Get/PlantGet');
const auditPostRoutes = require('./src/Routes/App/Post/AuditForm');
const ResultGets = require('./src/Routes/App/Get/ResultGet');
const figlet = require('figlet');
const ADMicrosoft = require('./src/Auth/ADMicrosoft');
const userExamRoutes = require('./src/Routes/RMCOP/userExam')
const plantENVRoutes = require('./src/Routes/RMCOP/plantENV');
const plantSafetyRoutes = require('./src/Routes/RMCOP/plantSafety');
const app = express();
const port = 3001;
const host = process.env.HOST_IP;

const dotenv = require('dotenv');
dotenv.config();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

const logAsciiArt = (text) => {
    figlet(text, (err, data) => {
        if (err) {
            console.log('Something went wrong...');
            console.dir(err);
            return;
        }
        console.log(data);
    });
};

logAsciiArt('SERVER   is   RUNNING' );



app.get('/auditType', async (req, res, next) => {
    try {
        const [rows] = await pool.query('SELECT * FROM audit_type');
        res.json(rows);
    } catch (error) {
        next(error);
    }
});

app.get('/AuditQuestion', async (req, res, next) => {
    try {
        // Get the audit_group from the query string
        const { audit_group } = req.query;

        // Check if the audit_group parameter is provided
        if (!audit_group) {
            res.status(400).json({ error: "Audit group parameter is required" });
            return;
        }

        // Execute the query with the audit_group parameter
        const [rows] = await pool.query(`
            SELECT *
            FROM audit_question
            WHERE AUDIT_GROUP_ID = ?
        `, [audit_group]);

        // Return the result as JSON
        res.json(rows);
    } catch (error) {
        // Forward errors to the error-handling middleware
        next(error);
    }
});


app.use('/userEXAM', userExamRoutes);
app.use('/auditPostForm', auditPostRoutes);
app.use('/auditForm', auditFormRoutes);
app.use('/login', auditLogin);
app.use('/plantList', PlantRoutes);
app.use('/results', ResultGets);
app.use('/plantENV', plantENVRoutes);
app.use('/plantSafety', plantSafetyRoutes);
// app.use('/authenticate', ADMicrosoft);


app.get('/getUserId', async (req, res) => {
    try {
        const { username } = req.user; // คำขอจะต้องมีข้อมูลผู้ใช้ที่ยืนยันแล้ว
        const result = await db.query('SELECT USER_ID FROM users WHERE USERNAME = ?', [username]);
        const userId = result[0].USER_ID;
        res.json({ userId });
    } catch (error) {
        console.error('Failed to get user ID:', error);
        res.status(500).json({ error: 'Failed to get user ID' });
    }
});

app.get('/AuditResultForm', async (req, res, next) => {
    try {
        const { audit_group_id, audit_type_id, audit_id, plant_no } = req.query;

        if (!audit_group_id || !audit_type_id || !audit_id || !plant_no) {
            res.status(400).json({ error: "Required parameters are missing" });
            return;
        }

        const [rows] = await pool.query(`
            SELECT
                AUDIT_GROUP_ID,
                AUDIT_TYPE_ID,
                AUDIT_ID,
                PLANT_NO,
                QUESTION_ID,
                CHOICE_NO
            FROM audit_result
            WHERE
                AUDIT_GROUP_ID = ?
                AND AUDIT_TYPE_ID = ?
                AND AUDIT_ID = ?
                AND PLANT_NO = ?
        `, [audit_group_id, audit_type_id, audit_id, plant_no]);

        res.json(rows); 
    } catch (error) {
        next(error); // Forward errors to the error-handling middleware
    }
});


app.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
