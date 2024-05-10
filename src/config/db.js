// db.js
const mysql = require('mysql2/promise');
const dbConfig = require('./setting');

const mysqlConfig = {
    host: dbConfig.DB_HOST,
    user: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    database: dbConfig.DB_DATABASE,
    port: dbConfig.DB_PORT,
};

const pool = mysql.createPool({
    ...mysqlConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    debug: false,
});

module.exports = pool;
