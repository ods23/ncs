const mariadb = require('mariadb');
require('dotenv').config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'nodejsweb_db',
    charset: 'utf8',
    collation: 'utf8_unicode_ci',
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    bigIntAsNumber: false,
    supportBigNumbers: true,
    bigNumberStrings: true,
    timezone: '+09:00'
});

// 한국 이름 생성 함수
function generateKoreanName(gender) {
    const surnames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '고'];
    const maleNames = ['민수', '준호', '성민', '동호', '태호', '현우', '영희', '수정', '지은', '소영', '미영', '철수', '영희', '동현', '성호', '민준', '미경', '지영', '수진', '혜진'];
    const femaleNames = ['지영', '수진', '혜진', '미영', '지은', '소영', '영희', '수정', '미경', '민수', '준호', '성민', '동호', '태호', '현우', '철수', '영희', '동현', '성호', '민준'];
    
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const names = gender === '남' ? maleNames : femaleNames;
    const name = names[Math.floor(Math.random() * names.length)];
    
    return surname + name;
}

// 전화번호 생성 함수
function generatePhoneNumber() {
    const prefixes = ['010', '011', '016', '017', '018', '019'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const middle = Math.floor(Math.random() * 9000) + 1000;
    const last = Math.floor(Math.random() * 9000) + 1000;
    return `${prefix}-${middle}-${last}`;
}

// 주소 생성 함수
function generateAddress() {
    const cities = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시', '울산광역시'];
    const districts = ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const street = Math.floor(Math.random() * 999) + 1;
    const building = Math.floor(Math.random() * 99) + 1;
    
    return `${city} ${district} ${street}번길 ${building}`;
}

// 생년월일 생성 함수 (10대~70대 이상)
function generateBirthDate() {
    const currentYear = new Date().getFullYear();
    const ageGroups = [
        { min: 10, max: 19 }, // 10대
        { min: 20, max: 29 }, // 20대
        { min: 30, max: 39 }, // 30대
        { min: 40, max: 49 }, // 40대
        { min: 50, max: 59 }, // 50대
        { min: 60, max: 69 }, // 60대
        { min: 70, max: 80 }  // 70대 이상
    ];
    
    const ageGroup = ageGroups[Math.floor(Math.random() * ageGroups.length)];
    const age = Math.floor(Math.random() * (ageGroup.max - ageGroup.min + 1)) + ageGroup.min;
    const birthYear = currentYear - age;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1; // 28일로 제한하여 유효한 날짜 보장
    
    return `${birthYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

// 일요일 날짜 생성 함수
function getNextSunday(year, month, day) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    date.setDate(date.getDate() + daysUntilSunday);
    return date;
}

// 등록일자 생성 함수 (2025년 일요일)
function generateRegisterDate() {
    const year = 2025;
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    
    const sundayDate = getNextSunday(year, month, day);
    return sundayDate.toISOString().split('T')[0];
}

// 교육 시작일자 생성 함수 (일요일)
function generateEducationStartDate(registerDate) {
    const register = new Date(registerDate);
    const startDate = new Date(register);
    startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) + 7); // 등록일로부터 7-37일 후
    
    // 일요일로 조정
    const dayOfWeek = startDate.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    startDate.setDate(startDate.getDate() + daysUntilSunday);
    
    return startDate.toISOString().split('T')[0];
}

// 교육 종료일자 생성 함수 (초신자 8주, 전입신자 4주, 일요일, 2025년 고정)
function generateEducationEndDate(startDate, believerType) {
    const start = new Date(startDate);
    const endDate = new Date(start);
    
    // 초신자는 8주(56일), 전입신자는 4주(28일)
    const weeks = believerType === '초신자' ? 8 : 4;
    endDate.setDate(endDate.getDate() + (weeks * 7));
    
    // 일요일로 조정
    const dayOfWeek = endDate.getDay();
    const daysUntilSunday = (7 - dayOfWeek) % 7;
    endDate.setDate(endDate.getDate() + daysUntilSunday);
    
    // 년도를 2025년으로 고정
    endDate.setFullYear(2025);
    
    return endDate.toISOString().split('T')[0];
}

// 교사 배정 함수
function assignTeacher(teachers, index) {
    return teachers[index % teachers.length];
}

// 초신자 데이터 생성
async function generateNewComersData() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('✅ MariaDB 연결 성공!');

        // 교사 정보 가져오기
        const newComerTeachers = await conn.query("SELECT name FROM users WHERE teacher_type = '초신자교사' ORDER BY name");
        const transferTeachers = await conn.query("SELECT name FROM users WHERE teacher_type = '전입신자교사' ORDER BY name");

        console.log(`초신자교사 ${newComerTeachers.length}명, 전입신자교사 ${transferTeachers.length}명 확인`);

        // 초신자 100명 데이터 생성
        console.log('\n=== 초신자 100명 데이터 생성 중... ===');
        const newComersData = [];
        
        for (let i = 1; i <= 100; i++) {
            const gender = Math.random() < 0.5 ? '남' : '여';
            const name = generateKoreanName(gender);
            const birthDate = generateBirthDate();
            const registerDate = generateRegisterDate();
            const educationStartDate = generateEducationStartDate(registerDate);
            const educationEndDate = generateEducationEndDate(educationStartDate, '초신자');
            
            const newComer = {
                department: '새가족위원회',
                believer_type: '초신자',
                education_type: Math.random() < 0.5 ? '수료' : '교육중',
                year: '2025',
                name: name,
                gender: gender,
                marital_status: Math.random() < 0.6 ? '기혼' : '미혼',
                birth_date: birthDate,
                address: generateAddress(),
                phone: generatePhoneNumber(),
                teacher: assignTeacher(newComerTeachers, i - 1).name,
                register_date: registerDate,
                education_start_date: educationStartDate,
                education_end_date: educationEndDate,
                affiliation_org: ['1대', '2대', '3대', '4대', '5대', '6대', '7대', '8대', '9대', '10대'][Math.floor(Math.random() * 10)],
                belong: ['1남전도회', '2남전도회', '3남전도회', '1여전도회', '2여전도회', '3여전도회'][Math.floor(Math.random() * 6)],
                new_life_strategy_date: registerDate,
                identity_verified: 'Y',
                prev_church: null,
                comment: `초신자 ${i}번 - ${name}`,
                number: `25-${i.toString().padStart(3, '0')}`
            };
            
            newComersData.push(newComer);
        }

        // 전입신자 100명 데이터 생성
        console.log('\n=== 전입신자 100명 데이터 생성 중... ===');
        const transferBelieversData = [];
        
        for (let i = 1; i <= 100; i++) {
            const gender = Math.random() < 0.5 ? '남' : '여';
            const name = generateKoreanName(gender);
            const birthDate = generateBirthDate();
            const registerDate = generateRegisterDate();
            const educationStartDate = generateEducationStartDate(registerDate);
            const educationEndDate = generateEducationEndDate(educationStartDate, '전입신자');
            
            const transferBeliever = {
                department: '새가족위원회',
                believer_type: '전입신자',
                education_type: Math.random() < 0.5 ? '수료' : '교육중',
                year: '2025',
                name: name,
                gender: gender,
                marital_status: Math.random() < 0.6 ? '기혼' : '미혼',
                birth_date: birthDate,
                address: generateAddress(),
                phone: generatePhoneNumber(),
                teacher: assignTeacher(transferTeachers, i - 1).name,
                register_date: registerDate,
                education_start_date: educationStartDate,
                education_end_date: educationEndDate,
                affiliation_org: ['1대', '2대', '3대', '4대', '5대', '6대', '7대', '8대', '9대', '10대'][Math.floor(Math.random() * 10)],
                belong: ['1남전도회', '2남전도회', '3남전도회', '1여전도회', '2여전도회', '3여전도회'][Math.floor(Math.random() * 6)],
                new_life_strategy_date: registerDate,
                identity_verified: 'Y',
                prev_church: ['○○교회', '△△교회', '□□교회', '◇◇교회', '◎◎교회'][Math.floor(Math.random() * 5)],
                comment: `전입신자 ${i}번 - ${name}`,
                number: `25-${i.toString().padStart(3, '0')}`
            };
            
            transferBelieversData.push(transferBeliever);
        }

        // 데이터베이스에 삽입
        console.log('\n=== 데이터베이스 삽입 중... ===');
        
        // 초신자 데이터 삽입
        for (const newComer of newComersData) {
            await conn.query(`
                INSERT INTO new_comers (
                    department, believer_type, education_type, year, name, gender, marital_status,
                    birth_date, address, phone, teacher, register_date, education_start_date,
                    education_end_date, affiliation_org, belong, new_life_strategy_date,
                    identity_verified, prev_church, comment, number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                newComer.department, newComer.believer_type, newComer.education_type, newComer.year,
                newComer.name, newComer.gender, newComer.marital_status, newComer.birth_date,
                newComer.address, newComer.phone, newComer.teacher, newComer.register_date,
                newComer.education_start_date, newComer.education_end_date, newComer.affiliation_org,
                newComer.belong, newComer.new_life_strategy_date, newComer.identity_verified,
                newComer.prev_church, newComer.comment, newComer.number
            ]);
        }

        // 전입신자 데이터 삽입
        for (const transferBeliever of transferBelieversData) {
            await conn.query(`
                INSERT INTO new_comers (
                    department, believer_type, education_type, year, name, gender, marital_status,
                    birth_date, address, phone, teacher, register_date, education_start_date,
                    education_end_date, affiliation_org, belong, new_life_strategy_date,
                    identity_verified, prev_church, comment, number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                transferBeliever.department, transferBeliever.believer_type, transferBeliever.education_type, transferBeliever.year,
                transferBeliever.name, transferBeliever.gender, transferBeliever.marital_status, transferBeliever.birth_date,
                transferBeliever.address, transferBeliever.phone, transferBeliever.teacher, transferBeliever.register_date,
                transferBeliever.education_start_date, transferBeliever.education_end_date, transferBeliever.affiliation_org,
                transferBeliever.belong, transferBeliever.new_life_strategy_date, transferBeliever.identity_verified,
                transferBeliever.prev_church, transferBeliever.comment, transferBeliever.number
            ]);
        }

        console.log('✅ 초신자 100명, 전입신자 100명 데이터 생성 완료!');

        // 수료자 50명씩 new_comers_graduates 테이블에 추가
        console.log('\n=== 수료자 데이터를 new_comers_graduates 테이블에 추가 중... ===');
        
        // 초신자 수료자 50명 선택
        const newComerGraduates = await conn.query(`
            SELECT * FROM new_comers 
            WHERE believer_type = '초신자' AND education_type = '수료' 
            ORDER BY id LIMIT 50
        `);

        // 전입신자 수료자 50명 선택
        const transferGraduates = await conn.query(`
            SELECT * FROM new_comers 
            WHERE believer_type = '전입신자' AND education_type = '수료' 
            ORDER BY id LIMIT 50
        `);

        console.log(`초신자 수료자 ${newComerGraduates.length}명, 전입신자 수료자 ${transferGraduates.length}명 확인`);

        // 초신자 수료자 데이터를 new_comers_graduates에 삽입
        for (let i = 0; i < newComerGraduates.length; i++) {
            const graduate = newComerGraduates[i];
            const graduateNumber = `25-${(i + 1).toString().padStart(3, '0')}`;
            
            // 수료일자를 2025년으로 수정
            const educationEndDate2025 = graduate.education_end_date.replace(/^\d{4}/, '2025');
            
            await conn.query(`
                INSERT INTO new_comers_graduates (
                    graduate_number, department, believer_type, education_type, year, name, gender, marital_status,
                    birth_date, address, phone, teacher, register_date, education_start_date,
                    education_end_date, affiliation_org, belong, new_life_strategy_date,
                    identity_verified, prev_church, comment, new_comer_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                graduateNumber, graduate.department, graduate.believer_type, graduate.education_type, graduate.year,
                graduate.name, graduate.gender, graduate.marital_status, graduate.birth_date,
                graduate.address, graduate.phone, graduate.teacher, graduate.register_date,
                graduate.education_start_date, educationEndDate2025, graduate.affiliation_org,
                graduate.belong, graduate.new_life_strategy_date, graduate.identity_verified,
                graduate.prev_church, graduate.comment, graduate.id
            ]);
        }

        // 전입신자 수료자 데이터를 new_comers_graduates에 삽입
        for (let i = 0; i < transferGraduates.length; i++) {
            const graduate = transferGraduates[i];
            // 전입신자 수료자는 25-001부터 시작
            const graduateNumber = `25-${(i + 1).toString().padStart(3, '0')}`;
            
            // 수료일자를 2025년으로 수정
            const educationEndDate2025 = graduate.education_end_date.replace(/^\d{4}/, '2025');
            
            await conn.query(`
                INSERT INTO new_comers_graduates (
                    graduate_number, department, believer_type, education_type, year, name, gender, marital_status,
                    birth_date, address, phone, teacher, register_date, education_start_date,
                    education_end_date, affiliation_org, belong, new_life_strategy_date,
                    identity_verified, prev_church, comment, new_comer_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                graduateNumber, graduate.department, graduate.believer_type, graduate.education_type, graduate.year,
                graduate.name, graduate.gender, graduate.marital_status, graduate.birth_date,
                graduate.address, graduate.phone, graduate.teacher, graduate.register_date,
                graduate.education_start_date, educationEndDate2025, graduate.affiliation_org,
                graduate.belong, graduate.new_life_strategy_date, graduate.identity_verified,
                graduate.prev_church, graduate.comment, graduate.id
            ]);
        }

        console.log('✅ 수료자 데이터 추가 완료!');
        console.log(`- 초신자 수료자: ${newComerGraduates.length}명`);
        console.log(`- 전입신자 수료자: ${transferGraduates.length}명`);

        // new_comers_education 테이블에 교육 데이터 생성
        console.log('\n=== new_comers_education 테이블에 교육 데이터 생성 중... ===');
        
        // 테이블 구조 확인
        try {
            const tableStructure = await conn.query("DESCRIBE new_comers_education");
            console.log('new_comers_education 테이블 구조:', tableStructure.map(col => col.Field).join(', '));
        } catch (err) {
            console.log('new_comers_education 테이블이 존재하지 않거나 접근할 수 없습니다:', err.message);
        }

        // 모든 초신자와 전입신자 데이터 가져오기
        const allNewComers = await conn.query(`
            SELECT id, name, believer_type, education_type, register_date, education_start_date, education_end_date, teacher
            FROM new_comers 
            WHERE year = '2025'
            ORDER BY believer_type, id
        `);

        console.log(`총 ${allNewComers.length}명의 교육 데이터를 생성합니다.`);

        // new_comers_education 테이블에 데이터 삽입
        for (const newComer of allNewComers) {
            try {
                // 교육 시작일자와 종료일자를 기반으로 주차별 교육일자 생성
                const startDate = new Date(newComer.education_start_date);
                const endDate = new Date(newComer.education_end_date);
                
                // 초신자는 8주, 전입신자는 4주
                const totalWeeks = newComer.believer_type === '초신자' ? 8 : 4;
                
                // 교육중인 경우 해당 주차까지만 데이터 생성
                let maxWeeks = totalWeeks;
                if (newComer.education_type !== '수료') {
                    // 교육중인 경우: 초신자는 7주차까지만, 전입신자는 3주차까지만 생성
                    // (초신자 8주차, 전입신자 4주차는 작성하지 않음)
                    maxWeeks = totalWeeks - 1;
                    console.log(`교육중 - ID: ${newComer.id}, ${newComer.believer_type}, education_type: ${newComer.education_type}, maxWeeks: ${maxWeeks}`);
                } else {
                    console.log(`수료 - ID: ${newComer.id}, ${newComer.believer_type}, education_type: ${newComer.education_type}, maxWeeks: ${maxWeeks}`);
                }
                
                // 주차별 교육일자 생성 (매주 일요일)
                const weekDates = [];
                for (let week = 1; week <= maxWeeks; week++) {
                    const weekDate = new Date(startDate);
                    weekDate.setDate(weekDate.getDate() + (week - 1) * 7);
                    
                    // 일요일로 조정
                    const dayOfWeek = weekDate.getDay();
                    const daysUntilSunday = (7 - dayOfWeek) % 7;
                    weekDate.setDate(weekDate.getDate() + daysUntilSunday);
                    
                    weekDates.push(weekDate.toISOString().split('T')[0]);
                }
                
                // 8주차까지의 날짜 배열 생성 (교육중인 경우 maxWeeks까지만)
                const week1Date = weekDates[0] || null;
                const week2Date = weekDates[1] || null;
                const week3Date = weekDates[2] || null;
                const week4Date = weekDates[3] || null;
                const week5Date = maxWeeks >= 5 ? weekDates[4] || null : null;
                const week6Date = maxWeeks >= 6 ? weekDates[5] || null : null;
                const week7Date = maxWeeks >= 7 ? weekDates[6] || null : null;
                const week8Date = maxWeeks >= 8 ? weekDates[7] || null : null;
                
                await conn.query(`
                    INSERT INTO new_comers_education (
                        new_comer_id, week1_date, week2_date, week3_date, week4_date,
                        week5_date, week6_date, week7_date, week8_date,
                        week1_comment, week2_comment, week3_comment, week4_comment,
                        week5_comment, week6_comment, week7_comment, week8_comment,
                        overall_comment, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    newComer.id,
                    week1Date, week2Date, week3Date, week4Date,
                    week5Date, week6Date, week7Date, week8Date,
                    maxWeeks >= 1 ? `${newComer.believer_type} 1주차 교육` : null,
                    maxWeeks >= 2 ? `${newComer.believer_type} 2주차 교육` : null,
                    maxWeeks >= 3 ? `${newComer.believer_type} 3주차 교육` : null,
                    maxWeeks >= 4 ? `${newComer.believer_type} 4주차 교육` : null,
                    maxWeeks >= 5 ? `${newComer.believer_type} 5주차 교육` : null,
                    maxWeeks >= 6 ? `${newComer.believer_type} 6주차 교육` : null,
                    maxWeeks >= 7 ? `${newComer.believer_type} 7주차 교육` : null,
                    maxWeeks >= 8 ? `${newComer.believer_type} 8주차 교육` : null,
                    newComer.education_type === '수료' ? `${newComer.believer_type} 전체 교육 완료` : `${newComer.believer_type} 교육 진행중`
                ]);
            } catch (err) {
                console.log(`교육 데이터 삽입 실패 (ID: ${newComer.id}):`, err.message);
            }
        }

        console.log('✅ new_comers_education 테이블 데이터 생성 완료!');

        // 최종 통계 출력
        const totalNewComers = await conn.query("SELECT COUNT(*) as count FROM new_comers WHERE year = '2025'");
        const totalGraduates = await conn.query("SELECT COUNT(*) as count FROM new_comers_graduates WHERE year = '2025'");
        
        // new_comers_education 테이블 통계
        let totalEducation = 0;
        try {
            const educationCount = await conn.query("SELECT COUNT(*) as count FROM new_comers_education");
            totalEducation = educationCount[0].count;
        } catch (err) {
            console.log('new_comers_education 테이블 통계 조회 실패:', err.message);
        }
        
        console.log('\n=== 최종 통계 ===');
        console.log(`2025년 등록 총 인원: ${totalNewComers[0].count}명`);
        console.log(`2025년 수료 총 인원: ${totalGraduates[0].count}명`);
        console.log(`2025년 교육 데이터: ${totalEducation}명`);

    } catch (err) {
        console.error('❌ 오류 발생:', err);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

generateNewComersData();
