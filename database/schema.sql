-- NCS 데이터베이스 스키마
-- 현재 데이터베이스 구조를 기반으로 업데이트됨

-- Users table (사용자 관리)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) DEFAULT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  role VARCHAR(20) DEFAULT NULL,
  profile_image VARCHAR(500) DEFAULT NULL,
  provider ENUM('local', 'google', 'join') DEFAULT 'local',
  provider_id VARCHAR(255) DEFAULT NULL,
  department VARCHAR(50) DEFAULT NULL,
  teacher_type VARCHAR(30) DEFAULT NULL,
  birth_date DATE DEFAULT NULL,
  position VARCHAR(50) DEFAULT NULL,
  work_years INT DEFAULT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active TINYINT(1) DEFAULT 1 COMMENT '사용자 활성화 상태 (1: 활성화, 0: 비활성화)',
  INDEX idx_email (email),
  INDEX idx_provider (provider, provider_id)
);

-- New comers table (초신자 관리)
CREATE TABLE IF NOT EXISTS new_comers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(50) DEFAULT NULL,
  believer_type VARCHAR(20) DEFAULT NULL,
  education_type VARCHAR(30) DEFAULT NULL,
  year VARCHAR(4) DEFAULT NULL,
  name VARCHAR(50) NOT NULL,
  gender VARCHAR(10) NOT NULL,
  marital_status VARCHAR(20) DEFAULT NULL,
  birth_date DATE DEFAULT NULL,
  address VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(30) DEFAULT NULL,
  teacher VARCHAR(50) DEFAULT NULL,
  register_date DATE DEFAULT NULL,
  education_start_date DATE DEFAULT NULL,
  education_end_date VARCHAR(50) DEFAULT NULL,
  affiliation_org VARCHAR(30) DEFAULT NULL,
  belong VARCHAR(50) DEFAULT NULL,
  new_life_strategy_date DATE DEFAULT NULL,
  identity_verified VARCHAR(1) DEFAULT NULL,
  prev_church VARCHAR(100) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  number VARCHAR(20) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  graduate_transfer_status VARCHAR(20) DEFAULT NULL COMMENT '수료전송여부',
  file_id INT DEFAULT NULL,
  INDEX fk_new_comers_file_id (file_id)
);

-- New comers graduates table (초신자 수료자)
CREATE TABLE IF NOT EXISTS new_comers_graduates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  new_comer_id INT NOT NULL,
  graduate_date DATE DEFAULT NULL,
  graduate_type VARCHAR(30) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (new_comer_id) REFERENCES new_comers(id) ON DELETE CASCADE
);

-- New comer education table (초신자 교육관리)
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

-- Code groups table (코드 그룹)
CREATE TABLE IF NOT EXISTS code_groups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  group_name VARCHAR(100) NOT NULL UNIQUE,
  group_description TEXT,
  department VARCHAR(50),
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Code details table (코드 상세)
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

-- Files backup table (파일 백업)
CREATE TABLE IF NOT EXISTS files_backup (
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

-- Sessions table (세션 관리)
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

-- Screens table (화면 관리)
CREATE TABLE IF NOT EXISTS screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  screen_name VARCHAR(100) NOT NULL,
  screen_path VARCHAR(255) NOT NULL,
  screen_description TEXT,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menus table (메뉴 관리)
CREATE TABLE IF NOT EXISTS menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_name VARCHAR(100) NOT NULL,
  menu_path VARCHAR(255) NOT NULL,
  menu_description TEXT,
  parent_menu_id INT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_menu_id) REFERENCES menus(id) ON DELETE SET NULL
);

-- Menu screens table (메뉴-화면 연결)
CREATE TABLE IF NOT EXISTS menu_screens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  screen_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE,
  FOREIGN KEY (screen_id) REFERENCES screens(id) ON DELETE CASCADE
);

-- User menus table (사용자-메뉴 연결)
CREATE TABLE IF NOT EXISTS user_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  menu_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);

-- Users sequence table (사용자 시퀀스)
CREATE TABLE IF NOT EXISTS s_users_seq (
  next_val BIGINT DEFAULT NULL
);

-- 기본 데이터 삽입
INSERT INTO s_users_seq (next_val) VALUES (1);

-- 기본 코드 그룹 데이터
INSERT INTO code_groups (group_name, group_description, department, sort_order) VALUES
('부서', '교회 부서 분류', '일반', 1),
('신자유형', '신자 유형 분류', '일반', 2),
('교육유형', '교육 유형 분류', '일반', 3);

-- 기본 코드 상세 데이터
INSERT INTO code_details (group_id, code_value, code_name, code_description, sort_order) VALUES
(1, '새가족위원회', '새가족위원회', '새가족 담당 부서', 1),
(1, '아포슬', '아포슬', '아포슬 부서', 2),
(2, '초신자', '초신자', '새로 등록한 신자', 1),
(2, '전입신자', '전입신자', '다른 교회에서 전입한 신자', 2),
(3, '수료', '수료', '교육 수료', 1),
(3, '진행중', '진행중', '교육 진행 중', 2),
(3, '중단', '중단', '교육 중단', 3);
