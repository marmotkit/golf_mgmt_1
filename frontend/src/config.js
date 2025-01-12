const config = {
    apiBaseUrl: process.env.NODE_ENV === 'production' 
        ? '' // 空字串表示使用相同域名
        : 'http://localhost:5000'
};

export default config;
