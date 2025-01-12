// API URL configuration
const isDevelopment = process.env.NODE_ENV === 'development';

const apiBaseUrl = isDevelopment
    ? 'http://localhost:5000/api'
    : 'https://golf-mgmt-1.onrender.com/api';

// Debug information
console.log('Environment Config:', {
    NODE_ENV: process.env.NODE_ENV,
    isDevelopment,
    apiBaseUrl
});

const config = {
    apiBaseUrl
};

export default config;
