const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const conn = await pool.getConnection();
    try {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      // 기본값 설정 (회원가입 시에는 비활성화로 설정)
      userData.is_active = userData.is_active !== undefined ? userData.is_active : 0;
      
      // MariaDB에서 SET ? 구문 대신 명시적 컬럼과 값 사용
      const columns = Object.keys(userData);
      const values = Object.values(userData);
      const placeholders = columns.map(() => '?').join(', ');
      const columnList = columns.join(', ');
      
      const result = await conn.query(
        `INSERT INTO users (${columnList}) VALUES (${placeholders})`,
        values
      );
      return Array.isArray(result) ? result[0].insertId : result.insertId;
    } finally {
      conn.release();
    }
  }

  static async findByEmail(email) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
      const rows = Array.isArray(result) ? result : [result];
      return rows[0];
    } catch (error) {
      console.error('Database error in findByEmail:', error);
      throw error;
    } finally {
      conn.release();
    }
  }

  static async findById(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
      const rows = Array.isArray(result) ? result : [result];
      return rows[0];
    } finally {
      conn.release();
    }
  }

  static async update(id, userData) {
    const conn = await pool.getConnection();
    try {
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      await conn.query('UPDATE users SET ? WHERE id = ?', [userData, id]);
    } finally {
      conn.release();
    }
  }

  static async toggleActive(id) {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT is_active FROM users WHERE id = ?', [id]);
      const rows = Array.isArray(result) ? result : [result];
      const currentStatus = rows[0]?.is_active;
      
      if (currentStatus !== undefined) {
        const newStatus = currentStatus ? 0 : 1;
        await conn.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, id]);
        return newStatus;
      }
      throw new Error('User not found');
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const conn = await pool.getConnection();
    try {
      await conn.query('DELETE FROM users WHERE id = ?', [id]);
    } finally {
      conn.release();
    }
  }

  static async findAll() {
    const conn = await pool.getConnection();
    try {
      const result = await conn.query('SELECT * FROM users ORDER BY created_at DESC');
      return Array.isArray(result) ? result : [result];
    } finally {
      conn.release();
    }
  }
}

module.exports = User; 