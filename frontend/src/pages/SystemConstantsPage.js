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
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const SystemConstantsPage = () => {
  const { user } = useAuth();
  const [constants, setConstants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingConstant, setEditingConstant] = useState(null);
  const [formData, setFormData] = useState({
    constant_key: '',
    constant_value: '',
    constant_type: 'string',
    description: '',
    category: 'general'
  });

  const gridRef = useRef();

  // 카테고리 옵션
  const categories = [
    'general',
    'file_path',
    'system_config',
    'api_config',
    'ui_config',
    'business_logic'
  ];

  // 상수 타입 옵션
  const constantTypes = [
    { value: 'string', label: '문자열' },
    { value: 'number', label: '숫자' },
    { value: 'boolean', label: '불린' },
    { value: 'json', label: 'JSON' },
    { value: 'file_path', label: '파일 경로' }
  ];

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
      field: 'constant_key', 
      headerName: '키', 
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
      field: 'constant_value', 
      headerName: '값', 
      width: 300, 
      minWidth: 200,
      maxWidth: 400,
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
      field: 'constant_type', 
      headerName: '타입', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: true,
      cellRenderer: (params) => {
        const type = constantTypes.find(t => t.value === params.value);
        return type ? type.label : params.value;
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'category', 
      headerName: '카테고리', 
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
      field: 'description', 
      headerName: '설명', 
      width: 250, 
      minWidth: 200,
      maxWidth: 350,
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
      field: 'created_by_name', 
      headerName: '생성자', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'created_at', 
      headerName: '생성일', 
      width: 150, 
      minWidth: 120,
      maxWidth: 180,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString('ko-KR');
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

  // 상수값 목록 조회
  const fetchConstants = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/system-constants');
      setConstants(response.data);
    } catch (error) {
      console.error('상수값 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 상수값 생성/수정
  const handleSubmit = async () => {
    try {
      if (editingConstant) {
        await api.put(`/api/system-constants/${editingConstant.id}`, formData);
      } else {
        await api.post('/api/system-constants', formData);
      }
      
      setOpenDialog(false);
      setEditingConstant(null);
      resetForm();
      fetchConstants();
    } catch (error) {
      console.error('상수값 처리 실패:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 상수값 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/api/system-constants/${id}`);
      fetchConstants();
    } catch (error) {
      console.error('상수값 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 상수값 수정
  const handleEdit = (constant) => {
    setEditingConstant(constant);
    setFormData({
      constant_key: constant.constant_key,
      constant_value: constant.constant_value,
      constant_type: constant.constant_type,
      description: constant.description,
      category: constant.category
    });
    setOpenDialog(true);
  };

  // 상수값 추가
  const handleAdd = () => {
    setEditingConstant(null);
    resetForm();
    setOpenDialog(true);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      constant_key: '',
      constant_value: '',
      constant_type: 'string',
      description: '',
      category: 'general'
    });
  };

  useEffect(() => {
    fetchConstants();
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
        <Tooltip title="새 상수값 추가" arrow placement="top">
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
            <SettingsIcon sx={{ fontSize: 14 }} />
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
          rowData={constants}
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

      {/* 상수값 추가/수정 다이얼로그 */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConstant ? '상수값 수정' : '새 상수값 추가'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
            <TextField
              label="키"
              value={formData.constant_key}
              onChange={(e) => setFormData({...formData, constant_key: e.target.value})}
              fullWidth
              required
              placeholder="예: file_upload_path"
            />
            <FormControl fullWidth>
              <InputLabel>타입</InputLabel>
              <Select
                value={formData.constant_type}
                onChange={(e) => setFormData({...formData, constant_type: e.target.value})}
                label="타입"
              >
                {constantTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="값"
              value={formData.constant_value}
              onChange={(e) => setFormData({...formData, constant_value: e.target.value})}
              fullWidth
              required
              placeholder="상수값을 입력하세요"
              multiline
              rows={3}
            />
            <FormControl fullWidth>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                label="카테고리"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="설명"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              fullWidth
              multiline
              rows={2}
              placeholder="상수값에 대한 설명을 입력하세요"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>취소</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingConstant ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemConstantsPage;
