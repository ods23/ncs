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

// 코드 상세 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { group_id } = req.query;
    
    conn = await pool.getConnection();
    
    let query = `
      SELECT cd.*, cg.group_name 
      FROM code_details cd
      LEFT JOIN code_groups cg ON cd.group_id = cg.id
    `;
    let params = [];
    
    if (group_id) {
      query += ` WHERE cd.group_id = ?`;
      params.push(group_id);
    }
    
    query += ` ORDER BY cd.sort_order ASC, cd.code_value ASC`;
    
    const rows = await conn.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('코드 상세 목록 조회 실패:', error);
    res.status(500).json({ error: '코드 상세 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 상세 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT cd.*, cg.group_name 
      FROM code_details cd
      LEFT JOIN code_groups cg ON cd.group_id = cg.id
      WHERE cd.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '코드 상세를 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('코드 상세 상세 조회 실패:', error);
    res.status(500).json({ error: '코드 상세 상세 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 상세 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { group_id, code_value, code_name, code_description, sort_order, is_active } = req.body;
    
    conn = await pool.getConnection();
    
    // 그룹 존재 여부 확인
    const groupRows = await conn.query(`
      SELECT id FROM code_groups WHERE id = ?
    `, [group_id]);
    
    if (groupRows.length === 0) {
      return res.status(400).json({ error: '존재하지 않는 코드 그룹입니다.' });
    }
    
    // 중복 체크 (같은 그룹 내에서)
    const existingRows = await conn.query(`
      SELECT id FROM code_details WHERE group_id = ? AND code_value = ?
    `, [group_id, code_value]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 코드값입니다.' });
    }
    
    const result = await conn.query(`
      INSERT INTO code_details (group_id, code_value, code_name, code_description, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [group_id, code_value, code_name, code_description, sort_order, is_active]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: '코드 상세가 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('코드 상세 생성 실패:', error);
    res.status(500).json({ error: '코드 상세 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 상세 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { group_id, code_value, code_name, code_description, sort_order, is_active } = req.body;
    const detailId = req.params.id;
    
    conn = await pool.getConnection();
    
    // 그룹 존재 여부 확인
    const groupRows = await conn.query(`
      SELECT id FROM code_groups WHERE id = ?
    `, [group_id]);
    
    if (groupRows.length === 0) {
      return res.status(400).json({ error: '존재하지 않는 코드 그룹입니다.' });
    }
    
    // 중복 체크 (자신 제외)
    const existingRows = await conn.query(`
      SELECT id FROM code_details WHERE group_id = ? AND code_value = ? AND id != ?
    `, [group_id, code_value, detailId]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 코드값입니다.' });
    }
    
    const result = await conn.query(`
      UPDATE code_details 
      SET group_id = ?, code_value = ?, code_name = ?, code_description = ?, sort_order = ?, is_active = ?
      WHERE id = ?
    `, [group_id, code_value, code_name, code_description, sort_order, is_active, detailId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '코드 상세를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '코드 상세가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('코드 상세 수정 실패:', error);
    res.status(500).json({ error: '코드 상세 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 코드 상세 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const detailId = req.params.id;
    
    conn = await pool.getConnection();
    
    const result = await conn.query(`
      DELETE FROM code_details WHERE id = ?
    `, [detailId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '코드 상세를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '코드 상세가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('코드 상세 삭제 실패:', error);
    res.status(500).json({ error: '코드 상세 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router; 