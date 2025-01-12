const config = {
    apiBaseUrl: process.env.NODE_ENV === 'production'
        ? window.location.origin + '/api'  // 使用當前域名
        : process.env.REACT_APP_API_URL || 'http://localhost:5000/api'  // 開發環境使用完整 URL
};

export default config;
