import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Event as EventIcon,
  School as SchoolIcon,
  TransferWithinAStation as TransferIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todayEvents, setTodayEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [quickStats, setQuickStats] = useState({
    newComers: 0,
    transferBelievers: 0,
    graduates: 0,
    totalEvents: 0
  });

  useEffect(() => {
    // 임시 데이터 로드 (실제로는 API에서 가져올 예정)
    const mockTodayEvents = [
      {
        id: 1,
        title: '새가족 교육',
        time: '10:00 - 12:00',
        type: '교육',
        location: '교육실'
      },
      {
        id: 2,
        title: '목장 모임',
        time: '19:00 - 21:00',
        type: '일반',
        location: '각 목장'
      }
    ];

    const mockUpcomingEvents = [
      {
        id: 3,
        title: '수료식',
        date: '2024-01-25',
        type: '행사',
        location: '대예배실'
      },
      {
        id: 4,
        title: '새가족 환영회',
        date: '2024-01-28',
        type: '행사',
        location: '대예배실'
      },
      {
        id: 5,
        title: '목사님과의 만남',
        date: '2024-01-30',
        type: '일반',
        location: '목사님 사무실'
      }
    ];

    setTodayEvents(mockTodayEvents);
    setUpcomingEvents(mockUpcomingEvents);
    setQuickStats({
      newComers: 45,
      transferBelievers: 35,
      graduates: 20,
      totalEvents: 8
    });
  }, []);

  const getEventTypeColor = (type) => {
    switch (type) {
      case '교육': return '#388e3c';
      case '행사': return '#f57c00';
      case '회의': return '#7b1fa2';
      default: return '#1976d2';
    }
  };

  const renderQuickStats = () => (
    <Grid container spacing={3} sx={{ mb: 4 }}>
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
                  {quickStats.newComers}
                </Typography>
                <Typography variant="body2">
                  이번 달 초신자
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
                  {quickStats.transferBelievers}
                </Typography>
                <Typography variant="body2">
                  이번 달 전입신자
                </Typography>
              </Box>
              <TransferIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: 'warning.main', 
          color: 'white',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div">
                  {quickStats.graduates}
                </Typography>
                <Typography variant="body2">
                  이번 달 수료자
                </Typography>
              </Box>
              <SchoolIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          bgcolor: 'info.main', 
          color: 'white',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-4px)' }
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h4" component="div">
                  {quickStats.totalEvents}
                </Typography>
                <Typography variant="body2">
                  이번 주 일정
                </Typography>
              </Box>
              <EventIcon sx={{ fontSize: 40, opacity: 0.8 }} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderTodaySchedule = () => (
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon color="primary" />
            오늘의 일정
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/schedule')}
            sx={{ borderRadius: '20px' }}
          >
            전체보기
          </Button>
        </Box>
        {todayEvents.length > 0 ? (
          <List>
            {todayEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EventIcon sx={{ color: getEventTypeColor(event.type) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={`${event.time} | ${event.location}`}
                  />
                  <Chip 
                    label={event.type} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getEventTypeColor(event.type),
                      color: 'white'
                    }} 
                  />
                </ListItem>
                {index < todayEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              오늘 예정된 일정이 없습니다.
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );

  const renderUpcomingEvents = () => (
    <Grid item xs={12} md={6}>
      <Paper sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="primary" />
            예정된 일정
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/schedule')}
            sx={{ borderRadius: '20px' }}
          >
            전체보기
          </Button>
        </Box>
        {upcomingEvents.length > 0 ? (
          <List>
            {upcomingEvents.map((event, index) => (
              <React.Fragment key={event.id}>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <EventIcon sx={{ color: getEventTypeColor(event.type) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={`${event.date} | ${event.location}`}
                  />
                  <Chip 
                    label={event.type} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getEventTypeColor(event.type),
                      color: 'white'
                    }} 
                  />
                </ListItem>
                {index < upcomingEvents.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              예정된 일정이 없습니다.
            </Typography>
          </Box>
        )}
      </Paper>
    </Grid>
  );

  const renderQuickActions = () => (
    <Grid item xs={12}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          빠른 메뉴
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/schedule')}
              sx={{ 
                py: 2, 
                borderRadius: '12px',
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CalendarIcon />
                <Typography variant="body2">일정 관리</Typography>
              </Box>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/statistics')}
              sx={{ 
                py: 2, 
                borderRadius: '12px',
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  backgroundColor: 'success.main',
                  color: 'white'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon />
                <Typography variant="body2">통계 보기</Typography>
              </Box>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/new-comers')}
              sx={{ 
                py: 2, 
                borderRadius: '12px',
                borderColor: 'warning.main',
                color: 'warning.main',
                '&:hover': {
                  backgroundColor: 'warning.main',
                  color: 'white'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <PeopleIcon />
                <Typography variant="body2">초신자 관리</Typography>
              </Box>
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/transfer-believers')}
              sx={{ 
                py: 2, 
                borderRadius: '12px',
                borderColor: 'info.main',
                color: 'info.main',
                '&:hover': {
                  backgroundColor: 'info.main',
                  color: 'white'
                }
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <TransferIcon />
                <Typography variant="body2">전입신자 관리</Typography>
              </Box>
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          새가족관리시스템 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary">
          안녕하세요, {user?.name}님! 오늘도 새가족 관리에 힘써주세요.
        </Typography>
      </Box>

      {renderQuickStats()}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {renderTodaySchedule()}
        {renderUpcomingEvents()}
      </Grid>

      {renderQuickActions()}
    </Container>
  );
};

export default DashboardPage;

