import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
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
    return response;
  },
  (error) => {
    console.log('Response Error:', error);
    if (error.response) {
      console.log('Error Data:', error.response.data);
      console.log('Error Status:', error.response.status);
      console.log('Error Headers:', error.response.headers);
    }
    return Promise.reject(error);
  }
);

export default api; 