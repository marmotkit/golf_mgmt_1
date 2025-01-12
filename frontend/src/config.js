// API URL configuration
const apiBaseUrl = process.env.NODE_ENV === 'production'
    ? 'https://golf-mgmt-1.onrender.com/api'  // hardcoded production URL
    : 'http://localhost:5000/api';            // development URL

// Debug logging
console.log({
    environment: process.env.NODE_ENV,
    apiBaseUrl: apiBaseUrl,
    envApiUrl: process.env.REACT_APP_API_URL
});

const config = {
    apiBaseUrl
};

export default config;
