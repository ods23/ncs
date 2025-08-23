import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const AdminPage = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        관리자 페이지
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          관리자 정보
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
      
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          시스템 정보
        </Typography>
        <Typography variant="body1">
          새가족관리시스템 v1.0
        </Typography>
        <Typography variant="body1">
          개발자: 관리자
        </Typography>
      </Paper>
    </Container>
  );
};

export default AdminPage; 