import axios from 'axios';

// Empty string = same origin (proxied by Vite during dev, and nginx in prod)
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: inject access token and restaurant filter
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kds_access_token') || localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const restaurantId = localStorage.getItem('kds_restaurant_id') || localStorage.getItem('admin_selected_restaurant');
  if (restaurantId) {
    if (config.method === 'get' || config.method === 'delete') {
      config.params = { ...config.params, restaurant_id: restaurantId };
    } else if (config.method === 'post' || config.method === 'patch' || config.method === 'put') {
      if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data.restaurant_id = parseInt(restaurantId, 10);
      }
    }
  }

  return config;
});

export const kdsService = {
  // Fetch live active orders (pending, preparing, ready)
  getLiveOrders: async (params = {}) => {
    const response = await api.get('/api/v1/orders/live', { params });
    return response.data || [];
  },

  // Update overall order status (e.g. PENDING -> PREPARING -> READY -> SERVED)
  updateOrderStatus: async (orderId, status) => {
    const response = await api.patch(`/api/v1/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Staff login (Hotel Admin, Super Admin, Cashier, Kitchen)
  login: async (email, password, role = undefined) => {
    const response = await api.post('/api/v1/auth/login', { email, password, role });
    if (response.data?.access_token) {
      localStorage.setItem('kds_access_token', response.data.access_token);
      if (response.data.user) {
        localStorage.setItem('kds_user', JSON.stringify(response.data.user));
        if (response.data.user.restaurant_id) {
          localStorage.setItem('kds_restaurant_id', response.data.user.restaurant_id.toString());
        }
      }
    }
    return response.data;
  },

  // Get current logged-in user profile
  getProfile: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },
};
