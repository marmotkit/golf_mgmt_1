// Force cache update with version
const VERSION = '1.0.0';

// Production API URL
const apiBaseUrl = 'https://golf-mgmt-1.onrender.com/api';

// 確保 URL 結尾沒有斜線
const normalizeUrl = (url) => url.replace(/\/+$/, '');

console.log(`Golf Management App ${VERSION} - Using API:`, apiBaseUrl);

const config = {
    apiBaseUrl: normalizeUrl(apiBaseUrl),
    VERSION
};

export default config;
