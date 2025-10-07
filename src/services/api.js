import axios from 'axios';

// Create axios instance with base URL
const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include auth token
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

// API service functions
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const productService = {
  getAllProducts: () => api.get('/products'),
  getProductById: (id) => api.get(`/products/${id}`),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const orderService = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders/me'),
  getAllOrders: () => api.get('/orders'), // Admin only
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const userService = {
  getAllUsers: () => api.get('/users'), // Admin only
  getUserById: (id) => api.get(`/users/${id}`), // Admin only
  updateUser: (id, userData) => api.put(`/users/${id}`, userData), // Admin only
};

export default api;