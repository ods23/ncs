-- NCS Database Schema
-- Generated on: 2025-08-25T14:02:12.316Z
-- Database: nodejsweb_db

-- code_details table
CREATE TABLE `code_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `code_value` varchar(50) NOT NULL,
  `code_name` varchar(100) NOT NULL,
  `code_description` text DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_group_code_value` (`group_id`,`code_value`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_code_value` (`code_value`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `code_details_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `code_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- code_groups table
CREATE TABLE `code_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_code` varchar(50) NOT NULL,
  `group_name` varchar(100) NOT NULL,
  `group_description` text DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `group_code` (`group_code`),
  KEY `idx_group_code` (`group_code`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_department` (`department`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- common_files table
CREATE TABLE `common_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) NOT NULL,
  `saved_name` varchar(255) NOT NULL,
  `saved_path` varchar(500) NOT NULL,
  `size` int(11) NOT NULL,
  `mimetype` varchar(100) NOT NULL,
  `description` mediumtext DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `believer` varchar(50) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `common_files_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- files_backup table
CREATE TABLE `files_backup` (
  `id` int(11) NOT NULL DEFAULT 0,
  `original_name` varchar(255) DEFAULT NULL,
  `saved_name` varchar(255) NOT NULL,
  `saved_path` varchar(255) NOT NULL,
  `size` int(11) DEFAULT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- menus table
CREATE TABLE `menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_name` varchar(100) NOT NULL,
  `menu_order` int(11) DEFAULT 0,
  `department` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_menu_order` (`menu_order`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_department` (`department`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- menu_screens table
CREATE TABLE `menu_screens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `menu_id` int(11) NOT NULL,
  `screen_id` int(11) NOT NULL,
  `screen_order` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_menu_screen` (`menu_id`,`screen_id`),
  KEY `screen_id` (`screen_id`),
  KEY `idx_menu_id` (`menu_id`),
  KEY `idx_screen_order` (`screen_order`),
  CONSTRAINT `menu_screens_ibfk_1` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `menu_screens_ibfk_2` FOREIGN KEY (`screen_id`) REFERENCES `screens` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- new_comers table
CREATE TABLE `new_comers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `department` varchar(50) DEFAULT NULL,
  `believer_type` varchar(20) DEFAULT NULL,
  `education_type` varchar(30) DEFAULT NULL,
  `year` varchar(4) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `teacher` varchar(50) DEFAULT NULL,
  `register_date` date DEFAULT NULL,
  `education_start_date` date DEFAULT NULL,
  `education_end_date` varchar(50) DEFAULT NULL,
  `affiliation_org` varchar(30) DEFAULT NULL,
  `belong` varchar(50) DEFAULT NULL,
  `new_life_strategy_date` date DEFAULT NULL,
  `identity_verified` varchar(1) DEFAULT NULL,
  `prev_church` varchar(100) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `number` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `graduate_transfer_status` varchar(20) DEFAULT NULL COMMENT '수료전송여부',
  `file_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_new_comers_file_id` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=798 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- new_comers_graduates table
CREATE TABLE `new_comers_graduates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `graduate_number` varchar(20) DEFAULT NULL,
  `print_count` int(11) DEFAULT 0 COMMENT '프린트 횟수',
  `department` varchar(50) DEFAULT NULL,
  `believer_type` varchar(20) DEFAULT NULL,
  `education_type` varchar(30) DEFAULT NULL,
  `year` varchar(4) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `gender` varchar(10) NOT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `teacher` varchar(50) DEFAULT NULL,
  `register_date` date DEFAULT NULL,
  `education_start_date` date DEFAULT NULL,
  `education_end_date` varchar(50) DEFAULT NULL,
  `affiliation_org` varchar(30) DEFAULT NULL,
  `belong` varchar(50) DEFAULT NULL,
  `new_life_strategy_date` date DEFAULT NULL,
  `identity_verified` varchar(1) DEFAULT NULL,
  `prev_church` varchar(100) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `new_comer_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_graduate_number` (`graduate_number`),
  KEY `idx_dept_believer_year` (`department`,`believer_type`,`year`)
) ENGINE=InnoDB AUTO_INCREMENT=538 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- new_comers_education table
CREATE TABLE `new_comers_education` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `new_comer_id` int(11) NOT NULL COMMENT '초신자 ID (new_comers 테이블 참조)',
  `week1_date` date DEFAULT NULL COMMENT '1주차 교육일자',
  `week2_date` date DEFAULT NULL COMMENT '2주차 교육일자',
  `week3_date` date DEFAULT NULL COMMENT '3주차 교육일자',
  `week4_date` date DEFAULT NULL COMMENT '4주차 교육일자',
  `week5_date` date DEFAULT NULL COMMENT '5주차 교육일자',
  `week6_date` date DEFAULT NULL COMMENT '6주차 교육일자',
  `week7_date` date DEFAULT NULL COMMENT '7주차 교육일자',
  `week8_date` date DEFAULT NULL COMMENT '8주차 교육일자',
  `week1_comment` text DEFAULT NULL COMMENT '1주차 코멘트',
  `week2_comment` text DEFAULT NULL COMMENT '2주차 코멘트',
  `week3_comment` text DEFAULT NULL COMMENT '3주차 코멘트',
  `week4_comment` text DEFAULT NULL COMMENT '4주차 코멘트',
  `week5_comment` text DEFAULT NULL COMMENT '5주차 코멘트',
  `week6_comment` text DEFAULT NULL COMMENT '6주차 코멘트',
  `week7_comment` text DEFAULT NULL COMMENT '7주차 코멘트',
  `week8_comment` text DEFAULT NULL COMMENT '8주차 코멘트',
  `overall_comment` text DEFAULT NULL COMMENT '전체평가',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `file_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `new_comer_id` (`new_comer_id`),
  KEY `file_id` (`file_id`),
  CONSTRAINT `new_comers_education_ibfk_1` FOREIGN KEY (`new_comer_id`) REFERENCES `new_comers` (`id`) ON DELETE CASCADE,
CONSTRAINT `new_comers_education_ibfk_2` FOREIGN KEY (`file_id`) REFERENCES `new_comers_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- new_comers_files table
CREATE TABLE `new_comers_files` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) DEFAULT NULL,
  `saved_name` varchar(255) NOT NULL,
  `saved_path` varchar(255) NOT NULL,
  `size` int(11) DEFAULT NULL,
  `mimetype` varchar(100) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- screens table
CREATE TABLE `screens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `screen_name` varchar(100) NOT NULL,
  `screen_path` varchar(255) NOT NULL,
  `screen_description` text DEFAULT NULL,
  `component_name` varchar(100) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `screen_path` (`screen_path`),
  KEY `created_by` (`created_by`),
  KEY `idx_screen_path` (`screen_path`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_department` (`department`),
  CONSTRAINT `screens_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- sessions table
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `data` text DEFAULT NULL,
  `expires` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- system_constants table
CREATE TABLE `system_constants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `constant_key` varchar(100) NOT NULL,
  `constant_value` text DEFAULT NULL,
  `constant_type` enum('string','number','boolean','json','file_path') DEFAULT 'string',
  `description` text DEFAULT NULL,
  `category` varchar(50) DEFAULT 'general',
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `constant_key` (`constant_key`),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `system_constants_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `system_constants_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- s_users_seq table
CREATE TABLE `s_users_seq` (
  `next_not_cached_value` bigint(21) NOT NULL,
  `minimum_value` bigint(21) NOT NULL,
  `maximum_value` bigint(21) NOT NULL,
  `start_value` bigint(21) NOT NULL COMMENT 'start value when sequences is created or value if RESTART is used',
  `increment` bigint(21) NOT NULL COMMENT 'increment value',
  `cache_size` bigint(21) unsigned NOT NULL,
  `cycle_option` tinyint(1) unsigned NOT NULL COMMENT '0 if no cycles are allowed, 1 if the sequence should begin a new cycle when maximum_value is passed',
  `cycle_count` bigint(21) NOT NULL COMMENT 'How many cycles have been done'
) ENGINE=InnoDB SEQUENCE=1;

-- users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `provider` enum('local','google','join') DEFAULT 'local',
  `provider_id` varchar(255) DEFAULT NULL,
  `department` varchar(50) DEFAULT NULL,
  `teacher_type` varchar(30) DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `position` varchar(50) DEFAULT NULL,
  `work_years` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_active` tinyint(1) DEFAULT 1 COMMENT '사용자 활성화 상태 (1: 활성화, 0: 비활성화)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_provider` (`provider`,`provider_id`)
) ENGINE=InnoDB AUTO_INCREMENT=72 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- user_menus table
CREATE TABLE `user_menus` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `menu_id` int(11) NOT NULL,
  `can_read` tinyint(1) DEFAULT 1,
  `can_write` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_menu` (`user_id`,`menu_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_menu_id` (`menu_id`),
  CONSTRAINT `user_menus_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_menus_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- yearly_new_family_statistics table
CREATE TABLE `yearly_new_family_statistics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `year` int(4) NOT NULL COMMENT '년도',
  `new_comer_registration` int(11) DEFAULT 0 COMMENT '초신자등록',
  `transfer_believer_registration` int(11) DEFAULT 0 COMMENT '전입신자등록',
  `total_registration` int(11) DEFAULT 0 COMMENT '등록전체합계',
  `new_comer_graduate_prev_year` int(11) DEFAULT 0 COMMENT '초신자전년도수료',
  `new_comer_graduate_current_year` int(11) DEFAULT 0 COMMENT '초신자올해수료',
  `new_comer_graduate_total` int(11) DEFAULT 0 COMMENT '초신자수료합계',
  `transfer_believer_graduate_prev_year` int(11) DEFAULT 0 COMMENT '전입신자전년도수료',
  `transfer_believer_graduate_current_year` int(11) DEFAULT 0 COMMENT '전입신자올해수료',
  `transfer_believer_graduate_total` int(11) DEFAULT 0 COMMENT '전입신자수료합계',
  `total_graduate` int(11) DEFAULT 0 COMMENT '수료전체합계',
  `new_comer_education_in_progress` int(11) DEFAULT 0 COMMENT '초신자교육중',
  `new_comer_education_discontinued` int(11) DEFAULT 0 COMMENT '초신자교육중단',
  `new_comer_education_total` int(11) DEFAULT 0 COMMENT '초신자교육합계',
  `transfer_believer_education_in_progress` int(11) DEFAULT 0 COMMENT '전입신자교육중',
  `transfer_believer_education_discontinued` int(11) DEFAULT 0 COMMENT '전입신자교육중단',
  `transfer_believer_education_total` int(11) DEFAULT 0 COMMENT '전입신자교육합계',
  `total_education` int(11) DEFAULT 0 COMMENT '교육전체합계',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_year` (`year`),
  KEY `idx_year` (`year`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- 기본 데이터 삽입
-- s_users_seq 데이터
INSERT INTO s_users_seq (id, seq) VALUES (undefined, undefined);

-- code_groups 데이터
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (2, '부서', '새가족위원회, 아포슬, 등', '새가족위원회', 1, 1, 'Sun Jul 20 2025 19:27:05 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:51:03 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (3, '신자', '초신자, 전입신자', '새가족위원회', 1, 2, 'Sun Jul 20 2025 21:15:57 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:56:34 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (4, '교육', '교육구분', '새가족위원회', 1, 3, 'Sun Jul 20 2025 21:18:43 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:57:14 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (5, '성별', '성별구분', '새가족위원회', 1, 4, 'Sun Jul 20 2025 21:22:03 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:57:21 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (6, '결혼', '결혼구분', '새가족위원회', 1, 5, 'Sun Jul 20 2025 21:26:19 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:56:58 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (7, '편입기관', '편입기관', '새가족위원회', 1, 6, 'Sun Jul 20 2025 21:27:19 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:27:19 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (8, '소속', '소속구분', '새가족위원회', 1, 7, 'Sun Jul 20 2025 21:33:02 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:57:32 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (9, '교사', '교사구분', '새가족위원회', 1, 8, 'Sun Jul 20 2025 21:41:45 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:57:42 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (10, '직분', '직분', '새가족위원회', 1, 9, 'Sun Jul 20 2025 21:46:55 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:46:55 GMT+0900 (대한민국 표준시)');
INSERT INTO code_groups (id, group_name, group_description, department, is_active, sort_order, created_at, updated_at) VALUES (11, '역할', '일반 혹은 관리자', '새가족위원회', 1, 10, 'Tue Aug 05 2025 20:07:15 GMT+0900 (대한민국 표준시)', 'Tue Aug 05 2025 20:07:30 GMT+0900 (대한민국 표준시)');

-- code_details 데이터
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (3, 2, '새가족위원회', '새가족위원회', '새가족위원회', 1, 1, 'Sun Jul 20 2025 19:28:30 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:46:40 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (5, 2, '아포슬', '아포슬', '아포슬', 2, 1, 'Sun Jul 20 2025 19:29:36 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 19:29:36 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (8, 4, '등록', '등록', '등록', 1, 1, 'Sun Jul 20 2025 21:20:26 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:20:26 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (9, 4, '교사배정', '교사배정', '교사배정', 2, 1, 'Sun Jul 20 2025 21:20:41 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:20:41 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (10, 4, '교육중', '교육중', '교육중', 3, 1, 'Sun Jul 20 2025 21:20:57 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:20:57 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (11, 4, '교육중단', '교육중단', '교유중단', 4, 1, 'Sun Jul 20 2025 21:21:24 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:21:24 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (12, 4, '수료', '수료', '수료', 5, 1, 'Sun Jul 20 2025 21:21:44 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:21:44 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (13, 5, '남', '남', '남', 1, 1, 'Sun Jul 20 2025 21:24:26 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:24:26 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (14, 5, '여', '여', '여', 2, 1, 'Sun Jul 20 2025 21:24:36 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:24:36 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (15, 7, '1대', '1대', '1대교구', 1, 1, 'Sun Jul 20 2025 21:27:39 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:30:45 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (16, 7, '2대', '2대', '2대교구', 2, 1, 'Sun Jul 20 2025 21:27:59 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:27:59 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (17, 7, '3대', '3대', '3대교구', 3, 1, 'Sun Jul 20 2025 21:28:18 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:28:18 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (18, 7, '4대', '4대', '4대교구', 4, 1, 'Sun Jul 20 2025 21:28:32 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:28:32 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (19, 7, '5대', '5대', '5대교구', 5, 1, 'Sun Jul 20 2025 21:28:53 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:30:51 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (20, 7, '6대', '6대', '6대교구', 6, 1, 'Sun Jul 20 2025 21:29:15 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:30:59 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (21, 7, '7대', '7대', '7대교구', 7, 1, 'Sun Jul 20 2025 21:29:39 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:31:05 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (22, 7, '8대', '8대', '8대교구', 8, 1, 'Sun Jul 20 2025 21:29:54 GMT+0900 (대한민국 표준시)', 'Mon Aug 25 2025 22:33:12 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (23, 7, '9대', '9대', '9대교구', 9, 1, 'Sun Jul 20 2025 21:30:06 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:30:06 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (24, 7, '10대', '10대', '10대교구', 10, 1, 'Sun Jul 20 2025 21:30:26 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:31:32 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (25, 8, '1남전도회', '1남전도회', '1남전도회', 1, 1, 'Sun Jul 20 2025 21:34:15 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:34:15 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (26, 8, '2남전도회', '2남전도회', '2남전도회', 2, 1, 'Sun Jul 20 2025 21:34:35 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:34:35 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (27, 8, '3남전도회', '3남전도회', '3남전도회', 3, 1, 'Sun Jul 20 2025 21:34:53 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:34:53 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (28, 8, '45남전도회', '4,5남전도회', '4,5남전도회', 4, 1, 'Sun Jul 20 2025 21:35:18 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:35:18 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (29, 8, '6남전도회', '6남전도회', '6남전도회', 5, 1, 'Sun Jul 20 2025 21:35:42 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:35:42 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (30, 8, '1여전도회', '1여전도회', '1여전도회', 6, 1, 'Sun Jul 20 2025 21:36:05 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:36:05 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (31, 8, '2여전도회', '2여전도회', '2여전도회', 7, 1, 'Sun Jul 20 2025 21:36:26 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:36:26 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (32, 8, '3여전도회', '3여전도회', '3여전도회', 8, 1, 'Sun Jul 20 2025 21:36:51 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:36:51 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (33, 8, '4여전도회', '4여전도회', '4여전도회', 9, 1, 'Sun Jul 20 2025 21:37:09 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:37:44 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (34, 8, '5여전도회', '5여전도회', '5여전도회', 10, 1, 'Sun Jul 20 2025 21:38:12 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:38:12 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (35, 8, '6여전도회', '6여전도회', '6여전도회', 11, 1, 'Sun Jul 20 2025 21:38:30 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:38:30 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (36, 8, '7여전도회', '7여전도회', '7여전도회', 12, 1, 'Sun Jul 20 2025 21:39:14 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:39:14 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (37, 8, '89여전도회', '8,9여전도회', '8,9여전도회', 13, 1, 'Sun Jul 20 2025 21:39:36 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:39:36 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (38, 8, '10여전도회', '10여전도회', '10여전도회', 14, 1, 'Sun Jul 20 2025 21:40:12 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:40:12 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (39, 9, '담당목사', '담당목사', '담당목사', 1, 1, 'Sun Jul 20 2025 21:43:07 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:43:07 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (40, 9, '위원장', '위원장', '위원장', 2, 1, 'Sun Jul 20 2025 21:43:27 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:43:27 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (41, 9, '부위원장', '부위원장', '부위원장', 3, 1, 'Sun Jul 20 2025 21:43:51 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:43:51 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (42, 9, '회계', '회계', '회계', 4, 1, 'Sun Jul 20 2025 21:44:04 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:44:04 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (43, 9, '초신자부장', '초신자부장', '초신자부장', 5, 1, 'Sun Jul 20 2025 21:44:26 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:44:26 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (44, 9, '전입신자부장', '전입신자부장', '전입신자부장', 6, 1, 'Sun Jul 20 2025 21:44:47 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:44:47 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (45, 9, '초신자행정부장', '초신자행정부장', '초신자행정부장', 7, 1, 'Sun Jul 20 2025 21:45:10 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:45:10 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (46, 9, '전입신자행정부장', '전입신자행정부장', '전입신자행정부장', 8, 1, 'Sun Jul 20 2025 21:45:36 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:45:36 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (47, 9, '초신자교사', '초신자교사', '초신자교사', 9, 1, 'Sun Jul 20 2025 21:45:58 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:45:58 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (48, 9, '전입신자교사', '전입신자교사', '전입신자교사', 10, 1, 'Sun Jul 20 2025 21:46:25 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:46:25 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (49, 10, '목사', '목사', '목사', 1, 1, 'Sun Jul 20 2025 21:47:19 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:47:19 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (50, 10, '장로', '장로', '장로', 2, 1, 'Sun Jul 20 2025 21:47:34 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:47:34 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (51, 10, '안수집사', '안수집사', '안수집사', 3, 1, 'Sun Jul 20 2025 21:47:46 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:47:46 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (52, 10, '권사', '권사', '권사', 4, 1, 'Sun Jul 20 2025 21:47:57 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:47:57 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (53, 10, '집사', '집사', '집사', 5, 1, 'Sun Jul 20 2025 21:48:10 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 21:48:10 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (54, 7, '에젤', '에젤', '에젤', 11, 1, 'Sun Jul 20 2025 22:26:37 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:26:37 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (55, 7, '청년부', '청년부', '청년부', 12, 1, 'Sun Jul 20 2025 22:26:52 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:28:01 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (56, 7, '통일비전', '통일비전', '통일비전', 13, 1, 'Sun Jul 20 2025 22:27:47 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:31:15 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (57, 7, '본당청년', '본당청년', '본당청년', 14, 1, 'Sun Jul 20 2025 22:28:19 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:28:19 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (58, 7, '러시아', '러시아', '러시아예배부', 15, 1, 'Sun Jul 20 2025 22:33:12 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:33:12 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (59, 7, '베트남예배부', '베트남예배부', '베트남예배부', 16, 1, 'Sun Jul 20 2025 22:33:38 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:33:38 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (60, 8, '1011여전도회', '10,11여전도회', '10,11여전도회', 16, 1, 'Sun Jul 20 2025 22:34:44 GMT+0900 (대한민국 표준시)', 'Mon Aug 04 2025 08:13:11 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (61, 8, '레아회', '레아회', '레아회', 16, 1, 'Sun Jul 20 2025 22:35:42 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:35:42 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (62, 8, '리브가회', '리브가회', '리브가회', 17, 1, 'Sun Jul 20 2025 22:35:55 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:35:55 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (63, 8, '사라회', '사라회', '사라회', 18, 1, 'Sun Jul 20 2025 22:36:21 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:36:21 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (64, 8, '섬나', '섬나', '섬나', 19, 1, 'Sun Jul 20 2025 22:36:50 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:36:50 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (65, 8, '아브라함회', '아브라함회', '아브라함회', 20, 1, 'Sun Jul 20 2025 22:37:22 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:37:22 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (66, 8, '야곱회', '야곱회', '야곱회', 21, 1, 'Sun Jul 20 2025 22:37:34 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:37:34 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (67, 8, '이삭회', '이삭회', '이삭회', 22, 1, 'Sun Jul 20 2025 22:37:56 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:37:56 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (68, 6, '미혼', '미혼', '미혼', 1, 1, 'Sun Jul 20 2025 22:47:17 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:47:17 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (69, 6, '기혼', '기혼', '기혼', 2, 1, 'Sun Jul 20 2025 22:47:30 GMT+0900 (대한민국 표준시)', 'Sun Jul 20 2025 22:47:30 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (72, 11, '일반', '일반', '일반 사용자', 1, 1, 'Tue Aug 05 2025 20:07:55 GMT+0900 (대한민국 표준시)', 'Tue Aug 05 2025 20:08:33 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (73, 11, '관리자', '관리자', '관리자', 2, 1, 'Tue Aug 05 2025 20:08:26 GMT+0900 (대한민국 표준시)', 'Tue Aug 05 2025 20:08:26 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (77, 3, '초신자', '초신자', '초신자', 1, 1, 'Fri Aug 08 2025 15:51:00 GMT+0900 (대한민국 표준시)', 'Fri Aug 08 2025 15:51:00 GMT+0900 (대한민국 표준시)');
INSERT INTO code_details (id, group_id, code_value, code_name, code_description, sort_order, is_active, created_at, updated_at) VALUES (78, 3, '전입신자', '전입신자', '전입신자', 2, 1, 'Fri Aug 08 2025 15:51:14 GMT+0900 (대한민국 표준시)', 'Fri Aug 08 2025 15:51:14 GMT+0900 (대한민국 표준시)');

