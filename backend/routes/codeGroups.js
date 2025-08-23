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

// 코드 그룹 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM code_groups 
      ORDER BY sort_order ASC, group_code ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('코드 그룹 목록 조회 실패:', error);
    res.status(500).json({ error: '코드 그룹 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 그룹 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM code_groups WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '코드 그룹을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('코드 그룹 상세 조회 실패:', error);
    res.status(500).json({ error: '코드 그룹 상세 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 그룹 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { group_code, group_name, group_description, department, sort_order, is_active } = req.body;
    
    conn = await pool.getConnection();
    
    // 중복 체크
    const existingRows = await conn.query(`
      SELECT id FROM code_groups WHERE group_code = ?
    `, [group_code]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 그룹코드입니다.' });
    }
    
    const result = await conn.query(`
      INSERT INTO code_groups (group_code, group_name, group_description, department, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [group_code, group_name, group_description, department, sort_order, is_active]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: '코드 그룹이 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('코드 그룹 생성 실패:', error);
    res.status(500).json({ error: '코드 그룹 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 그룹 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { group_code, group_name, group_description, department, sort_order, is_active } = req.body;
    const groupId = req.params.id;
    
    conn = await pool.getConnection();
    
    // 중복 체크 (자신 제외)
    const existingRows = await conn.query(`
      SELECT id FROM code_groups WHERE group_code = ? AND id != ?
    `, [group_code, groupId]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 그룹코드입니다.' });
    }
    
    const result = await conn.query(`
      UPDATE code_groups 
      SET group_code = ?, group_name = ?, group_description = ?, department = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [group_code, group_name, group_description, department, sort_order, is_active, groupId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '코드 그룹을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '코드 그룹이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('코드 그룹 수정 실패:', error);
    res.status(500).json({ error: '코드 그룹 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 그룹 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const groupId = req.params.id;
    
    conn = await pool.getConnection();
    
    // 연관된 코드 상세가 있는지 확인
    const detailRows = await conn.query(`
      SELECT id FROM code_details WHERE group_id = ?
    `, [groupId]);
    
    if (detailRows.length > 0) {
      return res.status(400).json({ error: '연관된 코드 상세가 있어 삭제할 수 없습니다.' });
    }
    
    const result = await conn.query(`
      DELETE FROM code_groups WHERE id = ?
    `, [groupId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '코드 그룹을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '코드 그룹이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('코드 그룹 삭제 실패:', error);
    res.status(500).json({ error: '코드 그룹 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 