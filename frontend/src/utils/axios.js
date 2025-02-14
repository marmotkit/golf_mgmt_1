import axios from 'axios';
import config from '../config';

console.log('Creating axios instance with baseURL:', config.apiBaseUrl);

const instance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,  // 增加超時時間到 30 秒
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// 請求攔截器
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加時間戳防止快取
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    console.log('Making request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      headers: config.headers,
      data: config.data,
      withCredentials: config.withCredentials
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
      statusText: response.statusText,
      headers: response.headers,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 如果是認證錯誤，清除本地存儲並重定向到登入頁
      console.log('Authentication error, redirecting to login...');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    console.error('Response error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials
      }
    });
    
    return Promise.reject(error);
  }
);

export default instance;
