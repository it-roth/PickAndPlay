import { Card, Button, Toast, ToastContainer, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getImageUrl, scrollToTop } from '../lib/utils';
import { authService } from '../lib/api';
import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';
import { CartContext } from '../contexts/CartContext';
import { showSuccess, showError } from '../lib/notify';
import '../assets/styles/ProductCard.css';


function ProductCard({ product, showShortDesc = false }) {
  const [isAdding, setIsAdding] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    scrollToTop();
  };

  const [showQuickView, setShowQuickView] = useState(false);

  const openQuickView = (e) => {
    e && e.preventDefault();
    setShowQuickView(true);
  };

  const closeQuickView = () => setShowQuickView(false);

  const { addItem } = useContext(CartContext);

  const addToCart = async () => {
    // Check stock before attempting to add
    if (product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0) {
      try {
        showError(`${displayName} is out of stock`);
      } catch (e) {
        alert(`${displayName} is out of stock`);
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      try {
        sessionStorage.setItem('pendingCartAction', JSON.stringify({ productId: product.id, qty: 1 }));
      } catch (e) {
        console.error('sessionStorage error:', e);
      }
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (typeof addItem !== 'function') {
      console.error('CartContext.addItem is not available');
      try {
        const { showError } = await import('../lib/notify').then(m => m.default ? m.default : m);
        showError('Unable to add to cart right now. Please try again.');
      } catch (e) {
        alert('Unable to add to cart right now. Please try again.');
      }
      return;
    }

    try {
      let userData = null;
      try { userData = JSON.parse(localStorage.getItem('userData') || 'null'); } catch (e) { userData = null; }
      let role = userData?.role;
      if (!role) {
        try {
          const me = await authService.getCurrentUser();
          role = me?.data?.role;
        } catch (e) {
          console.warn('Failed to get user role:', e);
        }
      }
      if (role && String(role).toLowerCase().includes('admin')) {
        try { showError('Admin accounts cannot place orders. Redirecting to dashboard.'); } catch (e) {}
        navigate('/admin/dashboard');
        return;
      }
      if (role && !String(role).toLowerCase().includes('user')) {
        try { showError('Only customer accounts can place orders.'); } catch (e) {}
        return;
      }

    } catch (e) {
      console.warn('Role check failed, allowing add to cart by default', e);
    }

    setIsAdding(true);
    try {
      const res = addItem(product);
      if (res && typeof res.then === 'function') {
        await res;
      }

      try {
        console.debug('ProductCard: calling showSuccess for', displayName);
        let fallbackTimer = setTimeout(() => {
          try {
            console.warn('showSuccess did not display quickly; triggering fallback globalAddToCart');
            window.dispatchEvent(new CustomEvent('globalAddToCart', { detail: {
              image: getImageUrl(product.images),
              title: 'Added to cart',
              sub: displayName
            } }));
          } catch (ev) {}
        }, 600);

        await showSuccess(`${displayName} added to cart`);
        clearTimeout(fallbackTimer);
        console.debug('ProductCard: showSuccess completed for', displayName);
      } catch (e) {
        console.error('showSuccess failed:', e);
        try {
          window.dispatchEvent(new CustomEvent('globalAddToCart', { detail: {
            image: getImageUrl(product.images),
            title: 'Added to cart',
            sub: displayName
          } }));
        } catch (ev) {
          alert(`${displayName} added to cart`);
        }
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
      try {
        const { showError } = await import('../lib/notify').then(m => m.default ? m.default : m);
        showError('Failed to add item to cart. Please try again.');
      } catch (e) {
        alert('Failed to add item to cart. Please try again.');
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (!product) {
    return null;
  }

  const { tProduct, t } = useContext(LocaleContext) || {};

  const displayName = tProduct(product, 'name') || product.name;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <div className="product-image-container">
          {product.images && !imageError ? (
            <>
              <img
                src={getImageUrl(product.images)}
                alt={product.name}
                loading="lazy"
                className={`product-image ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => {
                  setImageLoaded(true);
                  import('../lib/logger').then(({ default: logger }) => logger.debug('Image loaded successfully for:', product.name));
                }}
                onError={(e) => {
                  import('../lib/logger').then(({ default: logger }) => logger.warn('Image failed to load for:', product.name, 'URL:', e.target?.src));
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
              {!imageLoaded && (
                <div className="image-skeleton">
                  <div className="skeleton-shimmer"></div>
                </div>
              )}
            </>
          ) : (
            <div className="no-image-placeholder">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>No Image</span>
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {product.discount && (
          <div className="discount-badge">-{product.discount}%</div>
        )}
      </div>

      <div className="product-content">
        <div className="product-header">
          {product.brand && (
            <span className="brand-badge">{product.brand}</span>
          )}
          <h3 className="product-title">{displayName}</h3>
        </div>

        {showShortDesc && (product.shortDescription || product.description) && (
          <p className="product-short-desc text-muted" style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
            {((product.shortDescription || product.description) || '').slice(0, 120).replace(/<[^>]+>/g, '')}{((product.shortDescription || product.description) || '').length > 120 ? '…' : ''}
          </p>
        )}

        <div className="product-rating">
          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span className="rating-count">(128)</span>
        </div>

        <PriceSection product={product} />

        <div className="product-actions">
          <Button 
            as={Link} 
            to={`/product/${product.id}`} 
            className="btn-details"
            variant="outline-secondary"
            onClick={handleDetailsClick}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="btn-text">{t('details')}</span>
          </Button>
          
          {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0 ? (
            <Button className="btn-add-cart" disabled style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', cursor: 'not-allowed' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="btn-text">Out of Stock</span>
            </Button>
          ) : (
            <Button className="auth-link-cta btn-add-cart" onClick={addToCart} disabled={isAdding}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {isAdding ? (
                <span className="btn-text"><span className="btn-spinner" aria-hidden></span> Adding...</span>
              ) : (
                <span className="btn-text">{t('addToCart')}</span>
              )}
            </Button>
          )}
        </div>
      </div>

      <Modal show={showQuickView} onHide={closeQuickView} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{displayName}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="d-flex flex-column flex-md-row align-items-center gap-3">
          <div className="quickview-image-wrapper" style={{flex:'0 0 320px', display:'flex', justifyContent:'center'}}>
            {product.images && !imageError ? (
              <img src={getImageUrl(product.images)} alt={product.name} className="quickview-image" />
            ) : (
              <div className="no-image-placeholder" style={{width:320, height:240}}>No Image</div>
            )}
          </div>
          <div style={{flex:1}}>
            <h5 className="mb-2">${product.price?.toFixed(2)}</h5>
            {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0 && (
              <div className="alert alert-danger mb-2" role="alert">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                Out of Stock
              </div>
            )}
            <p className="text-muted">{tProduct(product, 'shortDescription') || tProduct(product, 'description') || product.shortDescription || product.description}</p>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" as={Link} to={`/product/${product.id}`} onClick={() => { closeQuickView(); handleDetailsClick(); }}>{t('details')}</Button>
              {product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0 ? (
                <Button variant="danger" disabled>
                  <i className="bi bi-x-circle me-1"></i>
                  Out of Stock
                </Button>
              ) : (
                <Button className="auth-link-cta" onClick={addToCart}>{t('addToCart')}</Button>
              )}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ProductCard;

function PriceSection({ product }){
  const ctx = useContext(LocaleContext) || {};

  const currency = ctx.currency || 'USD';
  const convert = typeof ctx.convertPrice === 'function' ? ctx.convertPrice : (v) => parseFloat(v) || 0;
  const t = typeof ctx.t === 'function' ? ctx.t : (k) => (k === 'inStock' ? 'In Stock' : k);

  const value = convert(product.price);
  const old = product.oldPrice ? convert(product.oldPrice) : null;

  const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  const formattedOld = old ? new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(old) : null;

  const isOutOfStock = product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity <= 0;
  const isLowStock = product.stockQuantity !== undefined && product.stockQuantity !== null && product.stockQuantity > 0 && product.stockQuantity < 5;

  return (
    <div className="product-price-section">
      <div className="price-wrapper">
        <span className="current-price">{formatted}</span>
        {formattedOld && (<span className="old-price">{formattedOld}</span>)}
      </div>
      {isOutOfStock ? (
        <div className="stock-status out-of-stock" style={{ color: '#dc3545' }}>
          <span className="status-dot" style={{ backgroundColor: '#dc3545' }}></span>
          Out of Stock
        </div>
      ) : isLowStock ? (
        <div className="stock-status low-stock" style={{ color: '#ffc107' }}>
          <span className="status-dot" style={{ backgroundColor: '#ffc107' }}></span>
          Only {product.stockQuantity} left
        </div>
      ) : (
        <div className="stock-status in-stock">
          <span className="status-dot"></span>
          {t('inStock')}
        </div>
      )}
    </div>
  );
}