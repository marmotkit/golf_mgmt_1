import axios from '../utils/axios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 错误处理函数
const handleError = (error) => {
  if (error.response) {
    // 服务器返回错误响应
    const errorMessage = error.response.data.error || error.response.data.message || '操作失败';
    const errorDetails = error.response.data.details || error.response.data.traceback || '';
    throw new Error(`${errorMessage}\n${errorDetails}`);
  } else if (error.request) {
    // 请求已发送但没有收到响应
    throw new Error('无法连接到服务器，请检查网络连接');
  } else {
    // 请求配置错误
    throw new Error('请求配置错误');
  }
};

// 获取所有赛事
export const getAllTournaments = async () => {
  try {
    const response = await axios.get('/api/tournaments');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 获取单个赛事
export const getTournament = async (id) => {
  try {
    const response = await axios.get(`/api/tournaments/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 创建赛事
export const createTournament = async (tournamentData) => {
  try {
    const response = await axios.post('/api/tournaments', tournamentData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新赛事
export const updateTournament = async (id, tournamentData) => {
  try {
    const response = await axios.put(`/api/tournaments/${id}`, tournamentData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 删除赛事
export const deleteTournament = async (id) => {
  try {
    await axios.delete(`/api/tournaments/${id}`);
  } catch (error) {
    handleError(error);
  }
};