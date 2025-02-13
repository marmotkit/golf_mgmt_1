import axios from '../utils/axios';

// 獲取賽事獎項
export const getTournamentAwards = async (tournamentId) => {
  try {
    console.log('Requesting tournament awards for ID:', tournamentId);
    const response = await axios.get(`/awards/?tournament_id=${tournamentId}`);
    console.log('Tournament awards response:', response);
    return response.data;
  } catch (error) {
    console.error('Error getting tournament awards:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.message || '獲取獎項失敗');
  }
};

// 創建賽事獎項
export const createTournamentAward = async (awardData) => {
  try {
    const response = await axios.post('/awards', awardData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '創建獎項失敗');
  }
};

// 更新賽事獎項
export const updateTournamentAward = async (id, awardData) => {
  try {
    const response = await axios.put(`/awards/${id}`, awardData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '更新獎項失敗');
  }
};

// 刪除賽事獎項
export const deleteTournamentAward = async (id) => {
  try {
    const response = await axios.delete(`/awards/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '刪除獎項失敗');
  }
};

// 獲取獎項類型
export const getAwardTypes = async () => {
  try {
    console.log('Requesting award types');
    const response = await axios.get('/awards/types');
    console.log('Award types response:', response);
    return response.data;
  } catch (error) {
    console.error('Error getting award types:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.message || '獲取獎項類型失敗');
  }
};

// 創建獎項類型
export const createAwardType = async (typeData) => {
  try {
    const response = await axios.post('/awards/types', typeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '創建獎項類型失敗');
  }
};

// 更新獎項類型
export const updateAwardType = async (id, typeData) => {
  try {
    const response = await axios.put(`/awards/types/${id}`, typeData);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '更新獎項類型失敗');
  }
}; 