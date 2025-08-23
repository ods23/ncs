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
  Grid,
  Paper
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

const CodeRegistrationPage = () => {
  const { user } = useAuth();
  const [codeGroups, setCodeGroups] = useState([]);
  const [codeDetails, setCodeDetails] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // 코드 그룹 다이얼로그 상태
  const [openGroupDialog, setOpenGroupDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    group_code: '',
    group_name: '',
    group_description: '',
    department: '',
    sort_order: 0,
    is_active: 1
  });
  
  // 코드 상세 다이얼로그 상태
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [detailFormData, setDetailFormData] = useState({
    group_id: '',
    code_value: '',
    code_name: '',
    code_description: '',
    sort_order: 0,
    is_active: 1
  });

  const groupGridRef = useRef();
  const detailGridRef = useRef();

  // 코드 그룹 컬럼 정의
  const groupColumnDefs = [
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
                onClick={() => handleEditGroup(params.data)}
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
      field: 'group_code', 
      headerName: '그룹코드', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
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
      field: 'group_name', 
      headerName: '그룹명', 
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
      field: 'group_description', 
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
      width: 180, // 기존보다 넓게
      minWidth: 150,
      maxWidth: 250,
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
      field: 'sort_order', 
      headerName: '정렬순서', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
      sortable: true, 
      filter: true, 
      editable: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px',
        textAlign: 'center'
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
        lineHeight: '20px',
        textAlign: 'center'
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
                onClick={() => handleDeleteGroup(params.data.id)}
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

  // 코드 상세 컬럼 정의
  const detailColumnDefs = [
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
                onClick={() => handleEditDetail(params.data)}
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
      field: 'code_value', 
      headerName: '코드값', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
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
      field: 'code_name', 
      headerName: '코드명', 
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
      field: 'code_description', 
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
      field: 'sort_order', 
      headerName: '정렬순서', 
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
        lineHeight: '20px',
        textAlign: 'center'
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
        lineHeight: '20px',
        textAlign: 'center'
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
                onClick={() => handleDeleteDetail(params.data.id)}
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

  // 코드 그룹 목록 가져오기
  const fetchCodeGroups = async () => {
    try {
      const response = await api.get('/api/code-groups');
      setCodeGroups(response.data);
    } catch (error) {
      console.error('코드 그룹 목록 가져오기 실패:', error);
    }
  };

  // 코드 상세 목록 가져오기
  const fetchCodeDetails = async (groupId) => {
    if (!groupId) return;
    
    try {
      const response = await api.get(`/api/code-details?group_id=${groupId}`);
      setCodeDetails(response.data);
    } catch (error) {
      console.error('코드 상세 목록 가져오기 실패:', error);
    }
  };

  // 코드 그룹 추가/수정
  const handleGroupSubmit = async () => {
    try {
      if (editingGroup) {
        await api.put(`/api/code-groups/${editingGroup.id}`, groupFormData);
      } else {
        await api.post('/api/code-groups', groupFormData);
      }
      
      setOpenGroupDialog(false);
      setEditingGroup(null);
      resetGroupForm();
      fetchCodeGroups();
    } catch (error) {
      console.error('코드 그룹 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 코드 상세 추가/수정
  const handleDetailSubmit = async () => {
    try {
      if (editingDetail) {
        await api.put(`/api/code-details/${editingDetail.id}`, detailFormData);
      } else {
        await api.post('/api/code-details', detailFormData);
      }
      
      setOpenDetailDialog(false);
      setEditingDetail(null);
      resetDetailForm();
      fetchCodeDetails(selectedGroup?.id);
    } catch (error) {
      console.error('코드 상세 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 코드 그룹 삭제
  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/code-groups/${groupId}`);
      fetchCodeGroups();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
        setCodeDetails([]);
      }
    } catch (error) {
      console.error('코드 그룹 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 코드 상세 삭제
  const handleDeleteDetail = async (detailId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    
    try {
      await api.delete(`/api/code-details/${detailId}`);
      fetchCodeDetails(selectedGroup?.id);
    } catch (error) {
      console.error('코드 상세 삭제 실패:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 코드 그룹 수정
  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormData({
      group_code: group.group_code,
      group_name: group.group_name,
      group_description: group.group_description || '',
      department: group.department || '',
      sort_order: group.sort_order || 0,
      is_active: group.is_active
    });
    setOpenGroupDialog(true);
  };

  // 코드 상세 수정
  const handleEditDetail = (detail) => {
    setEditingDetail(detail);
    setDetailFormData({
      group_id: detail.group_id,
      code_value: detail.code_value,
      code_name: detail.code_name,
      code_description: detail.code_description || '',
      sort_order: detail.sort_order || 0,
      is_active: detail.is_active
    });
    setOpenDetailDialog(true);
  };

  // 코드 그룹 추가
  const handleAddGroup = () => {
    setEditingGroup(null);
    resetGroupForm();
    setOpenGroupDialog(true);
  };

  // 코드 상세 추가
  const handleAddDetail = () => {
    if (!selectedGroup) {
      alert('먼저 코드 그룹을 선택해주세요.');
      return;
    }
    setEditingDetail(null);
    resetDetailForm();
    setDetailFormData(prev => ({ ...prev, group_id: selectedGroup.id }));
    setOpenDetailDialog(true);
  };

  // 코드 그룹 폼 초기화
  const resetGroupForm = () => {
    setGroupFormData({
      group_code: '',
      group_name: '',
      group_description: '',
      department: '',
      sort_order: 0,
      is_active: 1
    });
  };

  // 코드 상세 폼 초기화
  const resetDetailForm = () => {
    setDetailFormData({
      group_id: '',
      code_value: '',
      code_name: '',
      code_description: '',
      sort_order: 0,
      is_active: 1
    });
  };

  // 그룹 선택 시 상세 목록 가져오기
  const handleGroupSelection = (event) => {
    const selectedGroupData = event.data;
    setSelectedGroup(selectedGroupData);
    fetchCodeDetails(selectedGroupData.id);
  };

  useEffect(() => {
    fetchCodeGroups();
  }, []);

  return (
    <Box sx={{ p: 3, mt: -1.25 }}>


            <Grid container spacing={3}>
        {/* 코드 그룹 섹션 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '16px' }}>코드 그룹</Typography>
            <Tooltip title="새 그룹 추가" arrow placement="top">
              <IconButton
                onClick={handleAddGroup}
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
              ref={groupGridRef}
              columnDefs={groupColumnDefs}
              rowData={codeGroups}
              pagination={true}
              paginationPageSize={10}
              rowSelection="single"
              animateRows={true}
              rowHeight={40}
              headerHeight={45}
              onRowClicked={handleGroupSelection}
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

        {/* 코드 상세 섹션 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '16px' }}>상세코드</Typography>
            <Tooltip title="새 상세코드 추가" arrow placement="top">
              <IconButton
                onClick={handleAddDetail}
                size="small"
                disabled={!selectedGroup}
                sx={{
                  background: selectedGroup 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                  color: 'white',
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  boxShadow: selectedGroup 
                    ? '0 2px 4px rgba(16, 185, 129, 0.2)'
                    : '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: selectedGroup 
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    transform: selectedGroup ? 'translateY(-1px) scale(1.05)' : 'none',
                    boxShadow: selectedGroup 
                      ? '0 4px 8px rgba(16, 185, 129, 0.3)'
                      : '0 2px 4px rgba(0,0,0,0.1)'
                  },
                  '&:active': {
                    transform: selectedGroup ? 'translateY(0px) scale(1.02)' : 'none',
                    boxShadow: selectedGroup 
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
            width: '100%'
          }}>
            <AgGridReact
              ref={detailGridRef}
              columnDefs={detailColumnDefs}
              rowData={codeDetails}
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

      {/* 코드 그룹 다이얼로그 */}
      <Dialog 
        open={openGroupDialog} 
        onClose={() => setOpenGroupDialog(false)} 
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
          {editingGroup ? '코드 그룹 수정' : '새 코드 그룹 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 2 }}>
            <TextField
              label="그룹코드"
              value={groupFormData.group_code}
              onChange={(e) => setGroupFormData({...groupFormData, group_code: e.target.value})}
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
              label="그룹명"
              value={groupFormData.group_name}
              onChange={(e) => setGroupFormData({...groupFormData, group_name: e.target.value})}
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
              value={groupFormData.group_description}
              onChange={(e) => setGroupFormData({...groupFormData, group_description: e.target.value})}
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
            <TextField
              label="부서"
              value={groupFormData.department}
              onChange={(e) => setGroupFormData({...groupFormData, department: e.target.value})}
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
            <TextField
              label="정렬순서"
              type="number"
              value={groupFormData.sort_order}
              onChange={(e) => setGroupFormData({...groupFormData, sort_order: parseInt(e.target.value) || 0})}
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
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>활성화</InputLabel>
              <Select
                value={groupFormData.is_active}
                onChange={(e) => setGroupFormData({...groupFormData, is_active: e.target.value})}
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
        <DialogActions sx={{ padding: '20px 24px' }}>
          <Button 
            onClick={() => setOpenGroupDialog(false)}
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
            onClick={handleGroupSubmit} 
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
            {editingGroup ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 코드 상세 다이얼로그 */}
      <Dialog 
        open={openDetailDialog} 
        onClose={() => setOpenDetailDialog(false)} 
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
          {editingDetail ? '코드 상세 수정' : '새 코드 상세 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mt: 2 }}>
            <TextField
              label="코드값"
              value={detailFormData.code_value}
              onChange={(e) => setDetailFormData({...detailFormData, code_value: e.target.value})}
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
              label="코드명"
              value={detailFormData.code_name}
              onChange={(e) => setDetailFormData({...detailFormData, code_name: e.target.value})}
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
              value={detailFormData.code_description}
              onChange={(e) => setDetailFormData({...detailFormData, code_description: e.target.value})}
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
            <TextField
              label="정렬순서"
              type="number"
              value={detailFormData.sort_order}
              onChange={(e) => setDetailFormData({...detailFormData, sort_order: parseInt(e.target.value) || 0})}
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
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>활성화</InputLabel>
              <Select
                value={detailFormData.is_active}
                onChange={(e) => setDetailFormData({...detailFormData, is_active: e.target.value})}
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
        <DialogActions sx={{ padding: '20px 24px' }}>
          <Button 
            onClick={() => setOpenDetailDialog(false)}
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
            onClick={handleDetailSubmit} 
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
            {editingDetail ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CodeRegistrationPage; 