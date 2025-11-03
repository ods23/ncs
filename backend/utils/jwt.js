const jwt = require('jsonwebtoken');

// JWT Secret 검증
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'your-secret-key-change-in-production') {
    console.warn('⚠️  JWT_SECRET이 기본값이거나 설정되지 않았습니다. 프로덕션 환경에서는 반드시 강력한 시크릿을 설정하세요.');
  }
  return secret || 'your-secret-key-change-in-production';
};

const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    getJWTSecret(),
    { expiresIn: '7d' } // 24시간에서 7일로 변경
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJWTSecret());
  } catch (error) {
    return null;
  }
};

// 토큰 갱신 함수 추가
const refreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    },
    getJWTSecret(),
    { expiresIn: '7d' }
  );
};

module.exports = {
  generateToken,
  verifyToken,
  refreshToken
}; 