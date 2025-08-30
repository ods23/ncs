const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

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

async function addUsers() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('✅ MariaDB 연결 성공!');

        // SQL 파일 읽기
        const sqlPath = path.join(__dirname, 'database', 'add_users.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // SQL 문장들을 분리하여 실행
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`총 ${statements.length}개의 SQL 문장을 실행합니다...`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await conn.query(statement);
                    console.log(`✅ SQL 문장 ${i + 1} 실행 성공`);
                } catch (err) {
                    console.error(`❌ SQL 문장 ${i + 1} 실행 실패:`, err.message);
                }
            }
        }

        console.log('🎉 사용자 추가 완료!');

    } catch (err) {
        console.error('❌ 데이터베이스 연결 실패:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

addUsers();
