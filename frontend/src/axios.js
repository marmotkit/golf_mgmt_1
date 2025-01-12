import axios from 'axios';
import config from './config';

const instance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        // 在發送請求之前做些什麼
        return config;
    },
    (error) => {
        // 對請求錯誤做些什麼
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => {
        // 對響應數據做點什麼
        return response;
    },
    (error) => {
        // 對響應錯誤做點什麼
        if (!error.response) {
            console.error('Network error:', error);
        } else {
            console.error('Response error:', error.response);
        }
        return Promise.reject(error);
    }
);

export default instance;
