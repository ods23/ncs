const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const puppeteer = require('puppeteer');

// 년도별 통계 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department, yearRange } = req.query;
    
    conn = await pool.getConnection();
    
    let query = `
      SELECT 
        id,
        year,
        department,
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
    const conditions = [];
    
    if (year) {
      if (yearRange) {
        // 년도 범위가 지정된 경우: 기준년도에서 지정된 년도 수만큼의 범위
        const baseYear = parseInt(year);
        const range = parseInt(yearRange) || 7;
        const startYear = baseYear - range + 1;
        conditions.push('year >= ? AND year <= ?');
        params.push(startYear, baseYear);
      } else {
        // 년도 범위가 없는 경우: 조회년도 포함 이전 모든 년도 조회
        conditions.push('year <= ?');
        params.push(year);
      }
    }
    
    if (department) {
      conditions.push('department = ?');
      params.push(department);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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
        department,
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      year,
      '새가족위원회', // 기본 부서값
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
      WHERE year = ? AND department = ?
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
      year,
      '새가족위원회' // 기본 부서값
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
    
    const query = `DELETE FROM yearly_new_family_statistics WHERE year = ? AND department = ?`;
    const result = await conn.query(query, [year, '새가족위원회']);
    
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
    const existingQuery = `SELECT id FROM yearly_new_family_statistics WHERE year = ? AND department = ?`;
    const existingResult = await conn.query(existingQuery, [year, '새가족위원회']);
    
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
        WHERE year = ? AND department = ?
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
        year,
        '새가족위원회'
      ];
      
      await conn.query(updateQuery, updateParams);
    } else {
      // 새 통계 생성
      const insertQuery = `
        INSERT INTO yearly_new_family_statistics (
          year,
          department,
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const insertParams = [
        year,
        '새가족위원회',
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

// 통계 자동 생성
router.post('/generate', async (req, res) => {
  let conn;
  try {
    const { year, department } = req.body;
    
    if (!year || year < 2025) {
      return res.status(400).json({ message: '2025년 이후부터 통계를 생성할 수 있습니다.' });
    }
    
    if (!department) {
      return res.status(400).json({ message: '부서를 선택해주세요.' });
    }

    conn = await pool.getConnection();
    
    // 1. new_comers에서 초신자, 전입신자 등록자 수 count (각각 개별 쿼리)
    const [newComerCount] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '초신자' AND department = ?
    `, [year, department]);
    
    const [transferBelieverCount] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자' AND department = ?
    `, [year, department]);

    // 2. new_comers_graduates에서 수료자 수 count (각각 개별 쿼리)
    // 전년도 수료: 양육종료일자가 기준년도와 동일하고, 등록일자가 기준년도 이전
    const [newComerGraduatePrev] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers_graduates 
      WHERE education_type = '수료'
        AND YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND YEAR(register_date) < ? 
        AND believer_type = '초신자'
    `, [year, year]);
    
    // 올해 수료: 등록일자와 양육종료일자가 모두 기준년도와 동일
    const [newComerGraduateCurrent] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers_graduates 
      WHERE education_type = '수료'
        AND YEAR(register_date) = ? 
        AND YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND believer_type = '초신자'
    `, [year, year]);
    
    // 전입신자 전년도 수료
    const [transferBelieverGraduatePrev] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers_graduates 
      WHERE education_type = '수료'
        AND YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND YEAR(register_date) < ? 
        AND believer_type = '전입신자'
    `, [year, year]);
    
    // 전입신자 올해 수료
    const [transferBelieverGraduateCurrent] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers_graduates 
      WHERE education_type = '수료'
        AND YEAR(register_date) = ? 
        AND YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND believer_type = '전입신자'
    `, [year, year]);

    // 3. new_comers에서 교육 상태별 count (각각 개별 쿼리)
    const [newComerEducationInProgress] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '초신자' 
        AND education_type NOT IN ('수료', '교육중단') AND department = ?
    `, [year, department]);
    
    const [newComerEducationDiscontinued] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '초신자' 
        AND education_type = '교육중단' AND department = ?
    `, [year, department]);
    
    const [transferBelieverEducationInProgress] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자' 
        AND education_type NOT IN ('수료', '교육중단') AND department = ?
    `, [year, department]);
    
    const [transferBelieverEducationDiscontinued] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자' 
        AND education_type = '교육중단' AND department = ?
    `, [year, department]);


    
    // 데이터 집계 - 개별 쿼리 결과를 직접 사용
    const newComerData = {
      new_comer_registration: parseInt(newComerCount.count) || 0,
      transfer_believer_registration: parseInt(transferBelieverCount.count) || 0,
      new_comer_graduate_prev_year: parseInt(newComerGraduatePrev.count) || 0,
      new_comer_graduate_current_year: parseInt(newComerGraduateCurrent.count) || 0,
      transfer_believer_graduate_prev_year: parseInt(transferBelieverGraduatePrev.count) || 0,
      transfer_believer_graduate_current_year: parseInt(transferBelieverGraduateCurrent.count) || 0,
      new_comer_education_in_progress: parseInt(newComerEducationInProgress.count) || 0,
      new_comer_education_discontinued: parseInt(newComerEducationDiscontinued.count) || 0,
      transfer_believer_education_in_progress: parseInt(transferBelieverEducationInProgress.count) || 0,
      transfer_believer_education_discontinued: parseInt(transferBelieverEducationDiscontinued.count) || 0
    };

    // 합계 계산
    newComerData.total_registration = newComerData.new_comer_registration + newComerData.transfer_believer_registration;
    newComerData.new_comer_graduate_total = newComerData.new_comer_graduate_prev_year + newComerData.new_comer_graduate_current_year;
    newComerData.transfer_believer_graduate_total = newComerData.transfer_believer_graduate_prev_year + newComerData.transfer_believer_graduate_current_year;
    newComerData.total_graduate = newComerData.new_comer_graduate_total + newComerData.transfer_believer_graduate_total;
    newComerData.new_comer_education_total = newComerData.new_comer_education_in_progress + newComerData.new_comer_education_discontinued;
    newComerData.transfer_believer_education_total = newComerData.transfer_believer_education_in_progress + newComerData.transfer_believer_education_discontinued;
    newComerData.total_education = newComerData.new_comer_education_total + newComerData.transfer_believer_education_total;

    // 기존 데이터 확인
    const [existingData] = await conn.query('SELECT * FROM yearly_new_family_statistics WHERE year = ? AND department = ?', [year, department]);
    
    if (existingData && Object.keys(existingData).length > 0) {
      // 기존 데이터 업데이트
      await conn.query(`
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
        WHERE year = ? AND department = ?
      `, [
        newComerData.new_comer_registration,
        newComerData.transfer_believer_registration,
        newComerData.total_registration,
        newComerData.new_comer_graduate_prev_year,
        newComerData.new_comer_graduate_current_year,
        newComerData.new_comer_graduate_total,
        newComerData.transfer_believer_graduate_prev_year,
        newComerData.transfer_believer_graduate_current_year,
        newComerData.transfer_believer_graduate_total,
        newComerData.total_graduate,
        newComerData.new_comer_education_in_progress,
        newComerData.new_comer_education_discontinued,
        newComerData.new_comer_education_total,
        newComerData.transfer_believer_education_in_progress,
        newComerData.transfer_believer_education_discontinued,
        newComerData.transfer_believer_education_total,
        newComerData.total_education,
        year,
        department
      ]);
      
      res.json({ message: `${year}년 통계가 성공적으로 업데이트되었습니다.` });
    } else {
      // 새 데이터 삽입
      await conn.query(`
        INSERT INTO yearly_new_family_statistics (
          year, department, new_comer_registration, transfer_believer_registration, total_registration,
          new_comer_graduate_prev_year, new_comer_graduate_current_year, new_comer_graduate_total,
          transfer_believer_graduate_prev_year, transfer_believer_graduate_current_year, transfer_believer_graduate_total,
          total_graduate, new_comer_education_in_progress, new_comer_education_discontinued, new_comer_education_total,
          transfer_believer_education_in_progress, transfer_believer_education_discontinued, transfer_believer_education_total,
          total_education
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        year,
        department,
        newComerData.new_comer_registration,
        newComerData.transfer_believer_registration,
        newComerData.total_registration,
        newComerData.new_comer_graduate_prev_year,
        newComerData.new_comer_graduate_current_year,
        newComerData.new_comer_graduate_total,
        newComerData.transfer_believer_graduate_prev_year,
        newComerData.transfer_believer_graduate_current_year,
        newComerData.transfer_believer_graduate_total,
        newComerData.total_graduate,
        newComerData.new_comer_education_in_progress,
        newComerData.new_comer_education_discontinued,
        newComerData.new_comer_education_total,
        newComerData.transfer_believer_education_in_progress,
        newComerData.transfer_believer_education_discontinued,
        newComerData.transfer_believer_education_total,
        newComerData.total_education
      ]);
      
      res.json({ message: `${year}년 통계가 성공적으로 생성되었습니다.` });
    }

    // 4. 월별/연령대별 통계 생성
    console.log('=== 월별/연령대별 통계 생성 시작 ===');
    

    
    // 기존 월별/연령대별 통계 데이터 삭제 (해당 년도, 부서 기준)
    await conn.query('DELETE FROM new_comers_monthly_age_statistics WHERE year = ? AND department = ?', [year, department]);
    console.log(`${year}년 ${department} 기존 월별/연령대별 통계 삭제 완료`);
    
    // 1~12월까지 각 월별로 통계 생성
    for (let month = 1; month <= 12; month++) {
      // 초신자 월별/연령대별 통계
      const newComerMonthlyStats = await conn.query(`
        SELECT 
          MONTH(register_date) as month,
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 10 AND 19 THEN '10s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 20 AND 29 THEN '20s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 30 AND 39 THEN '30s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 40 AND 49 THEN '40s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 50 AND 59 THEN '50s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 60 AND 69 THEN '60s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 70 THEN '70s_plus'
            ELSE 'unknown'
          END as age_group,
          COUNT(*) as count
        FROM new_comers 
        WHERE YEAR(register_date) = ? 
          AND MONTH(register_date) = ?
          AND department = ?
          AND believer_type = '초신자'
        GROUP BY age_group
      `, [year, month, department]);
      

      
      // 전입신자 월별/연령대별 통계
      const transferBelieverMonthlyStats = await conn.query(`
        SELECT 
          MONTH(register_date) as month,
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 10 AND 19 THEN '10s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 20 AND 29 THEN '20s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 30 AND 39 THEN '30s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 40 AND 49 THEN '40s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 50 AND 59 THEN '50s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 60 AND 69 THEN '60s'
            WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) >= 70 THEN '70s_plus'
            ELSE 'unknown'
          END as age_group,
          COUNT(*) as count
        FROM new_comers 
        WHERE YEAR(register_date) = ? 
          AND MONTH(register_date) = ?
          AND department = ?
          AND believer_type = '전입신자'
        GROUP BY age_group
      `, [year, month, department]);
      
      // 초신자 데이터를 연령대별로 정리
      const newComerAgeStats = {
        '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0
      };
      
      // MariaDB 결과 처리 - 배열이 아닌 경우도 처리
      let statsArray = newComerMonthlyStats;
      if (!Array.isArray(newComerMonthlyStats)) {
        // 단일 객체인 경우 배열로 변환
        if (newComerMonthlyStats && typeof newComerMonthlyStats === 'object') {
          statsArray = [newComerMonthlyStats];
        } else {
          statsArray = [];
        }
      }
      
      statsArray.forEach(stat => {
        if (stat && stat.age_group && stat.age_group !== 'unknown') {
          newComerAgeStats[stat.age_group] = parseInt(stat.count) || 0;
        }
      });
      
      // 전입신자 데이터를 연령대별로 정리
      const transferBelieverAgeStats = {
        '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0
      };
      
      // MariaDB 결과 처리 - 배열이 아닌 경우도 처리
      let transferStatsArray = transferBelieverMonthlyStats;
      if (!Array.isArray(transferBelieverMonthlyStats)) {
        // 단일 객체인 경우 배열로 변환
        if (transferBelieverMonthlyStats && typeof transferBelieverMonthlyStats === 'object') {
          transferStatsArray = [transferBelieverMonthlyStats];
        } else {
          transferStatsArray = [];
        }
      }
      
      transferStatsArray.forEach(stat => {
        if (stat && stat.age_group && stat.age_group !== 'unknown') {
          transferBelieverAgeStats[stat.age_group] = parseInt(stat.count) || 0;
        }
      });
      
      // 초신자 월별/연령대별 통계 저장
      const newComerTotal = Object.values(newComerAgeStats).reduce((sum, count) => sum + count, 0);
      await conn.query(`
        INSERT INTO new_comers_monthly_age_statistics (
          year, department, month, believer_type,
          age_group_10s, age_group_20s, age_group_30s, age_group_40s, 
          age_group_50s, age_group_60s, age_group_70s_plus, total_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        year, department, month, '초신자',
        newComerAgeStats['10s'], newComerAgeStats['20s'], newComerAgeStats['30s'], newComerAgeStats['40s'],
        newComerAgeStats['50s'], newComerAgeStats['60s'], newComerAgeStats['70s_plus'], newComerTotal
      ]);
      
      // 전입신자 월별/연령대별 통계 저장
      const transferBelieverTotal = Object.values(transferBelieverAgeStats).reduce((sum, count) => sum + count, 0);
      await conn.query(`
        INSERT INTO new_comers_monthly_age_statistics (
          year, department, month, believer_type,
          age_group_10s, age_group_20s, age_group_30s, age_group_40s, 
          age_group_50s, age_group_60s, age_group_70s_plus, total_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        year, department, month, '전입신자',
        transferBelieverAgeStats['10s'], transferBelieverAgeStats['20s'], transferBelieverAgeStats['30s'], transferBelieverAgeStats['40s'],
        transferBelieverAgeStats['50s'], transferBelieverAgeStats['60s'], transferBelieverAgeStats['70s_plus'], transferBelieverTotal
      ]);
      
    }
    
    console.log('=== 월별/연령대별 통계 생성 완료 ===');
    console.log(`${year}년 ${department} 월별/연령대별 통계가 성공적으로 생성되었습니다.`);

  } catch (error) {
    console.error('통계 생성 실패:', error);
    res.status(500).json({ message: '통계 생성에 실패했습니다.' });
  } finally {
    if (conn) {
      conn.release();
    }
  }
});

// 월별/연령대별 통계 조회
router.get('/monthly-age', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department } = req.query;
    
    if (!year) {
      return res.status(400).json({ message: '년도가 필요합니다.' });
    }
    
    conn = await pool.getConnection();
    
    const query = `
      SELECT 
        month,
        believer_type,
        age_group_10s,
        age_group_20s,
        age_group_30s,
        age_group_40s,
        age_group_50s,
        age_group_60s,
        age_group_70s_plus,
        total_count
      FROM new_comers_monthly_age_statistics 
      WHERE year = ? AND department = ?
      ORDER BY month ASC, believer_type ASC
    `;
    
    const queryResult = await conn.query(query, [year, department || '새가족위원회']);
    
    // queryResult 자체가 rows 배열이므로 직접 사용
    const rowsArray = queryResult;
    


    const monthlyData = {};
    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    
    // 1~12월 초기화
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = {
        초신자: { '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0, total: 0 },
        전입신자: { '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0, total: 0 }
      };
    }
    
    rowsArray.forEach((row, index) => {
      // 데이터 타입 명시적 변환
      const month = parseInt(row.month, 10);  // 문자열을 숫자로 변환
      const believerType = row.believer_type;
      
      ageGroups.forEach(ageGroup => {
        const fieldName = `age_group_${ageGroup}`;
        const value = parseInt(row[fieldName], 10) || 0;  // 숫자로 변환
        monthlyData[month][believerType][ageGroup] = value;
      });
      
      monthlyData[month][believerType].total = parseInt(row.total_count, 10) || 0;  // 숫자로 변환
    });
    
    res.json(monthlyData);
    
  } catch (error) {
    console.error('월별/연령대별 통계 조회 실패:', error);
    res.status(500).json({ message: '월별/연령대별 통계 조회에 실패했습니다.' });
  } finally {
    if (conn) {
      conn.release();
    }
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
      WHERE year = ? AND department = ?
    `;
    
    const results = await conn.query(query, [year, '새가족위원회']);
    
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

// PDF 생성 API
router.post('/pdf', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department, yearRange, orientation = 'portrait' } = req.body;
    
    conn = await pool.getConnection();
    
    // 통계 데이터 조회
    let query = `
      SELECT 
        id, year, department,
        new_comer_registration, transfer_believer_registration, total_registration,
        new_comer_graduate_prev_year, new_comer_graduate_current_year, new_comer_graduate_total,
        transfer_believer_graduate_prev_year, transfer_believer_graduate_current_year, transfer_believer_graduate_total,
        total_graduate,
        new_comer_education_in_progress, new_comer_education_discontinued, new_comer_education_total,
        transfer_believer_education_in_progress, transfer_believer_education_discontinued, transfer_believer_education_total,
        total_education
      FROM yearly_new_family_statistics
    `;
    
    const params = [];
    const conditions = [];
    
    if (year) {
      if (yearRange) {
        const baseYear = parseInt(year);
        const range = parseInt(yearRange) || 7;
        const startYear = baseYear - range + 1;
        conditions.push('year >= ? AND year <= ?');
        params.push(startYear, baseYear);
      } else {
        conditions.push('year <= ?');
        params.push(year);
      }
    }
    
    if (department && department !== '전체') {
      conditions.push('department = ?');
      params.push(department);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY year ASC, department ASC';
    
    const results = await conn.query(query, params);
    
    // PDF 생성
    const doc = new PDFDocument({
      size: 'A4',
      layout: orientation === 'landscape' ? 'landscape' : 'portrait',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // PDF 헤더
    doc.fontSize(16).text(`${year || '전체'}년 ${department || '전체'} 등록현황보고`, { align: 'center' });
    doc.moveDown();
    
    // 테이블 생성
    const tableTop = 150;
    let y = tableTop;
    
    // 테이블 헤더
    const headers = [
      '년도', '부서', '등록자', '수료자', '교육중'
    ];
    
    const columnWidths = orientation === 'landscape' ? [80, 120, 100, 100, 100] : [60, 100, 80, 80, 80];
    let x = 50;
    
    // 헤더 그리기
    doc.fontSize(10);
    headers.forEach((header, i) => {
      doc.rect(x, y, columnWidths[i], 20).stroke();
      doc.text(header, x + 5, y + 5, { width: columnWidths[i] - 10 });
      x += columnWidths[i];
    });
    
    y += 20;
    
    // 데이터 행 그리기
    results.forEach(row => {
      x = 50;
      const rowData = [
        row.year.toString(),
        row.department,
        row.total_registration.toString(),
        row.total_graduate.toString(),
        row.total_education.toString()
      ];
      
      rowData.forEach((data, i) => {
        doc.rect(x, y, columnWidths[i], 20).stroke();
        doc.text(data, x + 5, y + 5, { width: columnWidths[i] - 10 });
        x += columnWidths[i];
      });
      
      y += 20;
    });
    
    // 합계 행 추가
    const totals = results.reduce((acc, row) => ({
      registration: acc.registration + row.total_registration,
      graduate: acc.graduate + row.total_graduate,
      education: acc.education + row.total_education
    }), { registration: 0, graduate: 0, education: 0 });
    
    x = 50;
    const totalData = [
      '합계', '', totals.registration.toString(), 
      totals.graduate.toString(), totals.education.toString()
    ];
    
    totalData.forEach((data, i) => {
      doc.rect(x, y, columnWidths[i], 20).stroke();
      doc.text(data, x + 5, y + 5, { width: columnWidths[i] - 10 });
      x += columnWidths[i];
    });
    
    // 응답 헤더 설정
    const fileName = `새가족등록현황보고_${year || '전체'}_${department || '전체'}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    
    // PDF 스트림을 응답으로 전송
    doc.pipe(res);
    doc.end();
    
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// PDF 다운로드 (GET 방식 - URL로 직접 접근)
router.get('/pdf', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year, department, yearRange, orientation = 'portrait' } = req.query;
    
    conn = await pool.getConnection();
    
    // 통계 데이터 조회 (POST와 동일한 로직)
    let query = `
      SELECT 
        id, year, department,
        new_comer_registration, transfer_believer_registration, total_registration,
        new_comer_graduate_prev_year, new_comer_graduate_current_year, new_comer_graduate_total,
        transfer_believer_graduate_prev_year, transfer_believer_graduate_current_year, transfer_believer_graduate_total,
        total_graduate,
        new_comer_education_in_progress, new_comer_education_discontinued, new_comer_education_total,
        transfer_believer_education_in_progress, transfer_believer_education_discontinued, transfer_believer_education_total,
        total_education
      FROM yearly_new_family_statistics
    `;
    
    const params = [];
    const conditions = [];
    
    if (year) {
      if (yearRange) {
        const baseYear = parseInt(year);
        const range = parseInt(yearRange) || 7;
        const startYear = baseYear - range + 1;
        conditions.push('year >= ? AND year <= ?');
        params.push(startYear, baseYear);
      } else {
        conditions.push('year <= ?');
        params.push(year);
      }
    }
    
    if (department && department !== '전체') {
      conditions.push('department = ?');
      params.push(department);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY year ASC, department ASC';
    
    const results = await conn.query(query, params);
    
    // PDF 생성
    const doc = new PDFDocument({
      size: 'A4',
      layout: orientation === 'landscape' ? 'landscape' : 'portrait',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    // PDF 헤더
    doc.fontSize(16).text(`${year || '전체'}년 ${department || '전체'} 등록현황보고`, { align: 'center' });
    doc.moveDown();
    
    // 테이블 생성
    const tableTop = 150;
    let y = tableTop;
    
    // 테이블 헤더
    const headers = [
      '년도', '부서', '등록자', '수료자', '교육중'
    ];
    
    const columnWidths = orientation === 'landscape' ? [80, 120, 100, 100, 100] : [60, 100, 80, 80, 80];
    let x = 50;
    
    // 헤더 그리기
    doc.fontSize(10);
    headers.forEach((header, i) => {
      doc.rect(x, y, columnWidths[i], 20).stroke();
      doc.text(header, x + 5, y + 5, { width: columnWidths[i] - 10 });
      x += columnWidths[i];
    });
    
    y += 20;
    
    // 데이터 행 그리기
    results.forEach(row => {
      x = 50;
      const rowData = [
        row.year.toString(),
        row.department,
        row.total_registration.toString(),
        row.total_graduate.toString(),
        row.total_education.toString()
      ];
      
      rowData.forEach((data, i) => {
        doc.rect(x, y, columnWidths[i], 20).stroke();
        doc.text(data, x + 5, y + 5, { width: columnWidths[i] - 10 });
        x += columnWidths[i];
      });
      
      y += 20;
    });
    
    // 합계 행 추가
    const totals = results.reduce((acc, row) => ({
      registration: acc.registration + row.total_registration,
      graduate: acc.graduate + row.total_graduate,
      education: acc.education + row.total_education
    }), { registration: 0, graduate: 0, education: 0 });
    
    x = 50;
    const totalData = [
      '합계', '', totals.registration.toString(), 
      totals.graduate.toString(), totals.education.toString()
    ];
    
    totalData.forEach((data, i) => {
      doc.rect(x, y, columnWidths[i], 20).stroke();
      doc.text(data, x + 5, y + 5, { width: columnWidths[i] - 10 });
      x += columnWidths[i];
    });
    
    // 응답 헤더 설정
    const fileName = `새가족등록현황보고_${year || '전체'}_${department || '전체'}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    
    // PDF 스트림을 응답으로 전송
    doc.pipe(res);
    doc.end();
    
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 실제 화면 캡처 PDF 생성 (Puppeteer 사용) - 임시로 인증 우회
router.post('/pdf-screen', async (req, res) => {
  let browser;
  try {
    console.log('=== PDF 생성 시작 ===');
    const { year, department, yearRange, orientation = 'portrait' } = req.body;
    console.log('요청 파라미터:', { year, department, yearRange, orientation });
    
    // Puppeteer 브라우저 실행
    console.log('Puppeteer 브라우저 실행 중...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('브라우저 실행 완료');
    
    const page = await browser.newPage();
    console.log('새 페이지 생성 완료');
    
    // JWT 토큰 가져오기
    const token = req.headers.authorization?.replace('Bearer ', '') || 'test-token';
    console.log('JWT 토큰 설정:', token.substring(0, 20) + '...');
    
    // 프론트엔드 URL 구성
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      year: year || '',
      department: department || '',
      yearRange: yearRange || '',
      orientation: orientation,
      token: token  // URL 파라미터로 토큰 전달
    });
    
    const url = `${frontendUrl}/statistics?${params.toString()}`;
    console.log('접근할 URL:', url);
    
    // 통계 페이지로 이동
    console.log('통계 페이지로 이동...');
    await page.goto(url, { waitUntil: "networkidle0" });
    console.log('통계 페이지 이동 완료');
    
    // 페이지 로딩 대기
    console.log('페이지 로딩 대기...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 현재 URL 확인
    const currentUrl = await page.url();
    console.log('현재 URL:', currentUrl);
    
    // 로그인 페이지로 리다이렉트된 경우 토큰과 사용자 정보를 localStorage에 직접 설정
    if (currentUrl.includes('/login')) {
      console.log('로그인 페이지로 리다이렉트됨, 토큰과 사용자 정보를 localStorage에 직접 설정...');
      
      // JWT 토큰에서 사용자 정보 추출 (간단한 디코딩)
      let userData;
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userData = {
          id: payload.id,
          email: payload.email,
          name: payload.name,
          role: payload.role
        };
        console.log('추출된 사용자 정보:', userData);
      } catch (error) {
        console.log('토큰 디코딩 실패, 기본 사용자 정보 사용');
        userData = {
          id: 1,
          email: 'admin@ncs.com',
          name: '관리자',
          role: '관리자'
        };
      }
      
      await page.evaluate((token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('토큰과 사용자 정보가 localStorage에 설정됨');
      }, token, userData);
      
      // 페이지 새로고침하여 인증 상태 적용
      console.log('페이지 새로고침...');
      await page.reload({ waitUntil: "networkidle0" });
      
      // 다시 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // URL 재확인
      const newUrl = await page.url();
      console.log('새로고침 후 URL:', newUrl);
      
      // 대시보드에서 통계 페이지로 이동
      if (newUrl === 'http://localhost:3000/' || newUrl === 'http://localhost:3000') {
        console.log('대시보드에서 통계 페이지로 이동...');
        await page.goto(url, { waitUntil: "networkidle0" });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 이동 후 URL 재확인
        const finalUrl = await page.url();
        console.log('통계 페이지 이동 후 URL:', finalUrl);
      }
    }
    
    // 페이지 제목 확인
    const pageTitle = await page.title();
    console.log('페이지 제목:', pageTitle);
    
    // 현재 URL이 통계 페이지가 아닌 경우 통계 페이지로 이동
    const currentFinalUrl = await page.url();
    if (!currentFinalUrl.includes('/statistics')) {
      console.log('통계 페이지가 아님, 통계 페이지로 이동...');
      await page.goto(url, { waitUntil: "networkidle0" });
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const movedUrl = await page.url();
      console.log('통계 페이지 이동 후 URL:', movedUrl);
    }
    
    // 통계 콘텐츠 영역 찾기
    console.log('통계 콘텐츠 영역 찾는 중...');
    const contentElement = await page.$('#statistics-content');
    console.log('통계 콘텐츠 요소:', contentElement ? '찾음' : '없음');
    
    if (!contentElement) {
      // 페이지 HTML 일부 확인
      const pageContent = await page.content();
      console.log('페이지 HTML 길이:', pageContent.length);
      console.log('페이지 HTML 일부:', pageContent.substring(0, 500));
      
      // 로그인 페이지로 리다이렉트되었는지 확인
      if (currentUrl.includes('/login')) {
        throw new Error('인증이 필요합니다. 로그인 페이지로 리다이렉트되었습니다.');
      }
      
      throw new Error('통계 콘텐츠를 찾을 수 없습니다.');
    }
    
    // 통계 콘텐츠가 제대로 로드되었는지 확인
    console.log('통계 콘텐츠 로딩 확인...');
    const hasData = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      const charts = document.querySelectorAll('[class*="recharts"]');
      return tables.length > 0 || charts.length > 0;
    });
    console.log('데이터 존재 여부:', hasData);
    
    if (!hasData) {
      console.log('통계 데이터가 로드되지 않음, 추가 대기...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // PDF 생성 전 추가 대기
    console.log('PDF 생성 전 최종 대기...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // PDF 생성 옵션
    const pdfOptions = {
      path: null, // 파일로 저장하지 않고 버퍼로 반환
      format: 'A4',
      landscape: orientation === 'landscape',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      timeout: 30000 // 30초 타임아웃
    };
    
    // PDF 생성
    console.log('PDF 생성 시작...');
    let pdfBuffer;
    try {
      // 페이지가 완전히 로드되었는지 확인
      await page.waitForFunction(() => document.readyState === 'complete');
      
      // 통계 콘텐츠가 실제로 렌더링되었는지 다시 확인
      const contentExists = await page.evaluate(() => {
        const statisticsContent = document.querySelector('#statistics-content');
        return statisticsContent && statisticsContent.children.length > 0;
      });
      
      if (!contentExists) {
        throw new Error('통계 콘텐츠가 렌더링되지 않았습니다.');
      }
      
      // PDF 생성 전 페이지 스크린샷 확인
      const screenshot = await page.screenshot({ fullPage: true });
      console.log('페이지 스크린샷 크기:', screenshot.length, 'bytes');
      
      // PDF 생성 전 최종 대기
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    // PDF 생성 옵션을 더 간단하게 설정
    const simplePdfOptions = {
      format: 'A4',
      landscape: orientation === 'landscape',
      printBackground: true,
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm'
      },
      preferCSSPageSize: false,
      displayHeaderFooter: false,
      scale: 0.8
    };
      
      // PDF 생성
      console.log('PDF 생성 시작...');
      
      // PDF 생성 전 페이지 상태 확인
      const pageContent = await page.content();
      console.log('페이지 HTML 길이:', pageContent.length);
      
      // PDF 생성 시도
      try {
        pdfBuffer = await page.pdf(simplePdfOptions);
        console.log('PDF 생성 완료, 크기:', pdfBuffer.length, 'bytes');
        
        // PDF 버퍼 유효성 검사
        if (!pdfBuffer || pdfBuffer.length === 0) {
          throw new Error('PDF 버퍼가 비어있습니다.');
        }
        
        // PDF 헤더 확인
        const pdfHeader = pdfBuffer.toString('ascii', 0, 4);
        console.log('PDF 헤더:', pdfHeader);
        
        if (pdfHeader !== '%PDF') {
          console.log('PDF 헤더가 올바르지 않습니다. 재시도...');
          // 재시도
          await new Promise(resolve => setTimeout(resolve, 2000));
          pdfBuffer = await page.pdf(simplePdfOptions);
          console.log('재시도 후 PDF 크기:', pdfBuffer.length, 'bytes');
        }
        
        console.log('PDF 생성 성공');
        
      } catch (pdfError) {
        console.error('PDF 생성 오류:', pdfError);
        throw new Error(`PDF 생성 실패: ${pdfError.message}`);
      }
      
    } catch (pdfError) {
      console.error('PDF 생성 오류:', pdfError);
      throw new Error(`PDF 생성 실패: ${pdfError.message}`);
    }
    
    // 응답 헤더 설정
    const fileName = `새가족등록현황보고_${year || '전체'}_${department || '전체'}_${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    // PDF 파일을 uploads 폴더에 저장하여 테스트
    const fs = require('fs');
    const path = require('path');
    
    // uploads 폴더가 없으면 생성
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // PDF 파일 저장
    const filePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);
    console.log('PDF 파일 저장 완료:', filePath);
    console.log('저장된 파일 크기:', fs.statSync(filePath).size, 'bytes');
    
    // PDF 버퍼 전송
    console.log('PDF 전송 시작...');
    console.log('PDF 버퍼 크기:', pdfBuffer.length);
    console.log('PDF 헤더:', pdfBuffer.toString('ascii', 0, 10));
    
    // 응답 헤더 설정 (순서 중요)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // PDF 버퍼를 직접 전송 (res.send 대신 res.end 사용)
    res.end(pdfBuffer);
    console.log('PDF 전송 완료');
    
  } catch (error) {
    console.error('화면 캡처 PDF 생성 실패:', error);
    console.error('오류 스택:', error.stack);
    res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

module.exports = router;
