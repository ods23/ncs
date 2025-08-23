const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('인증 헤더:', authHeader);
  console.log('추출된 토큰:', token ? '존재함' : '없음');

  if (!token) {
    console.log('토큰이 없음 - 401 반환');
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }

  try {
    const jwt = require('jsonwebtoken');
    console.log('JWT_SECRET 존재:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('토큰 디코딩 성공:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('토큰 검증 실패:', error.message);
    console.error('토큰 검증 오류 상세:', error);
    return res.status(403).json({ 
      error: '유효하지 않은 토큰입니다.',
      details: error.message 
    });
  }
};

// 사용자메뉴 목록 가져오기
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT um.*, u.name, u.email, m.menu_name
      FROM user_menus um
      JOIN users u ON um.user_id = u.id
      JOIN menus m ON um.menu_id = m.id
      ORDER BY um.menu_id, um.id
    `);
    res.json(rows);
  } catch (error) {
    console.error('사용자메뉴 목록 가져오기 실패:', error);
    res.status(500).json({ error: '사용자메뉴 목록을 가져오는데 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 특정 메뉴에 연결된 사용자 목록 가져오기
router.get('/menu/:menuId', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT um.*, u.name, u.email, u.role, u.department, u.teacher_type, u.position, u.phone
      FROM user_menus um
      JOIN users u ON um.user_id = u.id
      WHERE um.menu_id = ?
      ORDER BY um.id
    `, [req.params.menuId]);
    res.json(rows);
  } catch (error) {
    console.error('메뉴별 사용자 목록 가져오기 실패:', error);
    res.status(500).json({ error: '메뉴별 사용자 목록을 가져오는데 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 사용자메뉴 추가
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    console.log('사용자메뉴 추가 요청 받음');
    console.log('요청 본문:', req.body);
    console.log('인증된 사용자:', req.user);
    
    const { userId, menuId } = req.body;

    if (!userId || !menuId) {
      console.log('필수 필드 누락:', { userId, menuId });
      return res.status(400).json({ error: '사용자 ID와 메뉴 ID가 필요합니다.' });
    }

    conn = await pool.getConnection();
    console.log('데이터베이스 연결 성공');

    // 중복 체크
    const existingRows = await conn.query(`
      SELECT id FROM user_menus WHERE user_id = ? AND menu_id = ?
    `, [userId, menuId]);

    console.log('중복 체크 결과:', existingRows);

    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 연결된 사용자입니다.' });
    }

    await conn.query(`
      INSERT INTO user_menus (user_id, menu_id)
      VALUES (?, ?)
    `, [userId, menuId]);

    console.log('사용자메뉴 추가 성공');
    res.status(201).json({ message: '사용자가 메뉴에 성공적으로 연결되었습니다.' });
  } catch (error) {
    console.error('사용자메뉴 추가 실패:', error);
    console.error('오류 상세:', error.message);
    res.status(500).json({ error: '사용자메뉴 추가 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 사용자메뉴 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM user_menus WHERE id = ?', [req.params.id]);
    res.json({ message: '사용자메뉴가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자메뉴 삭제 실패:', error);
    res.status(500).json({ error: '사용자메뉴 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 특정 사용자의 메뉴와 화면 목록 가져오기
router.get('/user/:userId', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // 사용자의 메뉴 목록 가져오기
    const menuRows = await conn.query(`
      SELECT m.*
      FROM menus m
      JOIN user_menus um ON m.id = um.menu_id
      WHERE um.user_id = ?
      ORDER BY m.menu_order ASC, m.menu_name ASC
    `, [req.params.userId]);

    // 각 메뉴에 연결된 화면들 가져오기
    const result = [];
    for (const menu of menuRows) {
      const screenRows = await conn.query(`
        SELECT s.*
        FROM screens s
        JOIN menu_screens ms ON s.id = ms.screen_id
        WHERE ms.menu_id = ?
        ORDER BY ms.screen_order ASC, s.screen_name ASC
      `, [menu.id]);

      result.push({
        ...menu,
        screens: screenRows
      });
    }

    res.json(result);
  } catch (error) {
    console.error('사용자별 메뉴와 화면 목록 가져오기 실패:', error);
    res.status(500).json({ error: '사용자별 메뉴와 화면 목록을 가져오는데 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 