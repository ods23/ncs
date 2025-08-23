import React from 'react';
import { Container, Typography, Box, Grid, Card, CardContent, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { title: '초신자관리', path: '/believers', description: '초신자 정보를 관리합니다.' },
    { title: '전입신자관리', path: '/transfer-believers', description: '전입신자 정보를 관리합니다.' },
    { title: '새가족전체', path: '/all-believers', description: '전체 신자 정보를 조회합니다.' },
    { title: '초신자수료자', path: '/graduates', description: '초신자 수료자 정보를 관리합니다.' },
    { title: '전입신자수료자', path: '/transfer-graduates', description: '전입신자 수료자 정보를 관리합니다.' },
    { title: '사용자관리', path: '/users', description: '시스템 사용자를 관리합니다.' },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4, textAlign: 'center' }}>
        새가족관리시스템
      </Typography>
      
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        안녕하세요, {user?.name}님!
      </Typography>
      
      <Grid container spacing={3}>
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.path}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: '12px',
                    padding: '10px 24px',
                    fontWeight: '600',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                >
                  이동
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default HomePage; 