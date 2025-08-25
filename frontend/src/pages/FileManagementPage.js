import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Folder as FolderIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { commonFilesAPI } from '../services/api';

const FileManagementPage = () => {
  // ResizeObserver 경고 억제
  useEffect(() => {
    const originalError = console.error;
    
    console.error = (...args) => {
      // ResizeObserver 경고 억제
      if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
        return;
      }
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [fileDescription, setFileDescription] = useState('');
  const [fileDepartment, setFileDepartment] = useState('');
  const [fileBeliever, setFileBeliever] = useState('');
  const [codeData, setCodeData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchConditions, setSearchConditions] = useState({
    fileName: '',
    department: '',
    believer: ''
  });
  const [filteredFiles, setFilteredFiles] = useState([]);
  const gridRef = useRef();

  useEffect(() => {
    fetchFiles();
    fetchCodeData();
  }, []);

  // 코드 데이터 가져오기
  const fetchCodeData = async () => {
    try {
      const response = await fetch('/api/code-details', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const codeDetails = await response.json();
      
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
      
      console.log('코드 데이터 로드 완료:', groupedCodes);
      
      // 신자 관련 그룹명 확인 및 매핑
      const believerGroups = ['신자', '신자유형', 'believer_type'];
      let believerData = [];
      
      for (const group of believerGroups) {
        if (groupedCodes[group]) {
          believerData = groupedCodes[group];
          break;
        }
      }
      
      // 부서 관련 그룹명 확인 및 매핑
      const departmentGroups = ['부서', 'department'];
      let departmentData = [];
      
      for (const group of departmentGroups) {
        if (groupedCodes[group]) {
          departmentData = groupedCodes[group];
          break;
        }
      }
      
      setCodeData({
        '부서': departmentData.length > 0 ? departmentData : [
          { value: '새가족위원회', label: '새가족위원회' },
          { value: '아포슬', label: '아포슬' }
        ],
        '신자': believerData.length > 0 ? believerData : [
          { value: '초신자', label: '초신자' },
          { value: '신자', label: '신자' }
        ]
      });
    } catch (error) {
      console.error('코드 데이터 가져오기 실패:', error);
      // 기본값 설정 (API 실패 시)
      setCodeData({
        '부서': [
          { value: '새가족위원회', label: '새가족위원회' },
          { value: '아포슬', label: '아포슬' }
        ],
        '신자': [
          { value: '초신자', label: '초신자' },
          { value: '신자', label: '신자' }
        ]
      });
    }
  };

  const fetchFiles = async () => {
    console.log('=== fetchFiles 시작 ===');
    setLoading(true);
    try {
      console.log('commonFilesAPI.getAll() 호출...');
      const response = await commonFilesAPI.getAll();
      console.log('API 응답 전체:', response);
      console.log('API 응답 데이터:', response.data);
      console.log('데이터 타입:', typeof response.data);
      console.log('데이터 길이:', Array.isArray(response.data) ? response.data.length : '배열 아님');
      
      setFiles(response.data);
      setFilteredFiles(response.data);
      
      console.log('상태 업데이트 완료:');
      console.log('- files 상태:', response.data);
      console.log('- filteredFiles 상태:', response.data);
    } catch (error) {
      console.error('파일 목록 가져오기 실패:', error);
      console.error('오류 상세 정보:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setError('파일 목록을 가져오는데 실패했습니다.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
    } finally {
      setLoading(false);
      console.log('=== fetchFiles 완료 ===');
    }
  };

  // 파일 검색 함수 (프론트엔드에서 JavaScript로 검색)
  const handleSearch = () => {
    console.log('=== 검색 시작 ===');
    console.log('검색 조건:', searchConditions);
    console.log('검색 파일명:', searchConditions.fileName);
    console.log('검색 파일명 길이:', searchConditions.fileName?.length);
    console.log('검색 파일명 hex:', searchConditions.fileName ? Array.from(searchConditions.fileName).map(c => c.charCodeAt(0).toString(16)).join('') : '');
    console.log('전체 파일 수:', files.length);
    console.log('전체 파일 목록:', files.map(f => ({ 
      id: f.id, 
      original_name: f.original_name,
      original_name_length: f.original_name?.length,
      original_name_hex: f.original_name ? Array.from(f.original_name).map(c => c.charCodeAt(0).toString(16)).join('') : ''
    })));
    
    const filtered = files.filter(file => {
      console.log(`\n=== 파일 ${file.id} 검색 분석 ===`);
      console.log('파일명:', file.original_name);
      console.log('파일명 길이:', file.original_name?.length);
      console.log('파일명 hex:', file.original_name ? Array.from(file.original_name).map(c => c.charCodeAt(0).toString(16)).join('') : '');
      console.log('파일명 각 문자:', file.original_name ? Array.from(file.original_name).map((c, i) => `${i}: '${c}' (${c.charCodeAt(0).toString(16)})`) : []);
      
      const fileNameMatch = !searchConditions.fileName || 
        file.original_name?.toLowerCase().includes(searchConditions.fileName.toLowerCase());
      
      console.log('검색 파일명:', searchConditions.fileName);
      console.log('검색 파일명 길이:', searchConditions.fileName?.length);
      console.log('검색 파일명 hex:', searchConditions.fileName ? Array.from(searchConditions.fileName).map(c => c.charCodeAt(0).toString(16)).join('') : '');
      console.log('검색 파일명 각 문자:', searchConditions.fileName ? Array.from(searchConditions.fileName).map((c, i) => `${i}: '${c}' (${c.charCodeAt(0).toString(16)})`) : []);
      
      console.log('파일명 소문자:', file.original_name?.toLowerCase());
      console.log('검색 파일명 소문자:', searchConditions.fileName?.toLowerCase());
      console.log('includes 결과:', file.original_name?.toLowerCase().includes(searchConditions.fileName?.toLowerCase()));
      
      const departmentMatch = !searchConditions.department || 
        file.department === searchConditions.department;
      const believerMatch = !searchConditions.believer || 
        file.believer === searchConditions.believer;
      
      console.log('최종 매칭 결과:', {
        fileNameMatch,
        departmentMatch,
        believerMatch,
        searchFileName: searchConditions.fileName,
        fileOriginalName: file.original_name
      });
      
      return fileNameMatch && departmentMatch && believerMatch;
    });
    
    console.log('\n=== 검색 결과 ===');
    console.log('필터링된 결과:', filtered.length);
    console.log('필터링된 파일들:', filtered.map(f => ({ 
      id: f.id, 
      original_name: f.original_name,
      original_name_length: f.original_name?.length,
      original_name_hex: f.original_name ? Array.from(f.original_name).map(c => c.charCodeAt(0).toString(16)).join('') : ''
    })));
    
    setFilteredFiles(filtered);
  };

  // 검색 조건 초기화
  const handleResetSearch = () => {
    setSearchConditions({
      fileName: '',
      department: '',
      believer: ''
    });
    setFilteredFiles(files);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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
      setFileDescription('');
    }
  };

  const handleUpload = async () => {
    console.log('=== 파일 업로드 시작 ===');
    console.log('선택된 파일:', selectedFile);
    
    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
      return;
    }

    const formData = new FormData();
    
    // 원본 파일명 그대로 사용
    console.log('원본 파일명:', selectedFile.name);
    console.log('원본 파일명 길이:', selectedFile.name.length);
    console.log('원본 파일명 hex:', Array.from(selectedFile.name).map(c => c.charCodeAt(0).toString(16)).join(''));
    
    formData.append('file', selectedFile);
    if (fileDescription) {
      formData.append('description', fileDescription);
    }
    if (fileDepartment) {
      formData.append('department', fileDepartment);
    }
    if (fileBeliever) {
      formData.append('believer', fileBeliever);
    }

    try {
      await commonFilesAPI.upload(formData);
      
      setSuccess('파일이 성공적으로 업로드되었습니다.');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setOriginalFileName('');
      setFileDescription('');
      setFileDepartment('');
      setFileBeliever('');
      fetchFiles();
      
      // 2초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      setError('파일 업로드에 실패했습니다.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await commonFilesAPI.download(fileId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      setError('파일 다운로드에 실패했습니다.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm('정말로 이 파일을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await commonFilesAPI.delete(fileId);
      setSuccess('파일이 성공적으로 삭제되었습니다.');
      fetchFiles();
      
      // 2초 후 성공 메시지 자동 제거
      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      setError('파일 삭제에 실패했습니다.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
    }
  };

  const handleView = async (fileId, fileName, mimeType) => {
    if (!fileId) {
      setError('볼 파일이 없습니다.');
      return;
    }

    console.log('=== 파일 보기 시작 ===');
    console.log('파일 ID:', fileId);
    console.log('파일명:', fileName);
    console.log('MIME 타입:', mimeType);
    console.log('현재 토큰:', localStorage.getItem('token'));

    try {
      console.log('commonFilesAPI.download() 호출...');
      const response = await commonFilesAPI.download(fileId);
      console.log('다운로드 응답:', response);
      console.log('응답 데이터 타입:', typeof response.data);
      console.log('응답 데이터 크기:', response.data?.size || '알 수 없음');
      
      // 파일 확장자로 타입 판단
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const isImage = mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      const isPdf = mimeType === 'application/pdf' || fileExtension === 'pdf';
      const isText = mimeType?.startsWith('text/') || ['txt', 'md', 'html', 'css', 'js', 'json', 'xml'].includes(fileExtension);
      
      console.log('파일 타입 판단:', { fileExtension, isImage, isPdf, isText });
      
      // Blob 생성 시 적절한 MIME 타입 설정
      let blob;
      if (isImage) {
        blob = new Blob([response.data], { type: mimeType || 'image/jpeg' });
      } else if (isPdf) {
        blob = new Blob([response.data], { type: 'application/pdf' });
      } else if (isText) {
        blob = new Blob([response.data], { type: mimeType || 'text/plain' });
      } else {
        blob = new Blob([response.data]);
      }
      
      console.log('생성된 Blob:', blob);
      console.log('Blob 크기:', blob.size);
      console.log('Blob 타입:', blob.type);
      
      const url = window.URL.createObjectURL(blob);
      console.log('생성된 URL:', url);
      
      if (isImage || isPdf) {
        // 이미지나 PDF 파일은 새 창에서 열기
        console.log('새 창에서 파일 열기 시도...');
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
          setError('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
          
          // 2초 후 에러 메시지 자동 제거
          setTimeout(() => {
            setError('');
          }, 2000);
        } else {
          console.log('새 창 열기 성공');
        }
        // 메모리 정리
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          console.log('URL 메모리 정리 완료');
        }, 1000);
      } else {
        // 기타 파일은 다운로드
        console.log('파일 다운로드 실행...');
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('파일 다운로드 완료');
      }
      
      console.log('=== 파일 보기 완료 ===');
    } catch (error) {
      console.error('파일 보기 실패:', error);
      console.error('에러 상세 정보:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      });
      setError('파일 보기에 실패했습니다.');
      
      // 2초 후 에러 메시지 자동 제거
      setTimeout(() => {
        setError('');
      }, 2000);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈';
    return '📁';
  };

  // AG Grid 컬럼 정의
  const columnDefs = [
    {
      headerName: '파일명',
      field: 'original_name',
      width: 300,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: '20px' }}>
            {getFileIcon(params.data.mimetype)}
          </span>
          <Typography variant="body2" sx={{ fontWeight: '600' }}>
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      headerName: '저장파일명',
      field: 'saved_name',
      width: 200,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {params.value || '-'}
          </Typography>
        </Box>
      )
    },
    {
      headerName: '설명',
      field: 'description',
      width: 300,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        </Box>
      )
    },
    {
      headerName: '부서',
      field: 'department',
      width: 120,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        </Box>
      )
    },
    {
      headerName: '신자',
      field: 'believer',
      width: 100,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2" color="text.secondary">
            {params.value || '-'}
          </Typography>
        </Box>
      )
    },
    {
      headerName: '크기',
      field: 'size',
      width: 120,
      cellRenderer: (params) => formatFileSize(params.value)
    },
    {
      headerName: '타입',
      field: 'mimetype',
      width: 150
    },
    {
      headerName: '업로드일',
      field: 'created_at',
      width: 200,
      cellRenderer: (params) => format(new Date(params.value), 'yyyy-MM-dd HH:mm', { locale: ko })
    },
    {
      headerName: '작업',
      width: 150,
      cellRenderer: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="보기">
            <IconButton
              size="small"
              onClick={() => handleView(params.data.id, params.data.original_name, params.data.mimetype)}
              sx={{ color: '#3b82f6' }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="다운로드">
            <IconButton
              size="small"
              onClick={() => handleDownload(params.data.id, params.data.original_name)}
              sx={{ color: '#10b981' }}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="삭제">
            <IconButton
              size="small"
              onClick={() => handleDelete(params.data.id)}
              sx={{ color: '#ef4444' }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )
    }
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true
  };

  const gridOptions = {
    suppressRowClickSelection: true,
    suppressCellFocus: true,
    suppressResizeObserver: true,
    suppressAnimationFrame: true,
    suppressBrowserResizeObserver: true
  };

  return (
    <Box sx={{ p: 3, mt: 6 }}>
      
      {/* 버튼 그룹 */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, mt: -7.5, alignItems: 'center', flexWrap: 'wrap' }}>
        <Tooltip title="파일 업로드" arrow placement="top">
          <IconButton
            onClick={() => setUploadDialogOpen(true)}
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
            <UploadIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>



        {/* 검색 조건 */}
        <Box sx={{ display: 'flex', gap: 1, ml: 2, alignItems: 'center' }}>
          <TextField
            label="파일명"
            value={searchConditions.fileName}
            onChange={(e) => setSearchConditions({...searchConditions, fileName: e.target.value})}
            size="small"
            sx={{
              width: 300,
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
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>부서</InputLabel>
            <Select
              value={searchConditions.department}
              onChange={(e) => setSearchConditions({...searchConditions, department: e.target.value})}
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
              {codeData['부서']?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 150 }}>
            <InputLabel sx={{ fontSize: '12px', fontWeight: '600', color: '#374151' }}>신자</InputLabel>
            <Select
              value={searchConditions.believer}
              onChange={(e) => setSearchConditions({...searchConditions, believer: e.target.value})}
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
              {codeData['신자']?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="검색" arrow placement="top">
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

        {/* 성공 메시지 */}
        {success && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
            border: '1px solid #10b981',
            borderRadius: '12px',
            borderLeft: '4px solid #10b981',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'white'
              }} />
            </Box>
            <Typography sx={{
              color: '#065f46',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {success}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setSuccess('')}
              sx={{
                color: '#10b981',
                '&:hover': {
                  background: 'rgba(16, 185, 129, 0.1)'
                }
              }}
            >
              <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>×</Box>
            </IconButton>
          </Box>
        )}

        {/* 에러 메시지 */}
        {error && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            borderLeft: '4px solid #ef4444',
            boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
            animation: 'slideIn 0.3s ease-out'
          }}>
            <Box sx={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'white'
              }} />
            </Box>
            <Typography sx={{
              color: '#991b1b',
              fontWeight: '600',
              fontSize: '14px'
            }}>
              {error}
            </Typography>
            <IconButton
              size="small"
              onClick={() => setError('')}
              sx={{
                color: '#ef4444',
                '&:hover': {
                  background: 'rgba(239, 68, 68, 0.1)'
                }
              }}
            >
              <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>×</Box>
            </IconButton>
          </Box>
        )}
      </Box>

      {/* AG Grid */}
      <div className="ag-theme-alpine" style={{ 
        height: 'calc(100vh - 200px)', 
        minHeight: '500px',
        width: '100%',
        marginTop: '-4px',
        overflow: 'hidden'
      }}>
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={filteredFiles}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          loading={loading}
        />
      </div>

      {/* 파일 업로드 다이얼로그 */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)} 
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
          파일 업로드
        </DialogTitle>
        <DialogContent sx={{ padding: '24px' }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 3, 
            mt: 2 
          }}>
            {/* 파일 선택 영역 */}
            <Box>
              <input
                type="file"
                accept="*/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Box
                  sx={{
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      background: 'rgba(59, 130, 246, 0.05)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                    }
                  }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: '#374151', fontWeight: '600', mb: 1 }}>
                    파일을 선택하거나 여기로 드래그하세요
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    모든 파일 형식 지원
                  </Typography>
                </Box>
              </label>
            </Box>

            {/* 선택된 파일 정보 */}
            {selectedFile && (
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: '1px solid #10b981',
                borderRadius: '12px',
                borderLeft: '4px solid #10b981'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <UploadIcon sx={{ color: 'white', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: '600', color: '#065f46', mb: 0.5 }}>
                      ✓ 선택된 파일: {originalFileName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#047857' }}>
                      크기: {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {/* 파일 설명 입력 */}
            <TextField
              fullWidth
              label="파일 설명 (선택사항)"
              value={fileDescription}
              onChange={(e) => setFileDescription(e.target.value)}
              multiline
              rows={3}
              placeholder="파일에 대한 설명을 입력하세요..."
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
                },
                '& .MuiInputBase-input::placeholder': {
                  color: '#9ca3af',
                  opacity: 1
                }
              }}
            />

            {/* 부서 선택 */}
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>부서</InputLabel>
              <Select
                value={fileDepartment}
                onChange={(e) => setFileDepartment(e.target.value)}
                label="부서"
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
                {codeData['부서']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 신자 선택 */}
            <FormControl fullWidth>
              <InputLabel sx={{ fontWeight: '600', color: '#374151' }}>신자</InputLabel>
              <Select
                value={fileBeliever}
                onChange={(e) => setFileBeliever(e.target.value)}
                label="신자"
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
                {codeData['신자']?.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ padding: '20px 24px', gap: 2 }}>
          <Button 
            onClick={() => setUploadDialogOpen(false)}
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
            onClick={handleUpload} 
            disabled={!selectedFile}
            sx={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: '600',
              textTransform: 'none',
              color: 'white',
              background: !selectedFile 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: !selectedFile 
                  ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                  : 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4)',
                color: 'white'
              },
              '&:disabled': {
                cursor: 'not-allowed',
                transform: 'none',
                color: 'rgba(255, 255, 255, 0.6)'
              }
            }}
          >
            업로드
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManagementPage;
