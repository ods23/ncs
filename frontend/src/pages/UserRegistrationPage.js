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
  PersonAdd as PersonAddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { convertDateField } from '../utils/excelUtils';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import ko from 'date-fns/locale/ko';

// 한국어 로케일 등록
registerLocale('ko', ko);

// 커스텀 React-Datepicker 셀 에디터 컴포넌트
const DatePickerCellEditor = (props) => {
  const [date, setDate] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // 초기값 설정
    if (props.value) {
      const date = new Date(props.value);
      const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      setDate(koreanDate);
    }
  }, [props.value]);
  
  const handleDateChange = (newDate) => {
    setDate(newDate);
    if (newDate) {
      // 한국시간 기준으로 날짜 형식 변환
      const koreanDate = new Date(newDate.getTime() + (9 * 60 * 60 * 1000));
      const dateString = koreanDate.toISOString().split('T')[0];
      
      // AG Grid 셀 에디터 API 사용
      if (props.node && props.column) {
        props.node.setDataValue(props.column.getColId(), dateString);
      }
    } else {
      if (props.node && props.column) {
        props.node.setDataValue(props.column.getColId(), '');
      }
    }
    setIsOpen(false);
    if (props.api) {
      props.api.stopEditing();
    }
  };
  
  const handleInputClick = () => {
    setIsOpen(true);
  };
  
  const handleCalendarClose = () => {
    setIsOpen(false);
    if (props.api) {
      props.api.stopEditing();
    }
  };
  
  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.ag-grid-datepicker')) {
        setIsOpen(false);
        if (props.api) {
          props.api.stopEditing();
        }
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, props.api]);
  
  // AG Grid 셀 에디터 API 메서드들
  useEffect(() => {
    if (props.api) {
      // getValue 메서드
      props.api.getValue = () => {
        return date ? date.toISOString().split('T')[0] : '';
      };
      
      // setValue 메서드
      props.api.setValue = (value) => {
        if (props.node && props.column) {
          props.node.setDataValue(props.column.getColId(), value);
        }
      };
    }
  }, [props.api, props.node, props.column, date]);
  
  return (
    <div style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative'
    }}>
      <input
        type="text"
        value={date ? date.toISOString().split('T')[0] : ''}
        onClick={handleInputClick}
        readOnly
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          fontSize: '14px',
          padding: '8px 12px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          zIndex: 9999,
          backgroundColor: 'white',
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <DatePicker
            selected={date}
            onChange={handleDateChange}
            onCalendarClose={handleCalendarClose}
            dateFormat="yyyy-MM-dd"
            locale="ko"
            showPopperArrow={false}
            inline
            calendarClassName="ag-grid-datepicker"
            dayClassName={date => 
              date && date.getTime() === date?.getTime() ? "selected-day" : undefined
            }
          />
        </div>
      )}
    </div>
  );
};



const UserRegistrationPage = () => {
  const { user } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '일반',
    department: '',
    teacher_type: '',
    position: '',
    start_date: '',
    end_date: '',
    birth_date: '',
    is_active: 1
  });
  const [codeData, setCodeData] = useState({});
  const [users, setUsers] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [searchConditions, setSearchConditions] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  const gridRef = useRef();

  // 전화번호 형식 변환 함수
  const formatPhoneNumber = (value) => {
    // 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    
    // 길이에 따라 형식 적용
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // 전화번호 입력 처리 함수
  const handlePhoneChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatPhoneNumber(value);
    setFormData({...formData, phone: formattedValue});
  };

  // 조회 함수
  const handleSearch = () => {
    const filtered = users.filter(user => {
      const nameMatch = !searchConditions.name || 
        user.name?.toLowerCase().includes(searchConditions.name.toLowerCase());
      const emailMatch = !searchConditions.email || 
        user.email?.toLowerCase().includes(searchConditions.email.toLowerCase());
      const phoneMatch = !searchConditions.phone || 
        user.phone?.includes(searchConditions.phone);
      
      return nameMatch && emailMatch && phoneMatch;
    });
    
    setFilteredUsers(filtered);
  };

  // 조회 조건 초기화
  const handleResetSearch = () => {
    setSearchConditions({
      name: '',
      email: '',
      phone: ''
    });
    setFilteredUsers([]);
  };

  // 코드 데이터 가져오기
  const fetchCodeData = async () => {
    try {
      const response = await api.get('/api/code-details');
      const codeDetails = response.data;
      
      // 코드 그룹별로 분류
      const groupedCodes = {};
      codeDetails.forEach(detail => {
        if (!groupedCodes[detail.group_name]) {
          groupedCodes[detail.group_name] = [];
        }
        groupedCodes[detail.group_name].push({
          value: detail.code_value,
          label: detail.code_name
        });
      });
      
      setCodeData(groupedCodes);
    } catch (error) {
      console.error('코드 데이터 가져오기 실패:', error);
      // 기본값 설정
      setCodeData({
        '역할': [
          { value: '일반', label: '일반' },
          { value: '관리자', label: '관리자' }
        ],
        '부서': [
          { value: '새가족위원회', label: '새가족위원회' },
          { value: '아포슬', label: '아포슬' }
        ],
        '교사': [
          { value: '담당목사', label: '담당목사' },
          { value: '위원장', label: '위원장' },
          { value: '부위원장', label: '부위원장' }
        ],
        '직분': [
          { value: '목사', label: '목사' },
          { value: '장로', label: '장로' },
          { value: '안수집사', label: '안수집사' },
          { value: '권사', label: '권사' },
          { value: '집사', label: '집사' }
        ]
      });
    }
  };

  // AG Grid 컬럼 정의
  const columnDefs = [
    { 
      headerName: 'No', 
      width: 70, 
      minWidth: 60,
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
      },
      headerClass: 'ag-header-cell-separator'
    },
    {
      headerName: '수정',
      width: 60,
      minWidth: 50,
      maxWidth: 70,
      resizable: true,
      cellRenderer: (params) => (
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
      ),
      cellStyle: { 
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'name', 
      headerName: '이름', 
      width: 100, 
      minWidth: 80,
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
      field: 'email', 
      headerName: '이메일', 
      width: 200, 
      minWidth: 150,
      maxWidth: 250,
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
      field: 'phone', 
      headerName: '전화번호', 
      width: 150, 
      minWidth: 120,
      maxWidth: 200,
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
      field: 'role', 
      headerName: '역할', 
      width: 80, 
      minWidth: 60,
      maxWidth: 100,
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
      field: 'department', 
      headerName: '부서', 
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
      field: 'teacher_type', 
      headerName: '교사', 
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
      field: 'position', 
      headerName: '직책', 
      width: 100, 
      minWidth: 80,
      maxWidth: 120,
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
      field: 'birth_date', 
      headerName: '생년월일', 
      width: 130, 
      minWidth: 110,
      maxWidth: 160,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        // 한국시간으로 변환하여 하루 차이 문제 해결
        const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        return koreanDate.toISOString().split('T')[0];
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'start_date', 
      headerName: '시작일자', 
      width: 130, 
      minWidth: 110,
      maxWidth: 160,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        // 한국시간으로 변환하여 하루 차이 문제 해결
        const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        return koreanDate.toISOString().split('T')[0];
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'end_date', 
      headerName: '종료일자', 
      width: 130, 
      minWidth: 110,
      maxWidth: 160,
      resizable: true,
      sortable: true, 
      filter: true, 
      editable: false,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        // 한국시간으로 변환하여 하루 차이 문제 해결
        const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        return koreanDate.toISOString().split('T')[0];
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      headerName: '근속연수', 
      width: 90, 
      minWidth: 70,
      maxWidth: 110,
      resizable: true,
      sortable: false, 
      filter: false,
      cellRenderer: (params) => {
        if (!params.data.start_date) return '';
        
        const startDate = new Date(params.data.start_date);
        const currentDate = new Date();
        
        // 시작일이 미래인 경우
        if (startDate > currentDate) return '미정';
        
        // 근속연도 계산
        const diffTime = Math.abs(currentDate - startDate);
        const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
        const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
        
        if (diffYears > 0) {
          return `${diffYears}년 ${diffMonths}개월`;
        } else {
          return `${diffMonths}개월`;
        }
      },
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px',
        textAlign: 'center'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'provider', 
      headerName: '로그인방식', 
      width: 120, 
      minWidth: 100,
      maxWidth: 150,
      resizable: true,
      sortable: true, 
      filter: true,
      cellStyle: { 
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { 
      field: 'is_active', 
      headerName: '상태', 
      width: 80, 
      minWidth: 60,
      maxWidth: 100,
      resizable: true,
      sortable: true, 
      filter: true,
      cellRenderer: (params) => {
        const isActive = params.value === 1 || params.value === true;
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1
          }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isActive ? '#4caf50' : '#f44336'
            }} />
            <span style={{ 
              fontSize: '12px',
              color: isActive ? '#4caf50' : '#f44336',
              fontWeight: 'bold'
            }}>
              {isActive ? '활성' : '비활성'}
            </span>
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
      field: 'created_at', 
      headerName: '생성일', 
      width: 130, 
      minWidth: 110,
      maxWidth: 160,
      resizable: true,
      sortable: true, 
      filter: true,
      cellRenderer: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        // 한국시간으로 변환하여 하루 차이 문제 해결
        const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        return koreanDate.toISOString().split('T')[0];
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
      cellRenderer: (params) => (
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
      ),
      cellStyle: { 
        textAlign: 'center',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    }
  ];

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        // 조회 조건이 있으면 필터링된 결과를, 없으면 전체 결과를 표시
        if (searchConditions.name || searchConditions.email || searchConditions.phone) {
          handleSearch();
        } else {
          setFilteredUsers(data);
        }
      }
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error);
    }
  };

  // 필수 항목 검증 함수
  const validateForm = () => {
    const errors = {};
    
    // 이름 검증
    if (!formData.name || formData.name.trim() === '') {
      errors.name = '이름은 필수 항목입니다.';
    }
    
    // 이메일 검증
    if (!formData.email || formData.email.trim() === '') {
      errors.email = '이메일은 필수 항목입니다.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    }
    
    // 비밀번호 검증 (새 사용자 추가 시에만)
    if (!editingUser && (!formData.password || formData.password.trim() === '')) {
      errors.password = '비밀번호는 필수 항목입니다.';
    }
    
    // 부서 검증
    if (!formData.department || formData.department.trim() === '') {
      errors.department = '부서는 필수 항목입니다.';
    }
    
    // 시작일 검증
    if (!formData.start_date || formData.start_date.trim() === '') {
      errors.start_date = '시작일은 필수 항목입니다.';
    }
    
    // 종료일 검증
    if (!formData.end_date || formData.end_date.trim() === '') {
      errors.end_date = '종료일은 필수 항목입니다.';
    }
    
    // 시작일이 종료일보다 늦은 경우
    if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
      errors.end_date = '종료일은 시작일보다 늦어야 합니다.';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 사용자 추가/수정
  const handleSubmit = async () => {
    // 폼 검증
    if (!validateForm()) {
      setShowValidationDialog(true);
      return;
    }
    
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      console.log('Submitting user data:', formData);
      console.log('URL:', url);
      console.log('Method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        setOpenDialog(false);
        setEditingUser(null);
        resetForm();
        setValidationErrors({});
        fetchUsers();
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`저장 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('사용자 저장 실패:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };



  // 사용자 삭제
  const handleDelete = async (userId) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error('사용자 삭제 실패:', error);
      }
    }
  };

  // 수정 모드로 전환
  const handleEdit = (user) => {
    setEditingUser(user);
    const today = new Date().toISOString().split('T')[0];
    
    // 날짜 형식을 AG Grid와 동일하게 처리하는 함수
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      // 한국시간으로 변환하여 하루 차이 문제 해결
      const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return koreanDate.toISOString().split('T')[0];
    };
    
    // 한국시간 기준으로 오늘 날짜 생성
    const getKoreanToday = () => {
      const now = new Date();
      const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      return koreanTime.toISOString().split('T')[0];
    };
    
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      role: user.role || '일반',
      department: user.department || '',
      teacher_type: user.teacher_type || '',
      birth_date: formatDateForInput(user.birth_date),
      position: user.position || '',
      start_date: formatDateForInput(user.start_date) || getKoreanToday(),
      end_date: formatDateForInput(user.end_date) || getKoreanToday(),
      provider: user.provider || 'local',
      is_active: user.is_active !== undefined ? user.is_active : 1
    });
    setOpenDialog(true);
  };

  // 새 사용자 추가
  const handleAdd = () => {
    setEditingUser(null);
    resetForm();
    setOpenDialog(true);
  };

  // 폼 초기화
  const resetForm = () => {
    // 한국시간 기준으로 오늘 날짜 생성
    const getKoreanToday = () => {
      const now = new Date();
      const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      return koreanTime.toISOString().split('T')[0];
    };
    
    const today = getKoreanToday();
    
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: '일반',
      department: '',
      teacher_type: '',
      birth_date: '',
      position: '',
      start_date: today, // 생성일자와 동일한 날짜로 설정
      end_date: today,   // 생성일자와 동일한 날짜로 설정
      provider: 'local',
      is_active: 1
    });
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    try {
      // AG Grid에 보이는 컬럼만 필터링 (작업 컬럼, 수정 컬럼, 삭제 컬럼 제외)
      const visibleColumns = columnDefs.filter(col => 
        col.headerName !== '작업' && col.headerName !== '수정' && col.headerName !== '삭제'
      );
      
      // 데이터 준비 (보이는 컬럼만)
      const exportData = users.map((user, index) => {
        const rowData = {};
        visibleColumns.forEach(col => {
          // No 컬럼 처리
          if (col.headerName === 'No') {
            rowData['No'] = index + 1;
            return;
          }
          
          // 근속연수 컬럼 처리
          if (col.headerName === '근속연수') {
            if (!user.start_date) {
              rowData['근속연수'] = '';
              return;
            }
            
            const startDate = new Date(user.start_date);
            const currentDate = new Date();
            
            // 시작일이 미래인 경우
            if (startDate > currentDate) {
              rowData['근속연수'] = '미정';
              return;
            }
            
            // 근속연수 계산
            const diffTime = Math.abs(currentDate - startDate);
            const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365));
            const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
            
            if (diffYears > 0) {
              rowData['근속연수'] = `${diffYears}년 ${diffMonths}개월`;
            } else {
              rowData['근속연수'] = `${diffMonths}개월`;
            }
            return;
          }
          
          const fieldName = col.field;
          let value = user[fieldName] || '';
          
          // 날짜 필드 포맷팅 (한국시간 기준)
          if (fieldName === 'start_date' || fieldName === 'end_date' || fieldName === 'birth_date' || fieldName === 'created_at') {
            if (value) {
              const date = new Date(value);
              // 한국시간으로 변환하여 하루 차이 문제 해결
              const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
              value = koreanDate.toISOString().split('T')[0];
            } else {
              value = '';
            }
          }
          
          // 활성화 상태 필드 처리
          if (fieldName === 'is_active') {
            value = value === 1 || value === true ? '활성' : '비활성';
          }
          
          // 컬럼명을 한글로 매핑
          const columnMapping = {
            'name': '이름',
            'email': '이메일',
            'phone': '전화번호',
            'role': '역할',
            'department': '부서',
            'teacher_type': '교사',
            'position': '직책',
            'birth_date': '생년월일',
            'start_date': '시작일자',
            'end_date': '종료일자',
            'provider': '로그인방식',
            'is_active': '상태',
            'created_at': '생성일'
          };
          
          rowData[columnMapping[fieldName] || fieldName] = value;
        });
        return rowData;
      });

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // 컬럼 너비 설정 (보이는 컬럼에 맞춰 조정)
      const colWidths = visibleColumns.map(col => {
        // No 컬럼 처리
        if (col.headerName === 'No') {
          return { wch: 5 };
        }
        
        const widthMap = {
          'name': 15,
          'email': 25,
          'phone': 15,
          'role': 10,
          'department': 15,
          'teacher_type': 15,
          'position': 15,
          'birth_date': 12,
          'start_date': 12,
          'end_date': 12,
          'provider': 15,
          'created_at': 12
        };
        
        // 근속연수 컬럼 처리
        if (col.headerName === '근속연수') {
          return { wch: 15 };
        }
        
        return { wch: widthMap[col.field] || 15 };
      });
      ws['!cols'] = colWidths;

      // 워크시트를 워크북에 추가
      XLSX.utils.book_append_sheet(wb, ws, '사용자목록');

      // 파일 생성 및 다운로드
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, `사용자목록_${new Date().toISOString().split('T')[0]}.xlsx`);

      console.log('엑셀 다운로드 완료');
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  // 엑셀 업로드
  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { 
        type: 'array',
        cellDates: true,  // 날짜를 Date 객체로 파싱
        dateNF: 'yyyy-mm-dd'  // 날짜 형식 지정
      });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        dateNF: 'yyyy-mm-dd',  // 날짜 형식 지정
        raw: false  // 원시 값 대신 형식화된 값 사용
      });

      console.log('엑셀 데이터:', jsonData);

      // 데이터 검증 및 변환
      const usersToAdd = jsonData.map(row => {
        const statusText = row['상태'] || row['status'] || '활성';
        const isActive = statusText === '활성' || statusText === 'active' || statusText === '1' || statusText === 1;
        
        return {
          name: row['이름'] || row['name'] || '',
          email: row['이메일'] || row['email'] || '',
          phone: row['전화번호'] || row['phone'] || '',
          role: row['역할'] || row['role'] || '일반',
          department: row['부서'] || row['department'] || '',
          teacher_type: row['교사'] || row['teacher_type'] || '',
          position: row['직책'] || row['position'] || '',
          start_date: convertDateField(row['시작일자'] || row['시작일'] || row['start_date']) || '',
          end_date: convertDateField(row['종료일자'] || row['종료일'] || row['end_date']) || '',
          birth_date: convertDateField(row['생년월일'] || row['birth_date']) || '',
          provider: row['로그인방식'] || row['provider'] || 'local',
          is_active: isActive ? 1 : 0
        };
      });

      // 필수 필드 검증
      const validUsers = usersToAdd.filter(user => user.name && user.email);
      
      if (validUsers.length === 0) {
        alert('유효한 사용자 데이터가 없습니다.');
        return;
      }

      // 사용자 추가 확인
      if (window.confirm(`${validUsers.length}명의 사용자를 추가하시겠습니까?`)) {
        // 서버에 사용자 추가 요청
        for (const user of validUsers) {
          try {
            const response = await fetch('/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(user)
            });

            if (!response.ok) {
              console.error(`사용자 ${user.name} 추가 실패`);
            }
          } catch (error) {
            console.error('사용자 추가 중 오류:', error);
          }
        }

        // 목록 새로고침
        fetchUsers();
        alert('엑셀 업로드가 완료되었습니다.');
      }
    } catch (error) {
      console.error('엑셀 업로드 실패:', error);
      alert('엑셀 파일 처리에 실패했습니다.');
    }

    // 파일 입력 초기화
    event.target.value = '';
  };

  useEffect(() => {
    fetchUsers();
    fetchCodeData();
    
    // 윈도우 리사이즈 시 AG Grid 크기 조정
    const handleResize = () => {
      if (gridRef.current && gridRef.current.api) {
        setTimeout(() => {
          try {
            gridRef.current.api.sizeColumnsToFit();
          } catch (error) {
            // ResizeObserver 에러 무시
            if (!error.message.includes('ResizeObserver')) {
              console.error('Grid resize error:', error);
            }
          }
        }, 200);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 사용자 데이터가 변경될 때마다 필터링된 결과 업데이트
  useEffect(() => {
    if (users.length > 0) {
      setFilteredUsers(users);
    }
  }, [users]);

  return (
    <Box sx={{ p: 3, mt: 6 }}>


      {/* 버튼 그룹 */}
      <Box sx={{ 
        mb: 1, 
        mt: -7.5, // 60px 위로 이동 (1단위 = 8px, 60px = 7.5단위)
        display: 'flex', 
        gap: 1,
        flexWrap: 'wrap'
      }}>
        <Tooltip title="새 사용자 추가" arrow placement="top">
          <IconButton
            onClick={handleAdd}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(59, 130, 246, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(59, 130, 246, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0px) scale(1.02)',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)'
              }
            }}
          >
            <PersonAddIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="엑셀 다운로드" arrow placement="top">
          <IconButton
            onClick={handleExcelDownload}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4), 0 4px 6px -2px rgba(16, 185, 129, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0px) scale(1.02)',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)'
              }
            }}
          >
            <FileDownloadIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        <Tooltip title="엑셀 업로드" arrow placement="top">
          <IconButton
            component="label"
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3), 0 2px 4px -1px rgba(245, 158, 11, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.4), 0 4px 6px -2px rgba(245, 158, 11, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0px) scale(1.02)',
                boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
              }
            }}
          >
            <FileUploadIcon sx={{ fontSize: 16 }} />
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              onChange={handleExcelUpload}
            />
          </IconButton>
        </Tooltip>

        <TextField
          label="이름"
          value={searchConditions.name}
          onChange={(e) => setSearchConditions({...searchConditions, name: e.target.value})}
          size="small"
          sx={{
            width: '120px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              height: '36px',
              '&:hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              },
              '&.Mui-focused': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            },
            '& .MuiInputLabel-root': {
              fontWeight: '500',
              color: '#374151'
            }
          }}
        />
        <TextField
          label="이메일"
          value={searchConditions.email}
          onChange={(e) => setSearchConditions({...searchConditions, email: e.target.value})}
          size="small"
          sx={{
            width: '250px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              height: '36px',
              '&:hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              },
              '&.Mui-focused': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            },
            '& .MuiInputLabel-root': {
              fontWeight: '500',
              color: '#374151'
            }
          }}
        />
        <TextField
          label="전화번호"
          value={searchConditions.phone}
          onChange={(e) => {
            const value = e.target.value;
            const formattedValue = formatPhoneNumber(value);
            setSearchConditions({...searchConditions, phone: formattedValue});
          }}
          size="small"
          placeholder="000-0000-0000"
          sx={{
            width: '195px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease',
              height: '36px',
              '&:hover': {
                borderColor: '#3b82f6',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.1)'
              },
              '&.Mui-focused': {
                borderColor: '#3b82f6',
                boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
              }
            },
            '& .MuiInputLabel-root': {
              fontWeight: '500',
              color: '#374151'
            },
            '& .MuiInputBase-input::placeholder': {
              color: '#9ca3af',
              opacity: 1,
              fontSize: '14px'
            }
          }}
        />

        <Tooltip title="조회" arrow placement="top">
          <IconButton
            onClick={handleSearch}
            size="small"
            sx={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.4), 0 4px 6px -2px rgba(139, 92, 246, 0.3)'
              },
              '&:active': {
                transform: 'translateY(0px) scale(1.02)',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
              }
            }}
          >
            <SearchIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: 'calc(100vh - 200px)', 
        minHeight: '500px',
        width: '100%',
        position: 'relative',
        overflow: 'auto',
        contain: 'layout style paint'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={filteredUsers}
          pagination={false}
          rowSelection="single"
          animateRows={true}
          rowHeight={40}
          headerHeight={45}
          suppressRowClickSelection={false}
          enableCellTextSelection={true}
          suppressCellFocus={false}
          suppressPaginationPanel={true}
          suppressColumnVirtualisation={false}
          suppressRowVirtualisation={false}
          enableRangeSelection={false}
          suppressRowDeselection={true}
          suppressResizeObserver={true}
          suppressAnimationFrame={true}
          suppressBrowserResizeObserver={true}
          onGridReady={(params) => {
            setTimeout(() => {
              params.api.sizeColumnsToFit();
            }, 100);
          }}
          onFirstDataRendered={(params) => {
            setTimeout(() => {
              params.api.sizeColumnsToFit();
            }, 100);
          }}
        />
      </div>
      


      {/* 사용자 추가/수정 다이얼로그 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
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
          {editingUser ? '사용자 수정' : '새 사용자 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          {formData.is_active === 0 && (
            <Box sx={{ 
              mb: 3, 
              p: 3, 
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              border: '1px solid #f59e0b',
              borderRadius: '12px',
              color: '#92400e',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              ⚠️ 비활성화된 사용자는 로그인이 제한됩니다. 활성화 상태 필드에서 상태를 변경할 수 있습니다.
            </Box>
          )}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: 3, 
            mt: 2 
          }}>
            <TextField
              label="이름"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              fullWidth
              required
              disabled={formData.is_active === 0}
              error={!!validationErrors.name}
              helperText={validationErrors.name}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                  fontWeight: '500'
                }
              }}
            />
            <TextField
              label="이메일"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              fullWidth
              required
              disabled={formData.is_active === 0}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                  fontWeight: '500'
                }
              }}
            />
            <TextField
              label="비밀번호"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              fullWidth
              required={!editingUser}
              disabled={formData.is_active === 0}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                  fontWeight: '500'
                }
              }}
            />
            <TextField
              label="전화번호"
              value={formData.phone}
              onChange={handlePhoneChange}
              fullWidth
              placeholder="010-1234-5678"
              disabled={formData.is_active === 0}
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
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>역할</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                label="역할"
                disabled={formData.is_active === 0}
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
                {codeData['역할']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                )) || (
                  <>
                    <MenuItem value="일반">일반</MenuItem>
                    <MenuItem value="관리자">관리자</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>부서</InputLabel>
              <Select
                value={formData.department}
                onChange={(e) => setFormData({...formData, department: e.target.value})}
                label="부서"
                disabled={formData.is_active === 0}
                error={!!validationErrors.department}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                }}
              >
                <MenuItem value="">선택하세요</MenuItem>
                {codeData['부서']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.department && (
                <Typography sx={{ color: '#ef4444', fontSize: '12px', mt: 0.5, fontWeight: '500' }}>
                  ❌ {validationErrors.department}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>교사</InputLabel>
              <Select
                value={formData.teacher_type}
                onChange={(e) => setFormData({...formData, teacher_type: e.target.value})}
                label="교사"
                disabled={formData.is_active === 0}
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
                {codeData['교사']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>직책</InputLabel>
              <Select
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                label="직책"
                disabled={formData.is_active === 0}
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
                {codeData['직분']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="시작일"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={formData.is_active === 0}
              error={!!validationErrors.start_date}
              helperText={validationErrors.start_date}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                  fontWeight: '500'
                }
              }}
            />
            <TextField
              label="종료일"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={formData.is_active === 0}
              error={!!validationErrors.end_date}
              helperText={validationErrors.end_date}
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
                  },
                  '&.Mui-error': {
                    borderColor: '#ef4444',
                    '&:hover': {
                      borderColor: '#dc2626',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
                    }
                  }
                },
                '& .MuiInputLabel-root': {
                  fontWeight: '600',
                  color: '#374151'
                },
                '& .MuiFormHelperText-root': {
                  color: '#ef4444',
                  fontWeight: '500'
                }
              }}
            />
            <TextField
              label="생년월일"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={formData.is_active === 0}
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
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>활성화 상태</InputLabel>
              <Select
                value={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.value})}
                label="활성화 상태"
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
                  },
                  '& .MuiSelect-select': {
                    color: formData.is_active === 1 ? '#10b981' : '#ef4444',
                    fontWeight: 'bold'
                  },
                  '& .MuiOutlinedInput-root': {
                    border: '2px solid',
                    borderColor: formData.is_active === 1 ? '#10b981' : '#ef4444',
                    '&:hover': {
                      borderColor: formData.is_active === 1 ? '#059669' : '#dc2626'
                    }
                  }
                }}
              >
                <MenuItem value={1} sx={{ color: '#10b981', fontWeight: 'bold' }}>
                  ✅ 활성화
                </MenuItem>
                <MenuItem value={0} sx={{ color: '#ef4444', fontWeight: 'bold' }}>
                  ❌ 비활성화
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              border: '2px solid #6b7280',
              color: '#6b7280',
              background: 'transparent',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: '#6b7280',
                color: 'white',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(107, 114, 128, 0.3)'
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
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)'
              }
            }}
          >
            {editingUser ? '수정' : '추가'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 검증 오류 다이얼로그 */}
      <Dialog 
        open={showValidationDialog} 
        onClose={() => setShowValidationDialog(false)}
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
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          필수 항목 누락
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: '600', color: '#374151', mb: 2 }}>
              다음 필수 항목들을 입력해주세요:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(validationErrors).map(([field, error]) => (
                <Box key={field} sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  p: 1,
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  <Typography sx={{ color: '#ef4444', fontSize: '14px', fontWeight: '500' }}>
                    ❌ {error}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px' }}>
          <Button 
            onClick={() => setShowValidationDialog(false)}
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
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserRegistrationPage; 