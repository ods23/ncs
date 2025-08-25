import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const StatisticsPage = () => {
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 통계 데이터
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [ageGroupData, setAgeGroupData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [summaryData, setSummaryData] = useState({});

  // 사용자 인증 상태 확인
  useEffect(() => {
    if (!user) {
      setError('로그인이 필요합니다. 먼저 로그인해주세요.');
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 연도별 통계
        const yearlyResponse = await api.get('/api/statistics/yearly');
        setYearlyData(yearlyResponse.data || []);
        
        // 월별 통계
        const monthlyResponse = await api.get(`/api/statistics/monthly?year=${selectedYear}`);
        setMonthlyData(monthlyResponse.data || []);
        
        // 연령대별 통계
        const ageGroupResponse = await api.get(`/api/statistics/age-group?year=${selectedYear}`);
        setAgeGroupData(ageGroupResponse.data || []);
        
        // 주별 통계
        const weeklyResponse = await api.get(`/api/statistics/weekly?year=${selectedYear}&month=${selectedMonth}`);
        setWeeklyData(weeklyResponse.data || []);
        
        // 요약 통계
        const summaryResponse = await api.get(`/api/statistics/summary?year=${selectedYear}&month=${selectedMonth}`);
        setSummaryData(summaryResponse.data || {});
        
      } catch (err) {
        console.error('통계 데이터 로드 실패:', err);
        setError('통계 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear, selectedMonth, user]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // PDF 다운로드 함수
  const handlePdfDownload = async (pageType) => {
    try {
      const response = await api.get(`/api/statistics/pdf/${pageType}?year=${selectedYear}&month=${selectedMonth}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${pageType}_statistics_${selectedYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      setError('PDF 다운로드에 실패했습니다.');
    }
  };

  // 페이지 1: 전체 현황 요약
  const renderOverallSummary = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">연도별 전체 등록자/수료자 현황</Typography>
          <Tooltip title="PDF 다운로드">
            <IconButton onClick={() => handlePdfDownload('overall')} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="total_registered" fill="#8884d8" name="등록자" />
              <Bar dataKey="total_completed" fill="#82ca9d" name="수료자" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>현재 연도 요약</Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              등록자: {summaryData.yearly?.total_registered || 0}명
            </Typography>
            <Typography variant="body1">
              수료자: {summaryData.yearly?.total_completed || 0}명
            </Typography>
          </Box>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>연도별 상세 통계</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>연도</TableCell>
                  <TableCell align="right">초신자 등록</TableCell>
                  <TableCell align="right">전입신자 등록</TableCell>
                  <TableCell align="right">총 등록</TableCell>
                  <TableCell align="right">초신자 수료</TableCell>
                  <TableCell align="right">전입신자 수료</TableCell>
                  <TableCell align="right">총 수료</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearlyData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}년</TableCell>
                    <TableCell align="right">{row.new_believers_registered}</TableCell>
                    <TableCell align="right">{row.transfer_believers_registered}</TableCell>
                    <TableCell align="right">{row.total_registered}</TableCell>
                    <TableCell align="right">{row.new_believers_completed}</TableCell>
                    <TableCell align="right">{row.transfer_believers_completed}</TableCell>
                    <TableCell align="right">{row.total_completed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  // 페이지 2: 연도별 상세 분석
  const renderYearlyAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">2019~2025년 새가족 등록현황 보고서</Typography>
          <Tooltip title="PDF 다운로드">
            <IconButton onClick={() => handlePdfDownload('yearly')} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>등록, 수료, 교육 현황 상세</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>연도</TableCell>
                  <TableCell colSpan={3} align="center">등록</TableCell>
                  <TableCell colSpan={3} align="center">수료</TableCell>
                  <TableCell colSpan={3} align="center">교육</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="center">초신자</TableCell>
                  <TableCell align="center">전입신자</TableCell>
                  <TableCell align="center">합계</TableCell>
                  <TableCell align="center">초신자</TableCell>
                  <TableCell align="center">전입신자</TableCell>
                  <TableCell align="center">합계</TableCell>
                  <TableCell align="center">초신자</TableCell>
                  <TableCell align="center">전입신자</TableCell>
                  <TableCell align="center">합계</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {yearlyData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell>{row.year}년</TableCell>
                    <TableCell align="center">{row.new_believers_registered}</TableCell>
                    <TableCell align="center">{row.transfer_believers_registered}</TableCell>
                    <TableCell align="center">{row.total_registered}</TableCell>
                    <TableCell align="center">{row.new_believers_completed}</TableCell>
                    <TableCell align="center">{row.transfer_believers_completed}</TableCell>
                    <TableCell align="center">{row.total_completed}</TableCell>
                    <TableCell align="center">{row.new_believers_education_in_progress}</TableCell>
                    <TableCell align="center">{row.transfer_believers_education_in_progress}</TableCell>
                    <TableCell align="center">{row.total_education}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  // 페이지 3: 월별 현황
  const renderMonthlyStatus = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">2025년 월별 등록현황</Typography>
          <Tooltip title="PDF 다운로드">
            <IconButton onClick={() => handlePdfDownload('monthly')} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 3, height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="new_believers_registered" fill="#8884d8" name="초신자" />
              <Bar dataKey="transfer_believers_registered" fill="#82ca9d" name="전입신자" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>연령별 전체 등록자 비율</Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageGroupData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ age_group, total_count }) => `${age_group} ${total_count}명`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_count"
              >
                {ageGroupData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'][index % 7]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>월별 상세 통계</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>월</TableCell>
                  <TableCell align="right">초신자</TableCell>
                  <TableCell align="right">전입신자</TableCell>
                  <TableCell align="right">합계</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthlyData.map((row) => (
                  <TableRow key={row.month}>
                    <TableCell>{row.month}월</TableCell>
                    <TableCell align="right">{row.new_believers_registered}</TableCell>
                    <TableCell align="right">{row.transfer_believers_registered}</TableCell>
                    <TableCell align="right">{row.total_registered}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  // 페이지 4: 연령대별 분석
  const renderAgeGroupAnalysis = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">초신자 및 전입신자 등록자의 연령대별 현황</Typography>
          <Tooltip title="PDF 다운로드">
            <IconButton onClick={() => handlePdfDownload('age-group')} color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>초신자 등록자 비율</Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageGroupData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ age_group, new_believers_count }) => `${age_group} ${new_believers_count}명`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="new_believers_count"
              >
                {ageGroupData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'][index % 7]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 3, height: 400 }}>
          <Typography variant="h6" gutterBottom>전입신자 등록자 비율</Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={ageGroupData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ age_group, transfer_believers_count }) => `${age_group} ${transfer_believers_count}명`}
                outerRadius={80}
                fill="#82ca9d"
                dataKey="transfer_believers_count"
              >
                {ageGroupData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'][index % 7]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
      
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>연령대별 상세 통계</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>연령대</TableCell>
                  <TableCell align="right">초신자</TableCell>
                  <TableCell align="right">전입신자</TableCell>
                  <TableCell align="right">합계</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ageGroupData.map((row) => (
                  <TableRow key={row.age_group}>
                    <TableCell>{row.age_group}</TableCell>
                    <TableCell align="right">{row.new_believers_count}</TableCell>
                    <TableCell align="right">{row.transfer_believers_count}</TableCell>
                    <TableCell align="right">{row.total_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
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

  if (!user) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            로그인이 필요합니다
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            통계 페이지를 보려면 먼저 로그인해주세요.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        통계 대시보드
      </Typography>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>연도</InputLabel>
          <Select
            value={selectedYear}
            label="연도"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <MenuItem key={year} value={year}>{year}년</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>월</InputLabel>
          <Select
            value={selectedMonth}
            label="월"
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <MenuItem key={month} value={month}>{month}월</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={currentTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="전체 현황 요약" />
          <Tab label="연도별 상세 분석" />
          <Tab label="월별 현황" />
          <Tab label="연령대별 분석" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {currentTab === 0 && renderOverallSummary()}
          {currentTab === 1 && renderYearlyAnalysis()}
          {currentTab === 2 && renderMonthlyStatus()}
          {currentTab === 3 && renderAgeGroupAnalysis()}
        </Box>
      </Paper>
    </Container>
  );
};

export default StatisticsPage;
