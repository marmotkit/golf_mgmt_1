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

// 獲取儀表板統計數據
export const getStats = async () => {
  try {
    const response = await axios.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取公告列表
export const getAnnouncements = async () => {
  try {
    const response = await axios.get('/dashboard/announcements');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建公告
export const createAnnouncement = async (announcementData) => {
  try {
    const response = await axios.post('/dashboard/announcements', announcementData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新公告
export const updateAnnouncement = async (id, announcementData) => {
  try {
    const response = await axios.put(`/dashboard/announcements/${id}`, announcementData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 刪除公告
export const deleteAnnouncement = async (id) => {
  try {
    await axios.delete(`/dashboard/announcements/${id}`);
  } catch (error) {
    handleError(error);
  }
};

// 獲取版本號
export const getVersion = async () => {
  try {
    const response = await axios.get('/dashboard/version');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新版本號
export const updateVersion = async (versionData) => {
  try {
    const response = await axios.post('/dashboard/version', versionData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取版本說明
export const getVersionDescription = async () => {
  try {
    const response = await axios.get('/dashboard/version/description');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新版本說明
export const updateVersionDescription = async (descriptionData) => {
  try {
    const response = await axios.post('/dashboard/version/description', descriptionData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 獲取冠軍榜
export const getChampions = async () => {
  try {
    const response = await axios.get('/dashboard/champions');
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 創建冠軍記錄
export const createChampion = async (championData) => {
  try {
    const response = await axios.post('/dashboard/champions', championData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 更新冠軍記錄
export const updateChampion = async (id, championData) => {
  try {
    const response = await axios.put(`/dashboard/champions/${id}`, championData);
    return response.data;
  } catch (error) {
    handleError(error);
  }
};

// 刪除冠軍記錄
export const deleteChampion = async (id) => {
  try {
    await axios.delete(`/dashboard/champions/${id}`);
  } catch (error) {
    handleError(error);
  }
}; 