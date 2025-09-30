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
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon, 
  Delete as DeleteIcon,
  DisplaySettings as DisplaySettingsIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ScreenRegistrationPage = () => {
  const { user } = useAuth();
  const [screens, setScreens] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingScreen, setEditingScreen] = useState(null);
  const [formData, setFormData] = useState({
    screen_name: '',
    screen_path: '',
    screen_description: '',
    component_name: '',
    department: '',
    is_active: 1
  });

  const gridRef = useRef();

  // AG Grid 컬럼 정의
  const columnDefs = [
    { 
      headerName: 'No', 
      width: 60, 
      minWidth: 60,
      maxWidth: 70,
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
      },
      headerClass: 'ag-header-cell-separator'
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
                onClick={() => handleEdit(params.data)}
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
      },
      headerClass: 'ag-header-cell-separator'
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
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'screen_path', 
      headerName: '화면경로', 
      width: 300, // 기존 200에서 1.5배인 300으로 증가
      minWidth: 225, // 기존 150에서 1.5배인 225로 증가
      maxWidth: 450, // 기존 300에서 1.5배인 450으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
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
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'component_name', 
      headerName: '컴포넌트명', 
      width: 200, // 기존 150에서 200으로 증가
      minWidth: 300, // 기존 150에서 300으로 증가
      maxWidth: 300, // 기존 200에서 300으로 증가
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
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
      },
      headerClass: 'ag-header-cell-separator'
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
      },
      headerClass: 'ag-header-cell-separator'
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
                onClick={() => handleDelete(params.data.id)}
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

  // 화면 목록 가져오기
  const fetchScreens = async () => {
    try {
      const response = await api.get('/api/screens');
      setScreens(response.data);
    } catch (error) {
      console.error('화면 목록 가져오기 실패:', error);
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

  // 화면 추가/수정
  const handleSubmit = async () => {
    try {
      if (editingScreen) {
        await api.put(`/api/screens/${editingScreen.id}`, formData);
      } else {
        await api.post('/api/screens', formData);
      }
      
      setOpenDialog(false);
      setEditingScreen(null);
      resetForm();
      fetchScreens();
    } catch (error) {
      console.error('화면 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 화면 삭제
  const handleDelete = async (screenId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/screens/${screenId}`);
      fetchScreens();
    } catch (error) {
      console.error('화면 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 화면 수정
  const handleEdit = (screen) => {
    setEditingScreen(screen);
    setFormData({
      screen_name: screen.screen_name,
      screen_path: screen.screen_path,
      screen_description: screen.screen_description || '',
      component_name: screen.component_name || '',
      department: screen.department || '',
      is_active: screen.is_active
    });
    setOpenDialog(true);
  };

  // 화면 추가
  const handleAdd = () => {
    setEditingScreen(null);
    resetForm();
    setOpenDialog(true);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      screen_name: '',
      screen_path: '',
      screen_description: '',
      component_name: '',
      department: '',
      is_active: 1
    });
  };



  useEffect(() => {
    fetchScreens();
    fetchDepartments();
  }, []);

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      {/* 버튼 그룹 */}
      <Box sx={{ 
        mb: 1, 
        mt: -7.5, // 60px 위로 이동 (1단위 = 8px, 60px = 7.5단위)
        display: 'flex', 
        gap: 2,
        flexWrap: 'wrap'
      }}>
        <Tooltip title="새 화면 추가" arrow placement="top">
          <IconButton
            onClick={handleAdd}
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
            <DisplaySettingsIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: 'calc(100vh - 200px)', 
        minHeight: '500px',
        width: '100%',
        overflow: 'auto'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={screens}
          pagination={true}
          paginationPageSize={50}
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

      {/* 화면 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingScreen ? '화면 수정' : '새 화면 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <TextField
              label="화면명"
              value={formData.screen_name}
              onChange={(e) => setFormData({...formData, screen_name: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="화면경로"
              value={formData.screen_path}
              onChange={(e) => setFormData({...formData, screen_path: e.target.value})}
              fullWidth
              required
            />
            <TextField
              label="설명"
              value={formData.screen_description}
              onChange={(e) => setFormData({...formData, screen_description: e.target.value})}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="컴포넌트명"
              value={formData.component_name}
              onChange={(e) => setFormData({...formData, component_name: e.target.value})}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>부서</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                label="부서"
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
              <InputLabel>활성화</InputLabel>
              <Select
                value={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.value})}
                label="활성화"
              >
                <MenuItem value={1}>활성</MenuItem>
                <MenuItem value={0}>비활성</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
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
            onClick={handleSubmit} 
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
    </Box>
  );
};

export default ScreenRegistrationPage; 