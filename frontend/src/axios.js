import axios from 'axios';
import config from './config';

console.log('Creating axios instance with baseURL:', config.apiBaseUrl);

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
        console.log('Response received:', response.status, response.config.url);
        return response;
    },
    (error) => {
        if (!error.response) {
            console.error('Network error:', error.message, error.config?.url);
        } else {
            console.error('Response error:', error.response.status, error.response.config.url);
        }
        return Promise.reject(error);
    }
);

export default instance;
