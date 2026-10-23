export const BACKEND_ENDPOINTS = [
  { label: 'Cloud Dev API (Default)', url: 'http://dev-api.dataudipi.com' },
  { label: 'Local LAN (10.127.18.176:8001)', url: 'http://10.127.18.176:8001' },
  { label: 'Localhost (Port 8001)', url: 'http://localhost:8001' },
  { label: 'Android Emulator (10.0.2.2:8001)', url: 'http://10.0.2.2:8001' },
];

let activeBaseUrl = 'http://dev-api.dataudipi.com';
let activeRestaurantId = 1;
let authToken = null;

export const getActiveBaseUrl = () => activeBaseUrl;
export const setActiveBaseUrl = (url) => {
  activeBaseUrl = url.replace(/\/$/, '');
};

export const getActiveRestaurantId = () => activeRestaurantId;
export const setActiveRestaurantId = (id) => {
  activeRestaurantId = id;
};

export const setAuthToken = (token) => { authToken = token; };
export const getAuthToken = () => authToken;

async function request(path, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const url = `${activeBaseUrl}${path}`;
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.detail || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export const kdsApi = {
  getLiveOrders: async () => {
    return await request(`/api/v1/orders/live?restaurant_id=${activeRestaurantId}`);
  },

  updateOrderStatus: async (orderId, status) => {
    return await request(`/api/v1/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  login: async (email, password, role = 'HOTEL_ADMIN') => {
    const data = await request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (data?.access_token) {
      authToken = data.access_token;
      if (data.user?.restaurant_id) {
        activeRestaurantId = data.user.restaurant_id;
      }
    }
    return data;
  },
};
