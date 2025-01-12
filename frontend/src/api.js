import axios from 'axios';

// 根據環境決定基礎 URL
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      console.error('Response Error:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error('Request Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 