import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  TransferWithinAStation as TransferIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('데이터를 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('새가족위원회 현황 데이터 로드 실패:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStatsCards = () => {
    if (!dashboardData) return null;

    const { totals } = dashboardData;

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'success.main', 
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div">
                    {totals.totalNewComerRegistration}
                  </Typography>
                  <Typography variant="body2">
                    초신자 등록자
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div">
                    {totals.totalTransferBelieverRegistration}
                  </Typography>
                  <Typography variant="body2">
                    전입신자 등록자
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'success.main', 
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div">
                    {totals.totalNewComerGraduate}
                  </Typography>
                  <Typography variant="body2">
                    초신자 수료자
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            transition: 'transform 0.2s',
            '&:hover': { transform: 'translateY(-4px)' }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" component="div">
                    {totals.totalTransferBelieverGraduate}
                  </Typography>
                  <Typography variant="body2">
                    전입신자 수료자
                  </Typography>
                </Box>
                <SchoolIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderYearlyRegistrationChart = () => {
    if (!dashboardData || !dashboardData.yearlyChartData) return null;

    return (
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 1, height: '300px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            년도별 등록자 현황 (최근 10년)
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dashboardData.yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerRegistration' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label}년 등록자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerRegistration' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '5px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerRegistration" 
                stroke="#2e7d32" 
                strokeWidth={3}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="newComerRegistration"
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverRegistration" 
                stroke="#1976d2" 
                strokeWidth={3}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="transferBelieverRegistration"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  const renderRegistrationChart = () => {
    if (!dashboardData) return null;

    return (
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 1, height: '400px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            월별 등록자 현황 ({dashboardData.year}년)
          </Typography>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={dashboardData.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerRegistration' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label} 등록자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerRegistration' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '5px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerRegistration" 
                stroke="#2e7d32" 
                strokeWidth={3}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="newComerRegistration"
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverRegistration" 
                stroke="#1976d2" 
                strokeWidth={3}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="transferBelieverRegistration"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  const renderYearlyGraduateChart = () => {
    if (!dashboardData || !dashboardData.yearlyChartData) return null;

    return (
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 1, height: '300px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <SchoolIcon color="primary" />
            년도별 수료자 현황 (최근 10년)
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={dashboardData.yearlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerGraduate' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label}년 수료자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerGraduate' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '5px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerGraduate" 
                stroke="#2e7d32" 
                strokeWidth={3}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="newComerGraduate"
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverGraduate" 
                stroke="#1976d2" 
                strokeWidth={3}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="transferBelieverGraduate"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  const renderGraduateChart = () => {
    if (!dashboardData) return null;

    return (
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 1, height: '400px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <SchoolIcon color="primary" />
            월별 수료자 현황 ({dashboardData.year}년)
          </Typography>
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={dashboardData.chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthName" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerGraduate' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label} 수료자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerGraduate' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '10px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerGraduate" 
                stroke="#2e7d32" 
                strokeWidth={3}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="newComerGraduate"
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverGraduate" 
                stroke="#1976d2" 
                strokeWidth={3}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="transferBelieverGraduate"
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  const renderDailyRegistrationChart = () => {
    if (!dashboardData || !dashboardData.dailyChartData || dashboardData.dailyChartData.length === 0) return null;

    return (
      <Grid item xs={12}>
        <Paper sx={{ p: 1, height: '540px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon color="primary" />
            일별 등록자 현황 ({dashboardData.year}년)
          </Typography>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={dashboardData.dailyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerRegistration' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label} 등록자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerRegistration' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '0px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerRegistration" 
                stroke="#2e7d32" 
                strokeWidth={2}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="newComerRegistration"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverRegistration" 
                stroke="#1976d2" 
                strokeWidth={2}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="transferBelieverRegistration"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  const renderDailyGraduateChart = () => {
    if (!dashboardData || !dashboardData.dailyChartData || dashboardData.dailyChartData.length === 0) return null;

    return (
      <Grid item xs={12}>
        <Paper sx={{ p: 1, height: '540px' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <SchoolIcon color="primary" />
            일별 수료자 현황 ({dashboardData.year}년)
          </Typography>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={dashboardData.dailyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 9 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [value, name === 'newComerGraduate' ? '초신자' : '전입신자']}
                labelFormatter={(label) => `${label} 수료자`}
              />
              <Legend 
                formatter={(value) => value === 'newComerGraduate' ? '초신자' : '전입신자'}
                wrapperStyle={{ paddingTop: '0px' }}
              />
              <Line 
                type="monotone" 
                dataKey="newComerGraduate" 
                stroke="#2e7d32" 
                strokeWidth={2}
                dot={{ fill: '#2e7d32', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="newComerGraduate"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="transferBelieverGraduate" 
                stroke="#1976d2" 
                strokeWidth={2}
                dot={{ fill: '#1976d2', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5 }}
                name="transferBelieverGraduate"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            새가족위원회 현황 데이터를 불러오는 중...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" color="text.secondary">
          안녕하세요, {user?.name}님! {dashboardData?.year}년 새가족위원회 현황을 확인해보세요.
        </Typography>
      </Box>

      {renderStatsCards()}

      {/* 년도별 현황 섹션 */}
      {dashboardData && dashboardData.yearlyChartData && dashboardData.yearlyChartData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            년도별 현황 (최근 10년)
          </Typography>
          
          <Grid container spacing={3}>
            {renderYearlyRegistrationChart()}
            {renderYearlyGraduateChart()}
          </Grid>
        </Box>
      )}

      {/* 월별 현황 섹션 */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUpIcon color="primary" />
          월별 현황 ({dashboardData?.year}년)
        </Typography>
        
        <Grid container spacing={3}>
          {renderRegistrationChart()}
          {renderGraduateChart()}
        </Grid>
      </Box>

      {/* 일별 현황 섹션 */}
      {dashboardData && dashboardData.dailyChartData && dashboardData.dailyChartData.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            일별 상세 현황
          </Typography>
          
          <Grid container spacing={3}>
            {renderDailyRegistrationChart()}
          </Grid>
          
          <Grid container spacing={3} sx={{ mt: 2 }}>
            {renderDailyGraduateChart()}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default DashboardPage;