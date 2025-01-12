import axios from 'axios';

// 根據當前主機名判斷環境
const isProduction = window.location.hostname !== 'localhost';
const baseURL = isProduction
  ? 'https://golf-mgmt-api.onrender.com/api'
  : 'http://localhost:5000/api';

console.log('Is Production:', isProduction);
console.log('Base URL:', baseURL);

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 添加請求攔截器
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 添加響應攔截器
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    if (error.response) {
      console.error('Error Data:', error.response.data);
      console.error('Error Status:', error.response.status);
    }
    return Promise.reject(error);
  }
);

export default api;
