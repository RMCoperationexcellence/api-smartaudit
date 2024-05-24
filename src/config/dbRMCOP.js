// dbRMCOP.js
const mysql = require('mysql2/promise');
const { Client } = require('ssh2');
const dbConfig = require('./setting');

// Create SSH tunnel
const sshConfig = {
    host: '110.170.60.48',
    port: 2222,
    username: 'cpacssh',
    password: 'cpacP@ssADw0rdM1n'
};

const forwardConfig = {
    srcHost: '127.0.0.1',
    srcPort: 3308,
    dstHost: '192.168.1.56',
    dstPort: 3306
};

const mysqlConfig = {
    host: '127.0.0.1',
    port: 3308,
    user: 'devfortest',
    password: 'k$uuDh^CHKE6',
    database: 'rop'
};

async function createSSHConnection() {
    return new Promise((resolve, reject) => {
        const client = new Client();
        client.on('ready', () => {
            console.log('SSH Connection Ready');
            client.forwardOut(
                forwardConfig.srcHost,
                forwardConfig.srcPort,
                forwardConfig.dstHost,
                forwardConfig.dstPort,
                (err, stream) => {
                    if (err) {
                        console.error('Error in forwarding port:', err);
                        reject(err);
                    } else {
                        console.log('Port forwarding successful');
                        resolve({ client, stream });
                    }
                }
            );
        }).on('error', (err) => {
            console.error('SSH Connection Error:', err);
            reject(err);
        }).connect(sshConfig);
    });
}

async function createMySQLPool() {
    try {
        const { stream } = await createSSHConnection();
        const pool = mysql.createPool({
            ...mysqlConfig,
            stream
        });
        return pool;
    } catch (error) {
        console.error('Failed to create MySQL pool:', error);
        throw error;
    }
}

module.exports = createMySQLPool;
