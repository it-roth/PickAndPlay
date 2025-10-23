import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { STORAGE_KEYS } from '../lib/constants';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check for saved auth data on app start
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (token && userData) {
      dispatch({
        type: 'LOGIN',
        payload: {
          token,
          user: JSON.parse(userData)
        }
      });
      // After restoring auth from storage, also restore any pending orders for this user
      (async () => {
        try {
          const api = await import('../lib/api');
          const orderService = api.orderService;
          await restorePendingOrders(orderService);
        } catch (e) {
          // ignore restore errors
        }
      })();
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = (user, token) => {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    dispatch({
      type: 'LOGIN',
      payload: { user, token }
    });
    // Restore cart restoration to ensure homepage refreshes with updated data
    (async () => {
      try {
        const api = await import('../lib/api');
        const orderService = api.orderService;
        await restorePendingOrders(orderService);
      } catch (e) {
        // ignore restore errors
      }
    })();
  };

  // restorePendingOrders: fetch user's pending orders and merge them into the local cart
  // merges items by product id, sums quantities, and writes STORAGE_KEYS.CART_ITEMS
  const restorePendingOrders = async (orderService) => {
    try {
      const resp = await orderService.getUserOrders();
      if (import.meta.env.DEV) console.debug('restorePendingOrders - GET /orders/me response:', resp?.data || resp);
      const orders = resp?.data || resp;
      // If no orders returned, attempt a DEV-only fallback to help debugging: fetch all orders
      // and filter by the logged-in user's id (useful if /orders/me is misbehaving).
      if ((!Array.isArray(orders) || orders.length === 0) && import.meta.env.DEV) {
        try {
          const rawUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
          if (rawUser) {
            const parsedUser = JSON.parse(rawUser);
            const uid = parsedUser?.id || parsedUser?.userId || parsedUser?.id_user || parsedUser?.user_id;
            if (uid) {
              try {
                const allResp = await orderService.getAllOrders();
                const all = allResp?.data || allResp;
                if (Array.isArray(all)) {
                  const filtered = all.filter(o => o && (o.userId === uid || o.user_id === uid || o.userId == String(uid) || o.user_id == String(uid)));
                  if (filtered.length > 0) {
                    if (import.meta.env.DEV) console.debug('restorePendingOrders - DEV fallback found orders for user:', filtered);
                    // proceed with filtered results as if they were returned by /orders/me
                    orders.length = 0; // clear
                    Array.prototype.push.apply(orders, filtered);
                  }
                }
              } catch (e) {
                if (import.meta.env.DEV) console.warn('restorePendingOrders DEV fallback failed to fetch all orders', e);
              }
            }
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('restorePendingOrders failed parsing local user data', e);
        }
      }
      if (!Array.isArray(orders) || orders.length === 0) return;

    // collect pending orders (case-insensitive match on status)
    const pendingOrders = orders.filter(o => o && o.status && String(o.status).toLowerCase() === 'pending');
    if (import.meta.env.DEV) console.debug('restorePendingOrders - pendingOrders:', pendingOrders);
      if (!pendingOrders || pendingOrders.length === 0) return;

      // pick a pendingOrderId to keep (use first one returned)
      const chosenPendingId = pendingOrders[0]?.id;
      if (chosenPendingId) {
        try { localStorage.setItem('pendingOrderId', String(chosenPendingId)); } catch (e) {}
      }

      // merge all items from all pending orders
      const mergedMap = new Map();
      for (const ord of pendingOrders) {
        const items = ord.items || ord.orderItems || ord.itemsList || [];
        if (!Array.isArray(items)) continue;
        for (const it of items) {
          const id = it.productId || it.product_id || it.product || (it.getProductId ? it.getProductId() : undefined) || 0;
          const quantity = Number(it.quantity || it.qty || (it.getQuantity ? it.getQuantity() : 0)) || 0;
          const priceRaw = it.unitPrice || it.unit_price || it.price || (it.getUnitPrice ? it.getUnitPrice() : 0);
          const price = Number((priceRaw && priceRaw.toString && priceRaw.toString()) || priceRaw) || 0;
          const name = it.name || it.productName || (it.getProduct && it.getProduct().getName ? it.getProduct().getName() : '') || '';
          if (!id || quantity <= 0) continue;
          const key = String(id);
          if (!mergedMap.has(key)) {
            mergedMap.set(key, { id, quantity, price, name });
          } else {
            const existing = mergedMap.get(key);
            existing.quantity = (existing.quantity || 0) + quantity;
            // prefer latest non-zero price
            if (price && !existing.price) existing.price = price;
            mergedMap.set(key, existing);
          }
        }
      }

      const mergedItems = Array.from(mergedMap.values()).map(it => ({ id: it.id, quantity: it.quantity, price: it.price, name: it.name }));
      if (mergedItems.length > 0) {
        // Only update and emit event if cart actually changed
        const currentCart = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
        const newCartJson = JSON.stringify(mergedItems);
        if (currentCart !== newCartJson) {
          try { localStorage.setItem(STORAGE_KEYS.CART_ITEMS, newCartJson); } catch (e) {}
          // Immediate cart update to ensure homepage refreshes
          try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (e) {}
        }
      }
    } catch (e) {
      // ignore errors during restore
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    try { localStorage.removeItem(STORAGE_KEYS.CART_ITEMS); } catch (e) {}
    try { localStorage.removeItem('pendingOrderId'); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('cartUpdated')); } catch (e) {}
    dispatch({ type: 'LOGOUT' });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const value = {
    ...state,
    login,
    logout,
    setError,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}