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
  Search as SearchIcon,
  Image as ImageIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
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
  
  return (
    <div className="ag-grid-datepicker" style={{ width: '100%', height: '100%' }}>
      <TextField
        fullWidth
        size="small"
        value={date ? date.toISOString().split('T')[0] : ''}
        onClick={handleInputClick}
        InputProps={{
          readOnly: true,
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            height: '100%',
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: 'none',
            },
            '&.Mui-focused fieldset': {
              border: 'none',
            },
          },
        }}
      />
      {isOpen && (
        <div style={{ position: 'absolute', zIndex: 1000, top: '100%', left: 0 }}>
          <DatePicker
            selected={date}
            onChange={handleDateChange}
            onCalendarClose={handleCalendarClose}
            dateFormat="yyyy-MM-dd"
            locale="ko"
            inline
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

const NewComerManagementPage = () => {
  const { user } = useAuth();
  // 상태 관리
  const [newComers, setNewComers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNewComer, setEditingNewComer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '새가족위원회', // 고정값
    believer_type: '초신자', // 고정값
    education_type: '',
    start_date: '',
    end_date: '',
    file_id: null
  });
  const [codeDetails, setCodeDetails] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [gridRef] = useState(useRef());
  
  // 조회조건 상태
  const [searchConditions, setSearchConditions] = useState({
    year: new Date().getFullYear().toString(),
    name: '',
    education_type: '',
    phone: ''
  });
  const [filteredNewComers, setFilteredNewComers] = useState([]);
  const [codeGroups, setCodeGroups] = useState([]);
  const [showTransferButton, setShowTransferButton] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [commonFileImage, setCommonFileImage] = useState(null);
  const [openPrintPreview, setOpenPrintPreview] = useState(false);
  const [openBackPrintPreview, setOpenBackPrintPreview] = useState(false);
  const [selectedFileInfo, setSelectedFileInfo] = useState(null);
  const [selectedFilesInfo, setSelectedFilesInfo] = useState({});
  const [backPrintImage, setBackPrintImage] = useState(null);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [duplicateGraduates, setDuplicateGraduates] = useState([]);
  const [originalNumber, setOriginalNumber] = useState(null); // 기존 번호 저장용
  
  // 그리드 높이 상태
  const [gridHeight, setGridHeight] = useState('calc(100vh - 200px)');
  
  // 화면 크기에 따른 그리드 높이 계산 (초신자 수료자 관리와 동일)
  const calculateGridHeight = () => {
    const windowHeight = window.innerHeight;
    const calculatedHeight = windowHeight - 200; // 초신자 수료자 관리와 동일한 높이
    return Math.max(calculatedHeight, 400); // 최소 높이 400px 보장
  };
  
  // 화면 크기 변화 감지
  useEffect(() => {
    const handleResize = () => {
      setGridHeight(calculateGridHeight());
    };
    
    // 초기 높이 설정
    setGridHeight(calculateGridHeight());
    
    // 리사이즈 이벤트 리스너 추가
    window.addEventListener('resize', handleResize);
    
    // 클린업
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // AG Grid 컬럼 정의
  const columnDefs = [
    {
      headerName: '선택',
      width: 60,
      minWidth: 50,
      maxWidth: 70,
      sortable: false,
      filter: false,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        textAlign: 'center',
        fontSize: '14px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    {
      headerName: 'No',
      width: 80,
      minWidth: 60,
      maxWidth: 100,
      sortable: false,
      filter: false,
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
      width: 80,
      minWidth: 60,
      maxWidth: 100,
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
      }
    },
    {
      headerName: '파일',
      width: 80,
      minWidth: 60,
      maxWidth: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {params.data.file_id && (
              <Tooltip title="파일보기" arrow placement="top">
                <IconButton
                  size="small"
                  onClick={() => handleFileView(params.data.file_id)}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      transform: 'translateY(-1px) scale(1.05)',
                      boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                    },
                    '&:active': {
                      transform: 'translateY(0px) scale(1.02)',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                    }
                  }}
                >
                  <ImageIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Tooltip>
            )}
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
      headerName: '삭제',
      width: 80,
      minWidth: 60,
      maxWidth: 100,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const isGraduated = params.data.education_type === '수료';
        
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title={isGraduated ? "수료자는 삭제할 수 없습니다" : "삭제"} arrow placement="top">
              <span>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(params.data.id)}
                  disabled={isGraduated}
                  sx={{
                    background: isGraduated 
                      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
                      : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    boxShadow: isGraduated 
                      ? '0 1px 2px rgba(156, 163, 175, 0.2)' 
                      : '0 2px 4px rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: isGraduated ? 'not-allowed' : 'pointer',
                    opacity: isGraduated ? 0.6 : 1,
                    '&:hover': !isGraduated ? {
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      transform: 'translateY(-1px) scale(1.05)',
                      boxShadow: '0 4px 8px rgba(239, 68, 68, 0.3)'
                    } : {},
                    '&:active': !isGraduated ? {
                      transform: 'translateY(0px) scale(1.02)',
                      boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                    } : {},
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                      color: 'white',
                      cursor: 'not-allowed'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </span>
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
      field: 'year',
      headerName: '년도',
      width: 120,
      minWidth: 80,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
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
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'believer_type',
      headerName: '신자',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'education_type',
      headerName: '교육',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'graduate_transfer_status',
      headerName: '전송확인',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (!params.value) return '미전송';
        return params.value;
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'number',
      headerName: '번호',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellRenderer: (params) => {
        if (!params.data) return '';
        const { number } = params.data;
        return number || '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    {
      field: 'name',
      headerName: '이름',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    {
      field: 'gender',
      headerName: '성별',
      width: 100,
      minWidth: 80,
      maxWidth: 120,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'marital_status',
      headerName: '결혼',
      width: 120,
      minWidth: 100,
      maxWidth: 150,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'birth_date',
      headerName: '생년월일',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          // 한국시간으로 변환하여 하루 차이 문제 해결
          const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return koreanDate.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'phone',
      headerName: '전화번호',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'address',
      headerName: '주소',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'teacher',
      headerName: '양육교사',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'register_date',
      headerName: '등록신청일',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          // 한국시간으로 변환하여 하루 차이 문제 해결
          const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return koreanDate.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'education_start_date',
      headerName: '양육시작일',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          // 한국시간으로 변환하여 하루 차이 문제 해결
          const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return koreanDate.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
              field: 'education_end_date',
      headerName: '양육종료일',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          // 한국시간으로 변환하여 하루 차이 문제 해결
          const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return koreanDate.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'affiliation_org',
      headerName: '편입기관',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'belong',
      headerName: '소속',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'new_life_strategy_date',
      headerName: '새생명전략',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          // 한국시간으로 변환하여 하루 차이 문제 해결
          const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
          return koreanDate.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'identity_verified',
      headerName: '본인인증',
      width: 150,
      minWidth: 120,
      maxWidth: 200,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'prev_church',
      headerName: '전소속교회',
      width: 180,
      minWidth: 150,
      maxWidth: 250,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    },
    {
      field: 'comment',
      headerName: '기타',
      width: 200,
      minWidth: 150,
      maxWidth: 300,
      sortable: true,
      filter: true,
      editable: false,
      resizable: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        lineHeight: '20px'
      }
    }
  ];

  // AG Grid 기본 설정
  const defaultColDef = {
    flex: 1,
    minWidth: 150,
    maxWidth: 300,
    resizable: true,
    sortable: true,
    filter: true,
    headerClass: 'ag-header-cell-separator',
    cellStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%'
    },
    headerStyle: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }
  };

  const gridOptions = {
    pagination: true,
    paginationPageSize: 20,
    paginationPageSizeSelector: [10, 20, 50, 100],
    suppressRowClickSelection: true,
    suppressCellFocus: true,
    suppressColumnVirtualisation: false,
    suppressHorizontalScroll: false,
    domLayout: 'normal',
    suppressAnimationFrame: true,
    suppressBrowserResizeObserver: true,
    suppressMenuHide: true,
    suppressMenuShow: false
  };

  // 코드 그룹과 상세 코드 가져오기
  const fetchCodeData = async () => {
    try {
      // 코드 그룹 가져오기
      const groupsResponse = await fetch('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setCodeGroups(groupsData);
        
        // 각 그룹별로 상세 코드 가져오기
        const detailsMap = {};
        for (const group of groupsData) {
          const detailsResponse = await fetch(`/api/code-details?group_id=${group.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            detailsMap[group.group_code] = detailsData;
          }
        }
        setCodeDetails(detailsMap);
        console.log('코드 데이터 로드 완료:', detailsMap);
      }
    } catch (error) {
      console.error('코드 데이터 가져오기 실패:', error);
    }
  };

  // 초신자 목록 가져오기 (조회 조건 포함)
  const fetchNewComers = async (searchParams = null) => {
    try {
      let url = '/api/new-comers';
      
      // 조회 조건이 있으면 쿼리 파라미터로 추가
      if (searchParams) {
        const queryParams = new URLSearchParams();
        
        if (searchParams.year && searchParams.year.trim() !== '') {
          queryParams.append('year', searchParams.year);
        }
        if (searchParams.name && searchParams.name.trim() !== '') {
          queryParams.append('name', searchParams.name);
        }
        // 초신자관리는 항상 초신자만 조회하므로 believer_type 조건은 제거
        if (searchParams.education_type && searchParams.education_type.trim() !== '') {
          queryParams.append('education_type', searchParams.education_type);
        }
        if (searchParams.phone && searchParams.phone.trim() !== '') {
          queryParams.append('phone', searchParams.phone);
        }
        
        if (queryParams.toString()) {
          url += '?' + queryParams.toString();
        }
      }
      
      console.log('조회 URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      // API 응답이 배열인지 확인하고 배열이 아니면 빈 배열로 설정
      const newComersData = Array.isArray(data) ? data : [];
      setNewComers(newComersData);
      setFilteredNewComers(newComersData); // 조회 결과를 필터링된 데이터로 설정
    } catch (error) {
      console.error('초신자 목록 가져오기 실패:', error);
    }
  };

  // 폼 제출 처리
  const handleSubmit = async () => {
    // 기본 필수 입력값 검증
    if (!formData.department || !formData.believer_type || !formData.education_type || !formData.year || !formData.name || !formData.register_date) {
      alert('부서, 신자, 교육, 년도, 이름, 등록신청일은 필수 입력 항목입니다.');
      return;
    }

    // 교육이 '수료'인 경우 추가 필수 입력값 검증
    if (formData.education_type === '수료') {
      if (!formData.education_start_date) {
        alert('교육이 수료인 경우 양육시작일은 필수 입력 항목입니다.');
        return;
      }
      if (!formData.education_end_date) {
        alert('교육이 수료인 경우 양육종료일은 필수 입력 항목입니다.');
        return;
      }
    }

    try {
      const url = editingNewComer 
        ? `/api/new-comers/${editingNewComer.id}`
        : '/api/new-comers';
      
      const method = editingNewComer ? 'PUT' : 'POST';
      
      // 교육 상태가 수료에서 다른 상태로 변경된 경우 전송확인 상태 초기화
      let submitData = { ...formData };
      if (editingNewComer && editingNewComer.education_type === '수료' && formData.education_type !== '수료') {
        submitData.graduate_transfer_status = '미전송';
      }
      
      // 부서는 항상 고정값으로 설정
      submitData.department = '새가족위원회';
      
      // 신자구분은 formData에서 가져온 값 사용 (수정 모드에서 변경 가능)
      // submitData.believer_type은 이미 formData에서 설정된 값 사용
      
      // 빈 문자열을 null로 변환
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === '') {
          submitData[key] = null;
        }
      });
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 알림
        if (responseData.number) {
          console.log('신자구분 변경으로 번호가 업데이트되었습니다:', responseData.number);
        }
        
        setOpenDialog(false);
        resetForm();
        fetchNewComers(searchConditions);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('초신자 저장 실패:', error);
      alert('초신자 저장 중 오류가 발생했습니다.');
    }
  };

    // 수료자 중복 확인
  const checkDuplicateGraduate = async (name, birthDate) => {
    try {
      console.log('중복 확인 시작:', { name, birthDate });
      
      // 일반 조회 API를 사용하여 중복 확인
      const response = await fetch(`/api/graduates?name=${encodeURIComponent(name)}&birth_date=${encodeURIComponent(birthDate)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('중복 확인 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('중복 확인 응답 데이터:', data);
        
        // 배열로 반환되는 경우
        if (Array.isArray(data) && data.length > 0) {
          console.log('중복 발견:', data);
          return data; // 모든 중복 수료자 반환
        } 
        // 객체로 반환되는 경우 (check-duplicate 엔드포인트)
        else if (data.duplicate && data.graduate) {
          console.log('중복 발견:', data.graduate);
          return [data.graduate]; // 배열로 반환
        } else {
          console.log('중복 없음');
          return [];
        }
      } else {
        console.error('중복 확인 API 오류:', response.status, response.statusText);
        const errorData = await response.json().catch(() => ({}));
        console.error('중복 확인 오류 상세:', errorData);
        return [];
      }
    } catch (error) {
      console.error('중복 확인 실패:', error);
      return [];
    }
  };

  // 수료자 업데이트
  const updateGraduate = async (graduateId, updateData) => {
    try {
      const response = await fetch(`/api/graduates/${graduateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('수료자 정보가 업데이트되었습니다.');
        setOpenDuplicateDialog(false);
        setOpenDialog(false);
        resetForm();
        fetchNewComers(searchConditions);
        return true;
      } else {
        const errorData = await response.json();
        alert(errorData.error || '수료자 업데이트 중 오류가 발생했습니다.');
        return false;
      }
    } catch (error) {
      console.error('수료자 업데이트 실패:', error);
      alert('수료자 업데이트 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 수료 전송 처리
  const handleGraduateTransfer = async () => {
    // 필수 필드 검증
    const requiredFields = [
      { field: 'department', name: '부서' },
      { field: 'believer_type', name: '신자' },
      { field: 'education_type', name: '교육' },
      { field: 'year', name: '년도' },
      { field: 'name', name: '이름' },
      { field: 'gender', name: '성별' },
      { field: 'birth_date', name: '생년월일' },
              { field: 'teacher', name: '양육교사' },
      { field: 'register_date', name: '등록신청일' },
              { field: 'education_start_date', name: '양육시작일' },
              { field: 'education_end_date', name: '양육종료일' }
    ];

    const missingFields = requiredFields.filter(item => {
      const value = formData[item.field];
      return !value || value.trim() === '';
    });

    if (missingFields.length > 0) {
      const missingFieldNames = missingFields.map(item => item.name).join(', ');
      alert(`다음 필수 항목을 입력해주세요:\n${missingFieldNames}`);
      return;
    }

    try {
      // 전송 데이터에서 빈 문자열을 null로 변환
      const transferData = { ...formData };
      
      // 부서는 항상 고정값으로 설정
      transferData.department = '새가족위원회';
      
      // 신자구분은 초신자로 고정
      transferData.believer_type = '초신자';
      
      Object.keys(transferData).forEach(key => {
        if (transferData[key] === '') {
          transferData[key] = null;
        }
      });

      // 중복 확인
      console.log('중복 확인 시작 - 전송 데이터:', transferData);
      
      // 강제로 중복 확인을 위해 테스트 데이터로 확인
      console.log('=== 중복 확인 테스트 ===');
      const testName = transferData.name;
      const testBirthDate = transferData.birth_date;
      console.log('테스트할 이름:', testName);
      console.log('테스트할 생년월일:', testBirthDate);
      
      const duplicateGraduates = await checkDuplicateGraduate(transferData.name, transferData.birth_date);
      console.log('중복 확인 결과:', duplicateGraduates);
      
      if (duplicateGraduates && duplicateGraduates.length > 0) {
        console.log('중복 발견 - 팝업 표시');
        // 중복된 수료자가 있는 경우 팝업 표시
        setDuplicateGraduates(duplicateGraduates);
        setOpenDuplicateDialog(true);
        return;
      }
      
      console.log('중복 없음 - 바로 전송 진행');
      console.log('전송할 데이터:', transferData);
      console.log('초신자 ID:', editingNewComer.id);

      // 중복이 없는 경우 기존 전송 로직 실행
      const response = await fetch(`/api/new-comers/${editingNewComer.id}/graduate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(transferData)
      });

      if (response.ok) {
        alert('수료 전송이 완료되었습니다.');
        setOpenDialog(false);
        resetForm();
        fetchNewComers(searchConditions);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '수료 전송 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('수료 전송 실패:', error);
      alert('수료 전송 중 오류가 발생했습니다.');
    }
  };

  // 삭제 처리
  const handleDelete = async (newComerId) => {
    // 삭제할 초신자 정보 조회
    const newComer = newComers.find(nc => nc.id === newComerId);
    
    // 수료자인 경우 삭제 불가
    if (newComer && newComer.education_type === '수료') {
      alert('수료자는 삭제할 수 없습니다.');
      return;
    }
    
    let confirmMessage = '정말로 삭제하시겠습니까?';
    
    if (newComer && newComer.file_id) {
      confirmMessage = '파일이 연결된 초신자입니다. 파일도 함께 삭제하시겠습니까?';
    }
    
    if (window.confirm(confirmMessage)) {
      try {
        const response = await fetch(`/api/new-comers/${newComerId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          fetchNewComers(searchConditions);
        } else {
          const errorData = await response.json();
          alert(errorData.error || '삭제 중 오류가 발생했습니다.');
        }
      } catch (error) {
        console.error('초신자 삭제 실패:', error);
        alert('초신자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 수정 모드로 변경
  const handleEdit = (newComer) => {
    setEditingNewComer(newComer);
    
    // 날짜 형식 변환 함수 (한국시간 기준)
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      // 한국시간으로 변환하여 하루 차이 문제 해결
      const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      return koreanDate.toISOString().split('T')[0];
    };
    
    // 전송 버튼 표시 여부 설정
    const shouldShowTransferButton = newComer.education_type === '수료' && 
      (newComer.graduate_transfer_status === '' || newComer.graduate_transfer_status === null || newComer.graduate_transfer_status === '미전송');
    setShowTransferButton(shouldShowTransferButton);
    
    // 기존 번호 저장
    setOriginalNumber(newComer.number || '');
    
    setFormData({
      department: '새가족위원회', // 고정값
      believer_type: newComer.believer_type || '초신자', // 수정 시 실제 값 사용
      education_type: newComer.education_type || '',
      year: newComer.year || '',
      name: newComer.name || '',
      gender: newComer.gender || '',
      marital_status: newComer.marital_status || '',
      birth_date: formatDateForInput(newComer.birth_date),
      address: newComer.address || '',
      phone: newComer.phone || '',
      teacher: newComer.teacher || '',
      register_date: formatDateForInput(newComer.register_date),
      education_start_date: formatDateForInput(newComer.education_start_date),
              education_end_date: formatDateForInput(newComer.education_end_date),
      affiliation_org: newComer.affiliation_org || '',
      belong: newComer.belong || '',
      new_life_strategy_date: formatDateForInput(newComer.new_life_strategy_date),
      identity_verified: newComer.identity_verified || '',
      prev_church: newComer.prev_church || '',
      comment: newComer.comment || '',
      number: newComer.number || '',
      graduate_transfer_status: newComer.graduate_transfer_status || '',
      file_id: newComer.file_id || null
    });
    setSelectedFile(null);
    setUploadedFile(null);
    
    // 기존 파일 정보 로드
    if (newComer.file_id) {
      fetchFileInfo(newComer.file_id);
    }
    
    // 교사 목록 로드 (수정 시에는 실제 값 사용)
    fetchTeachers('새가족위원회', newComer.believer_type || '초신자');
    
    setOpenDialog(true);
  };

  // 파일 정보 가져오기 함수
  const fetchFileInfo = async (fileId) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const fileInfo = await response.json();
        setUploadedFile(fileInfo);
      } else {
        console.error('파일 정보를 가져올 수 없습니다.');
      }
    } catch (error) {
      console.error('파일 정보 가져오기 실패:', error);
    }
  };

  // 새 초신자 추가
  const handleAdd = () => {
    setEditingNewComer(null);
    resetForm();
    setOpenDialog(true);
  };

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

  // 파일 선택 처리 함수
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 원본 파일명 저장 (화면 표시용)
      const originalName = file.name;
      
      // 파일명을 조합형으로 정규화
      const normalizedFileName = file.name.normalize('NFC');
      console.log('원본 파일명:', originalName);
      console.log('정규화된 파일명:', normalizedFileName);
      console.log('원본 파일명 길이:', originalName.length);
      console.log('정규화된 파일명 길이:', normalizedFileName.length);
      
      // 정규화된 파일명을 URL 인코딩
      const encodedFileName = encodeURIComponent(normalizedFileName);
      console.log('인코딩된 파일명:', encodedFileName);
      console.log('인코딩된 파일명 길이:', encodedFileName.length);
      
      // 인코딩된 파일명으로 새로운 File 객체 생성
      const encodedFile = new File([file], encodedFileName, {
        type: file.type,
        lastModified: file.lastModified
      });
      
      setSelectedFile(encodedFile);
      setOriginalFileName(originalName); // 화면 표시용 원본 파일명
    }
  };

  // 파일 업로드 함수
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('파일을 선택해주세요.');
      return;
    }

    const formData = new FormData();
    // 인코딩된 파일명 사용 (서버 전송용)
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFile(result);
        setFormData(prev => ({ ...prev, file_id: result.id }));
        alert('파일이 성공적으로 업로드되었습니다.');
      } else {
        let errorMessage = '파일 업로드 중 오류가 발생했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      alert('파일 업로드 중 오류가 발생했습니다.');
    }
  };

  // 파일 삭제 함수
  const handleFileDelete = async () => {
    if (!uploadedFile) {
      alert('삭제할 파일이 없습니다.');
      return;
    }

    if (!window.confirm('업로드된 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${uploadedFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUploadedFile(null);
        setFormData(prev => ({ ...prev, file_id: null }));
        setSelectedFile(null);
        alert('파일이 삭제되었습니다.');
      } else {
        let errorMessage = '파일 삭제 중 오류가 발생했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      alert('파일 삭제 중 오류가 발생했습니다.');
    }
  };

  // 파일 보기 함수
  const handleFileView = async (fileId = null) => {
    const targetFileId = fileId || (uploadedFile ? uploadedFile.id : null);
    
    if (!targetFileId) {
      alert('볼 파일이 없습니다.');
      return;
    }

    try {
      const response = await fetch(`/api/files/download/${targetFileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // 파일 다운로드 또는 새 창에서 열기
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // 파일 타입에 따라 처리
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.startsWith('image/')) {
          // 이미지 파일은 새 창에서 열기
          const newWindow = window.open(url, '_blank');
          if (!newWindow) {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
          }
        } else if (contentType === 'application/pdf') {
          // PDF 파일은 새 창에서 열기
          const newWindow = window.open(url, '_blank');
          if (!newWindow) {
            alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
          }
        } else {
          // 기타 파일은 다운로드
          const a = document.createElement('a');
          a.href = url;
          a.download = 'file';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        
        // 메모리 정리
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        let errorMessage = '파일 다운로드 중 오류가 발생했습니다.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('응답 파싱 오류:', parseError);
          errorMessage = `서버 오류 (${response.status}): ${response.statusText}`;
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('파일 보기 실패:', error);
      alert('파일 보기 중 오류가 발생했습니다.');
    }
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      department: '새가족위원회', // 고정값
      believer_type: '초신자', // 초신자관리는 초신자로 고정
      education_type: '등록', // 기본값 설정
      year: new Date().getFullYear().toString(),
      name: '',
      gender: '',
      marital_status: '',
      birth_date: '',
      address: '',
      phone: '',
      teacher: '',
      register_date: '',
      education_start_date: '',
              education_end_date: '',
      affiliation_org: '',
      belong: '',
      new_life_strategy_date: '',
      identity_verified: '0', // 기본값 설정
      prev_church: '',
      comment: '',
      number: '',
      graduate_transfer_status: '',
      file_id: null
    });
    setSelectedFile(null);
    setOriginalFileName('');
    setUploadedFile(null);
    setOriginalNumber(null); // 기존 번호 초기화
  };

  // Excel 다운로드
  const handleExcelDownload = () => {
    // 그리드 컬럼 순서에 맞춰 헤더 매핑 생성 (버튼 컬럼들 제외)
    const orderedFields = [
      'year',
      'department', 
      'believer_type',
      'education_type',
      'graduate_transfer_status',
      'number',
      'name',
      'gender',
      'marital_status',
      'birth_date',
      'phone',
      'address',
      'teacher',
      'register_date',
      'education_start_date',
              'education_end_date',
      'affiliation_org',
      'belong',
      'new_life_strategy_date',
      'identity_verified',
      'prev_church',
      'comment'
    ];

    const headerMapping = {
      'year': '년도',
      'department': '부서',
      'believer_type': '신자',
      'education_type': '교육',
      'graduate_transfer_status': '전송확인',
      'number': '번호',
      'name': '이름',
      'gender': '성별',
      'marital_status': '결혼',
      'birth_date': '생년월일',
      'phone': '전화번호',
      'address': '주소',
      'teacher': '양육교사',
      'register_date': '등록신청일',
      'education_start_date': '양육시작일',
              'education_end_date': '양육종료일',
      'affiliation_org': '편입기관',
      'belong': '소속',
      'new_life_strategy_date': '새생명전략',
      'identity_verified': '본인인증',
      'prev_church': '전소속교회',
      'comment': '기타'
    };

    // 데이터를 그리드 순서대로 변환 (No 컬럼 추가)
    const excelData = newComers.map((item, index) => {
      const convertedItem = {
        'No': index + 1 // No 컬럼 추가
      };
      
      // 그리드 순서대로 필드 추가
      orderedFields.forEach(field => {
        if (item[field] !== undefined) {
          convertedItem[headerMapping[field]] = item[field];
        }
      });
      
      return convertedItem;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '초신자관리');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `초신자관리_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  };

  // Excel 업로드
  const handleExcelUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      console.log('파일이 선택되지 않았습니다.');
      return;
    }

    console.log('선택된 파일:', file.name, file.size, 'bytes');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        console.log('파일 읽기 시작...');
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { 
          type: 'array',
          cellDates: true,  // 날짜를 Date 객체로 파싱
          dateNF: 'yyyy-mm-dd'  // 날짜 형식 지정
        });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          dateNF: 'yyyy-mm-dd',  // 날짜 형식 지정
          raw: false  // 원시 값 대신 형식화된 값 사용
        });
        
        console.log('엑셀 데이터 파싱 완료:', jsonData.length, '행');
        console.log('첫 번째 행 샘플 (변환 전):', jsonData[0]);
        
        // NFC 정규화 및 날짜 필드 변환
        const convertedData = jsonData.map(row => {
          const converted = { ...row };
          
          // 모든 문자열 필드에 NFC 정규화 적용
          Object.keys(converted).forEach(key => {
            if (typeof converted[key] === 'string') {
              converted[key] = converted[key].normalize('NFC');
            }
          });
          
          // 날짜로 보이는 필드들 변환
          ['생년월일', '등록신청일', '양육시작일', '양육종료일', '새생명전략', 
           'birth_date', 'register_date', 'education_start_date', 'education_end_date', 'new_life_strategy_date'].forEach(field => {
            if (converted[field] !== undefined && converted[field] !== null) {
              converted[field] = convertDateField(converted[field]);
            }
          });
          return converted;
        });
        
        console.log('첫 번째 행 샘플 (변환 후):', convertedData[0]);
        
        // 서버로 데이터 전송
        console.log('서버로 데이터 전송 시작...');
        const response = await fetch('/api/new-comers/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(convertedData)
        });
        
        console.log('서버 응답 상태:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('업로드 성공:', result);
          await fetchNewComers(searchConditions);
          alert(`Excel 파일이 성공적으로 업로드되었습니다. (${result.uploadedCount || convertedData.length}개 데이터)`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('서버 오류:', response.status, errorData);
          throw new Error(`Upload failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Excel 파일 처리 실패:', error);
        alert(`Excel 파일 처리 중 오류가 발생했습니다: ${error.message}`);
      }
    };
    
    reader.onerror = (error) => {
      console.error('파일 읽기 오류:', error);
      alert('파일 읽기 중 오류가 발생했습니다.');
    };
    
    reader.readAsArrayBuffer(file);
  };

  // 조회 함수 (백엔드 API 호출)
  const handleSearch = async () => {
    try {
      console.log('조회 조건:', searchConditions);
      await fetchNewComers(searchConditions);
    } catch (error) {
      console.error('조회 실패:', error);
      alert('조회 중 오류가 발생했습니다.');
    }
  };

  // 조회 조건 초기화
  const handleResetSearch = async () => {
    const resetConditions = {
      year: new Date().getFullYear().toString(),
      name: '',
      education_type: '',
      phone: ''
    };
    setSearchConditions(resetConditions);
    
    // 초기화된 조건으로 전체 데이터 조회 (조건 없이)
    try {
      await fetchNewComers();
    } catch (error) {
      console.error('초기화 후 조회 실패:', error);
    }
  };

  // 전화번호 자동 하이픈 함수
  const formatPhoneNumberForSearch = (value) => {
    const phoneNumber = value.replace(/[^0-9]/g, '');
    if (phoneNumber.length <= 3) {
      return phoneNumber;
    } else if (phoneNumber.length <= 7) {
      return phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3);
    } else {
      return phoneNumber.slice(0, 3) + '-' + phoneNumber.slice(3, 7) + '-' + phoneNumber.slice(7, 11);
    }
  };

  // 전화번호 입력 처리
  const handlePhoneSearchChange = (e) => {
    const formattedPhone = formatPhoneNumberForSearch(e.target.value);
    setSearchConditions({...searchConditions, phone: formattedPhone});
  };

  useEffect(() => {
    fetchCodeData();
    // 초기 로드시 현재년도로 조회
    const currentYear = new Date().getFullYear().toString();
    fetchNewComers({ year: currentYear });
    // 초기 교사 목록 로드 (고정값 사용)
    fetchTeachers('새가족위원회', '초신자');
    // 공통파일 이미지 가져오기
    fetchCommonFileImage();
  }, []);



  // 공통파일에서 새가족양육카드작성.png 가져오기
  const fetchCommonFileImage = async () => {
    try {
      console.log('공통파일 이미지 가져오기 시작');
      
      const response = await fetch('http://localhost:3001/api/common-files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('공통파일 API 응답 상태:', response.status);
      
      if (response.ok) {
        const files = await response.json();
        console.log('공통파일 목록:', files);
        console.log('공통파일 개수:', files.length);
        
        // 파일명과 설명으로 검색
        const targetFile = files.find(file => {
          const matchByName = file.original_name === '새가족양육카드작성.png';
          const matchByDescription = file.description === '새가족양육카드작성';
          const matchByPartialName = file.original_name && file.original_name.includes('양육카드');
          
          console.log(`파일 ${file.id}:`, {
            original_name: file.original_name,
            description: file.description,
            matchByName,
            matchByDescription,
            matchByPartialName
          });
          
          return matchByName || matchByDescription || matchByPartialName;
        });
        
        console.log('찾은 양육카드 파일:', targetFile);
        
        if (targetFile) {
          console.log('양육카드 파일 설정:', targetFile);
          console.log('양육카드 saved_path:', targetFile.saved_path);
          setCommonFileImage(targetFile);
        } else {
          console.log('양육카드 파일을 찾을 수 없음');
          // 첫 번째 파일이라도 설정해보기
          if (files.length > 0) {
            console.log('첫 번째 파일을 임시로 설정:', files[0]);
            console.log('첫 번째 파일 saved_path:', files[0].saved_path);
            setCommonFileImage(files[0]);
          }
        }
      } else {
        console.error('공통파일 API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('공통파일 이미지 가져오기 실패:', error);
    }
  };

  // 공통파일에서 새가족교육수료교제카드.png 가져오기 (뒷면프린트용)
  const fetchBackPrintImage = async () => {
    try {
      console.log('뒷면프린트 이미지 가져오기 시작');
      
      const response = await fetch('http://localhost:3001/api/common-files', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const files = await response.json();
        console.log('공통파일 목록:', files);
        
        // 파일명과 설명으로 검색
        const targetFile = files.find(file => {
          const matchByName = file.original_name === '새가족교육수료교제카드.png';
          const matchByDescription = file.description === '새가족교육수료교제카드';
          const matchByPartialName = file.original_name && file.original_name.includes('수료교제카드');
          
          console.log(`파일 ${file.id}:`, {
            original_name: file.original_name,
            description: file.description,
            matchByName,
            matchByDescription,
            matchByPartialName
          });
          
          return matchByName || matchByDescription || matchByPartialName;
        });
        
        console.log('찾은 수료교제카드 파일:', targetFile);
        
        if (targetFile) {
          console.log('수료교제카드 파일 설정:', targetFile);
          setBackPrintImage(targetFile);
        } else {
          console.log('수료교제카드 파일을 찾을 수 없음');
          alert('새가족교육수료교제카드.png 파일을 찾을 수 없습니다. 공통파일관리에서 파일을 등록해주세요.');
        }
      } else {
        console.error('공통파일 API 응답 실패:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('뒷면프린트 이미지 가져오기 실패:', error);
    }
  };

  // saved_path에서 상대 경로 추출하는 함수
  const getRelativePath = (savedPath) => {
    if (!savedPath) return '';
    
    // 여러 가능한 절대 경로 패턴 처리
    const patterns = [
      '/Users/cursor/nodejsweb/backend/uploads/',
      '/Users/cursor/nodejsweb/frontend/uploads/',
      'C:\\Users\\cursor\\nodejsweb\\backend\\uploads\\',
      'C:\\Users\\cursor\\nodejsweb\\frontend\\uploads\\'
    ];
    
    for (const pattern of patterns) {
      if (savedPath.startsWith(pattern)) {
        return savedPath.replace(pattern, '');
      }
    }
    
    // 이미 상대 경로인 경우 그대로 반환
    return savedPath;
  };

  // 선택된 행의 파일 정보 가져오기
  const fetchSelectedFileInfo = async (fileId) => {
    if (!fileId) {
      setSelectedFileInfo(null);
      return;
    }
    
    try {
              // new_comers_files 테이블에서 파일 정보 조회
      const response = await fetch(`http://localhost:3001/api/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const fileInfo = await response.json();
        console.log('가져온 파일 정보:', fileInfo);
        console.log('원본 saved_path:', fileInfo.saved_path);
        console.log('변환된 상대 경로:', getRelativePath(fileInfo.saved_path));
        setSelectedFileInfo(fileInfo);
      } else {
        console.error('파일 정보 가져오기 실패:', response.status);
        setSelectedFileInfo(null);
      }
    } catch (error) {
      console.error('파일 정보 가져오기 실패:', error);
      setSelectedFileInfo(null);
    }
  };

  // 선택된 모든 행의 파일 정보 가져오기
  const fetchAllSelectedFilesInfo = async (selectedRows) => {
    if (!selectedRows || selectedRows.length === 0) {
      setSelectedFileInfo(null);
      setSelectedFilesInfo({});
      return;
    }
    
    // 모든 선택된 행의 파일 정보를 가져오기
    const filesInfo = {};
    for (const row of selectedRows) {
      if (row.file_id) {
        try {
          const response = await fetch(`http://localhost:3001/api/files/${row.file_id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const fileInfo = await response.json();
            filesInfo[row.id || row.file_id] = fileInfo;
          }
        } catch (error) {
          console.error('파일 정보 가져오기 실패:', error);
        }
      }
    }
    
    setSelectedFilesInfo(filesInfo);
    
    // 첫 번째 행의 파일 정보를 가져오기 (기존 로직 유지)
    if (selectedRows[0].file_id) {
      await fetchSelectedFileInfo(selectedRows[0].file_id);
    }
  };

  // 이미지를 Base64로 변환하는 함수
  const fetchImageAsBase64 = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Base64 데이터만 추출
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('이미지 Base64 변환 실패:', error);
      return null;
    }
  };

  // 교사 목록 가져오기 (사용자등록에서 초신자교사 가져오기)
  const fetchTeachers = async (department, believer_type) => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const usersData = await response.json();
        const today = new Date().toISOString().split('T')[0]; // 현재 날짜 (YYYY-MM-DD)
        
        // 부서가 새가족위원회이고, 종료일자가 현재 일자 이후이고, 활성화된 사용자들 필터링
        console.log('전체 사용자 데이터:', usersData);
        console.log('현재 날짜:', today);
        
        const teachersData = usersData
          .filter(user => {
            console.log('사용자 체크:', user.name, 'is_active:', user.is_active, 'department:', user.department, 'end_date:', user.end_date, 'teacher_status:', user.teacher_status);
            
            // 활성화되지 않은 사용자 제외
            if (user.is_active !== 1) {
              console.log('활성화되지 않음:', user.name);
              return false;
            }
            
            // 부서가 새가족위원회가 아닌 경우 제외
            if (user.department !== '새가족위원회') {
              console.log('새가족위원회가 아님:', user.name, 'department:', user.department);
              return false;
            }
            
            // 교사상태가 '재직'이 아닌 경우 제외
            if (user.teacher_status !== '재직') {
              console.log('재직이 아님:', user.name, 'teacher_status:', user.teacher_status);
              return false;
            }
            
            // 종료일자가 없는 경우 (무기한) 포함
            if (!user.end_date || user.end_date.trim() === '') {
              console.log('무기한 사용자 포함:', user.name);
              return true;
            }
            
            // 종료일자가 현재일자 이후인 경우 포함
            const isEndDateValid = user.end_date >= today;
            console.log('종료일자 체크:', user.name, 'end_date:', user.end_date, 'today:', today, '결과:', isEndDateValid);
            return isEndDateValid;
          })
          .map(user => ({
            id: user.id,
            name: user.name,
            department: user.department || '부서없음',
            teacher: user.teacher_type || '교사없음',
            position: user.position || '직책없음',
            end_date: user.end_date || '무기한'
          }));
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error('교사 목록 가져오기 실패:', error);
    }
  };

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      
      {/* 버튼 그룹 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: -7.5, alignItems: 'center' }}>
        <Tooltip title="새 초신자 추가" arrow placement="top">
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

        <Tooltip title="Excel 다운로드" arrow placement="top">
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

        <Tooltip title="Excel 업로드" arrow placement="top">
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
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleExcelUpload}
            />
          </IconButton>
        </Tooltip>

        {/* 조회조건 */}
        <Box sx={{ display: 'flex', gap: 1, ml: 2, alignItems: 'center' }}>
          <TextField
            label="년도"
            value={searchConditions.year}
            onChange={(e) => setSearchConditions({...searchConditions, year: e.target.value})}
            size="small"
            sx={{
              width: 80,
              '& .MuiOutlinedInput-root': {
                height: '36px',
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
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151'
              }
            }}
          />
          <TextField
            label="이름"
            value={searchConditions.name}
            onChange={(e) => setSearchConditions({...searchConditions, name: e.target.value})}
            size="small"
            sx={{
              width: 120,
              '& .MuiOutlinedInput-root': {
                height: '36px',
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
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151'
              }
            }}
          />

          <FormControl size="small" sx={{ width: 120 }}>
            <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>교육</InputLabel>
            <Select
              value={searchConditions.education_type}
              onChange={(e) => setSearchConditions({...searchConditions, education_type: e.target.value})}
              sx={{
                height: '36px',
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
              <MenuItem value="">전체</MenuItem>
              {codeDetails['교육']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="전화번호"
            value={searchConditions.phone}
            onChange={handlePhoneSearchChange}
            size="small"
            sx={{
              width: 150,
              '& .MuiOutlinedInput-root': {
                height: '36px',
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
                fontSize: '12px',
                fontWeight: '600',
                color: '#374151'
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
          <Tooltip title="초기화" arrow placement="top">
            <IconButton
              onClick={handleResetSearch}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                width: 36,
                height: 36,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3), 0 2px 4px -1px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ml: 1, // 조회 버튼과 간격
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
              <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>↺</Box>
            </IconButton>
          </Tooltip>
          
          {/* 프린트 버튼 */}
          <Tooltip title="새가족양육카드 프린트" arrow placement="top">
            <IconButton
              onClick={() => {
                console.log('프린트 미리보기 열기');
                console.log('현재 선택된 행:', selectedRows);
                console.log('현재 selectedFileInfo:', selectedFileInfo);
                
                // 선택된 행이 있지만 파일 정보가 없으면 다시 가져오기
                if (selectedRows.length > 0 && selectedRows[0].file_id && !selectedFileInfo) {
                  console.log('파일 정보 재가져오기:', selectedRows[0].file_id);
                  fetchSelectedFileInfo(selectedRows[0].file_id);
                }
                
                setOpenPrintPreview(true);
              }}
              disabled={selectedRows.length === 0}
              size="small"
              sx={{
                background: selectedRows.length === 0 
                  ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
                width: 36,
                height: 36,
                borderRadius: '12px',
                boxShadow: selectedRows.length === 0 
                  ? '0 4px 6px -1px rgba(156, 163, 175, 0.3)'
                  : '0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ml: 1, // 초기화 버튼과 간격
                '&:hover': selectedRows.length > 0 ? {
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  transform: 'translateY(-2px) scale(1.05)',
                  boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.4), 0 4px 6px -2px rgba(139, 92, 246, 0.3)'
                } : {},
                '&:active': selectedRows.length > 0 ? {
                  transform: 'translateY(0px) scale(1.02)',
                  boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
                } : {}
              }}
            >
              <PrintIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>

          {/* 뒷면프린트 버튼 */}
          <Tooltip title="새가족교육수료교제카드 프린트" arrow placement="top">
            <IconButton
              onClick={() => {
                console.log('뒷면프린트 미리보기 열기');
                fetchBackPrintImage();
                setOpenBackPrintPreview(true);
              }}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                width: 36,
                height: 36,
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3), 0 2px 4px -1px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ml: 1, // 프린트 버튼과 간격
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
              <PrintIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: `${gridHeight}px`, 
        minHeight: '400px',
        width: '100%',
        marginTop: '-4px'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={(() => {
            if (Array.isArray(filteredNewComers) && filteredNewComers.length > 0) {
              return filteredNewComers;
            }
            if (Array.isArray(newComers)) {
              return newComers;
            }
            return [];
          })()}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          animateRows={true}
          rowSelection="multiple"
          suppressRowClickSelection={true}
          pagination={false}
          suppressPaginationPanel={true}
          onSelectionChanged={(event) => {
            const selectedRows = event.api.getSelectedRows();
            setSelectedRows(selectedRows);
            
            console.log('선택된 행:', selectedRows);
            console.log('선택된 행의 file_id:', selectedRows[0]?.file_id);
            
            // 선택된 행이 있으면 파일 정보 가져오기
            if (selectedRows.length > 0) {
              console.log('파일 정보 가져오기 시작');
              fetchAllSelectedFilesInfo(selectedRows);
            } else {
              console.log('선택된 행이 없음, selectedFileInfo 초기화');
              setSelectedFileInfo(null);
            }
          }}
        />
      </div>



      {/* 건수 표시 */}
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '8px 12px',
          backgroundColor: '#f8fafc',
          borderLeft: '4px solid #3b82f6',
          marginTop: '0px',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          borderRadius: '0 0 8px 8px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        총 {(() => {
          if (Array.isArray(filteredNewComers) && filteredNewComers.length > 0) {
            return filteredNewComers.length;
          }
          if (Array.isArray(newComers)) {
            return newComers.length;
          }
          return 0;
        })()}건
      </Box>

      {/* 다이얼로그 */}
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
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {editingNewComer ? '초신자 수정' : '새 초신자 추가'}
        </DialogTitle>
        <DialogContent sx={{ padding: '20px' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="부서"
              value="새가족위원회"
              fullWidth
              size="small"
              disabled
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(240, 240, 240, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(240, 240, 240, 0.8)',
                    color: '#6b7280'
                  }
                },
                '& .MuiInputLabel-root': {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#6b7280',
                  '&.Mui-disabled': {
                    color: '#6b7280'
                  }
                }
              }}
            />
            {editingNewComer ? (
              // 수정 모드: 교육이 수료인 경우 신자구분 수정 불가
              formData.education_type === '수료' ? (
                <TextField
                  label="신자구분"
                  value={formData.believer_type}
                  fullWidth
                  size="small"
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      background: 'rgba(240, 240, 240, 0.8)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      '&.Mui-disabled': {
                        backgroundColor: 'rgba(240, 240, 240, 0.8)',
                        color: '#6b7280'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#6b7280',
                      '&.Mui-disabled': {
                        color: '#6b7280'
                      }
                    }
                  }}
                />
              ) : (
                // 수정 모드: 교육이 수료가 아닌 경우 신자구분 수정 가능
                <TextField
                  select
                  label="신자구분 *"
                  value={formData.believer_type}
                  onChange={async (e) => {
                    const newBelieverType = e.target.value;
                    const oldBelieverType = formData.believer_type;
                    
                    console.log('신자구분 변경:', oldBelieverType, '→', newBelieverType);
                    console.log('기존 번호:', originalNumber);
                    
                    // 초신자에서 전입신자로 변경하는 경우 번호 업데이트
                    if (oldBelieverType === '초신자' && newBelieverType === '전입신자') {
                      try {
                        // 새로운 번호 생성 요청
                        const response = await fetch(`/api/new-comers/generate-number`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({
                            department: formData.department,
                            believer_type: newBelieverType,
                            year: formData.year
                          })
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          setFormData({
                            ...formData, 
                            believer_type: newBelieverType, 
                            teacher: '',
                            number: data.number
                          });
                          console.log('전입신자 번호 자동 생성:', data.number);
                        } else {
                          console.error('번호 생성 실패');
                          setFormData({...formData, believer_type: newBelieverType, teacher: ''});
                        }
                      } catch (error) {
                        console.error('번호 생성 중 오류:', error);
                        setFormData({...formData, believer_type: newBelieverType, teacher: ''});
                      }
                    } 
                    // 전입신자에서 초신자로 변경하는 경우 기존 번호 복원
                    else if (oldBelieverType === '전입신자' && newBelieverType === '초신자') {
                      console.log('전입신자 → 초신자: 기존 번호 복원:', originalNumber);
                      setFormData({
                        ...formData, 
                        believer_type: newBelieverType, 
                        teacher: '',
                        number: originalNumber
                      });
                    } 
                    // 다른 신자구분으로 변경하는 경우
                    else {
                      setFormData({...formData, believer_type: newBelieverType, teacher: ''});
                    }
                    
                    fetchTeachers(formData.department, newBelieverType);
                  }}
                  fullWidth
                  size="small"
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
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      '&.Mui-focused': {
                        color: '#3b82f6'
                      }
                    },
                    '& .MuiInputLabel-asterisk': {
                      color: '#ef4444'
                    }
                  }}
                >
                  <MenuItem value="">
                    <em>선택하세요</em>
                  </MenuItem>
                  {codeDetails['신자']?.map((option) => (
                    <MenuItem key={option.id} value={option.code_value}>
                      {option.code_name}
                    </MenuItem>
                  ))}
                </TextField>
              )
            ) : (
              // 추가 모드: 신자구분 고정
              <TextField
                label="신자구분"
                value="초신자"
                fullWidth
                size="small"
                disabled
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    background: 'rgba(240, 240, 240, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(240, 240, 240, 0.8)',
                      color: '#6b7280'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#6b7280',
                    '&.Mui-disabled': {
                      color: '#6b7280'
                    }
                  }
                }}
              />
            )}
            <TextField
              select
              label="교육 *"
              value={formData.education_type}
              onChange={(e) => {
                const newEducationType = e.target.value;
                setFormData({...formData, education_type: newEducationType});
                
                // 교육이 '수료'에서 다른 값으로 변경되면 전송 버튼 숨김
                if (editingNewComer && formData.education_type === '수료' && newEducationType !== '수료') {
                  setShowTransferButton(false);
                }
                
                // 교육 상태가 변경되면 신자구분 필드의 상태도 업데이트
                if (editingNewComer) {
                  // 강제로 리렌더링을 위해 formData를 업데이트
                  setFormData(prev => ({...prev, education_type: newEducationType}));
                }
              }}
              size="small"
              required
              sx={{ 
                width: '48%',
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {codeDetails['교육']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="년도 *"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
              fullWidth
              size="small"
              required
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            />
            {editingNewComer && (
              <TextField
                label="번호"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
                fullWidth
                size="small"
                disabled={editingNewComer && formData.education_type === '수료'}
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
                    '&.Mui-disabled': {
                      backgroundColor: 'rgba(240, 240, 240, 0.8)',
                      color: '#6b7280'
                    }
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    '&.Mui-disabled': {
                      color: '#6b7280'
                    }
                  }
                }}
              />
            )}
            <TextField
              label="이름 *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              fullWidth
              size="small"
              required
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            />
            <TextField
              select
              label="성별 *"
              value={formData.gender}
              onChange={(e) => setFormData({...formData, gender: e.target.value})}
              fullWidth
              size="small"
              required
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {codeDetails['성별']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="결혼"
              value={formData.marital_status}
              onChange={(e) => setFormData({...formData, marital_status: e.target.value})}
              fullWidth
              size="small"
              required
              disabled={editingNewComer && formData.education_type === '수료'}
              sx={{ 
                width: '48%',
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {codeDetails['결혼']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="생년월일"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="주소"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              fullWidth
              size="small"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="전화번호"
              value={formData.phone}
              onChange={handlePhoneChange}
              fullWidth
              size="small"
              placeholder="010-1234-5678"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              select
                              label="양육교사"
              value={formData.teacher}
              onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              fullWidth
              size="small"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {teachers.map((teacher) => (
                <MenuItem key={teacher.id} value={teacher.name}>
                  {teacher.name} ({teacher.teacher || '교사없음'}, {teacher.position || '직책없음'}, {teacher.end_date})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="등록신청일 *"
              type="date"
              value={formData.register_date}
              onChange={(e) => setFormData({...formData, register_date: e.target.value})}
              fullWidth
              size="small"
              required
              InputLabelProps={{ shrink: true }}
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            />
            <TextField
                              label="양육시작일"
              type="date"
              value={formData.education_start_date}
              onChange={(e) => setFormData({...formData, education_start_date: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
                              label="양육종료일"
              type="date"
                      value={formData.education_end_date}
        onChange={(e) => setFormData({...formData, education_end_date: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              select
              label="편입기관"
              value={formData.affiliation_org}
              onChange={(e) => setFormData({...formData, affiliation_org: e.target.value})}
              fullWidth
              size="small"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {codeDetails['편입기관']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="소속"
              value={formData.belong}
              onChange={(e) => setFormData({...formData, belong: e.target.value})}
              fullWidth
              size="small"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            >
              <MenuItem value="">
                <em>선택하세요</em>
              </MenuItem>
              {codeDetails['소속']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="새생명전략"
              type="date"
              value={formData.new_life_strategy_date}
              onChange={(e) => setFormData({...formData, new_life_strategy_date: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
                              label="본인인증 *"
              value={formData.identity_verified}
              onChange={(e) => setFormData({...formData, identity_verified: e.target.value})}
              fullWidth
              size="small"
              required
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  '&.Mui-focused': {
                    color: '#3b82f6'
                  }
                },
                '& .MuiInputLabel-asterisk': {
                  color: '#ef4444'
                }
              }}
            />
            <TextField
              label="전소속교회"
              value={formData.prev_church}
              onChange={(e) => setFormData({...formData, prev_church: e.target.value})}
              fullWidth
              size="small"
              disabled={editingNewComer && formData.education_type === '수료'}
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="전송확인"
              value={formData.graduate_transfer_status || '미전송'}
              fullWidth
              size="small"
              disabled
              sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                  WebkitTextFillColor: (formData.graduate_transfer_status === '전송완료' || formData.graduate_transfer_status === '전송') ? '#2e7d32' : '#d32f2f',
                },
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  transition: 'all 0.3s ease'
                },
                '& .MuiInputLabel-root': {
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
            />
            <TextField
              label="기타"
              value={formData.comment}
              onChange={(e) => setFormData({...formData, comment: e.target.value})}
              fullWidth
              size="small"
              multiline
              rows={1}
              sx={{ 
                gridColumn: '1 / -1',
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151'
                }
              }}
              disabled={editingNewComer && formData.education_type === '수료'}
            />
            
            {/* 파일 업로드 섹션 */}
            <Box sx={{ gridColumn: '1 / -1', mt: -0.625, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  파일 업로드
                </Typography>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-upload"
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    disabled={editingNewComer && formData.education_type === '수료' || uploadedFile}
                    sx={{
                      borderRadius: '8px',
                      padding: '6px 16px',
                      fontWeight: '600',
                      textTransform: 'none',
                      border: '2px solid #3b82f6',
                      color: '#3b82f6',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#2563eb',
                        color: '#2563eb',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(59, 130, 246, 0.2)'
                      },
                      '&:disabled': {
                        borderColor: '#9ca3af',
                        color: '#9ca3af'
                      }
                    }}
                  >
                    파일 선택
                  </Button>
                </label>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    선택된 파일: {originalFileName}
                  </Typography>
                )}
                {selectedFile && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleFileUpload}
                    disabled={editingNewComer && formData.education_type === '수료'}
                    sx={{
                      borderRadius: '8px',
                      padding: '6px 16px',
                      fontWeight: '600',
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
                      },
                      '&:disabled': {
                        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        boxShadow: 'none'
                      }
                    }}
                  >
                    업로드
                  </Button>
                )}
                {uploadedFile && (
                  <>
                    <Typography variant="body2" color="success.main">
                      ✓ 업로드 완료: {uploadedFile.original_name}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      sx={{ 
                        ml: 1,
                        borderRadius: '8px',
                        padding: '6px 16px',
                        fontWeight: '600',
                        textTransform: 'none',
                        border: '2px solid #3b82f6',
                        color: '#3b82f6',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#2563eb',
                          color: '#2563eb',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(59, 130, 246, 0.2)'
                        }
                      }}
                      onClick={() => handleFileView(uploadedFile?.id)}
                    >
                      보기
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      sx={{ 
                        ml: 1,
                        borderRadius: '8px',
                        padding: '6px 16px',
                        fontWeight: '600',
                        textTransform: 'none',
                        border: '2px solid #ef4444',
                        color: '#ef4444',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          borderColor: '#dc2626',
                          color: '#dc2626',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 8px rgba(239, 68, 68, 0.2)'
                        },
                        '&:disabled': {
                          borderColor: '#9ca3af',
                          color: '#9ca3af'
                        }
                      }}
                      onClick={handleFileDelete}
                      disabled={editingNewComer && formData.education_type === '수료'}
                    >
                      삭제
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
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
          {editingNewComer && showTransferButton && (
            <Button 
              onClick={handleGraduateTransfer} 
              variant="contained" 
              color="secondary"
              sx={{
                borderRadius: '12px',
                padding: '12px 24px',
                fontWeight: '600',
                textTransform: 'none',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: 'white',
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
              전송
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
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
            저장
          </Button>
        </DialogActions>
      </Dialog>

      {/* 뒷면프린트 미리보기 다이얼로그 */}
      <Dialog 
        open={openBackPrintPreview} 
        onClose={() => setOpenBackPrintPreview(false)} 
        maxWidth="lg" 
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
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          뒷면프린트 미리보기 - 새가족교육수료교제카드
        </DialogTitle>
        <DialogContent sx={{ padding: '24px', maxHeight: '70vh', overflow: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}>
            {backPrintImage ? (
              <Box sx={{ 
                width: '100%',
                maxWidth: '210mm',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <Box sx={{ 
                  width: '210mm', 
                  height: '297mm', 
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10mm',
                  boxSizing: 'border-box'
                }}>
                  <img 
                    src={`http://localhost:3001/uploads/${getRelativePath(backPrintImage.saved_path)}`}
                    alt="새가족교육수료교제카드"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      maxWidth: '190mm',
                      maxHeight: '277mm'
                    }}
                    onError={(e) => {
                      console.error('이미지 로드 실패:', e);
                      e.target.style.display = 'none';
                    }}
                  />
                </Box>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: 2,
                padding: '40px',
                color: '#6b7280'
              }}>
                <Typography variant="h6" sx={{ fontWeight: '600' }}>
                  이미지를 불러오는 중...
                </Typography>
                <Button 
                  onClick={fetchBackPrintImage}
                  variant="outlined"
                  sx={{
                    borderRadius: '12px',
                    padding: '8px 16px',
                    fontWeight: '600',
                    textTransform: 'none'
                  }}
                >
                  이미지 다시 가져오기
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenBackPrintPreview(false)}
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
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
            닫기
          </Button>
          
          <Button 
            onClick={async () => {
              if (!backPrintImage) {
                alert('이미지를 먼저 가져와주세요.');
                return;
              }
              
              // 숨겨진 iframe을 사용하여 프린트 처리
              const iframe = document.createElement('iframe');
              iframe.style.position = 'absolute';
              iframe.style.top = '-10000px';
              iframe.style.left = '-10000px';
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              iframe.style.border = 'none';
              
              document.body.appendChild(iframe);
              
              const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <title>뒷면프린트 - 새가족교육수료교제카드</title>
                  <style>
                    @page {
                      size: A4 portrait;
                      margin: 0;
                      marks: none;
                      bleed: 0;
                    }
                    
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    
                    body {
                      font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
                      background: white;
                    }
                    
                    .print-page { 
                      width: 210mm; 
                      height: 297mm; 
                      margin: 0 auto; 
                      background: white;
                      padding: 10mm;
                      box-sizing: border-box;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    .card-image {
                      width: 100%;
                      height: 100%;
                      object-fit: contain;
                      max-width: 190mm;
                      max-height: 277mm;
                    }
                    
                    /* 프린트 최적화 */
                    @media print {
                      @page {
                        size: A4 portrait !important;
                        margin: 0 !important;
                      }
                      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                      .print-page { page-break-inside: avoid; }
                    }
                  </style>
                </head>
                <body>
                  <div class="print-page">
                    <img 
                      src="http://localhost:3001/uploads/${getRelativePath(backPrintImage.saved_path)}" 
                      alt="새가족교육수료교제카드"
                      class="card-image"
                    />
                  </div>
                </body>
                </html>
              `;
              
              const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
              const iframeWindow = iframe.contentWindow;
              
              iframeDoc.open();
              iframeDoc.write(printContent);
              iframeDoc.close();
              
              // iframe 로드 완료 후 프린트 실행
              iframe.onload = () => {
                setTimeout(() => {
                  iframeWindow.print();
                  
                  // 프린트 완료 후 iframe 제거
                  setTimeout(() => {
                    document.body.removeChild(iframe);
                  }, 1000);
                }, 500);
              };
            }}
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
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
            프린트
          </Button>
        </DialogActions>
      </Dialog>

      {/* 프린트 미리보기 다이얼로그 */}
      <Dialog 
        open={openPrintPreview} 
        onClose={() => setOpenPrintPreview(false)} 
        maxWidth="lg" 
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
            background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          프린트 미리보기 - {selectedRows.length}명의 초신자
        </DialogTitle>
        <DialogContent sx={{ padding: '20px' }}>

          
          {/* A4 용지 시뮬레이션 */}
          {/* 스크롤 가능한 프린트 미리보기 */}
          <Box sx={{ 
            width: '210mm', 
            maxHeight: '70vh',
            margin: '0 auto',
            overflow: 'auto',
            border: '1px solid #d1d5db',
            backgroundColor: 'white'
          }}>
            {selectedRows.map((row, index) => (
              <Box key={row.id || index} sx={{ 
                width: '210mm', 
                height: '297mm', 
                backgroundColor: 'white',
                borderBottom: index < selectedRows.length - 1 ? '2px solid #e5e7eb' : 'none',
                position: 'relative',
                overflow: 'hidden',
                padding: '10mm', // 상하좌우 10mm 여백 적용
                boxSizing: 'border-box'
              }}>
                {/* 상단 반 - 초신자 사진 */}
                <Box sx={{ 
                  height: '50%', 
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  {row.file_id && selectedFilesInfo[row.id || row.file_id] ? (
                    <img 
                      src={`http://localhost:3001/uploads/${getRelativePath(selectedFilesInfo[row.id || row.file_id].saved_path)}`}
                      alt={`${row.name || '초신자'} 사진`}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        console.error('이미지 로드 실패:', e.target.src);
                      }}
                      onLoad={() => {
                        console.log('이미지 로드 성공:', row.name);
                      }}
                    />
                  ) : row.file_id ? (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      파일 정보를 불러오는 중...
                      <Button 
                        onClick={() => fetchAllSelectedFilesInfo(selectedRows)}
                        sx={{ ml: 1 }}
                        size="small"
                      >
                        다시 시도
                      </Button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      연결된 사진이 없습니다
                    </div>
                  )}
                </Box>
                
                {/* 하단 반 - 양육카드 */}
                <Box sx={{ 
                  height: '50%', 
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {commonFileImage ? (
                    <img 
                      src={`http://localhost:3001/uploads/${getRelativePath(commonFileImage.saved_path)}`}
                      alt="새가족양육카드작성"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'fill'
                      }}
                      onError={(e) => {
                        console.error('양육카드 이미지 로드 실패:', e.target.src);
                      }}
                      onLoad={() => {
                        console.log('양육카드 이미지 로드 성공');
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#6b7280' }}>
                      양육카드를 불러올 수 없습니다
                      <Button 
                        onClick={() => fetchCommonFileImage()}
                        sx={{ ml:1 }}
                        size="small"
                      >
                        양육카드 다시 가져오기
                      </Button>
                    </div>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenPrintPreview(false)}
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
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
            닫기
          </Button>
          

          <Button 
            onClick={async () => {
              // 프린트 전에 모든 파일 정보를 가져오기
              await fetchAllSelectedFilesInfo(selectedRows);
              
              // 숨겨진 iframe을 사용하여 프린트 처리 (PrintPreview 컴포넌트 방식 참조)
              const iframe = document.createElement('iframe');
              iframe.style.position = 'absolute';
              iframe.style.top = '-10000px';
              iframe.style.left = '-10000px';
              iframe.style.width = '1px';
              iframe.style.height = '1px';
              iframe.style.border = 'none';
              
              document.body.appendChild(iframe);
              
              const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <title>프린트 - ${selectedRows.length}명의 초신자</title>
                  <style>
                    @page {
                      size: A4 portrait;
                      margin: 0;
                      marks: none;
                      bleed: 0;
                    }
                    
                    * {
                      margin: 0;
                      padding: 0;
                      box-sizing: border-box;
                    }
                    
                    body {
                      font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
                      background: white;
                    }
                    
                    .print-page { 
                      width: 210mm; 
                      height: 297mm; 
                      margin: 0 auto; 
                      background: white;
                      padding: 10mm;
                      box-sizing: border-box;
                      page-break-inside: avoid;
                      page-break-after: always;
                      page-break-before: auto;
                    }
                    
                    .photo-section { 
                      height: 50%; 
                      padding: 0; 
                      border-bottom: 1px solid #e5e7eb;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    .card-section { 
                      height: 50%; 
                      padding: 0;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    }
                    
                    img { 
                      max-width: 100%; 
                      max-height: 100%; 
                      object-fit: contain; 
                    }
                    
                    .card-section img {
                      width: 100%;
                      height: 100%;
                      object-fit: fill;
                    }
                    
                    /* 프린트 최적화 */
                    @media print {
                      @page {
                        size: A4 portrait !important;
                        margin: 0 !important;
                      }
                      body {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        color-adjust: exact;
                      }
                      
                      .print-page {
                        break-inside: avoid;
                        page-break-after: always;
                      }
                      
                      .print-page:last-child {
                        page-break-after: avoid;
                      }
                    }
                  </style>
                </head>
                <body>
                  ${selectedRows.map((row, index) => `
                    <div class="print-page">
                      <div class="photo-section">
                        ${row.file_id && selectedFilesInfo[row.id || row.file_id] ? 
                          `<img src="http://localhost:3001/uploads/${getRelativePath(selectedFilesInfo[row.id || row.file_id].saved_path)}" alt="${row.name || '초신자'} 사진" />` : 
                          row.file_id ? 
                            '<div style="text-align: center; color: #6b7280;">파일 정보를 불러오는 중...</div>' :
                            '<div style="text-align: center; color: #6b7280;">연결된 사진이 없습니다</div>'
                        }
                      </div>
                      <div class="card-section">
                        ${commonFileImage ? 
                          `<img src="http://localhost:3001/uploads/${getRelativePath(commonFileImage.saved_path)}" alt="새가족양육카드작성" />` :  
                          '<div style="text-align: center; color: #6b7280;">양육카드를 불러올 수 없습니다</div>'
                        }
                      </div>
                    </div>
                  `).join('')}
                </body>
                </html>
              `;
              
              const iframeDoc = iframe.contentWindow.document;
              
              iframeDoc.open();
              iframeDoc.write(printContent);
              iframeDoc.close();
              
              // iframe 로드 완료 후 프린트 실행
              iframe.onload = () => {
                 setTimeout(() => {
                   const iframeWindow = iframe.contentWindow;
                   iframeWindow.focus();
                   iframeWindow.print();
                   
                   // 프린트 완료 후 iframe 제거
                   setTimeout(() => {
                     document.body.removeChild(iframe);
                   }, 1000);
                 }, 100);
               };
            }}
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
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
            프린트
          </Button>
        </DialogActions>
      </Dialog>

      {/* 중복 수료자 확인 다이얼로그 */}
      <Dialog 
        open={openDuplicateDialog} 
        onClose={() => setOpenDuplicateDialog(false)} 
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '18px',
            textAlign: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          중복 수료자 확인
        </DialogTitle>
        <DialogContent sx={{ padding: '24px', maxHeight: '60vh', overflow: 'auto' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3
          }}>
            <Typography variant="h6" sx={{ fontWeight: '600', color: '#374151' }}>
              동일한 이름과 생년월일의 수료자가 이미 존재합니다.
            </Typography>
            
            {duplicateGraduates && duplicateGraduates.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: '600', marginBottom: 2, color: '#374151' }}>
                  기존 수료자 정보 ({duplicateGraduates.length}명):
                </Typography>
                
                <Box sx={{ 
                  maxHeight: '300px', 
                  overflow: 'auto',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px'
                }}>
                  {duplicateGraduates.map((graduate, index) => (
                    <Box 
                      key={graduate.id || index}
                      sx={{ 
                        background: '#f3f4f6', 
                        borderRadius: '8px', 
                        padding: '16px',
                        marginBottom: index < duplicateGraduates.length - 1 ? '12px' : 0,
                        border: '1px solid #e5e7eb'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: '600', marginBottom: 1, color: '#374151' }}>
                        수료자 {index + 1}
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>이름</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.name}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>생년월일</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.birth_date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>성별</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.gender}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>양육교사</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.teacher}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>등록신청일</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.register_date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>양육시작일</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.education_start_date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>부서</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.department}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>전화번호</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.phone}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>신자</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.believer_type}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>교육</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.education_type}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>년도</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.year}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>결혼상태</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.marital_status}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>주소</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.address}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>양육종료일</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.education_end_date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>편입기관</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.affiliation_org}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>소속</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.belong}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>새생명전략</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.new_life_strategy_date}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>본인확인</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.identity_verified}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>이전교회</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.prev_church}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: '500' }}>비고</Typography>
                          <Typography variant="body1" sx={{ fontWeight: '600' }}>{graduate.comment}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            <Typography variant="body1" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
              동일한 이름과 생년월일의 수료자가 이미 존재합니다. 어떻게 처리하시겠습니까?
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setOpenDuplicateDialog(false)}
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
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
            onClick={async () => {
              if (!duplicateGraduates || duplicateGraduates.length === 0) {
                alert('수료자 정보를 찾을 수 없습니다.');
                return;
              }

              // 전송 데이터에서 빈 문자열을 null로 변환
              const transferData = { ...formData };
              
              // 부서는 항상 고정값으로 설정
              transferData.department = '새가족위원회';
              
              // 신자구분은 초신자로 고정
              transferData.believer_type = '초신자';
              
              Object.keys(transferData).forEach(key => {
                if (transferData[key] === '') {
                  transferData[key] = null;
                }
              });

              // 첫 번째 중복 수료자를 업데이트
              const success = await updateGraduate(duplicateGraduates[0].id, transferData);
              
              if (success) {
                // 초신자 상태도 수료로 변경하고 전송확인을 '전송'으로 설정
                try {
                  const response = await fetch(`/api/new-comers/${editingNewComer.id}`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                      ...editingNewComer,
                      education_type: '수료',
                      graduate_transfer_status: '전송'
                    })
                  });

                  if (!response.ok) {
                    console.error('초신자 상태 업데이트 실패');
                  }
              } catch (error) {
                  console.error('초신자 상태 업데이트 실패:', error);
                }
              }
            }}
            variant="contained"
            sx={{
              borderRadius: '12px',
              padding: '12px 24px',
              fontWeight: '600',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
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
            업데이트
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewComerManagementPage; 