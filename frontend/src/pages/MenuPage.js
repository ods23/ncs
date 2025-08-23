import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MenuPage = () => {
  const { menuId } = useParams();
  const { user } = useAuth();
  const [menu, setMenu] = useState(null);
  const [screens, setScreens] = useState([]);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // 메뉴 정보 가져오기
        const menuResponse = await api.get(`/api/menus/${menuId}`);
        setMenu(menuResponse.data);

        // 메뉴에 연결된 화면들 가져오기
        const screensResponse = await api.get(`/api/menus/${menuId}/screens`);
        setScreens(screensResponse.data);
      } catch (error) {
        console.error('메뉴 데이터 가져오기 실패:', error);
      }
    };

    if (menuId) {
      fetchMenuData();
    }
  }, [menuId]);

  if (!menu) {
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
        {menu.menu_name}
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            메뉴 정보
          </Typography>
          <Typography variant="body1">
            메뉴명: {menu.menu_name}
          </Typography>
          <Typography variant="body1">
            순서: {menu.menu_order}
          </Typography>
          <Typography variant="body1">
            부서: {menu.department || '미지정'}
          </Typography>
          <Typography variant="body1">
            활성화: {menu.is_active ? '활성' : '비활성'}
          </Typography>
        </Paper>
      </Box>

      {screens.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              연결된 화면 목록
            </Typography>
            {screens.map((screen, index) => (
              <Box key={screen.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {index + 1}. {screen.screen_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  화면경로: {screen.screen_path}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  컴포넌트명: {screen.component_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  순서: {screen.screen_order}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default MenuPage; 