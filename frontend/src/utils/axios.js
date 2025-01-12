import axios from 'axios';
import config from '../config';

const instance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 添加請求攔截器
instance.interceptors.request.use(
  (config) => {
    console.log('Making request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 添加響應攔截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
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
