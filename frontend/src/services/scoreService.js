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

// 獲取成績列表
export const getScores = async (tournamentId) => {
  try {
    const response = await axios.get(`/scores?tournament_id=${tournamentId}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 上傳成績
export const uploadScores = async (tournamentId, formData) => {
  try {
    const response = await axios.post('/scores/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 清除所有成績
export const clearScores = async () => {
  try {
    const response = await axios.post('/scores/clear');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 計算年度統計
export const calculateAnnualStats = async (tournamentIds) => {
  try {
    const response = await axios.post('/scores/annual-stats', { tournament_ids: tournamentIds });
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 匯出成績
export const exportScores = async (tournamentId) => {
  try {
    const response = await axios.get(`/scores/export/${tournamentId}`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}; 