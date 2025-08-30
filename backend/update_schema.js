const mariadb = require('mariadb');
const fs = require('fs');
const path = require('path');

const pool = mariadb.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'insa119!!',
    database: 'nodejsweb_db',
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

async function updateSchema() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('✅ MariaDB 연결 성공!');

        // 모든 테이블 목록 조회
        const tablesResult = await conn.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'nodejsweb_db' 
            ORDER BY TABLE_NAME
        `);
        
        console.log('현재 데이터베이스의 테이블 목록:');
        tablesResult.forEach(table => console.log('- ' + table.TABLE_NAME));

        let newSchema = `-- NCS Database Schema
-- Generated on: ${new Date().toISOString()}
-- Database: nodejsweb_db

`;

        // 각 테이블의 CREATE TABLE 문 생성
        for (const table of tablesResult) {
            const tableName = table.TABLE_NAME;
            console.log(`\n처리 중: ${tableName}`);
            
            const createTableResult = await conn.query(`SHOW CREATE TABLE ${tableName}`);
            const createTableSql = createTableResult[0]['Create Table'];
            
            newSchema += `-- ${tableName} table\n`;
            newSchema += createTableSql + ';\n\n';
        }

        // 기본 데이터 삽입
        newSchema += `-- 기본 데이터 삽입\n`;

        // s_users_seq 데이터
        const usersSeqResult = await conn.query('SELECT * FROM s_users_seq');
        if (usersSeqResult.length > 0) {
            newSchema += `-- s_users_seq 데이터\n`;
            newSchema += `INSERT INTO s_users_seq (id, seq) VALUES ${usersSeqResult.map(row => `(${row.id}, ${row.seq})`).join(', ')};\n\n`;
        }

        // code_groups 데이터
        const codeGroupsResult = await conn.query('SELECT * FROM code_groups');
        if (codeGroupsResult.length > 0) {
            newSchema += `-- code_groups 데이터\n`;
            codeGroupsResult.forEach(group => {
                newSchema += `INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES `;
                newSchema += `(${group.id}, '${group.group_name}', ${group.group_description ? `'${group.group_description}'` : 'NULL'}, `;
                newSchema += `${group.department ? `'${group.department}'` : 'NULL'}, ${group.is_active}, ${group.sort_order}, `;
                newSchema += `'${group.created_at}', '${group.updated_at}');\n`;
            });
            newSchema += '\n';
        }

        // code_details 데이터
        const codeDetailsResult = await conn.query('SELECT * FROM code_details');
        if (codeDetailsResult.length > 0) {
            newSchema += `-- code_details 데이터\n`;
            codeDetailsResult.forEach(detail => {
                newSchema += `INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES `;
                newSchema += `(${detail.id}, ${detail.group_id}, '${detail.code_value}', '${detail.code_name}', `;
                newSchema += `${detail.code_description ? `'${detail.code_description}'` : 'NULL'}, ${detail.sort_order}, ${detail.is_active}, `;
                newSchema += `'${detail.created_at}', '${detail.updated_at}');\n`;
            });
            newSchema += '\n';
        }

        // schema.sql 파일에 저장
        const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
        fs.writeFileSync(schemaPath, newSchema, 'utf8');
        
        console.log(`\n✅ schema.sql 업데이트 완료!`);
        console.log(`파일 위치: ${schemaPath}`);

    } catch (err) {
        console.error('❌ 오류 발생:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

updateSchema();
