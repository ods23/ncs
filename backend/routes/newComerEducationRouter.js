const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// 초신자교육관리 데이터 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    let query = `
      SELECT 
        nc.id,
        nc.teacher,
        nc.name as believer_name,
        nc.believer_type,
        nc.education_type,
        nc.number as registration_number,
        DATE_FORMAT(nc.register_date, '%Y-%m-%d') as registration_date,
        DATE_FORMAT(nc.education_start_date, '%Y-%m-%d') as education_start_date,
        nc.year,
        DATE_FORMAT(nce.week1_date, '%Y-%m-%d') as week1_date,
        DATE_FORMAT(nce.week2_date, '%Y-%m-%d') as week2_date,
        DATE_FORMAT(nce.week3_date, '%Y-%m-%d') as week3_date,
        DATE_FORMAT(nce.week4_date, '%Y-%m-%d') as week4_date,
        DATE_FORMAT(nce.week5_date, '%Y-%m-%d') as week5_date,
        DATE_FORMAT(nce.week6_date, '%Y-%m-%d') as week6_date,
        DATE_FORMAT(nce.week7_date, '%Y-%m-%d') as week7_date,
        DATE_FORMAT(nce.week8_date, '%Y-%m-%d') as week8_date,
        nce.week1_comment,
        nce.week2_comment,
        nce.week3_comment,
        nce.week4_comment,
        nce.week5_comment,
        nce.week6_comment,
        nce.week7_comment,
        nce.week8_comment,
        nce.overall_comment,
        nce.file_id as education_file_id,
        nc.file_id,
        nc.created_at,
        nc.updated_at
      FROM new_comers nc
      LEFT JOIN new_comer_education nce ON nc.id = nce.new_comer_id
      WHERE nc.department = '새가족위원회'
        AND nc.believer_type = '초신자'
    `;
    
    const params = [];
    
    // 년도 필터
    if (req.query.year && req.query.year.trim() !== '') {
      query += ` AND nc.year = ?`;
      params.push(parseInt(req.query.year.trim()));
    } else {
      // 년도가 지정되지 않은 경우 현재 년도로 기본 설정
      const currentYear = new Date().getFullYear();
      query += ` AND nc.year = ?`;
      params.push(currentYear);
    }
    
    // 교육구분 필터
    if (req.query.education_type && req.query.education_type.trim() !== '') {
      query += ` AND nc.education_type = ?`;
      params.push(req.query.education_type.trim());
    }
    
    // 양육교사명 필터
    if (req.query.teacher && req.query.teacher.trim() !== '') {
      query += ` AND nc.teacher LIKE ?`;
      params.push(`%${req.query.teacher.trim()}%`);
    }
    
    // 초신자명 필터
    if (req.query.believer_name && req.query.believer_name.trim() !== '') {
      query += ` AND nc.name LIKE ?`;
      params.push(`%${req.query.believer_name.trim()}%`);
    }
    
    // 기본 정렬: 양육교사, 등록신청일 오름차순
    query += ` ORDER BY nc.teacher ASC, nc.register_date ASC`;
    
    const rows = await conn.query(query, params);
    
    console.log('=== 초신자교육관리 조회 결과 ===');
    console.log('1. 실행된 SQL 쿼리:', query);
    console.log('2. 쿼리 파라미터:', params);
    console.log('3. 조회된 행 수:', rows.length);
    console.log('4. 데이터 타입:', typeof rows);
    console.log('5. 배열 여부:', Array.isArray(rows));
    console.log('6. 전체 데이터:', rows);
    console.log('7. 모든 행의 ID:', rows.map(row => row.id));
    console.log('8. 모든 행의 teacher:', rows.map(row => row.teacher));
    console.log('9. 모든 행의 believer_name:', rows.map(row => row.believer_name));
    console.log('10. 모든 행의 year:', rows.map(row => row.year));
    
    // 주차별 데이터 상세 로그
    if (rows.length > 0) {
      console.log('=== 첫 번째 행의 주차별 데이터 ===');
      const firstRow = rows[0];
      console.log('week1_date:', firstRow.week1_date);
      console.log('week2_date:', firstRow.week2_date);
      console.log('week3_date:', firstRow.week3_date);
      console.log('week4_date:', firstRow.week4_date);
      console.log('week5_date:', firstRow.week5_date);
      console.log('week6_date:', firstRow.week6_date);
      console.log('week7_date:', firstRow.week7_date);
      console.log('week8_date:', firstRow.week8_date);
      console.log('week1_comment:', firstRow.week1_comment);
      console.log('week2_comment:', firstRow.week2_comment);
      console.log('week3_comment:', firstRow.week3_comment);
      console.log('week4_comment:', firstRow.week4_comment);
      console.log('week5_comment:', firstRow.week5_comment);
      console.log('week6_comment:', firstRow.week6_comment);
      console.log('week7_comment:', firstRow.week7_comment);
      console.log('week8_comment:', firstRow.week8_comment);
      console.log('overall_comment:', firstRow.overall_comment);
      console.log('=== 파일 정보 ===');
      console.log('초신자관리 파일 ID (nc.file_id):', firstRow.file_id);
      console.log('교육관리 파일 ID (education_file_id):', firstRow.education_file_id);
    }
    console.log('=== 로그 끝 ===');
    
    res.json(rows);
  } catch (error) {
    console.error('초신자교육관리 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 사용 가능한 년도 목록 조회
router.get('/years', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const query = `
      SELECT DISTINCT year 
      FROM new_comers 
      WHERE department = '새가족위원회' 
        AND believer_type = '초신자'
        AND year IS NOT NULL
      ORDER BY year DESC
    `;
    
    const rows = await conn.query(query);
    const years = rows.map(row => row.year);
    
    res.json(years);
  } catch (error) {
    console.error('년도 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자교육관리 데이터 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const {
      new_comer_id,
      week1_date,
      week2_date,
      week3_date,
      week4_date,
      week5_date,
      week6_date,
      week7_date,
      week8_date,
      week1_comment,
      week2_comment,
      week3_comment,
      week4_comment,
      week5_comment,
      week6_comment,
      week7_comment,
      week8_comment,
      overall_comment
    } = req.body;
    
    const query = `
      INSERT INTO new_comer_education (
        new_comer_id,
        week1_date,
        week2_date,
        week3_date,
        week4_date,
        week5_date,
        week6_date,
        week7_date,
        week8_date,
        week1_comment,
        week2_comment,
        week3_comment,
        week4_comment,
        week5_comment,
        week6_comment,
        week7_comment,
        week8_comment,
        overall_comment,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    const params = [
      new_comer_id,
      week1_date,
      week2_date,
      week3_date,
      week4_date,
      week5_date,
      week6_date,
      week7_date,
      week8_date,
      week1_comment,
      week2_comment,
      week3_comment,
      week4_comment,
      week5_comment,
      week6_comment,
      week7_comment,
      week8_comment,
      overall_comment
    ];
    
    const [result] = await conn.query(query, params);
    
    res.status(201).json({ 
      id: result.insertId,
      message: '교육 데이터가 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('초신자교육관리 생성 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자교육관리 데이터 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const { id } = req.params;
    const {
      new_comer_id,
      week1_date,
      week2_date,
      week3_date,
      week4_date,
      week5_date,
      week6_date,
      week7_date,
      week8_date,
      week1_comment,
      week2_comment,
      week3_comment,
      week4_comment,
      week5_comment,
      week6_comment,
      week7_comment,
      week8_comment,
      overall_comment,
      file_id
    } = req.body;
    
    const query = `
      UPDATE new_comer_education SET
        new_comer_id = ?,
        week1_date = ?,
        week2_date = ?,
        week3_date = ?,
        week4_date = ?,
        week5_date = ?,
        week6_date = ?,
        week7_date = ?,
        week8_date = ?,
        week1_comment = ?,
        week2_comment = ?,
        week3_comment = ?,
        week4_comment = ?,
        week5_comment = ?,
        week6_comment = ?,
        week7_comment = ?,
        week8_comment = ?,
        overall_comment = ?,
        file_id = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [
      new_comer_id,
      week1_date,
      week2_date,
      week3_date,
      week4_date,
      week5_date,
      week6_date,
      week7_date,
      week8_date,
      week1_comment,
      week2_comment,
      week3_comment,
      week4_comment,
      week5_comment,
      week6_comment,
      week7_comment,
      week8_comment,
      overall_comment,
      file_id,
      id
    ];
    
    const [result] = await conn.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 교육 데이터를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '교육 데이터가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('초신자교육관리 수정 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자교육관리용 교육 데이터 생성 또는 업데이트 (new_comer_id 기준)
router.put('/new-comer/:new_comer_id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const { new_comer_id } = req.params;
    const {
      week1_date,
      week2_date,
      week3_date,
      week4_date,
      week5_date,
      week6_date,
      week7_date,
      week8_date,
      week1_comment,
      week2_comment,
      week3_comment,
      week4_comment,
      week5_comment,
      week6_comment,
      week7_comment,
      week8_comment,
      overall_comment,
      file_id
    } = req.body;
    
    console.log('=== 초신자교육관리 교육 데이터 생성/업데이트 시작 ===');
    console.log('new_comer_id:', new_comer_id);
    console.log('요청 데이터:', req.body);
    
    // 빈 문자열을 null로 변환하는 함수
    const convertEmptyToNull = (value) => {
      return value === '' || value === null || value === undefined ? null : value;
    };
    
    // 날짜 필드들을 null로 변환
    const processedData = {
      week1_date: convertEmptyToNull(week1_date),
      week2_date: convertEmptyToNull(week2_date),
      week3_date: convertEmptyToNull(week3_date),
      week4_date: convertEmptyToNull(week4_date),
      week5_date: convertEmptyToNull(week5_date),
      week6_date: convertEmptyToNull(week6_date),
      week7_date: convertEmptyToNull(week7_date),
      week8_date: convertEmptyToNull(week8_date),
      week1_comment: convertEmptyToNull(week1_comment),
      week2_comment: convertEmptyToNull(week2_comment),
      week3_comment: convertEmptyToNull(week3_comment),
      week4_comment: convertEmptyToNull(week4_comment),
      week5_comment: convertEmptyToNull(week5_comment),
      week6_comment: convertEmptyToNull(week6_comment),
      week7_comment: convertEmptyToNull(week7_comment),
      week8_comment: convertEmptyToNull(week8_comment),
      overall_comment: convertEmptyToNull(overall_comment)
    };
    
    console.log('처리된 데이터:', processedData);
    
    // 기존 교육 데이터 확인
    const existingDataResult = await conn.query(
      'SELECT id FROM new_comer_education WHERE new_comer_id = ?', 
      [new_comer_id]
    );
    
    if (existingDataResult.length > 0) {
      // 기존 데이터가 있으면 업데이트
      console.log('기존 교육 데이터 발견, 업데이트 진행');
      const educationId = existingDataResult[0].id;
      
                   const updateQuery = `
        UPDATE new_comer_education SET
          week1_date = ?,
          week2_date = ?,
          week3_date = ?,
          week4_date = ?,
          week5_date = ?,
          week6_date = ?,
          week7_date = ?,
          week8_date = ?,
          week1_comment = ?,
          week2_comment = ?,
          week3_comment = ?,
          week4_comment = ?,
          week5_comment = ?,
          week6_comment = ?,
          week7_comment = ?,
          week8_comment = ?,
          overall_comment = ?,
          file_id = ?
        WHERE id = ?
      `;
      
                   const updateParams = [
        processedData.week1_date,
        processedData.week2_date,
        processedData.week3_date,
        processedData.week4_date,
        processedData.week5_date,
        processedData.week6_date,
        processedData.week7_date,
        processedData.week8_date,
        processedData.week1_comment,
        processedData.week2_comment,
        processedData.week3_comment,
        processedData.week4_comment,
        processedData.week5_comment,
        processedData.week6_comment,
        processedData.week7_comment,
        processedData.week8_comment,
        processedData.overall_comment,
        file_id,
        educationId
      ];
      
      console.log('업데이트 쿼리:', updateQuery);
      console.log('업데이트 파라미터:', updateParams);
      
      const updateResult = await conn.query(updateQuery, updateParams);
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: '교육 데이터 업데이트에 실패했습니다.' });
      }
      
      console.log('=== 교육 데이터 업데이트 완료 ===');
      res.json({ message: '교육 데이터가 성공적으로 업데이트되었습니다.' });
    } else {
      // 기존 데이터가 없으면 새로 생성
      console.log('기존 교육 데이터 없음, 새로 생성');
      
                   const insertQuery = `
        INSERT INTO new_comer_education (
          new_comer_id,
          week1_date,
          week2_date,
          week3_date,
          week4_date,
          week5_date,
          week6_date,
          week7_date,
          week8_date,
          week1_comment,
          week2_comment,
          week3_comment,
          week4_comment,
          week5_comment,
          week6_comment,
          week7_comment,
          week8_comment,
          overall_comment,
          file_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
                   const insertParams = [
        new_comer_id,
        processedData.week1_date,
        processedData.week2_date,
        processedData.week3_date,
        processedData.week4_date,
        processedData.week5_date,
        processedData.week6_date,
        processedData.week7_date,
        processedData.week8_date,
        processedData.week1_comment,
        processedData.week2_comment,
        processedData.week3_comment,
        processedData.week4_comment,
        processedData.week5_comment,
        processedData.week6_comment,
        processedData.week7_comment,
        processedData.week8_comment,
        processedData.overall_comment,
        file_id
      ];
      
      console.log('생성 쿼리:', insertQuery);
      console.log('생성 파라미터:', insertParams);
      
      const insertResult = await conn.query(insertQuery, insertParams);
      
      console.log('=== 교육 데이터 생성 완료 ===');
      res.status(201).json({ 
        id: insertResult.insertId,
        message: '교육 데이터가 성공적으로 생성되었습니다.' 
      });
    }
  } catch (error) {
    console.error('=== 초신자교육관리 교육 데이터 생성/업데이트 오류 ===');
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자교육관리 데이터 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const { id } = req.params;
    
    const query = `DELETE FROM new_comer_education WHERE id = ?`;
    const [result] = await conn.query(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 교육 데이터를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '교육 데이터가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('초신자교육관리 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 양육교사 목록 조회
router.get('/teachers', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const query = `
      SELECT DISTINCT teacher 
      FROM new_comers 
      WHERE department = '새가족위원회' 
        AND believer_type = '초신자'
        AND teacher IS NOT NULL 
        AND teacher != ''
      ORDER BY teacher ASC
    `;
    
    const [rows] = await conn.query(query);
    
    res.json(rows.map(row => row.teacher));
  } catch (error) {
    console.error('양육교사 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
