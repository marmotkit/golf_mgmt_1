import axios from 'axios';
import config from '../config';

console.log('Creating axios instance with baseURL:', `${config.apiBaseUrl}/api`);

const instance = axios.create({
  baseURL: `${config.apiBaseUrl}/api`,
  timeout: 30000,  // 增加超時時間到 30 秒
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
    console.log('Making request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
instance.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
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
        config: error.config
      });
    } else if (error.request) {
      // 請求已發出，但沒有收到響應
      console.error('No response received:', {
        request: error.request,
        config: error.config
      });
    } else {
      // 請求設置時發生錯誤
      console.error('Request setup error:', {
        message: error.message,
        config: error.config
      });
    }
    return Promise.reject(error);
  }
);

export default instance;
