const isDevelopment = process.env.NODE_ENV === 'development';
const apiUrl = process.env.REACT_APP_API_URL;

if (!apiUrl) {
    console.error('REACT_APP_API_URL is not set!');
}

console.log('Environment:', process.env.NODE_ENV);
console.log('API URL from env:', apiUrl);

const config = {
    apiBaseUrl: apiUrl || (isDevelopment ? 'http://localhost:5000/api' : '/api')
};

console.log('Final API Base URL:', config.apiBaseUrl);

export default config;
