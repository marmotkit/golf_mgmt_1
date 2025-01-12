import axios from 'axios';
import config from './config';

const instance = axios.create({
    baseURL: config.apiBaseUrl,
    timeout: 5000,
});

// Request interceptor
instance.interceptors.request.use(
    (config) => {
        console.log('Making request:', config.method.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (!error.response) {
            console.error('No response received:', error.request);
        } else {
            console.error('Response error:', error.response);
        }
        return Promise.reject(error);
    }
);

export default instance;
