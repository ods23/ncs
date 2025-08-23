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

// 메뉴 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM menus 
      ORDER BY menu_order ASC, menu_name ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error('메뉴 목록 조회 실패:', error);
    res.status(500).json({ error: '메뉴 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 상세 조회
router.get('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM menus WHERE id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('메뉴 상세 조회 실패:', error);
    res.status(500).json({ error: '메뉴 상세 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 생성
router.post('/', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { menu_name, menu_order, department, is_active } = req.body;
    
    conn = await pool.getConnection();
    
    const result = await conn.query(`
      INSERT INTO menus (menu_name, menu_order, department, is_active)
      VALUES (?, ?, ?, ?)
    `, [menu_name, menu_order, department, is_active]);
    
    res.status(201).json({ 
      id: result.insertId,
      message: '메뉴가 성공적으로 생성되었습니다.' 
    });
  } catch (error) {
    console.error('메뉴 생성 실패:', error);
    res.status(500).json({ error: '메뉴 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 수정
router.put('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { menu_name, menu_order, department, is_active } = req.body;
    
    conn = await pool.getConnection();
    
    await conn.query(`
      UPDATE menus 
      SET menu_name = ?, menu_order = ?, department = ?, is_active = ?
      WHERE id = ?
    `, [menu_name, menu_order, department, is_active, req.params.id]);
    
    res.json({ message: '메뉴가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('메뉴 수정 실패:', error);
    res.status(500).json({ error: '메뉴 수정 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 삭제
router.delete('/:id', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    // menu_screens 테이블에서 연결된 화면이 있는지 확인
    const connectedScreens = await conn.query(`
      SELECT id FROM menu_screens WHERE menu_id = ?
    `, [req.params.id]);
    
    if (connectedScreens.length > 0) {
      return res.status(400).json({ error: '연결된 화면이 존재하여 삭제할 수 없습니다.' });
    }
    
    const result = await conn.query(`
      DELETE FROM menus WHERE id = ?
    `, [req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '메뉴를 찾을 수 없습니다.' });
    }
    
    res.json({ message: '메뉴가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('메뉴 삭제 실패:', error);
    res.status(500).json({ error: '메뉴 삭제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 계층 구조 조회
router.get('/hierarchy/tree', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT * FROM menus 
      WHERE is_active = 1
      ORDER BY sort_order ASC, menu_name ASC
    `);
    
    // 계층 구조로 변환
    const buildTree = (items, parentId = null) => {
      return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
          ...item,
          children: buildTree(items, item.id)
        }));
    };
    
    const tree = buildTree(rows);
    res.json(tree);
  } catch (error) {
    console.error('메뉴 계층 구조 조회 실패:', error);
    res.status(500).json({ error: '메뉴 계층 구조 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴 일괄 생성
router.post('/bulk', authenticateToken, async (req, res) => {
  let conn;
  try {
    const menus = req.body;
    
    if (!Array.isArray(menus) || menus.length === 0) {
      return res.status(400).json({ error: '메뉴 데이터가 필요합니다.' });
    }
    
    conn = await pool.getConnection();
    
    // 트랜잭션 시작
    await conn.beginTransaction();
    
    try {
      for (const menu of menus) {
        const { menu_name, menu_order, department, is_active } = menu;
        
        await conn.query(`
          INSERT INTO menus (menu_name, menu_order, department, is_active)
          VALUES (?, ?, ?, ?)
        `, [menu_name, menu_order, department, is_active]);
      }
      
      await conn.commit();
      res.status(201).json({ message: '메뉴가 성공적으로 일괄 생성되었습니다.' });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (error) {
    console.error('메뉴 일괄 생성 실패:', error);
    res.status(500).json({ error: '메뉴 일괄 생성 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴에 화면 연결
router.post('/:menuId/screens', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { screenId, screenOrder } = req.body;
    
    conn = await pool.getConnection();
    
    // 중복 체크
    const existingRows = await conn.query(`
      SELECT id FROM menu_screens WHERE menu_id = ? AND screen_id = ?
    `, [req.params.menuId, screenId]);
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 연결된 화면입니다.' });
    }
    
    // 현재 최대 순서 값 가져오기
    const maxOrderResult = await conn.query(`
      SELECT MAX(screen_order) as max_order FROM menu_screens WHERE menu_id = ?
    `, [req.params.menuId]);
    
    const nextOrder = (maxOrderResult[0]?.max_order || 0) + 1;
    const orderToUse = screenOrder || nextOrder;
    
    await conn.query(`
      INSERT INTO menu_screens (menu_id, screen_id, screen_order)
      VALUES (?, ?, ?)
    `, [req.params.menuId, screenId, orderToUse]);
    
    res.status(201).json({ message: '화면이 메뉴에 성공적으로 연결되었습니다.' });
  } catch (error) {
    console.error('화면 연결 실패:', error);
    res.status(500).json({ error: '화면 연결 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴에서 화면 연결 해제
router.delete('/:menuId/screens/:screenId', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    
    const result = await conn.query(`
      DELETE FROM menu_screens WHERE menu_id = ? AND screen_id = ?
    `, [req.params.menuId, req.params.screenId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: '연결된 화면을 찾을 수 없습니다.' });
    }
    
    res.json({ message: '화면 연결이 해제되었습니다.' });
  } catch (error) {
    console.error('화면 연결 해제 실패:', error);
    res.status(500).json({ error: '화면 연결 해제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 화면 순서 변경
router.put('/:menuId/screens/:screenId/order', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { newOrder } = req.body;
    
    conn = await pool.getConnection();
    
    // 순서 변경
    await conn.query(`
      UPDATE menu_screens 
      SET screen_order = ? 
      WHERE menu_id = ? AND screen_id = ?
    `, [newOrder, req.params.menuId, req.params.screenId]);
    
    res.json({ message: '화면 순서가 변경되었습니다.' });
  } catch (error) {
    console.error('화면 순서 변경 실패:', error);
    res.status(500).json({ error: '화면 순서 변경 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴에 연결된 화면 목록 조회
router.get('/:menuId/screens', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT s.*, ms.screen_order FROM screens s
      INNER JOIN menu_screens ms ON s.id = ms.screen_id
      WHERE ms.menu_id = ?
      ORDER BY ms.screen_order ASC, s.screen_name ASC
    `, [req.params.menuId]);
    res.json(rows);
  } catch (error) {
    console.error('메뉴 화면 목록 조회 실패:', error);
    res.status(500).json({ error: '메뉴 화면 목록 조회 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 특정 메뉴에 연결된 사용자 목록 가져오기
router.get('/:menuId/users', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(`
      SELECT um.*, u.name, u.email, u.role, u.department, u.teacher_type, u.position, u.phone
      FROM user_menus um
      JOIN users u ON um.user_id = u.id
      WHERE um.menu_id = ?
      ORDER BY um.id
    `, [req.params.menuId]);
    res.json(rows);
  } catch (error) {
    console.error('메뉴별 사용자 목록 가져오기 실패:', error);
    res.status(500).json({ error: '메뉴별 사용자 목록을 가져오는데 실패했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴에 사용자 연결
router.post('/:menuId/users', authenticateToken, async (req, res) => {
  let conn;
  try {
    const { userId } = req.body;

    conn = await pool.getConnection();

    // 중복 체크
    const existingRows = await conn.query(`
      SELECT id FROM user_menus WHERE user_id = ? AND menu_id = ?
    `, [userId, req.params.menuId]);

    if (existingRows.length > 0) {
      return res.status(400).json({ error: '이미 연결된 사용자입니다.' });
    }

    await conn.query(`
      INSERT INTO user_menus (user_id, menu_id)
      VALUES (?, ?)
    `, [userId, req.params.menuId]);

    res.status(201).json({ message: '사용자가 메뉴에 성공적으로 연결되었습니다.' });
  } catch (error) {
    console.error('사용자 연결 실패:', error);
    res.status(500).json({ error: '사용자 연결 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

// 메뉴에서 사용자 연결 해제
router.delete('/:menuId/users/:userMenuId', authenticateToken, async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM user_menus WHERE id = ? AND menu_id = ?', [req.params.userMenuId, req.params.menuId]);
    res.json({ message: '사용자가 메뉴에서 성공적으로 제거되었습니다.' });
  } catch (error) {
    console.error('사용자 연결 해제 실패:', error);
    res.status(500).json({ error: '사용자 연결 해제 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});



module.exports = router; 