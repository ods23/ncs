const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { pool } = require('../config/database');

// 전입신자 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, name, education_type, phone, department } = req.query;
    
    conn = await pool.getConnection();
    
    let sql = `
      SELECT 
        id,
        department,
        '전입신자' as believer_type,
        education_type,
        year,
        name,
        gender,
        marital_status,
        DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
        address,
        phone,
        teacher,
        DATE_FORMAT(register_date, '%Y-%m-%d') as register_date,
        DATE_FORMAT(education_start_date, '%Y-%m-%d') as education_start_date,
        DATE_FORMAT(education_end_date, '%Y-%m-%d') as education_end_date,
        affiliation_org,
        belong,
        DATE_FORMAT(new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        identity_verified,
        prev_church,
        comment,
        graduate_transfer_status,
        number,
        file_id,
        created_at,
        updated_at
      FROM new_comers 
      WHERE believer_type = '전입신자' AND department = '새가족위원회'
    `;
    
    const params = [];
    
    // 부서 조건
    if (department && department.trim() !== '') {
      sql += ' AND department = ?';
      params.push(department);
    }
    
    // 년도 조건
    if (year && year.trim() !== '') {
      sql += ' AND year = ?';
      params.push(year);
    }
    
    // 이름 조건 (부분 검색)
    if (name && name.trim() !== '') {
      sql += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
    
    // 교육구분 조건
    if (education_type && education_type.trim() !== '') {
      sql += ' AND education_type = ?';
      params.push(education_type);
    }
    
    // 전화번호 조건 (부분 검색)
    if (phone && phone.trim() !== '') {
      sql += ' AND phone LIKE ?';
      params.push(`%${phone}%`);
    }
    
    sql += ' ORDER BY number ASC';
    
    console.log('전입신자 조회 SQL:', sql);
    console.log('전입신자 조회 파라미터:', params);
    
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('전입신자 목록 조회 실패:', error);
    res.status(500).json({ error: '전입신자 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const {
      department,
      believer_type,
      education_type,
      year,
      name,
      gender,
      marital_status,
      birth_date,
      address,
      phone,
      teacher,
      register_date,
      education_start_date,
      education_end_date,
      affiliation_org,
      belong,
      new_life_strategy_date,
      identity_verified,
      prev_church,
      comment,
      graduate_transfer_status,
      file_id
    } = req.body;
    
    conn = await pool.getConnection();
    
    // 날짜 필드가 빈 문자열이면 null로 변환, null이면 null로 유지
    const finalBirthDate = birth_date === '' ? null : birth_date;
    const finalRegisterDate = register_date === '' ? null : register_date;
    const finalEducationStartDate = education_start_date === '' ? null : education_start_date;
    const finalEducationEndDate = education_end_date === '' ? null : education_end_date;
    const finalNewLifeStrategyDate = new_life_strategy_date === '' ? null : new_life_strategy_date;

    // 사용자가 직접 번호를 입력한 경우 해당 번호 사용, 아니면 자동 생성
    let number;
    if (req.body.number && req.body.number.trim() !== '') {
      number = req.body.number.trim();
      console.log('사용자가 직접 번호를 입력했습니다:', number);
    } else {
      // 부서, 신자유형, 년도를 기준으로 번호 생성
      const yearSuffix = year ? year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
      
      console.log('=== 전입신자 번호 생성 시작 ===');
      console.log('년도:', year);
      console.log('부서:', department);
      console.log('신자:', believer_type);
      console.log('년도 접미사:', yearSuffix);
      
      // 부서, 신자유형, 년도 기준으로 순번 조회
      const rowNumberQuery = `
        SELECT COUNT(*) as current_count
        FROM new_comers 
        WHERE department = ? AND believer_type = ? AND year = ?
      `;
      
      console.log('순번 조회 쿼리:', rowNumberQuery);
      console.log('조회 파라미터:', [department, believer_type, year]);
      
      const rowNumberResult = await conn.query(rowNumberQuery, [department, believer_type, year]);
      
      console.log('순번 조회 결과:', rowNumberResult);
      
      const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
      const nextNumber = currentCount + 1;
      number = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
      
      console.log('현재 등록된 수:', currentCount);
      console.log('다음 순번:', nextNumber);
      console.log('생성된 번호:', number);
      console.log('=== 전입신자 번호 생성 완료 ===');
    }

    const sql = `
      INSERT INTO new_comers (
        department, believer_type, education_type, year, name, gender, marital_status,
        birth_date, address, phone, teacher, register_date, education_start_date,
        education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, graduate_transfer_status, number, file_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      department, believer_type, education_type, year, name, gender, marital_status,
      finalBirthDate, address, phone, teacher, finalRegisterDate, finalEducationStartDate,
      finalEducationEndDate, affiliation_org, belong, finalNewLifeStrategyDate,
      identity_verified, prev_church, comment, graduate_transfer_status, number, file_id
    ];
    
    const result = await conn.query(sql, params);
    
    res.status(201).json({
      id: result.insertId,
      message: '전입신자가 성공적으로 등록되었습니다.',
      number: number
    });
  } catch (error) {
    console.error('전입신자 등록 실패:', error);
    res.status(500).json({ error: '전입신자 등록 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const {
      department,
      believer_type,
      education_type,
      year,
      name,
      gender,
      marital_status,
      birth_date,
      address,
      phone,
      teacher,
      register_date,
      education_start_date,
      education_end_date,
      affiliation_org,
      belong,
      new_life_strategy_date,
      identity_verified,
      prev_church,
      comment,
      graduate_transfer_status,
      file_id
    } = req.body;
    
    conn = await pool.getConnection();
    
    // 날짜 필드가 빈 문자열이면 null로 변환, null이면 null로 유지
    const finalBirthDate = birth_date === '' ? null : birth_date;
    const finalRegisterDate = register_date === '' ? null : register_date;
    const finalEducationStartDate = education_start_date === '' ? null : education_start_date;
    const finalEducationEndDate = education_end_date === '' ? null : education_end_date;
    const finalNewLifeStrategyDate = new_life_strategy_date === '' ? null : new_life_strategy_date;

    // 기존 데이터 조회
    const existingQuery = `SELECT believer_type, education_type, number FROM new_comers WHERE id = ?`;
    const existingResult = await conn.query(existingQuery, [id]);
    
    if (existingResult.length === 0) {
      return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
    }
    
    const existing = existingResult[0];
    let number = existing.number;
    
    // 사용자가 직접 번호를 변경한 경우 해당 번호 사용
    if (req.body.number && req.body.number.trim() !== '' && req.body.number !== existing.number) {
      number = req.body.number.trim();
      console.log('사용자가 번호를 변경했습니다:', existing.number, '→', number);
    }
    // 신자구분이나 교육구분이 변경된 경우 번호 재생성
    else if (existing.believer_type !== believer_type || existing.education_type !== education_type) {
      // 부서, 신자유형, 년도를 기준으로 번호 생성
      const yearSuffix = year ? year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
      
      // 부서, 신자유형, 년도 기준으로 순번 조회 (현재 ID 제외)
      const rowNumberQuery = `
        SELECT COUNT(*) as current_count
        FROM new_comers 
        WHERE department = ? AND believer_type = ? AND year = ? AND id != ?
      `;
      
      const rowNumberResult = await conn.query(rowNumberQuery, [department, believer_type, year, id]);
      const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
      const nextNumber = currentCount + 1;
      number = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
    }
    
    const sql = `
      UPDATE new_comers SET
        department = ?, believer_type = ?, education_type = ?, year = ?, name = ?, 
        gender = ?, marital_status = ?, birth_date = ?, address = ?, phone = ?, 
        teacher = ?, register_date = ?, education_start_date = ?, education_end_date = ?, 
        affiliation_org = ?, belong = ?, new_life_strategy_date = ?, identity_verified = ?, 
        prev_church = ?, comment = ?, graduate_transfer_status = ?, number = ?, file_id = ?
      WHERE id = ?
    `;
    
    const params = [
      department, believer_type, education_type, year, name, gender, marital_status,
      finalBirthDate, address, phone, teacher, finalRegisterDate, finalEducationStartDate,
      finalEducationEndDate, affiliation_org, belong, finalNewLifeStrategyDate,
      identity_verified, prev_church, comment, graduate_transfer_status, number, file_id, id
    ];
    
    const result = await conn.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
    }
    
    // 전입신자 → 초신자 변경으로 인한 번호 재정렬
    if (existing.believer_type === '전입신자' && believer_type === '초신자') {
      console.log('=== 전입신자 번호 재정렬 시작 ===');
      console.log('재정렬 대상 - 년도:', year, '부서:', department, '신자구분: 전입신자');
      try {
        const reorderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/transfer-believers/reorder-numbers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          body: JSON.stringify({
            year: year,
            department: department
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
    
    // 초신자인 경우에만 새로운 번호를 응답에 포함
    const responseData = { message: '전입신자가 성공적으로 수정되었습니다.' };
    if (believer_type === '초신자') {
      responseData.number = number;
      console.log('초신자 응답에 새 번호 포함:', number);
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('전입신자 수정 실패:', error);
    res.status(500).json({ error: '전입신자 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await pool.getConnection();
    
    // 수료자인지 확인
    const checkQuery = `SELECT education_type FROM new_comers WHERE id = ?`;
    const checkResult = await conn.query(checkQuery, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
    }
    
    if (checkResult[0].education_type === '수료') {
      return res.status(400).json({ error: '수료자는 삭제할 수 없습니다.' });
    }
    
    const query = `DELETE FROM new_comers WHERE id = ?`;
    const [result] = await conn.query(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '전입신자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('전입신자 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전입신자 수료 처리
router.post('/:id/graduate', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const graduateData = req.body;
    
    console.log('=== 수료 전송 요청 ===');
    console.log('전입신자 ID:', id);
    console.log('전송 데이터:', graduateData);
    
    conn = await pool.getConnection();
    
    // 전입신자 정보 조회
    const transferBelieverResult = await conn.query('SELECT * FROM new_comers WHERE id = ?', [id]);
    const transferBeliever = Array.isArray(transferBelieverResult) ? transferBelieverResult : transferBelieverResult.rows || [];
    
    if (transferBeliever.length === 0) {
      return res.status(404).json({ error: '전입신자를 찾을 수 없습니다.' });
    }
    
    // 수료번호 생성 (년도, 부서, 신자 기준으로 순번 매기기)
    const year = graduateData.year || new Date().getFullYear().toString();
    const shortYear = year.slice(-2); // 년도의 마지막 2자리
    
    console.log('=== 수료번호 생성 시작 ===');
    console.log('년도:', year);
    console.log('부서:', graduateData.department);
    console.log('신자:', graduateData.believer_type);
    
    // 같은 년도, 부서, 신자에서 최대 순번 조회
    const maxNumberQuery = `
      SELECT COUNT(*) as max_num
      FROM new_comers_graduates 
      WHERE year = ? AND department = ? AND believer_type = ?
    `;
    
    console.log('최대 순번 조회 쿼리:', maxNumberQuery);
    console.log('조회 파라미터:', [year, graduateData.department, graduateData.believer_type]);
    
    const maxNumberResult = await conn.query(maxNumberQuery, [
      year,
      graduateData.department,
      graduateData.believer_type
    ]);
    
    console.log('최대 순번 조회 결과:', maxNumberResult);
    
    let currentMax = 0;
    
    if (maxNumberResult && maxNumberResult.length > 0) {
      currentMax = parseInt(maxNumberResult[0].max_num);
      console.log('현재 최대 순번 (DB에서 조회):', currentMax, '타입:', typeof currentMax);
    }
    
    const nextNumber = currentMax + 1;
    const graduateNumber = `${shortYear}-${String(nextNumber).padStart(3, '0')}`;
    
    console.log('현재 최대 순번:', currentMax);
    console.log('다음 순번:', nextNumber);
    console.log('생성된 수료번호:', graduateNumber);
    console.log('=== 수료번호 생성 완료 ===');
    
    // 수료자 테이블에 데이터 삽입
    const insertQuery = `
      INSERT INTO new_comers_graduates (
        graduate_number, department, believer_type, education_type, year, name, gender, marital_status,
        birth_date, address, phone, teacher, register_date, education_start_date,
        education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, new_comer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      graduateNumber,
      graduateData.department,
      graduateData.believer_type,
      graduateData.education_type,
      graduateData.year,
      graduateData.name,
      graduateData.gender,
      graduateData.marital_status,
      graduateData.birth_date,
      graduateData.address,
      graduateData.phone,
      graduateData.teacher,
      graduateData.register_date,
      graduateData.education_start_date,
      graduateData.education_end_date,
      graduateData.affiliation_org,
      graduateData.belong,
      graduateData.new_life_strategy_date,
      graduateData.identity_verified,
      graduateData.prev_church,
      graduateData.comment,
      id
    ];
    
    const insertResult = await conn.query(insertQuery, insertValues);
    const result = Array.isArray(insertResult) ? insertResult : insertResult.rows || [];
    
    // 전입신자 상태를 수료로 변경
    await conn.query(
      'UPDATE new_comers SET education_type = ?, graduate_transfer_status = ? WHERE id = ?',
      ['수료', '전송완료', id]
    );
    
    const insertId = insertResult.insertId || (Array.isArray(insertResult) ? insertResult[0]?.insertId : null);
    
    res.status(201).json({
      message: '수료 전송이 완료되었습니다.',
      graduateId: insertId,
      graduateNumber: graduateNumber
    });
  } catch (error) {
    console.error('수료 전송 실패:', error);
    res.status(500).json({ error: '수료 전송 중 오류가 발생했습니다.' });
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
