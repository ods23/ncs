const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { convertDateField } = require('../utils/excelUtils');

// 수료전체조회 - 모든 수료자 목록 조회 (조회 조건 포함)
router.get('/', async (req, res) => {
  try {
    const { year, name, believer_type, phone } = req.query;
    
    let query = `
      SELECT 
        ng.id,
        ng.graduate_number,
        ng.print_count,
        ng.department,
        ng.believer_type,
        ng.education_type,
        ng.year,
        ng.name,
        ng.gender,
        ng.marital_status,
        DATE_FORMAT(ng.birth_date, '%Y-%m-%d') as birth_date,
        ng.address,
        ng.phone,
        ng.teacher,
        DATE_FORMAT(ng.register_date, '%Y-%m-%d') as register_date,
        DATE_FORMAT(ng.education_start_date, '%Y-%m-%d') as education_start_date,
        ng.education_end_date,
        ng.affiliation_org,
        ng.belong,
        DATE_FORMAT(ng.new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        ng.identity_verified,
        ng.prev_church,
        ng.comment,
        ng.new_comer_id,
        ng.created_at,
        ng.updated_at
      FROM new_comers_graduates ng
      LEFT JOIN code_details cd ON ng.believer_type = cd.code_value
      LEFT JOIN code_groups cg ON cd.group_id = cg.id
      WHERE 1=1
        AND cg.group_code = '신자'
    `;
    
    const params = [];
    
    // 조회 조건 추가
    if (year && year.trim() !== '') {
      query += ' AND year = ?';
      params.push(year.trim());
    }
    
    if (name && name.trim() !== '') {
      // birth_date도 함께 전달된 경우 정확한 중복 확인
      if (req.query.birth_date && req.query.birth_date.trim() !== '') {
        query += ' AND name = ? AND birth_date = ?';
        params.push(name.trim(), req.query.birth_date.trim());
      } else {
        query += ' AND name LIKE ?';
        params.push(`%${name.trim()}%`);
      }
    }
    
    if (believer_type && believer_type.trim() !== '') {
      query += ' AND believer_type = ?';
      params.push(believer_type.trim());
    }
    
    if (phone && phone.trim() !== '') {
      query += ' AND phone LIKE ?';
      params.push(`%${phone.trim()}%`);
    }
    
    query += ' ORDER BY cd.sort_order ASC, ng.id ASC';
    
    console.log('수료자 조회 쿼리:', query);
    console.log('수료자 조회 파라미터:', params);
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, params);
    conn.release();
    
    // 결과가 배열이 아닌 경우 배열로 변환
    const finalResults = Array.isArray(results) ? results : (results.rows || []);
    
    console.log('수료자 조회 결과:', finalResults);
    console.log('수료자 조회 결과 개수:', finalResults.length);
    
    res.json(finalResults);
  } catch (error) {
    console.error('수료전체조회 실패:', error);
    res.status(500).json({ error: '수료전체조회 중 오류가 발생했습니다.' });
  }
});

// 개별 수료자 조회 (수료전체조회용)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
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
      WHERE id = ?
    `;
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, [id]);
    conn.release();
    
    if (results.length === 0) {
      return res.status(404).json({ error: '수료자를 찾을 수 없습니다.' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('수료자 조회 실패:', error);
    res.status(500).json({ error: '수료자 정보를 가져오는 중 오류가 발생했습니다.' });
  }
});

// 수료전체조회는 조회 기능만 제공하므로 추가 기능 제거

// 수료전체조회는 조회 기능만 제공하므로 수정 기능 제거

// 수료전체조회는 조회 기능만 제공하므로 삭제 기능 제거

// 수료전체조회는 조회 기능만 제공하므로 Excel 업로드 기능 제거

// 수료전체조회는 조회 기능만 제공하므로 출력 횟수 증가 기능 제거

// 수료자 중복 확인 (이름과 생년월일 기준)
router.get('/check-duplicate', async (req, res) => {
  try {
    const { name, birth_date } = req.query;
    
    console.log('중복 확인 요청:', { name, birth_date });
    
    if (!name || !birth_date) {
      console.log('필수 파라미터 누락');
      return res.status(400).json({ error: '이름과 생년월일이 필요합니다.' });
    }
    
    const query = `
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
      WHERE name = ? AND birth_date = ?
      LIMIT 1
    `;
    
    console.log('실행할 쿼리:', query);
    console.log('쿼리 파라미터:', [name, birth_date]);
    
    const conn = await pool.getConnection();
    const results = await conn.query(query, [name, birth_date]);
    conn.release();
    
    console.log('쿼리 결과:', results);
    console.log('결과 길이:', results.length);
    console.log('결과 타입:', typeof results);
    console.log('결과가 배열인가?', Array.isArray(results));
    
    // MariaDB 결과 처리
    const finalResults = Array.isArray(results) ? results : (results.rows || []);
    console.log('최종 결과:', finalResults);
    console.log('최종 결과 길이:', finalResults.length);
    
    if (finalResults.length > 0) {
      console.log('중복 발견:', finalResults[0]);
      res.json({
        duplicate: true,
        graduate: finalResults[0]
      });
    } else {
      console.log('중복 없음');
      res.json({
        duplicate: false,
        graduate: null
      });
    }
  } catch (error) {
    console.error('수료자 중복 확인 실패:', error);
    res.status(500).json({ error: '수료자 중복 확인 중 오류가 발생했습니다.' });
  }
});

// 수료자 정보 업데이트
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 업데이트할 필드들
    const updateFields = [
      'department', 'believer_type', 'education_type', 'year', 'name', 'gender',
      'marital_status', 'birth_date', 'address', 'phone', 'teacher', 'register_date',
              'education_start_date', 'education_end_date', 'affiliation_org', 'belong',
      'new_life_strategy_date', 'identity_verified', 'prev_church', 'comment'
    ];
    
    const setClause = updateFields
      .filter(field => updateData[field] !== undefined)
      .map(field => `${field} = ?`)
      .join(', ');
    
    const values = updateFields
      .filter(field => updateData[field] !== undefined)
      .map(field => updateData[field]);
    
    values.push(id);
    
    const query = `
      UPDATE new_comers_graduates 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const conn = await pool.getConnection();
    const result = await conn.query(query, values);
    conn.release();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '수료자를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '수료자 정보가 성공적으로 업데이트되었습니다.' });
  } catch (error) {
    console.error('수료자 업데이트 실패:', error);
    res.status(500).json({ error: '수료자 업데이트 중 오류가 발생했습니다.' });
  }
});

// 수료자 직접 생성 (중복 무시)
router.post('/', async (req, res) => {
  try {
    const graduateData = req.body;
    
    // 필수 필드 검증
    if (!graduateData.name || !graduateData.birth_date) {
      return res.status(400).json({ error: '이름과 생년월일은 필수입니다.' });
    }
    
    const insertQuery = `
      INSERT INTO new_comers_graduates (
        department, believer_type, education_type, year, name, gender, marital_status,
        birth_date, address, phone, teacher, register_date, education_start_date,
        education_end_date, affiliation_org, belong, new_life_strategy_date,
        identity_verified, prev_church, comment, print_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const insertValues = [
      graduateData.department || '새가족위원회',
      graduateData.believer_type || '초신자',
      graduateData.education_type || '수료',
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
      graduateData.identity_verified || 0,
      graduateData.prev_church || '',
      graduateData.comment || '',
      graduateData.print_count || 0
    ];
    
    const conn = await pool.getConnection();
    const result = await conn.query(insertQuery, insertValues);
    conn.release();
    
    res.status(201).json({
      message: '수료자가 성공적으로 생성되었습니다.',
      graduateId: result.insertId
    });
  } catch (error) {
    console.error('수료자 생성 실패:', error);
    res.status(500).json({ error: '수료자 생성 중 오류가 발생했습니다.' });
  }
});

module.exports = router;