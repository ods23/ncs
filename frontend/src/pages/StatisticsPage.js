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
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

const StatisticsPage = () => {
  const [statistics, setStatistics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStat, setEditingStat] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
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

  // 통계 데이터 로드
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/statistics', {
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

  // 자동 통계 계산
  const calculateStatistics = async (year) => {
    try {
      const response = await fetch(`/api/statistics/calculate/${year}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        showSnackbar(data.message, 'success');
        loadStatistics(); // 데이터 새로고침
      } else {
        throw new Error('통계 계산에 실패했습니다.');
      }
    } catch (error) {
      console.error('통계 계산 실패:', error);
      showSnackbar('통계 계산에 실패했습니다.', 'error');
    }
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
    loadStatistics();
  }, []);

  // 년도별 필터링
  const filteredStatistics = selectedYear 
    ? statistics.filter(stat => stat.year.toString().includes(selectedYear))
    : statistics;

  return (
    <Box sx={{ p: 3 }}>

      {/* 조회조건, 버튼 및 요약 카드 */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
        <FormControl size="small" sx={{ width: 120 }}>
          <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>년도</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
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
            <MenuItem value="">전체</MenuItem>
            {Array.from(new Set(statistics.map(stat => stat.year))).sort((a, b) => b - a).map(year => (
              <MenuItem key={year} value={year}>{year}년</MenuItem>
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

        {/* 요약 카드들 */}
        <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
          {/* 총 등록 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', 
            borderRadius: 3, 
            p: 2, 
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
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>총 등록</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '22px', lineHeight: 1 }}>
                {filteredStatistics.reduce((sum, stat) => sum + stat.total_registration, 0)}
              </Typography>
            </Box>
            <PeopleIcon sx={{ fontSize: 20, opacity: 0.8, color: '#93c5fd' }} />
          </Box>

          {/* 총 수료 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
            borderRadius: 3, 
            p: 2, 
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
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>총 수료</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '22px', lineHeight: 1 }}>
                {filteredStatistics.reduce((sum, stat) => sum + stat.total_graduate, 0)}
              </Typography>
            </Box>
            <CheckCircleIcon sx={{ fontSize: 20, opacity: 0.8, color: '#86efac' }} />
          </Box>

          {/* 관리 년도 카드 */}
          <Box sx={{ 
            flex: 1, 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
            borderRadius: 3, 
            p: 2, 
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
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '16px' }}>관리 년도</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: '22px', lineHeight: 1 }}>
                {filteredStatistics.length}
              </Typography>
            </Box>
            <TrendingUpIcon sx={{ fontSize: 20, opacity: 0.8, color: '#c4b5fd' }} />
          </Box>
        </Box>
      </Box>

      {/* 통계 테이블 */}
      <Paper sx={{ width: '100%', overflow: 'auto' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader sx={{ border: '1px solid #e5e7eb' }}>
            <TableHead>
              {/* 메인 헤더 행 */}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 1, border: '1px solid #e5e7eb', borderRight: '3px solid #6b7280' }} rowSpan={3}>년도</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 1, border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af' }} colSpan={3}>등록</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 1, border: '1px solid #e5e7eb', borderRight: '3px solid #059669' }} colSpan={7}>수료</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 1, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b' }} colSpan={7}>교육</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 1, border: '1px solid #e5e7eb' }}>작업</TableCell>
              </TableRow>
              
              {/* 서브 헤더 행 */}
              <TableRow>
                {/* 등록 서브헤더 */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }} rowSpan={2}>초신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }} rowSpan={2}>전입신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af' }} rowSpan={2}>합계</TableCell>
                
                {/* 수료 서브헤더 */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }} colSpan={3}>초신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #059669' }} colSpan={3}>전입신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #059669' }} rowSpan={2}>합계</TableCell>
                
                {/* 교육 서브헤더 */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }} colSpan={3}>초신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b' }} colSpan={3}>전입신자</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b' }} rowSpan={2}>합계</TableCell>
                
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb' }}>
                  {/* 작업 칼럼은 비어있음 */}
                </TableCell>
              </TableRow>
              
              {/* 상세 헤더 행 */}
              <TableRow>
                {/* 수료 상세헤더 */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>전년도</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>올해</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>합계</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>전년도</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>올해</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>합계</TableCell>
                
                {/* 교육 상세헤더 */}
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>교육중</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>교육중단</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>합계</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>교육중</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>교육중단</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>합계</TableCell>
                
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc', textAlign: 'center', py: 0.5, border: '1px solid #e5e7eb' }}>수정/삭제</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStatistics.map((stat) => (
                <TableRow key={stat.year} hover>
                  {/* 년도 */}
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#dbeafe', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '3px solid #6b7280' }}>
                    {stat.year}
                  </TableCell>
                  
                  {/* 등록 섹션 */}
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_registration} 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_registration} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#dbeafe', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '3px solid #1e40af' }}>
                    <Chip 
                      label={stat.total_registration} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  
                  {/* 수료 섹션 */}
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_graduate_prev_year} 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_graduate_current_year} 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#dcfce7', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_graduate_total} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_graduate_prev_year} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_graduate_current_year} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#dcfce7', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_graduate_total} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#bbf7d0', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '3px solid #059669' }}>
                    <Chip 
                      label={stat.total_graduate} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  
                  {/* 교육 섹션 */}
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_education_in_progress} 
                      color="warning" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_education_discontinued} 
                      color="warning" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fef3c7', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.new_comer_education_total} 
                      color="warning" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_education_in_progress} 
                      color="warning" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_education_discontinued} 
                      color="warning" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fef3c7', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '1px solid #94a3b8' }}>
                    <Chip 
                      label={stat.transfer_believer_education_total} 
                      color="warning" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#fde68a', textAlign: 'center', border: '1px solid #e5e7eb', borderRight: '3px solid #f59e0b' }}>
                    <Chip 
                      label={stat.total_education} 
                      color="warning" 
                      variant="filled"
                    />
                  </TableCell>
                  
                  {/* 작업 칼럼 */}
                  <TableCell sx={{ textAlign: 'center', border: '1px solid #e5e7eb' }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="수정" arrow>
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(stat)}
                          sx={{ color: '#3b82f6' }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제" arrow>
                        <IconButton
                          size="small"
                          onClick={() => deleteStatistics(stat.year)}
                          sx={{ color: '#ef4444' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
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
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3b82f6' }}>
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
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8b5cf6' }}>
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
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#10b981' }}>
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
    </Box>
  );
};

export default StatisticsPage;
