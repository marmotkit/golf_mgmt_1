import axios from '../utils/axios';

// 登入
export const login = async (credentials) => {
  try {
    console.log('開始登入嘗試，時間:', new Date().toISOString());
    console.log('登入憑證:', {
      account: credentials.account,
      passwordLength: credentials.password ? credentials.password.length : 0
    });

    const response = await axios.post('/auth/login', credentials);
    console.log('登入響應狀態:', response.status);
    console.log('登入響應頭:', response.headers);
    console.log('登入響應數據:', {
      success: !!response.data.access_token,
      userReceived: !!response.data.user
    });
    
    if (response.data.access_token) {
      console.log('收到訪問令牌，長度:', response.data.access_token.length);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } else {
      console.error('登入響應中沒有訪問令牌');
      throw new Error('登入響應格式無效');
    }
  } catch (error) {
    console.error('登入錯誤詳情:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });

    if (error.response) {
      const errorMessage = error.response.data.error || error.response.data.message || '登入失敗';
      throw new Error(`登入失敗: ${errorMessage}`);
    }
    throw new Error('無法連接到服務器，請檢查網路連接');
  }
};

// 獲取當前用戶信息
export const getCurrentUser = async () => {
  try {
    console.log('Fetching current user info');
    const response = await axios.get('/auth/me');
    console.log('Current user response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get current user error:', error);
    if (error.response) {
      throw new Error(error.response.data.error || '獲取用戶信息失敗');
    }
    throw new Error('無法連接到服務器');
  }
};

// 檢查是否已登入
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// 登出
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}; 