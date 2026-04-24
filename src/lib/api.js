import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

export const tokenStore = {
  getAccess: () => (typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null),
  getRefresh: () => (typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null),
  set: (access, refresh) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(ACCESS_KEY, access)
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  },
  clear: () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let queue = []

function processQueue(token) {
  queue.forEach((cb) => cb(token))
  queue = []
}

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    const refresh = tokenStore.getRefresh()
    if (!refresh) {
      tokenStore.clear()
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) return reject(error)
          if (original.headers) {
            original.headers.Authorization = `Bearer ${token}`
          }
          resolve(api(original))
        })
      })
    }

    isRefreshing = true
    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
      const newAccess = data.access_token
      const newRefresh = data.refresh_token || refresh
      tokenStore.set(newAccess, newRefresh)
      processQueue(newAccess)
      if (original.headers) {
        original.headers.Authorization = `Bearer ${newAccess}`
      }
      return api(original)
    } catch (e) {
      processQueue(null)
      tokenStore.clear()
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(e)
    } finally {
      isRefreshing = false
    }
  }
)

export const authApi = {
  register: (payload) => api.post('/auth/register', payload).then(r => r.data),
  login: (payload) => api.post('/auth/login', payload).then(r => r.data),
  refresh: (refresh_token) => api.post('/auth/refresh', { refresh_token }).then(r => r.data),
  logout: () => api.post('/auth/logout').then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}

export const usersApi = {
  me: () => api.get('/users/me').then(r => r.data),
  update: (payload) => api.patch('/users/me', payload).then(r => r.data),
  updateProfile: (payload) => api.patch('/users/me/profile', payload).then(r => r.data),
  changePassword: (payload) => api.post('/users/me/change-password', payload).then(r => r.data),
  completeOnboarding: (payload = {}) => api.post('/users/me/complete-onboarding', payload).then(r => r.data),
  onboardingAnalytics: (payload) => api.post('/users/me/onboarding-analytics', payload).then(r => r.data),
  dataExport: () => api.get('/user/data-export').then(r => r.data),
  deleteAccount: () => api.delete('/user/account').then(r => r.data),
}
export const userApi = usersApi // legacy alias

export const notificationsApi = {
  preferences: () => api.get('/notifications/preferences').then(r => r.data),
  updatePreferences: (payload) => api.patch('/notifications/preferences', payload).then(r => r.data),
  list: () => api.get('/notifications').then(r => r.data),
  markRead: (id) => api.post(`/notifications/${id}/read`).then(r => r.data),
}

export const gdprApi = {
  exportData: () => api.get('/gdpr/export').then(r => r.data),
  deleteAccount: () => api.delete('/gdpr/account').then(r => r.data),
}

export const prayerApi = {
  times: (params) => api.get('/prayer/times', { params }).then(r => r.data),
  log: (payload) => api.post('/prayer/log', payload).then(r => r.data),
  logs: (params) => api.get('/prayer/log', { params }).then(r => r.data),
  summaryToday: () => api.get('/prayer/summary/today').then(r => r.data),
  summaryWeekly: () => api.get('/prayer/summary/weekly').then(r => r.data),
  streak: () => api.get('/prayer/streak').then(r => r.data),
  heatmap: (days = 365) => api.get('/prayer/heatmap', { params: { days } }).then(r => r.data),
  travelMode: () => api.get('/prayer/travel-mode').then(r => r.data),
  setTravelMode: (payload) => api.post('/prayer/travel-mode', payload).then(r => r.data),
  events: () => api.get('/prayer/events').then(r => r.data),
  mosquesNearby: (params) => api.get('/prayer/mosques/nearby', { params }).then(r => r.data),
}

export const quranApi = {
  surahs: () => api.get('/quran/surahs').then(r => r.data),
  surah: (id, params) => api.get(`/quran/surah/${id}`, { params }).then(r => r.data),
  ayah: (surah, ayah, params) => api.get(`/quran/ayah/${surah}/${ayah}`, { params }).then(r => r.data),
  tafsir: (surah, ayah, params) => api.get(`/quran/tafsir/${surah}/${ayah}`, { params }).then(r => r.data),
  search: (q, params) => api.get('/quran/search', { params: { q, ...params } }).then(r => r.data),
  verseOfDay: () => api.get('/quran/verse-of-the-day').then(r => r.data),
  logReading: (payload) => api.post('/quran/reading-log', payload).then(r => r.data),
  readingLogs: (params) => api.get('/quran/reading-log', { params }).then(r => r.data),
  stats: () => api.get('/quran/stats').then(r => r.data),
  bookmarks: () => api.get('/quran/bookmarks').then(r => r.data),
  addBookmark: (payload) => api.post('/quran/bookmarks', payload).then(r => r.data),
  removeBookmark: (id) => api.delete(`/quran/bookmarks/${id}`).then(r => r.data),
  hifz: () => api.get('/quran/hifz').then(r => r.data),
  hifzDue: () => api.get('/quran/hifz/due').then(r => r.data),
  addHifz: (payload) => api.post('/quran/hifz', payload).then(r => r.data),
  reviewHifz: (id, payload) => api.post(`/quran/hifz/${id}/review`, payload).then(r => r.data),
  updateHifz: (id, payload) => api.patch(`/quran/hifz/${id}`, payload).then(r => r.data),
  removeHifz: (id) => api.delete(`/quran/hifz/${id}`).then(r => r.data),
}

export const duasApi = {
  categories: () => api.get('/quran/duas/categories').then(r => r.data),
  list: (params) => api.get('/quran/duas', { params }).then(r => r.data),
  get: (key) => api.get(`/quran/duas/${key}`).then(r => r.data),
  ofDay: () => api.get('/quran/duas/of-the-day').then(r => r.data),
  personal: () => api.get('/quran/duas/personal').then(r => r.data),
  createPersonal: (payload) => api.post('/quran/duas/personal', payload).then(r => r.data),
  updatePersonal: (id, payload) => api.patch(`/quran/duas/personal/${id}`, payload).then(r => r.data),
  deletePersonal: (id) => api.delete(`/quran/duas/personal/${id}`).then(r => r.data),
  favorites: () => api.get('/quran/duas/favorites').then(r => r.data),
  addFavorite: (dua_key) => api.post('/quran/duas/favorites', { dua_key }).then(r => r.data),
  removeFavorite: (fav_id) => api.delete(`/quran/duas/favorites/${fav_id}`).then(r => r.data),
}

export const hadithApi = {
  ofDay: () => api.get('/quran/hadith/of-the-day').then(r => r.data),
  list: (params) => api.get('/quran/hadith', { params }).then(r => r.data),
  search: (q, params) => api.get('/quran/hadith/search', { params: { q, ...params } }).then(r => r.data),
  get: (id) => api.get(`/quran/hadith/${id}`).then(r => r.data),
}

export const habitsApi = {
  list: (params) => api.get('/habits', { params }).then(r => r.data),
  get: (id) => api.get(`/habits/${id}`).then(r => r.data),
  create: (payload) => api.post('/habits', payload).then(r => r.data),
  update: (id, payload) => api.patch(`/habits/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/habits/${id}`).then(r => r.data),
  reorder: (id, order) => api.post(`/habits/${id}/reorder`, null, { params: { order } }).then(r => r.data),
  useToken: (id) => api.post(`/habits/${id}/use-token`).then(r => r.data),
  log: (payload) => api.post(`/habits/log`, payload).then(r => r.data),
  logs: (id, params) => api.get(`/habits/${id}/logs`, { params }).then(r => r.data),
  library: (params) => api.get('/habits/library', { params }).then(r => r.data),
  addFromLibrary: (key) => api.post(`/habits/from-library`, { key }).then(r => r.data),
  analytics: (id) => api.get(`/habits/${id}/analytics`).then(r => r.data),
  weeklyReview: () => api.get('/habits/analytics/weekly').then(r => r.data),
  healthScore: () => api.get('/habits/analytics/health').then(r => r.data),
  checklist: (id) => api.get(`/habits/${id}/checklist`).then(r => r.data),
  addChecklistItem: (id, payload) => api.post(`/habits/${id}/checklist`, payload).then(r => r.data),
  removeChecklistItem: (id, itemId) => api.delete(`/habits/${id}/checklist/${itemId}`).then(r => r.data),
  toggleChecklistItem: (id, itemId) => api.post(`/habits/${id}/checklist/${itemId}/log`).then(r => r.data),
}

export const dhikrApi = {
  presets: () => api.get('/dhikr/presets').then(r => r.data),
  sessions: () => api.get('/dhikr/sessions').then(r => r.data),
  createSession: (payload) => api.post('/dhikr/sessions', payload).then(r => r.data),
  increment: (id, n = 1) => api.post(`/dhikr/sessions/${id}/increment`, null, { params: { n } }).then(r => r.data),
  complete: (id) => api.post(`/dhikr/sessions/${id}/complete`).then(r => r.data),
  history: (params) => api.get('/dhikr/history', { params }).then(r => r.data),
}

export const journalApi = {
  list: (params) => api.get('/journal', { params }).then(r => r.data),
  create: (payload) => api.post('/journal', payload).then(r => r.data),
  update: (id, payload) => api.patch(`/journal/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/journal/${id}`).then(r => r.data),
  prompts: () => api.get('/journal/prompts').then(r => r.data),
  moodTrend: (days = 30) => api.get('/journal/mood-trend', { params: { days } }).then(r => r.data),
  analytics: () => api.get('/journal/analytics').then(r => r.data),
  aiSuggestVerses: (payload) => api.post('/journal/ai-suggest-verses', payload).then(r => r.data),
}

export const insightsApi = {
  today: () => api.get('/insights/today').then(r => r.data),
  history: () => api.get('/insights/history').then(r => r.data),
  rate: (id, rating) => api.post(`/insights/${id}/rate`, { rating }).then(r => r.data),
  dismiss: (id) => api.post(`/insights/${id}/dismiss`).then(r => r.data),
}

export const lettersApi = {
  list: () => api.get('/letters').then(r => r.data),
  generate: () => api.post('/letters/generate').then(r => r.data),
  get: (id) => api.get(`/letters/${id}`).then(r => r.data),
}

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }).then(r => r.data),
  today: () => api.get('/tasks/today').then(r => r.data),
  create: (payload) => api.post('/tasks', payload).then(r => r.data),
  update: (id, payload) => api.patch(`/tasks/${id}`, payload).then(r => r.data),
  complete: (id) => api.post(`/tasks/${id}/complete`).then(r => r.data),
  toggle: (id, completed) => completed ? api.post(`/tasks/${id}/complete`).then(r => r.data) : api.patch(`/tasks/${id}`, { completed: false }).then(r => r.data),
  remove: (id) => api.delete(`/tasks/${id}`).then(r => r.data),
}

export const aiApi = {
  chat: (payload) => api.post('/ai/chat', payload).then(r => r.data),
  conversations: () => api.get('/ai/conversations').then(r => r.data),
  conversation: (id) => api.get(`/ai/conversations/${id}`).then(r => r.data),
  deleteConversation: (id) => api.delete(`/ai/conversations/${id}`).then(r => r.data),
  usage: () => api.get('/ai/usage').then(r => r.data),
}

export const qiblaApi = {
  me: () => api.get('/qibla/me').then(r => r.data),
  calc: (params) => api.get('/qibla', { params }).then(r => r.data),
  mosquesNearby: (params) => api.get('/qibla/mosques/nearby', { params }).then(r => r.data),
}

export const healthApi = {
  waterToday: () => api.get('/health/water/today').then(r => r.data),
  logWater: (payload) => api.post('/health/water', payload).then(r => r.data),
  waterHistory: (days = 30) => api.get('/health/water', { params: { days } }).then(r => r.data),
}

export const mealApi = {
  plans: () => api.get('/meal/plans').then(r => r.data),
  createPlan: (payload) => api.post('/meal/plans', payload).then(r => r.data),
  searchFood: (q) => api.get('/meal/foods/search', { params: { q } }).then(r => r.data),
  log: (payload) => api.post('/meal/log', payload).then(r => r.data),
  todaySummary: () => api.get('/meal/summary/today').then(r => r.data),
}

export const workoutApi = {
  plans: () => api.get('/workout/plans').then(r => r.data),
  createPlan: (payload) => api.post('/workout/plans', payload).then(r => r.data),
  searchExercise: (q) => api.get('/workout/exercises/search', { params: { q } }).then(r => r.data),
  sessions: () => api.get('/workout/sessions').then(r => r.data),
  startSession: (payload) => api.post('/workout/sessions', payload).then(r => r.data),
  stats: () => api.get('/workout/stats').then(r => r.data),
}

export const childApi = {
  list: () => api.get('/child').then(r => r.data),
  create: (payload) => api.post('/child', payload).then(r => r.data),
  get: (id) => api.get(`/child/${id}`).then(r => r.data),
  update: (id, payload) => api.patch(`/child/${id}`, payload).then(r => r.data),
  remove: (id) => api.delete(`/child/${id}`).then(r => r.data),
  milestones: (id) => api.get(`/child/${id}/milestones`).then(r => r.data),
  logMilestone: (id, payload) => api.post(`/child/${id}/milestones`, payload).then(r => r.data),
  duas: (id) => api.get(`/child/${id}/duas`).then(r => r.data),
  logDuaTeaching: (id, payload) => api.post(`/child/${id}/duas`, payload).then(r => r.data),
  lessons: (id) => api.get(`/child/${id}/lessons`).then(r => r.data),
  logLesson: (id, payload) => api.post(`/child/${id}/lessons`, payload).then(r => r.data),
}

export const recitationApi = {
  upload: (formData) => api.post('/recitation/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  analyse: (id) => api.post(`/recitation/${id}/analyse`).then(r => r.data),
  feedback: (id) => api.get(`/recitation/${id}/feedback`).then(r => r.data),
  history: () => api.get('/recitation/history').then(r => r.data),
  stats: () => api.get('/recitation/stats').then(r => r.data),
}

export const cycleSyncApi = {
  recommendations: () => api.get('/cycle-sync/recommendations').then(r => r.data),
}

export const femaleApi = {
  cycles: () => api.get('/female/cycles').then(r => r.data),
  logCycle: (payload) => api.post('/female/cycles', payload).then(r => r.data),
  fasting: () => api.get('/female/fasting').then(r => r.data),
  logFasting: (payload) => api.post('/female/fasting', payload).then(r => r.data),
  missedFasts: () => api.get('/female/fasting/missed').then(r => r.data),
}

export const communityApi = {
  feed: (params) => api.get('/community/feed', { params }).then(r => r.data),
  createPost: (payload) => api.post('/community/posts', payload).then(r => r.data),
  post: (id) => api.get(`/community/posts/${id}`).then(r => r.data),
  comment: (id, payload) => api.post(`/community/posts/${id}/comments`, payload).then(r => r.data),
  react: (id, payload) => api.post(`/community/posts/${id}/reactions`, payload).then(r => r.data),
  report: (id, payload) => api.post(`/community/posts/${id}/report`, payload).then(r => r.data),
  groups: () => api.get('/community/groups').then(r => r.data),
  joinGroup: (id) => api.post(`/community/groups/${id}/join`).then(r => r.data),
  qa: () => api.get('/community/qa').then(r => r.data),
  askQuestion: (payload) => api.post('/community/qa', payload).then(r => r.data),
}

export const waqfApi = {
  projects: () => api.get('/waqf/projects').then(r => r.data),
  project: (id) => api.get(`/waqf/projects/${id}`).then(r => r.data),
  donate: (id, payload) => api.post(`/waqf/projects/${id}/donate`, payload).then(r => r.data),
  myDonations: () => api.get('/waqf/donations/me').then(r => r.data),
  totals: () => api.get('/waqf/donations/totals').then(r => r.data),
}

export const gamificationApi = {
  profile: () => api.get('/gamification/profile').then(r => r.data),
  history: () => api.get('/gamification/history').then(r => r.data),
  myBadges: () => api.get('/gamification/badges/me').then(r => r.data),
  allBadges: () => api.get('/gamification/badges').then(r => r.data),
  quests: () => api.get('/gamification/quests').then(r => r.data),
  startQuest: (id) => api.post(`/gamification/quests/${id}/start`).then(r => r.data),
}

export const financeApi = {
  zakatCalc: (payload) => api.post('/finance/zakat/calculate', payload).then(r => r.data),
  halalScreen: (ticker) => api.get('/finance/halal/screen', { params: { ticker } }).then(r => r.data),
  mortgage: (payload) => api.post('/finance/mortgage/calculate', payload).then(r => r.data),
}

export const familyApi = {
  plan: () => api.get('/family/plan').then(r => r.data),
  members: () => api.get('/family/members').then(r => r.data),
  invite: (payload) => api.post('/family/members/invite', payload).then(r => r.data),
  removeMember: (id) => api.delete(`/family/members/${id}`).then(r => r.data),
}

export const learningApi = {
  paths: () => api.get('/learning/paths').then(r => r.data),
  path: (id) => api.get(`/learning/paths/${id}`).then(r => r.data),
  vocabDue: () => api.get('/learning/vocab/due').then(r => r.data),
  reviewVocab: (id, quality) => api.post(`/learning/vocab/${id}/review`, { quality }).then(r => r.data),
}

export const adminApi = {
  reports: () => api.get('/admin/reports').then(r => r.data),
  resolveReport: (id, payload) => api.post(`/admin/reports/${id}/resolve`, payload).then(r => r.data),
  users: (params) => api.get('/admin/users', { params }).then(r => r.data),
  verifyScholar: (id) => api.post(`/admin/users/${id}/verify-scholar`).then(r => r.data),
  stats: () => api.get('/admin/stats').then(r => r.data),
}

export default api
