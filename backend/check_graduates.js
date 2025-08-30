const { pool } = require('./config/database');

async function checkGraduates() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    console.log('=== new_comers_graduates 테이블 구조 확인 ===');
    const [columns] = await conn.query('DESCRIBE new_comers_graduates');
    console.log('컬럼 목록:');
    columns.forEach(col => {
      console.log(`${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    console.log('\n=== 초신자 수료자 데이터 확인 ===');
    const [graduates] = await conn.query("SELECT COUNT(*) as count FROM new_comers_graduates WHERE believer_type = '초신자' AND education_type = '수료'");
    console.log(`초신자 수료자 수: ${graduates[0].count}`);
    
    if (graduates[0].count > 0) {
      const [sampleData] = await conn.query("SELECT * FROM new_comers_graduates WHERE believer_type = '초신자' AND education_type = '수료' LIMIT 3");
      console.log('샘플 데이터:');
      sampleData.forEach((item, index) => {
        console.log(`\n--- 샘플 ${index + 1} ---`);
        console.log('ID:', item.id);
        console.log('이름:', item.name);
        console.log('신자구분:', item.believer_type);
        console.log('교육구분:', item.education_type);
        console.log('수료번호:', item.graduate_number);
        console.log('new_comer_id:', item.new_comer_id);
      });
    }
    
    console.log('\n=== new_comers 테이블의 수료자 확인 ===');
    const [newComersGraduates] = await conn.query("SELECT COUNT(*) as count FROM new_comers WHERE believer_type = '초신자' AND education_type = '수료'");
    console.log(`new_comers 테이블의 초신자 수료자 수: ${newComersGraduates[0].count}`);
    
    if (newComersGraduates[0].count > 0) {
      const [sampleNewComers] = await conn.query("SELECT id, name, believer_type, education_type, number FROM new_comers WHERE believer_type = '초신자' AND education_type = '수료' LIMIT 3");
      console.log('new_comers 테이블 샘플 데이터:');
      sampleNewComers.forEach((item, index) => {
        console.log(`\n--- 샘플 ${index + 1} ---`);
        console.log('ID:', item.id);
        console.log('이름:', item.name);
        console.log('신자구분:', item.believer_type);
        console.log('교육구분:', item.education_type);
        console.log('등록번호:', item.number);
      });
    }
    
  } catch (error) {
    console.error('데이터베이스 확인 오류:', error);
  } finally {
    if (conn) conn.release();
    process.exit(0);
  }
}

checkGraduates();
