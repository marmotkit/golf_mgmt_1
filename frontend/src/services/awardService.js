import axios from '../utils/axios';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

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

// 獲取賽事獎項
export const getTournamentAwards = async (tournamentId) => {
  try {
    console.log('Requesting tournament awards for ID:', tournamentId);
    const response = await axios.get(`${API_BASE_URL}/awards/?tournament_id=${tournamentId}`);
    console.log('Tournament awards response:', response);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建賽事獎項
export const createTournamentAward = async (awardData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/awards`, awardData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新賽事獎項
export const updateTournamentAward = async (id, awardData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/awards/${id}`, awardData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 刪除賽事獎項
export const deleteTournamentAward = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/awards/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取獎項類型
export const getAwardTypes = async () => {
  try {
    console.log('Requesting award types');
    const response = await axios.get(`${API_BASE_URL}/awards/types`);
    console.log('Award types response:', response);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建獎項類型
export const createAwardType = async (typeData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/awards/types`, typeData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新獎項類型
export const updateAwardType = async (id, typeData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/awards/types/${id}`, typeData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
}; 