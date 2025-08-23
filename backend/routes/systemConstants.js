const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 모든 상수값 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.execute(`
      SELECT 
        sc.*,
        u1.name as created_by_name,
        u2.name as updated_by_name
      FROM system_constants sc
      LEFT JOIN users u1 ON sc.created_by = u1.id
      LEFT JOIN users u2 ON sc.updated_by = u2.id
      WHERE sc.is_active = 1
      ORDER BY sc.category, sc.constant_key
    `);
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    res.json(rows);
  } catch (error) {
    console.error('상수값 조회 실패:', error);
    res.status(500).json({ error: '상수값 조회 중 오류가 발생했습니다.' });
  }
});

// 카테고리별 상수값 조회
router.get('/category/:category', authenticateToken, async (req, res) => {
  try {
    const { category } = req.params;
    const result = await pool.execute(`
      SELECT * FROM system_constants 
      WHERE category = ? AND is_active = 1
      ORDER BY constant_key
    `, [category]);
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    res.json(rows);
  } catch (error) {
    console.error('카테고리별 상수값 조회 실패:', error);
    res.status(500).json({ error: '카테고리별 상수값 조회 중 오류가 발생했습니다.' });
  }
});

// 특정 상수값 조회
router.get('/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const result = await pool.execute(`
      SELECT * FROM system_constants 
      WHERE constant_key = ? AND is_active = 1
    `, [key]);
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '상수값을 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('상수값 조회 실패:', error);
    res.status(500).json({ error: '상수값 조회 중 오류가 발생했습니다.' });
  }
});

// 상수값 생성
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      constant_key, 
      constant_value, 
      constant_type, 
      description, 
      category 
    } = req.body;
    
    // 필수 필드 검증
    if (!constant_key || !constant_value) {
      return res.status(400).json({ error: '키와 값은 필수입니다.' });
    }
    
    // 중복 키 검증
    const existingResult = await pool.execute(`
      SELECT id FROM system_constants WHERE constant_key = ?
    `, [constant_key]);
    
    const existing = Array.isArray(existingResult) ? existingResult : existingResult.rows || [];
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 키입니다.' });
    }
    
    const insertResult = await pool.execute(`
      INSERT INTO system_constants 
      (constant_key, constant_value, constant_type, description, category, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [constant_key, constant_value, constant_type || 'string', description, category || 'general', req.user.id]);
    
    const insertId = insertResult.insertId || insertResult.insertId || (Array.isArray(insertResult) ? insertResult[0]?.insertId : null);
    
    res.status(201).json({ 
      id: insertId, 
      message: '상수값이 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('상수값 생성 실패:', error);
    res.status(500).json({ error: '상수값 생성 중 오류가 발생했습니다.' });
  }
});

// 상수값 수정
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      constant_key, 
      constant_value, 
      constant_type, 
      description, 
      category 
    } = req.body;
    
    // 필수 필드 검증
    if (!constant_key || !constant_value) {
      return res.status(400).json({ error: '키와 값은 필수입니다.' });
    }
    
    // 중복 키 검증 (자신 제외)
    const existingResult = await pool.execute(`
      SELECT id FROM system_constants 
      WHERE constant_key = ? AND id != ?
    `, [constant_key, id]);
    
    const existing = Array.isArray(existingResult) ? existingResult : existingResult.rows || [];
    
    if (existing.length > 0) {
      return res.status(400).json({ error: '이미 존재하는 키입니다.' });
    }
    
    const updateResult = await pool.execute(`
      UPDATE system_constants 
      SET constant_key = ?, constant_value = ?, constant_type = ?, 
          description = ?, category = ?, updated_by = ?
      WHERE id = ?
    `, [constant_key, constant_value, constant_type || 'string', description, category || 'general', req.user.id, id]);
    
    const affectedRows = updateResult.affectedRows || (Array.isArray(updateResult) ? updateResult[0]?.affectedRows : 0);
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: '상수값을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '상수값이 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('상수값 수정 실패:', error);
    res.status(500).json({ error: '상수값 수정 중 오류가 발생했습니다.' });
  }
});

// 상수값 삭제 (논리적 삭제)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteResult = await pool.execute(`
      UPDATE system_constants 
      SET is_active = 0, updated_by = ?
      WHERE id = ?
    `, [req.user.id, id]);
    
    const affectedRows = deleteResult.affectedRows || (Array.isArray(deleteResult) ? deleteResult[0]?.affectedRows : 0);
    
    if (affectedRows === 0) {
      return res.status(404).json({ error: '상수값을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '상수값이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('상수값 삭제 실패:', error);
    res.status(500).json({ error: '상수값 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
