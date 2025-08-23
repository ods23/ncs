import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Typography,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const MenuRegistrationPage = () => {
  const { user } = useAuth();
  const [menus, setMenus] = useState([]);
  const [screens, setScreens] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [connectedScreens, setConnectedScreens] = useState([]);
  
  // 메뉴 다이얼로그 상태
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [menuFormData, setMenuFormData] = useState({
    menu_name: '',
    menu_order: 0,
    department: '',
    is_active: 1
  });
  
  // 화면 다이얼로그 상태
  const [openScreenDialog, setOpenScreenDialog] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [screenFormData, setScreenFormData] = useState({
    screen_name: '',
    screen_description: '',
    department: '',
    is_active: 1
  });

  // 화면 연결 다이얼로그 상태
  const [openConnectScreenDialog, setOpenConnectScreenDialog] = useState(false);
  const [availableScreens, setAvailableScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [selectedScreenOrder, setSelectedScreenOrder] = useState(0);

  const menuGridRef = useRef();
  const screenGridRef = useRef();

  // 메뉴 컬럼 정의
  const menuColumnDefs = [
    { 
      headerName: 'No', 
      width: 60, 
      minWidth: 50,
      maxWidth: 80,
      sortable: false, 
      filter: false,
      resizable: true,
      cellRenderer: (params) => {
        return params.rowIndex + 1;
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '14px'
      }
    },
    {
      headerName: '수정',
      width: 60,
      minWidth: 50,
      maxWidth: 70,
      resizable: true,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="수정" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleEditMenu(params.data)}
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    transform: 'translateY(-1px) scale(1.05)',
                    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(1.02)',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }
                }}
              >
                <EditIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'menu_name', 
      headerName: '메뉴명', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'menu_order', 
      headerName: '메뉴순서', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 180, // 한글 10자 표시를 위해 100에서 180으로 증가
      minWidth: 150, // 한글 8자 표시를 위해 80에서 150으로 증가
      maxWidth: 250, // 한글 12자 표시를 위해 120에서 250으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'is_active', 
      headerName: '활성화', 
      width: 100, // 기존 80에서 100으로 증가
      minWidth: 80, // 기존 60에서 80으로 증가
      maxWidth: 120, // 기존 100에서 120으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellRenderer: (params) => {
        return params.value === 1 ? '활성' : '비활성';
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      headerName: '삭제', 
      width: 60, 
      minWidth: 50,
      maxWidth: 70,
      resizable: true,
      sortable: false, 
      filter: false,
      cellRenderer: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="삭제" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDeleteMenu(params.data.id)}
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    transform: 'translateY(-1px) scale(1.05)',
                    boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(1.02)',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }
                }}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    }
  ];

  // 화면 컬럼 정의
  const screenColumnDefs = [
    { 
      headerName: 'No', 
      width: 60, 
      minWidth: 50,
      maxWidth: 80,
      sortable: false, 
      filter: false,
      resizable: true,
      cellRenderer: (params) => {
        return params.rowIndex + 1;
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '14px'
      }
    },
    { 
      field: 'screen_name', 
      headerName: '화면명', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'screen_order', 
      headerName: '화면순서', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'screen_description', 
      headerName: '설명', 
      width: 200, 
      minWidth: 150,
      maxWidth: 300,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 180, // 한글 10자 표시를 위해 100에서 180으로 증가
      minWidth: 150, // 한글 8자 표시를 위해 80에서 150으로 증가
      maxWidth: 250, // 한글 12자 표시를 위해 120에서 250으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'is_active', 
      headerName: '활성화', 
      width: 100, // 기존 80에서 100으로 증가
      minWidth: 80, // 기존 60에서 80으로 증가
      maxWidth: 120, // 기존 100에서 120으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellRenderer: (params) => {
        return params.value === 1 ? '활성' : '비활성';
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      headerName: '삭제', 
      width: 60, 
      minWidth: 50,
      maxWidth: 70,
      resizable: true,
      sortable: false, 
      filter: false,
      cellRenderer: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="삭제" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDeleteScreen(params.data.id)}
                sx={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  width: 28,
                  height: 28,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                    transform: 'translateY(-1px) scale(1.05)',
                    boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(1.02)',
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }
                }}
              >
                <DeleteIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    }
  ];

  // 메뉴 목록 가져오기
  const fetchMenus = async () => {
    try {
      const response = await api.get('/api/menus');
      console.log('메뉴 데이터:', response.data);
      setMenus(response.data);
    } catch (error) {
      console.error('메뉴 목록 가져오기 실패:', error);
      alert('메뉴 목록을 가져오는데 실패했습니다.');
    }
  };

  // 화면 목록 가져오기
  const fetchScreens = async () => {
    try {
      const response = await api.get('/api/screens');
      console.log('화면 데이터:', response.data);
      setScreens(response.data);
    } catch (error) {
      console.error('화면 목록 가져오기 실패:', error);
      alert('화면 목록을 가져오는데 실패했습니다.');
    }
  };

  // 부서 목록 가져오기
  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const departmentGroups = response.data.filter(group => group.group_name === '부서');
      if (departmentGroups.length > 0) {
        const departmentResponse = await api.get(`/api/code-details?group_id=${departmentGroups[0].id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setDepartments(departmentResponse.data);
      }
    } catch (error) {
      console.error('부서 목록 가져오기 실패:', error);
    }
  };

  // 선택된 메뉴에 연결된 화면 목록 가져오기
  const fetchConnectedScreens = async (menuId) => {
    try {
      const response = await api.get(`/api/menus/${menuId}/screens`);
      console.log('연결된 화면 데이터:', response.data);
      setConnectedScreens(response.data);
    } catch (error) {
      console.error('연결된 화면 목록 가져오기 실패:', error);
      setConnectedScreens([]);
    }
  };

  // 사용 가능한 화면 목록 가져오기 (연결되지 않은 화면들)
  const fetchAvailableScreens = async (menuId) => {
    try {
      const response = await api.get('/api/screens');
      const allScreens = response.data;
      
      // 이미 연결된 화면 ID 목록
      const connectedScreenIds = connectedScreens.map(screen => screen.id);
      
      // 연결되지 않은 화면들만 필터링
      const availableScreens = allScreens.filter(screen => !connectedScreenIds.includes(screen.id));
      
      setAvailableScreens(availableScreens);
    } catch (error) {
      console.error('사용 가능한 화면 목록 가져오기 실패:', error);
      setAvailableScreens([]);
    }
  };

  // 메뉴 추가/수정
  const handleMenuSubmit = async () => {
    try {
      if (editingMenu) {
        await api.put(`/api/menus/${editingMenu.id}`, menuFormData);
      } else {
        await api.post('/api/menus', menuFormData);
      }
      
      setOpenMenuDialog(false);
      setEditingMenu(null);
      resetMenuForm();
      fetchMenus();
    } catch (error) {
      console.error('메뉴 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 화면 추가/수정
  const handleScreenSubmit = async () => {
    try {
      if (editingScreen) {
        await api.put(`/api/screens/${editingScreen.id}`, screenFormData);
        // 연결된 화면 목록 새로고침
        if (selectedMenu) {
          fetchConnectedScreens(selectedMenu.id);
        }
      } else {
        await api.post('/api/screens', screenFormData);
      }
      
      setOpenScreenDialog(false);
      setEditingScreen(null);
      resetScreenForm();
    } catch (error) {
      console.error('화면 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 삭제
  const handleDeleteMenu = async (menuId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/menus/${menuId}`);
      fetchMenus();
    } catch (error) {
      console.error('메뉴 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 화면 연결 해제
  const handleDeleteScreen = async (screenId) => {
    if (!selectedMenu) {
      alert('먼저 메뉴를 선택해주세요.');
      return;
    }
    
    if (!window.confirm('정말 이 화면의 연결을 해제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/menus/${selectedMenu.id}/screens/${screenId}`);
      fetchConnectedScreens(selectedMenu.id);
    } catch (error) {
      console.error('화면 연결 해제 실패:', error);
      alert('연결 해제 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 수정
  const handleEditMenu = (menu) => {
    setEditingMenu(menu);
    setMenuFormData({
      menu_name: menu.menu_name,
      menu_order: menu.menu_order || 0,
      department: menu.department || '',
      is_active: menu.is_active
    });
    setOpenMenuDialog(true);
  };

  // 화면 수정 (연결된 화면 정보 수정)
  const handleEditScreen = (screen) => {
    if (!selectedMenu) {
      alert('먼저 메뉴를 선택해주세요.');
      return;
    }
    
    setEditingScreen(screen);
    setScreenFormData({
      screen_name: screen.screen_name,
      screen_description: screen.screen_description || '',
      department: screen.department || '',
      is_active: screen.is_active
    });
    setOpenScreenDialog(true);
  };

  // 메뉴 추가
  const handleAddMenu = () => {
    setEditingMenu(null);
    resetMenuForm();
    setOpenMenuDialog(true);
  };

  // 화면 추가 (메뉴에 화면 연결)
  const handleAddScreen = () => {
    if (!selectedMenu) {
      alert('먼저 메뉴를 선택해주세요.');
      return;
    }
    
    fetchAvailableScreens(selectedMenu.id);
    setSelectedScreenId('');
    // 기본 순서를 현재 연결된 화면 수 + 1로 설정
    setSelectedScreenOrder(connectedScreens.length + 1);
    setOpenConnectScreenDialog(true);
  };

  // 화면 연결 처리
  const handleConnectScreen = async () => {
    if (!selectedScreenId) {
      alert('연결할 화면을 선택해주세요.');
      return;
    }

    try {
      await api.post(`/api/menus/${selectedMenu.id}/screens`, {
        screenId: selectedScreenId,
        screenOrder: selectedScreenOrder
      });
      
      setOpenConnectScreenDialog(false);
      setSelectedScreenId('');
      setSelectedScreenOrder(0);
      fetchConnectedScreens(selectedMenu.id);
      alert('화면이 성공적으로 연결되었습니다.');
    } catch (error) {
      console.error('화면 연결 실패:', error);
      alert('화면 연결 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 폼 초기화
  const resetMenuForm = () => {
    setMenuFormData({
      menu_name: '',
      menu_order: 0,
      department: '',
      is_active: 1
    });
  };

  // 화면 폼 초기화
  const resetScreenForm = () => {
    setScreenFormData({
      screen_name: '',
      screen_description: '',
      department: '',
      is_active: 1
    });
  };

  useEffect(() => {
    fetchMenus();
    fetchScreens();
    fetchDepartments();
  }, []);

  // 메뉴 선택 시 연결된 화면 가져오기
  const handleMenuSelection = (event) => {
    const selectedMenuData = event.data;
    setSelectedMenu(selectedMenuData);
    fetchConnectedScreens(selectedMenuData.id);
    // 연결된 화면 목록이 업데이트된 후 사용 가능한 화면 목록도 업데이트
    setTimeout(() => {
      fetchAvailableScreens(selectedMenuData.id);
    }, 100);
  };

  return (
    <Box sx={{ p: 3, mt: -1.25 }}>
      <Grid container spacing={3}>
        {/* 메뉴 섹션 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '16px' }}>메뉴 관리</Typography>
            <Tooltip title="새 메뉴 추가" arrow placement="top">
              <IconButton
                onClick={handleAddMenu}
                size="small"
                sx={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                    transform: 'translateY(-1px) scale(1.05)',
                    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                  },
                  '&:active': {
                    transform: 'translateY(0px) scale(1.02)',
                    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                  }
                }}
              >
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <div className="ag-theme-alpine" style={{ 
            height: 'calc(50vh - 150px)', 
            minHeight: '300px',
            width: '100%',
            overflow: 'auto'
          }}>
            <AgGridReact
              ref={menuGridRef}
              columnDefs={menuColumnDefs}
              rowData={menus}
              pagination={true}
              paginationPageSize={10}
              rowSelection="single"
              animateRows={true}
              rowHeight={40}
              headerHeight={45}
              onRowClicked={handleMenuSelection}
              suppressRowClickSelection={false}
              enableCellTextSelection={true}
              suppressCellFocus={false}
              suppressPaginationPanel={false}
              paginationAutoPageSize={true}
              suppressColumnVirtualisation={false}
              suppressResizeObserver={true}
              suppressAnimationFrame={true}
              suppressBrowserResizeObserver={true}
            />
          </div>
        </Grid>

        {/* 화면 섹션 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '16px' }}>
              {selectedMenu ? `${selectedMenu.menu_name} - 연결된 화면` : '화면 관리'}
            </Typography>
            <Tooltip title="새 화면 추가" arrow placement="top">
              <IconButton
                onClick={handleAddScreen}
                size="small"
                disabled={!selectedMenu}
                sx={{
                  background: selectedMenu 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                  color: 'white',
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  boxShadow: selectedMenu 
                    ? '0 2px 4px rgba(16, 185, 129, 0.2)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: selectedMenu 
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    transform: selectedMenu ? 'translateY(-1px) scale(1.05)' : 'none',
                    boxShadow: selectedMenu 
                      ? '0 4px 8px rgba(16, 185, 129, 0.3)'
                      : '0 2px 4px rgba(0,0,0,0.1)'
                  },
                  '&:active': {
                    transform: selectedMenu ? 'translateY(0px) scale(1.02)' : 'none',
                    boxShadow: selectedMenu 
                      ? '0 2px 4px rgba(16, 185, 129, 0.2)'
                      : '0 2px 4px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <AddIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <div className="ag-theme-alpine" style={{ 
            height: 'calc(50vh - 150px)', 
            minHeight: '300px',
            width: '100%',
            overflow: 'auto'
          }}>
            <AgGridReact
              ref={screenGridRef}
              columnDefs={screenColumnDefs}
              rowData={selectedMenu ? connectedScreens : []}
              pagination={true}
              paginationPageSize={10}
              rowSelection="single"
              animateRows={true}
              rowHeight={40}
              headerHeight={45}
              suppressRowClickSelection={false}
              enableCellTextSelection={true}
              suppressCellFocus={false}
              suppressPaginationPanel={false}
              paginationAutoPageSize={true}
              suppressColumnVirtualisation={false}
              suppressResizeObserver={true}
              suppressAnimationFrame={true}
              suppressBrowserResizeObserver={true}
            />
          </div>
        </Grid>
      </Grid>

      {/* 메뉴 다이얼로그 */}
      <Dialog 
        open={openMenuDialog} 
        onClose={() => setOpenMenuDialog(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiPaper-root': {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {editingMenu ? '메뉴 수정' : '새 메뉴 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 2 }}>
            <TextField
              label="메뉴명"
              value={menuFormData.menu_name}
              onChange={(e) => setMenuFormData({...menuFormData, menu_name: e.target.value})}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="메뉴순서"
              type="number"
              value={menuFormData.menu_order}
              onChange={(e) => setMenuFormData({...menuFormData, menu_order: parseInt(e.target.value)})}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>부서</InputLabel>
              <Select
                value={menuFormData.department}
                onChange={(e) => setMenuFormData({...menuFormData, department: e.target.value})}
                label="부서"
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.code_name}>
                    {dept.code_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>활성화</InputLabel>
              <Select
                value={menuFormData.is_active}
                onChange={(e) => setMenuFormData({...menuFormData, is_active: e.target.value})}
                label="활성화"
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <MenuItem value={1}>활성</MenuItem>
                <MenuItem value={0}>비활성</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenMenuDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              border: '2px solid #6b7280',
              color: '#6b7280',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#374151',
                color: '#374151',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleMenuSubmit} 
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
              }
            }}
          >
            {editingMenu ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 화면 다이얼로그 */}
      <Dialog 
        open={openScreenDialog} 
        onClose={() => setOpenScreenDialog(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiPaper-root': {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {editingScreen ? '화면 수정' : '새 화면 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 2 }}>
            <TextField
              label="화면명"
              value={screenFormData.screen_name}
              onChange={(e) => setScreenFormData({...screenFormData, screen_name: e.target.value})}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="설명"
              value={screenFormData.screen_description}
              onChange={(e) => setScreenFormData({...screenFormData, screen_description: e.target.value})}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>부서</InputLabel>
              <Select
                value={screenFormData.department}
                onChange={(e) => setScreenFormData({...screenFormData, department: e.target.value})}
                label="부서"
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.code_name}>
                    {dept.code_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>활성화</InputLabel>
              <Select
                value={screenFormData.is_active}
                onChange={(e) => setScreenFormData({...screenFormData, is_active: e.target.value})}
                label="활성화"
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                <MenuItem value={1}>활성</MenuItem>
                <MenuItem value={0}>비활성</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenScreenDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              border: '2px solid #6b7280',
              color: '#6b7280',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#374151',
                color: '#374151',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleScreenSubmit} 
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
              }
            }}
          >
            {editingScreen ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 화면 연결 다이얼로그 */}
      <Dialog 
        open={openConnectScreenDialog} 
        onClose={() => setOpenConnectScreenDialog(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiPaper-root': {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          화면 연결 - {selectedMenu?.menu_name}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>연결할 화면 선택</InputLabel>
              <Select
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
                label="연결할 화면 선택"
                sx={{
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                }}
              >
                {availableScreens.map((screen) => (
                  <MenuItem key={screen.id} value={screen.id}>
                    {screen.screen_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="화면 순서"
              type="number"
              value={selectedScreenOrder}
              onChange={(e) => setSelectedScreenOrder(parseInt(e.target.value) || 0)}
              fullWidth
              helperText="숫자가 작을수록 먼저 표시됩니다"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                  },
                  '&.Mui-focused': {
                    borderColor: '#3b82f6',
                    boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#6b7280',
                  fontSize: '12px'
                }
              }}
            />
            {availableScreens.length === 0 && (
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mt: 2, 
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#dc2626'
                }}
              >
                연결 가능한 화면이 없습니다.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenConnectScreenDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              border: '2px solid #6b7280',
              color: '#6b7280',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#374151',
                color: '#374151',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleConnectScreen} 
            variant="contained"
            disabled={!selectedScreenId}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: !selectedScreenId 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              boxShadow: !selectedScreenId 
                ? '0 2px 4px rgba(0,0,0,0.1)'
                : '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: !selectedScreenId 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: !selectedScreenId ? 'none' : 'translateY(-1px)',
                boxShadow: !selectedScreenId 
                  ? '0 2px 4px rgba(0,0,0,0.1)'
                  : '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
              }
            }}
          >
            연결
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuRegistrationPage; 