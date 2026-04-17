import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor: attach access token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refresh_token')
      if (!refreshToken) {
        isRefreshing = false
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        })
        const newToken = data.access_token
        localStorage.setItem('access_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── API endpoint helpers ─────────────────────────────────────────────────────

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  refresh: (token) => api.post('/auth/refresh', { refresh_token: token }),
  logout: (token) => api.post('/auth/logout', { refresh_token: token }),
  me: () => api.get('/auth/me'),
}

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  updateProfile: (data) => api.patch('/users/me/profile', data),
  changePassword: (data) => api.post('/users/me/change-password', data),
  deleteAccount: () => api.delete('/users/me'),
}

export const prayerApi = {
  getTimes: (params) => api.get('/prayer/times', { params }),
  log: (data) => api.post('/prayer/log', data),
  getLogs: (params) => api.get('/prayer/log', { params }),
  getTodaySummary: () => api.get('/prayer/summary/today'),
  getStreak: () => api.get('/prayer/streak'),
  updateLog: (id, data) => api.patch(`/prayer/log/${id}`, data),
  deleteLog: (id) => api.delete(`/prayer/log/${id}`),
}

export const quranApi = {
  getSurahs: () => api.get('/quran/surahs'),
  getSurah: (num, translationId) =>
    api.get(`/quran/surah/${num}`, { params: { translation_id: translationId } }),
  getAyah: (surah, ayah) => api.get(`/quran/ayah/${surah}/${ayah}`),
  search: (q) => api.get('/quran/search', { params: { q } }),
  getHifz: () => api.get('/quran/hifz'),
  getHifzDueToday: () => api.get('/quran/hifz/due-today'),
  addHifz: (data) => api.post('/quran/hifz', data),
  reviewHifz: (id, quality) => api.post(`/quran/hifz/${id}/review`, { quality }),
  deleteHifz: (id) => api.delete(`/quran/hifz/${id}`),
  getDuas: (category) => api.get('/quran/duas', { params: { category } }),
  getDua: (key) => api.get(`/quran/duas/${key}`),
  getFavDuas: () => api.get('/quran/duas/favorites'),
  addFavDua: (data) => api.post('/quran/duas/favorites', data),
  removeFavDua: (id) => api.delete(`/quran/duas/favorites/${id}`),
}

export const habitsApi = {
  list: () => api.get('/habits'),
  create: (data) => api.post('/habits', data),
  get: (id) => api.get(`/habits/${id}`),
  update: (id, data) => api.patch(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
  log: (data) => api.post('/habits/log', data),
  getLogs: (id, days) => api.get(`/habits/${id}/logs`, { params: { days } }),
}

export const journalApi = {
  list: (params) => api.get('/journal', { params }),
  create: (data) => api.post('/journal', data),
  get: (id) => api.get(`/journal/${id}`),
  update: (id, data) => api.patch(`/journal/${id}`, data),
  delete: (id) => api.delete(`/journal/${id}`),
}

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  today: () => api.get('/tasks/today'),
  create: (data) => api.post('/tasks', data),
  get: (id) => api.get(`/tasks/${id}`),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  complete: (id) => api.post(`/tasks/${id}/complete`),
  delete: (id) => api.delete(`/tasks/${id}`),
}

export const femaleApi = {
  getCycles: () => api.get('/female/cycles'),
  startCycle: (data) => api.post('/female/cycles', data),
  getCurrentCycle: () => api.get('/female/cycles/current'),
  getCycle: (id) => api.get(`/female/cycles/${id}`),
  updateCycle: (id, data) => api.patch(`/female/cycles/${id}`, data),
  deleteCycle: (id) => api.delete(`/female/cycles/${id}`),
  getFasting: (params) => api.get('/female/fasting', { params }),
  logFast: (data) => api.post('/female/fasting', data),
  updateFast: (id, data) => api.patch(`/female/fasting/${id}`, data),
  getMissedSummary: (year) => api.get('/female/fasting/missed-summary', { params: { year } }),
}

export const aiApi = {
  chat: (data) => api.post('/ai/chat', data),
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id) => api.get(`/ai/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`),
  getUsage: () => api.get('/ai/usage'),
}

export const financeApi = {
  calculateZakat: (data) => api.post('/finance/zakat/calculate', data),
  screenStock: (data) => api.post('/finance/screener', data),
  compareMortgage: (data) => api.post('/finance/mortgage/compare', data),
}

export const gamificationApi = {
  getProfile: () => api.get('/gamification/profile'),
  getXpHistory: (params) => api.get('/gamification/xp/history', { params }),
  awardXp: (data) => api.post('/gamification/xp/award', data),
  getBadges: () => api.get('/gamification/badges'),
  getMyBadges: () => api.get('/gamification/badges/mine'),
  getQuests: () => api.get('/gamification/quests'),
  getActiveQuests: () => api.get('/gamification/quests/active'),
  startQuest: (id) => api.post(`/gamification/quests/${id}/start`),
  updateQuest: (id, params) => api.post(`/gamification/quests/${id}/update`, null, { params }),
}

export const communityApi = {
  getGroups: () => api.get('/community/groups'),
  createGroup: (data) => api.post('/community/groups', data),
  joinGroup: (id) => api.post(`/community/groups/${id}/join`),
  getPosts: (groupId) => api.get(`/community/groups/${groupId}/posts`),
  createPost: (groupId, data) => api.post(`/community/groups/${groupId}/posts`, data),
  getScholars: () => api.get('/community/scholars'),
  getWaqfProjects: () => api.get('/community/waqf/projects'),
}

export const learningApi = {
  getPaths: () => api.get('/learning/paths'),
  getPath: (id) => api.get(`/learning/paths/${id}`),
  completeLesson: (id) => api.post(`/learning/lessons/${id}/complete`),
  getVocabDue: () => api.get('/learning/vocab/review'),
  reviewVocab: (id, data) => api.post(`/learning/vocab/${id}/review`, data),
}

export const recitationApi = {
  getSessions: () => api.get('/recitation/sessions'),
  createSession: (data) => api.post('/recitation/sessions', data),
  getSession: (id) => api.get(`/recitation/sessions/${id}`),
  getFeedback: (id) => api.get(`/recitation/sessions/${id}/feedback`),
}

export default api
