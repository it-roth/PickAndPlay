import { Card, Button, Toast, ToastContainer, Badge, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { getImageUrl, scrollToTop } from '../lib/utils';
import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';
import '../assets/styles/ProductCard.css';


function ProductCard({ product, showShortDesc = false }) {
  const [showToast, setShowToast] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    // Scroll to top with smooth behavior before navigation
    scrollToTop();
  };

  const [showQuickView, setShowQuickView] = useState(false);

  const openQuickView = (e) => {
    // prevent link navigation behavior when overlay was a Link
    e && e.preventDefault();
    setShowQuickView(true);
  };

  const closeQuickView = () => setShowQuickView(false);

  const addToCart = () => {
    const token = localStorage.getItem('token');
    // If user is not logged in, redirect to login and save pending action
    if (!token) {
      // Save minimal pending action to session so it can be resumed after login
      try {
        sessionStorage.setItem('pendingCartAction', JSON.stringify({ productId: product.id, qty: 1 }));
      } catch (e) {
        // ignore sessionStorage errors
      }
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    // Get existing cart or initialize empty array
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if product already exists in cart
    const existingItem = cart.find(item => String(item.id ?? item._id) === String(product.id ?? product._id));

    if (existingItem) {
      // Increase quantity if product exists
      existingItem.quantity = (existingItem.quantity || 0) + 1;
    } else {
      // Add new product with quantity 1
      cart.push({
        ...product,
        quantity: 1
      });
    }

    // Save updated cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // Show toast notification
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    // Notify other parts of the app (navbar) about cart change
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  // Return early if no product data
  if (!product) {
    return null;
  }

  const { tProduct, t } = useContext(LocaleContext) || {};

  const displayName = tProduct(product, 'name') || product.name;

  return (
    <div className="product-card">
      {/* Image Section with Overlay Effects */}
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

      {/* Content Section */}
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

        {/* Rating Section */}
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

        {/* Price Section */}
        <PriceSection product={product} />

        {/* Action Buttons */}
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
          <Button className="btn-add-cart" onClick={addToCart}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="btn-text">{t('addToCart')}</span>
          </Button>
        </div>
      </div>

      {/* Enhanced Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-content">
            <div className="toast-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className="toast-text">
              <strong>Added to Cart!</strong>
                <p>{displayName}</p>
            </div>
          </div>
          <div className="toast-progress"></div>
        </div>
      )}
      {/* Quick View Modal */}
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
            <p className="text-muted">{tProduct(product, 'shortDescription') || tProduct(product, 'description') || product.shortDescription || product.description}</p>
            <div className="d-flex gap-2 mt-3">
              <Button variant="primary" as={Link} to={`/product/${product.id}`} onClick={() => { closeQuickView(); handleDetailsClick(); }}>{t('details')}</Button>
              <Button variant="outline-primary" onClick={addToCart}>{t('addToCart')}</Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default ProductCard;

/* Small extracted PriceSection that consumes LocaleContext so price formatting
   and conversion are centralized for product card and quick-view. */
function PriceSection({ product }){
  // useContext must be called at the top level of the component (rules of hooks)
  const ctx = useContext(LocaleContext) || {};

  // Defensive fallbacks in case provider isn't present or doesn't expose the helpers
  const currency = ctx.currency || 'USD';
  const convert = typeof ctx.convertPrice === 'function' ? ctx.convertPrice : (v) => parseFloat(v) || 0;
  const t = typeof ctx.t === 'function' ? ctx.t : (k) => (k === 'inStock' ? 'In Stock' : k);

  const value = convert(product.price);
  const old = product.oldPrice ? convert(product.oldPrice) : null;

  const formatted = new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  const formattedOld = old ? new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(old) : null;

  return (
    <div className="product-price-section">
      <div className="price-wrapper">
        <span className="current-price">{formatted}</span>
        {formattedOld && (<span className="old-price">{formattedOld}</span>)}
      </div>
      <div className="stock-status in-stock">
        <span className="status-dot"></span>
        {t('inStock')}
      </div>
    </div>
  );
}