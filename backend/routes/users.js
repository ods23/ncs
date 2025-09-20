const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

// 모든 사용자 조회
router.get('/', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        department,
        teacher_type,
        teacher_status,
        DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
        position,
        work_years,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        provider,
        provider_id,
        is_active,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    conn.release();
    
    const users = Array.isArray(result) ? result : result.rows || [];
    res.json(users);
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error);
    res.status(500).json({ error: '사용자 목록 조회에 실패했습니다.' });
  }
});

// 특정 사용자 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const result = await conn.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        department,
        teacher_type,
        teacher_status,
        DATE_FORMAT(birth_date, '%Y-%m-%d') as birth_date,
        position,
        work_years,
        DATE_FORMAT(start_date, '%Y-%m-%d') as start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') as end_date,
        provider,
        provider_id,
        is_active,
        created_at,
        updated_at
      FROM users 
      WHERE id = ?
    `, [id]);
    conn.release();
    
    const users = Array.isArray(result) ? result : result.rows || [];
    
    if (users.length === 0) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('사용자 조회 실패:', error);
    res.status(500).json({ error: '사용자 조회에 실패했습니다.' });
  }
});

    // 새 사용자 생성
router.post('/', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      department,
      teacher_type,
      teacher_status,
      birth_date,
      position,
      work_years,
      start_date,
      end_date,
      provider,
      provider_id,
      is_active
    } = req.body;

    // 필수 필드 검증
    if (!name || !email) {
      return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
    }

    // 이메일 중복 확인
    const conn = await pool.getConnection();
    const existingResult = await conn.query('SELECT id FROM users WHERE email = ?', [email]);
    const existingUsers = Array.isArray(existingResult) ? existingResult : existingResult.rows || [];
    
    if (existingUsers.length > 0) {
      conn.release();
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }

    // 비밀번호 해시화
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 빈 문자열을 NULL로 변환
    const cleanBirthDate = birth_date === '' ? null : birth_date;
    const cleanStartDate = start_date === '' ? null : start_date;
    const cleanEndDate = end_date === '' ? null : end_date;
    const cleanWorkYears = work_years === '' ? null : work_years;

    // 시작일자와 종료일자가 비어있으면 오늘 날짜로 설정 (한국시간 기준)
    const today = new Date(new Date().getTime() + (9 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const finalStartDate = cleanStartDate || today;
    const finalEndDate = cleanEndDate || today;

    // 사용자 생성
    const insertResult = await conn.query(
      `INSERT INTO users (
        name, email, password, phone, role, department, teacher_type, teacher_status,
        birth_date, position, work_years, start_date, end_date, provider, provider_id, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, email, hashedPassword, phone, role, department, teacher_type, teacher_status,
        cleanBirthDate, position, cleanWorkYears, finalStartDate, finalEndDate, provider, provider_id, is_active || 1
      ]
    );

    const insertId = insertResult.insertId || insertResult.insertId || (Array.isArray(insertResult) ? insertResult[0]?.insertId : null);
    
    // 생성된 사용자 조회
    const userResult = await conn.query('SELECT * FROM users WHERE id = ?', [insertId]);
    const users = Array.isArray(userResult) ? userResult : userResult.rows || [];
    
    conn.release();
    
    res.status(201).json(users[0]);
  } catch (error) {
    console.error('사용자 생성 실패:', error);
    res.status(500).json({ error: '사용자 생성에 실패했습니다.' });
  }
});

// 사용자 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Updating user ID:', id);
    console.log('Request body:', req.body);
    
    // 데이터베이스 연결 테스트
    const conn = await pool.getConnection();
    console.log('Database connection successful');
    
    // 사용자 존재 확인
    const userCheckResult = await conn.query('SELECT id FROM users WHERE id = ?', [id]);
    const userCheck = Array.isArray(userCheckResult) ? userCheckResult : userCheckResult.rows || [];
    console.log('User check result:', userCheck);
    
    if (userCheck.length === 0) {
      conn.release();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    const {
      name,
      email,
      password,
      phone,
      role,
      department,
      teacher_type,
      teacher_status,
      birth_date,
      position,
      work_years,
      start_date,
      end_date,
      provider,
      provider_id,
      is_active
    } = req.body;

    // 필수 필드 검증
    if (!name || !email) {
      console.log('Validation failed: name or email missing');
      return res.status(400).json({ error: '이름과 이메일은 필수입니다.' });
    }
    
    // 이메일 중복 확인 (자신 제외)
    const existingResult = await conn.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    const existingUsers = Array.isArray(existingResult) ? existingResult : existingResult.rows || [];
    
    console.log('Email check result:', existingUsers);
    
    if (existingUsers.length > 0) {
      conn.release();
      console.log('Email already exists');
      return res.status(400).json({ error: '이미 존재하는 이메일입니다.' });
    }

    // 빈 문자열을 NULL로 변환
    const cleanBirthDate = birth_date === '' ? null : birth_date;
    const cleanStartDate = start_date === '' ? null : start_date;
    const cleanEndDate = end_date === '' ? null : end_date;
    const cleanWorkYears = work_years === '' ? null : work_years;

    // 비밀번호 처리
    let updateQuery = `
      UPDATE users SET 
        name = ?, email = ?, phone = ?, role = ?, department = ?, teacher_type = ?, teacher_status = ?,
        birth_date = ?, position = ?, work_years = ?, start_date = ?, end_date = ?, 
        provider = ?, provider_id = ?, is_active = ?
      WHERE id = ?
    `;
    let updateParams = [
      name, email, phone, role, department, teacher_type, teacher_status,
      cleanBirthDate, position, cleanWorkYears, cleanStartDate, cleanEndDate, provider, provider_id, is_active, id
    ];

    // 비밀번호가 제공된 경우에만 업데이트
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery = `
        UPDATE users SET 
          name = ?, email = ?, password = ?, phone = ?, role = ?, department = ?, teacher_type = ?, teacher_status = ?,
          birth_date = ?, position = ?, work_years = ?, start_date = ?, end_date = ?, 
          provider = ?, provider_id = ?, is_active = ?
        WHERE id = ?
      `;
      updateParams = [
        name, email, hashedPassword, phone, role, department, teacher_type, teacher_status,
        cleanBirthDate, position, cleanWorkYears, cleanStartDate, cleanEndDate, provider, provider_id, is_active, id
      ];
    }

    console.log('Executing update query:', updateQuery);
    console.log('Update parameters:', updateParams);
    
    await conn.query(updateQuery, updateParams);
    
    // 업데이트된 사용자 조회
    const userResult = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    const users = Array.isArray(userResult) ? userResult : userResult.rows || [];
    
    console.log('Updated user result:', users);
    
    conn.release();
    
    if (users.length === 0) {
      console.log('User not found after update');
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    console.log('Successfully updated user:', users[0]);
    res.json(users[0]);
  } catch (error) {
    console.error('사용자 수정 실패:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: '사용자 수정에 실패했습니다.', details: error.message });
  }
});

// 사용자 활성화/비활성화 토글
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    
    const newStatus = await User.toggleActive(id);
    res.json({ 
      message: newStatus ? '사용자가 활성화되었습니다.' : '사용자가 비활성화되었습니다.',
      is_active: newStatus 
    });
  } catch (error) {
    console.error('사용자 활성화 상태 변경 실패:', error);
    res.status(500).json({ error: '사용자 활성화 상태 변경에 실패했습니다.' });
  }
});

// 사용자 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    
    // 사용자 존재 확인
    const userResult = await conn.query('SELECT id FROM users WHERE id = ?', [id]);
    const users = Array.isArray(userResult) ? userResult : userResult.rows || [];
    
    if (users.length === 0) {
      conn.release();
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }
    
    // 사용자 삭제
    await conn.query('DELETE FROM users WHERE id = ?', [id]);
    conn.release();
    
    res.json({ message: '사용자가 삭제되었습니다.' });
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    res.status(500).json({ error: '사용자 삭제에 실패했습니다.' });
  }
});

module.exports = router; 