const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const PDFDocument = require('pdfkit');

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }
  if (token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

// 1. 연도별 전체 통계
router.get('/yearly', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(`
      SELECT * FROM yearly_statistics 
      ORDER BY year DESC
    `);
    res.json(result);
  } catch (error) {
    console.error('연도별 통계 조회 실패:', error);
    res.status(500).json({ error: '연도별 통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 2. 월별 통계
router.get('/monthly', authenticateToken, async (req, res) => {
  const { year } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = 'SELECT * FROM monthly_statistics';
    let params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
    }
    
    sql += ' ORDER BY year DESC, month ASC';
    
    const result = await conn.query(sql, params);
    res.json(result);
  } catch (error) {
    console.error('월별 통계 조회 실패:', error);
    res.status(500).json({ error: '월별 통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 3. 연령대별 통계
router.get('/age-group', authenticateToken, async (req, res) => {
  const { year, month } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = 'SELECT * FROM age_group_statistics';
    let params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
      
      if (month) {
        sql += ' AND month = ?';
        params.push(month);
      } else {
        sql += ' AND month = 0'; // 연도 전체
      }
    }
    
    sql += ' ORDER BY year DESC, month ASC, age_group ASC';
    
    const result = await conn.query(sql, params);
    res.json(result);
  } catch (error) {
    console.error('연령대별 통계 조회 실패:', error);
    res.status(500).json({ error: '연령대별 통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 4. 주별 통계
router.get('/weekly', authenticateToken, async (req, res) => {
  const { year, month } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    let sql = 'SELECT * FROM weekly_statistics';
    let params = [];
    
    if (year) {
      sql += ' WHERE year = ?';
      params.push(year);
      
      if (month) {
        sql += ' AND month = ?';
        params.push(month);
      }
    }
    
    sql += ' ORDER BY year DESC, month ASC, week ASC';
    
    const result = await conn.query(sql, params);
    res.json(result);
  } catch (error) {
    console.error('주별 통계 조회 실패:', error);
    res.status(500).json({ error: '주별 통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 5. 통계 요약 (대시보드용)
router.get('/summary', authenticateToken, async (req, res) => {
  const { year, month } = req.query;
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 연도별 요약
    const yearlySummary = await conn.query(`
      SELECT 
        SUM(new_believers_registered) as total_new_believers,
        SUM(transfer_believers_registered) as total_transfer_believers,
        SUM(total_registered) as total_registered,
        SUM(new_believers_completed) as total_new_completed,
        SUM(transfer_believers_completed) as total_transfer_completed,
        SUM(total_completed) as total_completed
      FROM yearly_statistics
      WHERE year = ?
    `, [year || new Date().getFullYear()]);
    
    // 월별 요약
    const monthlySummary = await conn.query(`
      SELECT 
        SUM(new_believers_registered) as month_new_believers,
        SUM(transfer_believers_registered) as month_transfer_believers,
        SUM(total_registered) as month_total_registered
      FROM monthly_statistics
      WHERE year = ? AND month = ?
    `, [year || new Date().getFullYear(), month || new Date().getMonth() + 1]);
    
    res.json({
      yearly: yearlySummary[0] || {},
      monthly: monthlySummary[0] || {}
    });
  } catch (error) {
    console.error('통계 요약 조회 실패:', error);
    res.status(500).json({ error: '통계 요약 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 6. PDF 생성 API
router.get('/pdf/:type', authenticateToken, async (req, res) => {
  const { type } = req.params;
  const { year, month } = req.query;
  let conn;
  
  try {
    conn = await pool.getConnection();
    
    // PDF 문서 생성
    const doc = new PDFDocument();
    
    // 응답 헤더 설정
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${type}_statistics_${year}.pdf"`);
    
    // PDF 스트림을 응답으로 파이프
    doc.pipe(res);
    
    // 제목 추가
    doc.fontSize(20).text('새가족 등록현황 통계 보고서', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, { align: 'center' });
    doc.moveDown(2);
    
    // 타입별 데이터 조회 및 PDF 생성
    switch (type) {
      case 'overall':
        await generateOverallPdf(doc, conn, year);
        break;
      case 'yearly':
        await generateYearlyPdf(doc, conn, year);
        break;
      case 'monthly':
        await generateMonthlyPdf(doc, conn, year, month);
        break;
      case 'age-group':
        await generateAgeGroupPdf(doc, conn, year, month);
        break;
      default:
        doc.fontSize(16).text('지원하지 않는 통계 타입입니다.');
    }
    
    doc.end();
    
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    res.status(500).json({ error: 'PDF 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 전체 현황 PDF 생성
async function generateOverallPdf(doc, conn, year) {
  const yearlyData = await conn.query(`
    SELECT * FROM yearly_statistics 
    ORDER BY year DESC
  `);
  
  doc.fontSize(16).text('연도별 전체 등록자/수료자 현황', { underline: true });
  doc.moveDown();
  
  // 테이블 헤더
  const headers = ['연도', '초신자 등록', '전입신자 등록', '총 등록', '초신자 수료', '전입신자 수료', '총 수료'];
  let y = doc.y;
  
  headers.forEach((header, i) => {
    doc.fontSize(10).text(header, 50 + i * 70, y);
  });
  
  doc.moveDown();
  
  // 데이터 행
  yearlyData.forEach(row => {
    y = doc.y;
    doc.fontSize(9).text(`${row.year}년`, 50, y);
    doc.text(row.new_believers_registered.toString(), 120, y);
    doc.text(row.transfer_believers_registered.toString(), 190, y);
    doc.text(row.total_registered.toString(), 260, y);
    doc.text(row.new_believers_completed.toString(), 330, y);
    doc.text(row.transfer_believers_completed.toString(), 400, y);
    doc.text(row.total_completed.toString(), 470, y);
    doc.moveDown(0.5);
  });
}

// 연도별 상세 분석 PDF 생성
async function generateYearlyPdf(doc, conn, year) {
  const yearlyData = await conn.query(`
    SELECT * FROM yearly_statistics 
    ORDER BY year DESC
  `);
  
  doc.fontSize(16).text('2019~2025년 새가족 등록현황 보고서', { underline: true });
  doc.moveDown();
  
  // 복잡한 테이블 구조
  doc.fontSize(10).text('등록', 50, doc.y);
  doc.text('수료', 200, doc.y);
  doc.text('교육', 350, doc.y);
  doc.moveDown();
  
  yearlyData.forEach(row => {
    const y = doc.y;
    doc.fontSize(9).text(`${row.year}년`, 50, y);
    doc.text(`초신자: ${row.new_believers_registered}`, 70, y);
    doc.text(`전입신자: ${row.transfer_believers_registered}`, 70, y + 15);
    doc.text(`합계: ${row.total_registered}`, 70, y + 30);
    
    doc.text(`초신자: ${row.new_believers_completed}`, 220, y);
    doc.text(`전입신자: ${row.transfer_believers_completed}`, 220, y + 15);
    doc.text(`합계: ${row.total_completed}`, 220, y + 30);
    
    doc.text(`초신자: ${row.new_believers_education_in_progress}`, 370, y);
    doc.text(`전입신자: ${row.transfer_believers_education_in_progress}`, 370, y + 15);
    doc.text(`합계: ${row.total_education}`, 370, y + 30);
    
    doc.moveDown(2);
  });
}

// 월별 현황 PDF 생성
async function generateMonthlyPdf(doc, conn, year, month) {
  const monthlyData = await conn.query(`
    SELECT * FROM monthly_statistics 
    WHERE year = ? 
    ORDER BY month ASC
  `, [year]);
  
  doc.fontSize(16).text(`${year}년 월별 등록현황`, { underline: true });
  doc.moveDown();
  
  // 테이블 헤더
  const headers = ['월', '초신자', '전입신자', '합계'];
  let y = doc.y;
  
  headers.forEach((header, i) => {
    doc.fontSize(10).text(header, 50 + i * 100, y);
  });
  
  doc.moveDown();
  
  // 데이터 행
  monthlyData.forEach(row => {
    y = doc.y;
    doc.fontSize(9).text(`${row.month}월`, 50, y);
    doc.text(row.new_believers_registered.toString(), 150, y);
    doc.text(row.transfer_believers_registered.toString(), 250, y);
    doc.text(row.total_registered.toString(), 350, y);
    doc.moveDown(0.5);
  });
}

// 연령대별 분석 PDF 생성
async function generateAgeGroupPdf(doc, conn, year, month) {
  const ageGroupData = await conn.query(`
    SELECT * FROM age_group_statistics 
    WHERE year = ? AND month = 0
    ORDER BY age_group ASC
  `, [year]);
  
  doc.fontSize(16).text('초신자 및 전입신자 등록자의 연령대별 현황', { underline: true });
  doc.moveDown();
  
  // 테이블 헤더
  const headers = ['연령대', '초신자', '전입신자', '합계'];
  let y = doc.y;
  
  headers.forEach((header, i) => {
    doc.fontSize(10).text(header, 50 + i * 100, y);
  });
  
  doc.moveDown();
  
  // 데이터 행
  ageGroupData.forEach(row => {
    y = doc.y;
    doc.fontSize(9).text(row.age_group, 50, y);
    doc.text(row.new_believers_count.toString(), 150, y);
    doc.text(row.transfer_believers_count.toString(), 250, y);
    doc.text(row.total_count.toString(), 350, y);
    doc.moveDown(0.5);
  });
}

module.exports = router;

