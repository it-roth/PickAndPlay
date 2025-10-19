import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { STORAGE_KEYS } from '../lib/constants';
import { cartService, orderService } from '../lib/api';

export const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      {
        const existingItem = state.items.find(item => item.id === action.payload.id);
        const addQty = Number(action.payload.quantity) || 1;
        if (existingItem) {
          return {
            ...state,
            items: state.items.map(item =>
              item.id === action.payload.id
                ? { ...item, quantity: item.quantity + addQty }
                : item
            )
          };
        }
        return {
          ...state,
          items: [...state.items, { ...action.payload, quantity: addQty }]
        };
      }
    
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload
      };
    
    
    default:
      return state;
  }
};

const initialState = {
  items: [],
};

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const isInitialMount = useRef(true);
  const syncInProgress = useRef(false);
  const pendingSync = useRef(false);
  const failureCount = useRef(0);
  const isFirstSave = useRef(true);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      if (isFirstSave.current) {
        isFirstSave.current = false;
        return;
      }
      localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(state.items));
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  // Note: we removed automatic server-side cart sync. The cart is local-only now
  // and orders are created only during explicit checkout (see Cart.jsx -> handleCheckout).

  // Cart actions
  const addItem = (product) => {
    // Update local state here. The useEffect will serialize and sync to backend.
    dispatch({ type: 'ADD_ITEM', payload: product });

    // No server-sync for addItem anymore. Resolve immediately.
    return Promise.resolve(null);
  };

  const removeItem = async (productId) => {
    // Only update local state. Sync handled by effect.
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
    } else {
      // Only update local state. The effect will pick up the change and sync.
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
    // Clear any lingering local keys
    localStorage.removeItem('pendingOrderId');
  };

  const getCartTotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}