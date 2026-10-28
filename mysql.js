require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mysql = require('mysql');

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVariables = requiredVariables.filter((name) => process.env[name] === undefined);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

if (missingVariables.length > 0) {
    console.warn(`MySQL não testado: configure ${missingVariables.join(', ')} no .env.`);
} else {
    pool.getConnection((error, connection) => {
        if (error) {
            console.error('Erro ao conectar ao MySQL:', error.code || error.message);
            return;
        }

        console.log('Conexão com MySQL estabelecida.');
        connection.release();
    });
}

exports.pool = pool;
