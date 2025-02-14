import axios from '../utils/axios';

// 登入
export const login = async (credentials) => {
  try {
    console.log('Attempting login with credentials:', credentials);
    const response = await axios.post('/auth/login', credentials);
    console.log('Login response:', response.data);
    
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      const errorMessage = error.response.data.error || error.response.data.message || '登入失敗';
      throw new Error(errorMessage);
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