import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Character API
export const characterAPI = {
  getByUser: (userId: number) => api.get(`/characters/user/${userId}`),
  getById: (id: number) => api.get(`/characters/${id}`),
  create: (data: { user_id: number; name: string }) => api.post('/characters', data),
  update: (id: number, data: any) => api.put(`/characters/${id}`, data),
  addXP: (id: number, xp: number) => api.post(`/characters/${id}/xp`, { xp }),
  addAttribute: (id: number, attribute: string, amount: number) => 
    api.post(`/characters/${id}/attribute`, { attribute, amount }),
  getEquipment: (id: number) => api.get(`/characters/${id}/equipment`),
  toggleEquipment: (characterId: number, equipmentId: number) => 
    api.post(`/characters/${characterId}/equipment/${equipmentId}/toggle`),
  delete: (id: number) => api.delete(`/characters/${id}`),
};

// Quest API
export const questAPI = {
  getAll: () => api.get('/quests'),
  getByCharacter: (characterId: number) => api.get(`/quests/character/${characterId}`),
  start: (questId: number, characterId: number) => 
    api.post(`/quests/${questId}/start`, { characterId }),
  complete: (questId: number, characterId: number) => 
    api.post(`/quests/${questId}/complete`, { characterId }),
};

// Achievement API
export const achievementAPI = {
  getAll: () => api.get('/achievements'),
  getByCharacter: (characterId: number) => api.get(`/achievements/character/${characterId}`),
  check: (characterId: number) => api.post(`/achievements/character/${characterId}/check`),
};

// Leaderboard API
export const leaderboardAPI = {
  byLevel: (limit: number = 10) => api.get(`/leaderboard/level?limit=${limit}`),
  byStats: (limit: number = 10) => api.get(`/leaderboard/stats?limit=${limit}`),
  byAchievements: (limit: number = 10) => api.get(`/leaderboard/achievements?limit=${limit}`),
  byQuests: (limit: number = 10) => api.get(`/leaderboard/quests?limit=${limit}`),
};

// Auth API
export const authAPI = {
  register: (data: { username: string; password: string }) => 
    api.post('/auth/register', data),
  login: (data: { username: string; password: string }) => 
    api.post('/auth/login', data),
  getUser: (userId: number) => api.get(`/auth/me/${userId}`),
};
