-- 통계 데이터 저장용 테이블들

-- 1. 연도별 전체 통계 테이블
CREATE TABLE IF NOT EXISTS yearly_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  new_believers_registered INT DEFAULT 0,
  transfer_believers_registered INT DEFAULT 0,
  total_registered INT DEFAULT 0,
  new_believers_completed INT DEFAULT 0,
  transfer_believers_completed INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  new_believers_education_in_progress INT DEFAULT 0,
  new_believers_education_discontinued INT DEFAULT 0,
  transfer_believers_education_in_progress INT DEFAULT 0,
  transfer_believers_education_discontinued INT DEFAULT 0,
  total_education INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year (year)
);

-- 2. 월별 통계 테이블
CREATE TABLE IF NOT EXISTS monthly_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  new_believers_registered INT DEFAULT 0,
  transfer_believers_registered INT DEFAULT 0,
  total_registered INT DEFAULT 0,
  new_believers_completed INT DEFAULT 0,
  transfer_believers_completed INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_month (year, month)
);

-- 3. 연령대별 통계 테이블
CREATE TABLE IF NOT EXISTS age_group_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT DEFAULT 0, -- 0이면 연도 전체, 1-12면 해당 월
  age_group VARCHAR(20) NOT NULL, -- '10대', '20대', '30대', '40대', '50대', '60대', '70대 이상'
  new_believers_count INT DEFAULT 0,
  transfer_believers_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_month_age (year, month, age_group)
);

-- 4. 주별 통계 테이블
CREATE TABLE IF NOT EXISTS weekly_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  year INT NOT NULL,
  month INT NOT NULL,
  week INT NOT NULL,
  new_believers_registered INT DEFAULT 0,
  transfer_believers_registered INT DEFAULT 0,
  total_registered INT DEFAULT 0,
  new_believers_completed INT DEFAULT 0,
  transfer_believers_completed INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_year_month_week (year, month, week)
);

-- 샘플 데이터 삽입 (이미지에서 확인한 데이터 기반)

-- 연도별 통계 데이터
INSERT INTO yearly_statistics (year, new_believers_registered, transfer_believers_registered, total_registered, 
                              new_believers_completed, transfer_believers_completed, total_completed,
                              new_believers_education_in_progress, new_believers_education_discontinued,
                              transfer_believers_education_in_progress, transfer_believers_education_discontinued, total_education) VALUES
(2019, 223, 310, 533, 131, 294, 425, 0, 0, 0, 0, 0),
(2020, 54, 260, 314, 56, 157, 213, 0, 0, 0, 0, 0),
(2021, 88, 177, 265, 70, 156, 226, 0, 0, 0, 0, 0),
(2022, 131, 245, 376, 59, 203, 262, 0, 0, 0, 0, 0),
(2023, 198, 397, 595, 119, 376, 495, 103, 0, 62, 0, 165),
(2024, 180, 361, 541, 127, 337, 464, 92, 0, 54, 0, 146),
(2025, 84, 194, 278, 95, 187, 282, 46, 0, 45, 0, 91);

-- 2025년 월별 통계 데이터
INSERT INTO monthly_statistics (year, month, new_believers_registered, transfer_believers_registered, total_registered) VALUES
(2025, 1, 14, 55, 69),
(2025, 2, 10, 52, 62),
(2025, 3, 20, 30, 50),
(2025, 4, 15, 15, 30),
(2025, 5, 12, 21, 33),
(2025, 6, 13, 21, 34);

-- 2025년 연령대별 통계 데이터 (전체)
INSERT INTO age_group_statistics (year, month, age_group, new_believers_count, transfer_believers_count, total_count) VALUES
(2025, 0, '10대', 1, 0, 1),
(2025, 0, '20대', 2, 16, 18),
(2025, 0, '30대', 15, 50, 65),
(2025, 0, '40대', 25, 66, 91),
(2025, 0, '50대', 19, 41, 60),
(2025, 0, '60대', 8, 17, 25),
(2025, 0, '70대 이상', 13, 4, 17);
