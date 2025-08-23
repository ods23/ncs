const express = require('express');
const { pool } = require('../config/database');
const XLSX = require('xlsx');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// 모든 신자 통합 조회 (초신자 + 전입신자)
router.get('/all', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { name, education_type, phone, teacher, year, believer_type } = req.query;
    
    conn = await pool.getConnection();
    
    let sql = `
      SELECT 
        nc.id,
        nc.department,
        nc.believer_type,
        nc.education_type,
        nc.year,
        nc.number,
        nc.name,
        nc.gender,
        nc.marital_status,
        DATE_FORMAT(nc.birth_date, '%Y-%m-%d') as birth_date,
        nc.address,
        nc.phone,
        nc.teacher,
        DATE_FORMAT(nc.register_date, '%Y-%m-%d') as register_date,
        DATE_FORMAT(nc.education_start_date, '%Y-%m-%d') as education_start_date,
        DATE_FORMAT(nc.education_end_date, '%Y-%m-%d') as education_end_date,
        nc.affiliation_org,
        nc.belong,
        DATE_FORMAT(nc.new_life_strategy_date, '%Y-%m-%d') as new_life_strategy_date,
        nc.identity_verified,
        nc.prev_church,
        nc.comment,
        nc.graduate_transfer_status,
        nc.created_at,
        nc.updated_at
      FROM new_comers nc
      LEFT JOIN code_details cd ON nc.believer_type = cd.code_value
      LEFT JOIN code_groups cg ON cd.group_id = cg.id
      WHERE nc.believer_type IN ('초신자', '전입신자')
        AND cg.group_code = '신자'
    `;
    
    const params = [];
    
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
    
    // 담당교사 조건 (부분 검색)
    if (teacher && teacher.trim() !== '') {
      sql += ' AND teacher LIKE ?';
      params.push(`%${teacher}%`);
    }
    
    // 년도 조건
    if (year && year.trim() !== '') {
      sql += ' AND year = ?';
      params.push(year);
    }
    
    // 신자구분 조건 (전체가 아닌 경우에만 필터링)
    if (believer_type && believer_type.trim() !== '' && believer_type !== '전체') {
      sql += ' AND believer_type = ?';
      params.push(believer_type);
    }
    
    sql += ' ORDER BY cd.sort_order ASC, nc.id ASC';
    
    console.log('=== 전체 신자 조회 시작 ===');
    console.log('요청 쿼리 파라미터:', req.query);
    console.log('전체 신자 조회 SQL:', sql);
    console.log('전체 신자 조회 파라미터:', params);
    console.log('=== 전체 신자 조회 완료 ===');
    
    const rows = await conn.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('전체 신자 조회 실패:', error);
    res.status(500).json({ error: '전체 신자 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 신자 유형별 통계 조회
router.get('/statistics', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.query;
    
    conn = await pool.getConnection();
    
    let whereClause = "WHERE believer_type IN ('초신자', '전입신자')";
    const params = [];
    
    if (year && year.trim() !== '') {
      whereClause += ' AND year = ?';
      params.push(year);
    }
    
    const sql = `
      SELECT 
        believer_type,
        COUNT(*) as total_count,
        SUM(CASE WHEN education_type = '진행중' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN education_type = '수료' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN education_type = '중단' THEN 1 ELSE 0 END) as discontinued
      FROM new_comers
      ${whereClause}
      GROUP BY believer_type
      ORDER BY believer_type
    `;
    
    const rows = await conn.query(sql, params);
    
    // 전체 합계 계산
    const totalStats = {
      total_count: 0,
      in_progress: 0,
      completed: 0,
      discontinued: 0
    };
    
    rows.forEach(row => {
      totalStats.total_count += row.total_count;
      totalStats.in_progress += row.in_progress;
      totalStats.completed += row.completed;
      totalStats.discontinued += row.discontinued;
    });
    
    res.json({
      by_type: rows,
      total: totalStats
    });
  } catch (error) {
    console.error('통계 조회 실패:', error);
    res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 부서별 신자 현황 조회
router.get('/by-department', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { year } = req.query;
    
    conn = await pool.getConnection();
    
    let whereClause = "WHERE believer_type IN ('초신자', '전입신자')";
    const params = [];
    
    if (year && year.trim() !== '') {
      whereClause += ' AND year = ?';
      params.push(year);
    }
    
    const sql = `
      SELECT 
        department,
        believer_type,
        COUNT(*) as count
      FROM new_comers
      ${whereClause}
      GROUP BY department, believer_type
      ORDER BY department, believer_type
    `;
    
    const rows = await conn.query(sql, params);
    
    // 부서별로 그룹화
    const departmentStats = {};
    rows.forEach(row => {
      if (!departmentStats[row.department]) {
        departmentStats[row.department] = {
          department: row.department,
          초신자: 0,
          전입신자: 0,
          total: 0
        };
      }
      departmentStats[row.department][row.believer_type] = row.count;
      departmentStats[row.department].total += row.count;
    });
    
    res.json(Object.values(departmentStats));
  } catch (error) {
    console.error('부서별 현황 조회 실패:', error);
    res.status(500).json({ error: '부서별 현황 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// Excel 다운로드 (전체 신자)
router.get('/download/excel', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { believer_type, year, education_type } = req.query;
    
    conn = await pool.getConnection();
    
    let sql = `
      SELECT 
        department as '부서',
        believer_type as '신자구분',
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
      WHERE believer_type IN ('초신자', '전입신자')
    `;
    
    const params = [];
    
    if (believer_type && believer_type !== '전체') {
      sql += ' AND believer_type = ?';
      params.push(believer_type);
    }
    
    if (year && year.trim() !== '') {
      sql += ' AND year = ?';
      params.push(year);
    }
    
    if (education_type && education_type.trim() !== '') {
      sql += ' AND education_type = ?';
      params.push(education_type);
    }
    
    sql += ' ORDER BY year DESC, believer_type, department, name';
    
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
    
    const sheetName = believer_type && believer_type !== '전체' ? `${believer_type}목록` : '전체신자목록';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Excel 파일 생성
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 파일명 설정 (현재 날짜 포함)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `전체신자목록_${dateStr}.xlsx`;
    
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

module.exports = router; 