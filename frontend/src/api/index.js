import axios from '../utils/axios';

// 賽事管理 API
export const tournamentsApi = {
  getAll: () => axios.get('/tournaments'),
  getById: (id) => axios.get(`/tournaments/${id}`),
  create: (data) => axios.post('/tournaments', data),
  update: (id, data) => axios.put(`/tournaments/${id}`, data),
  delete: (id) => axios.delete(`/tournaments/${id}`),
};

// 成績管理 API
export const scoresApi = {
  getAll: () => axios.get('/scores'),
  getById: (id) => axios.get(`/scores/${id}`),
  create: (data) => axios.post('/scores', data),
  update: (id, data) => axios.put(`/scores/${id}`, data),
  delete: (id) => axios.delete(`/scores/${id}`),
};

// 報表分析 API
export const reportsApi = {
  getTournamentStats: () => axios.get('/reports/tournaments'),
  getPlayerStats: () => axios.get('/reports/players'),
  getScoreStats: () => axios.get('/reports/scores'),
};

export default axios;
