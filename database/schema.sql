-- Database schema for nodejsweb_db

-- Create database
CREATE DATABASE IF NOT EXISTS nodejsweb_db CHARACTER SET utf8 COLLATE utf8_unicode_ci;
USE nodejsweb_db;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30),
  role VARCHAR(20),
  profile_image VARCHAR(500),
  provider ENUM('local', 'google', 'join') DEFAULT 'local',
  provider_id VARCHAR(255),
  department VARCHAR(50),
  teacher_type VARCHAR(30),
  birth_date DATE,
  position VARCHAR(50),
  work_years INT,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1
);

-- New comers table
CREATE TABLE IF NOT EXISTS new_comers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(50),
  believer_type VARCHAR(20),
  education_type VARCHAR(30),
  year VARCHAR(4),
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  marital_status VARCHAR(20),
  birth_date DATE,
  address VARCHAR(255),
  phone VARCHAR(30),
  teacher VARCHAR(50),
  register_date DATE,
  education_start_date DATE,
  education_end_date DATE,
  affiliation_org VARCHAR(30),
  belong VARCHAR(50),
  new_life_strategy_date DATE,
  identity_verified VARCHAR(1),
  prev_church VARCHAR(100),
  comment TEXT,
  number VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  graduate_transfer_status VARCHAR(20),
  file_id INT,
  FOREIGN KEY (file_id) REFERENCES new_comer_files(id) ON DELETE SET NULL
);

-- New comers graduates table
CREATE TABLE IF NOT EXISTS new_comers_graduates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  graduate_number VARCHAR(20),
  print_count INT DEFAULT 0,
  department VARCHAR(50),
  believer_type VARCHAR(20),
  education_type VARCHAR(30),
  year VARCHAR(4),
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  marital_status VARCHAR(20),
  birth_date DATE,
  address VARCHAR(255),
  phone VARCHAR(30),
  teacher VARCHAR(50),
  register_date DATE,
  education_start_date DATE,
  education_end_date DATE,
  affiliation_org VARCHAR(30),
  belong VARCHAR(50),
  new_life_strategy_date DATE,
  identity_verified VARCHAR(1),
  prev_church VARCHAR(100),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  new_comer_id INT
);


-- Menus table
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_name VARCHAR(100) NOT NULL,
  menu_order INT DEFAULT 0,
  department VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Screens table
CREATE TABLE IF NOT EXISTS screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  screen_name VARCHAR(100) NOT NULL,
  screen_path VARCHAR(255) NOT NULL UNIQUE,
  screen_description TEXT,
  component_name VARCHAR(100),
  department VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menu screens table
CREATE TABLE IF NOT EXISTS menu_screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT,
  screen_id INT,
  screen_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User menus table
CREATE TABLE IF NOT EXISTS user_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  menu_id INT,
  can_read TINYINT(1) DEFAULT 1,
  can_write TINYINT(1) DEFAULT 0,
  can_delete TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Code groups table
CREATE TABLE IF NOT EXISTS code_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_code VARCHAR(50) NOT NULL UNIQUE,
  group_name VARCHAR(100) NOT NULL,
  group_description TEXT,
  department VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Code details table
CREATE TABLE IF NOT EXISTS code_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_id INT,
  code_value VARCHAR(50) NOT NULL,
  code_name VARCHAR(100) NOT NULL,
  code_description TEXT,
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- New comer files table (초신자 파일)
CREATE TABLE IF NOT EXISTS new_comer_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255),
  saved_name VARCHAR(255) NOT NULL,
  saved_path VARCHAR(255) NOT NULL,
  size INT,
  mimetype VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Common files table (공통 파일)
CREATE TABLE IF NOT EXISTS common_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  original_name VARCHAR(255) NOT NULL,
  saved_name VARCHAR(255) NOT NULL,
  saved_path VARCHAR(500) NOT NULL,
  size INT,
  mimetype VARCHAR(100),
  description TEXT,
  department VARCHAR(50),
  believer VARCHAR(50),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL PRIMARY KEY,
  user_id INT,
  data TEXT,
  expires TIMESTAMP
);

-- System constants table (시스템 상수값)
CREATE TABLE IF NOT EXISTS system_constants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  constant_key VARCHAR(100) NOT NULL UNIQUE,
  constant_value TEXT,
  constant_type ENUM('string', 'number', 'boolean', 'json', 'file_path') DEFAULT 'string',
  description TEXT,
  category VARCHAR(50) DEFAULT 'general',
  is_active TINYINT(1) DEFAULT 1,
  created_by INT,
  updated_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- New comer education table (초신자교육관리)
CREATE TABLE IF NOT EXISTS new_comer_education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  new_comer_id INT NOT NULL COMMENT '초신자 ID (new_comers 테이블 참조)',
  week1_date DATE COMMENT '1주차 교육일자',
  week2_date DATE COMMENT '2주차 교육일자',
  week3_date DATE COMMENT '3주차 교육일자',
  week4_date DATE COMMENT '4주차 교육일자',
  week5_date DATE COMMENT '5주차 교육일자',
  week6_date DATE COMMENT '6주차 교육일자',
  week7_date DATE COMMENT '7주차 교육일자',
  week8_date DATE COMMENT '8주차 교육일자',
  week1_comment TEXT COMMENT '1주차 코멘트',
  week2_comment TEXT COMMENT '2주차 코멘트',
  week3_comment TEXT COMMENT '3주차 코멘트',
  week4_comment TEXT COMMENT '4주차 코멘트',
  week5_comment TEXT COMMENT '5주차 코멘트',
  week6_comment TEXT COMMENT '6주차 코멘트',
  week7_comment TEXT COMMENT '7주차 코멘트',
  week8_comment TEXT COMMENT '8주차 코멘트',
  overall_comment TEXT COMMENT '전체평가',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (new_comer_id) REFERENCES new_comers(id) ON DELETE CASCADE
);
