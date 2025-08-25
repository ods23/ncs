import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const SchedulePage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: '일반',
    location: ''
  });

  const appointmentTypes = [
    { value: '일반', color: '#1976d2' },
    { value: '교육', color: '#388e3c' },
    { value: '행사', color: '#f57c00' },
    { value: '회의', color: '#7b1fa2' }
  ];

  useEffect(() => {
    // 임시 데이터 로드 (실제로는 API에서 가져올 예정)
    const mockAppointments = [
      {
        id: 1,
        title: '새가족 교육',
        description: '새가족 교육 프로그램',
        startDate: new Date(2024, 0, 15, 10, 0),
        endDate: new Date(2024, 0, 15, 12, 0),
        type: '교육',
        location: '교육실'
      },
      {
        id: 2,
        title: '목장 모임',
        description: '목장별 모임',
        startDate: new Date(2024, 0, 20, 19, 0),
        endDate: new Date(2024, 0, 20, 21, 0),
        type: '일반',
        location: '각 목장'
      },
      {
        id: 3,
        title: '수료식',
        description: '새가족 수료식',
        startDate: new Date(2024, 0, 25, 14, 0),
        endDate: new Date(2024, 0, 25, 16, 0),
        type: '행사',
        location: '대예배실'
      }
    ];
    setAppointments(mockAppointments);
  }, []);

  const handleAddAppointment = () => {
    setEditingAppointment(null);
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      type: '일반',
      location: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      title: appointment.title,
      description: appointment.description,
      startDate: appointment.startDate.toISOString().slice(0, 16),
      endDate: appointment.endDate.toISOString().slice(0, 16),
      type: appointment.type,
      location: appointment.location
    });
    setIsDialogOpen(true);
  };

  const handleSaveAppointment = () => {
    if (editingAppointment) {
      // 수정
      setAppointments(prev => prev.map(app => 
        app.id === editingAppointment.id 
          ? { ...app, ...formData, startDate: new Date(formData.startDate), endDate: new Date(formData.endDate) }
          : app
      ));
    } else {
      // 추가
      const newAppointment = {
        id: Date.now(),
        ...formData,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate)
      };
      setAppointments(prev => [...prev, newAppointment]);
    }
    setIsDialogOpen(false);
  };

  const handleDeleteAppointment = (appointmentId) => {
    setAppointments(prev => prev.filter(app => app.id !== appointmentId));
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getEventTypeColor = (type) => {
    return appointmentTypes.find(t => t.value === type)?.color || '#1976d2';
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    }).format(date);
  };

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderCalendarView = () => {
    const currentMonth = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayOfWeek = currentMonth.getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= lastDay; day++) {
      days.push(day);
    }

    const monthAppointments = appointments.filter(app => {
      const appDate = new Date(app.startDate);
      return appDate.getFullYear() === selectedYear && appDate.getMonth() === selectedMonth - 1;
    });

    return (
      <Grid container spacing={1}>
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <Grid item xs={12/7} key={day}>
            <Paper sx={{ 
              p: 1, 
              textAlign: 'center', 
              bgcolor: 'primary.main', 
              color: 'white',
              fontWeight: 'bold'
            }}>
              {day}
            </Paper>
          </Grid>
        ))}
        {days.map((day, index) => {
          const dayAppointments = monthAppointments.filter(app => {
            const appDate = new Date(app.startDate);
            return appDate.getDate() === day;
          });

          return (
            <Grid item xs={12/7} key={index}>
              <Paper sx={{ 
                p: 1, 
                minHeight: '80px',
                bgcolor: day ? 'background.paper' : 'grey.100',
                border: day === new Date().getDate() && 
                         selectedMonth === new Date().getMonth() + 1 && 
                         selectedYear === new Date().getFullYear() 
                         ? '2px solid #1976d2' : '1px solid #e0e0e0'
              }}>
                {day && (
                  <>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {day}
                    </Typography>
                    {dayAppointments.map(app => (
                      <Chip
                        key={app.id}
                        label={app.title}
                        size="small"
                        sx={{
                          fontSize: '10px',
                          height: '20px',
                          bgcolor: getEventTypeColor(app.type),
                          color: 'white',
                          mb: 0.5,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleEditAppointment(app)}
                      />
                    ))}
                  </>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderListView = () => {
    const sortedAppointments = [...appointments].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
    return (
      <List>
        {sortedAppointments.map((appointment, index) => (
          <React.Fragment key={appointment.id}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon>
                <EventIcon sx={{ color: getEventTypeColor(appointment.type) }} />
              </ListItemIcon>
              <ListItemText
                primary={appointment.title}
                secondary={
                  <Box>
                    <Typography variant="body2" component="span">
                      {formatDate(appointment.startDate)} {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
                    </Typography>
                    <br />
                    <Typography variant="body2" component="span" color="text.secondary">
                      {appointment.description}
                    </Typography>
                    {appointment.location && (
                      <>
                        <br />
                        <Typography variant="body2" component="span" color="text.secondary">
                          📍 {appointment.location}
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                <Chip 
                  label={appointment.type} 
                  size="small" 
                  sx={{ 
                    backgroundColor: getEventTypeColor(appointment.type),
                    color: 'white'
                  }} 
                />
                <Box>
                  <IconButton 
                    size="small" 
                    onClick={() => handleEditAppointment(appointment)}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteAppointment(appointment.id)}
                    sx={{ color: 'error.main' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </ListItem>
            {index < sortedAppointments.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    );
  };

  const renderTodayView = () => {
    const today = new Date();
    const todayAppointments = appointments.filter(app => {
      const appDate = new Date(app.startDate);
      return appDate.toDateString() === today.toDateString();
    });

    if (todayAppointments.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            오늘 예정된 일정이 없습니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            새로운 일정을 추가해보세요
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={2}>
        {todayAppointments.map(appointment => (
          <Grid item xs={12} md={6} key={appointment.id}>
            <Card sx={{ 
              borderLeft: `4px solid ${getEventTypeColor(appointment.type)}`,
              '&:hover': { boxShadow: 4 }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" component="h3">
                    {appointment.title}
                  </Typography>
                  <Chip 
                    label={appointment.type} 
                    size="small" 
                    sx={{ 
                      backgroundColor: getEventTypeColor(appointment.type),
                      color: 'white'
                    }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {appointment.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2">
                    {formatTime(appointment.startDate)} - {formatTime(appointment.endDate)}
                  </Typography>
                </Box>
                {appointment.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {appointment.location}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          일정 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddAppointment}
          sx={{
            borderRadius: '12px',
            padding: '10px 24px',
            fontWeight: '600',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
            }
          }}
        >
          일정 추가
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>연도</InputLabel>
          <Select
            value={selectedYear}
            label="연도"
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
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
          <Tab label="캘린더" />
          <Tab label="목록" />
          <Tab label="오늘" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {currentTab === 0 && renderCalendarView()}
          {currentTab === 1 && renderListView()}
          {currentTab === 2 && renderTodayView()}
        </Box>
      </Paper>

      {/* 일정 추가/수정 다이얼로그 */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingAppointment ? '일정 수정' : '일정 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="제목"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              fullWidth
              required
            />
            <TextField
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="시작일시"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="종료일시"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="장소"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="일정 유형"
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              fullWidth
            >
              {appointmentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.value}
                </option>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>취소</Button>
          <Button onClick={handleSaveAppointment} variant="contained">
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SchedulePage;
