import axios from 'axios';
import { STORAGE_KEYS } from './constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service functions
export const authService = {
  login: async (credentials) => {
    const resp = await api.post('/login', credentials);
    try {
      const body = resp?.data || {};
      // possible shapes: { ok: true, token } or { status: 'success', data: { token, ... } }
      let token = body.token || (body.data && body.data.token) || (body.ok && body.token) || null;
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      }
      // Try to fetch current user immediately and persist
      try {
        const me = await api.get('/me');
        const user = me?.data?.data || me?.data;
        if (user) {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        }
      } catch (e) {
        // ignore if /me fails; caller can fetch later
      }
    } catch (e) {
      // ignore any storage errors
    }
    return resp;
  },
  // Backend logout
  logout: () => api.post('/logout'),
  register: (userData) => api.post('/register', userData),

  getCurrentUser: async () => {
    try {
      return await api.get('/me');
    } catch (error) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          return Promise.resolve({ data: JSON.parse(userData) });
        } catch (e) {
          // If parsing fails, fall through to reject with original error
        }
      }
      return Promise.reject(error);
    }
  },
};

export const productService = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  // Delete a product by id
  deleteProduct: (id) => api.delete(`/products/${id}`),
  // Fetch available brands/categories (distinct from DB)
  getBrands: () => api.get('/products/brands'),
  getCategories: () => api.get('/products/categories'),
  // Force-delete removes related order items then deletes the product
  forceDeleteProduct: (id) => api.delete(`/products/${id}/force-delete`),
  
  createProduct: (productData) => {
   
    const formData = new FormData();
    // Required params for backend: brand, category, description, name, price, stock_quantity, images
    formData.append('brand', productData.brand || '');
    formData.append('category', productData.category || '');
    formData.append('description', productData.description || '');
    formData.append('name', productData.name || '');
    // Ensure price is a number/string
    formData.append('price', productData.price != null ? String(productData.price) : '0');
    formData.append('stock_quantity', productData.stockQuantity != null ? String(productData.stockQuantity) : '0');
    if (productData.images && productData.images.length > 0) {
      formData.append('images', productData.images[0]);
    }

    // Let axios/browser set Content-Type (including boundary)
    return api.post('/products', formData);
  },
  
  updateProduct: (id, productData) => {
    // Always send multipart/form-data to match backend @RequestParam bindings
    const formData = new FormData();
    formData.append('brand', productData.brand || '');
    formData.append('category', productData.category || '');
    formData.append('description', productData.description || '');
    formData.append('name', productData.name || '');
    formData.append('price', productData.price != null ? String(productData.price) : '0');
    formData.append('stock_quantity', productData.stockQuantity != null ? String(productData.stockQuantity) : '0');
    if (productData.images && productData.images.length > 0) {
      formData.append('images', productData.images[0]);
    }

    return api.put(`/products/${id}`, formData);
  },
};

export const orderService = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  updateOrderItems: (orderId, items) => api.put(`/orders/${orderId}/items`, items),
  getUserOrders: () => api.get('/orders/me'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  getAllOrders: () => api.get('/orders'), // Admin only
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
  generateKhqrCode: (orderId, amount) => api.post(`/orders/${orderId}/khqr`, { amount }),
  getKhqrPaymentStatus: (orderId) => api.get(`/orders/${orderId}/khqr/status`),
  placeBakongPayment: (orderId, payload) => api.post(`/orders/${orderId}/bakong`, payload),
  confirmBakongCallback: (payload) => api.post('/bakong/callback', payload),
  deleteOrderItem: (orderId, productId) => api.delete(`/orders/${orderId}/items/${productId}`),
  // Delete an order by id
  deleteOrder: (orderId) => api.delete(`/orders/${orderId}`),
};

export const bakongService = {

  generateQr: (amount, currency = 'USD', orderId = null) => api.get('/bakong/generate-qr', { params: { amount, currency, orderId }, responseType: 'blob' }),

  scan: (payload) => api.post('/bakong/scan', payload),

  callback: (payload) => api.post('/bakong/callback', payload),
};

export const cartService = {
  getCart: () => api.get('/cart'), // GET /api/cart - returns cart items for current user
  setCart: (items) => api.post('/cart', { items }), // POST /api/cart - replace cart
  addItem: (item) => api.post('/cart/items', item), // POST /api/cart/items
  updateItem: (itemId, payload) => api.put(`/cart/items/${itemId}`, payload), // PUT /api/cart/items/:id
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`), // DELETE /api/cart/items/:id
  clearCart: () => api.delete('/cart'),
};

export const userService = {
  // GET /api/users - Get all users
  getAllUsers: () => api.get('/users'),
  
  // GET /api/users/{id} - Get user by id
  getUserById: (id) => api.get(`/users/${id}`),
  
  // POST /api/users - Create user (multipart/form-data)
  // Form fields: name, password, email, gender (char), images (file)
  createUser: (userData) => {
    // Accept either a prepared FormData or a plain object with `name`.
    if (typeof FormData !== 'undefined' && userData instanceof FormData) {
      // Ensure backend fields exist: first_name, last_name, password, email, gender
      try {
        if (!userData.has('first_name') && userData.has('name')) {
          const name = userData.get('name') || '';
          const parts = String(name).trim().split(/\s+/);
          userData.append('first_name', parts.slice(0, 1).join('') || '');
          userData.append('last_name', parts.slice(1).join(' ') || '');
        }
      } catch (e) {
        // best-effort: ignore if FormData.has/get are unsupported
      }
      return api.post('/users', userData, { headers: { 'Content-Type': undefined } });
    }

    // Build FormData from a plain object; split `name` into first/last
    const formData = new FormData();
    const name = userData.name || '';
    const parts = String(name).trim().split(/\s+/);
    const first = parts.slice(0, 1).join('') || '';
    const last = parts.slice(1).join(' ') || '';
    formData.append('first_name', first);
    formData.append('last_name', last);
    formData.append('password', userData.password || '');
    formData.append('email', userData.email || '');
    formData.append('gender', userData.gender ? String(userData.gender).charAt(0) : '');
    if (userData.role) formData.append('role', userData.role);
    if (userData.images && userData.images.length > 0) {
      formData.append('images', userData.images[0]);
    }

    return api.post('/users', formData, { headers: { 'Content-Type': undefined } });
  },
  
 
  updateUser: (id, userData) => {
    // If caller already passed a FormData (Profile builds one), send it directly but ensure required params exist
    if (typeof FormData !== 'undefined' && userData instanceof FormData) {
      // Ensure required request params exist to avoid backend 400 errors.
      // The backend's updateUser expects: first_name, last_name, password, email, gender (role optional, images optional)
      try {
        if (!userData.has('first_name')) userData.append('first_name', '');
        if (!userData.has('last_name')) userData.append('last_name', '');
        if (!userData.has('password')) userData.append('password', '');
        if (!userData.has('email')) userData.append('email', '');
        if (!userData.has('gender')) userData.append('gender', '');
      } catch (e) {
        // FormData.has may not be supported in some environments; fall back to best-effort appends
        try { userData.append('first_name', userData.get ? userData.get('first_name') || '' : ''); } catch (e2) {}
        try { userData.append('last_name', userData.get ? userData.get('last_name') || '' : ''); } catch (e2) {}
        try { userData.append('password', userData.get ? userData.get('password') || '' : ''); } catch (e2) {}
        try { userData.append('email', userData.get ? userData.get('email') || '' : ''); } catch (e2) {}
        try { userData.append('gender', userData.get ? userData.get('gender') || '' : ''); } catch (e2) {}
      }

      // Let the browser set the Content-Type (with proper boundary) automatically by
      // avoiding a fixed Content-Type header in the request config.
      return api.put(`/users/${id}`, userData, { headers: { 'Content-Type': undefined } });
    }

    // Otherwise build FormData from a plain object
    const formData = new FormData();
    // Support both camelCase and snake_case keys
    const first = userData.firstName || userData.first_name || (userData.name ? String(userData.name).split(' ').slice(0,1).join('') : '') || '';
    const last = userData.lastName || userData.last_name || (userData.name ? String(userData.name).split(' ').slice(1).join(' ') : '') || '';
    formData.append('first_name', first);
    formData.append('last_name', last);
    formData.append('password', userData.password || '');
    formData.append('email', userData.email || '');
    formData.append('gender', userData.gender ? String(userData.gender).charAt(0) : '');
    if (userData.role) formData.append('role', userData.role);
    if (userData.images && userData.images.length > 0) {
      formData.append('images', userData.images[0]);
    }

    // Let the browser set the Content-Type boundary automatically
    return api.put(`/users/${id}`, formData, { headers: { 'Content-Type': undefined } });
  },
  // DELETE /api/users/{id} - Delete user by id
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;