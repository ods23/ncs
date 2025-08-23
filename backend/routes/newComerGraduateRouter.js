const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { convertDateField, processExcelData } = require('../utils/excelUtils');

// 초신자 수료자 목록 조회 (조회 조건 포함) - 초신자만
router.get('/', async (req, res) => {
  try {
    const { year, name, believer_type, phone } = req.query;
    
    let query = `
      SELECT 
        id,
        graduate_number,
        print_count,
        department,
        believer_type,
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
        new_comer_id,
        created_at,
        updated_at
      FROM new_comers_graduates 
      WHERE believer_type = '초신자' AND education_type = '수료' AND department = '새가족위원회'
    `;
    
    const params = [];
    
    // 조회 조건 추가
    if (year && year.trim() !== '') {
      query += ' AND year = ?';
      params.push(year.trim());
    }
    
    if (name && name.trim() !== '') {
      query += ' AND name LIKE ?';
      params.push(`%${name.trim()}%`);
    }
    
    if (believer_type && believer_type.trim() !== '') {
      query += ' AND believer_type = ?';
      params.push(believer_type.trim());
    }
    
    if (phone && phone.trim() !== '') {
      query += ' AND phone LIKE ?';
      params.push(`%${phone.trim()}%`);
    }
    
    query += ' ORDER BY year ASC, department ASC, believer_type ASC, id ASC';
    
    console.log('초신자 수료자 조회 SQL:', query);
    console.log('초신자 수료자 조회 파라미터:', params);
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, params);
    conn.release();
    
    console.log('초신자 수료자 조회 결과 개수:', Array.isArray(results) ? results.length : results.length || 0);
    
    // 결과가 배열이 아닌 경우 배열로 변환
    const finalResults = Array.isArray(results) ? results : [results];
    
    // 수료번호가 DB에 있으면 그대로 사용, 없으면 null 유지
    const resultsWithGraduateNumber = finalResults.map((item) => {
      if (item.graduate_number && item.graduate_number.trim() !== '') {
        return item; // DB에 수료번호가 있으면 그대로 사용
      } else {
        return {
          ...item,
          graduate_number: null // DB에 수료번호가 없으면 null 유지
        };
      }
    });
    
    // ID 순서 확인을 위한 로그
    if (resultsWithGraduateNumber.length > 0) {
      console.log('첫 번째 레코드 ID:', resultsWithGraduateNumber[0].id);
      console.log('마지막 레코드 ID:', resultsWithGraduateNumber[resultsWithGraduateNumber.length - 1].id);
      console.log('수료번호 확인:', resultsWithGraduateNumber.slice(0, 5).map(item => ({ id: item.id, graduate_number: item.graduate_number })));
    }
    
    res.json(resultsWithGraduateNumber);
  } catch (error) {
    console.error('초신자 수료자 목록 조회 실패:', error);
    res.status(500).json({ error: '초신자 수료자 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 개별 초신자 수료자 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        id,
        print_count,
        department,
        believer_type,
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
        education_end_date,
        affiliation_org,
        belong,
        DATE_FORMAT(new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        identity_verified,
        prev_church,
        comment,
        new_comer_id,
        created_at,
        updated_at
      FROM new_comers_graduates 
      WHERE id = ? AND believer_type = '초신자'
    `;
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, [id]);
    conn.release();
    
    if (results.length === 0) {
      return res.status(404).json({ error: '초신자 수료자를 찾을 수 없습니다.' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('초신자 수료자 조회 실패:', error);
    res.status(500).json({ error: '초신자 수료자 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 초신자 수료자 추가
router.post('/', async (req, res) => {
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
      new_comer_id
    } = req.body;

    // 초신자 타입 강제 설정
    const finalBelieverType = '초신자';

    const query = `
      INSERT INTO new_comers_graduates (
        department, believer_type, education_type, year, name, gender, marital_status,
        birth_date, address, phone, teacher, register_date, education_start_date,
        education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, new_comer_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      department, finalBelieverType, education_type, year, name, gender, marital_status,
      birth_date, address, phone, teacher, register_date, education_start_date,
              education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, new_comer_id
    ];

    const conn = await pool.getConnection();
    const result = await conn.query(query, params);
    conn.release();

    res.json({ id: result.insertId, message: '초신자 수료자가 성공적으로 추가되었습니다.' });
  } catch (error) {
    console.error('초신자 수료자 추가 실패:', error);
    res.status(500).json({ error: '초신자 수료자 추가 중 오류가 발생했습니다.' });
  }
});

// 초신자 수료자 수정
router.put('/:id', async (req, res) => {
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
      comment
    } = req.body;

    // 초신자 타입 강제 설정
    const finalBelieverType = '초신자';

    const query = `
      UPDATE new_comers_graduates SET
        department = ?, believer_type = ?, education_type = ?, year = ?, name = ?,
        gender = ?, marital_status = ?, birth_date = ?, address = ?, phone = ?,
        teacher = ?, register_date = ?, education_start_date = ?, education_end_date = ?,
        affiliation_org = ?, belong = ?, new_life_strategy_date = ?, identity_verified = ?,
        prev_church = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '초신자'
    `;

    const params = [
      department, finalBelieverType, education_type, year, name, gender, marital_status,
      birth_date, address, phone, teacher, register_date, education_start_date,
      education_end_date, affiliation_org, belong, new_life_strategy_date,
      identity_verified, prev_church, comment, id
    ];

    const conn = await pool.getConnection();
    const result = await conn.query(query, params);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '초신자 수료자가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('초신자 수료자 수정 실패:', error);
    res.status(500).json({ error: '초신자 수료자 수정 중 오류가 발생했습니다.' });
  }
});

// 초신자 수료자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM new_comers_graduates WHERE id = ? AND believer_type = "초신자"', [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '초신자 수료자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('초신자 수료자 삭제 실패:', error);
    res.status(500).json({ error: '초신자 수료자 삭제 중 오류가 발생했습니다.' });
  }
});

// Excel 업로드 (초신자만)
router.post('/upload', async (req, res) => {
  try {
    const excelData = req.body;
    
    if (!Array.isArray(excelData) || excelData.length === 0) {
      return res.status(400).json({ error: '업로드할 데이터가 없습니다.' });
    }

    console.log('받은 엑셀 데이터:', excelData.length, '행');
    console.log('첫 번째 행 샘플:', excelData[0]);

    const conn = await pool.getConnection();
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
          graduate_number: processedRow['수료번호'] || processedRow.graduate_number,
          department: processedRow['부서'] || processedRow.department,
          believer_type: '초신자', // 강제로 초신자로 설정
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
          identity_verified: processedRow['본인인증'] || processedRow['본인확인'] || processedRow.identity_verified,
          prev_church: processedRow['전소속교회'] || processedRow.prev_church,
          comment: processedRow['기타'] || processedRow.comment,
          print_count: processedRow['출력횟수'] || processedRow.print_count || 0
        };
        
        console.log('매핑된 데이터:', mappedRow);
        
        // 필수 필드 검증
        if (!mappedRow.name) {
          const error = `${i + 1}행: 이름은 필수 항목입니다.`;
          errors.push(error);
          failCount++;
          continue;
        }

        const insertQuery = `
          INSERT INTO new_comers_graduates (
            graduate_number, department, believer_type, education_type, year, name, gender, marital_status,
            birth_date, address, phone, teacher, register_date, education_start_date,
            education_end_date, affiliation_org, belong, new_life_strategy_date,
            identity_verified, prev_church, comment, print_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const params = [
          mappedRow.graduate_number,
          mappedRow.department,
          mappedRow.believer_type,
          mappedRow.education_type,
          mappedRow.year,
          mappedRow.name,
          mappedRow.gender,
          mappedRow.marital_status,
          mappedRow.birth_date,
          mappedRow.address,
          mappedRow.phone,
          mappedRow.teacher,
          mappedRow.register_date,
          mappedRow.education_start_date,
          mappedRow.education_end_date,
          mappedRow.affiliation_org,
          mappedRow.belong,
          mappedRow.new_life_strategy_date,
          mappedRow.identity_verified,
          mappedRow.prev_church,
          mappedRow.comment,
          mappedRow.print_count
        ];

        await conn.query(insertQuery, params);
        successCount++;
      }

      await conn.commit();

      const result = {
        message: '초신자 수료자 Excel 업로드 완료',
        uploadedCount: successCount,
        failedCount: failCount,
        totalCount: excelData.length
      };

      if (errors.length > 0) {
        result.errors = errors.slice(0, 10); // 최대 10개 오류만 반환
      }

      console.log('업로드 결과:', result);
      res.json(result);

    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }

  } catch (error) {
    console.error('초신자 수료자 Excel 업로드 실패:', error);
    res.status(500).json({ 
      error: '초신자 수료자 Excel 업로드 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 출력 횟수 증가 (PATCH 방식)
router.patch('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE new_comers_graduates 
      SET print_count = print_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '초신자'
    `;

    const conn = await pool.getConnection();
    const result = await conn.query(query, [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '출력 횟수가 증가되었습니다.' });
  } catch (error) {
    console.error('출력 횟수 증가 실패:', error);
    res.status(500).json({ error: '출력 횟수 증가 중 오류가 발생했습니다.' });
  }
});

// 출력 횟수 증가 (POST 방식 - 프론트엔드 호환성)
router.post('/:id/print', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE new_comers_graduates 
      SET print_count = print_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '초신자'
    `;

    const conn = await pool.getConnection();
    const result = await conn.query(query, [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '초신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '출력 횟수가 증가되었습니다.' });
  } catch (error) {
    console.error('출력 횟수 증가 실패:', error);
    res.status(500).json({ error: '출력 횟수 증가 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
