import axios from '../utils/axios';
import config from '../config';

const API_BASE_URL = config.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('Request:', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 添加响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('Response:', response);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response);
    return Promise.reject(error);
  }
);

// 會員管理 API
export const membersApi = {
  getAll: () => api.get('/members'),
  getById: (id) => api.get(`/members/${id}`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

// 賽事管理 API
export const tournamentsApi = {
  getAll: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
};

// 成績管理 API
export const scoresApi = {
  getAll: () => api.get('/scores'),
  getById: (id) => api.get(`/scores/${id}`),
  create: (data) => api.post('/scores', data),
  update: (id, data) => api.put(`/scores/${id}`, data),
  delete: (id) => api.delete(`/scores/${id}`),
};

// 報表分析 API
export const reportsApi = {
  getTournamentStats: () => api.get('/reports/tournaments'),
  getPlayerStats: () => api.get('/reports/players'),
  getScoreStats: () => api.get('/reports/scores'),
};

// 遊戲管理 API
export const gamesApi = {
  getAll: () => api.get('/games'),
  getById: (id) => api.get(`/games/${id}`),
  create: (data) => api.post('/games', data),
  update: (id, data) => api.put(`/games/${id}`, data),
  delete: (id) => api.delete(`/games/${id}`),
  getPrizes: (gameId) => api.get(`/games/${gameId}/prizes`),
  updatePrize: (gameId, position, data) => api.put(`/games/${gameId}/prizes/${position}`, data),
};

// 版本管理 API
export const versionApi = {
  getVersion: () => api.get('/version'),
  getDescription: () => api.get('/version/description'),
};

export default api;
