// V2 + V3 API helpers — append to src/lib/api.js

export const mealApi = {
  getPlans: () => api.get('/meal/plans'),
  createPlan: (data) => api.post('/meal/plans', data),
  getActivePlan: () => api.get('/meal/plans/active'),
  updatePlan: (id, data) => api.patch(`/meal/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/meal/plans/${id}`),
  getLog: (date) => api.get('/meal/log', { params: { entry_date: date } }),
  logMeal: (data) => api.post('/meal/log', data),
  updateEntry: (id, data) => api.patch(`/meal/log/${id}`, data),
  deleteEntry: (id) => api.delete(`/meal/log/${id}`),
  getTodaySummary: () => api.get('/meal/summary/today'),
  searchFoods: (q) => api.get('/meal/foods/search', { params: { q } }),
  createFood: (data) => api.post('/meal/foods', data),
}

export const workoutApi = {
  getPlans: () => api.get('/workout/plans'),
  createPlan: (data) => api.post('/workout/plans', data),
  updatePlan: (id, data) => api.patch(`/workout/plans/${id}`, data),
  deletePlan: (id) => api.delete(`/workout/plans/${id}`),
  getSessions: (params) => api.get('/workout/sessions', { params }),
  logSession: (data) => api.post('/workout/sessions', data),
  updateSession: (id, data) => api.patch(`/workout/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/workout/sessions/${id}`),
  getStats: () => api.get('/workout/stats'),
  searchExercises: (q) => api.get('/workout/exercises/search', { params: { q } }),
  createExercise: (data) => api.post('/workout/exercises', data),
}

export const childApi = {
  list: () => api.get('/children'),
  create: (data) => api.post('/children', data),
  update: (id, data) => api.patch(`/children/${id}`, data),
  delete: (id) => api.delete(`/children/${id}`),
  getMilestones: (childId, category) => api.get(`/children/${childId}/milestones`, { params: { category } }),
  createMilestone: (childId, data) => api.post(`/children/${childId}/milestones`, data),
  updateMilestone: (childId, msId, data) => api.patch(`/children/${childId}/milestones/${msId}`, data),
  getDuas: (childId) => api.get(`/children/${childId}/duas`),
  logDua: (childId, data) => api.post(`/children/${childId}/duas`, data),
  updateDua: (childId, logId, data) => api.patch(`/children/${childId}/duas/${logId}`, data),
  getLessons: (childId, subject) => api.get(`/children/${childId}/lessons`, { params: { subject } }),
  logLesson: (childId, data) => api.post(`/children/${childId}/lessons`, data),
}

export const recitationApi = {
  list: () => api.get('/recitation'),
  create: (data) => api.post('/recitation', data),
  analyse: (id) => api.post(`/recitation/${id}/analyse`),
  getFeedback: (id) => api.get(`/recitation/${id}/feedback`),
  getStats: () => api.get('/recitation/stats'),
  delete: (id) => api.delete(`/recitation/${id}`),
}

export const qiblaApi = {
  get: (lat, lng) => api.get('/qibla', { params: { lat, lng } }),
  getForMe: () => api.get('/qibla/me'),
  nearbyMosques: (lat, lng, radius_m) => api.get('/qibla/mosques', { params: { lat, lng, radius_m } }),
  mosquesNearMe: (radius_m) => api.get('/qibla/mosques/nearby', { params: { radius_m } }),
}

export const communityApi = {
  listGroups: (params) => api.get('/community/groups', { params }),
  createGroup: (data) => api.post('/community/groups', data),
  joinGroup: (id) => api.post(`/community/groups/${id}/join`),
  leaveGroup: (id) => api.post(`/community/groups/${id}/leave`),
  getFeed: (params) => api.get('/community/feed', { params }),
  getGroupPosts: (groupId, params) => api.get(`/community/groups/${groupId}/posts`, { params }),
  createPost: (data) => api.post('/community/posts', data),
  updatePost: (id, data) => api.patch(`/community/posts/${id}`, data),
  deletePost: (id) => api.delete(`/community/posts/${id}`),
  reactToPost: (id, type) => api.post(`/community/posts/${id}/react`, null, { params: { reaction_type: type } }),
  reportPost: (id, reason) => api.post(`/community/posts/${id}/report`, null, { params: { reason } }),
  getComments: (postId) => api.get(`/community/posts/${postId}/comments`),
  createComment: (postId, data) => api.post(`/community/posts/${postId}/comments`, data),
  deleteComment: (id) => api.delete(`/community/comments/${id}`),
}

export const waqfApi = {
  listProjects: (params) => api.get('/waqf/projects', { params }),
  getProject: (id) => api.get(`/waqf/projects/${id}`),
  donate: (data) => api.post('/waqf/donate', data),
  myDonations: () => api.get('/waqf/my-donations'),
  myTotal: () => api.get('/waqf/my-total'),
}

export const cycleSyncApi = {
  getRecommendations: () => api.get('/female/ibadah/recommendations'),
}
