import axios from 'axios';
import config from '../config';

const instance = axios.create({
  baseURL: `${config.apiBaseUrl}/api`,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request:', config.method?.toUpperCase(), config.url);
    console.log('Request headers:', config.headers);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 如果是認證錯誤，清除本地存儲並重定向到登入頁
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response) {
      // 服務器回應了錯誤狀態碼
      console.error('Response error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // 請求已發出，但沒有收到響應
      console.error('No response received:', error.request);
    } else {
      // 請求設置時發生錯誤
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
