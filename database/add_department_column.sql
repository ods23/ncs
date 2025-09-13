-- yearly_new_family_statistics 테이블에 department 컬럼 추가
-- 실행일: 2025-01-27

-- 1. department 컬럼 추가
ALTER TABLE `yearly_new_family_statistics` 
ADD COLUMN `department` varchar(50) NOT NULL DEFAULT '새가족위원회' COMMENT '부서' AFTER `year`;

-- 2. department 컬럼에 인덱스 추가
ALTER TABLE `yearly_new_family_statistics` 
ADD INDEX `idx_department` (`department`);

-- 3. 기존 데이터의 department 값을 '새가족위원회'로 설정 (이미 DEFAULT 값으로 설정됨)
-- UPDATE `yearly_new_family_statistics` SET `department` = '새가족위원회' WHERE `department` IS NULL;

-- 4. year와 department의 복합 유니크 키로 변경 (기존 unique_year 제약조건 제거 후 추가)
ALTER TABLE `yearly_new_family_statistics` 
DROP INDEX `unique_year`;

ALTER TABLE `yearly_new_family_statistics` 
ADD UNIQUE KEY `unique_year_department` (`year`, `department`);

-- 5. 테이블 구조 확인
DESCRIBE `yearly_new_family_statistics`;
