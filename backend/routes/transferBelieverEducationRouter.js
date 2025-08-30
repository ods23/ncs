const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// 전입신자교육관리 데이터 조회
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
      LEFT JOIN new_comers_education nce ON nc.id = nce.new_comer_id
      WHERE nc.department = '새가족위원회'
        AND nc.believer_type = '전입신자'
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
    
    // 전입신자명 필터
    if (req.query.believer_name && req.query.believer_name.trim() !== '') {
      query += ` AND nc.name LIKE ?`;
      params.push(`%${req.query.believer_name.trim()}%`);
    }
    
    // 기본 정렬: 양육교사, 등록번호 오름차순
    query += ` ORDER BY nc.teacher ASC, COALESCE(nc.number, '') ASC`;
    
    const rows = await conn.query(query, params);
    
    console.log('=== 전입신자교육관리 조회 결과 ===');
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
      console.log('전입신자관리 파일 ID (nc.file_id):', firstRow.file_id);
      console.log('교육관리 파일 ID (education_file_id):', firstRow.education_file_id);
    }
    console.log('=== 로그 끝 ===');
    
    res.json(rows);
  } catch (error) {
    console.error('전입신자교육관리 조회 오류:', error);
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
        AND believer_type = '전입신자'
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

// 전입신자교육관리 데이터 생성
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
      INSERT INTO new_comers_education (
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
    console.error('전입신자교육관리 생성 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자교육관리 데이터 수정
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
      UPDATE new_comers_education SET
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
    console.error('전입신자교육관리 수정 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자교육관리용 교육 데이터 생성 또는 업데이트 (new_comer_id 기준)
router.put('/new-comer/:new_comer_id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const { new_comer_id } = req.params;
    const {
      teacher,
      name,
      believer_type,
      education_type,
      education_start_date,
      education_end_date,
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
    
    console.log('=== 전입신자교육관리 교육 데이터 생성/업데이트 시작 ===');
    console.log('new_comer_id:', new_comer_id);
    console.log('요청 데이터:', req.body);
    
    // 1. new_comers 테이블 업데이트 (등록번호 생성 로직 포함)
    if (teacher || name || believer_type || education_type || education_start_date || education_end_date) {
      console.log('1. new_comers 테이블 업데이트 시작');
      
      // 기존 데이터 조회
      const existingDataResult = await conn.query('SELECT * FROM new_comers WHERE id = ?', [new_comer_id]);
      
      if (existingDataResult.length === 0) {
        return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
      }
      
      const existingData = existingDataResult[0];
      console.log('기존 데이터:', existingData);
      
      // 신자구분 변경 확인 및 번호 처리
      const existingBelieverType = existingData.believer_type;
      const existingYear = existingData.year;
      const existingDepartment = existingData.department;
      let shouldReorderNumbers = false;
      let finalNumber = existingData.number;
      
      if (believer_type !== undefined && existingBelieverType !== believer_type) {
        console.log('신자구분 변경 감지');
        console.log('기존 신자구분:', existingBelieverType);
        console.log('새 신자구분:', believer_type);
        
        if (existingBelieverType === '전입신자' && believer_type === '초신자') {
          // 전입신자 → 초신자: 새로운 초신자 번호 생성
          console.log('전입신자 → 초신자 변경: 새로운 번호 생성');
          shouldReorderNumbers = true;
          
          // 년도에서 마지막 2자리 추출
          const yearSuffix = existingYear ? existingYear.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
          
          // 부서, 신자유형(초신자), 년도 기준으로 순번 조회
          const rowNumberQuery = `
            SELECT COUNT(*) as current_count
            FROM new_comers 
            WHERE department = ? AND believer_type = ? AND year = ?
          `;
          
          const rowNumberResult = await conn.query(rowNumberQuery, [existingDepartment, believer_type, existingYear]);
          const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
          const nextNumber = currentCount + 1;
          finalNumber = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
          
          console.log('초신자 현재 등록된 수:', currentCount);
          console.log('초신자 다음 순번:', nextNumber);
          console.log('초신자 생성된 번호:', finalNumber);
        } else if (existingBelieverType === '초신자' && believer_type === '전입신자') {
          // 초신자 → 전입신자: 새로운 전입신자 번호 생성
          console.log('초신자 → 전입신자 변경: 새로운 번호 생성');
          shouldReorderNumbers = true;
          
          // 년도에서 마지막 2자리 추출
          const yearSuffix = existingYear ? existingYear.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
          
          // 부서, 신자유형(전입신자), 년도 기준으로 순번 조회
          const rowNumberQuery = `
            SELECT COUNT(*) as current_count
            FROM new_comers 
            WHERE department = ? AND believer_type = ? AND year = ?
          `;
          
          const rowNumberResult = await conn.query(rowNumberQuery, [existingDepartment, believer_type, existingYear]);
          const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
          const nextNumber = currentCount + 1;
          finalNumber = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
          
          console.log('전입신자 현재 등록된 수:', currentCount);
          console.log('전입신자 다음 순번:', nextNumber);
          console.log('전입신자 생성된 번호:', finalNumber);
        }
      }
      
      // 부분 업데이트 - 제공된 필드만 업데이트
      const updateFields = [];
      const updateParams = [];
      
      if (teacher !== undefined) {
        updateFields.push('teacher = ?');
        updateParams.push(teacher);
      }
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateParams.push(name);
      }
      
      if (believer_type !== undefined) {
        updateFields.push('believer_type = ?');
        updateParams.push(believer_type);
      }
      
      if (education_type !== undefined) {
        updateFields.push('education_type = ?');
        updateParams.push(education_type);
      }
      
      if (education_start_date !== undefined) {
        updateFields.push('education_start_date = ?');
        updateParams.push(education_start_date);
      }
      
      if (education_end_date !== undefined) {
        updateFields.push('education_end_date = ?');
        updateParams.push(education_end_date);
      }
      
      // 신자구분이 변경된 경우 번호도 업데이트
      if (believer_type !== undefined && existingBelieverType !== believer_type) {
        updateFields.push('number = ?');
        updateParams.push(finalNumber);
      }
      
      // 업데이트할 필드가 없으면 에러
      if (updateFields.length === 0) {
        return res.status(400).json({ error: '업데이트할 데이터가 없습니다.' });
      }
      
      updateFields.push('updated_at = NOW()');
      updateParams.push(new_comer_id);
      
      const sql = `
        UPDATE new_comers SET
          ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      console.log('실행할 SQL:', sql);
      console.log('SQL 파라미터:', updateParams);
      
      const result = await conn.query(sql, updateParams);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
      }
      
      // 신자구분 변경으로 인한 번호 재정렬
      if (shouldReorderNumbers) {
        console.log('=== 번호 재정렬 시작 ===');
        
        // 전입신자 → 초신자 변경인 경우 전입신자 번호 재정렬
        if (existingBelieverType === '전입신자' && believer_type === '초신자') {
          console.log('전입신자 → 초신자 변경: 전입신자 번호 재정렬');
          try {
                         const reorderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/transfer-believer-education/reorder-numbers`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
              },
              body: JSON.stringify({
                year: existingYear,
                department: existingDepartment
              })
            });
            
            if (reorderResponse.ok) {
              const reorderData = await reorderResponse.json();
              console.log('전입신자 번호 재정렬 완료:', reorderData.message);
              console.log('재정렬된 전입신자 수:', reorderData.updatedCount);
            } else {
              console.error('전입신자 번호 재정렬 실패');
            }
          } catch (error) {
            console.error('전입신자 번호 재정렬 중 오류:', error);
          }
        }
        // 초신자 → 전입신자 변경인 경우 초신자 번호 재정렬
        else if (existingBelieverType === '초신자' && believer_type === '전입신자') {
          console.log('초신자 → 전입신자 변경: 초신자 번호 재정렬');
          try {
            const reorderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/new-comers/reorder-numbers`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
              },
              body: JSON.stringify({
                year: existingYear,
                department: existingDepartment
              })
            });
            
            if (reorderResponse.ok) {
              const reorderData = await reorderResponse.json();
              console.log('초신자 번호 재정렬 완료:', reorderData.message);
              console.log('재정렬된 초신자 수:', reorderData.updatedCount);
            } else {
              console.error('초신자 번호 재정렬 실패');
            }
          } catch (error) {
            console.error('초신자 번호 재정렬 중 오류:', error);
          }
        }
      }
      
      console.log('1. new_comers 테이블 업데이트 완료');
      
      // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 응답에 포함
      if (believer_type !== undefined && existingBelieverType !== believer_type) {
        res.locals.newRegistrationNumber = finalNumber;
        console.log('신자구분 변경으로 번호 업데이트:', finalNumber);
      }
    }
    
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
    
    // 2. 교육 데이터 생성 또는 업데이트
    const existingDataResult = await conn.query(
      'SELECT id FROM new_comers_education WHERE new_comer_id = ?', 
      [new_comer_id]
    );
    
    if (existingDataResult.length > 0) {
      // 기존 데이터가 있으면 업데이트
      console.log('2. 기존 교육 데이터 발견, 업데이트 진행');
      const educationId = existingDataResult[0].id;
      
                   const updateQuery = `
        UPDATE new_comers_education SET
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
      
      // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 응답에 포함
      const responseData = { message: '전입신자 교육 데이터가 성공적으로 업데이트되었습니다.' };
      if (res.locals.newRegistrationNumber) {
        responseData.newRegistrationNumber = res.locals.newRegistrationNumber;
      }
      
      res.json(responseData);
    } else {
      // 기존 데이터가 없으면 새로 생성
      console.log('2. 기존 교육 데이터 없음, 새로 생성');
      
                   const insertQuery = `
        INSERT INTO new_comers_education (
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
      
      // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 응답에 포함
      const responseData = { 
        id: insertResult.insertId,
        message: '전입신자 교육 데이터가 성공적으로 생성되었습니다.' 
      };
      if (res.locals.newRegistrationNumber) {
        responseData.newRegistrationNumber = res.locals.newRegistrationNumber;
      }
      
      res.status(201).json(responseData);
    }
  } catch (error) {
    console.error('=== 전입신자교육관리 교육 데이터 생성/업데이트 오류 ===');
    console.error('오류 메시지:', error.message);
    console.error('오류 스택:', error.stack);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자교육관리 데이터 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const { id } = req.params;
    
    const query = `DELETE FROM new_comers_education WHERE id = ?`;
    const [result] = await conn.query(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 교육 데이터를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '교육 데이터가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('전입신자교육관리 삭제 오류:', error);
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
        AND believer_type = '전입신자'
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

// 전입신자 번호 재정렬 API
router.post('/reorder-numbers', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department } = req.body;
    
    console.log('=== 전입신자 번호 재정렬 시작 ===');
    console.log('년도:', year);
    console.log('부서:', department);
    
    if (!year || !department) {
      return res.status(400).json({ error: '년도와 부서는 필수입니다.' });
    }
    
    conn = await pool.getConnection();
    
    // 트랜잭션 시작
    await conn.beginTransaction();
    
    try {
      // 해당 년도, 부서의 전입신자 목록 조회 (ID 순으로 정렬)
      const selectQuery = `
        SELECT id, name, number
        FROM new_comers 
        WHERE year = ? AND department = ? AND believer_type = '전입신자'
        ORDER BY id ASC
      `;
      
      const transferBelievers = await conn.query(selectQuery, [year, department]);
      
      console.log('재정렬 대상 전입신자 수:', transferBelievers.length);
      
      // 년도에서 마지막 2자리 추출
      const yearSuffix = year.toString().slice(-2);
      
      // 각 전입신자에 대해 순차적으로 번호 재할당
      for (let i = 0; i < transferBelievers.length; i++) {
        const transferBeliever = transferBelievers[i];
        const newNumber = `${yearSuffix}-${String(i + 1).padStart(3, '0')}`;
        
        console.log(`전입신자 ${transferBeliever.name}: ${transferBeliever.number} → ${newNumber}`);
        
        // 번호 업데이트
        await conn.query(
          'UPDATE new_comers SET number = ? WHERE id = ?',
          [newNumber, transferBeliever.id]
        );
      }
      
      // 트랜잭션 커밋
      await conn.commit();
      
      console.log('=== 전입신자 번호 재정렬 완료 ===');
      
      res.json({ 
        message: '전입신자 번호가 성공적으로 재정렬되었습니다.',
        updatedCount: transferBelievers.length
      });
      
    } catch (error) {
      // 트랜잭션 롤백
      await conn.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('전입신자 번호 재정렬 실패:', error);
    res.status(500).json({ error: '전입신자 번호 재정렬 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
