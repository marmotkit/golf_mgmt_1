import axios from '../utils/axios';

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

// 獲取賽事列表
export const getTournaments = async () => {
  try {
    const response = await axios.get('/reports/tournaments');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取統計數據
export const getStats = async (tournamentIds) => {
  try {
    const response = await axios.post('/reports/stats', { tournament_ids: tournamentIds });
    return response.data;
  } catch (error) {
    handleError(error);
  }
}; 