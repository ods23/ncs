const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// 대시보드 통계 조회 (현재년도 새가족위원회)
router.get('/stats', authenticateToken, async (req, res) => {
  let conn;
  try {
    const currentYear = new Date().getFullYear();
    
    conn = await pool.getConnection();
    
    // 1. 월별 등록자 현황 (초신자/전입신자)
    const monthlyRegistrationQuery = `
      SELECT 
        MONTH(register_date) as month,
        believer_type,
        COUNT(*) as count
      FROM new_comers 
      WHERE YEAR(register_date) = ? 
        AND department = '새가족위원회'
      GROUP BY MONTH(register_date), believer_type
      ORDER BY MONTH(register_date) ASC
    `;
    
    const monthlyRegistrationResults = await conn.query(monthlyRegistrationQuery, [currentYear]);
    
    // 2. 월별 수료자 현황 (초신자/전입신자)
    const monthlyGraduateQuery = `
      SELECT 
        MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')) as month,
        believer_type,
        COUNT(*) as count
      FROM new_comers_graduates 
      WHERE YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND education_type = '수료'
      GROUP BY MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')), believer_type
      ORDER BY MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')) ASC
    `;
    
    const monthlyGraduateResults = await conn.query(monthlyGraduateQuery, [currentYear]);
    
    // 3. 일별 등록자 현황 (초신자/전입신자) - 현재년도
    const dailyRegistrationQuery = `
      SELECT 
        MONTH(register_date) as month,
        DAY(register_date) as day,
        register_date,
        believer_type,
        COUNT(*) as count
      FROM new_comers 
      WHERE YEAR(register_date) = ? 
        AND department = '새가족위원회'
      GROUP BY MONTH(register_date), DAY(register_date), believer_type
      ORDER BY MONTH(register_date) ASC, DAY(register_date) ASC
    `;
    
    const dailyRegistrationResults = await conn.query(dailyRegistrationQuery, [currentYear]);
    
    // 4. 일별 수료자 현황 (초신자/전입신자) - 현재년도
    const dailyGraduateQuery = `
      SELECT 
        MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')) as month,
        DAY(STR_TO_DATE(education_end_date, '%Y-%m-%d')) as day,
        STR_TO_DATE(education_end_date, '%Y-%m-%d') as graduate_date,
        believer_type,
        COUNT(*) as count
      FROM new_comers_graduates 
      WHERE YEAR(STR_TO_DATE(education_end_date, '%Y-%m-%d')) = ? 
        AND education_type = '수료'
      GROUP BY MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')), DAY(STR_TO_DATE(education_end_date, '%Y-%m-%d')), believer_type
      ORDER BY MONTH(STR_TO_DATE(education_end_date, '%Y-%m-%d')) ASC, DAY(STR_TO_DATE(education_end_date, '%Y-%m-%d')) ASC
    `;
    
    const dailyGraduateResults = await conn.query(dailyGraduateQuery, [currentYear]);
    
    // 데이터 가공
    const monthlyData = {};
    const dailyData = {};
    
    // 1-12월 초기화
    for (let month = 1; month <= 12; month++) {
      monthlyData[month] = {
        newComerRegistration: 0,
        transferBelieverRegistration: 0,
        newComerGraduate: 0,
        transferBelieverGraduate: 0
      };
    }
    
    // 일별 데이터 초기화 (월별로 그룹화)
    for (let month = 1; month <= 12; month++) {
      dailyData[month] = {};
    }
    
    // 등록자 데이터 처리
    monthlyRegistrationResults.forEach(row => {
      const month = parseInt(row.month);
      if (row.believer_type === '초신자') {
        monthlyData[month].newComerRegistration = parseInt(row.count);
      } else if (row.believer_type === '전입신자') {
        monthlyData[month].transferBelieverRegistration = parseInt(row.count);
      }
    });
    
    // 수료자 데이터 처리
    monthlyGraduateResults.forEach(row => {
      const month = parseInt(row.month);
      if (row.believer_type === '초신자') {
        monthlyData[month].newComerGraduate = parseInt(row.count);
      } else if (row.believer_type === '전입신자') {
        monthlyData[month].transferBelieverGraduate = parseInt(row.count);
      }
    });
    
    // 일별 등록자 데이터 처리
    dailyRegistrationResults.forEach(row => {
      const month = parseInt(row.month);
      const day = parseInt(row.day);
      const dateKey = `${month}/${day}`;
      
      if (!dailyData[month][dateKey]) {
        dailyData[month][dateKey] = {
          newComerRegistration: 0,
          transferBelieverRegistration: 0,
          newComerGraduate: 0,
          transferBelieverGraduate: 0,
          date: row.register_date
        };
      }
      
      if (row.believer_type === '초신자') {
        dailyData[month][dateKey].newComerRegistration = parseInt(row.count);
      } else if (row.believer_type === '전입신자') {
        dailyData[month][dateKey].transferBelieverRegistration = parseInt(row.count);
      }
    });
    
    // 일별 수료자 데이터 처리
    dailyGraduateResults.forEach(row => {
      const month = parseInt(row.month);
      const day = parseInt(row.day);
      const dateKey = `${month}/${day}`;
      
      if (!dailyData[month][dateKey]) {
        dailyData[month][dateKey] = {
          newComerRegistration: 0,
          transferBelieverRegistration: 0,
          newComerGraduate: 0,
          transferBelieverGraduate: 0,
          date: row.graduate_date
        };
      }
      
      if (row.believer_type === '초신자') {
        dailyData[month][dateKey].newComerGraduate = parseInt(row.count);
      } else if (row.believer_type === '전입신자') {
        dailyData[month][dateKey].transferBelieverGraduate = parseInt(row.count);
      }
    });
    
    // 차트용 데이터 변환
    const chartData = Object.keys(monthlyData).map(month => ({
      month: parseInt(month),
      monthName: `${month}월`,
      newComerRegistration: monthlyData[month].newComerRegistration,
      transferBelieverRegistration: monthlyData[month].transferBelieverRegistration,
      newComerGraduate: monthlyData[month].newComerGraduate,
      transferBelieverGraduate: monthlyData[month].transferBelieverGraduate
    }));
    
    // 일별 차트용 데이터 변환 (1~12월 모든 데이터를 하나의 배열로)
    const dailyChartData = [];
    
    // 1~12월 모든 일별 데이터를 하나의 배열로 정리
    for (let month = 1; month <= 12; month++) {
      const monthData = dailyData[month];
      const monthChartData = Object.keys(monthData)
        .filter(dateKey => {
          const dayData = monthData[dateKey];
          return dayData.newComerRegistration > 0 || 
                 dayData.transferBelieverRegistration > 0 || 
                 dayData.newComerGraduate > 0 || 
                 dayData.transferBelieverGraduate > 0;
        })
        .map(dateKey => {
          const dayData = monthData[dateKey];
          return {
            month: month,
            date: dateKey,
            dateValue: dayData.date,
            newComerRegistration: dayData.newComerRegistration,
            transferBelieverRegistration: dayData.transferBelieverRegistration,
            newComerGraduate: dayData.newComerGraduate,
            transferBelieverGraduate: dayData.transferBelieverGraduate
          };
        })
        .sort((a, b) => {
          // 날짜순으로 정렬
          const [monthA, dayA] = a.date.split('/').map(Number);
          const [monthB, dayB] = b.date.split('/').map(Number);
          if (monthA !== monthB) return monthA - monthB;
          return dayA - dayB;
        });
      
      dailyChartData.push(...monthChartData);
    }
    
    // 전체 데이터를 날짜순으로 정렬
    dailyChartData.sort((a, b) => {
      const [monthA, dayA] = a.date.split('/').map(Number);
      const [monthB, dayB] = b.date.split('/').map(Number);
      if (monthA !== monthB) return monthA - monthB;
      return dayA - dayB;
    });
    
    // 총계 계산
    const totals = {
      totalNewComerRegistration: chartData.reduce((sum, item) => sum + item.newComerRegistration, 0),
      totalTransferBelieverRegistration: chartData.reduce((sum, item) => sum + item.transferBelieverRegistration, 0),
      totalNewComerGraduate: chartData.reduce((sum, item) => sum + item.newComerGraduate, 0),
      totalTransferBelieverGraduate: chartData.reduce((sum, item) => sum + item.transferBelieverGraduate, 0)
    };
    
    totals.totalRegistration = totals.totalNewComerRegistration + totals.totalTransferBelieverRegistration;
    totals.totalGraduate = totals.totalNewComerGraduate + totals.totalTransferBelieverGraduate;
    
    res.json({
      year: currentYear,
      chartData,
      dailyChartData,
      totals
    });
    
  } catch (error) {
    console.error('대시보드 통계 조회 실패:', error);
    res.status(500).json({ error: '대시보드 통계를 가져오는 중 오류가 발생했습니다.' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
