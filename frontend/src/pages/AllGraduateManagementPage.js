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
  MenuItem
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


const AllGraduateManagementPage = () => {
  const { user } = useAuth();
  // 상태 관리
  const [allGraduates, setAllGraduates] = useState([]);
  const [codeDetails, setCodeDetails] = useState({});
  const [gridRef] = useState(useRef());
  
  // 조회조건 상태
  const [searchConditions, setSearchConditions] = useState({
    year: new Date().getFullYear().toString(),
    name: '',
    believer_type: '',
    phone: ''
  });

  // 컬럼 정의
  const columnDefs = [
    {
      headerName: 'No',
      width: 60,
      minWidth: 60,
      maxWidth: 80,
      sortable: false,
      filter: false,
      valueGetter: (params) => params.node.rowIndex + 1,
      cellRenderer: (params) => {
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#6b7280',
                padding: '2px 6px',
                minWidth: '24px',
                textAlign: 'center'
              }}
            >
              {params.node.rowIndex + 1}
            </Typography>
          </Box>
        );
      },
      cellStyle: {
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
    { headerName: '년도', field: 'year', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { headerName: '부서', field: 'department', width: 150, minWidth: 120, maxWidth: 200, sortable: true, filter: true },
    { headerName: '신자', field: 'believer_type', width: 100, minWidth: 100, maxWidth: 120, sortable: true, filter: true },
    { headerName: '교육', field: 'education_type', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { headerName: '수료번호', field: 'graduate_number', width: 120, minWidth: 120, maxWidth: 150, sortable: true, filter: true },
    { headerName: '이름', field: 'name', width: 100, minWidth: 100, maxWidth: 120, sortable: true, filter: true },
    { headerName: '성별', field: 'gender', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { headerName: '결혼', field: 'marital_status', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { 
      headerName: '생년월일', 
      field: 'birth_date', 
      width: 120, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      }
    },
    { headerName: '주소', field: 'address', width: 200, sortable: true, filter: true },
    { headerName: '전화', field: 'phone', width: 130, sortable: true, filter: true },
    { headerName: '양육교사', field: 'teacher', width: 120, minWidth: 120, maxWidth: 150, sortable: true, filter: true },
    { 
      headerName: '등록신청일', 
      field: 'register_date', 
      width: 120, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      }
    },
    { 
      headerName: '양육시작일',
      field: 'education_start_date', 
      width: 120, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      }
    },
    { 
      headerName: '양육종료일',
              field: 'education_end_date', 
      width: 120, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      }
    },
    { headerName: '편입기관', field: 'affiliation_org', width: 120, minWidth: 120, maxWidth: 150, sortable: true, filter: true },
    { headerName: '소속', field: 'belong', width: 100, sortable: true, filter: true },
    { 
      headerName: '새생명전략', 
      field: 'new_life_strategy_date', 
      width: 140, 
      sortable: true, 
      filter: true,
      valueFormatter: (params) => {
        if (!params.value) return '';
        const date = new Date(params.value);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      }
    },
    { 
      headerName: '본인인증', 
      field: 'identity_verified', 
      width: 120, 
      sortable: true, 
      filter: true
    },
    { headerName: '전소속교회', field: 'prev_church', width: 150, sortable: true, filter: true },
    { headerName: '기타', field: 'comment', width: 200, minWidth: 200, maxWidth: 300, sortable: true, filter: true }
  ];

  // AG Grid 기본 설정
  const defaultColDef = {
    flex: 1,
    minWidth: 150,
    maxWidth: 300,
    sortable: true,
    filter: true,
    resizable: true,
    headerClass: 'ag-header-cell-separator'
  };

  // AG Grid 옵션
  const gridOptions = {
    paginationPageSize: 50,
    suppressCellFocus: true,
    rowHeight: 50,
    headerHeight: 50,
    suppressRowClickSelection: true,
    suppressPaginationPanel: true
  };

  // 코드 데이터 가져오기
  const fetchCodeData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // 먼저 코드 그룹을 가져옵니다
      const groupsResponse = await fetch('/api/code-groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (groupsResponse.ok) {
        const groups = await groupsResponse.json();
        
        // 각 그룹에 대해 코드 상세를 가져옵니다
        const codeMap = {};
        
        for (const group of groups) {
          const codesResponse = await fetch(`/api/code-details?group_id=${group.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (codesResponse.ok) {
            const codes = await codesResponse.json();
            codeMap[group.group_code] = codes;
          }
        }
        
        setCodeDetails(codeMap);
      }
    } catch (error) {
      console.error('코드 데이터 가져오기 실패:', error);
    }
  };

  // 수료자 데이터 가져오기 (believer_type 필터링 제거)
  const fetchAllGraduates = async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      // 검색 조건이 있는 경우에만 쿼리 파라미터 추가
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key]) {
          queryParams.append(key, searchParams[key]);
        }
      });

      const response = await fetch(`/api/graduates?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllGraduates(Array.isArray(data) ? data : []);
      } else {
        console.error('수료자 데이터 가져오기 실패');
        setAllGraduates([]);
      }
    } catch (error) {
      console.error('수료자 데이터 가져오기 오류:', error);
      setAllGraduates([]);
    }
  };



  // 엑셀 다운로드
  const handleExcelDownload = () => {
    if (allGraduates.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // 그리드 컬럼 순서에 맞춰 헤더 매핑 생성
    const orderedFields = [
      'no',
      'year',
      'department',
      'believer_type',
      'education_type',
      'graduate_number',
      'name',
      'gender',
      'marital_status',
      'birth_date',
      'address',
      'phone',
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
      'no': 'No',
      'year': '년도',
      'department': '부서',
      'believer_type': '신자',
      'education_type': '교육',
      'graduate_number': '수료번호',
      'name': '이름',
      'gender': '성별',
      'marital_status': '결혼',
      'birth_date': '생년월일',
      'address': '주소',
      'phone': '전화',
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

    // 데이터를 그리드 순서대로 변환
    const exportData = allGraduates.map((graduate, index) => {
      const row = {};
      
      // 그리드 순서대로 필드 추가
      orderedFields.forEach(field => {
        if (field === 'no') {
          row[headerMapping[field]] = index + 1;
        } else if (field === 'birth_date' || field === 'register_date' || field === 'education_start_date' || field === 'education_end_date' || field === 'new_life_strategy_date') {
          if (graduate[field]) {
            const date = new Date(graduate[field]);
            if (!isNaN(date.getTime())) {
              row[headerMapping[field]] = date.toISOString().split('T')[0];
            } else {
              row[headerMapping[field]] = '';
            }
          } else {
            row[headerMapping[field]] = '';
          }
        } else {
          row[headerMapping[field]] = graduate[field] || '';
        }
      });
      
      return row;
    });

    // 워크북 생성
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '수료자목록');

    // 파일 다운로드
    const fileName = `수료전체목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };



  // 검색 실행
  const handleSearch = () => {
    fetchAllGraduates(searchConditions);
  };

  // 전화번호 포맷팅 함수
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

  // 검색 조건 초기화
  const handleResetSearch = () => {
    setSearchConditions({
      year: new Date().getFullYear().toString(),
      name: '',
      believer_type: '',
      phone: ''
    });
    fetchAllGraduates({});
  };

  useEffect(() => {
    fetchCodeData();
    fetchAllGraduates({ year: new Date().getFullYear().toString() });
  }, []);

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      
      {/* 버튼 그룹 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1, mt: -7.5, alignItems: 'center' }}>
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


        
        {/* 검색 조건 필드들 */}
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
        
        <TextField
          label="이름"
          value={searchConditions.name}
          onChange={(e) => setSearchConditions({...searchConditions, name: e.target.value})}
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
            <Typography sx={{ fontSize: '14px', fontWeight: 'bold' }}>
              ↻
            </Typography>
          </IconButton>
        </Tooltip>


        
        <Box sx={{ flexGrow: 1 }} />
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
          rowData={Array.isArray(allGraduates) ? allGraduates : []}
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
        총 {Array.isArray(allGraduates) ? allGraduates.length : 0}건
      </Box>
    </Box>
  );
};

export default AllGraduateManagementPage;
