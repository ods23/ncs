import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  CheckCircle as CheckCircleIcon,
  AutoAwesome as AutoAwesomeIcon,
  PictureAsPdf as PictureAsPdfIcon,
  AspectRatio as AspectRatioIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStat, setEditingStat] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [yearRange, setYearRange] = useState(7); // 년도 범위 (기본 7년)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [departments, setDepartments] = useState([]);
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [pdfOrientation, setPdfOrientation] = useState('portrait'); // 'portrait' or 'landscape'
  
  const [formData, setFormData] = useState({
    year: '',
    new_comer_registration: 0,
    transfer_believer_registration: 0,
    total_registration: 0,
    new_comer_graduate_prev_year: 0,
    new_comer_graduate_current_year: 0,
    new_comer_graduate_total: 0,
    transfer_believer_graduate_prev_year: 0,
    transfer_believer_graduate_current_year: 0,
    transfer_believer_graduate_total: 0,
    total_graduate: 0,
    new_comer_education_in_progress: 0,
    new_comer_education_discontinued: 0,
    new_comer_education_total: 0,
    transfer_believer_education_in_progress: 0,
    transfer_believer_education_discontinued: 0,
    transfer_believer_education_total: 0,
    total_education: 0
  });

  // URL 파라미터 읽기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const year = urlParams.get('year');
    const department = urlParams.get('department');
    const yearRange = urlParams.get('yearRange');
    const orientation = urlParams.get('orientation');
    const token = urlParams.get('token');

    if (year) setSelectedYear(year);
    if (department) setSelectedDepartment(department);
    if (yearRange) setYearRange(parseInt(yearRange));
    

    // JWT 토큰이 URL 파라미터로 전달된 경우 localStorage에 설정 (새로고침 없이)
    if (token) {
      localStorage.setItem('token', token);
      console.log('URL 파라미터에서 토큰 설정 완료');
      // 새로고침하지 않고 현재 상태 유지
    }
  }, []);


  // 부서 목록 로드
  const loadDepartments = async () => {
    try {
      // 먼저 부서 그룹 ID를 찾기
      const groupsResponse = await fetch('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        const departmentGroup = groupsData.find(group => 
          group.group_code === 'DEPARTMENT' || 
          group.group_name === '부서' || 
          group.group_code === '부서'
        );
        
        if (departmentGroup) {
          // 부서 그룹의 상세 코드 가져오기
          const detailsResponse = await fetch(`/api/code-details?group_id=${departmentGroup.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            setDepartments(detailsData);
            
            // 첫 번째 부서를 기본값으로 설정
            if (detailsData.length > 0 && !selectedDepartment) {
              setSelectedDepartment(detailsData[0].code_name);
            }
          } else {
            console.error('부서 상세 코드 로드 실패');
          }
        } else {
          console.error('부서 그룹을 찾을 수 없습니다');
        }
      } else {
        console.error('코드 그룹 로드 실패');
      }
    } catch (error) {
      console.error('부서 목록 로드 실패:', error);
    }
  };

  // 통계 데이터 로드
  const loadStatistics = async () => {
    setLoading(true);
    try {
      let url = '/api/statistics';
      const params = new URLSearchParams();
      
      if (selectedYear) {
        params.append('year', selectedYear);
      }
      if (selectedDepartment) {
        params.append('department', selectedDepartment);
      }
      if (yearRange) {
        params.append('yearRange', yearRange);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      } else {
        throw new Error('통계 데이터를 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 로드 실패:', error);
      showSnackbar('통계 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 통계 생성 확인 팝업 열기
  const handleGenerateClick = () => {
    // 조회조건 검증
    if (!selectedYear || selectedYear.trim() === '') {
      showSnackbar('년도를 선택해주세요.', 'error');
      return;
    }
    
    if (!selectedDepartment || selectedDepartment.trim() === '') {
      showSnackbar('부서를 선택해주세요.', 'error');
      return;
    }

    const year = parseInt(selectedYear);
      
      // 년도 유효성 검증 (2000년 이후부터 생성 가능)
    if (year < 2000 || year > 2100) {
        showSnackbar('2000년부터 2100년까지 통계를 생성할 수 있습니다.', 'error');
        return;
      }

    // 확인 팝업 표시
    setGenerateConfirmOpen(true);
  };

  // 통계 자동 생성
  const generateStatistics = async () => {
    try {
      showSnackbar('통계 생성 중...', 'info');
      
      const response = await fetch('/api/statistics/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          year: parseInt(selectedYear),
          department: selectedDepartment
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message, 'success');
        loadStatistics(); // 통계 데이터 새로고침
        fetchMonthlyAgeStats(parseInt(selectedYear)); // 월별/연령대별 통계도 새로고침
        setGenerateConfirmOpen(false); // 팝업 닫기
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || '통계 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 생성 실패:', error);
      showSnackbar(error.message || '통계 생성에 실패했습니다.', 'error');
    }
  };






  // 월별/연령대별 통계 데이터 가져오기
  const [monthlyAgeStats, setMonthlyAgeStats] = useState({});
  
  const fetchMonthlyAgeStats = async (year) => {
    try {
      console.log('=== 월별/연령대별 통계 조회 시작 ===');
      console.log('조회할 년도:', year);
      console.log('선택된 부서:', selectedDepartment);
      console.log('현재 localStorage 토큰:', localStorage.getItem('token') ? '있음' : '없음');
      

      const department = selectedDepartment || '새가족위원회';
      const url = `/api/statistics/monthly-age?year=${year}&department=${encodeURIComponent(department)}`;
      console.log('API URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('API 응답 상태:', response.status, response.statusText);
      console.log('API 응답 헤더:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('=== API 응답 데이터 ===');
        console.log('데이터 타입:', typeof data);
        console.log('데이터 키들:', Object.keys(data));
        console.log('7월 데이터:', data[7]);
        console.log('8월 데이터:', data[8]);
        console.log('전체 데이터 구조:', JSON.stringify(data, null, 2));
        
        console.log('=== 상태 업데이트 전 ===');
        console.log('현재 monthlyAgeStats:', monthlyAgeStats);
        
        setMonthlyAgeStats(data);
        
        console.log('=== 상태 업데이트 후 ===');
        console.log('새로 설정된 데이터:', data);
        console.log('monthlyAgeStats 상태 업데이트 완료');
      } else {
        const errorText = await response.text();
        console.error('=== API 오류 응답 ===');
        console.error('상태 코드:', response.status);
        console.error('오류 내용:', errorText);
        setMonthlyAgeStats({});
      }
    } catch (error) {
      console.error('=== API 호출 중 오류 발생 ===');
      console.error('오류 타입:', error.name);
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      setMonthlyAgeStats({});
    }
  };

  // 서버에서 이미 필터링된 데이터를 사용
  const getFilteredStatistics = () => {
    return statistics;
  };



  // 차트 데이터 준비 함수 - 서버에서 필터링된 데이터를 사용
  const prepareChartData = () => {
    if (!selectedYear || statistics.length === 0) {
      return [];
    }
    
    // 서버에서 이미 필터링된 데이터를 사용하여 차트 데이터 생성
    const chartData = [];
    
    // 통계 데이터를 년도 순으로 정렬
    const sortedStats = [...statistics].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    sortedStats.forEach(stat => {
      const yearStr = stat.year.toString();
      
        // 등록 합계 계산
      const registrationTotal = stat.total_registration || 0;
        
        // 수료 합계 계산
      const completionTotal = stat.total_graduate || 0;
        
        chartData.push({
          year: yearStr,
          등록자: registrationTotal,
          수료자: completionTotal
        });
    });
    
    return chartData;
  };

  // 월별 등록자 현황 데이터 준비
  const prepareMonthlyData = () => {
    if (!monthlyAgeStats || Object.keys(monthlyAgeStats).length === 0) {
      return [];
    }

    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthData = monthlyAgeStats[month];
      if (monthData) {
        const total = (monthData.초신자?.total || 0) + (monthData.전입신자?.total || 0);
        monthlyData.push({
          month: `${month}월`,
          value: total
        });
      } else {
        monthlyData.push({
          month: `${month}월`,
          value: 0
        });
      }
    }
    return monthlyData;
  };

  // 연령대별 비율 데이터 준비
  const prepareAgeGroupData = () => {
    if (!monthlyAgeStats || Object.keys(monthlyAgeStats).length === 0) {
      return [];
    }

    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    const ageGroupTotals = {};

    // 각 연령대별 총합 계산
    ageGroups.forEach(ageGroup => {
      let total = 0;
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyAgeStats[month];
        if (monthData) {
          total += (monthData.초신자?.[ageGroup] || 0) + (monthData.전입신자?.[ageGroup] || 0);
        }
      }
      ageGroupTotals[ageGroup] = total;
    });

    // 전체 합계 계산
    const grandTotal = Object.values(ageGroupTotals).reduce((sum, count) => sum + count, 0);

    // 기준년도 가져오기 (selectedYear 또는 현재년도)
    const baseYear = selectedYear || new Date().getFullYear();

    // 비율 계산 및 데이터 생성
    const ageGroupLabels = {
      '10s': '10대',
      '20s': '20대', 
      '30s': '30대',
      '40s': '40대',
      '50s': '50대',
      '60s': '60대',
      '70s_plus': '70대 이상'
    };

    // 기준년도에 따른 출생년도 범위 계산
    const getBirthYearRange = (ageGroup, baseYear) => {
      switch (ageGroup) {
        case '10s':
          return `${baseYear - 19}~${baseYear - 10}`;
        case '20s':
          return `${baseYear - 29}~${baseYear - 20}`;
        case '30s':
          return `${baseYear - 39}~${baseYear - 30}`;
        case '40s':
          return `${baseYear - 49}~${baseYear - 40}`;
        case '50s':
          return `${baseYear - 59}~${baseYear - 50}`;
        case '60s':
          return `${baseYear - 69}~${baseYear - 60}`;
        case '70s_plus':
          return `~${baseYear - 70}`;
        default:
          return '';
      }
    };

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'];

    return ageGroups.map((ageGroup, index) => {
      const count = ageGroupTotals[ageGroup];
      const percentage = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
      const birthYearRange = getBirthYearRange(ageGroup, baseYear);
      
      return {
        name: `${ageGroupLabels[ageGroup]} (${birthYearRange})`,
        value: count,
        percentage: percentage,
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0); // 0인 항목은 제외
  };

  // 초신자 연령대별 비율 데이터 준비
  const prepareNewComerAgeGroupData = () => {
    if (!monthlyAgeStats || Object.keys(monthlyAgeStats).length === 0) {
      return [];
    }

    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    const ageGroupTotals = {};

    // 각 연령대별 초신자 총합 계산
    ageGroups.forEach(ageGroup => {
      let total = 0;
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyAgeStats[month];
        if (monthData) {
          total += (monthData.초신자?.[ageGroup] || 0);
        }
      }
      ageGroupTotals[ageGroup] = total;
    });

    // 초신자 전체 합계 계산
    const grandTotal = Object.values(ageGroupTotals).reduce((sum, count) => sum + count, 0);

    // 기준년도 가져오기 (selectedYear 또는 현재년도)
    const baseYear = selectedYear || new Date().getFullYear();

    // 비율 계산 및 데이터 생성
    const ageGroupLabels = {
      '10s': '10대',
      '20s': '20대', 
      '30s': '30대',
      '40s': '40대',
      '50s': '50대',
      '60s': '60대',
      '70s_plus': '70대 이상'
    };

    // 기준년도에 따른 출생년도 범위 계산
    const getBirthYearRange = (ageGroup, baseYear) => {
      switch (ageGroup) {
        case '10s':
          return `${baseYear - 19}~${baseYear - 10}`;
        case '20s':
          return `${baseYear - 29}~${baseYear - 20}`;
        case '30s':
          return `${baseYear - 39}~${baseYear - 30}`;
        case '40s':
          return `${baseYear - 49}~${baseYear - 40}`;
        case '50s':
          return `${baseYear - 59}~${baseYear - 50}`;
        case '60s':
          return `${baseYear - 69}~${baseYear - 60}`;
        case '70s_plus':
          return `~${baseYear - 70}`;
        default:
          return '';
      }
    };

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'];

    return ageGroups.map((ageGroup, index) => {
      const count = ageGroupTotals[ageGroup];
      const percentage = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
      const birthYearRange = getBirthYearRange(ageGroup, baseYear);
      
      return {
        name: `${ageGroupLabels[ageGroup]} (${birthYearRange})`,
        value: count,
        percentage: percentage,
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0); // 0인 항목은 제외
  };

  // 전입신자 연령대별 비율 데이터 준비
  const prepareTransferBelieverAgeGroupData = () => {
    if (!monthlyAgeStats || Object.keys(monthlyAgeStats).length === 0) {
      return [];
    }

    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    const ageGroupTotals = {};

    // 각 연령대별 전입신자 총합 계산
    ageGroups.forEach(ageGroup => {
      let total = 0;
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyAgeStats[month];
        if (monthData) {
          total += (monthData.전입신자?.[ageGroup] || 0);
        }
      }
      ageGroupTotals[ageGroup] = total;
    });

    // 전입신자 전체 합계 계산
    const grandTotal = Object.values(ageGroupTotals).reduce((sum, count) => sum + count, 0);

    // 기준년도 가져오기 (selectedYear 또는 현재년도)
    const baseYear = selectedYear || new Date().getFullYear();

    // 비율 계산 및 데이터 생성
    const ageGroupLabels = {
      '10s': '10대',
      '20s': '20대', 
      '30s': '30대',
      '40s': '40대',
      '50s': '50대',
      '60s': '60대',
      '70s_plus': '70대 이상'
    };

    // 기준년도에 따른 출생년도 범위 계산
    const getBirthYearRange = (ageGroup, baseYear) => {
      switch (ageGroup) {
        case '10s':
          return `${baseYear - 19}~${baseYear - 10}`;
        case '20s':
          return `${baseYear - 29}~${baseYear - 20}`;
        case '30s':
          return `${baseYear - 39}~${baseYear - 30}`;
        case '40s':
          return `${baseYear - 49}~${baseYear - 40}`;
        case '50s':
          return `${baseYear - 59}~${baseYear - 50}`;
        case '60s':
          return `${baseYear - 69}~${baseYear - 60}`;
        case '70s_plus':
          return `~${baseYear - 70}`;
        default:
          return '';
      }
    };

    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'];

    return ageGroups.map((ageGroup, index) => {
      const count = ageGroupTotals[ageGroup];
      const percentage = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
      const birthYearRange = getBirthYearRange(ageGroup, baseYear);
      
      return {
        name: `${ageGroupLabels[ageGroup]} (${birthYearRange})`,
        value: count,
        percentage: percentage,
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0); // 0인 항목은 제외
  };

  // 연령대별 막대 차트 데이터 준비
  const prepareAgeGroupBarData = () => {
    const baseYear = selectedYear || new Date().getFullYear();
    
    const ageGroupLabels = {
      '10s': '10대',
      '20s': '20대', 
      '30s': '30대',
      '40s': '40대',
      '50s': '50대',
      '60s': '60대',
      '70s_plus': '70대 이상'
    };

    const getBirthYearRange = (ageGroup, baseYear) => {
      switch (ageGroup) {
        case '10s':
          return `${baseYear - 19}~${baseYear - 10}`;
        case '20s':
          return `${baseYear - 29}~${baseYear - 20}`;
        case '30s':
          return `${baseYear - 39}~${baseYear - 30}`;
        case '40s':
          return `${baseYear - 49}~${baseYear - 40}`;
        case '50s':
          return `${baseYear - 59}~${baseYear - 50}`;
        case '60s':
          return `${baseYear - 69}~${baseYear - 60}`;
        case '70s_plus':
          return `~${baseYear - 70}`;
        default:
          return '';
      }
    };

    const colors = ['#3b82f6', '#10b981', '#6b7280', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

    return ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'].map((ageGroup, index) => ({
      key: ageGroup,
      name: `${ageGroupLabels[ageGroup]} (${getBirthYearRange(ageGroup, baseYear)})`,
      color: colors[index]
    }));
  };

  // 월별/연령대별 막대 차트 데이터 준비
  const prepareMonthlyAgeBarData = (startMonth, endMonth) => {
    if (!monthlyAgeStats || Object.keys(monthlyAgeStats).length === 0) {
      return [];
    }

    const ageGroups = ['10s', '20s', '30s', '40s', '50s', '60s', '70s_plus'];
    const chartData = [];

    for (let month = startMonth; month <= endMonth; month++) {
      const monthData = monthlyAgeStats[month];
      if (monthData) {
        // 각 월별로 연령대별 데이터를 그룹화
        const monthDataGroup = {
          monthGroup: `${month}월`,
          month: month
        };

        // 각 연령대별 총합 데이터 추가 (초신자 + 전입신자)
        ageGroups.forEach(ageGroup => {
          const newComerCount = monthData.초신자?.[ageGroup] || 0;
          const transferBelieverCount = monthData.전입신자?.[ageGroup] || 0;
          monthDataGroup[ageGroup] = newComerCount + transferBelieverCount;
        });

        chartData.push(monthDataGroup);
      }
    }

    return chartData;
  };

  // 통계 생성/수정
  const saveStatistics = async () => {
    try {
      const url = editingStat 
        ? `/api/statistics/${editingStat.year}`
        : '/api/statistics';
      
      const method = editingStat ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message, 'success');
        setOpenDialog(false);
        resetForm();
        loadStatistics();
      } else {
        throw new Error('통계 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 저장 실패:', error);
      showSnackbar('통계 저장에 실패했습니다.', 'error');
    }
  };

  // 통계 삭제
  const deleteStatistics = async (year) => {
    if (!window.confirm(`${year}년 통계를 삭제하시겠습니까?`)) return;
    
    try {
      const response = await fetch(`/api/statistics/${year}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message, 'success');
        loadStatistics();
      } else {
        throw new Error('통계 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 삭제 실패:', error);
      showSnackbar('통계 삭제에 실패했습니다.', 'error');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      year: '',
      new_comer_registration: 0,
      transfer_believer_registration: 0,
      total_registration: 0,
      new_comer_graduate_prev_year: 0,
      new_comer_graduate_current_year: 0,
      new_comer_graduate_total: 0,
      transfer_believer_graduate_prev_year: 0,
      transfer_believer_graduate_current_year: 0,
      transfer_believer_graduate_total: 0,
      total_graduate: 0,
      new_comer_education_in_progress: 0,
      new_comer_education_discontinued: 0,
      new_comer_education_total: 0,
      transfer_believer_education_in_progress: 0,
      transfer_believer_education_discontinued: 0,
      transfer_believer_education_total: 0,
      total_education: 0
    });
    setEditingStat(null);
  };

  // 편집 모드 열기
  const openEditDialog = (stat) => {
    setEditingStat(stat);
    setFormData(stat);
    setOpenDialog(true);
  };

  // 새 통계 추가 모드 열기
  const openAddDialog = () => {
    resetForm();
    // 현재 년도를 기본값으로 설정
    setFormData(prev => ({
      ...prev,
      year: new Date().getFullYear()
    }));
    setOpenDialog(true);
  };

  // 스낵바 표시
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // PDF 다운로드 함수
  const handleDownloadPdf = async () => {
    try {
      setLoading(true);
      
      // 스낵바 닫기 (PDF 캡처에 포함되지 않도록)
      setSnackbar({ open: false, message: '', severity: 'success' });

      const container = document.getElementById('statistics-container');
      if (!container) {
        throw new Error('통계 컨텐츠를 찾을 수 없습니다.');
      }

      // 차트가 완전히 렌더링될 때까지 대기
      // SVG 요소들이 모두 로드될 때까지 기다림
      const waitForCharts = () => {
        return new Promise((resolve) => {
          // 첫 번째 대기: 기본 렌더링 시간
          setTimeout(() => {
            // SVG 요소들이 모두 그려졌는지 확인
            const svgElements = container.querySelectorAll('svg');
            let allChartsReady = true;
            
            svgElements.forEach((svg) => {
              try {
                // SVG가 비어있거나 너무 작으면 아직 렌더링 중
                if (!svg.children.length) {
                  allChartsReady = false;
                } else {
                  const bbox = svg.getBBox();
                  if (bbox.width === 0 && bbox.height === 0) {
                    allChartsReady = false;
                  }
                }
              } catch (e) {
                // getBBox() 실패 시 자식 요소 확인
                if (!svg.children.length) {
                  allChartsReady = false;
                }
              }
            });
            
            if (allChartsReady && svgElements.length > 0) {
              // 추가 대기: 차트가 완전히 그려질 때까지
              setTimeout(resolve, 2000);
            } else {
              // 차트가 아직 준비되지 않았으면 더 기다림
              setTimeout(resolve, 3000);
            }
          }, 2000);
        });
      };

      await waitForCharts();

      const ageGroupSectionStart = document.getElementById('age-group-section-start');
      const ageGroupStatisticsSection = document.getElementById('age-group-statistics-section');
      const monthlyAgeStatisticsSection = document.getElementById('monthly-age-statistics-section');
      
      // PDF 방향에 따라 설정
      const orientation = pdfOrientation === 'landscape' ? 'l' : 'p';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const imgWidth = pdfOrientation === 'landscape' ? 297 : 210; // A4 가로/세로 너비 (mm)
      const pageHeight = pdfOrientation === 'landscape' ? 210 : 297; // A4 가로/세로 높이 (mm)
      const topMargin = 10; // 상단 여백 (mm)
      const sideMargin = 10; // 좌우 여백 (mm)

      // 전체 컨테이너를 캡처
      // 스크롤 위치를 맨 위로 이동하여 전체 컨텐츠가 보이도록 함
      const originalScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      window.scrollTo(0, 0);
      
      // 컨테이너가 화면에 보이도록 스크롤
      container.scrollIntoView({ behavior: 'instant', block: 'start' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight,
        allowTaint: false,
        removeContainer: false,
        onclone: (clonedDoc) => {
          // 복제된 문서에서 스낵바 제거
          const snackbar = clonedDoc.querySelector('[role="alert"]');
          if (snackbar) {
            snackbar.style.display = 'none';
          }
          
          // 합계 행의 텍스트 색상을 명시적으로 설정하여 PDF에서 보이도록 함
          const totalRows = clonedDoc.querySelectorAll('tr');
          totalRows.forEach((row) => {
            const cells = row.querySelectorAll('td');
            let isTotalRow = false;
            
            // 합계 행인지 확인 (첫 번째 셀이 "합계"인지 확인)
            const firstCell = cells[0];
            if (firstCell && firstCell.textContent?.trim() === '합계') {
              isTotalRow = true;
            }
            
            cells.forEach((cell) => {
              // computed style로 배경색 확인
              const computedStyle = clonedDoc.defaultView?.getComputedStyle(cell);
              const bgColor = computedStyle?.backgroundColor || cell.style.backgroundColor || '';
              
              // 합계 행이거나, 배경색이 합계 행 색상인 경우
              if (isTotalRow || cell.textContent?.trim() === '합계' || 
                  (bgColor && (
                    bgColor.includes('rgb(254, 243, 199)') || // #fef3c7
                    bgColor.includes('rgb(220, 252, 231)') || // #dcfce7
                    bgColor.includes('rgb(219, 234, 254)') || // #dbeafe
                    bgColor.includes('rgb(187, 247, 208)') || // #bbf7d0
                    bgColor.includes('rgb(254, 215, 170)') || // #fed7aa
                    bgColor.includes('rgb(232, 245, 232)') || // #e8f5e8
                    bgColor.includes('rgb(243, 229, 245)') || // #f3e5f5
                    bgColor.includes('fef3c7') ||
                    bgColor.includes('dcfce7') ||
                    bgColor.includes('dbeafe') ||
                    bgColor.includes('bbf7d0') ||
                    bgColor.includes('fed7aa') ||
                    bgColor.includes('e8f5e8') ||
                    bgColor.includes('f3e5f5')
                  ))) {
                // 강제로 검은색으로 설정
                cell.style.setProperty('color', '#000000', 'important');
                cell.style.setProperty('font-weight', 'bold', 'important');
                
                // Chip 컴포넌트 내부의 텍스트도 확인
                const chips = cell.querySelectorAll('[class*="MuiChip"]');
                chips.forEach((chip) => {
                  chip.style.setProperty('color', '#000000', 'important');
                  chip.style.setProperty('font-weight', 'bold', 'important');
                  // Chip 내부의 span도 확인
                  const chipSpans = chip.querySelectorAll('span');
                  chipSpans.forEach((span) => {
                    span.style.setProperty('color', '#000000', 'important');
                    span.style.setProperty('font-weight', 'bold', 'important');
                  });
                });
                
                // 모든 자식 요소의 색상도 검은색으로 설정
                const allChildren = cell.querySelectorAll('*');
                allChildren.forEach((child) => {
                  child.style.setProperty('color', '#000000', 'important');
                });
              }
            });
          });
        },
      });
      
      // 원래 스크롤 위치로 복원
      window.scrollTo(0, originalScrollTop);

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgHeightPx = canvas.height;
      const imgWidthPx = canvas.width;

      if (pdfOrientation === 'landscape') {
        // 가로 방향: 각 섹션을 개별적으로 캡처하여 지정된 페이지에 배치
        const containerRect = container.getBoundingClientRect();
        
        // 각 섹션을 개별적으로 캡처하는 함수
        const captureSection = async (sectionElement) => {
          if (!sectionElement) return null;
          
          // 섹션 요소를 직접 html2canvas로 캡처 (더 정확함)
          const sectionCanvas = await html2canvas(sectionElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: sectionElement.scrollWidth,
            windowHeight: sectionElement.scrollHeight,
            allowTaint: false,
            removeContainer: false,
            onclone: (clonedDoc) => {
              // 복제된 문서에서 스낵바 제거
              const snackbar = clonedDoc.querySelector('[role="alert"]');
              if (snackbar) {
                snackbar.style.display = 'none';
              }
              
              // 합계 행의 텍스트 색상을 명시적으로 설정
              const totalRows = clonedDoc.querySelectorAll('tr');
              totalRows.forEach((row) => {
                const cells = row.querySelectorAll('td');
                let isTotalRow = false;
                
                const firstCell = cells[0];
                if (firstCell && firstCell.textContent?.trim() === '합계') {
                  isTotalRow = true;
                }
                
                cells.forEach((cell) => {
                  const computedStyle = clonedDoc.defaultView?.getComputedStyle(cell);
                  const bgColor = computedStyle?.backgroundColor || cell.style.backgroundColor || '';
                  
                  if (isTotalRow || cell.textContent?.trim() === '합계' || 
                      (bgColor && (
                        bgColor.includes('rgb(254, 243, 199)') ||
                        bgColor.includes('rgb(220, 252, 231)') ||
                        bgColor.includes('rgb(219, 234, 254)') ||
                        bgColor.includes('rgb(187, 247, 208)') ||
                        bgColor.includes('rgb(254, 215, 170)') ||
                        bgColor.includes('rgb(232, 245, 232)') ||
                        bgColor.includes('rgb(243, 229, 245)') ||
                        bgColor.includes('fef3c7') ||
                        bgColor.includes('dcfce7') ||
                        bgColor.includes('dbeafe') ||
                        bgColor.includes('bbf7d0') ||
                        bgColor.includes('fed7aa') ||
                        bgColor.includes('e8f5e8') ||
                        bgColor.includes('f3e5f5')
                      ))) {
                    cell.style.setProperty('color', '#000000', 'important');
                    cell.style.setProperty('font-weight', 'bold', 'important');
                    
                    const chips = cell.querySelectorAll('[class*="MuiChip"]');
                    chips.forEach((chip) => {
                      chip.style.setProperty('color', '#000000', 'important');
                      chip.style.setProperty('font-weight', 'bold', 'important');
                      const chipSpans = chip.querySelectorAll('span');
                      chipSpans.forEach((span) => {
                        span.style.setProperty('color', '#000000', 'important');
                        span.style.setProperty('font-weight', 'bold', 'important');
                      });
                    });
                    
                    const allChildren = cell.querySelectorAll('*');
                    allChildren.forEach((child) => {
                      child.style.setProperty('color', '#000000', 'important');
                    });
                  }
                });
              });
            },
          });
          
          const sectionImgData = sectionCanvas.toDataURL('image/png');
          // 실제 캔버스 크기를 반환 (픽셀 단위)
          return { 
            imgData: sectionImgData, 
            originalWidth: sectionCanvas.width,
            originalHeight: sectionCanvas.height
          };
        };
        
        // 첫 번째 페이지: 새가족위원회 등록/수료/교육 현황 보고서, 등록자/수료자 현황, 등록현황보고
        const mainSection = document.getElementById('main-statistics-section');
        const annualSection = document.getElementById('annual-statistics-section');
        const monthlyReportSection = document.getElementById('monthly-registration-report-section');
        
        let mainSectionData = null;
        let annualSectionData = null;
        let monthlyReportData = null;
        
        // 첫 번째 페이지의 첫 번째 항목: 새가족위원회 등록/수료/교육 현황 보고서
        if (mainSection) {
          mainSectionData = await captureSection(mainSection);
        }
        
        // 첫 번째 페이지의 두 번째 항목: 등록자/수료자 현황
        if (annualSection) {
          annualSectionData = await captureSection(annualSection);
        }
        
        // 첫 번째 페이지의 세 번째 항목: 등록현황보고
        if (monthlyReportSection) {
          monthlyReportData = await captureSection(monthlyReportSection);
        }
        
        // 첫 번째 페이지: 세 섹션을 동일한 방식으로 계산하여 배치
        const availableWidth = imgWidth - sideMargin * 2;
        const availableHeight = pageHeight - topMargin * 2;
        const itemSpacing = 5; // 5mm 간격
        const maxItemHeight = (availableHeight - itemSpacing * 2) / 3; // 각 항목의 최대 높이 (3개 항목)
        
        let currentY = topMargin;
        
        // 첫 번째 섹션 배치
        if (mainSectionData && mainSectionData.imgData) {
          const mainAspectRatio = mainSectionData.originalWidth && mainSectionData.originalHeight 
            ? mainSectionData.originalWidth / mainSectionData.originalHeight 
            : 1.5;
          const mainScaledWidth = availableWidth;
          const mainScaledHeight = mainScaledWidth / mainAspectRatio;
          const mainFinalHeight = Math.min(mainScaledHeight, maxItemHeight);
          const mainFinalWidth = mainScaledWidth;
          
          pdf.addImage(mainSectionData.imgData, 'PNG', sideMargin, currentY, mainFinalWidth, mainFinalHeight);
          currentY += mainFinalHeight + itemSpacing;
        }
        
        // 두 번째 섹션 배치
        if (annualSectionData && annualSectionData.imgData) {
          const annualAspectRatio = annualSectionData.originalWidth && annualSectionData.originalHeight 
            ? annualSectionData.originalWidth / annualSectionData.originalHeight 
            : 1.5;
          const annualScaledWidth = availableWidth;
          const annualScaledHeight = annualScaledWidth / annualAspectRatio;
          const annualFinalHeight = Math.min(annualScaledHeight, maxItemHeight);
          const annualFinalWidth = annualScaledWidth;
          
          pdf.addImage(annualSectionData.imgData, 'PNG', sideMargin, currentY, annualFinalWidth, annualFinalHeight);
          currentY += annualFinalHeight + itemSpacing;
        }
        
        // 세 번째 섹션 배치
        if (monthlyReportData && monthlyReportData.imgData) {
          const monthlyAspectRatio = monthlyReportData.originalWidth && monthlyReportData.originalHeight 
            ? monthlyReportData.originalWidth / monthlyReportData.originalHeight 
            : 1.5;
          const monthlyScaledWidth = availableWidth;
          const monthlyScaledHeight = monthlyScaledWidth / monthlyAspectRatio;
          const monthlyFinalHeight = Math.min(monthlyScaledHeight, maxItemHeight);
          const monthlyFinalWidth = monthlyScaledWidth;
          
          pdf.addImage(monthlyReportData.imgData, 'PNG', sideMargin, currentY, monthlyFinalWidth, monthlyFinalHeight);
        }
        
        // 두 번째 페이지: 등록현황 분석, 연령대별 현황
        const registrationAnalysisSection = document.getElementById('registration-analysis-section');
        
        let registrationAnalysisData = null;
        let ageGroupData = null;
        
        // 두 번째 페이지의 첫 번째 항목: 등록현황 분석
        if (registrationAnalysisSection) {
          registrationAnalysisData = await captureSection(registrationAnalysisSection);
        }
        
        // 두 번째 페이지의 두 번째 항목: 연령대별 현황
        if (ageGroupStatisticsSection) {
          ageGroupData = await captureSection(ageGroupStatisticsSection);
        }
        
        // 두 번째 페이지: 두 섹션을 동일한 방식으로 계산하여 배치
        if (registrationAnalysisData && ageGroupData && registrationAnalysisData.imgData && ageGroupData.imgData) {
          pdf.addPage();
          
          const availableWidth = imgWidth - sideMargin * 2;
          const availableHeight = pageHeight - topMargin * 2;
          const itemSpacing = 5; // 5mm 간격
          const maxItemHeight = (availableHeight - itemSpacing) / 2; // 각 항목의 최대 높이
          
          // 첫 번째 섹션 크기 계산 (너비 기준, 높이 제한)
          const analysisAspectRatio = registrationAnalysisData.originalWidth && registrationAnalysisData.originalHeight 
            ? registrationAnalysisData.originalWidth / registrationAnalysisData.originalHeight 
            : 1.5; // 기본 비율
          const analysisScaledWidth = availableWidth;
          const analysisScaledHeight = analysisScaledWidth / analysisAspectRatio;
          const analysisFinalHeight = Math.min(analysisScaledHeight, maxItemHeight);
          const analysisFinalWidth = analysisScaledWidth; // 너비는 항상 availableWidth 사용
          
          // 두 번째 섹션 크기 계산 (너비 기준, 높이 제한)
          const ageGroupAspectRatio = ageGroupData.originalWidth && ageGroupData.originalHeight 
            ? ageGroupData.originalWidth / ageGroupData.originalHeight 
            : 1.5; // 기본 비율
          const ageGroupScaledWidth = availableWidth;
          const ageGroupScaledHeight = ageGroupScaledWidth / ageGroupAspectRatio;
          const ageGroupFinalHeight = Math.min(ageGroupScaledHeight, maxItemHeight);
          const ageGroupFinalWidth = ageGroupScaledWidth; // 너비는 항상 availableWidth 사용
          
          // 첫 번째 섹션 배치 (위쪽)
          pdf.addImage(registrationAnalysisData.imgData, 'PNG', sideMargin, topMargin, analysisFinalWidth, analysisFinalHeight);
          
          // 두 번째 섹션 배치 (아래쪽)
          const secondY = topMargin + analysisFinalHeight + itemSpacing;
          pdf.addImage(ageGroupData.imgData, 'PNG', sideMargin, secondY, ageGroupFinalWidth, ageGroupFinalHeight);
        } else if (registrationAnalysisData && registrationAnalysisData.imgData) {
          // 첫 번째 섹션만 있는 경우
          pdf.addPage();
          const availableWidth = imgWidth - sideMargin * 2;
          const availableHeight = pageHeight - topMargin * 2;
          const analysisAspectRatio = registrationAnalysisData.originalWidth && registrationAnalysisData.originalHeight 
            ? registrationAnalysisData.originalWidth / registrationAnalysisData.originalHeight 
            : 1.5;
          const analysisScaledWidth = availableWidth;
          const analysisScaledHeight = analysisScaledWidth / analysisAspectRatio;
          const analysisFinalHeight = Math.min(analysisScaledHeight, availableHeight);
          const analysisFinalWidth = analysisScaledWidth;
          pdf.addImage(registrationAnalysisData.imgData, 'PNG', sideMargin, topMargin, analysisFinalWidth, analysisFinalHeight);
        } else if (ageGroupData && ageGroupData.imgData) {
          // 두 번째 섹션만 있는 경우
          pdf.addPage();
          const availableWidth = imgWidth - sideMargin * 2;
          const availableHeight = pageHeight - topMargin * 2;
          const ageGroupAspectRatio = ageGroupData.originalWidth && ageGroupData.originalHeight 
            ? ageGroupData.originalWidth / ageGroupData.originalHeight 
            : 1.5;
          const ageGroupScaledWidth = availableWidth;
          const ageGroupScaledHeight = ageGroupScaledWidth / ageGroupAspectRatio;
          const ageGroupFinalHeight = Math.min(ageGroupScaledHeight, availableHeight);
          const ageGroupFinalWidth = ageGroupScaledWidth;
          pdf.addImage(ageGroupData.imgData, 'PNG', sideMargin, topMargin, ageGroupFinalWidth, ageGroupFinalHeight);
        }
        
        // 세 번째 페이지: 월별/연령대별 현황만 표시
        if (monthlyAgeStatisticsSection) {
          const sectionData = await captureSection(monthlyAgeStatisticsSection);
          if (sectionData && sectionData.imgData) {
            pdf.addPage();
            const availableWidth = imgWidth - sideMargin * 2;
            const availableHeight = pageHeight - topMargin * 2;
            const aspectRatio = sectionData.originalWidth && sectionData.originalHeight 
              ? sectionData.originalWidth / sectionData.originalHeight 
              : 1.5;
            const scaledWidth = availableWidth;
            const scaledHeight = scaledWidth / aspectRatio;
            const finalHeight = Math.min(scaledHeight, availableHeight);
            const finalWidth = scaledWidth;
            pdf.addImage(sectionData.imgData, 'PNG', sideMargin, topMargin, finalWidth, finalHeight);
          }
        }
        
        // 최소한 하나의 섹션이라도 추가되었는지 확인
        const hasContent = mainSectionData || monthlyReportData || registrationAnalysisData || ageGroupData;
        if (!hasContent) {
          throw new Error('PDF 생성할 콘텐츠가 없습니다. 통계 데이터를 확인해주세요.');
        }
      } else if (ageGroupSectionStart) {
        // 연령대별 현황 섹션의 위치 계산
        const containerRect = container.getBoundingClientRect();
        const sectionRect = ageGroupSectionStart.getBoundingClientRect();
        const relativeTop = sectionRect.top - containerRect.top + container.scrollTop;
        
        // 캔버스 좌표로 변환 (scale 고려)
        const splitPositionPx = Math.round((relativeTop * canvas.height) / container.scrollHeight);
        
        // 이미지를 두 부분으로 분리
        const img = new Image();
        img.src = imgData;
        
        await new Promise((resolve) => {
          img.onload = () => {
            // 첫 번째 부분 캔버스 생성
            const canvas1 = document.createElement('canvas');
            canvas1.width = imgWidthPx;
            canvas1.height = splitPositionPx;
            const ctx1 = canvas1.getContext('2d');
            ctx1.drawImage(img, 0, 0, imgWidthPx, splitPositionPx, 0, 0, imgWidthPx, splitPositionPx);
            const imgData1 = canvas1.toDataURL('image/png');
            const imgHeight1 = (splitPositionPx * imgWidth) / imgWidthPx;

            // 두 번째 부분 캔버스 생성
            const canvas2 = document.createElement('canvas');
            canvas2.width = imgWidthPx;
            canvas2.height = imgHeightPx - splitPositionPx;
            const ctx2 = canvas2.getContext('2d');
            ctx2.drawImage(img, 0, splitPositionPx, imgWidthPx, imgHeightPx - splitPositionPx, 0, 0, imgWidthPx, imgHeightPx - splitPositionPx);
            const imgData2 = canvas2.toDataURL('image/png');
            const imgHeight2 = ((imgHeightPx - splitPositionPx) * imgWidth) / imgWidthPx;

            // 첫 번째 부분을 PDF에 추가
            let heightLeft1 = imgHeight1;
            let position1 = topMargin;
            pdf.addImage(imgData1, 'PNG', 0, position1, imgWidth, imgHeight1);
            heightLeft1 -= (pageHeight - topMargin);

            // 여러 페이지로 분할
            while (heightLeft1 > 0) {
              position1 = topMargin + (heightLeft1 - imgHeight1);
              pdf.addPage();
              pdf.addImage(imgData1, 'PNG', 0, position1, imgWidth, imgHeight1);
              heightLeft1 -= (pageHeight - topMargin);
            }

            // 두 번째 부분: 새로운 페이지에서 시작 (연령대별 현황 섹션)
            let heightLeft2 = imgHeight2;
            let position2 = topMargin;
            pdf.addPage();
            pdf.addImage(imgData2, 'PNG', 0, position2, imgWidth, imgHeight2);
            heightLeft2 -= (pageHeight - topMargin);

            // 여러 페이지로 분할
            while (heightLeft2 > 0) {
              position2 = topMargin + (heightLeft2 - imgHeight2);
              pdf.addPage();
              pdf.addImage(imgData2, 'PNG', 0, position2, imgWidth, imgHeight2);
              heightLeft2 -= (pageHeight - topMargin);
            }

            resolve();
          };
        });
      } else {
        // 연령대별 현황 섹션이 없는 경우: 전체를 한 번에 처리
        let heightLeft = imgHeight;
        let position = topMargin;

        // 첫 페이지 추가
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - topMargin);

        // 여러 페이지로 분할
        while (heightLeft > 0) {
          position = topMargin + (heightLeft - imgHeight);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= (pageHeight - topMargin);
        }
      }

      // 파일명 생성
      const fileName = `통계보고서_${selectedYear || '전체'}_${selectedDepartment || '전체'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // PDF 다운로드
      pdf.save(fileName);
      
      setLoading(false);
      showSnackbar('PDF 다운로드가 완료되었습니다.', 'success');
    } catch (error) {
      console.error('PDF 생성 실패:', error);
      setLoading(false);
      showSnackbar('PDF 생성 중 오류가 발생했습니다.', 'error');
    }
  };

  // 폼 데이터 변경 처리
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 합계 자동 계산
  useEffect(() => {
    const totalRegistration = formData.new_comer_registration + formData.transfer_believer_registration;
    const newComerGraduateTotal = formData.new_comer_graduate_prev_year + formData.new_comer_graduate_current_year;
    const transferBelieverGraduateTotal = formData.transfer_believer_graduate_prev_year + formData.transfer_believer_graduate_current_year;
    const totalGraduate = newComerGraduateTotal + transferBelieverGraduateTotal;
    const newComerEducationTotal = formData.new_comer_education_in_progress + formData.new_comer_education_discontinued;
    const transferBelieverEducationTotal = formData.transfer_believer_education_in_progress + formData.transfer_believer_education_discontinued;
    const totalEducation = newComerEducationTotal + transferBelieverEducationTotal;

    setFormData(prev => ({
      ...prev,
      total_registration: totalRegistration,
      new_comer_graduate_total: newComerGraduateTotal,
      transfer_believer_graduate_total: transferBelieverGraduateTotal,
      total_graduate: totalGraduate,
      new_comer_education_total: newComerEducationTotal,
      transfer_believer_education_total: transferBelieverEducationTotal,
      total_education: totalEducation
    }));
  }, [
    formData.new_comer_registration,
    formData.transfer_believer_registration,
    formData.new_comer_graduate_prev_year,
    formData.new_comer_graduate_current_year,
    formData.transfer_believer_graduate_prev_year,
    formData.transfer_believer_graduate_current_year,
    formData.new_comer_education_in_progress,
    formData.new_comer_education_discontinued,
    formData.transfer_believer_education_in_progress,
    formData.transfer_believer_education_discontinued
  ]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDepartments();
    loadStatistics();
    // 현재년도로 월별/연령대별 통계도 로드
    const currentYear = new Date().getFullYear();
    
    try {
      fetchMonthlyAgeStats(currentYear);
    } catch (error) {
      console.error('fetchMonthlyAgeStats 호출 중 오류:', error);
    }
  }, []);

  // 통계 데이터가 로드되면 차트 기준 년도 설정

  // 년도별 및 부서별 필터링 (현재 사용하지 않음 - 표는 전체 데이터 표시)
  // const filteredStatistics = statistics.filter(stat => {
  //   const yearMatch = !selectedYear || selectedYear.trim() === '' || stat.year.toString().includes(selectedYear);
  //   const departmentMatch = !selectedDepartment || stat.department === selectedDepartment;
  //   return yearMatch && departmentMatch;
  // });

  // 년도 또는 부서 필터 변경 시 통계 다시 로드 (debounce 적용)
  useEffect(() => {
    const timer = setTimeout(() => {
      loadStatistics();
    }, 500); // 500ms 지연

    return () => clearTimeout(timer);
  }, [selectedYear, selectedDepartment]);

  // 년도 및 부서 필터 변경 시 월별/연령대별 통계 로드
  useEffect(() => {
    if (selectedYear) {
      fetchMonthlyAgeStats(selectedYear);
    } else {
      // 전체 선택 시 현재 년도로 로드
      const currentYear = new Date().getFullYear();
      fetchMonthlyAgeStats(currentYear);
    }
  }, [selectedYear, selectedDepartment]);

  return (
    <Box sx={{ p: 3 }}>

      {/* 조회조건, 버튼 및 요약 카드 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        
        <TextField
          size="small"
          label="년도"
            value={selectedYear}
          onChange={(e) => {
            const value = e.target.value;
            // 숫자만 입력 허용 (최대 4자리)
            if (value === '' || /^\d{1,4}$/.test(value)) {
              setSelectedYear(value);
            }
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              loadStatistics();
            }
          }}
          placeholder="년도를 입력하세요"
          type="text"
          inputProps={{
            maxLength: 4,
            pattern: '[0-9]{4}'
          }}
          helperText={selectedYear && (selectedYear.length !== 4 || parseInt(selectedYear) < 2000 || parseInt(selectedYear) > 2100) ? '4자리 년도를 입력하세요 (2000-2100)' : ''}
          error={selectedYear && (selectedYear.length !== 4 || parseInt(selectedYear) < 2000 || parseInt(selectedYear) > 2100)}
          sx={{
            width: 140,
            '& .MuiInputLabel-root': {
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151'
            },
            '& .MuiOutlinedInput-root': {
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                }
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }
              }
            },
            '& .MuiFormHelperText-root': {
              fontSize: '12px',
              marginTop: '2px'
            }
          }}
        />

        <TextField
          size="small"
          label="년도 범위"
          type="number"
          value={yearRange}
          onChange={(e) => setYearRange(parseInt(e.target.value) || 1)}
          inputProps={{ min: 1, max: 20 }}
          sx={{
            width: 140,
            '& .MuiInputLabel-root': {
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151'
            },
            '& .MuiOutlinedInput-root': {
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                }
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }
              }
            },
            '& .MuiFormHelperText-root': {
              fontSize: '12px',
              marginTop: '2px'
            }
          }}
        />

        <FormControl size="small" sx={{ width: 150 }}>
          <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>부서</InputLabel>
          <Select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            sx={{
              height: '36px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
              },
              '&.Mui-focused': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            }}
          >
            {departments.map(dept => (
              <MenuItem key={dept.id} value={dept.code_name}>{dept.code_name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Tooltip title="새로고침" arrow placement="top">
          <IconButton
            onClick={loadStatistics}
            disabled={loading}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              },
              '&.Mui-disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            <RefreshIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="통계 추가" arrow placement="top">
          <IconButton
            onClick={openAddDialog}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              }
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="통계 생성" arrow placement="top">
          <IconButton
            onClick={handleGenerateClick}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3), 0 2px 4px -1px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4), 0 4px 6px -2px rgba(245, 158, 11, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              }
            }}
          >
            <AutoAwesomeIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="PDF 방향 변경" arrow placement="top">
          <IconButton
            onClick={() => setPdfOrientation(pdfOrientation === 'portrait' ? 'landscape' : 'portrait')}
            size="small"
            sx={{
              background: pdfOrientation === 'landscape' 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              }
            }}
          >
            <AspectRatioIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title={`PDF 다운로드 (${pdfOrientation === 'portrait' ? '세로' : '가로'})`} arrow placement="top">
          <IconButton
            onClick={handleDownloadPdf}
            disabled={loading}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3), 0 2px 4px -1px rgba(239, 68, 68, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.4), 0 4px 6px -2px rgba(239, 68, 68, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0) scale(0.98)'
              },
              '&.Mui-disabled': {
                background: '#e5e7eb',
                color: '#9ca3af',
                transform: 'none',
                boxShadow: 'none'
              }
            }}
          >
            <PictureAsPdfIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>

        {/* 요약 카드들 */}
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          {/* 총 등록 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
            borderRadius: 3, 
            p: 1.5, 
            color: 'white',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '12px' }}>총 등록</Typography>
              <Typography variant="h4" sx={{  fontSize: '12px', lineHeight: 1 }}>
                    {statistics.reduce((sum, stat) => sum + stat.total_registration, 0)}
                  </Typography>
                </Box>
            <PeopleIcon sx={{ fontSize: 20, opacity: 0.8, color: '#93c5fd' }} />
              </Box>

          {/* 총 수료 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            borderRadius: 3, 
            p: 1.5, 
            color: 'white',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '12px' }}>총 수료</Typography>
              <Typography variant="h4" sx={{  fontSize: '12px', lineHeight: 1 }}>
                    {statistics.reduce((sum, stat) => sum + stat.total_graduate, 0)}
                  </Typography>
                </Box>
            <CheckCircleIcon sx={{ fontSize: 20, opacity: 0.8, color: '#86efac' }} />
              </Box>

          {/* 관리 년도 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
            borderRadius: 3, 
            p: 1.5, 
            color: 'white',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }
          }}>
            <Box sx={{ textAlign: 'center', flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '12px' }}>관리 년도</Typography>
              <Typography variant="h4" sx={{  fontSize: '12px', lineHeight: 1 }}>
                {statistics.length}
                  </Typography>
                </Box>
            <TrendingUpIcon sx={{ fontSize: 20, opacity: 0.8, color: '#c4b5fd' }} />
              </Box>
                </Box>
              </Box>

      {/* 통계 콘텐츠 전체 영역 */}
      <div id="statistics-container">
      {/* 1페이지: 새가족 등록현황보고 + 등록자/수료자 현황 차트 */}
      <div id="main-statistics-section" style={{ pageBreakAfter: 'always' }}>
      {/* 통계 테이블 */}
        {getFilteredStatistics().length > 0 && (
      <Paper sx={{ 
        width: '98%', 
        mx: 'auto', 
        overflow: 'hidden' 
      }}>
        {/* 테이블 타이틀 */}
        <Box sx={{ 
          p: 1, 
          backgroundColor: '#f8fafc', 
          borderBottom: '2px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <Typography variant="h5" sx={{ 
            fontSize: '14px', 
            color: '#1f2937',
            letterSpacing: '0.5px'
          }}>
            {selectedYear && selectedDepartment ? `${selectedDepartment} 등록/수료/교육 현황 보고서` : '새가족 등록현황보고'}
          </Typography>
        </Box>
        
        <TableContainer sx={{ pageBreakInside: 'avoid', width: '100%', overflowX: 'auto' }} id="main-statistics-table">
          <Table stickyHeader size="small" sx={{ 
            border: '1px solid #e5e7eb', 
            tableLayout: 'fixed',
            width: '100%',
            '& .MuiTableCell-root': { 
              py: 0.3, 
              px: 0.5,
              fontSize: '12px',
              lineHeight: 1.2
            } 
          }}>
            <TableHead>
              {/* 메인 헤더 행 */}
              <TableRow>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #6b7280', fontSize: '12px', width: '3%' }} rowSpan={3}>년도</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af', fontSize: '12px' }} colSpan={3}>등록</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #059669', fontSize: '12px' }} colSpan={7}>수료</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b', fontSize: '12px' }} colSpan={7}>교육</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px', width: '3%' }} rowSpan={3}>수정</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', fontSize: '12px', width: '3%' }} rowSpan={3}>삭제</TableCell>
              </TableRow>
              
              {/* 서브 헤더 행 */}
              <TableRow>
                {/* 등록 서브헤더 */}
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px', width: '6%' }} rowSpan={2}>초신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px', width: '8%' }} rowSpan={2}>전입신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af', fontSize: '12px', width: '6%' }} rowSpan={2}>합계</TableCell>
                
                {/* 수료 서브헤더 */}
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }} colSpan={3}>초신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }} colSpan={3}>전입신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #059669', fontSize: '12px' }} rowSpan={2}>합계</TableCell>
                
                {/* 교육 서브헤더 */}
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }} colSpan={3}>초신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }} colSpan={3}>전입신자</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b', fontSize: '12px' }} rowSpan={2}>합계</TableCell>
              </TableRow>
              
              {/* 상세 헤더 행 */}
              <TableRow>
                {/* 수료 상세헤더 */}
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>전년도</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>올해</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>합계</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>전년도</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>올해</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>합계</TableCell>
                
                {/* 교육 상세헤더 */}
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>교육중</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>교육중단</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>합계</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>교육중</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>교육중단</TableCell>
                <TableCell sx={{  backgroundColor: '#f8fafc', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>합계</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {getFilteredStatistics().map((stat) => (
                <TableRow key={stat.year} hover>
                  {/* 년도 */}
                  <TableCell sx={{  backgroundColor: '#dbeafe', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #6b7280', fontSize: '12px' }}>
                    {stat.year}
                  </TableCell>
                  
                  {/* 등록 섹션 */}
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px', width: '6%' }}>
                    {stat.new_comer_registration}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px', width: '8%' }}>
                    {stat.transfer_believer_registration}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#dbeafe', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af', fontSize: '12px', width: '6%' }}>
                    {stat.total_registration}
                  </TableCell>
                  
                  {/* 수료 섹션 */}
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_graduate_prev_year}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_graduate_current_year}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#dcfce7', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_graduate_total}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_graduate_prev_year}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_graduate_current_year}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#dcfce7', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_graduate_total}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#bbf7d0', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #059669', fontSize: '12px' }}>
                    {stat.total_graduate}
                  </TableCell>
                  
                  {/* 교육 섹션 */}
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_education_in_progress}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_education_discontinued}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#fef3c7', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.new_comer_education_total}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_education_in_progress}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_education_discontinued}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#fef3c7', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                    {stat.transfer_believer_education_total}
                  </TableCell>
                  <TableCell sx={{  backgroundColor: '#fde68a', textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b', fontSize: '12px' }}>
                    {stat.total_education}
                  </TableCell>
                  
                  {/* 수정 칼럼 */}
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', fontSize: '12px' }}>
                      <Tooltip title="수정" arrow>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(stat)}
                          sx={{ color: '#3b82f6', '& .MuiSvgIcon-root': { fontSize: '14px' } }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                  </TableCell>
                  
                  {/* 삭제 칼럼 */}
                  <TableCell sx={{ textAlign: 'center', py: 0.3, px: 0.5, border: '1px solid #e5e7eb', fontSize: '12px' }}>
                      <Tooltip title="삭제" arrow>
                        <IconButton
                          size="small"
                          onClick={() => deleteStatistics(stat.year)}
                          sx={{ color: '#ef4444', '& .MuiSvgIcon-root': { fontSize: '14px' } }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* 합계 행 */}
              {getFilteredStatistics().length > 0 && (
                <TableRow sx={{ backgroundColor: '#f8fafc', '&:hover': { backgroundColor: '#f1f5f9' } }}>
                  {/* 년도 */}
                  <TableCell sx={{ 
                    backgroundColor: '#e2e8f0', 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '3px solid #6b7280',
                    fontSize: '12px',
                    color: '#1e293b',
                    py: 0.3,
                    px: 0.5
                  }}>
                    합계
                  </TableCell>
                  
                  {/* 등록 섹션 */}
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: '6%',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_registration || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: '8%',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_registration || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '3px solid #1e40af',
                    backgroundColor: '#dbeafe',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    width: '6%'
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.total_registration || 0), 0)}
                  </TableCell>
                  
                  {/* 수료 섹션 */}
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_graduate_prev_year || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_graduate_current_year || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_graduate_total || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_graduate_prev_year || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_graduate_current_year || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#dcfce7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_graduate_total || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '3px solid #059669',
                    backgroundColor: '#bbf7d0',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.total_graduate || 0), 0)}
                  </TableCell>
                  
                  {/* 교육 섹션 */}
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_education_in_progress || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_education_discontinued || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.new_comer_education_total || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_education_in_progress || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_education_discontinued || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '1px solid #94a3b8',
                    backgroundColor: '#fef3c7',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.transfer_believer_education_total || 0), 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    textAlign: 'center', 
                    border: '1px solid #e5e7eb', 
                    borderRight: '3px solid #f59e0b',
                    backgroundColor: '#fed7aa',
                    color: '#000000',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    py: 0.3,
                    px: 0.5
                  }}>
                    {getFilteredStatistics().reduce((sum, stat) => sum + (stat.total_education || 0), 0)}
                  </TableCell>
                  
                  {/* 수정/삭제 버튼 (합계 행에는 없음) */}
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8', py: 0.3, px: 0.5, fontSize: '12px' }}>
                    -
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', py: 0.3, px: 0.5, fontSize: '12px' }}>
                    -
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
        )}
      </div>

      {/* 년도별 등록/수료 현황 차트 */}
        {getFilteredStatistics().length > 0 && (
        <Paper id="annual-statistics-section" sx={{ 
          width: '98%', 
          mx: 'auto', 
          mt: 3, 
          p: 1.5, 
          boxSizing: 'border-box',
          minWidth: false ? '100%' : 'auto',
          maxWidth: false ? '100%' : '98%',
          flex: false ? '1 1 100%' : 'none',
          display: false ? 'block' : 'block',
          overflow: 'hidden'
        }}>
        <div 
          className="w-full p-3 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg border border-blue-100" 
          style={{ 
            boxSizing: 'border-box',
            width: false ? '95%' : '100%',
            minWidth: false ? '95%' : 'auto',
            maxWidth: false ? '95%' : '100%',
            flex: false ? '1 1 95%' : 'none',
            display: false ? 'block' : 'block',
            overflow: 'hidden',
            margin: '0 auto'
          }}
        >
          {/* 헤더 */}
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ width: '100px' }}></div>
            <Typography variant="h6" sx={{  color: '#374151', fontSize: '14px', flex: 1, textAlign: 'center' }}>
              {selectedYear && selectedDepartment ? `${selectedYear}년 기준 ${selectedDepartment}의 등록자/수료자 현황` : '년도별 등록자/수료자 현황'}
            </Typography>
            <div style={{ width: '100px' }}></div>
          </div>

          {/* 차트 영역 */}
          <Box id="annual-chart" sx={{ 
            height: 220, 
            width: '95%', 
            backgroundColor: 'white', 
            borderRadius: 2, 
            p: 1, 
            border: '1px solid #e5e7eb', 
            pageBreakInside: 'avoid',
            minWidth: '95%',
            maxWidth: '95%',
            flex: '1 1 95%',
            display: 'block',
            overflow: 'hidden',
            mx: 'auto'
          }}>
            {(() => {
              const chartData = prepareChartData();
              return chartData.length > 0;
            })() ? (
              <ResponsiveContainer 
                width="95%" 
                height="100%" 
                style={{ 
                  width: '95%',
                  minWidth: 0,
                  maxWidth: '95%'
                }}
              >
                <BarChart
                  data={prepareChartData()}
                  margin={{
                    top: 20,
                    right: 20,
                    left: 10,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb"
                    strokeOpacity={0.3}
                  />
                  <XAxis 
                    dataKey="year" 
                    tick={{ 
                      fontSize: 12, 
                      fill: '#6b7280'
                    }}
                    tickFormatter={(value) => `${value}년`}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    interval={0}
                    angle={false ? 0 : 0}
                  />
                  <YAxis 
                    tick={{ 
                      fontSize: 12, 
                      fill: '#6b7280'
                    }}
                    domain={[0, 'dataMax + 50']}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [value, name]}
                    labelFormatter={(label) => `${label}년`}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                          fontSize: '12px'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{
                      paddingTop: '20px',
                          fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="등록자" 
                    fill="url(#blueGradient)" 
                    name="등록자"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={false ? 80 : 80}
                  >
                    <LabelList 
                      dataKey="등록자" 
                      position="top" 
                      style={{ 
                        fill: '#1e40af', 
                        fontSize: '12px'
                      }}
                      formatter={(value) => value > 0 ? value : ''}
                    />
                  </Bar>
                  <Bar 
                    dataKey="수료자" 
                    fill="url(#greenGradient)" 
                    name="수료자"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={false ? 80 : 80}
                  >
                    <LabelList 
                      dataKey="수료자" 
                      position="top" 
                      style={{ 
                        fill: '#059669', 
                        fontSize: '12px'
                      }}
                      formatter={(value) => value > 0 ? value : ''}
                    />
                  </Bar>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.6}/>
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <Box sx={{ 
                  width: 48, 
                  height: 48, 
                  border: '3px solid #e3f2fd', 
                  borderTop: '3px solid #2196f3',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
                <Typography variant="h6" color="text.secondary">
                  차트 데이터를 불러오는 중...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  기준 년도: {selectedYear || '설정되지 않음'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  통계 데이터: {statistics.length}개
                </Typography>
              </Box>
            )}
          </Box>
        </div>
        </Paper>
      )}
      
      {/* 2페이지: 월별/연령대별 통계 표 + 등록현황 분석 */}
      <div id="monthly-registration-report-section" style={{ pageBreakAfter: 'always' }}>
      {/* 월별/연령대별 통계 표 */}
      <Box sx={{ 
        mt: 3, 
        width: '95%', 
        mx: 'auto' 
      }}>
        <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  fontSize: '14px' }}>
          {selectedYear && selectedDepartment ? `${selectedYear}년 ${selectedDepartment}의 등록현황보고` : `${selectedYear || new Date().getFullYear()}년 새가족 등록현황 보고서`}
        </Typography>
        
        <Box sx={{ width: '100%' }}>
          <TableContainer component={Paper} sx={{ boxShadow: 3, pageBreakInside: 'avoid' }}>
            <Table size="small" sx={{ 
              width: '100%', 
              tableLayout: 'fixed',
              '& .MuiTableCell-root': { py: 0.3, px: 0.5, fontSize: '12px', lineHeight: 1.2 } 
            }}>
              <TableHead>
                {/* 메인 헤더 */}
                <TableRow>
                  <TableCell 
                    rowSpan={2}
                    sx={{ 
                      width: '5%',
                      backgroundColor: '#f5f5f5', 
                      border: '1px solid #ddd',
                      textAlign: 'center',
                      verticalAlign: 'middle'
                    }}
                  >
                    연령대
                  </TableCell>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <TableCell 
                      key={month} 
                      colSpan={2}
                      sx={{ 
                        textAlign: 'center', 
                        backgroundColor: '#e3f2fd', 
                        border: '1px solid #ddd',
                        width: '5%',
                        minWidth: 0
                      }}
                    >
                      {month}월
                    </TableCell>
                  ))}
                  <TableCell 
                    rowSpan={2}
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#e8f5e8', 
                      border: '1px solid #ddd',
                      verticalAlign: 'middle',
                      width: '3%'
                    }}
                  >
                    초신자합계
                  </TableCell>
                  <TableCell 
                    rowSpan={2}
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#fff3e0', 
                      border: '1px solid #ddd',
                      verticalAlign: 'middle',
                      width: '3%'
                    }}
                  >
                    전입신자합계
                  </TableCell>
                  <TableCell 
                    rowSpan={2}
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#f3e5f5', 
                      border: '1px solid #ddd',
                      verticalAlign: 'middle',
                      width: '3%'
                    }}
                  >
                    총합계
                  </TableCell>
                </TableRow>
                
                {/* 서브 헤더 */}
                <TableRow>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <React.Fragment key={month}>
                      <TableCell 
                        sx={{ 
                          textAlign: 'center', 
                          backgroundColor: '#f3e5f5', 
                          border: '1px solid #ddd',
                          width: '60%'
                        }}
                      >
                        초신자
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          textAlign: 'center', 
                          backgroundColor: '#f3e5f5', 
                          border: '1px solid #ddd',
                          width: '60%'
                        }}
                      >
                        전입신자
                      </TableCell>
                    </React.Fragment>
                  ))}
                </TableRow>
              </TableHead>
              
              <TableBody>
                {/* 연령대별 행 */}
                {(() => {
                  // 기준년도 가져오기 (selectedYear 또는 현재년도)
                  const baseYear = selectedYear || new Date().getFullYear();
                  
                  // 기준년도에 따른 출생년도 범위 계산
                  const getBirthYearRange = (ageGroup, baseYear) => {
                    switch (ageGroup) {
                      case '10s':
                        return `${baseYear - 19}~${baseYear - 10}`;
                      case '20s':
                        return `${baseYear - 29}~${baseYear - 20}`;
                      case '30s':
                        return `${baseYear - 39}~${baseYear - 30}`;
                      case '40s':
                        return `${baseYear - 49}~${baseYear - 40}`;
                      case '50s':
                        return `${baseYear - 59}~${baseYear - 50}`;
                      case '60s':
                        return `${baseYear - 69}~${baseYear - 60}`;
                      case '70s_plus':
                        return `~${baseYear - 70}`;
                      default:
                        return '';
                    }
                  };

                  return [
                    { key: '10s', label: '10대', birthYear: getBirthYearRange('10s', baseYear) },
                    { key: '20s', label: '20대', birthYear: getBirthYearRange('20s', baseYear) },
                    { key: '30s', label: '30대', birthYear: getBirthYearRange('30s', baseYear) },
                    { key: '40s', label: '40대', birthYear: getBirthYearRange('40s', baseYear) },
                    { key: '50s', label: '50대', birthYear: getBirthYearRange('50s', baseYear) },
                    { key: '60s', label: '60대', birthYear: getBirthYearRange('60s', baseYear) },
                    { key: '70s_plus', label: '70대 이상', birthYear: getBirthYearRange('70s_plus', baseYear) }
                  ];
                })().map(ageGroup => (
                  <TableRow key={ageGroup.key}>
                    <TableCell 
                      sx={{ 
                        backgroundColor: '#f5f5f5', 
                        border: '1px solid #ddd',
                        width: '5%',
                        fontSize: '12px',
                        lineHeight: 1.2
                      }}
                    >
                      {ageGroup.label}<br/>({ageGroup.birthYear})
                    </TableCell>
                    
                    {/* 월별 데이터 */}
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <React.Fragment key={month}>
                        <TableCell 
                          sx={{ 
                            textAlign: 'center', 
                            border: '1px solid #ddd',
                            backgroundColor: monthlyAgeStats[month]?.초신자?.[ageGroup.key] > 0 ? '#fff3e0' : '#ffffff',
                            width: '6%',
                            minWidth: 0
                          }}
                          title={`${month}월 ${ageGroup.label} 초신자: ${monthlyAgeStats[month]?.초신자?.[ageGroup.key] || 0}`}
                        >
                          {monthlyAgeStats[month]?.초신자?.[ageGroup.key] || 0}
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            textAlign: 'center', 
                            border: '1px solid #ddd',
                            backgroundColor: monthlyAgeStats[month]?.전입신자?.[ageGroup.key] > 0 ? '#fff3e0' : '#ffffff',
                            width: '6%',
                            minWidth: 0
                          }}
                          title={`${month}월 ${ageGroup.label} 전입신자: ${monthlyAgeStats[month]?.전입신자?.[ageGroup.key] || 0}`}
                        >
                          {monthlyAgeStats[month]?.전입신자?.[ageGroup.key] || 0}
                        </TableCell>
                      </React.Fragment>
                    ))}
                    
                    {/* 초신자 합계 */}
                    <TableCell 
                      sx={{ 
                        textAlign: 'center', 
                        backgroundColor: '#e8f5e8', 
                        border: '1px solid #ddd',
                        width: '3%'
                      }}
                    >
                      {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                        sum + (monthData.초신자?.[ageGroup.key] || 0), 0
                      )}
                    </TableCell>
                    
                    {/* 전입신자 합계 */}
                    <TableCell 
                      sx={{ 
                        textAlign: 'center', 
                        backgroundColor: '#fff3e0', 
                        border: '1px solid #ddd',
                        width: '3%'
                      }}
                    >
                      {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                        sum + (monthData.전입신자?.[ageGroup.key] || 0), 0
                      )}
                    </TableCell>
                    
                    {/* 전체 합계 */}
                    <TableCell 
                      sx={{ 
                        textAlign: 'center', 
                        backgroundColor: '#f3e5f5', 
                        border: '1px solid #ddd',
                        width: '3%'
                      }}
                    >
                      {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                        sum + (monthData.초신자?.[ageGroup.key] || 0) + (monthData.전입신자?.[ageGroup.key] || 0), 0
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                
                {/* 합계 행 */}
                <TableRow>
                  <TableCell 
                    sx={{ 
                      backgroundColor: '#f5f5f5', 
                      border: '1px solid #ddd',
                      color: '#000000',
                      fontWeight: 'bold',
                          fontSize: '12px'
                    }}
                  >
                    합계
                  </TableCell>
                  
                  {/* 월별 합계 */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <React.Fragment key={month}>
                      <TableCell 
                        sx={{ 
                          textAlign: 'center', 
                          backgroundColor: '#e8f5e8', 
                          border: '1px solid #ddd',
                          color: '#000000',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {monthlyAgeStats[month]?.초신자?.total || 0}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          textAlign: 'center', 
                          backgroundColor: '#e8f5e8', 
                          border: '1px solid #ddd',
                          color: '#000000',
                          fontWeight: 'bold',
                          fontSize: '12px'
                        }}
                      >
                        {monthlyAgeStats[month]?.전입신자?.total || 0}
                      </TableCell>
                    </React.Fragment>
                  ))}
                  
                  {/* 초신자 합계 */}
                  <TableCell 
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#e8f5e8', 
                      border: '1px solid #ddd',
                      color: '#000000',
                      fontWeight: 'bold',
                          fontSize: '12px'
                    }}
                  >
                    {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                      sum + (monthData.초신자?.total || 0), 0
                    )}
                  </TableCell>
                  
                  {/* 전입신자 합계 */}
                  <TableCell 
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#e8f5e8', 
                      border: '1px solid #ddd',
                      color: '#000000',
                      fontWeight: 'bold',
                          fontSize: '12px'
                    }}
                  >
                    {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                      sum + (monthData.전입신자?.total || 0), 0
                    )}
                  </TableCell>
                  
                  {/* 전체 합계 */}
                  <TableCell 
                    sx={{ 
                      textAlign: 'center', 
                      backgroundColor: '#e8f5e8', 
                      border: '1px solid #ddd',
                      color: '#000000',
                      fontWeight: 'bold',
                          fontSize: '12px'
                    }}
                  >
                    {Object.values(monthlyAgeStats).reduce((sum, monthData) => 
                      sum + (monthData.초신자?.total || 0) + (monthData.전입신자?.total || 0), 0
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
      </div>

      {/* 월별/연령대별 통계 차트 */}
      {Object.keys(monthlyAgeStats).length > 0 && (
        <Paper id="registration-analysis-section" sx={{ 
          width: '95%', 
          mt: 3, 
          p: 1, 
          boxShadow: 2, 
          mx: 'auto' 
        }}>
          <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#374151', fontSize: '14px' }}>
            {selectedYear && selectedDepartment ? `${selectedYear}년 ${selectedDepartment}의 등록현황 분석` : `${selectedYear || new Date().getFullYear()}년 새가족 등록현황 분석`}
          </Typography>
          
          <Box sx={{ 
            border: '2px solid #e5e7eb', 
            borderRadius: 2, 
            p: 1, 
            backgroundColor: '#f9fafb',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
          }}>
          <Grid container spacing={2}>
            {/* 월별 등록자 현황 막대 차트 */}
            <Grid item xs={12} md={6}>
              <Box id="monthly-chart" sx={{ 
                p: 1, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 250,
                pageBreakInside: 'avoid',
                width: '95%',
                mx: 'auto'
              }}>
                <Typography variant="h6" sx={{ mb: 1, textAlign: 'center',  color: '#1f2937', fontSize: '14px' }}>
                  월별 전체 등록자 현황
                </Typography>
                <ResponsiveContainer width="95%" height="85%">
                  <BarChart 
                    data={prepareMonthlyData()}
                    margin={{
                      top: 20,
                      right: 20,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <RechartsTooltip 
                      formatter={(value) => [value, '등록자 수']}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#3b82f6" 
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        style={{ 
                          fill: '#1e40af', 
                          fontSize: '12px'
                        }}
                        formatter={(value) => value > 0 ? value : ''}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* 연령대별 비율 파이 차트 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 1, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 250,
                pageBreakInside: 'avoid',
                '& .recharts-pie-label-text': {
                  fontSize: '12px !important'
                },
                '& text': {
                  fontSize: '12px !important'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 1, textAlign: 'center',  color: '#1f2937', fontSize: '12px' }}>
                  연령별 전체 등록자 비율
                </Typography>
                <ResponsiveContainer width="100%" height="95%">
                  <PieChart>
                    <Pie
                      data={prepareAgeGroupData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      labelStyle={{ fontSize: 12 }}
                    >
                      {prepareAgeGroupData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name, props) => [
                        `${value}명 (${props.payload.percentage}%)`, 
                        '등록자 수'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
          </Box>
        </Paper>
      )}
      
      {/* 3페이지: 연령대별 현황 + 월별/연령대별 현황 */}
      <div id="age-group-section-start">
      {/* 초신자/전입신자 분리 연령대별 통계 차트 */}
      {Object.keys(monthlyAgeStats).length > 0 && (
        <Paper id="age-group-statistics-section" sx={{ 
          width: '95%', 
          mt: 3, 
          p: 1, 
          boxShadow: 2, 
          mx: 'auto' 
        }}>
          <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#374151', fontSize: '14px' }}>
            {selectedYear && selectedDepartment ? `${selectedYear}년 ${selectedDepartment}의 초신자 및 전입신자의 등록자의 연령대별 현황` : `${selectedYear || new Date().getFullYear()}년 초신자 및 전입신자 등록자의 연령대별 현황`}
          </Typography>
          
          <Grid container spacing={1.5}>
            {/* 초신자 연령대별 비율 파이 차트 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 320,
                pageBreakInside: 'avoid',
                '& .recharts-pie-label-text': {
                  fontSize: '12px !important'
                },
                '& text': {
                  fontSize: '12px !important'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#3b82f6', fontSize: '12px' }}>
                  초신자 등록자 비율
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={prepareNewComerAgeGroupData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelStyle={{ fontSize: 12 }}
                    >
                      {prepareNewComerAgeGroupData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name, props) => [
                        `${value}명 (${props.payload.percentage}%)`, 
                        '초신자 수'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* 전입신자 연령대별 비율 파이 차트 */}
            <Grid item xs={12} md={6}>
              <Box sx={{ 
                p: 1.5, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 320,
                pageBreakInside: 'avoid',
                '& .recharts-pie-label-text': {
                  fontSize: '12px !important'
                },
                '& text': {
                  fontSize: '12px !important'
                }
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#8b5cf6', fontSize: '12px' }}>
                  전입신자 등록자 비율
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={prepareTransferBelieverAgeGroupData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      labelStyle={{ fontSize: 12 }}
                    >
                      {prepareTransferBelieverAgeGroupData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value, name, props) => [
                        `${value}명 (${props.payload.percentage}%)`, 
                        '전입신자 수'
                      ]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 월별/연령대별 막대 차트 */}
      {Object.keys(monthlyAgeStats).length > 0 && (
        <Paper id="monthly-age-statistics-section" sx={{ 
          width: '95%', 
          mt: 3, 
          p: 1, 
          boxShadow: 2, 
          mx: 'auto' 
        }}>
          <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#374151', fontSize: '14px' }}>
            {selectedYear && selectedDepartment ? `${selectedYear}년 ${selectedDepartment}의 초신자 및 전입신자 등록자의 월별/연령대별 현황` : `${selectedYear || new Date().getFullYear()}년 초신자 및 전입신자 등록자의 월별/연령대별 현황`}
          </Typography>
          
          <Grid container spacing={1.5}>
            {/* 1월-6월 막대 차트 */}
            <Grid item xs={12}>
              <Box id="monthly-age-chart-1" sx={{ 
                p: 1, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 320,
                pageBreakInside: 'avoid',
                width: false ? '95%' : '95%',
                minWidth: false ? '95%' : '95%',
                maxWidth: false ? '95%' : '95%',
                mx: 'auto'
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#1f2937', fontSize: '12px' }}>
                  1월 ~ 6월 초신자/전입신자 등록자의 연령별 현황
                </Typography>
                <ResponsiveContainer 
                  width={false ? '95%' : '95%'} 
                  height="85%"
                  minWidth={false ? '95%' : '95%'}
                  maxWidth={false ? '95%' : '95%'}
                  style={{ 
                    width: false ? '95%' : '95%',
                    minWidth: false ? '95%' : '95%',
                    maxWidth: false ? '95%' : '95%'
                  }}
                >
                  <BarChart 
                    data={prepareMonthlyAgeBarData(1, 6)}
                    margin={{
                      top: 20,
                      right: false ? 20 : 20,
                      left: false ? 30 : 30,
                      bottom: 30
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="monthGroup" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <RechartsTooltip 
                      formatter={(value, name) => [`${value}명`, name]}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '5px',
                        fontSize: '12px'
                      }}
                    />
                    {prepareAgeGroupBarData().map((ageGroup, index) => (
                      <Bar 
                        key={ageGroup.key}
                        dataKey={ageGroup.key}
                        name={ageGroup.name}
                        fill={ageGroup.color}
                      >
                        <LabelList 
                          dataKey={ageGroup.key} 
                          position="top" 
                          style={{ 
                            fill: '#1e40af', 
                            fontSize: '12px'
                          }}
                          formatter={(value) => value > 0 ? value : ''}
                        />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>

            {/* 7월-12월 막대 차트 */}
            <Grid item xs={12}>
              <Box id="monthly-age-chart-2" sx={{ 
                p: 1, 
                backgroundColor: 'white', 
                borderRadius: 2, 
                border: '1px solid #e5e7eb',
                height: 320,
                pageBreakInside: 'avoid',
                width: false ? '95%' : '95%',
                minWidth: false ? '95%' : '95%',
                maxWidth: false ? '95%' : '95%',
                mx: 'auto'
              }}>
                <Typography variant="h6" sx={{ mb: 1.5, textAlign: 'center',  color: '#1f2937', fontSize: '12px' }}>
                  7월 ~ 12월 초신자/전입신자 등록자의 연령별 현황
                </Typography>
                <ResponsiveContainer 
                  width={false ? '95%' : '95%'} 
                  height="85%"
                  minWidth={false ? '95%' : '95%'}
                  maxWidth={false ? '95%' : '95%'}
                  style={{ 
                    width: false ? '95%' : '95%',
                    minWidth: false ? '95%' : '95%',
                    maxWidth: false ? '95%' : '95%'
                  }}
                >
                  <BarChart 
                    data={prepareMonthlyAgeBarData(7, 12)}
                    margin={{
                      top: 20,
                      right: false ? 20 : 20,
                      left: false ? 30 : 30,
                      bottom: 30
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="monthGroup" 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#6b7280' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <RechartsTooltip 
                      formatter={(value, name) => [`${value}명`, name]}
                      labelFormatter={(label) => label}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '5px',
                        fontSize: '12px'
                      }}
                    />
                    {prepareAgeGroupBarData().map((ageGroup, index) => (
                      <Bar 
                        key={ageGroup.key}
                        dataKey={ageGroup.key}
                        name={ageGroup.name}
                        fill={ageGroup.color}
                      >
                        <LabelList 
                          dataKey={ageGroup.key} 
                          position="top" 
                          style={{ 
                            fill: '#1e40af', 
                            fontSize: '12px'
                          }}
                          formatter={(value) => value > 0 ? value : ''}
                        />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* 통계 추가/수정 다이얼로그 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
          borderBottom: '1px solid #e5e7eb',
          borderRadius: '16px 16px 0 0',
          p: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 40,
              height: 40,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CalculateIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{  color: '#1f2937' }}>
          {editingStat ? `${editingStat.year}년 통계 수정` : '새 통계 추가'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                {editingStat ? '통계 데이터를 수정합니다' : '새로운 년도 통계를 추가합니다'}
              </Typography>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 3, backgroundColor: '#f9fafb' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 년도 입력 */}
            <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, boxShadow: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
                년도
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                value={formData.year}
                onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                disabled={!!editingStat}
                    placeholder="예: 2024"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
              </Grid>
            </Paper>
            
            {/* 초신자 섹션 */}
            <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PeopleIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography variant="h6" sx={{  color: '#3b82f6' }}>
                  초신자
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 수"
                type="number"
                value={formData.new_comer_registration}
                onChange={(e) => handleFormChange('new_comer_registration', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="전년도 수료"
                type="number"
                value={formData.new_comer_graduate_prev_year}
                onChange={(e) => handleFormChange('new_comer_graduate_prev_year', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="올해 수료"
                type="number"
                value={formData.new_comer_graduate_current_year}
                onChange={(e) => handleFormChange('new_comer_graduate_current_year', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중"
                type="number"
                value={formData.new_comer_education_in_progress}
                onChange={(e) => handleFormChange('new_comer_education_in_progress', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중단"
                type="number"
                value={formData.new_comer_education_discontinued}
                onChange={(e) => handleFormChange('new_comer_education_discontinued', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#3b82f6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.new_comer_education_total}
                InputProps={{ readOnly: true }}
                    sx={{
                      backgroundColor: '#f8fafc',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8fafc'
                      }
                    }}
              />
            </Grid>
            </Grid>
            </Paper>

            {/* 전입신자 섹션 */}
            <Paper sx={{ p: 3, backgroundColor: 'white', borderRadius: 3, boxShadow: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SchoolIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography variant="h6" sx={{  color: '#8b5cf6' }}>
                  전입신자
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 수"
                type="number"
                value={formData.transfer_believer_registration}
                onChange={(e) => handleFormChange('transfer_believer_registration', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="전년도 수료"
                type="number"
                value={formData.transfer_believer_graduate_prev_year}
                onChange={(e) => handleFormChange('transfer_believer_graduate_prev_year', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="올해 수료"
                type="number"
                value={formData.transfer_believer_graduate_current_year}
                onChange={(e) => handleFormChange('transfer_believer_graduate_current_year', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중"
                type="number"
                value={formData.transfer_believer_education_in_progress}
                onChange={(e) => handleFormChange('transfer_believer_education_in_progress', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중단"
                type="number"
                value={formData.transfer_believer_education_discontinued}
                onChange={(e) => handleFormChange('transfer_believer_education_discontinued', parseInt(e.target.value) || 0)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6'
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#8b5cf6',
                          borderWidth: 2
                        }
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.transfer_believer_education_total}
                InputProps={{ readOnly: true }}
                    sx={{
                      backgroundColor: '#f8fafc',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f8fafc'
                      }
                    }}
              />
            </Grid>
            </Grid>
            </Paper>

            {/* 합계 섹션 */}
            <Paper sx={{ 
              p: 3, 
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', 
              borderRadius: 3, 
              boxShadow: 1,
              border: '1px solid #bbf7d0'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircleIcon sx={{ color: 'white', fontSize: 16 }} />
                </Box>
                <Typography variant="h6" sx={{  color: '#10b981' }}>
                  합계
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 합계"
                type="number"
                value={formData.total_registration}
                InputProps={{ readOnly: true }}
                    sx={{
                      backgroundColor: '#f0fdf4',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f0fdf4',
                        '& fieldset': {
                          borderColor: '#bbf7d0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#065f46',
                        fontWeight: 600
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="수료 합계"
                type="number"
                value={formData.total_graduate}
                InputProps={{ readOnly: true }}
                    sx={{
                      backgroundColor: '#f0fdf4',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f0fdf4',
                        '& fieldset': {
                          borderColor: '#bbf7d0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#065f46',
                        fontWeight: 600
                      }
                    }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.total_education}
                InputProps={{ readOnly: true }}
                    sx={{
                      backgroundColor: '#f0fdf4',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: '#f0fdf4',
                        '& fieldset': {
                          borderColor: '#bbf7d0'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: '#065f46',
                        fontWeight: 600
                      }
                    }}
              />
            </Grid>
          </Grid>
            </Paper>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          backgroundColor: '#f9fafb', 
          borderTop: '1px solid #e5e7eb', 
          borderRadius: '0 0 16px 16px',
          p: 3,
          gap: 2
        }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              px: 3,
              py: 1.5,
              border: '1px solid #d1d5db',
              color: '#374151',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#f9fafb',
                borderColor: '#9ca3af'
              }
            }}
          >
            취소
          </Button>
          <Button 
            onClick={saveStatistics}
            sx={{
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            {editingStat ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 통계 생성 확인 팝업 */}
      <Dialog
        open={generateConfirmOpen}
        onClose={() => setGenerateConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e5e7eb'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontSize: '20px', 
          color: '#1f2937',
          pb: 1,
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          통계 생성 확인
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <DialogContentText sx={{ 
            textAlign: 'center', 
                          fontSize: '12px', 
            color: '#374151',
            mb: 2
          }}>
            <strong>{selectedYear}년 {selectedDepartment} 부서</strong>의 통계를 생성하시겠습니까?
          </DialogContentText>
          <DialogContentText sx={{ 
            textAlign: 'center', 
                          fontSize: '12px', 
            color: '#6b7280',
            mb: 1
          }}>
            이 작업은 기존 통계 데이터를 업데이트할 수 있습니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ 
          justifyContent: 'center', 
          gap: 2, 
          pb: 3, 
          px: 3 
        }}>
          <Button
            onClick={() => setGenerateConfirmOpen(false)}
            variant="outlined"
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': {
                borderColor: '#9ca3af',
                backgroundColor: '#f9fafb'
              }
            }}
          >
            취소
          </Button>
          <Button
            onClick={generateStatistics}
            variant="contained"
            sx={{
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4)',
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            생성
          </Button>
        </DialogActions>
      </Dialog>


      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      </div> {/* 3페이지 닫기 */}
      </div> {/* statistics-container 닫기 */}
    </Box>
  );
};

export default StatisticsPage;
