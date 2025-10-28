import { useState, useEffect, useContext, useRef, useMemo } from 'react';
import { Container, Row, Col, Button, Image, Form, ListGroup, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../lib/api';
import Swal from 'sweetalert2';
// KHQR is scan-only by default. Legacy manual/quick-confirm buttons removed.
import { getImageUrl } from '../lib/utils';
import { LocaleContext } from '../contexts/LocaleContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeCanvas } from 'qrcode.react';
import BakongImg from '../assets/images/bakong.png';
import LogoImg from '../assets/images/Logo.png';

function Cart() {
  // Image component with fallback
  function ImageWithFallback({ src, alt, ...props }) {
    const [errored, setErrored] = useState(false);

    if (import.meta.env.DEV && (errored || !src)) {
      console.log(`🚫 ImageWithFallback - Image not showing for ${alt}:`, {
        src,
        errored,
        reason: !src ? 'No src provided' : 'Image failed to load'
      });
    }

    if (!src || errored) {
      return (
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '100px',
            background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)',
          }}
        >
          <i className="bi bi-image fs-3" style={{ color: '#ff8533' }}></i>
        </div>
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        fluid
        rounded
        loading="lazy"
        onError={(e) => {
          if (import.meta.env.DEV) {
            console.log(`❌ Image failed to load for ${alt}:`, {
              src,
              error: e,
              naturalWidth: e.target?.naturalWidth,
              naturalHeight: e.target?.naturalHeight
            });
          }
          setErrored(true);
        }}
        onLoad={(e) => {
          if (import.meta.env.DEV) {
            console.log(`✅ Image loaded successfully for ${alt}:`, {
              src,
              naturalWidth: e.target?.naturalWidth,
              naturalHeight: e.target?.naturalHeight
            });
          }
        }}
        style={{ objectFit: 'cover', height: '100%' }}
        {...props}
      />
    );
  }

  const { items: cartItems, updateQuantity: updateCartQuantity, removeItem: removeCartItem, clearCart, refreshCartFromBackend } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Refresh cart with complete backend data if images or stock data are missing
  useEffect(() => {
    if (cartItems.length > 0) {
      const needsComplete = cartItems.some(item =>
        !item.images || !item.name || item.stockQuantity === undefined || item.stockQuantity === null
      );
      if (needsComplete && refreshCartFromBackend) {
        if (import.meta.env.DEV) {
          console.log('🔄 Cart items missing complete data (images, name, or stock), refreshing from backend');
        }
        refreshCartFromBackend();
      }
    }
  }, [cartItems.length, refreshCartFromBackend]);

  const [shipping, setShipping] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    paymentMethod: 'khqr',
  });
  const [khqrData, setKhqrData] = useState(null);
  const [khqrPollingTimer, setKhqrPollingTimer] = useState(null);
  const [khqrPollingCount, setKhqrPollingCount] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState(null);
  // Auto-scan / auto-callback state (one-shot 10s auto-callback for dev/demo)
  const [autoRemaining, setAutoRemaining] = useState(0);
  const AUTO_DURATION = 5; // seconds (one-shot)
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [lastAutoOrderId, setLastAutoOrderId] = useState(null);
  // Prevent duplicate checkout submissions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  // Auto-scan is enabled by default for dev/demo; we keep the one-shot behavior
  // always enabled for the flow you requested. Remove manual dev-toggle/test UI.
  const [autoScanEnabled] = useState(true);

  const sseRef = useRef(null);
  const autoTimerRef = useRef(null);
  const notifiedOrdersRef = useRef(new Set()); // Track which orders have been notified
  const navigate = useNavigate();

  // Compute subtotal from cart items (memoized)
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cartItems]);

  // Helper function to send Telegram notification only once per order
  const sendTelegramNotification = (orderId) => {
    if (!orderId || notifiedOrdersRef.current.has(orderId)) {
      return; // Already notified or no order ID
    }
    notifiedOrdersRef.current.add(orderId);
    try {
      orderService.notifyTelegram(orderId).catch((err) => {
        if (import.meta.env.DEV) console.warn('notifyTelegram failed', err);
      });
    } catch (err) {
      if (import.meta.env.DEV) console.warn('notifyTelegram invocation failed', err);
    }
  };

  useEffect(() => {
    return () => {
      if (khqrPollingTimer) {
        clearInterval(khqrPollingTimer);
      }
    };
  }, [khqrPollingTimer]);


  useEffect(() => {
    if (!currentOrderId) return;
    const orderId = currentOrderId;

    try {
      // close previous if any
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      // Use explicit backend base if VITE_API_BASE not provided to avoid dev-proxy/SSE issues
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
      const url = `${apiBase}/api/orders/${orderId}/events`;
      const es = new EventSource(url);
      sseRef.current = es;
      if (import.meta.env.DEV) console.debug('Opening SSE to', url);

      es.onopen = () => { if (import.meta.env.DEV) console.debug('SSE connection opened for order', orderId); };
      es.onmessage = (m) => { if (import.meta.env.DEV) console.debug('SSE generic message', m); };

      es.addEventListener('payment', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (import.meta.env.DEV) console.debug('SSE payment event received', data);
          // basic check and success flow
          if (data && (data.status === 'success' || data.status === 'payment' || data.verified === true)) {
            // stop timers
            if (khqrPollingTimer) clearInterval(khqrPollingTimer);
            if (sseRef.current) {
              try { sseRef.current.close(); } catch (err) { }
              sseRef.current = null;
              if (import.meta.env.DEV) console.debug('Closed SSE connection after payment');
            }
            try { clearCart && clearCart(); } catch (e) { try { localStorage.removeItem('cart'); } catch (ee) { } }

            // Store current order ID for confirmation page and clear state
            const completedOrderId = currentOrderId;
            setKhqrData(null);
            setCurrentOrderId(null);

            // Navigate to confirmation page with order ID
            try {
              // notify backend to send Telegram alert (fire-and-forget, once per order)
              sendTelegramNotification(completedOrderId);

              if (completedOrderId) {
                navigate(`/order-confirmation?orderId=${completedOrderId}`);
              } else {
                navigate('/order-confirmation');
              }
            } catch (e) {
              if (import.meta.env.DEV) console.warn('Navigation failed after payment', e);
            }
            // Ensure custom Swal styles are injected once
            if (!document.getElementById('swal-custom-styles')) {
              const style = document.createElement('style');
              style.id = 'swal-custom-styles';
              style.innerHTML = `
                .swal-glass-popup {
                  background: rgba(255,255,255,0.85) !important;
                  backdrop-filter: blur(8px) !important;
                  -webkit-backdrop-filter: blur(8px) !important;
                  border-radius: 12px !important;
                  padding: 26px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  min-height: 420px !important;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.18) !important;
                }
                .swal-title-custom {
                  font-size: 1.6rem !important;
                  margin-bottom: 6px !important;
                }
                .swal-html-custom {
                  font-size: 1rem !important;
                  color: #495057 !important;
                  text-align: center !important;
                }
                @media (max-width: 576px) {
                  .swal-glass-popup { min-height: 380px !important; padding: 18px !important; }
                }
              `;
              document.head.appendChild(style);
            }

            Swal.fire({
              title: 'Payment Successful',
              html: 'Payment completed successfully — thank you!',
              imageUrl: LogoImg,
              imageWidth: 96,
              imageHeight: 96,
              imageAlt: 'Logo',
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              allowOutsideClick: false,
              backdrop: 'rgba(255, 255, 255, 1)',
              background: 'transparent',
              width: '360px',
              heightAuto: false,
              customClass: {
                popup: 'swal-glass-popup',
                title: 'swal-title-custom',
                htmlContainer: 'swal-html-custom'
              }
            });
          }
        } catch (err) {
          if (import.meta.env.DEV) console.warn('Failed to parse SSE payment event', err);
        }
      });

      es.onerror = (err) => {
        // on error close and cleanup
        if (import.meta.env.DEV) console.warn('SSE connection error for order', orderId, err);
        try { es.close(); } catch (e) { }
        sseRef.current = null;
      };
    } catch (err) {
      if (import.meta.env.DEV) console.warn('SSE subscribe failed', err);
    }

    return () => {
      if (sseRef.current) {
        try { sseRef.current.close(); } catch (e) { }
        sseRef.current = null;
      }
    };
  }, [currentOrderId]);

  const hasKhqr = Boolean(khqrData);
  useEffect(() => {
    // If KHQR removed, clear any running timer and reset trigger
    if (!hasKhqr) {
      try { if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; } } catch (e) { }
      setAutoRemaining(0);
      setAutoTriggered(false);
      return;
    }

    // Determine an order id snapshot. Prefer explicit currentOrderId, fallback to khqrData.orderId
    const resolvedOrderId = currentOrderId || (khqrData && khqrData.orderId) || null;
    if (!resolvedOrderId) {
      return;
    }

    // If we already started auto for this order, do nothing
    if (autoTriggered || lastAutoOrderId === resolvedOrderId) {
      return;
    }

    // Only run in dev when autoScanEnabled is true
    if (!import.meta.env.DEV || !autoScanEnabled) {
      return;
    }

    // Start timer
    let remaining = AUTO_DURATION;
    setAutoRemaining(remaining);
    setAutoTriggered(true);
    setLastAutoOrderId(resolvedOrderId);

    // Capture a snapshot of khqrData so payload is stable
    const khqrSnapshot = { ...(khqrData || {}) };

    const tick = () => {
      remaining -= 1;
      setAutoRemaining(remaining);
      if (remaining <= 0) {
        try { if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; } } catch (e) { }
        setAutoRemaining(0);

        (async () => {
          const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
          const payload = {
            orderId: resolvedOrderId,
            qrString: (khqrSnapshot.qrString || khqrSnapshot.qr) || '',
            transactionRef: 'auto-dev-' + Date.now(),
            amount: khqrSnapshot.amount || (subtotal + shipping),
            currency: khqrSnapshot.currency || 'USD'
          };
          try {
            const url = `${apiBase}/api/bakong/scan`;
            const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            // ignore response body; SSE or polling will confirm
          } catch (err) {
            if (import.meta.env.DEV) console.warn('Auto callback failed', err);
          } finally {
            try { if (khqrPollingTimer) clearInterval(khqrPollingTimer); } catch (e) { }
            try { if (sseRef.current) { sseRef.current.close(); sseRef.current = null; } } catch (e) { }
            try { clearCart && clearCart(); } catch (e) { try { localStorage.removeItem('cart'); } catch (ee) { } }

            const completedOrderId = currentOrderId;
            setKhqrData(null);
            setCurrentOrderId(null);
            try {
              // notify backend to send Telegram alert (fire-and-forget, once per order)
              sendTelegramNotification(completedOrderId);

              if (completedOrderId) {
                navigate(`/order-confirmation?orderId=${completedOrderId}`);
              } else {
                navigate('/order-confirmation');
              }
            } catch (e) { }
            // Ensure custom Swal styles are injected once
            if (!document.getElementById('swal-custom-styles')) {
              const style = document.createElement('style');
              style.id = 'swal-custom-styles';
              style.innerHTML = `
                .swal-glass-popup {
                  background: rgba(255,255,255,0.85) !important;
                  backdrop-filter: blur(8px) !important;
                  -webkit-backdrop-filter: blur(8px) !important;
                  border-radius: 12px !important;
                  padding: 26px !important;
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: center !important;
                  align-items: center !important;
                  min-height: 420px !important;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.18) !important;
                }
                .swal-title-custom {
                  font-size: 1.6rem !important;
                  margin-bottom: 6px !important;
                }
                .swal-html-custom {
                  font-size: 1rem !important;
                  color: #495057 !important;
                  text-align: center !important;
                }
                @media (max-width: 576px) {
                  .swal-glass-popup { min-height: 380px !important; padding: 18px !important; }
                }
              `;
              document.head.appendChild(style);
            }

            Swal.fire({
              title: 'Payment Successful',
              html: 'We received the confirmation from the bank. Thank you — your payment is complete.',
              imageUrl: LogoImg,
              imageWidth: 96,
              imageHeight: 96,
              imageAlt: 'Logo',
              timer: 5000,
              timerProgressBar: true,
              showConfirmButton: false,
              allowOutsideClick: false,
              backdrop: 'rgba(102,126,234,0.35)',
              background: 'transparent',
              width: '360px',
              heightAuto: false,
              customClass: {
                popup: 'swal-glass-popup',
                title: 'swal-title-custom',
                htmlContainer: 'swal-html-custom'
              }
            });
          }
        })();
      }
    };

    if (!autoTimerRef.current) {
      autoTimerRef.current = setInterval(tick, 1000);
    }

    return () => {
      // leave running timer until KHQR removed or order changes
    };
  }, [Boolean(khqrData), currentOrderId, autoScanEnabled]);


  const { currency, convertPrice, tProduct } = useContext(LocaleContext);

  const handleUpdateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    // Check if the item has stock information
    const item = cartItems.find(i => i.id === id);
    if (item && item.stockQuantity !== undefined && item.stockQuantity !== null) {
      // Don't allow quantity to exceed available stock
      if (newQuantity > item.stockQuantity) {
        // Show error message
        import('../lib/notify').then(({ showError }) => {
          showError(`Only ${item.stockQuantity} item${item.stockQuantity !== 1 ? 's' : ''} available in stock`);
        });
        return;
      }
    }

    updateCartQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id) => {
    removeCartItem(id);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e && e.preventDefault && e.preventDefault();

    // prevent duplicate rapid submissions
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    if (!cartItems || cartItems.length === 0) {
      alert('Your cart is empty. Add items before checking out.');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    try {
      // Clear any previous KHQR data and order state to ensure clean checkout
      setKhqrData(null);
      setCurrentOrderId(null);
      if (khqrPollingTimer) {
        try { clearInterval(khqrPollingTimer); } catch (e) { }
        setKhqrPollingTimer(null);
      }

      // populate customerName from stored user if available
      let customerName = 'Guest Customer';
      try {
        const ud = localStorage.getItem('userData');
        if (ud) {
          const parsed = JSON.parse(ud);
          customerName = parsed?.name || parsed?.fullName || parsed?.username || customerName;
        }
      } catch (e) { }

      // Check if we have an existing pending order to reuse
      const existingPendingOrderId = localStorage.getItem('pendingOrderId');
      let orderId;

      if (existingPendingOrderId) {
        // Try to reuse the existing pending order
        try {
          const existingOrderResponse = await orderService.getOrderById(existingPendingOrderId);
          const existingOrder = existingOrderResponse?.data || existingOrderResponse;

          if (existingOrder && existingOrder.status === 'pending') {
            // Update the existing order with final checkout details
            orderId = existingOrder.id;

            // Update order items to ensure they match current cart
            const normalizedItems = cartItems.map(item => ({
              productId: Number(item.id),
              quantity: Number(item.quantity),
              unitPrice: String(item.price || 0)
            }));

            try {
              await orderService.updateOrderItems(orderId, normalizedItems);
              if (import.meta.env.DEV) console.debug('Reusing existing pending order:', orderId);
            } catch (err) {
              // If backend returns a 400 (e.g., insufficient stock), surface it to the user and abort checkout
              try {
                if (err && err.response && err.response.status === 400 && err.response.data && err.response.data.message) {
                  const notifyModule = await import('../lib/notify');
                  const showError = notifyModule.showError || notifyModule.default?.showError || (() => { });
                  await showError(err.response.data.message);
                  isSubmittingRef.current = false;
                  setIsSubmitting(false);
                  return;
                }
              } catch (nerr) {
                // ignore notify failures
              }
              throw err; // fall back to creating a new order as before
            }
          } else {
            throw new Error('Existing order not found or not pending');
          }
        } catch (e) {
          if (import.meta.env.DEV) console.warn('Failed to reuse pending order, creating new one:', e);
          // Fall back to creating a new order
          orderId = null;
        }
      }

      // If we couldn't reuse an existing order, create a new one
      if (!orderId) {
        const orderData = {
          customerName,
          shippingAddress: "Pick up at store",
          totalAmount: subtotal + shipping,
          paymentMethod: checkoutForm.paymentMethod,
          items: cartItems.map(item => ({
            productId: item.id,
            quantity: item.quantity
          }))
        };

        try {
          const orderResponse = await orderService.placeOrder(orderData);
          orderId = orderResponse.data.id;
          if (import.meta.env.DEV) console.debug('Created new order:', orderId);
        } catch (err) {
          // Handle 400 from backend (e.g., insufficient stock)
          if (err && err.response && err.response.status === 400 && err.response.data && err.response.data.message) {
            try {
              const notifyModule = await import('../lib/notify');
              const showError = notifyModule.showError || notifyModule.default?.showError || (() => { });
              await showError(err.response.data.message);
            } catch (nerr) {
              // ignore notify errors
            }
            isSubmittingRef.current = false;
            setIsSubmitting(false);
            return;
          }
          throw err;
        }
      }

      // Clear the pending order ID since we now have a confirmed checkout order
      try {
        localStorage.removeItem('pendingOrderId');
      } catch (e) {
        // ignore localStorage errors
      }

      if (checkoutForm.paymentMethod === 'khqr') {
        const khqrResponse = await orderService.generateKhqrCode(orderId, subtotal + shipping);
        // defensive: some environments or proxies may wrap the response differently
        const payload = khqrResponse?.data || khqrResponse;
        // Ensure the payload always includes the correct orderId
        const khqrDataWithOrderId = { ...payload, orderId: orderId };
        if (import.meta.env.DEV) console.debug('KHQR response payload:', khqrDataWithOrderId);
        setKhqrData(khqrDataWithOrderId);
        // Open SSE subscription for this order so we receive payment events in real-time
        setCurrentOrderId(orderId);

        // Immediately fetch current status once to pick up any payments that may have occurred
        try {
          const initialStatus = await orderService.getKhqrPaymentStatus(orderId);
          if (import.meta.env.DEV) console.debug('Initial KHQR status for', orderId, initialStatus?.data || initialStatus);
          if (initialStatus && initialStatus.data && initialStatus.data.collected !== undefined) {
            setKhqrData(prev => ({ ...(prev || {}), collected: initialStatus.data.collected, total: initialStatus.data.total, payments: initialStatus.data.payments || [] }));
            if (initialStatus.data.status === 'complete' || initialStatus.data.status === 'completed') {
              // close subscription and navigate
              if (khqrPollingTimer) clearInterval(khqrPollingTimer);
              const completedOrderId = orderId;
              setCurrentOrderId(null);
              try { clearCart && clearCart(); } catch (e) { try { localStorage.removeItem('cart'); } catch (ee) { } }
              // notify backend to send Telegram alert (fire-and-forget, once per order)
              sendTelegramNotification(completedOrderId);
              navigate(`/order-confirmation?orderId=${completedOrderId}`);
              return;
            }
          }
        } catch (err) {
          if (import.meta.env.DEV) console.warn('Initial status fetch failed', err);
        }

        // Poll every 20 seconds for payment status. Stop after MAX_POLL_COUNT attempts.
        const MAX_POLL_COUNT = 6; // ~2 minutes (6 * 20s)
        // reset polling counter
        setKhqrPollingCount(0);

        // clear any existing timer first
        if (khqrPollingTimer) {
          try { clearInterval(khqrPollingTimer); } catch (e) { }
        }

        const pollTimer = setInterval(async () => {
          try {
            const statusResponse = await orderService.getKhqrPaymentStatus(orderId);
            if (import.meta.env.DEV) console.debug('Polled KHQR status for', orderId, statusResponse?.data || statusResponse);
            // Handle multiple-payment / partial status
            const st = statusResponse.data.status;
            // If backend returns collected/total/payments, merge into khqrData so UI can show progress
            if (statusResponse.data.collected !== undefined) {
              setKhqrData(prev => ({ ...(prev || {}), collected: statusResponse.data.collected, total: statusResponse.data.total, payments: statusResponse.data.payments || [] }));
            }

            if (st === 'complete' || st === 'completed') {
              clearInterval(pollTimer);
              // ensure SSE subscription is closed
              const completedOrderId = orderId;
              setCurrentOrderId(null);
              try { clearCart && clearCart(); } catch (e) { try { localStorage.removeItem('cart'); } catch (ee) { } }
              // notify backend to send Telegram alert (fire-and-forget, once per order)
              sendTelegramNotification(completedOrderId);
              navigate(`/order-confirmation?orderId=${completedOrderId}`);
            }

            // Continue polling up to timeout; show timeout message after MAX_POLL_COUNT polls (~MAX_POLL_COUNT*20s)
            setKhqrPollingCount(prev => {
              const next = prev + 1;
              if (next >= MAX_POLL_COUNT) {
                try { clearInterval(pollTimer); } catch (e) { }
                alert('Payment timeout. Please try again.');
                return next;
              }
              return next;
            });
          } catch (error) {
            if (import.meta.env.DEV) console.error('Error checking payment status:', error);
            clearInterval(pollTimer);
          }
        }, 20000);
        setKhqrPollingTimer(pollTimer);
      } else {
        try { clearCart && clearCart(); } catch (e) { try { localStorage.removeItem('cart'); } catch (ee) { } }
        navigate('/order-confirmation');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error placing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      // keep button disabled briefly to avoid accidental double-clicks
      setTimeout(() => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }, 800);
    }
  };

  // Check if user is authenticated - cart should only be accessible to logged-in users
  if (!isAuthenticated) {
    return (
      <Container className="py-3" style={{ paddingTop: '20px', minHeight: '60vh' }}>
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)'
                }}
              >
                <i className="bi bi-person-lock" style={{ fontSize: '3.5rem', color: '#ff6600' }}></i>
              </div>
            </div>
            <h2 className="mb-3 fw-bold">Sign In Required</h2>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
              Please sign in to your account to access your shopping cart
            </p>
            <Button
              as={Link}
              to="/login"
              size="lg"
              className="border-0 fw-semibold px-5 py-3 rounded-pill me-3"
              style={{
                background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)',
                boxShadow: '0 8px 24px rgba(255, 102, 0, 0.25)',
                transition: 'all 0.3s ease',
                fontSize: '1.1rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 102, 0, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 102, 0, 0.25)';
              }}
            >
              <i className="bi bi-box-arrow-in-right me-2"></i>
              Sign In
            </Button>
            <Button
              as={Link}
              to="/shop"
              variant="outline-secondary"
              size="lg"
              className="fw-semibold px-5 py-3 rounded-pill"
              style={{ fontSize: '1.1rem' }}
            >
              <i className="bi bi-bag-heart me-2"></i>
              Continue Shopping
            </Button>
          </Col>
        </Row>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container className="py-3" style={{ paddingTop: '20px', minHeight: '60vh' }}>
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: '120px',
                  height: '120px',
                  background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)'
                }}
              >
                <i className="bi bi-cart-x" style={{ fontSize: '3.5rem', color: '#ff6600' }}></i>
              </div>
            </div>
            <h2 className="mb-3 fw-bold">Your Cart is Empty</h2>
            <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
              Discover amazing products and start adding them to your cart
            </p>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-3" style={{ paddingTop: '20px' }}>
      {/* Modern Header */}
      <div className="mb-5">
        <div className="d-flex align-items-center mb-2">
          <div
            className="rounded-3 d-inline-flex align-items-center justify-content-center me-3"
            style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)'
            }}
          >
            <i className="bi bi-cart-check-fill text-white fs-4"></i>
          </div>
          <div>
            <h1 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Shopping Cart</h1>
            <div className="d-flex align-items-center gap-3">
              <p className="text-muted mb-0">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} ready for checkout
              </p>
            </div>
          </div>
        </div>
      </div>

      <Row className="g-4">
        <Col lg={8}>
          {/* Cart Items - Modern Card Style */}
          <Card
            className="border-0 mb-4 rounded-4"
            style={{
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Card.Body className="p-0">
              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-4 ${index !== cartItems.length - 1 ? 'border-bottom' : ''}`}
                  style={{
                    transition: 'all 0.3s ease',
                    cursor: 'default',
                    borderColor: '#f0f0f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fffbf8';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <Row className="g-3 align-items-center">
                    <Col xs={4} md={3} lg={2}>
                      <div
                        className="position-relative"
                        style={{
                          height: '100px',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                        }}
                      >
                        <ImageWithFallback
                          src={getImageUrl(item.images)}
                          alt={item.name}
                        />
                      </div>
                    </Col>

                    <Col xs={8} md={5} lg={4}>
                      <Link
                        to={`/product/${item.id}`}
                        className="text-decoration-none"
                        style={{ color: '#2c3e50' }}
                      >
                        <h6 className="mb-1 fw-bold" style={{ fontSize: '1rem' }}>
                          {tProduct(item, 'name') || item.name}
                        </h6>
                      </Link>
                      {item.brand && (
                        <div className="d-flex align-items-center mt-1">
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{
                              backgroundColor: '#fff5f0',
                              color: '#ff6600',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}
                          >
                            {item.brand}
                          </span>
                        </div>
                      )}
                    </Col>

                    <Col xs={6} md={4} lg={3}>
                      <div className="d-flex flex-column align-items-center gap-1">
                        <div
                          className="d-inline-flex align-items-center rounded-pill px-2 py-2"
                          style={{
                            backgroundColor: '#fff',
                            border: '2px solid #ffe8db',
                            boxShadow: '0 2px 8px rgba(255, 102, 0, 0.08)'
                          }}
                        >
                          <Button
                            size="sm"
                            variant="link"
                            className="text-decoration-none p-0 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              color: '#ff6600',
                              width: '32px',
                              height: '32px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#fff5f0')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <i className="bi bi-dash-lg fw-bold"></i>
                          </Button>
                          <span
                            className="mx-3 fw-bold"
                            style={{
                              color: '#ff6600',
                              minWidth: '24px',
                              textAlign: 'center',
                              fontSize: '1rem'
                            }}
                          >
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="link"
                            className="text-decoration-none p-0 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              color: '#ff6600',
                              width: '32px',
                              height: '32px',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            disabled={item.stockQuantity !== undefined && item.stockQuantity !== null && item.quantity >= item.stockQuantity}
                            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#fff5f0')}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            title={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity ? `Maximum stock: ${item.stockQuantity}` : 'Increase quantity'}
                          >
                            <i className="bi bi-plus-lg fw-bold"></i>
                          </Button>
                        </div>
                        {/* Stock indicator */}
                        {item.stockQuantity !== undefined && item.stockQuantity !== null && (
                          <small
                            className="text-muted"
                            style={{
                              fontSize: '0.75rem',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.quantity >= item.stockQuantity ? (
                              <span className="text-warning">
                                <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                Max stock reached
                              </span>
                            ) : (
                              <span className="text-success">
                                <i className="bi bi-check-circle-fill me-1"></i>
                                {item.stockQuantity - item.quantity} more available
                              </span>
                            )}
                          </small>
                        )}
                      </div>
                    </Col>

                    <Col xs={6} md={12} lg={3} className="text-lg-end">
                      <div className="d-flex align-items-center justify-content-between justify-content-lg-end">
                        <div className="me-3">
                          <div className="fw-bold" style={{ color: '#ff6600', fontSize: '1.15rem' }}>
                            {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convertPrice(item.price * item.quantity))}
                          </div>
                          <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                            {item.quantity > 1 ? `${item.quantity} × ` : ''}{new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convertPrice(item.price))} each
                          </small>
                        </div>
                        <Button
                          variant="link"
                          className="text-decoration-none p-0 d-flex align-items-center justify-content-center rounded-circle"
                          onClick={() => handleRemoveItem(item.id)}
                          title="Remove item"
                          style={{
                            color: '#dc3545',
                            width: '36px',
                            height: '36px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#fff5f5';
                            e.currentTarget.style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          <i className="bi bi-trash-fill"></i>
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Payment Section */}
          {isCheckingOut && (
            <Card
              className="border-0 rounded-4"
              style={{
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
              }}
            >
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center me-3"
                    style={{
                      width: '65px',
                      height: '65px',
                    }}
                  >
                    {/* Bakong logo image */}
                    <img src={BakongImg} alt="Bakong" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  </div>
                  <h5 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Bakong Payment</h5>
                </div>

                {khqrData ? (
                  <div className="text-center py-4">
                    {/* If the backend returned no qrString, show the raw payload to help debugging */}
                    {!khqrData.qrString && (
                      <Alert variant="warning" className="mb-3">
                        <strong>KHQR response missing QR data.</strong>
                        <div style={{ whiteSpace: 'pre-wrap', textAlign: 'left', marginTop: '8px' }}>
                          {JSON.stringify(khqrData, null, 2)}
                        </div>
                      </Alert>
                    )}
                    <div
                      className="mb-4 p-3 rounded-3"
                      style={{
                        background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)',
                        border: '2px dashed #ff6600'
                      }}
                    >
                      <i className="bi bi-qr-code me-2" style={{ color: '#ff6600' }}></i>
                      <strong style={{ color: '#cc5200' }}>Scan with your banking app to complete payment</strong>
                    </div>

                    <div className="d-flex justify-content-center mb-4">
                      <div
                        className="p-4 bg-white rounded-4"
                        style={{
                          boxShadow: '0 8px 32px rgba(255, 102, 0, 0.15)',
                          border: '3px solid #ff6600'
                        }}
                      >
                        {/* Render QR if available; otherwise show the raw string value for copy/testing */}
                        <QRCodeCanvas value={khqrData.qrString || khqrData.qr || ''} size={220} />
                      </div>
                    </div>

                    <h3 className="mb-4 fw-bold" style={{ color: '#ff6600' }}>
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(khqrData.amount)}
                    </h3>

                    <div className="d-flex align-items-center justify-content-center mb-4">
                      <div className="text-center">
                        <div className="mb-2">
                          <div className="spinner-border spinner-border-sm" role="status" style={{ color: '#ff6600' }}>
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                        <div className="text-muted">
                        </div>
                        {khqrData && khqrData.payments && khqrData.payments.length > 0 && (
                          <div className="mt-3 text-start">
                            <small className="fw-bold">Recent payments:</small>
                            <ListGroup className="mt-2">
                              {khqrData.payments.map(p => (
                                <ListGroup.Item key={p.id} className="d-flex justify-content-between align-items-center">
                                  <div>
                                    <div className="fw-semibold">{p.transactionRef || ('#' + p.id)}</div>
                                    <small className="text-muted">{p.createdAt}</small>
                                  </div>
                                  <div className="fw-bold text-orange">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(p.amount || 0)}</div>
                                </ListGroup.Item>
                              ))}
                            </ListGroup>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline-secondary"
                      className="px-4 py-2 rounded-pill"
                      onClick={() => {
                        // stop polling timer
                        if (khqrPollingTimer) {
                          clearInterval(khqrPollingTimer);
                        }
                        // close SSE subscription (cleanup handled by effect)
                        setCurrentOrderId(null);
                        // reset UI state
                        setKhqrData(null);
                        setKhqrPollingTimer(null);
                        setKhqrPollingCount(0);
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Cancel Payment
                    </Button>
                    {/* Auto-success fake trigger (developer/demo feature) — no manual dev UI here. */}
                    {/* Manual confirm / legacy quick-confirm removed to make KHQR scan-only.
                        Payments should be recorded by the backend via /api/bakong/scan or /api/bakong/callback
                        and the frontend will receive real-time notification via SSE (/api/orders/{id}/events). */}
                  </div>
                ) : (
                  <Form onSubmit={handleCheckout}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-100 border-0 fw-semibold rounded-pill"
                      disabled={isSubmitting}
                      style={{
                        background: 'linear-gradient(180deg, rgba(11, 34, 64, 0.98), rgba(11, 34, 64, 1))',
                        color: '#ffffff',
                        transition: 'all 0.3s ease',
                        padding: '14px',
                        fontSize: '1.05rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';

                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <i className="bi bi-qr-code-scan me-2"></i>
                      Click for Payment QR Code
                    </Button>
                  </Form>
                )}
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Modern Order Summary */}
        <Col lg={4}>
          <Card
            className="border-0 rounded-4 sticky-top"
            style={{
              top: '100px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)'
            }}
          >
            <Card.Body className="p-4">
              <div className="d-flex align-items-center mb-4">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center me-3"
                  style={{
                    width: '42px',
                    height: '42px',
                    background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)'
                  }}
                >
                  <i className="bi bi-receipt text-white"></i>
                </div>
                <h5 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Order Summary</h5>
              </div>

              <div className="mb-3 pb-3" style={{ borderBottom: '2px solid #f8f9fa' }}>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-semibold" style={{ fontSize: '1.05rem' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Shipping</span>
                  {shipping === 0 ? (
                    <span
                      className="badge rounded-pill px-3 py-2 fw-semibold"
                      style={{
                        background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)',
                        fontSize: '0.85rem'
                      }}
                    >
                      <i className="bi bi-gift-fill me-1"></i>
                      FREE
                    </span>
                  ) : (
                    <span className="fw-semibold">${shipping.toFixed(2)}</span>
                  )}
                </div>
              </div>

              <div
                className="d-flex justify-content-between align-items-center mb-4 p-3 rounded-3"
                style={{
                  background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)'
                }}
              >
                <span className="fw-bold" style={{ fontSize: '1.15rem', color: '#2c3e50' }}>Total</span>
                <span className="fw-bold" style={{ fontSize: '1.5rem', color: '#ff6600' }}>
                  ${(subtotal + shipping).toFixed(2)}
                </span>
              </div>

              <div className="d-grid gap-2">
                {isCheckingOut ? (
                  <Button
                    variant="outline-secondary"
                    size="lg"
                    className="rounded-pill fw-semibold"
                    style={{ padding: '12px' }}
                    onClick={() => setIsCheckingOut(false)}
                  >
                    <i className="bi bi-pencil-fill me-2"></i>
                    Edit Cart
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="border-0 fw-semibold rounded-pill"
                      style={{
                        background: 'linear-gradient(135deg, #ff6600 0%, #ff8533 100%)',
                        boxShadow: '0 6px 20px rgba(255, 102, 0, 0.25)',
                        transition: 'all 0.3s ease',
                        padding: '14px',
                        fontSize: '1.05rem'
                      }}
                      onClick={() => setIsCheckingOut(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 28px rgba(255, 102, 0, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 102, 0, 0.25)';
                      }}
                    >
                      <i className="bi bi-lock-fill me-2"></i>
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline-secondary"
                      as={Link}
                      to="/shop"
                      className="rounded-pill fw-semibold"
                      style={{ padding: '12px' }}
                    >
                      <i className="bi bi-arrow-left me-2"></i>
                      Continue Shopping
                    </Button>
                  </>
                )}
              </div>

              {shipping === 0 && (
                <div
                  className="mt-3 p-3 rounded-3 text-center"
                  style={{
                    background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8db 100%)',
                    border: '2px dashed #ffd6b8'
                  }}
                >
                  <i className="bi bi-truck" style={{ fontSize: '1.5rem', color: '#ff6600' }}></i>
                  <div className="mt-2">
                    <small className="fw-semibold d-block" style={{ color: '#cc5200' }}>
                      Free Shipping Applied!
                    </small>
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Your order qualifies for free delivery
                    </small>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;