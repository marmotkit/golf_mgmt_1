import axios from '../utils/axios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 錯誤處理函數
const handleError = (error) => {
  if (error.response) {
    // 服務器返回錯誤響應
    const errorMessage = error.response.data.error || error.response.data.message || '操作失敗';
    const errorDetails = error.response.data.details || error.response.data.traceback || '';
    throw new Error(`${errorMessage}\n${errorDetails}`);
  } else if (error.request) {
    // 請求已發送但沒有收到響應
    throw new Error('無法連接到服務器，請檢查網絡連接');
  } else {
    // 請求配置錯誤
    throw new Error('請求配置錯誤');
  }
};

// 獲取所有賽事
export const getAllTournaments = async () => {
  try {
    const response = await axios.get('/tournaments');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取單個賽事
export const getTournament = async (id) => {
  try {
    const response = await axios.get(`/tournaments/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建賽事
export const createTournament = async (tournamentData) => {
  try {
    const response = await axios.post('/tournaments', tournamentData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新賽事
export const updateTournament = async (id, tournamentData) => {
  try {
    const response = await axios.put(`/tournaments/${id}`, tournamentData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 刪除賽事
export const deleteTournament = async (id) => {
  try {
    await axios.delete(`/tournaments/${id}`);
  } catch (error) {
    handleError(error);
  }
};