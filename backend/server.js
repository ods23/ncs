const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// 한국 시간대 설정
process.env.TZ = 'Asia/Seoul';

// 환경 변수 검증
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ 필수 환경 변수가 설정되지 않았습니다:');
  missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('⚠️  .env 파일을 확인하세요.');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Database connection
const { pool } = require('./config/database');

// Passport configuration
require('./config/passport');

const app = express();

// CORS 설정 - 프로덕션 환경 고려
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:80'];

app.use(cors({
  origin: function (origin, callback) {
    // origin이 없는 경우 (같은 도메인 요청 등) 허용
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('CORS 정책에 의해 차단되었습니다.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 요청 크기 제한 설정
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 서빙 (uploads 폴더)
app.use('/uploads', express.static('uploads'));

// Session middleware - 보안 강화
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId', // 기본 'connect.sid' 대신 커스텀 이름 사용
  cookie: {
    secure: isProduction, // HTTPS에서만 쿠키 전송 (프로덕션)
    httpOnly: true, // XSS 공격 방지
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict' // CSRF 공격 방지
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

// 대시보드 라우터
app.use('/api/dashboard', require('./routes/dashboardRouter'));

// 기존 라우터들
app.use('/api/graduates', require('./routes/graduateRouter'));
app.use('/api/new-comer-graduates', require('./routes/newComerGraduateRouter'));
app.use('/api/transfer-graduates', require('./routes/transferGraduateRouter'));

// 교육관리 라우터
app.use('/api/new-comer-education', require('./routes/newComerEducationRouter'));
app.use('/api/transfer-believer-education', require('./routes/transferBelieverEducationRouter'));

// 통계 관리 라우터
app.use('/api/statistics', require('./routes/statisticsRouter'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: '요청한 리소스를 찾을 수 없습니다.',
    path: req.path 
  });
});

// 전역 에러 처리 미들웨어
app.use((err, req, res, next) => {
  console.error('에러 발생:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // CORS 에러 처리
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS 정책에 의해 요청이 차단되었습니다.'
    });
  }

  // 기본 에러 응답
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 