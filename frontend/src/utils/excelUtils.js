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
      /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/,  // YYYY/MM/DD, YYYY-MM-DD, YYYY.MM.DD
      /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,  // MM/DD/YYYY, DD/MM/YYYY
      /^(\d{4})(\d{2})(\d{2})$/                        // YYYYMMDD
    ];
    
    for (let i = 0; i < datePatterns.length; i++) {
      const match = trimmedValue.match(datePatterns[i]);
      if (match) {
        let year, month, day;
        
        if (i === 0 || i === 2) { // YYYY/MM/DD 또는 YYYYMMDD 형식
          [, year, month, day] = match;
        } else { // MM/DD/YYYY 형식 (일반적으로 미국식)
          [, month, day, year] = match;
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
