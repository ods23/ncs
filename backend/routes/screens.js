const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }

  // JWT 검증 로직 (간단한 토큰 체크)
  if (token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }

  next();
};

// 화면 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM screens 
      ORDER BY screen_name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('화면 목록 조회 실패:', error);
    res.status(500).json({ error: '화면 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 화면 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM screens WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '화면을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('화면 상세 조회 실패:', error);
    res.status(500).json({ error: '화면 상세 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 경로별 화면 조회 (정규식 사용)
router.get('/path/*', authenticateToken, async (req, res) => {
  let conn;
  try {
    // req.params[0]을 사용하여 전체 경로 가져오기
    const fullPath = '/' + req.params[0];
    console.log('요청된 경로:', fullPath);
    
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM screens WHERE screen_path = ?
    `, [fullPath]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '화면을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('경로별 화면 조회 실패:', error);
    res.status(500).json({ error: '경로별 화면 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 화면 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { screen_name, screen_path, screen_description, component_name, department, is_active } = req.body;
    
    conn = await pool.getConnection();
    
    // 중복 체크
    const existingRows = await conn.query(`
      SELECT id FROM screens WHERE screen_path = ?
    `, [screen_path]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 화면경로입니다.' });
    }
    
    const result = await conn.query(`
      INSERT INTO screens (screen_name, screen_path, screen_description, component_name, department, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [screen_name, screen_path, screen_description, component_name, department, is_active]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: '화면이 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('화면 생성 실패:', error);
    res.status(500).json({ error: '화면 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 화면 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { screen_name, screen_path, screen_description, component_name, department, is_active } = req.body;
    const screenId = req.params.id;
    
    conn = await pool.getConnection();
    
    // 중복 체크 (자신 제외)
    const existingRows = await conn.query(`
      SELECT id FROM screens WHERE screen_path = ? AND id != ?
    `, [screen_path, screenId]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 화면경로입니다.' });
    }
    
    const result = await conn.query(`
      UPDATE screens 
      SET screen_name = ?, screen_path = ?, screen_description = ?, component_name = ?, department = ?, is_active = ?
      WHERE id = ?
    `, [screen_name, screen_path, screen_description, component_name, department, is_active, screenId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '화면을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '화면이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('화면 수정 실패:', error);
    res.status(500).json({ error: '화면 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 화면 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const screenId = req.params.id;
    
    conn = await pool.getConnection();
    
    // 연관된 메뉴 화면이 있는지 확인
    const menuScreenRows = await conn.query(`
      SELECT id FROM menu_screens WHERE screen_id = ?
    `, [screenId]);
    
    if (menuScreenRows.length > 0) {
      return res.status(400).json({ error: '연관된 메뉴 화면이 있어 삭제할 수 없습니다.' });
    }
    
    const result = await conn.query(`
      DELETE FROM screens WHERE id = ?
    `, [screenId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '화면을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '화면이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('화면 삭제 실패:', error);
    res.status(500).json({ error: '화면 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 대량 화면 추가
router.post('/bulk', authenticateToken, async (req, res) => {
  let conn;
  try {
    const screens = req.body;
    
    conn = await pool.getConnection();
    
    for (const screen of screens) {
      const { screen_name, screen_path, screen_description, component_name, department, is_active } = screen;
      
      // 중복 체크
      const existingRows = await conn.query(`
        SELECT id FROM screens WHERE screen_path = ?
      `, [screen_path]);
      
      if (existingRows.length === 0) {
        await conn.query(`
          INSERT INTO screens (screen_name, screen_path, screen_description, component_name, department, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [screen_name, screen_path, screen_description, component_name, department, is_active]);
      }
    }
    
    res.status(201).json({ message: '대량 화면 추가가 완료되었습니다.' });
  } catch (error) {
    console.error('대량 화면 추가 실패:', error);
    res.status(500).json({ error: '대량 화면 추가 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 