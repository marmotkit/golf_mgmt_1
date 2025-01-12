// API URL configuration
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug information
console.log('Environment Config:', {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
    apiBaseUrl: apiBaseUrl
});

const config = {
    apiBaseUrl
};

export default config;
