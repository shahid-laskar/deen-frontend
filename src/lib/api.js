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
  // ── Text & Meta ──────────────────────────────────────────────
  surahs:        ()          => api.get('/quran/surahs').then(r => r.data),
  surah:         (n, opts)   => api.get(`/quran/surah/${n}`, { params: opts }).then(r => r.data),
  ayah:          (s, a, opts)=> api.get(`/quran/ayah/${s}/${a}`, { params: opts }).then(r => r.data),
  tafsir:        (s, a, opts)=> api.get(`/quran/tafsir/${s}/${a}`, { params: opts }).then(r => r.data),
  search:        (q, opts)   => api.get('/quran/search', { params: { q, ...opts } }).then(r => r.data),
  verseOfDay:    ()          => api.get('/quran/verse-of-day').then(r => r.data),
  wordByWord:    (s, a)      => api.get(`/quran/word-by-word/${s}/${a}`).then(r => r.data),

  // ── Browsing modes ───────────────────────────────────────────
  juz:           (n)         => api.get(`/quran/juz/${n}`).then(r => r.data),
  page:          (n)         => api.get(`/quran/page/${n}`).then(r => r.data),

  // ── Reciter / Translation lists ──────────────────────────────
  recitations:   ()          => api.get('/quran/recitations').then(r => r.data),
  translations:  ()          => api.get('/quran/translations').then(r => r.data),

  // ── Server-side last-read ────────────────────────────────────
  lastRead:      ()          => api.get('/quran/last-read').then(r => r.data),
  saveLastRead:  (params)    => api.post('/quran/last-read', null, { params }).then(r => r.data),

  // ── Reading log & stats ──────────────────────────────────────
  logReading:    (data)      => api.post('/quran/reading-log', data).then(r => r.data),
  readingLogs:   (days)      => api.get('/quran/reading-log', { params: { days } }).then(r => r.data),
  stats:         ()          => api.get('/quran/stats').then(r => r.data),

  // ── Bookmarks ────────────────────────────────────────────────
  bookmarks:           (params) => api.get('/quran/bookmarks', { params }).then(r => r.data),
  addBookmark:         (data)   => api.post('/quran/bookmarks', data).then(r => r.data),
  deleteBookmark:      (id)     => api.delete(`/quran/bookmarks/${id}`).then(r => r.data),
  bookmarkFolders:     ()       => api.get('/quran/bookmarks/folders').then(r => r.data),
  createFolder:      (params)   => api.post('/quran/bookmarks/folders', null, { params }).then(r => r.data),
  deleteFolder:        (id)     => api.delete(`/quran/bookmarks/folders/${id}`).then(r => r.data),

  // ── Hifz ────────────────────────────────────────────────────
  hifz:          ()          => api.get('/quran/hifz').then(r => r.data),
  hifzDue:       ()          => api.get('/quran/hifz/due').then(r => r.data),
  hifzStats:     ()          => api.get('/quran/hifz/stats').then(r => r.data),
  addHifz:       (data)      => api.post('/quran/hifz', data).then(r => r.data),
  reviewHifz:    (id, q)     => api.post(`/quran/hifz/${id}/review`, { quality: q }).then(r => r.data),
  updateHifz:    (id, data)  => api.patch(`/quran/hifz/${id}`, data).then(r => r.data),
  deleteHifz:    (id)        => api.delete(`/quran/hifz/${id}`).then(r => r.data),

  // ── Khatam plans ────────────────────────────────────────────
  khatamPlans:   ()          => api.get('/quran/khatam-plans').then(r => r.data),
  createKhatam:  (params)    => api.post('/quran/khatam-plans', null, { params }).then(r => r.data),
  deleteKhatam:  (id)        => api.delete(`/quran/khatam-plans/${id}`).then(r => r.data),

  // ── Duas ─────────────────────────────────────────────────────
  duas:          (cat)       => api.get('/quran/duas', { params: { category: cat } }).then(r => r.data),
  duaOfDay:      ()          => api.get('/quran/duas/of-the-day').then(r => r.data),
  duaCategories: ()          => api.get('/quran/duas/categories').then(r => r.data),
  dua:           (key)       => api.get(`/quran/duas/${key}`).then(r => r.data),
  personalDuas:  ()          => api.get('/quran/duas/personal').then(r => r.data),
  addPersonalDua:(data)      => api.post('/quran/duas/personal', data).then(r => r.data),
  updatePersonalDua:(id,data)=> api.patch(`/quran/duas/personal/${id}`, data).then(r => r.data),
  deletePersonalDua:(id)     => api.delete(`/quran/duas/personal/${id}`).then(r => r.data),
  favDuas:       ()          => api.get('/quran/duas/favorites').then(r => r.data),
  addFavDua:     (data)      => api.post('/quran/duas/favorites', data).then(r => r.data),
  removeFavDua:  (id)        => api.delete(`/quran/duas/favorites/${id}`).then(r => r.data),
  seedDuas:      ()          => api.post('/quran/duas/seed').then(r => r.data),

  // ── Hadith ───────────────────────────────────────────────────
  hadithOfDay:   ()          => api.get('/quran/hadith/of-the-day').then(r => r.data),
  hadith:        (params)    => api.get('/quran/hadith', { params }).then(r => r.data),
  searchHadith:  (q, col)    => api.get('/quran/hadith/search', { params: { q, collection: col } }).then(r => r.data),
  getHadith:     (id)        => api.get(`/quran/hadith/${id}`).then(r => r.data),
  seedHadiths:   ()          => api.post('/quran/hadith/seed').then(r => r.data),
}

export const habitsApi = {
  // ── Habits CRUD ──────────────────────────────────────────
  list:          (params)     => api.get('/habits', { params }).then(r => r.data),
  get:           (id)         => api.get(`/habits/${id}`).then(r => r.data),
  create:        (data)       => api.post('/habits', data).then(r => r.data),
  update:        (id, data)   => api.patch(`/habits/${id}`, data).then(r => r.data),
  remove:        (id)         => api.delete(`/habits/${id}`).then(r => r.data),
  reorder:       (id, order)  => api.post(`/habits/${id}/reorder?order=${order}`).then(r => r.data),
  useToken:      (id)         => api.post(`/habits/${id}/use-token`).then(r => r.data),

  // ── Logs ─────────────────────────────────────────────────
  log:           (data)       => api.post('/habits/log', data).then(r => r.data),
  logs:          (id, days)   => api.get(`/habits/${id}/logs`, { params: { days } }).then(r => r.data),

  // ── Library ───────────────────────────────────────────────
  library:       (params)     => api.get('/habits/library', { params }).then(r => r.data),
  addFromLibrary:(key)        => api.post(`/habits/from-library?key=${key}`).then(r => r.data),

  // ── Analytics ─────────────────────────────────────────────
  habitAnalytics:(id)         => api.get(`/habits/${id}/analytics`).then(r => r.data),
  weeklyReview:  ()           => api.get('/habits/analytics/weekly').then(r => r.data),
  healthScore:   ()           => api.get('/habits/analytics/health').then(r => r.data),

  // ── Checklist ─────────────────────────────────────────────
  checklist:         (id)              => api.get(`/habits/${id}/checklist`).then(r => r.data),
  addChecklistItem:  (id, data)        => api.post(`/habits/${id}/checklist`, data).then(r => r.data),
  removeChecklistItem:(id, itemId)     => api.delete(`/habits/${id}/checklist/${itemId}`).then(r => r.data),
  toggleChecklistItem:(id, itemId)     => api.post(`/habits/${id}/checklist/${itemId}/log`).then(r => r.data),
}

export const dhikrApi = {
  presets:       ()                    => api.get('/dhikr/presets').then(r => r.data),
  sessions:      (days)                => api.get('/dhikr/sessions', { params: { days } }).then(r => r.data),
  createSession: (data)                => api.post('/dhikr/sessions', data).then(r => r.data),
  increment:     (id, n = 1)           => api.post(`/dhikr/sessions/${id}/increment`, { increment: n }).then(r => r.data),
  complete:      (id)                  => api.post(`/dhikr/sessions/${id}/complete`).then(r => r.data),
  history:       (days)                => api.get('/dhikr/history', { params: { days } }).then(r => r.data),
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
