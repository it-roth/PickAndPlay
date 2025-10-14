import axios from 'axios';
import { STORAGE_KEYS } from './constants';

// Create axios instance with base URL.
// Use a relative '/api' path so the Vite dev server proxy can forward requests in development.
// Allow overriding via VITE_API_BASE_URL for non-proxy setups.
// Use relative '/api' so the Vite dev server proxy forwards requests to the backend during development.
// Allow overriding via VITE_API_BASE_URL for production or explicit configs.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  // Backend exposes POST /api/login
  login: (credentials) => api.post('/login', credentials),
  // Backend logout
  logout: () => api.post('/logout'),
  register: (userData) => api.post('/auth/register', userData),
  // Try to get the current user from the backend. If the backend is
  // unreachable (e.g. during local frontend-only development), fall
  // back to a `userData` object stored in localStorage so devs can
  // simulate authenticated/admin users.
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
  
  createProduct: (productData) => {
    // Check if we need to send as multipart/form-data (if images are present)
    if (productData.images && productData.images.length > 0) {
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'specs') {
          formData.append(key, productData[key]);
        }
      });
      
      // Append specs as JSON string
      if (productData.specs) {
        formData.append('specs', JSON.stringify(productData.specs));
      }
      
      // Append image file
      formData.append('images', productData.images[0]);
      
      return api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Send as JSON if no images
      return api.post('/products', productData);
    }
  },
  
  updateProduct: (id, productData) => {
    // Check if we need to send as multipart/form-data (if images are present)
    if (productData.images && productData.images.length > 0) {
      const formData = new FormData();
      
      // Append all non-file fields
      Object.keys(productData).forEach(key => {
        if (key !== 'images' && key !== 'specs') {
          formData.append(key, productData[key]);
        }
      });
      
      // Append specs as JSON string
      if (productData.specs) {
        formData.append('specs', JSON.stringify(productData.specs));
      }
      
      // Append image file
      formData.append('images', productData.images[0]);
      
      return api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // Send as JSON if no images
      return api.put(`/products/${id}`, productData);
    }
  },
};

export const orderService = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  getUserOrders: () => api.get('/orders/me'),
  getAllOrders: () => api.get('/orders'), // Admin only
  updateOrderStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
};

export const userService = {
  // GET /api/users - Get all users
  getAllUsers: () => api.get('/users'),
  
  // GET /api/users/{id} - Get user by id
  getUserById: (id) => api.get(`/users/${id}`),
  
  // POST /api/users - Create user (multipart/form-data)
  // Form fields: name, password, email, gender (char), images (file)
  createUser: (userData) => {
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('password', userData.password);
    formData.append('email', userData.email);
    formData.append('gender', userData.gender.charAt(0)); // Send single character
    // Include role if provided (e.g., admin creating a user)
    if (userData.role) {
      formData.append('role', userData.role);
    }
    
    if (userData.images && userData.images.length > 0) {
      formData.append('images', userData.images[0]); // Append the file
    }
    
    return api.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  // PUT /api/users/{id} - Update user (multipart/form-data)
  // Form fields: name, password, email, gender (String), images (file, optional)
  updateUser: (id, userData) => {
    const formData = new FormData();
    formData.append('name', userData.name);
    formData.append('password', userData.password);
    formData.append('email', userData.email);
    formData.append('gender', userData.gender); // Controller uses charAt(0)
    if (userData.role) {
      formData.append('role', userData.role);
    }
    
    if (userData.images && userData.images.length > 0) {
      formData.append('images', userData.images[0]); // Optional image file
    }
    
    return api.put(`/users/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;