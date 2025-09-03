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

// 통계 자동 생성
router.post('/generate', async (req, res) => {
  let conn;
  try {
    const { year } = req.body;
    
    if (!year || year < 2025) {
      return res.status(400).json({ message: '2025년 이후부터 통계를 생성할 수 있습니다.' });
    }

    conn = await pool.getConnection();
    
    // 1. new_comers에서 초신자, 전입신자 등록자 수 count (각각 개별 쿼리)
    const [newComerCount] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '초신자'
    `, [year]);
    
    const [transferBelieverCount] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자'
    `, [year]);

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
        AND education_type NOT IN ('수료', '교육중단')
    `, [year]);
    
    const [newComerEducationDiscontinued] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '초신자' 
        AND education_type = '교육중단'
    `, [year]);
    
    const [transferBelieverEducationInProgress] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자' 
        AND education_type NOT IN ('수료', '교육중단')
    `, [year]);
    
    const [transferBelieverEducationDiscontinued] = await conn.query(`
      SELECT COUNT(*) as count
      FROM new_comers 
      WHERE EXTRACT(YEAR FROM register_date) = ? AND believer_type = '전입신자' 
        AND education_type = '교육중단'
    `, [year]);

    // 디버깅을 위한 로그 추가
    console.log('newComerCount:', newComerCount);
    console.log('transferBelieverCount:', transferBelieverCount);
    console.log('newComerGraduatePrev:', newComerGraduatePrev);
    console.log('newComerGraduateCurrent:', newComerGraduateCurrent);
    console.log('transferBelieverGraduatePrev:', transferBelieverGraduatePrev);
    console.log('transferBelieverGraduateCurrent:', transferBelieverGraduateCurrent);
    console.log('newComerEducationInProgress:', newComerEducationInProgress);
    console.log('newComerEducationDiscontinued:', newComerEducationDiscontinued);
    console.log('transferBelieverEducationInProgress:', transferBelieverEducationInProgress);
    console.log('transferBelieverEducationDiscontinued:', transferBelieverEducationDiscontinued);
    
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
    const [existingData] = await conn.query('SELECT * FROM yearly_new_family_statistics WHERE year = ?', [year]);
    console.log('existingData:', existingData);
    
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
        WHERE year = ?
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
        year
      ]);
      
      res.json({ message: `${year}년 통계가 성공적으로 업데이트되었습니다.` });
    } else {
      // 새 데이터 삽입
      await conn.query(`
        INSERT INTO yearly_new_family_statistics (
          year, new_comer_registration, transfer_believer_registration, total_registration,
          new_comer_graduate_prev_year, new_comer_graduate_current_year, new_comer_graduate_total,
          transfer_believer_graduate_prev_year, transfer_believer_graduate_current_year, transfer_believer_graduate_total,
          total_graduate, new_comer_education_in_progress, new_comer_education_discontinued, new_comer_education_total,
          transfer_believer_education_in_progress, transfer_believer_education_discontinued, transfer_believer_education_total,
          total_education
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        year,
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
    
    // 디버깅: 기본 데이터 확인
    const [totalCount] = await conn.query(`
      SELECT COUNT(*) as total FROM new_comers 
      WHERE department = '새가족위원회' AND YEAR(register_date) = ?
    `, [year]);
    console.log(`${year}년 새가족위원회 총 등록자 수:`, totalCount.total);
    
    // 디버깅: 월별 데이터 확인
    const [monthlyCount] = await conn.query(`
      SELECT MONTH(register_date) as month, COUNT(*) as count 
      FROM new_comers 
      WHERE department = '새가족위원회' AND YEAR(register_date) = ?
      GROUP BY MONTH(register_date)
      ORDER BY month
    `, [year]);
    console.log(`${year}년 월별 등록자 수:`, monthlyCount);
    
    // 디버깅: 연령대별 테스트
    const [ageTest] = await conn.query(`
      SELECT 
        name,
        birth_date,
        TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age,
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 30 AND 39 THEN '30s'
          ELSE 'other'
        END as age_group
      FROM new_comers 
      WHERE department = '새가족위원회' AND YEAR(register_date) = ?
      LIMIT 5
    `, [year]);
    console.log('연령대 계산 테스트:', ageTest);
    
    // 기존 월별/연령대별 통계 데이터 삭제 (해당 년도, 부서 기준)
    await conn.query('DELETE FROM new_comers_monthly_age_statistics WHERE year = ? AND department = ?', [year, '새가족위원회']);
    console.log(`${year}년 새가족위원회 기존 월별/연령대별 통계 삭제 완료`);
    
    // 1~12월까지 각 월별로 통계 생성
    for (let month = 1; month <= 12; month++) {
      console.log(`${month}월 통계 생성 중...`);
      
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
          AND department = '새가족위원회'
          AND believer_type = '초신자'
        GROUP BY age_group
      `, [year, month]);
      
      console.log(`${month}월 초신자 통계 쿼리 결과:`, newComerMonthlyStats);
      
      // 디버깅: 원본 데이터 확인
      const [debugData] = await conn.query(`
        SELECT name, birth_date, register_date, believer_type,
               TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
        FROM new_comers 
        WHERE YEAR(register_date) = ? 
          AND MONTH(register_date) = ?
          AND department = '새가족위원회'
          AND believer_type = '초신자'
        LIMIT 3
      `, [year, month]);
      console.log(`${month}월 초신자 디버그 데이터:`, debugData);
      
      // 디버깅: 40대 데이터 특별 확인 (8월인 경우)
      if (month === 8) {
        const [age40Data] = await conn.query(`
          SELECT name, birth_date, register_date, believer_type,
                 TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
          FROM new_comers 
          WHERE YEAR(register_date) = ? 
            AND MONTH(register_date) = ?
            AND department = '새가족위원회'
            AND believer_type = '초신자'
            AND TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) BETWEEN 40 AND 49
        `, [year, month]);
        console.log(`${month}월 40대 초신자 특별 확인:`, age40Data);
        
        // 디버깅: 전체 데이터 확인
        const [allData] = await conn.query(`
          SELECT name, birth_date, register_date, believer_type,
                 TIMESTAMPDIFF(YEAR, birth_date, CURDATE()) as age
          FROM new_comers 
          WHERE YEAR(register_date) = ? 
            AND MONTH(register_date) = ?
            AND department = '새가족위원회'
            AND believer_type = '초신자'
          ORDER BY age
        `, [year, month]);
        console.log(`${month}월 전체 초신자 데이터:`, allData);
      }
      
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
          AND department = '새가족위원회'
          AND believer_type = '전입신자'
        GROUP BY age_group
      `, [year, month]);
      
      console.log(`${month}월 전입신자 통계 쿼리 결과:`, transferBelieverMonthlyStats);
      
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
      
      console.log(`${month}월 초신자 통계 배열 변환 결과:`, statsArray);
      
      statsArray.forEach(stat => {
        if (stat && stat.age_group && stat.age_group !== 'unknown') {
          newComerAgeStats[stat.age_group] = parseInt(stat.count) || 0;
        }
      });
      
      console.log(`${month}월 초신자 연령대별 정리 결과:`, newComerAgeStats);
      
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
      
      console.log(`${month}월 전입신자 통계 배열 변환 결과:`, transferStatsArray);
      
      transferStatsArray.forEach(stat => {
        if (stat && stat.age_group && stat.age_group !== 'unknown') {
          transferBelieverAgeStats[stat.age_group] = parseInt(stat.count) || 0;
        }
      });
      
      console.log(`${month}월 전입신자 연령대별 정리 결과:`, transferBelieverAgeStats);
      
      // 초신자 월별/연령대별 통계 저장
      const newComerTotal = Object.values(newComerAgeStats).reduce((sum, count) => sum + count, 0);
      await conn.query(`
        INSERT INTO new_comers_monthly_age_statistics (
          year, department, month, believer_type,
          age_group_10s, age_group_20s, age_group_30s, age_group_40s, 
          age_group_50s, age_group_60s, age_group_70s_plus, total_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        year, '새가족위원회', month, '초신자',
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
        year, '새가족위원회', month, '전입신자',
        transferBelieverAgeStats['10s'], transferBelieverAgeStats['20s'], transferBelieverAgeStats['30s'], transferBelieverAgeStats['40s'],
        transferBelieverAgeStats['50s'], transferBelieverAgeStats['60s'], transferBelieverAgeStats['70s_plus'], transferBelieverTotal
      ]);
      
      console.log(`${month}월 통계 생성 완료 - 초신자: ${newComerTotal}명, 전입신자: ${transferBelieverTotal}명`);
    }
    
    console.log('=== 월별/연령대별 통계 생성 완료 ===');
    console.log(`${year}년 새가족위원회 월별/연령대별 통계가 성공적으로 생성되었습니다.`);

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
    
    // 디버깅: 전체 테이블 데이터 확인
    const debugQuery = `SELECT COUNT(*) as total_count FROM new_comers_monthly_age_statistics WHERE year = ?`;
    const [debugResult] = await conn.query(debugQuery, [year]);
    console.log('=== 디버깅: 전체 테이블 데이터 확인 ===');
    console.log(`${year}년 전체 데이터 개수:`, debugResult.total_count);
    
    const queryResult = await conn.query(query, [year, department || '새가족위원회']);
    console.log('=== 데이터베이스 쿼리 결과 ===');
    console.log('쿼리 파라미터:', { year, department: department || '새가족위원회' });
    console.log('queryResult 타입:', typeof queryResult);
    console.log('queryResult 길이:', queryResult.length);
    console.log('queryResult[0] 타입:', typeof queryResult[0]);
    
    // queryResult 자체가 rows 배열이므로 직접 사용
    const rowsArray = queryResult;
    console.log('rowsArray 타입:', typeof rowsArray);
    console.log('rowsArray 길이:', rowsArray.length);
    
    console.log('처리된 rowsArray 타입:', typeof rowsArray);
    console.log('rowsArray 길이:', rowsArray.length);
    console.log('rowsArray 내용 (처음 3개):', rowsArray.slice(0, 3));
    


    const monthlyData = {};
    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    
    // 1~12월 초기화
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = {
        초신자: { '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0, total: 0 },
        전입신자: { '10s': 0, '20s': 0, '30s': 0, '40s': 0, '50s': 0, '60s': 0, '70s_plus': 0, total: 0 }
      };
    }
    
    // 데이터 채우기
    console.log('=== 데이터 처리 시작 ===');
    console.log('처리할 총 행 개수:', rowsArray.length);
    
    rowsArray.forEach((row, index) => {
      // 데이터 타입 명시적 변환
      const month = parseInt(row.month, 10);  // 문자열을 숫자로 변환
      const believerType = row.believer_type;
      
      console.log(`[${index + 1}/${rowsArray.length}] 처리 중: month=${month}, believerType=${believerType}`);
      
      ageGroups.forEach(ageGroup => {
        const fieldName = `age_group_${ageGroup}`;
        const value = parseInt(row[fieldName], 10) || 0;  // 숫자로 변환
        monthlyData[month][believerType][ageGroup] = value;
      });
      
      monthlyData[month][believerType].total = parseInt(row.total_count, 10) || 0;  // 숫자로 변환
    });
    
    console.log('=== 데이터 처리 완료 ===');
    
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

module.exports = router;
