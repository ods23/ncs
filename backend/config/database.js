const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nodejsweb_db',
    charset: 'utf8',
    collation: 'utf8_unicode_ci',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    bigIntAsNumber: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    timezone: '+09:00' // 한국 시간대 설정
});

// 데이터베이스 연결 테스트
async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('✅ MariaDB 연결 성공!');
    } catch (err) {
        console.error('❌ MariaDB 연결 실패:', err);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = { pool, testConnection }; 