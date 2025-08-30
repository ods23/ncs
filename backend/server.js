const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// 한국 시간대 설정
process.env.TZ = 'Asia/Seoul';

// Database connection
const { pool } = require('./config/database');

// Passport configuration
require('./config/passport');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (uploads 폴더)
app.use('/uploads', express.static('uploads'));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/code-groups', require('./routes/codeGroups'));
app.use('/api/code-details', require('./routes/codeDetails'));
app.use('/api/screens', require('./routes/screens'));
app.use('/api/menus', require('./routes/menus'));
app.use('/api/user-menus', require('./routes/userMenus'));
// 파일 관리 라우터 (더 구체적인 경로를 먼저 등록)
app.use('/api/new-comer-files', require('./routes/newComerFiles'));
app.use('/api/files', require('./routes/files'));
app.use('/api/common-files', require('./routes/commonFiles'));
app.use('/api/system-constants', require('./routes/systemConstants'));

// 신자 관리 라우터 - 완전 분리
app.use('/api/new-comers', require('./routes/newComerRouter'));           // 초신자 관리
app.use('/api/transfer-believers', require('./routes/transferBelieverManagementRouter')); // 전입신자 관리
app.use('/api/all-believers', require('./routes/AllBelieverRouter'));     // 등록전체조회

// 기존 라우터들
app.use('/api/graduates', require('./routes/graduateRouter'));
app.use('/api/new-comer-graduates', require('./routes/newComerGraduateRouter'));
app.use('/api/transfer-graduates', require('./routes/transferGraduateRouter'));

// 교육관리 라우터
app.use('/api/new-comer-education', require('./routes/newComerEducationRouter'));
app.use('/api/transfer-believer-education', require('./routes/transferBelieverEducationRouter'));



// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
}); 