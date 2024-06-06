// db.js
const sql = require('mssql');
const dbConfig = require('./setting');

const sqlConfig = {
    user: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
    database: dbConfig.DB_DATABASE,
    server: dbConfig.DB_HOST,
    port: parseInt(dbConfig.DB_PORT, 10), // Ensure port is a number
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        trustServerCertificate: true // Change to true for local dev / self-signed certs
    }
};

const poolPromise = sql.connect(sqlConfig).then(pool => {
    console.log('Connected to SQL Server');
    return pool;
}).catch(err => {
    console.error('Database Connection Failed! Bad Config: ', err);
    throw err;
});

module.exports = {
    sql, poolPromise
};


