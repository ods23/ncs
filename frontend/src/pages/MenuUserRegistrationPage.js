import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
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
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

const MenuUserRegistrationPage = () => {
  // 상태 관리
  const [menus, setMenus] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [userMenus, setUserMenus] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);



  // 사용자메뉴 연결 다이얼로그 상태
  const [openConnectUserDialog, setOpenConnectUserDialog] = useState(false);
  const [connectUserFormData, setConnectUserFormData] = useState({
    userId: ''
  });

  // 그리드 참조
  const menuGridRef = useRef();
  const userMenuGridRef = useRef();

  // 메뉴 컬럼 정의
  const menuColumnDefs = [
    { 
      headerName: 'No', 
      width: 50, 
      minWidth: 40,
      maxWidth: 60,
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
      field: 'menu_name', 
      headerName: '메뉴명', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
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
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 180, 
      minWidth: 150,
      maxWidth: 250,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'is_active', 
      headerName: '활성화', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellRenderer: (params) => {
        return params.value === 1 ? '활성' : '비활성';
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },

  ];

  // 사용자메뉴 컬럼 정의
  const userMenuColumnDefs = [
    { 
      headerName: 'No', 
      width: 50, 
      minWidth: 40,
      maxWidth: 60,
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
      field: 'name', 
      headerName: '사용자명', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'email', 
      headerName: '이메일', 
      width: 250, 
      minWidth: 200,
      maxWidth: 350,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'role', 
      headerName: '역할', 
      width: 80, 
      minWidth: 60,
      maxWidth: 100,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'department', 
      headerName: '부서', 
      width: 180, 
      minWidth: 150,
      maxWidth: 250,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'teacher_type', 
      headerName: '교사', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'position', 
      headerName: '직책', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      field: 'phone', 
      headerName: '전화번호', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
      sortable: true, 
      filter: true, 
      editable: true,
      resizable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    { 
      headerName: '작업', 
      width: 60, 
      minWidth: 50,
      maxWidth: 80,
      sortable: false, 
      filter: false,
      resizable: true,
      cellRenderer: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="삭제" arrow placement="top">
              <IconButton
                size="small"
                onClick={() => handleDeleteUserMenu(params.data.id)}
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



  // 선택된 메뉴에 연결된 사용자 목록 가져오기
  const fetchConnectedUsers = async (menuId) => {
    try {
      const response = await api.get(`/api/user-menus/menu/${menuId}`);
      console.log('연결된 사용자 데이터:', response.data);
      setUserMenus(response.data);
    } catch (error) {
      console.error('연결된 사용자 목록 가져오기 실패:', error);
      setUserMenus([]);
    }
  };

  // 사용 가능한 사용자 목록 가져오기 (연결되지 않은 사용자들)
  const fetchAvailableUsers = async (menuId) => {
    try {
      const response = await api.get('/api/users');
      const allUsers = response.data;
      
      // 이미 연결된 사용자 ID 목록
      const connectedUserIds = userMenus.map(userMenu => userMenu.user_id);
      
      // 연결되지 않은 사용자들만 필터링
      const availableUsers = allUsers.filter(user => !connectedUserIds.includes(user.id));
      
      setAvailableUsers(availableUsers);
    } catch (error) {
      console.error('사용 가능한 사용자 목록 가져오기 실패:', error);
      setAvailableUsers([]);
    }
  };



  // 사용자메뉴 삭제
  const handleDeleteUserMenu = async (userMenuId) => {
    if (window.confirm('정말로 이 사용자를 메뉴에서 제거하시겠습니까?')) {
      try {
        await api.delete(`/api/user-menus/${userMenuId}`);
        fetchConnectedUsers(selectedMenu.id);
        fetchAvailableUsers(selectedMenu.id);
      } catch (error) {
        console.error('사용자메뉴 삭제 실패:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };



  // 사용자 연결
  const handleAddUser = () => {
    if (!selectedMenu) {
      alert('먼저 메뉴를 선택해주세요.');
      return;
    }
    fetchAvailableUsers(selectedMenu.id);
    setConnectUserFormData({
      userId: ''
    });
    setOpenConnectUserDialog(true);
  };

  // 사용자 연결 처리
  const handleConnectUser = async () => {
    try {
      const { userId } = connectUserFormData;
      
      // 토큰 확인 로그 추가
      const token = localStorage.getItem('token');
      console.log('현재 토큰:', token ? '존재함' : '없음');
      console.log('토큰 길이:', token ? token.length : 0);
      
      console.log('연결할 사용자 ID:', userId);
      console.log('연결할 메뉴 ID:', selectedMenu.id);
      
      await api.post(`/api/user-menus`, {
        userId,
        menuId: selectedMenu.id
      });
      
      setOpenConnectUserDialog(false);
      fetchConnectedUsers(selectedMenu.id);
      fetchAvailableUsers(selectedMenu.id);
    } catch (error) {
      console.error('사용자 연결 실패:', error);
      console.error('오류 응답:', error.response?.data);
      console.error('오류 상태:', error.response?.status);
      alert('사용자 연결 중 오류가 발생했습니다.');
    }
  };

  // 메뉴 선택 처리
  const handleMenuSelection = (event) => {
    const menu = event.data;
    setSelectedMenu(menu);
    fetchConnectedUsers(menu.id);
  };



  // 초기 데이터 로드
  useEffect(() => {
    fetchMenus();
  }, []);

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      {/* 버튼 그룹 */}
      <Box sx={{
        mb: 1,
        mt: -7.5,
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap'
      }}>
      </Box>

      {/* 메뉴 그리드 */}
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold', color: '#1976d2', fontSize: '16px' }}>
          메뉴 목록
        </Typography>
      <div className="ag-theme-alpine" style={{ height: 'calc(50vh - 150px)', minHeight: '300px' }}>
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
          suppressRowClickSelection={false}
          enableCellTextSelection={true}
          suppressCellFocus={false}
          suppressPaginationPanel={false}
          paginationAutoPageSize={true}
          onRowClicked={handleMenuSelection}
        />
      </div>

      {/* 사용자메뉴 그리드 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, mt: 3, gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', fontSize: '16px' }}>
          연결된 사용자 목록 {selectedMenu && `(${selectedMenu.menu_name})`}
        </Typography>
        <Tooltip title="사용자 연결" arrow placement="top">
          <IconButton
            onClick={handleAddUser}
            disabled={!selectedMenu}
            size="small"
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
      <div className="ag-theme-alpine" style={{ height: 'calc(50vh - 150px)', minHeight: '300px' }}>
        <AgGridReact
          ref={userMenuGridRef}
          columnDefs={userMenuColumnDefs}
          rowData={selectedMenu ? userMenus : []}
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
        />
      </div>



      {/* 사용자 연결 다이얼로그 */}
      <Dialog 
        open={openConnectUserDialog} 
        onClose={() => setOpenConnectUserDialog(false)} 
        maxWidth="sm" 
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
          사용자 연결
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>사용자 선택</InputLabel>
                <Select
                  value={connectUserFormData.userId}
                  onChange={(e) => setConnectUserFormData({ ...connectUserFormData, userId: e.target.value })}
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
                  {availableUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.name} ({user.email}, {user.department || '부서없음'}, {user.teacher_type || '교사타입없음'}, {user.position || '직책없음'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenConnectUserDialog(false)}
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
            onClick={handleConnectUser} 
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
            연결
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MenuUserRegistrationPage; 