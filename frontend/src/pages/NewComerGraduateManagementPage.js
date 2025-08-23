import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography,
  IconButton,
  Tooltip,
  Checkbox
} from '@mui/material';
import { 
  Download as DownloadIcon,
  Upload as UploadIcon,
  FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon,
  Search as SearchIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { convertDateField } from '../utils/excelUtils';
import PrintPreview from '../components/PrintPreview';

const NewComerGraduateManagementPage = () => {
  const { user } = useAuth();
  // 상태 관리
  const [graduates, setGraduates] = useState([]);
  const [codeDetails, setCodeDetails] = useState({});
  const [gridRef] = useState(useRef());
  const [selectedPrintItems, setSelectedPrintItems] = useState(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [printData, setPrintData] = useState([]);
  
  // 조회조건 상태
  const [searchConditions, setSearchConditions] = useState({
    year: new Date().getFullYear().toString(),
    name: '',
    phone: ''
  });

  // 컬럼 정의 (수정 컬럼 제거됨)
  const columnDefs = [
    {
      headerName: '출력선택',
      width: 80,
      minWidth: 70,
      maxWidth: 90,
      sortable: false,
      filter: false,
      headerComponent: () => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>선택</span>
          </Box>
        );
      },
      cellRenderer: (params) => {
        const isSelected = selectedPrintItems.has(params.data.id);
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Checkbox
              checked={isSelected}
              onChange={(e) => handlePrintSelectionChange(params.data.id, e.target.checked)}
              sx={{
                padding: 0,
                '& .MuiSvgIcon-root': {
                  fontSize: 20,
                  color: isSelected ? '#8b5cf6' : '#9ca3af'
                },
                '&.Mui-checked .MuiSvgIcon-root': {
                  color: '#8b5cf6'
                },
                '&:hover': {
                  backgroundColor: 'rgba(139, 92, 246, 0.04)'
                }
              }}
            />
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
    {
      headerName: 'No',
      width: 60,
      minWidth: 60,
      maxWidth: 80,
      sortable: false,
      filter: false,
      headerComponent: () => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>No</span>
          </Box>
        );
      },
      cellRenderer: (params) => {
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                minWidth: '20px',
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
    {
      headerName: '출력횟수',
      field: 'print_count',
      width: 100,
      minWidth: 100,
      maxWidth: 100,
      sortable: true,
      filter: true,
      cellRenderer: (params) => {
        const printCount = params.data.print_count || 0;
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: '600',
                color: printCount > 0 ? '#059669' : '#6b7280',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {printCount}
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
    { headerName: '부서', field: 'department', width: 150, minWidth: 120, maxWidth: 2000, sortable: true, filter: true },
    { headerName: '신자', field: 'believer_type', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { headerName: '교육', field: 'education_type', width: 80, minWidth: 80, maxWidth: 100, sortable: true, filter: true },
    { 
      headerName: '수료번호', 
      field: 'graduate_number', 
      width: 100, 
      minWidth: 100, 
      maxWidth: 120, 
      sortable: true, 
      filter: true,
      cellRenderer: (params) => {
        // 수료번호가 null이거나 빈 값인 경우 아무것도 표시하지 않음
        if (!params.value || params.value === null || params.value === '' || params.value === 'null') {
          return null;
        }
        
        return (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center'
          }}>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#8b5cf6',
                minWidth: '20px',
                textAlign: 'center'
              }}
            >
              {params.value}
            </Typography>
          </Box>
        );
      },
      cellStyle: {
        textAlign: 'center',
        fontWeight: '500',
        fontSize: '14px'
      },
      headerClass: 'ag-header-cell-separator'
    },
    { headerName: '이름', field: 'name', width: 70, minWidth: 100, maxWidth: 100, sortable: true, filter: true },
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
    { headerName: '편입기관', field: 'affiliation_org', width: 100, minWidth: 100, maxWidth: 120, sortable: true, filter: true },
    { headerName: '소속', field: 'belong', width: 100, sortable: true, filter: true },
    { 
      headerName: '새생명전략', 
      field: 'new_life_strategy_date', 
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
      headerName: '본인인증', 
      field: 'identity_verified', 
      width: 100, 
      sortable: true, 
      filter: true
    },
    { headerName: '전소속교회', field: 'prev_church', width: 150, sortable: true, filter: true },
    { headerName: '기타', field: 'comment', width: 250,minWidth: 200, maxWidth: 300,sortable: true, filter: true }
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
    animateRows: true,
    headerHeight: 40,
    rowHeight: 40,
    suppressMenuHide: true,
    suppressMovableColumns: true,
    suppressFieldDotNotation: true,
    enableBrowserTooltips: true
  };

  // 코드 관리 데이터 가져오기
  const fetchCodeData = async () => {
    try {
      const response = await fetch('/api/code-details', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCodeDetails(data);
      }
    } catch (error) {
      console.error('코드 데이터 가져오기 실패:', error);
    }
  };

  // 수료자 목록 가져오기 (초신자 수료자만 조회)
  const fetchGraduates = async (searchParams = {}) => {
    try {
      const queryParams = new URLSearchParams();
      Object.keys(searchParams).forEach(key => {
        if (searchParams[key] && searchParams[key].trim() !== '') {
          queryParams.append(key, searchParams[key].trim());
        }
      });

      // 무조건 초신자 수료자만 조회
      queryParams.append('believer_type', '초신자');
      queryParams.append('education_type', '수료');

      const url = queryParams.toString() 
        ? `/api/new-comer-graduates?${queryParams.toString()}`
        : '/api/new-comer-graduates';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('수료자 데이터 조회 결과:', data);
        console.log('수료번호 확인:', data.map(item => ({ id: item.id, graduate_number: item.graduate_number })));
        setGraduates(Array.isArray(data) ? data : []);
        setSelectedPrintItems(new Set()); // 새 데이터 로드시 선택 초기화
      } else {
        console.error('수료자 목록 가져오기 실패');
        setGraduates([]);
        setSelectedPrintItems(new Set());
      }
    } catch (error) {
      console.error('수료자 목록 가져오기 실패:', error);
      setGraduates([]);
      setSelectedPrintItems(new Set());
    }
  };

  // 체크박스 선택 처리
  const handlePrintSelectionChange = (graduateId, checked) => {
    const newSelectedItems = new Set(selectedPrintItems);
    if (checked) {
      newSelectedItems.add(graduateId);
    } else {
      newSelectedItems.delete(graduateId);
    }
    setSelectedPrintItems(newSelectedItems);
  };

  // 선택된 항목들 미리보기 및 출력 처리
  const handlePrintSelected = () => {
    if (selectedPrintItems.size === 0) {
      alert('출력할 항목을 선택해주세요.');
      return;
    }

    // 선택된 항목들의 데이터 가져오기
    const selectedData = graduates.filter(graduate => 
      selectedPrintItems.has(graduate.id)
    );

    setPrintData(selectedData);
    setShowPrintPreview(true);
  };

  // 프린트 미리보기 닫기
  const handleClosePrintPreview = () => {
    setShowPrintPreview(false);
    setPrintData([]);
  };

  // 프린트 완료 후 처리
  const handlePrintComplete = () => {
    setSelectedPrintItems(new Set()); // 선택 초기화
    fetchGraduates(searchConditions); // 데이터 새로고침
  };

  // 전체 선택/해제
  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds = new Set(graduates.map(graduate => graduate.id));
      setSelectedPrintItems(allIds);
    } else {
      setSelectedPrintItems(new Set());
    }
  };

  // Excel 다운로드
  const handleExcelDownload = () => {
    if (!Array.isArray(graduates) || graduates.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }

    // 그리드 컬럼 순서에 맞춰 헤더 매핑 생성 (버튼 컬럼들 제외)
    const orderedFields = [
      'no',
      'print_count',
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
      'print_count': '출력횟수',
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
    const excelData = graduates.map((item, index) => {
      const row = {};
      
      // 그리드 순서대로 필드 추가
      orderedFields.forEach(field => {
        if (field === 'no') {
          row[headerMapping[field]] = index + 1;
        } else if (field === 'print_count') {
          // 출력횟수 필드 특별 처리 - 없으면 0으로 표시
          const value = item[field];
          row[headerMapping[field]] = value !== null && value !== undefined && value !== '' ? value : 0;
        } else {
          const value = item[field];
          if (field.includes('date') && value) {
            row[headerMapping[field]] = new Date(value).toLocaleDateString('ko-KR');
          } else {
            row[headerMapping[field]] = value || '';
          }
        }
      });
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '초신자수료자관리');
    const fileName = `초신자수료자관리_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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
        
        // 한글 헤더를 영문 필드명으로 매핑
        const fieldMapping = {
          '년도': 'year',
          '부서': 'department',
          '신자': 'believer_type',
          '교육': 'education_type',
          '수료번호': 'graduate_number',
          '이름': 'name',
          '출력횟수': 'print_count',
          '성별': 'gender',
          '결혼': 'marital_status',
          '생년월일': 'birth_date',
          '주소': 'address',
          '전화': 'phone',
          '양육교사': 'teacher',
          '등록신청일': 'register_date',
          '양육시작일': 'education_start_date',
          '양육종료일': 'education_end_date',
          '편입기관': 'affiliation_org',
          '소속': 'belong',
          '새생명전략': 'new_life_strategy_date',
          '본인인증': 'identity_verified',
          '전소속교회': 'prev_church',
          '기타': 'comment'
        };

        // 날짜 필드 변환
        const convertedData = jsonData.map(row => {
          const converted = {};
          
          // 한글 헤더를 영문 필드명으로 변환
          Object.keys(row).forEach(koreanHeader => {
            const englishField = fieldMapping[koreanHeader];
            if (englishField) {
              converted[englishField] = row[koreanHeader];
            }
          });
          
          // 날짜로 보이는 필드들 변환
          ['birth_date', 'register_date', 'education_start_date', 'education_end_date', 'new_life_strategy_date'].forEach(field => {
            if (converted[field] !== undefined && converted[field] !== null) {
              converted[field] = convertDateField(converted[field]);
            }
          });
          
          return converted;
        });
        
        console.log('첫 번째 행 샘플 (변환 후):', convertedData[0]);
        
        // 서버로 데이터 전송
        console.log('서버로 데이터 전송 시작...');
        const response = await fetch('/api/new-comer-graduates/upload', {
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
          await fetchGraduates(searchConditions);
          alert(`Excel 파일이 성공적으로 업로드되었습니다. (${result.uploadedCount || convertedData.length}개 데이터)`);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('서버 오류:', response.status, errorData);
          throw new Error(`Upload failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
      } catch (error) {
        console.error('Excel 업로드 처리 실패:', error);
        alert('Excel 파일 처리 중 오류가 발생했습니다: ' + error.message);
      }
    };
    
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  // 조회 처리
  const handleSearch = () => {
    fetchGraduates(searchConditions);
  };

  // 조회조건 초기화
  const handleResetSearch = () => {
    setSearchConditions({
      year: new Date().getFullYear().toString(),
      name: '',
      phone: ''
    });
    fetchGraduates({ year: new Date().getFullYear().toString() });
  };

  useEffect(() => {
    fetchCodeData();
    fetchGraduates({ year: new Date().getFullYear().toString() });
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
              hidden
              onChange={handleExcelUpload}
            />
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
        

        
        <TextField
          label="전화번호"
          value={searchConditions.phone}
          onChange={(e) => setSearchConditions({...searchConditions, phone: e.target.value})}
          size="small"
          sx={{ 
            width: '150px',
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

        <Tooltip title="선택된 항목 출력" arrow placement="top">
          <IconButton
            onClick={handlePrintSelected}
            disabled={selectedPrintItems.size === 0}
            size="small"
            sx={{
              background: selectedPrintItems.size > 0 
                ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
              color: 'white',
              width: 36,
              height: 36,
              borderRadius: '12px',
              boxShadow: selectedPrintItems.size > 0 
                ? '0 4px 6px -1px rgba(139, 92, 246, 0.3), 0 2px 4px -1px rgba(139, 92, 246, 0.2)'
                : '0 4px 6px -1px rgba(209, 213, 219, 0.3), 0 2px 4px -1px rgba(209, 213, 219, 0.2)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover:not(:disabled)': {
                background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                transform: 'translateY(-2px) scale(1.05)',
                boxShadow: '0 10px 15px -3px rgba(139, 92, 246, 0.4), 0 4px 6px -2px rgba(139, 92, 246, 0.3)'
              },
              '&:active:not(:disabled)': {
                transform: 'translateY(0px) scale(1.02)',
                boxShadow: '0 4px 6px -1px rgba(139, 92, 246, 0.3)'
              },
              '&:disabled': {
                cursor: 'not-allowed'
              }
            }}
          >
            <PrintIcon sx={{ fontSize: 16 }} />
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
          rowData={Array.isArray(graduates) ? graduates : []}
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
        총 {Array.isArray(graduates) ? graduates.length : 0}건
        {selectedPrintItems.size > 0 && (
          <span style={{ 
            marginLeft: '16px', 
            color: '#8b5cf6', 
            fontWeight: '600' 
          }}>
            ({selectedPrintItems.size}개 항목 선택됨)
          </span>
        )}
      </Box>

      {/* 프린트 미리보기 다이얼로그 */}
      <PrintPreview
        open={showPrintPreview}
        onClose={handleClosePrintPreview}
        printData={printData}
        onPrintComplete={handlePrintComplete}
      />
    </Box>
  );
};

export default NewComerGraduateManagementPage;