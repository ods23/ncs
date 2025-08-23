const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { generateToken, refreshToken } = require('../utils/jwt');
const User = require('../models/User');
const { pool } = require('../config/database');

const router = express.Router();

// Local Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // 활성화 상태 확인
    if (user.is_active === 0) {
      return res.status(401).json({ 
        message: '로그인할 수 없습니다. 계정이 비활성화되었습니다. 관리자에게 문의하세요.' 
      });
    }

    // 시작일자와 종료일자 확인
    const today = new Date();
    const koreanToday = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayString = koreanToday.toISOString().split('T')[0];

    // 시작일자와 종료일자가 동일한 경우
    if (user.start_date && user.end_date && user.start_date === user.end_date) {
      return res.status(401).json({ 
        message: '로그인할 수 없습니다. 시작일자와 종료일자가 동일합니다. 관리자에게 문의하세요.' 
      });
    }

    // 현재 날짜가 종료일자 이후인 경우
    if (user.end_date && todayString > user.end_date) {
      return res.status(401).json({ 
        message: '로그인할 수 없습니다. 계정 사용 기간이 만료되었습니다. 관리자에게 문의하세요.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: '이미 존재하는 이메일입니다.' });
    }

    // 한국시간 기준으로 오늘 날짜 생성
    const today = new Date();
    const koreanToday = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayString = koreanToday.toISOString().split('T')[0];

    const userId = await User.create({ 
      name, 
      email, 
      password, 
      role: '일반', 
      is_active: 0, // 비활성화 상태로 생성
      start_date: todayString, // 가입일자로 설정
      end_date: todayString,   // 가입일자로 설정
      provider: 'join'
    });
    const user = await User.findById(userId);
    const token = generateToken(user);

    res.status(201).json({ 
      token, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      message: '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  try {
    console.log('Google callback - req.user:', req.user);
    
    if (!req.user) {
      return res.redirect('/login?error=auth_failed');
    }

    // 활성화 상태 확인
    if (req.user.is_active === 0) {
      return res.redirect('/login?error=inactive_account&message=로그인할 수 없습니다. 계정이 비활성화되었습니다. 관리자에게 문의하세요.');
    }

    // 시작일자와 종료일자 확인
    const today = new Date();
    const koreanToday = new Date(today.getTime() + (9 * 60 * 60 * 1000));
    const todayString = koreanToday.toISOString().split('T')[0];

    // 시작일자와 종료일자가 동일한 경우
    if (req.user.start_date && req.user.end_date && req.user.start_date === req.user.end_date) {
      return res.redirect('/login?error=invalid_dates&message=로그인할 수 없습니다. 시작일자와 종료일자가 동일합니다. 관리자에게 문의하세요.');
    }

    // 현재 날짜가 종료일자 이후인 경우
    if (req.user.end_date && todayString > req.user.end_date) {
      return res.redirect('/login?error=expired_account&message=로그인할 수 없습니다. 계정 사용 기간이 만료되었습니다. 관리자에게 문의하세요.');
    }

    const token = generateToken(req.user);
    const userData = { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role };
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

// Naver OAuth
router.get('/naver', passport.authenticate('naver'));

router.get('/naver/callback', passport.authenticate('naver', { failureRedirect: '/login' }), (req, res) => {
  try {
    console.log('Naver callback - req.user:', req.user);
    
    if (!req.user) {
      return res.redirect('/login?error=auth_failed');
    }

    const token = generateToken(req.user);
    const userData = { id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role };
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (error) {
    console.error('Naver callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.json({ message: '로그아웃되었습니다.' });
  });
});

// Verify Token
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: '토큰이 없습니다.' });
  }

  const decoded = require('../utils/jwt').verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }

  res.json({ user: decoded });
});

// 토큰 갱신 엔드포인트 추가
router.post('/refresh', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: '토큰이 없습니다.' });
    }

    const decoded = require('../utils/jwt').verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }

    // 사용자 정보 조회
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    // 활성화 상태 확인
    if (user.is_active === 0) {
      return res.status(401).json({ 
        message: '토큰을 갱신할 수 없습니다. 계정이 비활성화되었습니다.' 
      });
    }

    // 새로운 토큰 생성
    const newToken = refreshToken(user);
    
    res.json({ 
      token: newToken, 
      user: { id: user.id, name: user.name, email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: '토큰 갱신 중 오류가 발생했습니다.' });
  }
});

module.exports = router; 