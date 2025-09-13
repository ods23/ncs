import React, { useState, useEffect, useCallback } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import { 
  Home as HomeIcon, 
  AdminPanelSettings as AdminIcon, 
  Person as PersonIcon,
  Folder as FolderIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // PDF 모드 확인 (URL에 token 파라미터가 있으면 PDF 모드)
  const isPdfMode = new URLSearchParams(window.location.search).has('token');
  const [adminAnchorEl, setAdminAnchorEl] = useState(null);
  const [myPageAnchorEl, setMyPageAnchorEl] = useState(null);
  const [userMenus, setUserMenus] = useState([]);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [adminSystemExpanded, setAdminSystemExpanded] = useState(false);
  const [adminFileExpanded, setAdminFileExpanded] = useState(false);
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const openAdminMenu = Boolean(adminAnchorEl);
  const openMyPageMenu = Boolean(myPageAnchorEl);

  const handleAdminMenuOpen = (event) => {
    setAdminAnchorEl(event.currentTarget);
  };

  const handleAdminMenuClose = () => {
    setAdminAnchorEl(null);
  };

  const handleAdminMenuClick = (path) => {
    navigate(path);
    handleAdminMenuClose();
  };

  const handleMyPageMenuOpen = (event) => {
    setMyPageAnchorEl(event.currentTarget);
  };

  const handleMyPageMenuClose = () => {
    setMyPageAnchorEl(null);
  };

  // 메뉴 토글 함수
  const handleMenuToggle = (menuId) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      const menuIdStr = menuId.toString();
      
      if (newSet.has(menuIdStr)) {
        newSet.delete(menuIdStr);
      } else {
        newSet.add(menuIdStr);
      }
      return newSet;
    });
  };

  const handleMyPageMenuClick = (path) => {
    // MyPage 메뉴 자체를 클릭했을 때는 아무것도 하지 않음
    if (path === '/mypage') {
      handleMyPageMenuClose();
      return;
    }
    
    // 메뉴 자체를 클릭했을 때는 하위 화면을 토글
    if (path.includes('/menu/')) {
      const menuId = path.split('/menu/')[1];
      handleMenuToggle(menuId);
      return;
    }
    
    // 화면 클릭 시 화면등록에서 등록된 path 사용
    if (path.includes('/screen/')) {
      const screenId = path.split('/screen/')[1];
      
      // 화면등록에서 등록된 path 정보를 가져와서 사용
      const fetchScreenPath = async () => {
        try {
          const response = await api.get(`/api/screens/${screenId}`);
          if (response.data && response.data.screen_path) {
            navigate(response.data.screen_path);
          } else {
            navigate(path);
          }
        } catch (error) {
          console.error('화면 정보 가져오기 실패:', error);
          navigate(path);
        }
      };
      
      fetchScreenPath();
    } else {
      navigate(path);
    }
    handleMyPageMenuClose();
  };

  const handleLogout = async () => {
    await logout();
  };

  // 현재 페이지 제목 가져오기
  const getPageTitle = async (path) => {
    // 관리자 페이지는 하드코딩된 제목 사용
    if (path === '/admin/user-registration') return '사용자등록';
    if (path === '/admin/system-constants') return '시스템상수값관리';
    if (path === '/admin/code-registration') return '코드등록';
    if (path === '/admin/screen-registration') return '화면등록';
    if (path === '/admin/menu-registration') return '메뉴등록';
    if (path === '/admin/menu-user-registration') return '메뉴사용자등록';
    if (path === '/admin/file-management') return '공통파일관리';
    if (path === '/new-comer-graduate') return '초신자수료자관리';
    if (path === '/admin/transfer-believer-graduate') return '전입신자수료자관리';
    if (path === '/admin/all-graduate') return '수료전체조회';
    if (path === '/new-comers') return '초신자관리';
    if (path === '/transfer-believers') return '전입신자관리';
    if (path === '/new-comer-education') return '초신자교육관리';
    if (path === '/statistics') return '년도별 새가족 전체 통계';

    if (path === '/mypage') return 'MyPage';
    if (path === '/') return '대시보드';
    
    // 일반 화면은 화면등록에서 등록된 이름 사용
    console.log('화면등록에서 제목 조회 시도:', path);
    try {
      const response = await api.get(`/api/screens/path${path}`);
      console.log('API 응답:', response.data);
      if (response.data && response.data.screen_name) {
        console.log('화면 이름 찾음:', response.data.screen_name);
        return response.data.screen_name;
      }
    } catch (error) {
      console.error('화면 정보 가져오기 실패:', error);
    }
    
    return '';
  };

  // 사용자에게 등록된 메뉴 가져오기
  useEffect(() => {
    const fetchUserMenus = async () => {
      if (user && user.id) {
        try {
          const response = await api.get(`/api/user-menus/user/${user.id}`);
          setUserMenus(response.data);
        } catch (error) {
          console.error('사용자 메뉴 가져오기 실패:', error);
        }
      }
    };

    fetchUserMenus();
  }, [user]);

  // 페이지 제목 업데이트
  useEffect(() => {
    const updatePageTitle = async () => {
      console.log('페이지 제목 업데이트 중...', location.pathname);
      const title = await getPageTitle(location.pathname);
      console.log('가져온 제목:', title);
      setCurrentPageTitle(title);
    };

    updatePageTitle();
  }, [location.pathname]);

  const menuItems = [];

  // PDF 모드일 때는 헤더를 렌더링하지 않음
  if (isPdfMode) {
    return null;
  }

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1, 
        height: '50px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        minHeight: '50px', 
        height: '50px', 
        padding: '0 24px', 
        alignItems: 'center'
      }}>
        {/* 왼쪽 영역 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, height: '50px' }}>
          {/* 로고 */}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontSize: '24px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '-0.5px',
              transform: 'translateY(-10px)'
            }}
          >
            NCS
          </Typography>
          
          {/* 홈 버튼 */}
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            startIcon={<HomeIcon sx={{ fontSize: 14 }} />}
            sx={{ 
              fontSize: '12px',
              fontWeight: '600',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: '28px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'none',
              transform: 'translateY(-10px)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
                transform: 'translateY(-11px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.3)'
              }
            }}
          >
            홈
          </Button>
          

          

          
          {/* 관리자 버튼 */}
          {user && user.role === '관리자' && (
            <Button
              color="inherit"
              onClick={handleAdminMenuOpen}
              startIcon={<AdminIcon sx={{ fontSize: 14 }} />}
              sx={{ 
                fontSize: '12px',
                fontWeight: '600',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                height: '28px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'none',
                transform: 'translateY(-10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-11px)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }
              }}
            >
              관리자
            </Button>
          )}
          
          {/* MyPage 버튼 */}
          {user && userMenus.length > 0 && (
            <Button
              color="inherit"
              onClick={handleMyPageMenuOpen}
              startIcon={<PersonIcon sx={{ fontSize: 14 }} />}
              sx={{ 
                fontSize: '12px',
                fontWeight: '600',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                height: '28px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'none',
                transform: 'translateY(-10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-11px)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }
              }}
            >
              MyPage
            </Button>
          )}


          
          {/* MyPage 메뉴 */}
          <Menu
            anchorEl={myPageAnchorEl}
            open={openMyPageMenu}
            onClose={handleMyPageMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left',
            }}
            sx={{ 
              maxHeight: '400px',
              '& .MuiPaper-root': {
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                minWidth: '280px',
                padding: '8px 0',
                maxHeight: '400px',
                overflowY: 'auto'
              }
            }}
          >
            {userMenus.map((menu) => (
              <Box key={menu.id}>
                <MenuItem 
                  onClick={() => handleMyPageMenuClick(`/menu/${menu.id}`)}
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                      transform: 'translateX(4px) scale(1.02)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.2)'
                    },
                    '&:active': {
                      transform: 'translateX(4px) scale(0.98)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FolderIcon sx={{ 
                      fontSize: 16,
                      color: '#3b82f6',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                    }} />
                    {menu.menu_name}
                  </span>
                  <span style={{ 
                    fontSize: '12px',
                    color: '#3b82f6',
                    transition: 'transform 0.2s ease',
                    fontWeight: '500'
                  }}>
                    {expandedMenus.has(menu.id.toString()) ? '▼' : '▶'}
                  </span>
                </MenuItem>
                {expandedMenus.has(menu.id.toString()) && menu.screens && menu.screens.map((screen) => (
                  <MenuItem 
                    key={screen.id} 
                    onClick={() => handleMyPageMenuClick(`/screen/${screen.id}`)}
                    sx={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      pl: 4,
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderBottom: '1px solid rgba(0,0,0,0.03)',
                      py: 1.5,
                      px: 2,
                      margin: '0 8px 0 16px',
                      borderRadius: '12px',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                        transform: 'translateX(8px) scale(1.01)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.15)'
                      },
                      '&:active': {
                        transform: 'translateX(8px) scale(0.99)'
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <DescriptionIcon sx={{ 
                        fontSize: 14,
                        color: '#10b981',
                        filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                      }} />
                      {screen.screen_name}
                    </span>
                  </MenuItem>
                ))}
              </Box>
            ))}
          </Menu>
          
          {/* 관리자 메뉴 */}
          {user && user.role === '관리자' && (
            <Menu
              anchorEl={adminAnchorEl}
              open={openAdminMenu}
              onClose={handleAdminMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              sx={{ 
                '& .MuiPaper-root': {
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                  minWidth: '220px',
                  padding: '8px 0'
                }
              }}
            >
              <MenuItem 
                onClick={() => setAdminSystemExpanded(!adminSystemExpanded)} 
                sx={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  py: 1.5,
                  px: 2,
                  margin: '0 8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    transform: 'translateX(4px) scale(1.02)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  },
                  '&:active': {
                    transform: 'translateX(4px) scale(0.98)'
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderIcon sx={{ 
                    fontSize: 16,
                    color: '#3b82f6',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }} />
                  시스템관리
                </span>
                <span style={{ 
                  fontSize: '12px',
                  color: '#3b82f6',
                  transition: 'transform 0.2s ease',
                  fontWeight: '500'
                }}>
                  {adminSystemExpanded ? '▼' : '▶'}
                </span>
              </MenuItem>
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/user-registration')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    사용자등록
                  </span>
                </MenuItem>
              )}
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/system-constants')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    시스템상수값관리
                  </span>
                </MenuItem>
              )}
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/code-registration')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    코드등록
                  </span>
                </MenuItem>
              )}
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/screen-registration')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    화면등록
                  </span>
                </MenuItem>
              )}
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/menu-registration')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    메뉴등록
                  </span>
                </MenuItem>
              )}
              {adminSystemExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/menu-user-registration')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    메뉴사용자등록
                  </span>
                                </MenuItem>
              )}
              <MenuItem 
                onClick={() => setAdminFileExpanded(!adminFileExpanded)} 
                sx={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  py: 1.5,
                  px: 2,
                  margin: '8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderTop: '2px solid rgba(59, 130, 246, 0.2)',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    transform: 'translateX(4px) scale(1.02)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  },
                  '&:active': {
                    transform: 'translateX(4px) scale(0.98)'
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderIcon sx={{ 
                    fontSize: 16,
                    color: '#3b82f6',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }} />
                  파일관리
                </span>
                <span style={{ 
                  fontSize: '12px',
                  color: '#3b82f6',
                  transition: 'transform 0.2s ease',
                  fontWeight: '500'
                }}>
                  {adminFileExpanded ? '▼' : '▶'}
                </span>
              </MenuItem>
              {adminFileExpanded && (
                <MenuItem 
                  onClick={() => handleAdminMenuClick('/admin/file-management')} 
                  sx={{ 
                    fontSize: '14px',
                    fontWeight: '600',
                    pl: 4,
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.03)',
                    py: 1.5,
                    px: 2,
                    margin: '0 8px 0 16px',
                    borderRadius: '12px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      transform: 'translateX(8px) scale(1.01)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    },
                    '&:active': {
                      transform: 'translateX(8px) scale(0.99)'
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DescriptionIcon sx={{ 
                      fontSize: 14,
                      color: '#10b981',
                      filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))'
                    }} />
                    공통파일관리
                  </span>
                </MenuItem>
              )}
              
              {/* 통계 메뉴 */}
              <MenuItem 
                onClick={() => handleAdminMenuClick('/statistics')} 
                sx={{ 
                  fontSize: '14px',
                  fontWeight: '600',
                  py: 1.5,
                  px: 2,
                  margin: '8px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                  borderTop: '2px solid rgba(139, 92, 246, 0.2)',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
                    transform: 'translateX(4px) scale(1.02)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)'
                  },
                  '&:active': {
                    transform: 'translateX(4px) scale(0.98)'
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUpIcon sx={{ 
                    fontSize: 16,
                    color: '#8b5cf6',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))'
                  }} />
                  통계 조회
                </span>
              </MenuItem>
 
              </Menu>
          )}
        </Box>
        
        {/* 중앙 제목 */}
        <Box sx={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          height: '50px'
        }}>
          {currentPageTitle && (
            <Typography 
              sx={{ 
                fontSize: '18px',
                fontWeight: '700',
                color: 'white',
                textAlign: 'center',
                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                letterSpacing: '-0.5px',
                transform: 'translateY(-10px)'
              }}
            >
              {currentPageTitle}
            </Typography>
          )}
        </Box>
        
        {/* 오른쪽 영역 */}
        <Box sx={{ display: 'flex', gap: 2, height: '50px' }}>
          {menuItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{ 
                fontSize: '12px',
                fontWeight: '600',
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                height: '28px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'none',
                transform: 'translateY(-10px)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'translateY(-11px)',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)'
                }
              }}
            >
              {item.text}
            </Button>
          ))}
          
          {/* 로그아웃 버튼 */}
          <Button
            color="inherit"
            onClick={handleLogout}
            sx={{ 
              fontSize: '12px',
              fontWeight: '600',
              minWidth: 'auto',
              px: 1.5,
              py: 0.5,
              height: '28px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'none',
              transform: 'translateY(3px)',
              '&:hover': {
                background: 'rgba(255,255,255,0.2)',
                transform: 'translateY(2px)',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.3)'
              }
            }}
          >
            로그아웃
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 