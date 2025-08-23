const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
// NaverStrategy will be implemented manually
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const { pool } = require('./database');

// Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    conn.release();

    if (rows.length === 0) {
      return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return done(null, false, { message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google profile:', profile);
    
    // Check if profile has emails
    if (!profile.emails || profile.emails.length === 0) {
      return done(null, false, { message: '이메일 정보를 가져올 수 없습니다.' });
    }
    
    const email = profile.emails[0].value;
    const conn = await pool.getConnection();
    const result = await conn.query('SELECT * FROM users WHERE email = ?', [email]);
    console.log('Query result:', result);
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    
    if (rows && rows.length > 0) {
      conn.release();
      return done(null, rows[0]);
    }

    // Check if profile has photos
    const profileImage = profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null;

    // Create new user with Korean time
    const koreanTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
    const koreanDate = koreanTime.toISOString().split('T')[0];
    const koreanDateTime = koreanTime.toISOString().slice(0, 19).replace('T', ' ');
    
    const insertResult = await conn.query(
      'INSERT INTO users (name, email, profile_image, role, provider, provider_id, start_date, end_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [profile.displayName, email, profileImage, '일반', 'google', profile.id, koreanDate, koreanDate, koreanDateTime, koreanDateTime]
    );
    console.log('Insert result:', insertResult);
    
    const insertId = insertResult.insertId || insertResult.insertId || (Array.isArray(insertResult) ? insertResult[0]?.insertId : null);
    
    const newUser = {
      id: insertId,
      name: profile.displayName,
      email: email,
      profile_image: profileImage,
      role: '일반',
      provider: 'google',
      provider_id: profile.id
    };
    
    conn.release();

    return done(null, newUser);
  } catch (error) {
    console.error('Google strategy error:', error);
    return done(error);
  }
}));

// Naver Strategy - will be implemented manually

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const conn = await pool.getConnection();
    const result = await conn.query('SELECT * FROM users WHERE id = ?', [id]);
    conn.release();
    
    const rows = Array.isArray(result) ? result : result.rows || [];
    
    if (rows.length === 0) {
      return done(null, false);
    }
    
    done(null, rows[0]);
  } catch (error) {
    console.error('Deserialize error:', error);
    done(error);
  }
});

module.exports = passport; 