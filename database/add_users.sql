-- 사용자 추가 스크립트
-- 초신자교사 10명, 전입신자교사 10명 추가
-- 비밀번호: 1234567890 (bcrypt 해시)
-- 부서: 새가족위원회

-- 초신자교사 10명 추가
INSERT INTO users (email, password, name, phone, role, department, teacher_type, position, is_active) VALUES
('ncs1@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '김동호', '010-1111-0001', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs2@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '이수정', '010-1111-0002', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs3@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '박민수', '010-1111-0003', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs4@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '최영희', '010-1111-0004', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs5@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '정태호', '010-1111-0005', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs6@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '강미영', '010-1111-0006', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs7@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '조현우', '010-1111-0007', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs8@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '윤지은', '010-1111-0008', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs9@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '장성민', '010-1111-0009', '일반', '새가족위원회', '초신자교사', '담당교사', 1),
('ncs10@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '한소영', '010-1111-0010', '일반', '새가족위원회', '초신자교사', '담당교사', 1);

-- 전입신자교사 10명 추가
INSERT INTO users (email, password, name, phone, role, department, teacher_type, position, is_active) VALUES
('ncs11@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '김철수', '010-2222-0001', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs12@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '이영희', '010-2222-0002', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs13@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '박준호', '010-2222-0003', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs14@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '최미경', '010-2222-0004', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs15@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '정성호', '010-2222-0005', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs16@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '강수진', '010-2222-0006', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs17@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '조민준', '010-2222-0007', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs18@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '윤혜진', '010-2222-0008', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs19@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '장동현', '010-2222-0009', '일반', '새가족위원회', '전입신자교사', '담당교사', 1),
('ncs20@ncs.com', '$2b$10$7oexuogeDyuTKo/6.BMRlO0xL6BclxdLcm7u1JHdZ8fWlVb94Zicu', '한지영', '010-2222-0010', '일반', '새가족위원회', '전입신자교사', '담당교사', 1);
