import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/users/login', { email, password });
    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  },

  register: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
};

export const userService = {
  getProfile: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteAccount: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

export const specialNeedsService = {
  getAll: async () => {
    const response = await api.get('/special-needs');
    return response.data;
  },
};

export const promptService = {
  sendPrompt: async (q, context = "") => {
    const user = authService.getCurrentUser();
    const userId = user?.id;
    
    const response = await api.post('/prompt', {
      q,
      context,
      userId 
    });
    return response.data;
  },

  processAnnotation: async (text, type, context = "") => {
    const user = authService.getCurrentUser();
    const userId = user?.id;
    
    const response = await api.post('/prompt/annotation', {
      text,
      type,
      context,
      userId
    });
    return response.data;
  },

  consolidateKnowledge: async (collectedItems, context = "") => {
    const user = authService.getCurrentUser();
    const userId = user?.id;
    
    const response = await api.post('/prompt/consolidate', {
      collectedItems,
      context,
      userId
    });
    return response.data;
  },
};

export default api;