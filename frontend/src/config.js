const isDevelopment = process.env.NODE_ENV === 'development';
const productionUrl = window.location.origin;

const config = {
    apiBaseUrl: isDevelopment ? 'http://localhost:5000/api' : `${productionUrl}/api`
};

console.log('Current environment:', process.env.NODE_ENV);
console.log('API Base URL:', config.apiBaseUrl);

export default config;
