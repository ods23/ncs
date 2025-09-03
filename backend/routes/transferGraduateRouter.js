const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { convertDateField } = require('../utils/excelUtils');

// 전입신자 수료자 목록 조회 (조회 조건 포함) - 전입신자만
router.get('/', async (req, res) => {
  try {
    const { year, name, believer_type, phone } = req.query;
    
    let query = `
      SELECT 
        tg.id,
        tg.graduate_number,
        tg.print_count,
        tg.department,
        tg.believer_type,
        tg.education_type,
        tg.year,
        tg.name,
        tg.gender,
        tg.marital_status,
        DATE_FORMAT(tg.birth_date, '%Y-%m-%d') as birth_date,
        tg.address,
        tg.phone,
        tg.teacher,
        DATE_FORMAT(tg.register_date, '%Y-%m-%d') as register_date,
        DATE_FORMAT(tg.education_start_date, '%Y-%m-%d') as education_start_date,
        tg.education_end_date,
        tg.affiliation_org,
        tg.belong,
        DATE_FORMAT(tg.new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        tg.identity_verified,
        tg.prev_church,
        tg.comment,
        tg.new_comer_id,
        tg.created_at,
        tg.updated_at,
        tb.file_id
      FROM new_comers_graduates tg
      LEFT JOIN new_comers tb ON tg.new_comer_id = tb.id
      WHERE tg.believer_type = '전입신자' AND tg.education_type = '수료' AND tg.department = '새가족위원회'
    `;
    
    const params = [];
    
    // 조회 조건 추가 - year 파라미터를 양육종료일자의 년도와 비교
    if (year && typeof year === 'string' && year.trim() !== '') {
      query += ' AND YEAR(tg.education_end_date) = ?';
      params.push(year.trim());
    }
    
    if (name && typeof name === 'string' && name.trim() !== '') {
      query += ' AND name LIKE ?';
      params.push(`%${name.trim()}%`);
    }
    
    if (phone && typeof phone === 'string' && phone.trim() !== '') {
      query += ' AND phone LIKE ?';
      params.push(`%${phone.trim()}%`);
    }
    
    query += ' ORDER BY id ASC';
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, params);
    conn.release();
    
    // 결과가 배열이 아닌 경우 배열로 변환
    const finalResults = Array.isArray(results) ? results : [results];
    
    res.json(finalResults);
  } catch (error) {
    console.error('전입신자 수료자 목록 조회 실패:', error);
    res.status(500).json({ error: '전입신자 수료자 목록을 가져오는 중 오류가 발생했습니다.' });
  }
});

// 개별 전입신자 수료자 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        tg.id,
        tg.graduate_number,
        tg.print_count,
        tg.department,
        tg.believer_type,
        tg.education_type,
        tg.year,
        tg.name,
        tg.gender,
        tg.marital_status,
        DATE_FORMAT(tg.birth_date, '%Y-%m-%d') as birth_date,
        tg.address,
        tg.phone,
        tg.teacher,
        DATE_FORMAT(tg.register_date, '%Y-%m-%d') as register_date,
        DATE_FORMAT(tg.education_start_date, '%Y-%m-%d') as education_start_date,
        tg.education_end_date,
        tg.affiliation_org,
        tg.belong,
        DATE_FORMAT(tg.new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        tg.identity_verified,
        tg.prev_church,
        tg.comment,
        tg.new_comer_id,
        tg.created_at,
        tg.updated_at,
        tb.file_id
      FROM new_comers_graduates tg
      LEFT JOIN new_comers tb ON tg.new_comer_id = tb.id
      WHERE tg.id = ? AND tg.believer_type = '전입신자'
    `;
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, [id]);
    conn.release();
    
    if (results.length === 0) {
      return res.status(404).json({ error: '전입신자 수료자를 찾을 수 없습니다.' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('전입신자 수료자 조회 실패:', error);
    res.status(500).json({ error: '전입신자 수료자 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 전입신자 수료자 추가
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

    // 전입신자 타입 강제 설정
    const finalBelieverType = '전입신자';

    // 수료번호 생성 (년도, 부서, 신자 기준으로 순번 매기기)
    const yearForNumber = year || new Date().getFullYear().toString();
    const shortYear = yearForNumber.slice(-2); // 년도의 마지막 2자리
    
    // 같은 년도, 부서, 신자에서 최대 순번 조회
    const maxNumberQuery = `
      SELECT COUNT(*) as max_num
      FROM new_comers_graduates 
      WHERE year = ? AND department = ? AND believer_type = ?
    `;
    
    let conn;
    try {
      conn = await pool.getConnection();
      const maxNumberResult = await conn.query(maxNumberQuery, [yearForNumber, department, finalBelieverType]);
      
      let currentMax = 0;
      if (maxNumberResult && maxNumberResult.length > 0) {
        currentMax = parseInt(maxNumberResult[0].max_num);
      }
      
      const nextNumber = currentMax + 1;
      const graduateNumber = `${shortYear}-${String(nextNumber).padStart(3, '0')}`;

      const query = `
        INSERT INTO new_comers_graduates (
          graduate_number, department, believer_type, education_type, year, name, gender, marital_status,
          birth_date, address, phone, teacher, register_date, education_start_date,
          education_end_date, affiliation_org, belong, new_life_strategy_date,
          identity_verified, prev_church, comment, new_comer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        graduateNumber, department, finalBelieverType, education_type, year, name, gender, marital_status,
        birth_date, address, phone, teacher, register_date, education_start_date,
        education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, new_comer_id
      ];

      const result = await conn.query(query, params);
      res.json({ id: result.insertId, message: '전입신자 수료자가 성공적으로 추가되었습니다.' });
    } catch (error) {
      console.error('전입신자 수료자 추가 실패:', error);
      res.status(500).json({ error: '전입신자 수료자 추가 중 오류가 발생했습니다.' });
    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error('전입신자 수료자 추가 실패:', error);
    res.status(500).json({ error: '전입신자 수료자 추가 중 오류가 발생했습니다.' });
  }
});

// 전입신자 수료자 수정
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

    // 전입신자 타입 강제 설정
    const finalBelieverType = '전입신자';

    const query = `
      UPDATE new_comers_graduates SET
        department = ?, believer_type = ?, education_type = ?, year = ?, name = ?,
        gender = ?, marital_status = ?, birth_date = ?, address = ?, phone = ?,
        teacher = ?, register_date = ?, education_start_date = ?, education_end_date = ?,
        affiliation_org = ?, belong = ?, new_life_strategy_date = ?, identity_verified = ?,
        prev_church = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '전입신자'
    `;

    const params = [
      department, finalBelieverType, education_type, year, name, gender, marital_status,
      birth_date, address, phone, teacher, register_date, education_start_date,
      education_end_date, affiliation_org, belong, new_life_strategy_date,
      identity_verified, prev_church, comment, id
    ];

    let conn;
    try {
      conn = await pool.getConnection();
      const result = await conn.query(query, params);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: '전입신자 수료자를 찾을 수 없습니다.' });
      }

      res.json({ message: '전입신자 수료자가 성공적으로 수정되었습니다.' });
    } catch (error) {
      console.error('전입신자 수료자 수정 실패:', error);
      res.status(500).json({ error: '전입신자 수료자 수정 중 오류가 발생했습니다.' });
    } finally {
      if (conn) conn.release();
    }
  } catch (error) {
    console.error('전입신자 수료자 수정 실패:', error);
    res.status(500).json({ error: '전입신자 수료자 수정 중 오류가 발생했습니다.' });
  }
});

// 전입신자 수료자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM new_comers_graduates WHERE id = ? AND believer_type = "전입신자"', [id]);
    conn.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '전입신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '전입신자 수료자가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('전입신자 수료자 삭제 실패:', error);
    res.status(500).json({ error: '전입신자 수료자 삭제 중 오류가 발생했습니다.' });
  }
});

// Excel 업로드 (전입신자만)
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
        
        // 한글 헤더와 영문 필드명 매핑
        const mappedRow = {
          department: row['부서'] || row.department,
          believer_type: '전입신자', // 강제로 전입신자로 설정
          education_type: row['교육'] || row.education_type,
          year: row['년도'] || row.year,
          name: row['이름'] || row.name,
          gender: row['성별'] || row.gender,
          marital_status: row['결혼'] || row.marital_status,
          birth_date: convertDateField(row['생년월일'] || row.birth_date),
          address: row['주소'] || row.address,
          phone: row['전화번호'] || row['전화'] || row.phone,
          teacher: row['양육교사'] || row['담당교사'] || row.teacher,
          register_date: convertDateField(row['등록신청일'] || row.register_date),
          education_start_date: convertDateField(row['양육시작일'] || row['교육시작일'] || row.education_start_date),
          education_end_date: convertDateField(row['양육종료일'] || row['교육기간'] || row.education_end_date),
          affiliation_org: row['편입기관'] || row.affiliation_org,
          belong: row['소속'] || row.belong,
          new_life_strategy_date: convertDateField(row['새생명전략'] || row.new_life_strategy_date),
          identity_verified: row['본인인증'] || row['본인확인'] || row.identity_verified,
          prev_church: row['전소속교회'] || row.prev_church,
          comment: row['기타'] || row.comment,
          print_count: row['출력횟수'] || row.print_count || 0
        };
        
        // 수료번호 생성 (년도, 부서, 신자 기준으로 순번 매기기)
        const yearForNumber = mappedRow.year || new Date().getFullYear().toString();
        const shortYear = yearForNumber.slice(-2); // 년도의 마지막 2자리
        
        // 같은 년도, 부서, 신자에서 최대 순번 조회
        const maxNumberQuery = `
          SELECT COUNT(*) as max_num
          FROM new_comers_graduates 
          WHERE year = ? AND department = ? AND believer_type = ?
        `;
        
        const maxNumberResult = await conn.query(maxNumberQuery, [yearForNumber, mappedRow.department, mappedRow.believer_type]);
        
        let currentMax = 0;
        if (maxNumberResult && maxNumberResult.length > 0) {
          currentMax = parseInt(maxNumberResult[0].max_num);
        }
        
        const nextNumber = currentMax + 1;
        const graduateNumber = `${shortYear}-${String(nextNumber).padStart(3, '0')}`;
        
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
          graduateNumber,
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
        message: '전입신자 수료자 Excel 업로드 완료',
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
    console.error('전입신자 수료자 Excel 업로드 실패:', error);
    res.status(500).json({ 
      error: '전입신자 수료자 Excel 업로드 중 오류가 발생했습니다.',
      details: error.message 
    });
  }
});

// 출력 횟수 증가 (PATCH 방식)
router.patch('/:id/print', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    const query = `
      UPDATE new_comers_graduates 
      SET print_count = print_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '전입신자'
    `;

    conn = await pool.getConnection();
    const result = await conn.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '전입신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '출력 횟수가 증가되었습니다.' });
  } catch (error) {
    console.error('출력 횟수 증가 실패:', error);
    res.status(500).json({ error: '출력 횟수 증가 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 출력 횟수 증가 (POST 방식 - 프론트엔드 호환성)
router.post('/:id/print', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;

    const query = `
      UPDATE new_comers_graduates 
      SET print_count = print_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND believer_type = '전입신자'
    `;

    conn = await pool.getConnection();
    const result = await conn.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '전입신자 수료자를 찾을 수 없습니다.' });
    }

    res.json({ message: '출력 횟수가 증가되었습니다.' });
  } catch (error) {
    console.error('출력 횟수 증가 실패:', error);
    res.status(500).json({ error: '출력 횟수 증가 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
