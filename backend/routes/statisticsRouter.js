const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 년도별 통계 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.query;
    
    conn = await pool.getConnection();
    
    let query = `
      SELECT 
        id,
        year,
        new_comer_registration,
        transfer_believer_registration,
        total_registration,
        new_comer_graduate_prev_year,
        new_comer_graduate_current_year,
        new_comer_graduate_total,
        transfer_believer_graduate_prev_year,
        transfer_believer_graduate_current_year,
        transfer_believer_graduate_total,
        total_graduate,
        new_comer_education_in_progress,
        new_comer_education_discontinued,
        new_comer_education_total,
        transfer_believer_education_in_progress,
        transfer_believer_education_discontinued,
        transfer_believer_education_total,
        total_education,
        created_at,
        updated_at
      FROM yearly_new_family_statistics
    `;
    
    const params = [];
    
    if (year) {
      query += ' WHERE year = ?';
      params.push(year);
    }
    
    query += ' ORDER BY year DESC';
    
    const results = await conn.query(query, params);
    
    res.json(results);
  } catch (error) {
    console.error('통계 목록 조회 실패:', error);
    res.status(500).json({ error: '통계 목록을 가져오는 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 개별 년도 통계 조회
router.get('/:year', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.params;
    
    conn = await pool.getConnection();
    
    const query = `
      SELECT 
        id,
        year,
        new_comer_registration,
        transfer_believer_registration,
        total_registration,
        new_comer_graduate_prev_year,
        new_comer_graduate_current_year,
        new_comer_graduate_total,
        transfer_believer_graduate_prev_year,
        transfer_believer_graduate_current_year,
        transfer_believer_graduate_total,
        total_graduate,
        new_comer_education_in_progress,
        new_comer_education_discontinued,
        new_comer_education_total,
        transfer_believer_education_in_progress,
        transfer_believer_education_discontinued,
        transfer_believer_education_total,
        total_education,
        created_at,
        updated_at
      FROM yearly_new_family_statistics 
      WHERE year = ?
    `;
    
    const results = await conn.query(query, [year]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: '해당 년도의 통계를 찾을 수 없습니다.' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('통계 조회 실패:', error);
    res.status(500).json({ error: '통계를 가져오는 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 통계 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const {
      year,
      new_comer_registration,
      transfer_believer_registration,
      total_registration,
      new_comer_graduate_prev_year,
      new_comer_graduate_current_year,
      new_comer_graduate_total,
      transfer_believer_graduate_prev_year,
      transfer_believer_graduate_current_year,
      transfer_believer_graduate_total,
      total_graduate,
      new_comer_education_in_progress,
      new_comer_education_discontinued,
      new_comer_education_total,
      transfer_believer_education_in_progress,
      transfer_believer_education_discontinued,
      transfer_believer_education_total,
      total_education
    } = req.body;
    
    conn = await pool.getConnection();
    
    const query = `
      INSERT INTO yearly_new_family_statistics (
        year,
        new_comer_registration,
        transfer_believer_registration,
        total_registration,
        new_comer_graduate_prev_year,
        new_comer_graduate_current_year,
        new_comer_graduate_total,
        transfer_believer_graduate_prev_year,
        transfer_believer_graduate_current_year,
        transfer_believer_graduate_total,
        total_graduate,
        new_comer_education_in_progress,
        new_comer_education_discontinued,
        new_comer_education_total,
        transfer_believer_education_in_progress,
        transfer_believer_education_discontinued,
        transfer_believer_education_total,
        total_education
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      year,
      new_comer_registration || 0,
      transfer_believer_registration || 0,
      total_registration || 0,
      new_comer_graduate_prev_year || 0,
      new_comer_graduate_current_year || 0,
      new_comer_graduate_total || 0,
      transfer_believer_graduate_prev_year || 0,
      transfer_believer_graduate_current_year || 0,
      transfer_believer_graduate_total || 0,
      total_graduate || 0,
      new_comer_education_in_progress || 0,
      new_comer_education_discontinued || 0,
      new_comer_education_total || 0,
      transfer_believer_education_in_progress || 0,
      transfer_believer_education_discontinued || 0,
      transfer_believer_education_total || 0,
      total_education || 0
    ];
    
    const result = await conn.query(query, params);
    
    res.status(201).json({
      id: result.insertId,
      message: '통계가 성공적으로 생성되었습니다.'
    });
  } catch (error) {
    console.error('통계 생성 실패:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: '해당 년도의 통계가 이미 존재합니다.' });
    } else {
      res.status(500).json({ error: '통계 생성 중 오류가 발생했습니다.' });
    }
  } finally {
    if (conn) conn.release();
  }
});

// 통계 수정
router.put('/:year', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.params;
    const {
      new_comer_registration,
      transfer_believer_registration,
      total_registration,
      new_comer_graduate_prev_year,
      new_comer_graduate_current_year,
      new_comer_graduate_total,
      transfer_believer_graduate_prev_year,
      transfer_believer_graduate_current_year,
      transfer_believer_graduate_total,
      total_graduate,
      new_comer_education_in_progress,
      new_comer_education_discontinued,
      new_comer_education_total,
      transfer_believer_education_in_progress,
      transfer_believer_education_discontinued,
      transfer_believer_education_total,
      total_education
    } = req.body;
    
    conn = await pool.getConnection();
    
    const query = `
      UPDATE yearly_new_family_statistics SET
        new_comer_registration = ?,
        transfer_believer_registration = ?,
        total_registration = ?,
        new_comer_graduate_prev_year = ?,
        new_comer_graduate_current_year = ?,
        new_comer_graduate_total = ?,
        transfer_believer_graduate_prev_year = ?,
        transfer_believer_graduate_current_year = ?,
        transfer_believer_graduate_total = ?,
        total_graduate = ?,
        new_comer_education_in_progress = ?,
        new_comer_education_discontinued = ?,
        new_comer_education_total = ?,
        transfer_believer_education_in_progress = ?,
        transfer_believer_education_discontinued = ?,
        transfer_believer_education_total = ?,
        total_education = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE year = ?
    `;
    
    const params = [
      new_comer_registration || 0,
      transfer_believer_registration || 0,
      total_registration || 0,
      new_comer_graduate_prev_year || 0,
      new_comer_graduate_current_year || 0,
      new_comer_graduate_total || 0,
      transfer_believer_graduate_prev_year || 0,
      transfer_believer_graduate_current_year || 0,
      transfer_believer_graduate_total || 0,
      total_graduate || 0,
      new_comer_education_in_progress || 0,
      new_comer_education_discontinued || 0,
      new_comer_education_total || 0,
      transfer_believer_education_in_progress || 0,
      transfer_believer_education_discontinued || 0,
      transfer_believer_education_total || 0,
      total_education || 0,
      year
    ];
    
    const result = await conn.query(query, params);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 년도의 통계를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '통계가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('통계 수정 실패:', error);
    res.status(500).json({ error: '통계 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 통계 삭제
router.delete('/:year', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.params;
    
    conn = await pool.getConnection();
    
    const query = `DELETE FROM yearly_new_family_statistics WHERE year = ?`;
    const result = await conn.query(query, [year]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '해당 년도의 통계를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '통계가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('통계 삭제 실패:', error);
    res.status(500).json({ error: '통계 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 자동 통계 계산 및 업데이트
router.post('/calculate/:year', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.params;
    
    conn = await pool.getConnection();
    
    // 초신자 등록 수
    const newComerRegistrationQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '초신자' AND department = '새가족위원회'
    `;
    const newComerRegistrationResult = await conn.query(newComerRegistrationQuery, [year]);
    const newComerRegistration = newComerRegistrationResult[0].count;
    
    // 전입신자 등록 수
    const transferBelieverRegistrationQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '전입신자' AND department = '새가족위원회'
    `;
    const transferBelieverRegistrationResult = await conn.query(transferBelieverRegistrationQuery, [year]);
    const transferBelieverRegistration = transferBelieverRegistrationResult[0].count;
    
    // 등록 전체 합계
    const totalRegistration = newComerRegistration + transferBelieverRegistration;
    
    // 초신자 올해 수료 수
    const newComerGraduateCurrentYearQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers_graduates 
      WHERE year = ? AND believer_type = '초신자' AND education_type = '수료'
    `;
    const newComerGraduateCurrentYearResult = await conn.query(newComerGraduateCurrentYearQuery, [year]);
    const newComerGraduateCurrentYear = newComerGraduateCurrentYearResult[0].count;
    
    // 전입신자 올해 수료 수
    const transferBelieverGraduateCurrentYearQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers_graduates 
      WHERE year = ? AND believer_type = '전입신자' AND education_type = '수료'
    `;
    const transferBelieverGraduateCurrentYearResult = await conn.query(transferBelieverGraduateCurrentYearQuery, [year]);
    const transferBelieverGraduateCurrentYear = transferBelieverGraduateCurrentYearResult[0].count;
    
    // 초신자 교육중 수
    const newComerEducationInProgressQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '초신자' AND education_type = '교육중' AND department = '새가족위원회'
    `;
    const newComerEducationInProgressResult = await conn.query(newComerEducationInProgressQuery, [year]);
    const newComerEducationInProgress = newComerEducationInProgressResult[0].count;
    
    // 초신자 교육중단 수
    const newComerEducationDiscontinuedQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '초신자' AND education_type = '교육중단' AND department = '새가족위원회'
    `;
    const newComerEducationDiscontinuedResult = await conn.query(newComerEducationDiscontinuedQuery, [year]);
    const newComerEducationDiscontinued = newComerEducationDiscontinuedResult[0].count;
    
    // 전입신자 교육중 수
    const transferBelieverEducationInProgressQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '전입신자' AND education_type = '교육중' AND department = '새가족위원회'
    `;
    const transferBelieverEducationInProgressResult = await conn.query(transferBelieverEducationInProgressQuery, [year]);
    const transferBelieverEducationInProgress = transferBelieverEducationInProgressResult[0].count;
    
    // 전입신자 교육중단 수
    const transferBelieverEducationDiscontinuedQuery = `
      SELECT COUNT(*) as count 
      FROM new_comers 
      WHERE YEAR(created_at) = ? AND believer_type = '전입신자' AND education_type = '교육중단' AND department = '새가족위원회'
    `;
    const transferBelieverEducationDiscontinuedResult = await conn.query(transferBelieverEducationDiscontinuedQuery, [year]);
    const transferBelieverEducationDiscontinued = transferBelieverEducationDiscontinuedResult[0].count;
    
    // 합계 계산
    const newComerGraduateTotal = newComerGraduateCurrentYear; // 전년도 수료는 별도 계산 필요
    const transferBelieverGraduateTotal = transferBelieverGraduateCurrentYear; // 전년도 수료는 별도 계산 필요
    const totalGraduate = newComerGraduateTotal + transferBelieverGraduateTotal;
    const newComerEducationTotal = newComerEducationInProgress + newComerEducationDiscontinued;
    const transferBelieverEducationTotal = transferBelieverEducationInProgress + transferBelieverEducationDiscontinued;
    const totalEducation = newComerEducationTotal + transferBelieverEducationTotal;
    
    // 기존 통계 확인
    const existingQuery = `SELECT id FROM yearly_new_family_statistics WHERE year = ?`;
    const existingResult = await conn.query(existingQuery, [year]);
    
    if (existingResult.length > 0) {
      // 기존 통계 업데이트
      const updateQuery = `
        UPDATE yearly_new_family_statistics SET
          new_comer_registration = ?,
          transfer_believer_registration = ?,
          total_registration = ?,
          new_comer_graduate_current_year = ?,
          new_comer_graduate_total = ?,
          transfer_believer_graduate_current_year = ?,
          transfer_believer_graduate_total = ?,
          total_graduate = ?,
          new_comer_education_in_progress = ?,
          new_comer_education_discontinued = ?,
          new_comer_education_total = ?,
          transfer_believer_education_in_progress = ?,
          transfer_believer_education_discontinued = ?,
          transfer_believer_education_total = ?,
          total_education = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE year = ?
      `;
      
      const updateParams = [
        newComerRegistration,
        transferBelieverRegistration,
        totalRegistration,
        newComerGraduateCurrentYear,
        newComerGraduateTotal,
        transferBelieverGraduateCurrentYear,
        transferBelieverGraduateTotal,
        totalGraduate,
        newComerEducationInProgress,
        newComerEducationDiscontinued,
        newComerEducationTotal,
        transferBelieverEducationInProgress,
        transferBelieverEducationDiscontinued,
        transferBelieverEducationTotal,
        totalEducation,
        year
      ];
      
      await conn.query(updateQuery, updateParams);
    } else {
      // 새 통계 생성
      const insertQuery = `
        INSERT INTO yearly_new_family_statistics (
          year,
          new_comer_registration,
          transfer_believer_registration,
          total_registration,
          new_comer_graduate_current_year,
          new_comer_graduate_total,
          transfer_believer_graduate_current_year,
          transfer_believer_graduate_total,
          total_graduate,
          new_comer_education_in_progress,
          new_comer_education_discontinued,
          new_comer_education_total,
          transfer_believer_education_in_progress,
          transfer_believer_education_discontinued,
          transfer_believer_education_total,
          total_education
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        year,
        newComerRegistration,
        transferBelieverRegistration,
        totalRegistration,
        newComerGraduateCurrentYear,
        newComerGraduateTotal,
        transferBelieverGraduateCurrentYear,
        transferBelieverGraduateTotal,
        totalGraduate,
        newComerEducationInProgress,
        newComerEducationDiscontinued,
        newComerEducationTotal,
        transferBelieverEducationInProgress,
        transferBelieverEducationDiscontinued,
        transferBelieverEducationTotal,
        totalEducation
      ];
      
      await conn.query(insertQuery, insertParams);
    }
    
    res.json({
      message: `${year}년 통계가 성공적으로 계산되어 저장되었습니다.`,
      statistics: {
        year,
        newComerRegistration,
        transferBelieverRegistration,
        totalRegistration,
        newComerGraduateCurrentYear,
        newComerGraduateTotal,
        transferBelieverGraduateCurrentYear,
        transferBelieverGraduateTotal,
        totalGraduate,
        newComerEducationInProgress,
        newComerEducationDiscontinued,
        newComerEducationTotal,
        transferBelieverEducationInProgress,
        transferBelieverEducationDiscontinued,
        transferBelieverEducationTotal,
        totalEducation
      }
    });
  } catch (error) {
    console.error('통계 계산 실패:', error);
    res.status(500).json({ error: '통계 계산 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
