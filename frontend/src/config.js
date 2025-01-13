// Force cache update with version
const VERSION = '1.0.0';

// Production API URL (hardcoded)
const apiBaseUrl = 'https://golf-mgmt-1.onrender.com';

console.log(`Golf Management App ${VERSION} - Using API:`, apiBaseUrl);

const config = {
    apiBaseUrl,
    VERSION
};

export default config;
