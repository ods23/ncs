import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ScreenPage = () => {
  const { screenId } = useParams();
  const { user } = useAuth();
  const [screen, setScreen] = useState(null);

  useEffect(() => {
    const fetchScreenData = async () => {
      try {
        const response = await api.get(`/api/screens/${screenId}`);
        setScreen(response.data);
      } catch (error) {
        console.error('화면 데이터 가져오기 실패:', error);
      }
    };

    if (screenId) {
      fetchScreenData();
    }
  }, [screenId]);

  if (!screen) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          로딩 중...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {screen.screen_name}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            화면 정보
          </Typography>
          <Typography variant="body1">
            화면명: {screen.screen_name}
          </Typography>
          <Typography variant="body1">
            화면경로: {screen.screen_path}
          </Typography>
          <Typography variant="body1">
            컴포넌트명: {screen.component_name}
          </Typography>
          <Typography variant="body1">
            순서: {screen.screen_order}
          </Typography>
          <Typography variant="body1">
            활성화: {screen.is_active ? '활성' : '비활성'}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default ScreenPage; 