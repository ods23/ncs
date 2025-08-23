const { verifyToken } = require('../utils/jwt');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: '액세스 토큰이 필요합니다.' });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ message: '유효하지 않은 토큰입니다.' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: '토큰 검증에 실패했습니다.' });
  }
};

module.exports = {
  authenticateToken
};
