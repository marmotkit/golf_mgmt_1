// 檢測是否在 Render.com 環境
const isRenderEnv = Boolean(process.env.RENDER);
const isDevelopment = process.env.NODE_ENV === 'development';

// 獲取當前完整的主機名
const currentHost = window.location.origin;
console.log('Current host:', currentHost);

// 如果在 Render.com 上，使用相對路徑，否則使用環境變量或默認值
const apiBaseUrl = isDevelopment
    ? 'http://localhost:5000/api'
    : isRenderEnv
        ? '/api'  // 在 Render.com 上使用相對路徑
        : process.env.REACT_APP_API_URL || '/api';

console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    RENDER: process.env.RENDER,
    isDevelopment,
    isRenderEnv,
    apiBaseUrl
});

const config = {
    apiBaseUrl
};

export default config;
