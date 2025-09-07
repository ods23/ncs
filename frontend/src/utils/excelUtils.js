/**
 * 엑셀 날짜 변환 유틸리티 (프론트엔드용)
 * 엑셀에서 날짜는 1900년 1월 1일을 기준으로 한 시리얼 번호로 저장됩니다.
 */

/**
 * 엑셀 시리얼 번호를 JavaScript Date 객체로 변환
 * @param {number} serial - 엑셀 시리얼 번호
 * @returns {Date|null} - 변환된 Date 객체 또는 null
 */
export function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  
  // 엑셀의 1900년 1월 1일을 기준으로 계산
  // 엑셀에는 1900년을 윤년으로 잘못 처리하는 버그가 있어서 보정이 필요
  const excelEpoch = new Date(1899, 11, 30); // 1899년 12월 30일
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  
  return new Date(excelEpoch.getTime() + (serial * millisecondsPerDay));
}

/**
 * 엑셀 시리얼 번호를 YYYY-MM-DD 형식의 문자열로 변환
 * @param {number} serial - 엑셀 시리얼 번호
 * @returns {string|null} - YYYY-MM-DD 형식 문자열 또는 null
 */
export function excelSerialToDateString(serial) {
  const date = excelSerialToDate(serial);
  if (!date) return null;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 값이 엑셀 날짜 시리얼 번호인지 확인
 * @param {any} value - 확인할 값
 * @returns {boolean} - 엑셀 날짜 시리얼 번호 여부
 */
export function isExcelDateSerial(value) {
  // 숫자이고, 1900년 이후의 합리적인 범위 내에 있는지 확인
  // 1 (1900-01-01)부터 80000 (2119년 정도)까지를 날짜로 간주
  return typeof value === 'number' && value >= 1 && value <= 80000;
}

/**
 * 날짜 필드를 자동으로 변환하는 함수
 * @param {any} value - 변환할 값
 * @returns {string|any} - 변환된 날짜 문자열 또는 원본 값
 */
export function convertDateField(value) {
  // 값이 없거나 null인 경우
  if (!value && value !== 0) return value;
  
  // Date 객체인 경우 (XLSX cellDates 옵션으로 파싱된 경우)
  if (value instanceof Date && !isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 엑셀 시리얼 번호인 경우
  if (isExcelDateSerial(value)) {
    return excelSerialToDateString(value);
  }
  
  // 문자열 형태의 날짜 처리
  if (typeof value === 'string' && value.trim()) {
    const trimmedValue = value.trim();
    
    // 이미 YYYY-MM-DD 형식인 경우 검증 후 반환
    if (trimmedValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(trimmedValue);
      if (!isNaN(date.getTime())) {
        return trimmedValue;
      }
    }
    
    // YYYY/MM/DD, YYYY.MM.DD, YYYY-MM-DD 등 다양한 형식 처리
    const datePatterns = [
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/,                // YYYY-MM-DD (하이픈으로 구분, 한자리 허용)
      /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/,              // YYYY.MM.DD (점으로 구분, 한자리 허용)
      /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/,              // YYYY/MM/DD (슬래시로 구분, 한자리 허용)
      /^(\d{4})(\d{2})(\d{2})$/,                       // YYYYMMDD
      /^(\d{2})(\d{2})(\d{2})$/,                       // YYMMDD (2자리 년도)
      /^(\d{6})$/,                                     // YYMMDD (6자리 숫자)
      /^(\d{8})$/,                                     // YYYYMMDD (8자리 숫자)
      /^(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일$/,       // YYYY년 MM월 DD일
      /^(\d{1,2})월\s*(\d{1,2})일\s*(\d{4})년$/,       // MM월 DD일 YYYY년
      /^(\d{4})-(\d{1,2})-(\d{1,2})\s+\d{1,2}:\d{2}:\d{2}$/,  // YYYY-MM-DD HH:MM:SS
      /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,              // MM.DD.YYYY (점으로 구분)
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,              // MM/DD/YYYY (슬래시로 구분)
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/,                // MM-DD-YYYY (하이픈으로 구분)
      /^(\d{4})-(\d{2})-(\d{2})$/,                    // YYYY-MM-DD (2자리 고정)
      /^(\d{4})\.(\d{2})\.(\d{2})$/,                  // YYYY.MM.DD (2자리 고정)
      /^(\d{4})\/(\d{2})\/(\d{2})$/,                  // YYYY/MM/DD (2자리 고정)
      /^(\d{6})-01-01$/,                               // YYMMDD-01-01 (XLSX가 잘못 파싱한 형식)
      /^(\d{8})-01-01$/                                // YYYYMMDD-01-01 (XLSX가 잘못 파싱한 형식)
    ];
    
    for (let i = 0; i < datePatterns.length; i++) {
      const match = trimmedValue.match(datePatterns[i]);
      if (match) {
        let year, month, day;
        
        if (i === 0) { // YYYY-MM-DD (하이픈으로 구분, 한자리 허용)
          [, year, month, day] = match;
        } else if (i === 1) { // YYYY.MM.DD (점으로 구분, 한자리 허용)
          [, year, month, day] = match;
        } else if (i === 2) { // YYYY/MM/DD (슬래시로 구분, 한자리 허용)
          [, year, month, day] = match;
        } else if (i === 3) { // YYYYMMDD 형식
          [, year, month, day] = match;
        } else if (i === 4) { // YYMMDD 형식 (2자리 년도)
          [, year, month, day] = match;
          // 2자리 년도를 4자리로 변환 (00-30은 2000년대, 31-99는 1900년대)
          const fullYear = parseInt(year);
          year = fullYear <= 30 ? `20${year.padStart(2, '0')}` : `19${year.padStart(2, '0')}`;
        } else if (i === 5) { // YYMMDD (6자리 숫자)
          const fullValue = match[1];
          year = fullValue.substring(0, 2);
          month = fullValue.substring(2, 4);
          day = fullValue.substring(4, 6);
          // 2자리 년도를 4자리로 변환
          const fullYear = parseInt(year);
          year = fullYear <= 30 ? `20${year.padStart(2, '0')}` : `19${year.padStart(2, '0')}`;
        } else if (i === 6) { // YYYYMMDD (8자리 숫자)
          const fullValue = match[1];
          year = fullValue.substring(0, 4);
          month = fullValue.substring(4, 6);
          day = fullValue.substring(6, 8);
        } else if (i === 7) { // YYYY년 MM월 DD일
          [, year, month, day] = match;
        } else if (i === 8) { // MM월 DD일 YYYY년
          [, month, day, year] = match;
        } else if (i === 9) { // YYYY-MM-DD HH:MM:SS
          [, year, month, day] = match;
        } else if (i === 10) { // MM.DD.YYYY (점으로 구분)
          [, month, day, year] = match;
        } else if (i === 11) { // MM/DD/YYYY (슬래시로 구분)
          [, month, day, year] = match;
        } else if (i === 12) { // MM-DD-YYYY (하이픈으로 구분)
          [, month, day, year] = match;
        } else if (i === 13) { // YYYY-MM-DD (2자리 고정)
          [, year, month, day] = match;
        } else if (i === 14) { // YYYY.MM.DD (2자리 고정)
          [, year, month, day] = match;
        } else if (i === 15) { // YYYY/MM/DD (2자리 고정)
          [, year, month, day] = match;
        } else if (i === 16) { // YYMMDD-01-01 (XLSX가 잘못 파싱한 형식)
          const fullValue = match[1];
          year = fullValue.substring(0, 2);
          month = fullValue.substring(2, 4);
          day = fullValue.substring(4, 6);
          // 2자리 년도를 4자리로 변환
          const fullYear = parseInt(year);
          year = fullYear <= 30 ? `20${year.padStart(2, '0')}` : `19${year.padStart(2, '0')}`;
        } else if (i === 17) { // YYYYMMDD-01-01 (XLSX가 잘못 파싱한 형식)
          const fullValue = match[1];
          year = fullValue.substring(0, 4);
          month = fullValue.substring(4, 6);
          day = fullValue.substring(6, 8);
        }
        
        // 날짜 유효성 검증
        const parsedDate = new Date(year, month - 1, day);
        if (parsedDate.getFullYear() == year && 
            parsedDate.getMonth() == month - 1 && 
            parsedDate.getDate() == day) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
    }
    
    // JavaScript Date 생성자로 파싱 시도
    const parsedDate = new Date(trimmedValue);
    if (!isNaN(parsedDate.getTime())) {
      const year = parsedDate.getFullYear();
      const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
      const day = String(parsedDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  
  return value;
}

/**
 * 엑셀 데이터의 날짜 필드들을 일괄 변환
 * @param {Object} rowData - 엑셀에서 파싱된 행 데이터
 * @param {Array} dateFields - 날짜 필드명 배열
 * @returns {Object} - 날짜가 변환된 행 데이터
 */
export function convertExcelDates(rowData, dateFields = []) {
  const converted = { ...rowData };
  
  dateFields.forEach(field => {
    if (converted[field] !== undefined && converted[field] !== null) {
      converted[field] = convertDateField(converted[field]);
    }
  });
  
  return converted;
}
