import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Alert
} from '@mui/material';
import { 
  Lock as LockIcon,
  Login as LoginIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={24} 
          sx={{ 
            p: 2, 
            width: '100%',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center'
          }}
        >
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                boxShadow: '0 6px 20px rgba(255, 107, 107, 0.3)'
              }}
            >
              <LockIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            
            <Typography 
              component="h1" 
              variant="h5" 
              sx={{ 
                mb: 1,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              접근 권한이 없습니다
            </Typography>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 2, fontSize: '14px' }}
            >
              이 페이지에 접근하려면 로그인이 필요합니다.
            </Typography>
          </Box>
          
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ 
              mb: 2, 
              borderRadius: 2,
              fontSize: '14px',
              '& .MuiAlert-icon': {
                color: '#ff6b6b'
              }
            }}
          >
            로그아웃되었거나 세션이 만료되었습니다.
          </Alert>
          
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            startIcon={<LoginIcon />}
            sx={{ 
              py: 1.2,
              px: 3,
              fontSize: '15px',
              fontWeight: 600,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            로그인하기
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default UnauthorizedPage; 