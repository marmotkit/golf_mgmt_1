// Force cache update with version
const VERSION = '1.0.0';

// API URL
const apiBaseUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5000'  // 開發環境
  : 'https://golf-mgmt-1.onrender.com';  // 生產環境

// 確保 URL 結尾沒有斜線
const normalizeUrl = (url) => url.replace(/\/+$/, '');

// 日誌輸出當前配置
console.log('Golf Management App Configuration:');
console.log(`Version: ${VERSION}`);
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`API URL: ${apiBaseUrl}`);

const config = {
    apiBaseUrl: normalizeUrl(apiBaseUrl),
    VERSION,
    isDevelopment: process.env.NODE_ENV === 'development'
};

export default config;
