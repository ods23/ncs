import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
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
  FileDownload as FileDownloadIcon,
  Search as SearchIcon
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

const AllBelieverManagementPage = () => {
  const { user } = useAuth();
  // 상태 관리
  const [newComers, setNewComers] = useState([]);
  const [codeDetails, setCodeDetails] = useState({});
  const [gridRef] = useState(useRef());
  
  // 조회조건 상태 (believer_type 필터링 없음)
  const [searchConditions, setSearchConditions] = useState({
    year: new Date().getFullYear().toString(),
    name: '',
    believer_type: '', // 전체 조회를 위해 빈 값
    education_type: '',
    phone: ''
  });
  const [filteredNewComers, setFilteredNewComers] = useState([]);
  const [codeGroups, setCodeGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);

  // AG Grid 컬럼 정의 (순서 재정렬 및 컬럼명 변경)
  const columnDefs = [
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
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { field: 'year', headerName: '년도', width: 120, minWidth: 80, maxWidth: 150, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'department', headerName: '부서', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'believer_type', headerName: '신자', width: 120, minWidth: 100, maxWidth: 150, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'education_type', headerName: '교육', width: 120, minWidth: 100, maxWidth: 150, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'graduate_transfer_status', headerName: '전송확인', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'number', headerName: '번호', width: 120, minWidth: 100, maxWidth: 150, sortable: true, filter: true, editable: false, resizable: true, cellRenderer: (params) => { if (!params.data) return ''; const { number } = params.data; return number || ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'name', headerName: '이름', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }, headerClass: 'ag-header-cell-separator' },
    { field: 'gender', headerName: '성별', width: 100, minWidth: 80, maxWidth: 120, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'marital_status', headerName: '결혼', width: 120, minWidth: 100, maxWidth: 150, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'birth_date', headerName: '생년월일', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, valueFormatter: (params) => { if (params.value) { const date = new Date(params.value); const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); return koreanDate.toISOString().split('T')[0]; } return ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'phone', headerName: '전화번호', width: 180, minWidth: 150, maxWidth: 250, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'address', headerName: '주소', width: 200, minWidth: 150, maxWidth: 300, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'teacher', headerName: '양육교사', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'register_date', headerName: '등록신청일', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, valueFormatter: (params) => { if (params.value) { const date = new Date(params.value); const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); return koreanDate.toISOString().split('T')[0]; } return ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'education_start_date', headerName: '양육시작일', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, valueFormatter: (params) => { if (params.value) { const date = new Date(params.value); const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); return koreanDate.toISOString().split('T')[0]; } return ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
        { field: 'education_end_date', headerName: '양육종료일', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, valueFormatter: (params) => { if (params.value) { const date = new Date(params.value); const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); return koreanDate.toISOString().split('T')[0]; } return ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'affiliation_org', headerName: '편입기관', width: 180, minWidth: 150, maxWidth: 250, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'belong', headerName: '소속', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'new_life_strategy_date', headerName: '새생명전략', width: 180, minWidth: 150, maxWidth: 250, sortable: true, filter: true, editable: false, resizable: true, valueFormatter: (params) => { if (params.value) { const date = new Date(params.value); const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); return koreanDate.toISOString().split('T')[0]; } return ''; }, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'identity_verified', headerName: '본인인증', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'prev_church', headerName: '전소속교회', width: 180, minWidth: 150, maxWidth: 250, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } },
    { field: 'comment', headerName: '기타', width: 200, minWidth: 150, maxWidth: 300, sortable: true, filter: true, editable: false, resizable: true, cellStyle: { borderRight: '1px solid #f1f3f4', fontSize: '14px', lineHeight: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' } }
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
      const groupsResponse = await fetch('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json();
        setCodeGroups(groupsData);
        
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

  // 전체 신자 목록 가져오기 (believer_type 필터링 포함)
  const fetchNewComers = async (searchParams = null) => {
    try {
      let url = '/api/all-believers/all';
      
      if (searchParams) {
        const queryParams = new URLSearchParams();
        
        if (searchParams.year && searchParams.year.trim() !== '') {
          queryParams.append('year', searchParams.year);
        }
        if (searchParams.name && searchParams.name.trim() !== '') {
          queryParams.append('name', searchParams.name);
        }
        // believer_type 조건 추가
        if (searchParams.believer_type && searchParams.believer_type.trim() !== '') {
          queryParams.append('believer_type', searchParams.believer_type);
        }
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
      console.log('조회 조건:', searchParams);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setNewComers(data);
      setFilteredNewComers(data);
    } catch (error) {
      console.error('전체 신자 목록 가져오기 실패:', error);
    }
  };

  // 나머지 함수들은 초신자관리와 동일하게 구현












  // Excel 다운로드
  const handleExcelDownload = () => {
    // 그리드 컬럼 순서에 맞춰 헤더 매핑 생성
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
      'number': '번호',
      'name': '이름',
      'graduate_transfer_status': '전송확인',
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

    const excelData = newComers.map((item, index) => {
      const convertedItem = {
        'No': index + 1
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
    XLSX.utils.book_append_sheet(workbook, worksheet, '등록전체조회');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const fileName = `등록전체조회_${new Date().toISOString().split('T')[0]}.xlsx`;
    saveAs(data, fileName);
  };



  // 조회 함수 (백엔드 API 호출)
  const handleSearch = async () => {
    try {
      console.log('=== 조회 시작 ===');
      console.log('조회 조건:', searchConditions);
      console.log('년도:', searchConditions.year);
      console.log('이름:', searchConditions.name);
      console.log('신자:', searchConditions.believer_type);
      console.log('교육:', searchConditions.education_type);
      console.log('전화번호:', searchConditions.phone);
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
      believer_type: '', // 전체 조회를 위해 빈 값 유지
      education_type: '',
      phone: ''
    };
    setSearchConditions(resetConditions);
    
    try {
      await fetchNewComers(resetConditions);
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
    fetchNewComers(searchConditions); // 초기 로드시 전체 데이터 가져오기
  }, []);

  // 교사 목록 가져오기
  const fetchTeachers = async (department, believer_type) => {
    try {
      const params = new URLSearchParams();
      if (department) params.append('department', department);
      if (believer_type) params.append('believer_type', believer_type);
      
      const response = await fetch(`/api/new-comers/teachers?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const teachersData = await response.json();
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
            <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>신자</InputLabel>
            <Select
              value={searchConditions.believer_type}
              onChange={(e) => setSearchConditions({...searchConditions, believer_type: e.target.value})}
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
              {codeDetails['신자']?.map((option) => (
                <MenuItem key={option.id} value={option.code_value}>
                  {option.code_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
              <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>↺</Box>
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: 'calc(100vh - 200px)', 
        minHeight: '500px',
        width: '100%',
        marginTop: '-4px'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={filteredNewComers.length > 0 ? filteredNewComers : newComers}
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
        총 {(filteredNewComers.length > 0 ? filteredNewComers : newComers).length}건
      </Box>

      {/* 여기에 다이얼로그 컴포넌트가 들어갈 예정이지만 길어서 생략 */}
      {/* 초신자관리와 동일한 다이얼로그 구조를 가집니다 */}
    </Box>
  );
};

export default AllBelieverManagementPage;
