import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
});

// API 전용 인스턴스 (baseURL에 /api 포함)
const apiWithPrefix = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:3001') + '/api',
  timeout: 10000,
});

// 토큰 갱신 함수
const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('토큰이 없습니다.');
    }

    const response = await axios.post(
      `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/refresh`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    const { token: newToken, user } = response.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(user));
    
    return newToken;
  } catch (error) {
    console.error('토큰 갱신 실패:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/unauthorized';
    throw error;
  }
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/unauthorized';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Request interceptor for apiWithPrefix instance
apiWithPrefix.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for apiWithPrefix instance
apiWithPrefix.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiWithPrefix(originalRequest);
      } catch (refreshError) {
        // 토큰 갱신 실패 시 로그인 페이지로 리다이렉트
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/unauthorized';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  logout: () => api.post('/auth/logout'),
  verify: () => api.get('/auth/verify'),
  refresh: () => api.post('/auth/refresh'),
  google: () => window.open('http://localhost:3001/auth/google', '_self'),
  naver: () => window.open('http://localhost:3001/auth/naver', '_self'),
};

// Believer API
export const believerAPI = {
  getAll: (params) => api.get('/believers/all', { params }),
  create: (data) => api.post('/believers', data),
  update: (id, data) => api.put(`/believers/${id}`, data),
  delete: (id) => api.delete(`/believers/${id}`),
  graduateBeliever: (id) => api.post(`/believers/graduate/${id}`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/believers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  export: () => api.get('/believers/export', { responseType: 'blob' }),
};

// Transfer Believer API
export const transferBelieverAPI = {
  getAll: (params) => api.get('/transfer-believers/all', { params }),
  create: (data) => api.post('/transfer-believers', data),
  update: (id, data) => api.put(`/transfer-believers/${id}`, data),
  delete: (id) => api.delete(`/transfer-believers/${id}`),
  graduateBeliever: (id) => api.post(`/transfer-believers/graduate/${id}`),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/transfer-believers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  export: () => api.get('/transfer-believers/export', { responseType: 'blob' }),
};

// All Believer API
export const allBelieverAPI = {
  getAll: (params) => api.get('/all-believers/all', { params }),
};

// Graduate API
export const graduateAPI = {
  getAll: (params) => api.get('/graduates/all', { params }),
  create: (data) => api.post('/graduates', data),
  update: (id, data) => api.put(`/graduates/${id}`, data),
  delete: (id) => api.delete(`/graduates/${id}`),
  updatePrintCount: (id) => api.put(`/graduates/${id}/print`),
};

// System Constants API
export const systemConstantsAPI = {
  getAll: () => api.get('/api/system-constants'),
  getByKey: (key) => api.get(`/api/system-constants/${key}`),
  create: (data) => api.post('/api/system-constants', data),
  update: (id, data) => api.put(`/api/system-constants/${id}`, data),
  delete: (id) => api.delete(`/api/system-constants/${id}`),
};

// Common Files API
export const commonFilesAPI = {
  getAll: (params) => apiWithPrefix.get('/common-files', { params }),
  upload: (formData) => apiWithPrefix.post('/common-files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  download: (id) => apiWithPrefix.get(`/common-files/${id}/download`, {
    responseType: 'blob'
  }),
  getById: (id) => apiWithPrefix.get(`/common-files/${id}`),
  delete: (id) => apiWithPrefix.delete(`/common-files/${id}`),
};

// Files API
export const filesAPI = {
  upload: (formData) => apiWithPrefix.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  download: (id) => apiWithPrefix.get(`/files/download/${id}`, {
    responseType: 'blob'
  }),
  getById: (id) => apiWithPrefix.get(`/files/${id}`),
  delete: (id) => apiWithPrefix.delete(`/files/${id}`),
};

// 파일 URL 생성 함수
export const getFileUrl = async (savedPath) => {
  try {
    // 시스템상수값 가져오기
    const fileRootPathResponse = await systemConstantsAPI.getByKey('file_root_path');
    const fileUploadPathResponse = await systemConstantsAPI.getByKey('file_upload_path');
    
    const fileRootPath = fileRootPathResponse.data.constant_value;
    const fileUploadPath = fileUploadPathResponse.data.constant_value;
    
    // 상대경로에서 절대경로로 변환
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    const uploadUrl = fileUploadPath.startsWith('/') ? fileUploadPath : `/${fileUploadPath}`;
    
    return `${baseUrl}${uploadUrl}/${savedPath}`;
  } catch (error) {
    console.error('파일 URL 생성 실패:', error);
    // 기본값으로 fallback
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    return `${baseUrl}/uploads/${savedPath}`;
  }
};

export default api; 