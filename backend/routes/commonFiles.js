const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { pool } = require('../config/database');

// 시스템상수값 가져오기 함수
async function getSystemConstant(key) {
  try {
    const result = await pool.execute(`
      SELECT constant_value FROM system_constants 
      WHERE constant_key = ? AND is_active = 1
    `, [key]);
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    return rows.length > 0 ? rows[0].constant_value : null;
  } catch (error) {
    console.error(`시스템상수값 조회 실패 (${key}):`, error);
    return null;
  }
}

// 인증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '액세스 토큰이 필요합니다.' });
  }
  if (token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
  }
};

// 동적 Multer 설정 생성 함수
async function createMulterStorage() {
  // 시스템상수값 가져오기
  const fileRootPath = await getSystemConstant('file_root_path') || path.join(__dirname, '../uploads');
  const fileUploadPath = await getSystemConstant('file_upload_path') || '/uploads';
  
  console.log('공통파일 저장 설정:', { fileRootPath, fileUploadPath });
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // file_root_path + file_upload_path/년도/월 형식으로 경로 생성
      const yearMonthDir = path.join(fileRootPath, fileUploadPath.replace(/^\/+/, ''), year.toString(), month);
      
      // 디렉토리가 없으면 생성
      if (!fs.existsSync(yearMonthDir)) {
        fs.mkdirSync(yearMonthDir, { recursive: true });
      }
      
      console.log('공통파일 저장 경로:', yearMonthDir);
      cb(null, yearMonthDir);
    },
    filename: function (req, file, cb) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const dateStr = today.toISOString().split('T')[0]; // yyyy-mm-dd
      
      // 저장 경로
      const yearMonthDir = path.join(fileRootPath, fileUploadPath.replace(/^\/+/, ''), year.toString(), month);
      
      fs.readdir(yearMonthDir, (err, files) => {
        if (err) return cb(err);
        const todayFiles = files.filter(f => f.startsWith(dateStr));
        const sequence = (todayFiles.length + 1).toString().padStart(3, '0');
        const ext = path.extname(file.originalname);
        const savedName = `${dateStr}_${sequence}${ext}`;
        
        console.log('생성된 공통파일명:', savedName);
        cb(null, savedName);
      });
    }
  });
}

// 동적 upload 미들웨어 생성 함수
async function createUploadMiddleware() {
  const storage = await createMulterStorage();
  
  return multer({ 
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB 제한
    },
    fileFilter: function (req, file, cb) {
      // 모든 파일 타입 허용
      cb(null, true);
    },
    preservePath: true
  });
}

// 파일 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  console.log('=== 파일 목록 조회 시작 ===');
  let conn;
  try {
    conn = await pool.getConnection();
    
    const sql = `
      SELECT cf.*, u.name as uploader_name 
      FROM common_files cf 
      LEFT JOIN users u ON cf.uploaded_by = u.id 
      ORDER BY cf.created_at DESC
    `;
    
    const files = await conn.query(sql);
    console.log('조회된 파일 수:', files.length);
    res.json(files);
  } catch (error) {
    console.error('파일 목록 조회 실패:', error);
    res.status(500).json({ error: '파일 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 파일 업로드
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const upload = await createUploadMiddleware();
    
    // multer 미들웨어를 동적으로 적용
    upload.single('file')(req, res, async (err) => {
      if (err) {
        console.error('파일 업로드 오류:', err);
        return res.status(400).json({ error: err.message });
      }
      
      console.log('=== 백엔드 파일 업로드 시작 ===');
      console.log('req.file:', req.file);
      console.log('req.body:', req.body);
      
      let conn;
      try {
        if (!req.file) {
          console.log('파일이 없음');
          return res.status(400).json({ error: '파일이 선택되지 않았습니다.' });
        }
        conn = await pool.getConnection();
        
        // 파일명 처리 (프론트엔드에서 NFC 정규화 + URL 인코딩됨)
        let originalName = req.file.originalname;
        console.log('업로드된 파일명:', originalName);
        
        // URL 디코딩
        try {
          originalName = decodeURIComponent(originalName);
          console.log('디코딩된 파일명:', originalName);
        } catch (e) {
          console.log('URL 디코딩 실패, 원본 사용:', e.message);
        }
        
        const description = req.body.description || null;
        const department = req.body.department || null;
        const believer = req.body.believer || null;
        
        console.log('=== DB 저장 시작 ===');
        console.log('저장할 파일명:', originalName);
        
        // 상대경로 생성 (년도/월/파일명)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const relativePath = `${year}/${month}/${req.file.filename}`;
        
        const result = await conn.query(`
          INSERT INTO common_files (original_name, saved_name, saved_path, size, mimetype, description, department, believer, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          originalName,
          req.file.filename,
          relativePath,           // 상대경로 (예: "2024/12/2024-12-13_001.pdf")
          req.file.size,
          req.file.mimetype,
          description,
          department,
          believer,
          req.user.id
        ]);
        
        console.log('DB 저장 완료, insertId:', result.insertId);
        
        res.status(201).json({
          id: result.insertId,
          original_name: originalName,
          saved_name: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
          description: description
        });
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
      } finally {
        if (conn) conn.release();
      }
    });
  } catch (error) {
    console.error('업로드 미들웨어 생성 실패:', error);
    res.status(500).json({ error: '파일 업로드 설정 중 오류가 발생했습니다.' });
  }
});

// 파일 다운로드
router.get('/:id/download', authenticateToken, async (req, res) => {
  console.log('=== 공통파일 다운로드 API 호출 ===');
  console.log('요청 파라미터:', req.params);
  console.log('파일 ID:', req.params.id);
  console.log('사용자 정보:', req.user);
  
  let conn;
  try {
    conn = await pool.getConnection();
    const files = await conn.query(`
      SELECT * FROM common_files WHERE id = ?
    `, [req.params.id]);
    
    console.log('DB 조회 결과:', files);
    
    if (files.length === 0) {
      console.log('파일을 찾을 수 없음');
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
    
    const file = files[0];
    console.log('찾은 파일 정보:', file);
    
    // 시스템상수값을 사용하여 절대경로 구성
    const fileRootPath = await getSystemConstant('file_root_path') || path.join(__dirname, '../uploads');
    const fileUploadPath = await getSystemConstant('file_upload_path') || '/uploads';
    const absolutePath = path.join(fileRootPath, fileUploadPath.replace(/^\/+/, ''), file.saved_path);
    
    console.log('공통파일 다운로드 경로:', {
      saved_path: file.saved_path,
      fileRootPath,
      fileUploadPath,
      absolutePath
    });
    
    if (!fs.existsSync(absolutePath)) {
      console.log('파일이 서버에 존재하지 않음:', absolutePath);
      return res.status(404).json({ error: '파일이 서버에 존재하지 않습니다.' });
    }
    
    console.log('파일 다운로드 시작:', file.original_name);
    res.download(absolutePath, file.original_name);
    console.log('파일 다운로드 완료');
  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    res.status(500).json({ error: '파일 다운로드 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 파일 정보 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const files = await conn.query(`
      SELECT cf.*, u.name as uploader_name 
      FROM common_files cf 
      LEFT JOIN users u ON cf.uploaded_by = u.id 
      WHERE cf.id = ?
    `, [req.params.id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
    
    res.json(files[0]);
  } catch (error) {
    console.error('파일 정보 조회 실패:', error);
    res.status(500).json({ error: '파일 정보 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 파일 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const files = await conn.query(`
      SELECT * FROM common_files WHERE id = ?
    `, [req.params.id]);
    
    if (files.length === 0) {
      return res.status(404).json({ error: '파일을 찾을 수 없습니다.' });
    }
    
    const file = files[0];
    
    // 시스템상수값을 사용하여 절대경로 구성
    const fileRootPath = await getSystemConstant('file_root_path') || path.join(__dirname, '../uploads');
    const fileUploadPath = await getSystemConstant('file_upload_path') || '/uploads';
    const absolutePath = path.join(fileRootPath, fileUploadPath.replace(/^\/+/, ''), file.saved_path);
    
    console.log('공통파일 삭제 경로:', {
      saved_path: file.saved_path,
      fileRootPath,
      fileUploadPath,
      absolutePath
    });
    
    // 실제 파일 삭제
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
    
    // DB에서 파일 정보 삭제
    await conn.query('DELETE FROM common_files WHERE id = ?', [req.params.id]);
    
    res.json({ message: '파일이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('파일 삭제 실패:', error);
    res.status(500).json({ error: '파일 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// Multer 오류 처리 미들웨어
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '파일 크기가 너무 큽니다. (최대 50MB)' });
    }
    return res.status(400).json({ error: '파일 업로드 오류: ' + error.message });
  }
  console.error('파일 업로드 미들웨어 오류:', error);
  res.status(500).json({ error: '파일 업로드 중 오류가 발생했습니다.' });
});

module.exports = router;