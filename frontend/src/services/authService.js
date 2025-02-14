import axios from '../utils/axios';

// 登入
export const login = async (credentials) => {
  try {
    const response = await axios.post('/auth/login', credentials);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || '登入失敗');
    }
    throw new Error('無法連接到服務器');
  }
};

// 獲取當前用戶信息
export const getCurrentUser = async () => {
  try {
    const response = await axios.get('/auth/me');
    return response.data;
  } catch (error) {
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