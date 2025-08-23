import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const MyPageWithSidebar = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        마이페이지
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              사용자 정보
            </Typography>
            <Typography variant="body1">
              이름: {user?.name}
            </Typography>
            <Typography variant="body1">
              이메일: {user?.email}
            </Typography>
            <Typography variant="body1">
              역할: {user?.role}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              활동 내역
            </Typography>
            <Typography variant="body1">
              로그인 시간: {new Date().toLocaleString()}
            </Typography>
            <Typography variant="body1">
              마지막 접속: {new Date().toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MyPageWithSidebar; 