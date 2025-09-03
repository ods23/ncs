const fetch = require('node-fetch');

async function testMonthlyAgeAPI() {
  try {
    console.log('=== 월별/연령대별 통계 API 테스트 시작 ===');
    
    // 테스트할 URL
    const url = 'http://localhost:3000/api/statistics/monthly-age?year=2025&department=새가족위원회';
    console.log('테스트 URL:', url);
    
    // API 호출
    const response = await fetch(url);
    console.log('응답 상태:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('=== API 응답 데이터 ===');
      console.log('데이터 타입:', typeof data);
      console.log('데이터 키들:', Object.keys(data));
      console.log('7월 데이터:', data[7]);
      console.log('8월 데이터:', data[8]);
      console.log('전체 데이터 구조:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.error('API 오류:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
  }
}

// 테스트 실행
testMonthlyAgeAPI();
