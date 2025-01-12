// API URL configuration
const config = {
    apiBaseUrl: process.env.NODE_ENV === 'production'
        ? 'https://golf-mgmt-1.onrender.com/api'
        : 'http://localhost:5000/api'
};

// Debug information
console.log('Environment Config:', {
    NODE_ENV: process.env.NODE_ENV,
    apiBaseUrl: config.apiBaseUrl
});

export default config;
