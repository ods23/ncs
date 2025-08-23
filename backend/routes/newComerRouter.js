const express = require('express');
const { pool } = require('../config/database');
const XLSX = require('xlsx');
const { convertDateField, processExcelData } = require('../utils/excelUtils');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 초신자 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, name, education_type, phone, department } = req.query;
    
    conn = await pool.getConnection();
    
    let sql = `
      SELECT 
        id,
        department,
        '초신자' as believer_type,
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
      WHERE believer_type = '초신자' AND department = '새가족위원회'
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
    
    console.log('초신자 조회 SQL:', sql);
    console.log('초신자 조회 파라미터:', params);
    
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('초신자 목록 조회 실패:', error);
    res.status(500).json({ error: '초신자 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 개별 초신자 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await pool.getConnection();
    
    const sql = `
      SELECT 
        id,
        department,
        '초신자' as believer_type,
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
      WHERE id = ? AND believer_type = '초신자'
    `;
    
    const rows = await conn.query(sql, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('초신자 조회 실패:', error);
    res.status(500).json({ error: '초신자 정보를 가져오는 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자 생성
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

    // 부서, 신자유형, 년도를 기준으로 번호 생성
    const yearSuffix = year ? year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
    
    console.log('=== 초신자 번호 생성 시작 ===');
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
    const number = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
    
    console.log('현재 등록된 수:', currentCount);
    console.log('다음 순번:', nextNumber);
    console.log('생성된 번호:', number);
    console.log('=== 초신자 번호 생성 완료 ===');

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
      message: '초신자가 성공적으로 등록되었습니다.',
      number: number
    });
  } catch (error) {
    console.error('초신자 등록 실패:', error);
    res.status(500).json({ error: '초신자 등록 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자 수정
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
      number,
      file_id
    } = req.body;
    
    conn = await pool.getConnection();
    
    // 기존 데이터 조회 (신자구분 변경 확인용)
    const existingDataResult = await conn.query('SELECT believer_type, number FROM new_comers WHERE id = ?', [id]);
    const existingBelieverType = existingDataResult[0]?.believer_type;
    const originalNumber = existingDataResult[0]?.number;
    
    console.log('=== 초신자 수정 시작 ===');
    console.log('기존 신자구분:', existingBelieverType);
    console.log('새 신자구분:', believer_type);
    console.log('기존 번호:', originalNumber);
    console.log('요청 번호:', number);
    
    // 신자구분에 따른 번호 처리
    let finalNumber = number;
    let shouldReorderNumbers = false;
    
    if (existingBelieverType !== believer_type) {
      console.log('신자구분 변경 감지');
      
      if (existingBelieverType === '초신자' && believer_type === '전입신자') {
        // 초신자 → 전입신자: 새로운 전입신자 번호 생성
        console.log('초신자 → 전입신자 변경: 새로운 번호 생성');
        shouldReorderNumbers = true;
        
        // 년도에서 마지막 2자리 추출
        const yearSuffix = year ? year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
        
        // 부서, 신자유형(전입신자), 년도 기준으로 순번 조회
        const rowNumberQuery = `
          SELECT COUNT(*) as current_count
          FROM new_comers 
          WHERE department = ? AND believer_type = ? AND year = ?
        `;
        
        const rowNumberResult = await conn.query(rowNumberQuery, [department, believer_type, year]);
        const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
        const nextNumber = currentCount + 1;
        finalNumber = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
        
        console.log('전입신자 현재 등록된 수:', currentCount);
        console.log('전입신자 다음 순번:', nextNumber);
        console.log('전입신자 생성된 번호:', finalNumber);
      }
      // 전입신자 → 초신자 변경은 전입신자 추가에서 처리하므로 여기서는 고려하지 않음
    }
    
    // 날짜 필드가 빈 문자열이면 null로 변환, null이면 null로 유지
    const finalBirthDate = birth_date === '' ? null : birth_date;
    const finalRegisterDate = register_date === '' ? null : register_date;
    const finalEducationStartDate = education_start_date === '' ? null : education_start_date;
    const finalEducationEndDate = education_end_date === '' ? null : education_end_date;
    const finalNewLifeStrategyDate = new_life_strategy_date === '' ? null : new_life_strategy_date;

    const sql = `
      UPDATE new_comers SET
        department = ?, believer_type = ?, education_type = ?, year = ?, name = ?, 
        gender = ?, marital_status = ?, birth_date = ?, address = ?, phone = ?, 
        teacher = ?, register_date = ?, education_start_date = ?, education_end_date = ?, 
        affiliation_org = ?, belong = ?, new_life_strategy_date = ?, identity_verified = ?, 
        prev_church = ?, comment = ?, graduate_transfer_status = ?, number = ?, file_id = ?, 
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [
      department, believer_type, education_type, year, name, gender, marital_status,
      finalBirthDate, address, phone, teacher, finalRegisterDate, finalEducationStartDate,
      finalEducationEndDate, affiliation_org, belong, finalNewLifeStrategyDate,
      identity_verified, prev_church, comment, graduate_transfer_status, finalNumber, file_id, id
    ];
    
    const result = await conn.query(sql, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
    }
    
    // 초신자 → 전입신자 변경으로 인한 번호 재정렬
    if (shouldReorderNumbers) {
      console.log('=== 초신자 번호 재정렬 시작 ===');
      console.log('재정렬 대상 - 년도:', year, '부서:', department, '신자구분: 초신자');
      try {
        const reorderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/new-comers/reorder-numbers`, {
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
          console.log('초신자 번호 재정렬 완료:', reorderData.message);
          console.log('재정렬된 초신자 수:', reorderData.updatedCount);
        } else {
          console.error('초신자 번호 재정렬 실패');
        }
      } catch (error) {
        console.error('초신자 번호 재정렬 중 오류:', error);
      }
    }
    
    // 전입신자인 경우에만 새로운 번호를 응답에 포함
    const responseData = { message: '초신자 정보가 성공적으로 수정되었습니다.' };
    if (believer_type === '전입신자') {
      responseData.number = finalNumber;
      console.log('전입신자 응답에 새 번호 포함:', finalNumber);
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('초신자 수정 실패:', error);
    res.status(500).json({ error: '초신자 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자교육관리용 부분 수정 (기본정보만)
router.put('/:id/education', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const {
      teacher,
      name,
      believer_type,
      education_type,
      education_start_date,
      education_end_date
    } = req.body;
    
    conn = await pool.getConnection();
    
    console.log('=== 초신자교육관리 부분 수정 시작 ===');
    console.log('수정할 ID:', id);
    console.log('수정 데이터:', { teacher, name, believer_type, education_type, education_start_date, education_end_date });
    
    // 기존 데이터 조회
    const existingDataResult = await conn.query('SELECT * FROM new_comers WHERE id = ?', [id]);
    
    if (existingDataResult.length === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
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
      
      if (existingBelieverType === '초신자' && believer_type === '전입신자') {
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
      } else if (existingBelieverType === '전입신자' && believer_type === '초신자') {
        // 전입신자 → 초신자: 기존 초신자 번호로 복원
        console.log('전입신자 → 초신자 변경: 기존 번호 복원');
        // 기존 번호를 그대로 사용 (복원 로직은 복잡하므로 일단 기존 번호 유지)
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
    updateParams.push(id);
    
    const sql = `
      UPDATE new_comers SET
        ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    console.log('실행할 SQL:', sql);
    console.log('SQL 파라미터:', updateParams);
    
    const result = await conn.query(sql, updateParams);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
    }
    
    // 초신자 → 전입신자 변경으로 인한 번호 재정렬
    if (shouldReorderNumbers) {
      console.log('=== 초신자 번호 재정렬 시작 ===');
      console.log('재정렬 대상 - 년도:', existingYear, '부서:', existingDepartment, '신자구분: 초신자');
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
    
    console.log('=== 초신자교육관리 부분 수정 완료 ===');
    
    // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 응답에 포함
    const responseData = { message: '초신자 기본정보가 성공적으로 수정되었습니다.' };
    if (believer_type !== undefined && existingBelieverType !== believer_type) {
      responseData.number = finalNumber;
      console.log('신자구분 변경으로 번호 업데이트:', finalNumber);
    }
    
    res.json(responseData);
  } catch (error) {
    console.error('초신자교육관리 부분 수정 실패:', error);
    res.status(500).json({ error: '초신자교육관리 부분 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await pool.getConnection();
    
    // 초신자 정보 조회 (파일 ID, 년도, 부서 포함)
    const checkSql = 'SELECT education_type, file_id, year, department FROM new_comers WHERE id = ? AND believer_type = "초신자"';
    const checkResult = await conn.query(checkSql, [id]);
    
    if (checkResult.length === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
    }
    
    if (checkResult[0].education_type === '수료') {
      return res.status(400).json({ error: '수료된 초신자는 삭제할 수 없습니다.' });
    }
    
    const fileId = checkResult[0].file_id;
    
    // 트랜잭션 시작
    await conn.beginTransaction();
    
    try {
      // 초신자 삭제
      const deleteSql = 'DELETE FROM new_comers WHERE id = ? AND believer_type = "초신자"';
      const result = await conn.query(deleteSql, [id]);
      
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
      }
      
      // 파일이 연결되어 있으면 파일도 삭제
      if (fileId && fileId !== null && fileId !== undefined) {
        console.log('파일 ID 확인:', fileId);
        
        // 파일 정보 조회
        const fileSql = 'SELECT saved_path FROM new_comer_files WHERE id = ?';
        const fileResult = await conn.query(fileSql, [fileId]);
        
        console.log('파일 조회 결과:', fileResult);
        
        if (fileResult.length > 0) {
          const filePath = fileResult[0].saved_path;
          console.log('파일 경로:', filePath);
          
          // 실제 파일 삭제
          const fs = require('fs');
          const path = require('path');
          const fullPath = filePath; // saved_path는 이미 전체 경로를 포함하고 있음
          
          console.log('전체 파일 경로:', fullPath);
          
          try {
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
              console.log('실제 파일 삭제 완료:', fullPath);
            } else {
              console.log('파일이 존재하지 않음:', fullPath);
            }
          } catch (fileError) {
            console.error('실제 파일 삭제 실패:', fileError);
            // 파일 삭제 실패해도 DB 삭제는 계속 진행
          }
          
          // 파일 DB 레코드 삭제
          const deleteFileSql = 'DELETE FROM new_comer_files WHERE id = ?';
          await conn.query(deleteFileSql, [fileId]);
          console.log('파일 DB 레코드 삭제 완료:', fileId);
        } else {
          console.log('파일 DB에서 파일을 찾을 수 없음:', fileId);
        }
      } else {
        console.log('파일 ID가 없음:', fileId);
      }
      
      // 트랜잭션 커밋
      await conn.commit();
      
      // 초신자 삭제 후 번호 재정렬
      console.log('초신자 삭제 후 번호 재정렬 시작');
      try {
        const reorderResponse = await fetch(`${req.protocol}://${req.get('host')}/api/new-comers/reorder-numbers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': req.headers.authorization
          },
          body: JSON.stringify({
            year: checkResult[0].year,
            department: checkResult[0].department
          })
        });
        
        if (reorderResponse.ok) {
          const reorderData = await reorderResponse.json();
          console.log('초신자 번호 재정렬 완료:', reorderData.message);
        } else {
          console.error('초신자 번호 재정렬 실패');
        }
      } catch (error) {
        console.error('초신자 번호 재정렬 중 오류:', error);
      }
      
      res.json({ message: '초신자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('초신자 삭제 실패:', error);
    res.status(500).json({ error: '초신자 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자 통계 조회
router.get('/statistics/summary', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.query;
    
    conn = await pool.getConnection();
    
    let whereClause = "WHERE believer_type = '초신자'";
    const params = [];
    
    if (year && year.trim() !== '') {
      whereClause += ' AND year = ?';
      params.push(year);
    }
    
    const sql = `
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN education_type = '진행중' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN education_type = '수료' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN education_type = '중단' THEN 1 ELSE 0 END) as discontinued
      FROM new_comers
      ${whereClause}
    `;
    
    const rows = await conn.query(sql, params);
    res.json(rows[0]);
  } catch (error) {
    console.error('초신자 통계 조회 실패:', error);
    res.status(500).json({ error: '초신자 통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// Excel 업로드 (초신자만)
router.post('/upload', authenticateToken, async (req, res) => {
  let conn;
  try {
    const excelData = req.body;
    
    if (!Array.isArray(excelData) || excelData.length === 0) {
      return res.status(400).json({ error: '업로드할 데이터가 없습니다.' });
    }

    console.log('받은 엑셀 데이터:', excelData.length, '행');
    console.log('첫 번째 행 샘플:', excelData[0]);

    conn = await pool.getConnection();
    await conn.beginTransaction();

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    try {
      for (let i = 0; i < excelData.length; i++) {
        const row = excelData[i];
        
        // NFC 정규화 및 날짜 변환 적용
        const processedRow = processExcelData(row, ['생년월일', '등록신청일', '양육시작일', '교육시작일', '양육종료일', '교육기간', '새생명전략', 'birth_date', 'register_date', 'education_start_date', 'education_end_date', 'new_life_strategy_date']);
        
        // 한글 헤더와 영문 필드명 매핑
        const mappedRow = {
          department: processedRow['부서'] || processedRow.department,
          education_type: processedRow['교육'] || processedRow.education_type,
          year: processedRow['년도'] || processedRow.year,
          name: processedRow['이름'] || processedRow.name,
          gender: processedRow['성별'] || processedRow.gender,
          marital_status: processedRow['결혼'] || processedRow.marital_status,
          birth_date: convertDateField(processedRow['생년월일'] || processedRow.birth_date),
          address: processedRow['주소'] || processedRow.address,
          phone: processedRow['전화번호'] || processedRow['전화'] || processedRow.phone,
          teacher: processedRow['양육교사'] || processedRow['담당교사'] || processedRow.teacher,
          register_date: convertDateField(processedRow['등록신청일'] || processedRow.register_date),
          education_start_date: convertDateField(processedRow['양육시작일'] || processedRow['교육시작일'] || processedRow.education_start_date),
          education_end_date: convertDateField(processedRow['양육종료일'] || processedRow['교육기간'] || processedRow.education_end_date),
          affiliation_org: processedRow['편입기관'] || processedRow.affiliation_org,
          belong: processedRow['소속'] || processedRow.belong,
          new_life_strategy_date: convertDateField(processedRow['새생명전략'] || processedRow.new_life_strategy_date),
          identity_verified: processedRow['본인확인'] || processedRow.identity_verified || 0,
          prev_church: processedRow['이전교회'] || processedRow.prev_church || '',
          comment: processedRow['비고'] || processedRow.comment || '',
          graduate_transfer_status: processedRow['수료전송상태'] || processedRow.graduate_transfer_status || '전송대기',
          number: processedRow['번호'] || processedRow.number || null, // Excel에서 번호 값 사용
          file_id: null
        };

        // 필수 필드 검증
        if (!mappedRow.name || !mappedRow.department || !mappedRow.year) {
          errors.push(`행 ${i + 1}: 이름, 부서, 년도는 필수입니다.`);
          failCount++;
          continue;
        }

        // Excel에서 번호가 없으면 자동 생성
        let number = mappedRow.number;
        if (!number) {
          console.log(`행 ${i + 1}: 번호가 없어 자동 생성합니다.`);
          
          // 부서, 신자유형, 년도 기준으로 순번 조회
          const rowNumberQuery = `
            SELECT COUNT(*) as current_count
            FROM new_comers 
            WHERE department = ? AND believer_type = ? AND year = ?
          `;
          
          const rowNumberResult = await conn.query(rowNumberQuery, [mappedRow.department, '초신자', mappedRow.year]);
          
          const currentCount = parseInt(rowNumberResult[0]?.current_count) || 0;
          const nextNumber = currentCount + 1;
          const yearSuffix = mappedRow.year ? mappedRow.year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
          number = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
          
          console.log(`행 ${i + 1}: 자동 생성된 번호: ${number}`);
        } else {
          console.log(`행 ${i + 1}: Excel에서 가져온 번호: ${number}`);
        }

        const insertSql = `
          INSERT INTO new_comers (
            department, believer_type, education_type, year, name, gender, marital_status,
            birth_date, address, phone, teacher, register_date, education_start_date,
                    education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, graduate_transfer_status, number, file_id
          ) VALUES (?, '초신자', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [
          mappedRow.department, mappedRow.education_type, mappedRow.year,
          mappedRow.name, mappedRow.gender, mappedRow.marital_status, mappedRow.birth_date,
          mappedRow.address, mappedRow.phone, mappedRow.teacher, mappedRow.register_date,
          mappedRow.education_start_date, mappedRow.education_end_date, mappedRow.affiliation_org,
          mappedRow.belong, mappedRow.new_life_strategy_date, mappedRow.identity_verified,
          mappedRow.prev_church, mappedRow.comment, mappedRow.graduate_transfer_status,
          number, mappedRow.file_id
        ];
        
        await conn.query(insertSql, insertParams);
        successCount++;
      }
      
      await conn.commit();
      
      res.json({
        message: 'Excel 업로드가 완료되었습니다.',
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Excel 업로드 실패:', error);
    res.status(500).json({ error: 'Excel 업로드 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// Excel 다운로드
router.get('/download/excel', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department, education_type } = req.query;
    
    conn = await pool.getConnection();
    
    let sql = `
      SELECT 
        department as '부서',
        '초신자' as '신자구분',
        education_type as '교육구분',
        year as '년도',
        name as '이름',
        gender as '성별',
        marital_status as '결혼상태',
        DATE_FORMAT(birth_date, '%Y-%m-%d') as '생년월일',
        address as '주소',
        phone as '전화번호',
        teacher as '담당교사',
        DATE_FORMAT(register_date, '%Y-%m-%d') as '등록신청일',
        DATE_FORMAT(education_start_date, '%Y-%m-%d') as '교육시작일',
        DATE_FORMAT(education_end_date, '%Y-%m-%d') as '교육종료일',
        affiliation_org as '편입기관',
        belong as '소속',
        DATE_FORMAT(new_life_strategy_date, '%Y-%m-%d') as '새생명전략',
        identity_verified as '본인확인',
        prev_church as '이전교회',
        comment as '비고',
        graduate_transfer_status as '수료전송상태',
        number as '번호'
      FROM new_comers 
      WHERE believer_type = '초신자'
    `;
    
    const params = [];
    
    if (year && year.trim() !== '') {
      sql += ' AND year = ?';
      params.push(year);
    }
    
    if (department && department.trim() !== '') {
      sql += ' AND department = ?';
      params.push(department);
    }
    
    if (education_type && education_type.trim() !== '') {
      sql += ' AND education_type = ?';
      params.push(education_type);
    }
    
    sql += ' ORDER BY year DESC, department, name';
    
    const rows = await conn.query(sql, params);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '다운로드할 데이터가 없습니다.' });
    }
    
    // Excel 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    
    // 컬럼 너비 자동 조정
    const columnWidths = [];
    rows.forEach(row => {
      Object.keys(row).forEach((key, index) => {
        if (!columnWidths[index]) columnWidths[index] = 0;
        const cellLength = String(row[key]).length;
        columnWidths[index] = Math.max(columnWidths[index], cellLength);
      });
    });
    
    worksheet['!cols'] = columnWidths.map(width => ({ width: Math.min(width + 2, 50) }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, '초신자목록');
    
    // Excel 파일 생성
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 파일명 설정 (현재 날짜 포함)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `초신자목록_${dateStr}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Excel 다운로드 실패:', error);
    res.status(500).json({ error: 'Excel 다운로드 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 수료 전송 처리
router.post('/:id/graduate', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const graduateData = req.body;
    
    console.log('=== 수료 전송 요청 ===');
    console.log('초신자 ID:', id);
    console.log('전송 데이터:', graduateData);
    
    conn = await pool.getConnection();
    
    // 초신자 정보 조회
    const newComerResult = await conn.query('SELECT * FROM new_comers WHERE id = ?', [id]);
    const newComer = Array.isArray(newComerResult) ? newComerResult : newComerResult.rows || [];
    
    if (newComer.length === 0) {
      return res.status(404).json({ error: '초신자를 찾을 수 없습니다.' });
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
    
    // 초신자 상태를 수료로 변경
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

// 번호 생성 API (신자구분 변경 시 사용)
router.post('/generate-number', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { department, believer_type, year } = req.body;
    
    console.log('=== 번호 생성 요청 ===');
    console.log('부서:', department);
    console.log('신자:', believer_type);
    console.log('년도:', year);
    
    if (!department || !believer_type || !year) {
      return res.status(400).json({ error: '부서, 신자구분, 년도는 필수입니다.' });
    }
    
    conn = await pool.getConnection();
    
    // 년도에서 마지막 2자리 추출
    const yearSuffix = year ? year.toString().slice(-2) : new Date().getFullYear().toString().slice(-2);
    
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
    const number = `${yearSuffix}-${String(nextNumber).padStart(3, '0')}`;
    
    console.log('현재 등록된 수:', currentCount);
    console.log('다음 순번:', nextNumber);
    console.log('생성된 번호:', number);
    console.log('=== 번호 생성 완료 ===');
    
    res.json({ number: number });
  } catch (error) {
    console.error('번호 생성 실패:', error);
    res.status(500).json({ error: '번호 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 초신자 번호 재정렬 API
router.post('/reorder-numbers', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department } = req.body;
    
    console.log('=== 초신자 번호 재정렬 시작 ===');
    console.log('년도:', year);
    console.log('부서:', department);
    
    if (!year || !department) {
      return res.status(400).json({ error: '년도와 부서는 필수입니다.' });
    }
    
    conn = await pool.getConnection();
    
    // 트랜잭션 시작
    await conn.beginTransaction();
    
    try {
      // 해당 년도, 부서의 초신자 목록 조회 (ID 순으로 정렬)
      const selectQuery = `
        SELECT id, name, number
        FROM new_comers 
        WHERE year = ? AND department = ? AND believer_type = '초신자'
        ORDER BY id ASC
      `;
      
      const newComers = await conn.query(selectQuery, [year, department]);
      
      console.log('재정렬 대상 초신자 수:', newComers.length);
      
      // 년도에서 마지막 2자리 추출
      const yearSuffix = year.toString().slice(-2);
      
      // 각 초신자에 대해 순차적으로 번호 재할당
      for (let i = 0; i < newComers.length; i++) {
        const newComer = newComers[i];
        const newNumber = `${yearSuffix}-${String(i + 1).padStart(3, '0')}`;
        
        console.log(`초신자 ${newComer.name}: ${newComer.number} → ${newNumber}`);
        
        // 번호 업데이트
        await conn.query(
          'UPDATE new_comers SET number = ? WHERE id = ?',
          [newNumber, newComer.id]
        );
      }
      
      // 트랜잭션 커밋
      await conn.commit();
      
      console.log('=== 초신자 번호 재정렬 완료 ===');
      
      res.json({ 
        message: '초신자 번호가 성공적으로 재정렬되었습니다.',
        updatedCount: newComers.length
      });
      
    } catch (error) {
      // 트랜잭션 롤백
      await conn.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('초신자 번호 재정렬 실패:', error);
    res.status(500).json({ error: '초신자 번호 재정렬 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
