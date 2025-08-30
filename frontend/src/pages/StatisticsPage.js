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
      {/* 헤더 */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
          📊 년도별 새가족 전체 통계
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadStatistics}
            disabled={loading}
            sx={{ mr: 1 }}
          >
            새로고침
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }
            }}
          >
            통계 추가
          </Button>
        </Box>
      </Box>

      {/* 년도 필터 */}
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>년도 필터</InputLabel>
          <Select
            value={selectedYear}
            label="년도 필터"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="">전체 년도</MenuItem>
            {Array.from(new Set(statistics.map(stat => stat.year))).sort((a, b) => b - a).map(year => (
              <MenuItem key={year} value={year}>{year}년</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>총 등록</Typography>
                  <Typography variant="h4">
                    {filteredStatistics.reduce((sum, stat) => sum + stat.total_registration, 0)}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>총 수료</Typography>
                  <Typography variant="h4">
                    {filteredStatistics.reduce((sum, stat) => sum + stat.total_graduate, 0)}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>교육 중</Typography>
                  <Typography variant="h4">
                    {filteredStatistics.reduce((sum, stat) => sum + stat.total_education, 0)}
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>관리 년도</Typography>
                  <Typography variant="h4">
                    {filteredStatistics.length}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 통계 테이블 */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>년도</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>초신자 등록</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>전입신자 등록</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>등록 합계</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>초신자 수료</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>전입신자 수료</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>수료 합계</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>교육 중</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>교육 합계</TableCell>
                <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f8fafc' }}>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStatistics.map((stat) => (
                <TableRow key={stat.id} hover>
                  <TableCell>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1f2937' }}>
                      {stat.year}년
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.new_comer_registration} 
                      color="primary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.transfer_believer_registration} 
                      color="secondary" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.total_registration} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.new_comer_graduate_total} 
                      color="primary" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.transfer_believer_graduate_total} 
                      color="secondary" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.total_graduate} 
                      color="success" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.total_education} 
                      color="warning" 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={stat.total_education + stat.total_graduate} 
                      color="info" 
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="자동 계산" arrow>
                        <IconButton
                          size="small"
                          onClick={() => calculateStatistics(stat.year)}
                          sx={{ color: '#10b981' }}
                        >
                          <CalculateIcon />
                        </IconButton>
                      </Tooltip>
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
      >
        <DialogTitle>
          {editingStat ? `${editingStat.year}년 통계 수정` : '새 통계 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="년도"
                type="number"
                value={formData.year}
                onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                disabled={!!editingStat}
                sx={{ mb: 2 }}
              />
            </Grid>
            
            {/* 초신자 관련 필드 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#3b82f6' }}>초신자</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 수"
                type="number"
                value={formData.new_comer_registration}
                onChange={(e) => handleFormChange('new_comer_registration', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="전년도 수료"
                type="number"
                value={formData.new_comer_graduate_prev_year}
                onChange={(e) => handleFormChange('new_comer_graduate_prev_year', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="올해 수료"
                type="number"
                value={formData.new_comer_graduate_current_year}
                onChange={(e) => handleFormChange('new_comer_graduate_current_year', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중"
                type="number"
                value={formData.new_comer_education_in_progress}
                onChange={(e) => handleFormChange('new_comer_education_in_progress', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중단"
                type="number"
                value={formData.new_comer_education_discontinued}
                onChange={(e) => handleFormChange('new_comer_education_discontinued', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.new_comer_education_total}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>

            {/* 전입신자 관련 필드 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#8b5cf6' }}>전입신자</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 수"
                type="number"
                value={formData.transfer_believer_registration}
                onChange={(e) => handleFormChange('transfer_believer_registration', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="전년도 수료"
                type="number"
                value={formData.transfer_believer_graduate_prev_year}
                onChange={(e) => handleFormChange('transfer_believer_graduate_prev_year', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="올해 수료"
                type="number"
                value={formData.transfer_believer_graduate_current_year}
                onChange={(e) => handleFormChange('transfer_believer_graduate_current_year', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중"
                type="number"
                value={formData.transfer_believer_education_in_progress}
                onChange={(e) => handleFormChange('transfer_believer_education_in_progress', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 중단"
                type="number"
                value={formData.transfer_believer_education_discontinued}
                onChange={(e) => handleFormChange('transfer_believer_education_discontinued', parseInt(e.target.value) || 0)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.transfer_believer_education_total}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>

            {/* 합계 필드 */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, color: '#10b981' }}>합계</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="등록 합계"
                type="number"
                value={formData.total_registration}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="수료 합계"
                type="number"
                value={formData.total_graduate}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="교육 합계"
                type="number"
                value={formData.total_education}
                InputProps={{ readOnly: true }}
                sx={{ backgroundColor: '#f8fafc' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button 
            onClick={saveStatistics}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }
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
