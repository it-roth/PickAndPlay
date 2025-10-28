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
  const creatingPendingRef = useRef(false);
  const syncInProgress = useRef(false);
  const pendingSync = useRef(false);
  const failureCount = useRef(0);
  const isFirstSave = useRef(true);
  const itemsRef = useRef(initialState.items);
  const isEnriching = useRef(false);

  // Load cart from localStorage on mount - SIMPLIFIED VERSION
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Debug: only log when explicitly requested in DEV
        if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
          console.log('Loading cart from localStorage:', parsedCart);
        }
        // Load cart state from localStorage
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
        
        // If items don't have complete product data (images), refresh from backend
        const needsRefresh = parsedCart.some(item => !item.images || !item.name || !item.brand);
        if (needsRefresh && import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
          console.log('Cart items missing product data, will refresh from backend');
        }
        
      } catch (error) {
        if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem(STORAGE_KEYS.CART_ITEMS);
      }
    }
  // Listen for external cart updates (e.g., restored on login)
  // Only replace local state if the incoming stored cart differs to avoid loops
    const onCartUpdated = () => {
      try {
        const sc = localStorage.getItem(STORAGE_KEYS.CART_ITEMS);
        if (sc) {
          const parsed = JSON.parse(sc);
          const current = itemsRef.current || [];
          if (JSON.stringify(parsed) !== JSON.stringify(current)) {
            dispatch({ type: 'LOAD_CART', payload: parsed });
          }
        } else {
          if ((itemsRef.current || []).length !== 0) {
            dispatch({ type: 'LOAD_CART', payload: [] });
          }
        }
      } catch (e) {
        if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('Error reloading cart on cartUpdated event', e);
      }
    };
    window.addEventListener('cartUpdated', onCartUpdated);

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated);
    };
  }, []);

  // On mount, if there's a pendingOrderId or a logged-in user, try to load server-side pending orders
  useEffect(() => {
    (async () => {
      try {
  // If there's a pendingOrderId saved locally, prefer loading that order
        const pending = localStorage.getItem('pendingOrderId');
        if (pending) {
          const resp = await orderService.getOrderById(pending);
          const order = resp?.data || resp;
          if (order) {
            const items = order.items || order.orderItems || [];
            const cartItems = (items || []).map(it => {
              const id = it.productId || it.product_id || it.product || 0;
              const quantity = it.quantity || it.qty || 1;
              // Prefer productPrice from JOINs over unitPrice from order items (which might be 0)
              const unitPriceRaw = it.unitPrice || it.unit_price || it.price || 0;
              const productPriceRaw = it.productPrice || 0;
              const priceRaw = productPriceRaw || unitPriceRaw;
              const price = Number((priceRaw && priceRaw.toString && priceRaw.toString()) || priceRaw) || 0;
              // Use complete product data from backend JOINs
              const name = it.productName || it.name || '';
              const images = it.productImages || it.images || '';
              const brand = it.productBrand || it.brand || '';
              const description = it.productDescription || it.description || '';
              const category = it.productCategory || it.category || '';
              return { id, quantity, price, name, images, brand, description, category };
            }).filter(ci => ci.id && ci.quantity > 0);
            if (cartItems.length > 0) {
              dispatch({ type: 'LOAD_CART', payload: cartItems });
              try { localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(cartItems)); } catch (e) {}
            }
            return;
          }
        }

        // Otherwise, attempt to load all user's pending orders via GET /orders/me and merge
    const api = await import('../lib/api');
    const ordersResp = await api.orderService.getUserOrders();
    if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('CartContext: GET /orders/me response:', ordersResp?.data || ordersResp);
    const orders = ordersResp?.data || ordersResp;
        if (Array.isArray(orders) && orders.length > 0) {
          const pendingOrders = orders.filter(o => o && o.status && String(o.status).toLowerCase() === 'pending');
            if (pendingOrders.length > 0) {
            if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('CartContext: pendingOrders found:', pendingOrders.map(o => ({ id: o.id, status: o.status, itemsLength: (o.items || o.orderItems || []).length })));
            // Merge items - now with complete product data from backend JOINs
            const merged = new Map();
            for (const ord of pendingOrders) {
              const items = ord.items || ord.orderItems || [];
              for (const it of (items || [])) {
                const id = it.productId || it.product_id || it.product || 0;
                const quantity = Number(it.quantity || it.qty || 0) || 0;
                const priceRaw = it.unitPrice || it.unit_price || it.price || 0;
                const price = Number((priceRaw && priceRaw.toString && priceRaw.toString()) || priceRaw) || 0;
                // Use complete product data from backend JOINs
                const name = it.productName || it.name || '';
                const images = it.productImages || it.images || '';
                const brand = it.productBrand || it.brand || '';
                const description = it.productDescription || it.description || '';
                const category = it.productCategory || it.category || '';
                
                if (!id || quantity <= 0) continue;
                const key = String(id);
                if (!merged.has(key)) {
                  merged.set(key, { 
                    id, quantity, price, name, images, brand, description, category 
                  });
                } else {
                  merged.get(key).quantity += quantity;
                }
              }
            }
            const mergedItems = Array.from(merged.values());
            if (mergedItems.length > 0) {
              dispatch({ type: 'LOAD_CART', payload: mergedItems });
              try { localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(mergedItems)); } catch (e) {}
              try { if (pendingOrders[0]?.id) localStorage.setItem('pendingOrderId', String(pendingOrders[0].id)); } catch (e) {}
            }
          }
        }
      } catch (e) {
        // ignore server errors; keep local cart
        if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('Server cart restore skipped or failed', e);
      }
    })();
  }, []);

  // Save cart to localStorage whenever it changes - SIMPLIFIED
  useEffect(() => {
    if (isFirstSave.current) {
      isFirstSave.current = false;
      return;
    }
    
    try {
      if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
        console.log('📦 Saving cart to localStorage:', state.items);
      }
      localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(state.items));
      // Dispatch event to notify Navbar and other components
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('Error saving cart to localStorage:', error);
    }
  }, [state.items]);

  // Keep a ref copy of current items to allow the onCartUpdated listener to
  // compare incoming localStorage data against the latest in-memory cart
  // without relying on stale closure values.
  useEffect(() => {
    itemsRef.current = state.items;
  }, [state.items]);

  // Note: we removed automatic server-side cart sync. The cart is local-only now
  // and orders are created only during explicit checkout (see Cart.jsx -> handleCheckout).

  // Cart actions
  const addItem = (product) => {
    // Update local state immediately so UI is responsive
    const addQty = Number(product.quantity) || 1;
    // compute next items snapshot for server sync
    const existingItem = state.items.find(item => item.id === product.id);
    let nextItems;
    if (existingItem) {
      nextItems = state.items.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + addQty } : item
      );
    } else {
      nextItems = [...state.items, { ...product, quantity: addQty }];
    }

    // apply to local reducer
    dispatch({ type: 'ADD_ITEM', payload: product });

    // Debug logging to track cart persistence issue
    if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
      console.log('🛒 CartContext.addItem called with:', {
        product,
        nextItems,
        totalValue: nextItems.reduce((s, it) => s + ((it.price || 0) * it.quantity), 0),
        productHasPrice: !!product.price,
        productPrice: product.price
      });
    }

    // Try to persist as a pending order on the backend (create or update)
    // Create pending order if we have items, regardless of price (price might be fetched later)
    const shouldCreatePendingOrder = nextItems.length > 0;
    
    if (shouldCreatePendingOrder) {
      (async () => {
        try {
          // Build order payload expected by backend
          const itemsForApi = nextItems.map(i => ({ productId: i.id, quantity: i.quantity }));
          const total = nextItems.reduce((s, it) => s + (it.price * it.quantity), 0);
          
          if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
            console.log('💾 Attempting to persist cart to backend:', {
              itemsForApi,
              total,
              nextItemsWithPrices: nextItems.map(i => ({ id: i.id, price: i.price, quantity: i.quantity }))
            });
          }
          // Try to populate customerName from stored user data (if logged in)
          let customerName = 'Guest Customer';
        try {
          const ud = localStorage.getItem(STORAGE_KEYS.USER_DATA);
          if (ud) {
            const parsed = JSON.parse(ud);
            // Support multiple shapes returned by /api/me or stored earlier
            customerName = parsed?.name || parsed?.fullName || parsed?.username || (
              (parsed?.first_name || parsed?.firstName) ? ((parsed.first_name || parsed.firstName) + (parsed.last_name || parsed.lastName ? ' ' + (parsed.last_name || parsed.lastName) : '')) : null
            ) || customerName;
          }
        } catch (e) {}

        const orderData = {
          customerName,
          shippingAddress: 'Pickup at store',
          totalAmount: total,
          paymentMethod: 'khqr',
          items: itemsForApi
        };

        let pending = localStorage.getItem('pendingOrderId');
        if (!pending) {
          // Prevent concurrent creations: if another addItem is creating a pending order,
          // wait briefly for it to finish and reuse the pendingOrderId.
          if (creatingPendingRef.current) {
            // Poll for pendingOrderId up to 1s
            let waited = 0;
            while (!localStorage.getItem('pendingOrderId') && waited < 1000) {
              // eslint-disable-next-line no-await-in-loop
              await new Promise(r => setTimeout(r, 100));
              waited += 100;
            }
            pending = localStorage.getItem('pendingOrderId');
          }

          if (!pending) {
            // create a new pending order (guarded)
            try {
              creatingPendingRef.current = true;
              try {
                const resp = await orderService.placeOrder(orderData);
                const createdId = resp?.data?.id || resp?.id;
                if (createdId) {
                  try { localStorage.setItem('pendingOrderId', String(createdId)); } catch (e) {}
                  pending = String(createdId);
                  if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('Created pending order:', createdId, 'for items:', itemsForApi);
                } else {
                  if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.warn('placeOrder succeeded but no ID returned:', resp);
                }
              } catch (err) {
                // If backend returns 400 (insufficient stock), show user-friendly message
                if (err && err.response && err.response.status === 400 && err.response.data && err.response.data.message) {
                  try {
                    const notifyModule = await import('../lib/notify');
                    const showError = notifyModule.showError || notifyModule.default?.showError || (() => {});
                    await showError(err.response.data.message);
                  } catch (nerr) {}
                  // abort creating pending order
                  creatingPendingRef.current = false;
                  return;
                }
                throw err;
              }
            } finally {
              creatingPendingRef.current = false;
            }
          }
        }

        if (pending) {
          // update existing pending order items
          try {
            // Normalize payload: include unitPrice and ensure numeric ids/quantities
            const normalized = nextItems.map(i => ({
              productId: Number(i.id ?? i._id ?? i.productId ?? 0),
              quantity: Number(i.quantity) || 1,
              unitPrice: i.price != null ? String(i.price) : '0'
            }));
            if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('Updating order items for pendingOrderId', pending, normalized);
            await orderService.updateOrderItems(pending, normalized);
            if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.debug('Successfully updated order items for order', pending);
          } catch (e) {
            // if update fails, log the error but don't create a new order to avoid excessive order creation
            if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.warn('updateOrderItems failed, will retry on next cart operation', e);
            // Clear the stale pendingOrderId so a fresh order can be created on next operation if needed
            try { localStorage.removeItem('pendingOrderId'); } catch (ee) {}
            
            try {
              const notifyModule = await import('../lib/notify');
              const showError = notifyModule.showError || notifyModule.default?.showError || (() => {});
              showError('Cart sync temporarily unavailable; changes saved locally.');
            } catch (nerr) {
              // ignore notify errors
            }
          }
        }
          } catch (err) {
          if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) console.error('Failed to persist pending order on addItem:', err);
          // Show error in development mode so we can debug deeper if explicitly enabled
          if (import.meta.env.DEV && window.__SUPPRESS_CONSOLE === false) {
            console.error('Cart persistence error details:', {
              error: err,
              orderData,
              nextItems,
              total: nextItems.reduce((s, it) => s + (it.price * it.quantity), 0)
            });
          }
          // Don't block the UI; the local cart still works. Optionally set a flag for retry.
        }
      })();
    }

    // Keep API compatible: return a resolved promise so callers can await
    return Promise.resolve(null);
  };

  const removeItem = async (productId) => {
    // Compute next items snapshot so we can persist to server immediately
    const nextItems = state.items.filter(item => item.id !== productId);

    // Update local UI state immediately
    dispatch({ type: 'REMOVE_ITEM', payload: productId });

    // Try to persist change to backend (if there's a pending order)
    (async () => {
      try {
        const pending = localStorage.getItem('pendingOrderId');
        if (pending) {
          // If cart is now empty, delete the pending order instead of sending an empty update
          if (!nextItems || nextItems.length === 0) {
            try {
              await orderService.deleteOrder(pending);
              localStorage.removeItem('pendingOrderId');
            } catch (delErr) {
              console.warn('Failed to delete pending order after cart emptied', delErr);
            }
          } else {
            // Try to delete single item server-side if order exists
            try {
              const pid = Number(productId);
              await orderService.deleteOrderItem(pending, pid);
            } catch (singleDelErr) {
              // Fallback to updating the whole order items list
              const normalized = nextItems.map(i => ({
                productId: Number(i.id ?? i._id ?? i.productId ?? 0),
                quantity: Number(i.quantity) || 1,
                unitPrice: i.price != null ? String(i.price) : '0'
              }));
              console.debug('Updating order items after remove for pendingOrderId', pending, normalized);
              await orderService.updateOrderItems(pending, normalized);
            }
          }
        } else {
          // No pending order yet; nothing to persist (will be created on checkout/add)
        }
      } catch (e) {
        console.warn('updateOrderItems failed on remove, will retry on next operation', e);
        // Clear the stale pendingOrderId so a fresh order can be created on next operation if needed
        try { localStorage.removeItem('pendingOrderId'); } catch (ee) {}
        
        try {
          const notifyModule = await import('../lib/notify');
          const showError = notifyModule.showError || notifyModule.default?.showError || (() => {});
          showError('Cart sync temporarily unavailable; changes saved locally.');
        } catch (nerr) {
          // ignore notify errors
        }
      }
    })();
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    
    // Update local state immediately for responsive UI
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
    
    // Sync with backend database
    try {
      const pendingOrderId = localStorage.getItem('pendingOrderId');
      if (pendingOrderId) {
        // Update the pending order in the database with complete item data including unitPrice
        const updatedItems = state.items.map(item => ({
          productId: item.id,
          quantity: item.id === productId ? quantity : item.quantity,
          unitPrice: item.price || 0  // Include unitPrice so backend can calculate total correctly
        }));
        
        // Update the pending order items (backend will recalculate total automatically)
        if (import.meta.env.DEV) {
          console.log('🔄 Updating order items with unitPrice:', { orderId: pendingOrderId, items: updatedItems });
        }
        
        await orderService.updateOrderItems(pendingOrderId, updatedItems);
        
        if (import.meta.env.DEV) {
          console.log('✅ Quantity updated in database:', { productId, quantity, orderId: pendingOrderId });
        }
      } else {
        if (import.meta.env.DEV) {
          console.log('ℹ️ No pending order to update, quantity change is local only');
        }
      }
    } catch (error) {
      console.error('Failed to sync quantity update with backend:', error);
      // Keep the local change even if backend sync fails
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

  // Simple function to refresh cart with complete data from backend
  const refreshCartFromBackend = async () => {
    if (state.items.length === 0) return;
    
    try {
      // Try to get complete cart data from backend orders
      const { orderService } = await import('../lib/api');
      const ordersResp = await orderService.getUserOrders();
      const orders = ordersResp?.data || ordersResp;
      
      if (Array.isArray(orders) && orders.length > 0) {
        const pendingOrders = orders.filter(o => o && o.status && String(o.status).toLowerCase() === 'pending');
        
        if (pendingOrders.length > 0) {
          const merged = new Map();
          for (const ord of pendingOrders) {
            const items = ord.items || ord.orderItems || [];
            for (const it of (items || [])) {
              const id = it.productId || it.product_id || it.product || 0;
              const quantity = Number(it.quantity || it.qty || 0) || 0;
              // Prefer productPrice from JOINs over unitPrice from order items (which might be 0)
              const unitPriceRaw = it.unitPrice || it.unit_price || it.price || 0;
              const productPriceRaw = it.productPrice || 0;
              const priceRaw = productPriceRaw || unitPriceRaw;
              const price = Number((priceRaw && priceRaw.toString && priceRaw.toString()) || priceRaw) || 0;
              const name = it.productName || it.name || '';
              const images = it.productImages || it.images || '';
              const brand = it.productBrand || it.brand || '';
              const description = it.productDescription || it.description || '';
              const category = it.productCategory || it.category || '';
              const stockQuantity = it.productStockQuantity !== undefined ? it.productStockQuantity : (it.stockQuantity !== undefined ? it.stockQuantity : undefined);
              
              if (!id || quantity <= 0) continue;
              const key = String(id);
              if (!merged.has(key)) {
                merged.set(key, { 
                  id, quantity, price, name, images, brand, description, category, stockQuantity 
                });
              } else {
                merged.get(key).quantity += quantity;
              }
            }
          }
          
          const enrichedItems = Array.from(merged.values());
          if (enrichedItems.length > 0) {
            dispatch({ type: 'LOAD_CART', payload: enrichedItems });
            localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(enrichedItems));
            
            if (import.meta.env.DEV) {
              console.log('✅ Cart refreshed with complete backend data:', enrichedItems);
              // Debug pricing issues
              const zeroPrice = enrichedItems.filter(item => item.price === 0);
              if (zeroPrice.length > 0) {
                console.log('⚠️ Items with zero price found:', zeroPrice);
              }
            }
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('ℹ️ Could not refresh cart from backend, keeping localStorage data:', error.message);
      }
      
      // Fallback: If backend order data fails, try to enrich prices from products API
      try {
        const { productService } = await import('../lib/api');
        const itemsNeedingPrices = state.items.filter(item => !item.price || item.price === 0);
        
        if (itemsNeedingPrices.length > 0) {
          if (import.meta.env.DEV) {
            console.log('🔄 Trying to get prices directly from products API for:', itemsNeedingPrices.map(i => i.id));
          }
          
          const pricePromises = itemsNeedingPrices.map(async item => {
            try {
              const productResp = await productService.getProductById(item.id);
              const product = productResp?.data;
              return { 
                id: item.id, 
                price: product?.price || 0,
                stockQuantity: product?.stockQuantity !== undefined ? product.stockQuantity : undefined,
                name: product?.name || item.name,
                images: product?.images || item.images,
                brand: product?.brand || item.brand
              };
            } catch (e) {
              return { id: item.id, price: 0 };
            }
          });
          
          const priceResults = await Promise.all(pricePromises);
          const enrichmentMap = new Map(priceResults.map(r => [r.id, r]));
          
          const updatedItems = state.items.map(item => {
            const enrichment = enrichmentMap.get(item.id);
            if (enrichment) {
              return {
                ...item,
                price: enrichment.price || item.price,
                stockQuantity: enrichment.stockQuantity !== undefined ? enrichment.stockQuantity : item.stockQuantity,
                name: enrichment.name || item.name,
                images: enrichment.images || item.images,
                brand: enrichment.brand || item.brand
              };
            }
            return item;
          });
          
          dispatch({ type: 'LOAD_CART', payload: updatedItems });
          localStorage.setItem(STORAGE_KEYS.CART_ITEMS, JSON.stringify(updatedItems));
          
          if (import.meta.env.DEV) {
            console.log('✅ Updated cart with direct product prices:', updatedItems);
          }
        }
      } catch (fallbackError) {
        if (import.meta.env.DEV) {
          console.log('⚠️ Fallback price fetching also failed:', fallbackError.message);
        }
      }
    }
  };

  const value = {
    items: state.items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    refreshCartFromBackend
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