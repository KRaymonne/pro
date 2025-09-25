import axios from 'axios';

// Configuration de base pour l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Services API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (passwordData) => api.post('/auth/change-password', passwordData),
};

export const poesiesAPI = {
  getAll: (params = {}) => api.get('/poesies', { params }),
  getById: (id) => api.get(`/poesies/${id}`),
  create: (poesieData) => api.post('/poesies', poesieData),
  update: (id, poesieData) => api.put(`/poesies/${id}`, poesieData),
  delete: (id) => api.delete(`/poesies/${id}`),
  getStats: () => api.get('/poesies/stats/general'),
};

export const lecturesAPI = {
  getAll: (params = {}) => api.get('/lectures', { params }),
  getById: (id) => api.get(`/lectures/${id}`),
  create: (lectureData) => api.post('/lectures', lectureData),
  update: (id, lectureData) => api.put(`/lectures/${id}`, lectureData),
  getStats: () => api.get('/lectures/stats/personal'),
  getProgress: (poesieId) => api.get(`/lectures/progress/${poesieId}`),
};

export const enregistrementsAPI = {
  upload: (formData) => api.post('/enregistrements', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getByLecture: (lectureId) => api.get(`/enregistrements/lecture/${lectureId}`),
  getUserEnregistrements: (params = {}) => api.get('/enregistrements/user', { params }),
  getById: (id) => api.get(`/enregistrements/${id}`),
  update: (id, data) => api.put(`/enregistrements/${id}`, data),
  delete: (id) => api.delete(`/enregistrements/${id}`),
  getStats: () => api.get('/enregistrements/stats/user'),
};

export const favorisAPI = {
  getAll: (params = {}) => api.get('/favoris', { params }),
  add: (poesieId) => api.post('/favoris', { poesieId }),
  remove: (poesieId) => api.delete(`/favoris/${poesieId}`),
  check: (poesieId) => api.get(`/favoris/check/${poesieId}`),
  getStats: () => api.get('/favoris/stats'),
};

export const audioAPI = {
  getPoesieAudio: (poesieId) => api.get(`/audio/poesie/${poesieId}`),
  getPoesieAudioByVoice: (poesieId, typeVoix) => api.get(`/audio/poesie/${poesieId}/voix/${typeVoix}`),
  updateVoicePreference: (preferenceVoix) => api.put('/audio/preference-voix', { preferenceVoix }),
  getVoicePreference: () => api.get('/audio/preference-voix'),
};

export const rapportsAPI = {
  getIndividuel: (params = {}) => api.get('/rapports/individuel', { params }),
  getClasse: (params = {}) => api.get('/rapports/classe', { params }),
  export: (params = {}) => api.get('/rapports/export', { params }),
};

export default api;

