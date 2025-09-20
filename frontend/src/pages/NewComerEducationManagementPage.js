import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  TextField, 
  Typography,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as VisibilityIcon,
  Image as ImageIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

const NewComerEducationManagementPage = () => {
  const { user } = useAuth();
  const [gridRef] = useState(useRef());
  
  // 상태 관리
  const [educationData, setEducationData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [codeDetails, setCodeDetails] = useState({});
  
  // 조회조건 상태
  const [searchConditions, setSearchConditions] = useState({
    year: new Date().getFullYear().toString(),
    education_type: '' // 빈 문자열로 설정하여 모든 교육구분 표시
  });

  // 다이얼로그 상태
  const [openDialog, setOpenDialog] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    teacher: '',
    believer_name: '',
    believer_type: '',
    education_type: '',
    week1_date: '',
    week2_date: '',
    week3_date: '',
    week4_date: '',
    week5_date: '',
    week6_date: '',
    week7_date: '',
    week8_date: '',
    week1_comment: '',
    week2_comment: '',
    week3_comment: '',
    week4_comment: '',
    week5_comment: '',
    week6_comment: '',
    week7_comment: '',
    week8_comment: '',
    overall_comment: '',
    education_file_id: null
  });

  // 첨부파일 관련 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  
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
                <EditIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    {
              headerName: '초신자관리 파일',
        width: 100,
        minWidth: 120,
        maxWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const hasNewComerFile = params.data.file_id; // 초신자관리 파일
        
        if (!hasNewComerFile) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                없음
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="초신자관리 파일 보기" arrow placement="top">
                             <IconButton
                 size="small"
                 onClick={() => handleFileView(params.data.file_id, false)}
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
          </Box>
        );
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    {
              headerName: '교육관리 파일',
        width: 100,
        minWidth: 120,
        maxWidth: 150,
      sortable: false,
      filter: false,
      cellRenderer: (params) => {
        const hasEducationFile = params.data.education_file_id; // 초신자교육관리 파일
        
        if (!hasEducationFile) {
          return (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                없음
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tooltip title="교육관리 파일 보기" arrow placement="top">
                             <IconButton
                 size="small"
                 onClick={() => handleFileView(params.data.education_file_id, true)}
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
                 <ImageIcon sx={{ fontSize: 14 }} />
               </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '양육교사', 
      field: 'teacher', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      cellRenderer: (params) => {
        // 같은 양육교사가 연속으로 나올 때 첫 번째 행에만 표시
        const currentTeacher = params.data.teacher;
        const currentIndex = params.rowIndex;
        
        if (!currentTeacher) {
          return '';
        }
        
        // 이전 행과 같은 양육교사인 경우 빈 문자열 표시
        if (currentIndex > 0) {
          const prevRowData = params.api.getDisplayedRowAtIndex(currentIndex - 1);
          if (prevRowData && prevRowData.data.teacher === currentTeacher) {
            return '';
          }
        }
        
        return currentTeacher;
      },
      cellStyle: (params) => {
        const currentTeacher = params.data.teacher;
        const currentIndex = params.rowIndex;
        
        // 기본 스타일
        const baseStyle = {
          borderRight: '1px solid #f1f3f4',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%'
        };
        
        // 같은 양육교사 그룹에 배경색 추가
        if (currentTeacher) {
          // 양육교사명의 해시값을 이용해 일관된 배경색 생성
          const hash = currentTeacher.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          
          const colorIndex = Math.abs(hash) % 6;
          const colors = [
            'rgba(59, 130, 246, 0.05)',   // 파란색
            'rgba(16, 185, 129, 0.05)',   // 초록색
            'rgba(245, 158, 11, 0.05)',   // 주황색
            'rgba(139, 92, 246, 0.05)',   // 보라색
            'rgba(236, 72, 153, 0.05)',   // 핑크색
            'rgba(34, 197, 94, 0.05)'     // 라임색
          ];
          
          baseStyle.backgroundColor = colors[colorIndex];
        }
        
        return baseStyle;
      }
    },
    { 
      headerName: '초신자', 
      field: 'believer_name', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '신자', 
      field: 'believer_type', 
      width: 100, 
      minWidth: 100, 
      maxWidth: 120, 
      sortable: true, 
      filter: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '교육', 
      field: 'education_type', 
      width: 100, 
      minWidth: 100, 
      maxWidth: 120, 
      sortable: true, 
      filter: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '등록번호', 
      field: 'registration_number', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '등록신청일', 
      field: 'registration_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '1주차', 
      field: 'week1_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '2주차', 
      field: 'week2_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '3주차', 
      field: 'week3_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '4주차', 
      field: 'week4_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '5주차', 
      field: 'week5_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '6주차', 
      field: 'week6_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '7주차', 
      field: 'week7_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    },
    { 
      headerName: '8주차', 
      field: 'week8_date', 
      width: 120, 
      minWidth: 120, 
      maxWidth: 150, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (params.value) {
          const date = new Date(params.value);
          return date.toISOString().split('T')[0];
        }
        return '';
      },
      cellStyle: {
        borderRight: '1px solid #f1f3f4',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }
    }
  ];

  // AG Grid 기본 설정
  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    headerStyle: {
      backgroundColor: '#f8fafc',
      color: '#374151',
      fontWeight: '600',
      fontSize: '14px',
      borderBottom: '2px solid #e5e7eb',
      textAlign: 'center'
    }
  };

  // AG Grid 옵션
  const gridOptions = {
    suppressRowClickSelection: true,
    rowSelection: 'single',
    pagination: false,
    suppressPaginationPanel: true,
    animateRows: true
  };

  // 공통 코드 데이터 가져오기
  const fetchCodeData = async () => {
    try {
      console.log('=== 코드 데이터 가져오기 시작 ===');
      
      // 코드 그룹 가져오기
      console.log('코드 그룹 API 요청 시작');
      const groupsResponse = await fetch('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('코드 그룹 API 응답 상태:', groupsResponse.status);
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        console.log('코드 그룹 데이터:', groupsData);
        
        // 각 그룹별로 상세 코드 가져오기
        const detailsMap = {};
        for (const group of groupsData) {
          console.log(`그룹 ${group.group_code} 상세 코드 가져오기 시작`);
          const detailsResponse = await fetch(`/api/code-details?group_id=${group.id}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log(`그룹 ${group.group_code} 상세 코드 응답 상태:`, detailsResponse.status);
          
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            detailsMap[group.group_code] = detailsData;
            console.log(`그룹 ${group.group_code} 상세 코드:`, detailsData);
          } else {
            console.error(`그룹 ${group.group_code} 상세 코드 가져오기 실패`);
          }
        }
        setCodeDetails(detailsMap);
        console.log('=== 코드 데이터 로드 완료 ===');
        console.log('최종 코드 데이터:', detailsMap);
      } else {
        console.error('코드 그룹 가져오기 실패 - 상태:', groupsResponse.status);
      }
    } catch (error) {
      console.error('=== 코드 데이터 가져오기 오류 ===');
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
    }
  };

  // 교사 목록 가져오기 (사용자등록에서 초신자교사 가져오기)
  const fetchTeachers = async () => {
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
        const teachersData = usersData
          .filter(user => {
            // 활성화되지 않은 사용자 제외
            if (user.is_active !== 1) {
              return false;
            }
            
            // 부서가 새가족위원회가 아닌 경우 제외
            if (user.department !== '새가족위원회') {
              return false;
            }
            
            // 교사상태가 '재직'이 아닌 경우 제외
            if (user.teacher_status !== '재직') {
              return false;
            }
            
            // 종료일자가 없는 경우 (무기한) 포함
            if (!user.end_date || user.end_date.trim() === '') {
              return true;
            }
            
            // 종료일자가 현재일자 이후인 경우 포함
            return user.end_date >= today;
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
      console.error('교사 목록 가져오기 오류:', error);
    }
  };

  // 사용 가능한 년도 목록 가져오기
  const fetchAvailableYears = async () => {
    try {
      const response = await fetch('/api/new-comer-education/years', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const years = await response.json();
        setAvailableYears(years);
        
        // 현재 년도가 목록에 없으면 추가
        const currentYear = new Date().getFullYear();
        if (!years.includes(currentYear)) {
          setAvailableYears([currentYear, ...years]);
        }
      }
    } catch (error) {
      console.error('년도 목록 가져오기 오류:', error);
      // 오류 시 현재 년도만 설정
      setAvailableYears([new Date().getFullYear()]);
    }
  };

  // 교육 데이터 가져오기
  const fetchEducationData = async (searchParams = {}) => {
    try {
      console.log('=== 교육 데이터 가져오기 시작 ===');
      console.log('검색 파라미터:', searchParams);
      
      const queryParams = new URLSearchParams();
      
      if (searchParams.year && searchParams.year.trim() !== '') {
        queryParams.append('year', searchParams.year.trim());
        console.log('년도 파라미터 추가:', searchParams.year.trim());
      }

      if (searchParams.education_type && searchParams.education_type.trim() !== '') {
        queryParams.append('education_type', searchParams.education_type.trim());
        console.log('교육구분 파라미터 추가:', searchParams.education_type.trim());
      }

      if (searchParams.teacher && searchParams.teacher.trim() !== '') {
        queryParams.append('teacher', searchParams.teacher.trim());
        console.log('양육교사 파라미터 추가:', searchParams.teacher.trim());
      }

      if (searchParams.believer_name && searchParams.believer_name.trim() !== '') {
        queryParams.append('believer_name', searchParams.believer_name.trim());
        console.log('초신자명 파라미터 추가:', searchParams.believer_name.trim());
      }

      const url = `/api/new-comer-education${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('요청 URL:', url);

      console.log('교육 데이터 API 요청 시작');
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('교육 데이터 API 응답 상태:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('교육 데이터 API 응답 성공:', {
          status: response.status,
          dataLength: Array.isArray(data) ? data.length : 0,
          sampleData: Array.isArray(data) ? data.slice(0, 2) : data
        });
        
        // 파일 정보 로그 출력
        if (Array.isArray(data) && data.length > 0) {
          console.log('=== 파일 정보 확인 ===');
          data.forEach((row, index) => {
            console.log(`행 ${index + 1} - ${row.believer_name}:`);
            console.log('  초신자관리 파일 ID:', row.file_id);
            console.log('  교육관리 파일 ID:', row.education_file_id);
          });
        }
        
        setEducationData(Array.isArray(data) ? data : []);
        console.log('=== 교육 데이터 가져오기 완료 ===');
      } else {
        const errorText = await response.text();
        console.error('교육 데이터 가져오기 실패 - 상태:', response.status);
        console.error('교육 데이터 가져오기 실패 - 응답:', errorText);
        setEducationData([]);
      }
    } catch (error) {
      console.error('=== 교육 데이터 가져오기 오류 ===');
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      setEducationData([]);
    }
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
      const response = await fetch('/api/new-comer-files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFile(result);
        setFormData(prev => ({ ...prev, education_file_id: result.id }));
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
      const response = await fetch(`/api/new-comer-files/${uploadedFile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setUploadedFile(null);
        setFormData(prev => ({ ...prev, education_file_id: null }));
        setSelectedFile(null);
        setOriginalFileName('');
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
  const handleFileView = async (fileId = null, isEducationFile = false) => {
    const targetFileId = fileId || (uploadedFile ? uploadedFile.id : null);
    
    if (!targetFileId) {
      alert('볼 파일이 없습니다.');
      return;
    }

    try {
      // 초신자관리 파일과 교육관리 파일을 구분하여 API 호출
      const apiUrl = isEducationFile 
        ? `/api/new-comer-files/download/${targetFileId}`  // 교육관리 파일
        : `/api/files/download/${targetFileId}`;           // 초신자관리 파일
        
      const response = await fetch(apiUrl, {
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
          a.download = uploadedFile ? uploadedFile.original_name : 'file';
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

  // 수정 처리
  const handleEdit = async (data) => {
    console.log('=== 수정 처리 시작 ===');
    console.log('수정할 데이터:', data);
    console.log('new_comer_id:', data.new_comer_id);
    console.log('believer_name:', data.believer_name);
    console.log('education_type:', data.education_type);
    console.log('주차별 날짜 데이터:');
    console.log('week1_date:', data.week1_date);
    console.log('week2_date:', data.week2_date);
    console.log('week3_date:', data.week3_date);
    console.log('week4_date:', data.week4_date);
    console.log('week5_date:', data.week5_date);
    console.log('week6_date:', data.week6_date);
    console.log('week7_date:', data.week7_date);
    console.log('week8_date:', data.week8_date);
    console.log('주차별 코멘트 데이터:');
    console.log('week1_comment:', data.week1_comment);
    console.log('week2_comment:', data.week2_comment);
    console.log('week3_comment:', data.week3_comment);
    console.log('week4_comment:', data.week4_comment);
    console.log('week5_comment:', data.week5_comment);
    console.log('week6_comment:', data.week6_comment);
    console.log('week7_comment:', data.week7_comment);
    console.log('week8_comment:', data.week8_comment);
    console.log('overall_comment:', data.overall_comment);
    
    setEditingData(data);
    setFormData({
      id: data.id || '',
      teacher: data.teacher || '',
      believer_name: data.believer_name || '',
      believer_type: data.believer_type || '',
      education_type: data.education_type || '',
      week1_date: data.week1_date || '',
      week2_date: data.week2_date || '',
      week3_date: data.week3_date || '',
      week4_date: data.week4_date || '',
      week5_date: data.week5_date || '',
      week6_date: data.week6_date || '',
      week7_date: data.week7_date || '',
      week8_date: data.week8_date || '',
      week1_comment: data.week1_comment || '',
      week2_comment: data.week2_comment || '',
      week3_comment: data.week3_comment || '',
      week4_comment: data.week4_comment || '',
      week5_comment: data.week5_comment || '',
      week6_comment: data.week6_comment || '',
      week7_comment: data.week7_comment || '',
      week8_comment: data.week8_comment || '',
      overall_comment: data.overall_comment || '',
      education_file_id: data.education_file_id || null
    });
    console.log('formData 설정 완료');
    
    // 파일 관련 상태 설정
    if (data.education_file_id) {
      console.log('기존 교육 파일 ID 발견:', data.education_file_id);
      // 기존 파일 정보를 가져오기
      try {
        const fileResponse = await fetch(`/api/new-comer-files/${data.education_file_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (fileResponse.ok) {
          const fileInfo = await fileResponse.json();
          setUploadedFile(fileInfo);
          console.log('기존 교육 파일 정보 로드:', fileInfo);
        } else {
          console.error('교육 파일 정보 로드 실패');
          setUploadedFile(null);
        }
      } catch (error) {
        console.error('교육 파일 정보 로드 중 오류:', error);
        setUploadedFile(null);
      }
    } else {
      setUploadedFile(null);
    }
    setSelectedFile(null);
    setOriginalFileName('');
    
    setOpenDialog(true);
    console.log('=== 수정 처리 완료 ===');
  };

  // 저장 처리
  const handleSave = async () => {
    try {
      console.log('=== 교육데이터 저장 시작 ===');
      console.log('formData.id:', formData.id);
      console.log('editingData.id:', editingData.id);
      console.log('formData:', formData);
      
      // 주차별 날짜 유효성 검사
      console.log('=== 주차별 날짜 유효성 검사 시작 ===');
      const errors = [];
      
      // 1. 일요일 검사 및 중복 검사
      const weekDates = [];
      for (let week = 1; week <= 8; week++) {
        const dateValue = formData[`week${week}_date`];
        if (dateValue) {
          // 일요일 검사
          const date = new Date(dateValue);
          const dayOfWeek = date.getDay();
          if (dayOfWeek !== 0) {
            errors.push(`${week}주차는 일요일이어야 합니다. 선택한 날짜는 ${['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}요일입니다.`);
          }
          
          // 중복 날짜 검사
          if (weekDates.includes(dateValue)) {
            errors.push(`${week}주차 날짜가 다른 주차와 중복됩니다.`);
          } else {
            weekDates.push(dateValue);
          }
        }
      }
      
      // 2. 1주차 일자가 등록신청일자보다 같거나 이후의 일자인지 검사
      if (formData.week1_date && editingData?.registration_date) {
        const week1Date = new Date(formData.week1_date);
        const registrationDate = new Date(editingData.registration_date);
        
        if (week1Date < registrationDate) {
          errors.push(`1주차 일자(${formData.week1_date})는 등록신청일자(${editingData.registration_date})보다 같거나 이후의 일자여야 합니다.`);
        }
      }
      
      // 3. 주차별 순차 증가 검사 (다음 주차는 이전 주차보다 뒷날짜)
      for (let week = 1; week <= 7; week++) {
        const currentDate = formData[`week${week}_date`];
        const nextDate = formData[`week${week + 1}_date`];
        
        if (currentDate && nextDate) {
          const current = new Date(currentDate);
          const next = new Date(nextDate);
          
          // 다음 주차가 이전 주차보다 같거나 이전 날짜인 경우
          if (next <= current) {
            errors.push(`${week + 1}주차(${nextDate})는 ${week}주차(${currentDate})보다 뒷날짜여야 합니다.`);
          }
        }
      }
      
      if (errors.length > 0) {
        alert('다음 오류를 수정해주세요:\n\n' + errors.join('\n'));
        return;
      }
      
      console.log('=== 주차별 날짜 유효성 검사 완료 ===');
      
      // 양육 시작일과 종료일 계산
      let educationStartDate = null;
      let educationEndDate = null;
      
      // 1주차 날짜를 양육 시작일로 설정
      if (formData.week1_date) {
        educationStartDate = formData.week1_date;
        console.log('양육 시작일 설정:', educationStartDate);
      }
      
      // 교육 상태가 '수료'인 경우 양육 종료일 계산
      if (formData.education_type === '수료') {
        // 입력된 주차 중 가장 마지막 날짜를 찾기
        let lastWeekDate = null;
        for (let week = 8; week >= 1; week--) {
          if (formData[`week${week}_date`]) {
            lastWeekDate = formData[`week${week}_date`];
            console.log(`${week}주차 날짜를 양육 종료일로 설정:`, lastWeekDate);
            break;
          }
        }
        educationEndDate = lastWeekDate;
      }
      
      console.log('=== 양육 일자 계산 완료 ===');
      console.log('양육 시작일:', educationStartDate);
      console.log('양육 종료일:', educationEndDate);
      
      // 1. 초신자관리 DB 업데이트 (new_comers 테이블) - 교육관리용 부분 수정 API 사용
      console.log('1. 초신자관리 DB 업데이트 시작');
      console.log('요청 URL:', `/api/new-comers/${formData.id}/education`);
      console.log('요청 데이터:', {
        teacher: formData.teacher,
        name: formData.believer_name,
        believer_type: formData.believer_type,
        education_type: formData.education_type
      });
      
      const newComerUpdateResponse = await fetch(`/api/new-comers/${formData.id}/education`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teacher: formData.teacher,
          name: formData.believer_name,
          believer_type: formData.believer_type,
          education_type: formData.education_type,
          education_start_date: educationStartDate,
          education_end_date: educationEndDate
        })
      });

      console.log('초신자관리 업데이트 응답 상태:', newComerUpdateResponse.status);
      
      if (!newComerUpdateResponse.ok) {
        const errorText = await newComerUpdateResponse.text();
        console.error('초신자관리 업데이트 실패 - 상태:', newComerUpdateResponse.status);
        console.error('초신자관리 업데이트 실패 - 응답:', errorText);
        throw new Error('초신자관리 데이터 업데이트 실패');
      }
      
      const newComerUpdateData = await newComerUpdateResponse.json();
      console.log('1. 초신자관리 DB 업데이트 성공');
      
      // 신자구분 변경으로 인한 번호 업데이트가 있는 경우 알림
      if (newComerUpdateData.number) {
        console.log('신자구분 변경으로 번호가 업데이트되었습니다:', newComerUpdateData.number);
        alert(`신자구분 변경으로 인해 등록번호가 ${newComerUpdateData.number}로 변경되었습니다.`);
      }

              // 2. 교육 데이터 생성 또는 업데이트 (new_comers_education 테이블)
      console.log('2. 교육 데이터 생성 또는 업데이트 시작');
      console.log('요청 URL:', `/api/new-comer-education/new-comer/${formData.id}`);
      console.log('education_file_id:', formData.education_file_id);
      console.log('uploadedFile:', uploadedFile);
      
      const educationUpdateResponse = await fetch(`/api/new-comer-education/new-comer/${formData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          week1_date: formData.week1_date,
          week2_date: formData.week2_date,
          week3_date: formData.week3_date,
          week4_date: formData.week4_date,
          week5_date: formData.week5_date,
          week6_date: formData.week6_date,
          week7_date: formData.week7_date,
          week8_date: formData.week8_date,
          week1_comment: formData.week1_comment,
          week2_comment: formData.week2_comment,
          week3_comment: formData.week3_comment,
          week4_comment: formData.week4_comment,
          week5_comment: formData.week5_comment,
          week6_comment: formData.week6_comment,
          week7_comment: formData.week7_comment,
          week8_comment: formData.week8_comment,
          overall_comment: formData.overall_comment,
          file_id: formData.education_file_id
        })
      });

      console.log('교육 데이터 업데이트 응답 상태:', educationUpdateResponse.status);

      if (educationUpdateResponse.ok) {
        console.log('2. 교육 데이터 업데이트 성공');
        console.log('3. 교육 데이터 재조회 시작');
        await fetchEducationData(searchConditions);
        console.log('3. 교육 데이터 재조회 완료');
        
        setOpenDialog(false);
        setEditingData(null);
        setFormData({
          id: '',
          teacher: '',
          believer_name: '',
          believer_type: '',
          education_type: '',
          week1_date: '',
          week2_date: '',
          week3_date: '',
          week4_date: '',
          week5_date: '',
          week6_date: '',
          week7_date: '',
          week8_date: '',
          week1_comment: '',
          week2_comment: '',
          week3_comment: '',
          week4_comment: '',
          week5_comment: '',
          week6_comment: '',
          week7_comment: '',
          week8_comment: '',
          overall_comment: '',
          education_file_id: null
        });
        console.log('=== 교육데이터 저장 완료 ===');
        alert('저장이 완료되었습니다.');
      } else {
        const errorText = await educationUpdateResponse.text();
        console.error('교육 데이터 업데이트 실패 - 상태:', educationUpdateResponse.status);
        console.error('교육 데이터 업데이트 실패 - 응답:', errorText);
        alert('교육 데이터 저장 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('=== 저장 실패 ===');
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 엑셀 다운로드 처리
  const handleExcelDownload = () => {
    try {
      // 현재 조회된 데이터를 엑셀로 다운로드
      const currentData = Array.isArray(educationData) ? educationData : [];
      
      if (currentData.length === 0) {
        alert('다운로드할 데이터가 없습니다.');
        return;
      }

      // 엑셀 다운로드용 데이터 가공
      const excelData = currentData.map((row, index) => ({
        '순번': index + 1,
        '양육교사': row.teacher || '',
        '초신자명': row.believer_name || '',
        '신자구분': row.believer_type || '',
        '교육구분': row.education_type || '',
        '등록번호': row.registration_number || '',
        '등록신청일': row.registration_date || '',
        '1주차': row.week1_date || '',
        '2주차': row.week2_date || '',
        '3주차': row.week3_date || '',
        '4주차': row.week4_date || '',
        '5주차': row.week5_date || '',
        '6주차': row.week6_date || '',
        '7주차': row.week7_date || '',
        '8주차': row.week8_date || '',
        '1주차코멘트': row.week1_comment || '',
        '2주차코멘트': row.week2_comment || '',
        '3주차코멘트': row.week3_comment || '',
        '4주차코멘트': row.week4_comment || '',
        '5주차코멘트': row.week5_comment || '',
        '6주차코멘트': row.week6_comment || '',
        '7주차코멘트': row.week7_comment || '',
        '8주차코멘트': row.week8_comment || '',
        '전체평가': row.overall_comment || ''
      }));

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      
      // 워크시트 생성
      const ws = XLSX.utils.json_to_sheet(excelData);
      
      // 컬럼 너비 자동 조정
      const colWidths = [
        { wch: 5 },   // 순번
        { wch: 15 },  // 양육교사
        { wch: 15 },  // 초신자명
        { wch: 12 },  // 신자구분
        { wch: 12 },  // 교육구분
        { wch: 12 },  // 등록번호
        { wch: 12 },  // 등록신청일
        { wch: 12 },  // 1주차
        { wch: 12 },  // 2주차
        { wch: 12 },  // 3주차
        { wch: 12 },  // 4주차
        { wch: 12 },  // 5주차
        { wch: 12 },  // 6주차
        { wch: 12 },  // 7주차
        { wch: 12 },  // 8주차
        { wch: 20 },  // 1주차코멘트
        { wch: 20 },  // 2주차코멘트
        { wch: 20 },  // 3주차코멘트
        { wch: 20 },  // 4주차코멘트
        { wch: 20 },  // 5주차코멘트
        { wch: 20 },  // 6주차코멘트
        { wch: 20 },  // 7주차코멘트
        { wch: 20 },  // 8주차코멘트
        { wch: 30 }   // 전체평가
      ];
      ws['!cols'] = colWidths;
      
      // 워크북에 워크시트 추가
      XLSX.utils.book_append_sheet(wb, ws, '초신자교육관리');
      
      // 파일명 생성 (년도 포함)
      const currentYear = searchConditions.year || new Date().getFullYear();
      const currentDate = new Date().toISOString().split('T')[0];
      const fileName = `초신자교육관리_${currentYear}년_${currentDate}.xlsx`;
      
      // 엑셀 파일 다운로드
      XLSX.writeFile(wb, fileName);

      console.log('엑셀 다운로드 완료:', excelData.length, '건');
    } catch (error) {
      console.error('엑셀 다운로드 오류:', error);
      alert('엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 조회 처리
  const handleSearch = () => {
    fetchEducationData(searchConditions);
  };

  // 조회조건 초기화
  const handleResetSearch = () => {
    setSearchConditions({
      year: new Date().getFullYear().toString(),
      education_type: '',
      teacher: '',
      believer_name: ''
    });
    fetchEducationData({ year: new Date().getFullYear().toString() });
  };

  useEffect(() => {
    fetchCodeData();
    fetchTeachers();
    fetchEducationData({ year: new Date().getFullYear().toString() });
  }, []);

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      
      {/* 버튼 그룹 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: -7.5, alignItems: 'center' }}>
        {/* 조회조건 */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
          <TextField
            label="년도"
            value={searchConditions.year}
            onChange={(e) => setSearchConditions({...searchConditions, year: e.target.value})}
            size="small"
            sx={{ 
              width: '100px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: '14px',
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
            label="양육교사"
            value={searchConditions.teacher}
            onChange={(e) => setSearchConditions({...searchConditions, teacher: e.target.value})}
            size="small"
            sx={{ 
              width: '120px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: '14px',
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
            label="초신자명"
            value={searchConditions.believer_name}
            onChange={(e) => setSearchConditions({...searchConditions, believer_name: e.target.value})}
            size="small"
            sx={{ 
              width: '120px',
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,0,0,0.1)',
                fontSize: '14px',
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

          <Tooltip title="조회" arrow placement="top">
            <IconButton
              onClick={handleSearch}
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
                ml: 1,
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
              <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
                ↻
              </Typography>
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: `${gridHeight}px`, 
        minHeight: '400px',
        maxHeight: 'calc(100vh - 200px)',
        width: '100%'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={Array.isArray(educationData) ? educationData : []}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          animateRows={true}
          rowSelection="single"
          suppressRowClickSelection={true}
          pagination={false}
          suppressPaginationPanel={true}
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
        총 {Array.isArray(educationData) ? educationData.length : 0}건
      </Box>

      {/* 수정 다이얼로그 */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: '600',
          fontSize: '18px'
        }}>
          {editingData ? '초신자 교육 데이터 수정' : '교육 데이터 추가'}
        </DialogTitle>
        
        <DialogContent sx={{ padding: '20px' }}>
          {/* 기본 정보 (읽기 전용) */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: '600', color: '#374151' }}>
            기본 정보
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            <TextField
              select
              label="양육교사"
              value={formData.teacher || editingData?.teacher || ''}
              onChange={(e) => setFormData({...formData, teacher: e.target.value})}
              size="small"
              disabled={editingData?.education_type === '수료'}
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
              label="이름" 
              value={formData.believer_name} 
              onChange={(e) => setFormData({...formData, believer_name: e.target.value})}
              size="small" 
              disabled={editingData?.education_type === '수료'}
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
              label="신자"
              value={formData.believer_type || editingData?.believer_type || ''}
              onChange={(e) => setFormData({...formData, believer_type: e.target.value})}
              size="small"
              disabled={editingData?.education_type === '수료'}
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
              {codeDetails['신자']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="교육"
              value={formData.education_type || editingData?.education_type || ''}
              onChange={(e) => setFormData({...formData, education_type: e.target.value})}
              size="small"
              disabled={false}
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
              {codeDetails['교육']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="등록번호" value={editingData?.registration_number || ''} size="small" disabled />
            <TextField 
              label="등록신청일" 
              value={editingData?.registration_date ? new Date(editingData.registration_date).toISOString().split('T')[0] : ''} 
              size="small" 
              disabled 
            />
          </Box>


          
          {/* 주차별 교육일자 및 코멘트 */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: '600', color: '#374151' }}>
            주차별 교육일자 및 코멘트
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((week) => (
              <Box key={week} sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label={`${week}주차 (일요일)`}
                  type="date"
                  value={formData[`week${week}_date`]}
                  onChange={(e) => {
                    const selectedDate = e.target.value;
                    setFormData({...formData, [`week${week}_date`]: selectedDate});
                  }}
                  size="small"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  disabled={editingData?.education_type === '수료'}
                  sx={{ 
                    flex: 0.6,
                    minWidth: '130px',
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
                  label={`${week}주차 코멘트`}
                  value={formData[`week${week}_comment`]}
                  onChange={(e) => setFormData({...formData, [`week${week}_comment`]: e.target.value})}
                  size="small"
                  multiline
                  rows={2}
                  disabled={editingData?.education_type === '수료'}
                  sx={{ 
                    flex: 1,
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
              </Box>
            ))}
          </Box>

          {/* 전체평가 */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: '600', color: '#374151' }}>
            전체평가
          </Typography>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="전체평가"
              value={formData.overall_comment}
              onChange={(e) => setFormData({...formData, overall_comment: e.target.value})}
              size="small"
              multiline
              rows={3}
              fullWidth
              disabled={editingData?.education_type === '수료'}
            />
          </Box>

          {/* 첨부파일 */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: '600', color: '#374151' }}>
            첨부파일
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                                  <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="file-upload"
                    />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  disabled={uploadedFile}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: '600',
                    '&:disabled': {
                      borderColor: '#9ca3af',
                      color: '#9ca3af'
                    }
                  }}
                >
                  파일 선택
                </Button>
              </label>
                              {selectedFile && (
                  <Typography variant="body2" color="text.secondary">
                    선택된 파일: {originalFileName}
                  </Typography>
                )}
              {selectedFile && !uploadedFile && (
                <Button
                  onClick={handleFileUpload}
                  variant="contained"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                    }
                  }}
                >
                  업로드
                </Button>
              )}
            </Box>
            
            {uploadedFile && (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  업로드된 파일: {uploadedFile.original_name}
                </Typography>
                <Button
                  onClick={() => handleFileView(null, true)}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: '600'
                  }}
                >
                  보기
                </Button>
                <Button
                  onClick={handleFileDelete}
                  variant="outlined"
                  color="error"
                  size="small"
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: '600'
                  }}
                >
                  삭제
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ padding: '16px 20px', gap: 1 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            startIcon={<CancelIcon />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600'
            }}
          >
            취소
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={<SaveIcon />}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: '600',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)'
              }
            }}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NewComerEducationManagementPage;
