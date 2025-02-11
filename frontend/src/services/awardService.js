import axios from '../utils/axios';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 錯誤處理函數
const handleError = (error) => {
  if (error.response) {
    const errorMessage = error.response.data.error || error.response.data.message || '操作失敗';
    const errorDetails = error.response.data.details || error.response.data.traceback || '';
    throw new Error(`${errorMessage}\n${errorDetails}`);
  } else if (error.request) {
    throw new Error('無法連接到服務器，請檢查網絡連接');
  } else {
    throw new Error('請求配置錯誤');
  }
};

// 獲取賽事獎項列表
export const getAwards = async (tournamentId) => {
  try {
    const response = await api.get(`/awards?tournament_id=${tournamentId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建獎項
export const createAward = async (awardData) => {
  try {
    const response = await api.post('/awards', awardData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 批量創建獎項
export const batchCreateAwards = async (awardsData) => {
  try {
    const response = await api.post('/awards/batch', awardsData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新獎項
export const updateAward = async (id, awardData) => {
  try {
    const response = await api.put(`/awards/${id}`, awardData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 刪除獎項
export const deleteAward = async (id) => {
  try {
    await api.delete(`/awards/${id}`);
  } catch (error) {
    handleError(error);
  }
};

// 清除賽事所有獎項
export const clearTournamentAwards = async (tournamentId) => {
  try {
    const response = await api.post(`/awards/clear/${tournamentId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}; 