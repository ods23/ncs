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
    timezone: '+09:00'
});

async function checkTableStructure() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('✅ MariaDB 연결 성공!');

        // new_comers_files 테이블 구조 확인
        const structureResult = await conn.query('DESCRIBE new_comers_files');
        console.log('\n=== new_comers_files 테이블 구조 ===');
        console.table(structureResult);

        // CREATE TABLE 문 생성
        const createTableResult = await conn.query('SHOW CREATE TABLE new_comers_files');
        console.log('\n=== CREATE TABLE 문 ===');
        console.log(createTableResult[0]['Create Table']);

    } catch (err) {
        console.error('❌ 오류 발생:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

checkTableStructure();
