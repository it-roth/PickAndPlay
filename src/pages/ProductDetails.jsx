import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Image, Form, InputGroup, Badge } from 'react-bootstrap';
import { productService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { LocaleContext } from '../contexts/LocaleContext';
import { useCart } from '../contexts/CartContext';
import { STORAGE_KEYS } from '../lib/constants';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem, updateQuantity } = useCart();
  const { currency, convertPrice, t, tProduct } = useContext(LocaleContext);

  useEffect(() => {
    let mounted = true;
    productService.getProductById(id)
      .then(res => {
        if (!mounted) return;
        setProduct(res.data || {});
      })
      .catch(err => {
        import('../lib/logger').then(({ default: logger }) => logger.error('Failed to load product', err));
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  const addToCart = async () => {
    if (!product) return;

    // notification helpers (dynamically import when used)
    const showSuccess = async (msg) => {
      const mod = await import('../lib/notify');
      return mod.showSuccess(msg);
    };
    const showError = async (msg) => {
      const mod = await import('../lib/notify');
      return mod.showError(msg);
    };

    try {
      const cart = JSON.parse(localStorage.getItem(STORAGE_KEYS.CART_ITEMS) || '[]');
      const found = cart.find(i => String(i.id ?? i._id) === String(product.id ?? product._id));

      if (found) {
        updateQuantity(found.id, found.quantity + qty);
      } else {
        addItem({ ...product, quantity: qty });
      }
      // Single friendly confirmation (use SweetAlert2 if available)
      await showSuccess(`Added "${product.name}" (x${qty}) to your cart.`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      showError('Could not add item to cart — please try again.');
    }
  };

  if (loading) return <Container className="py-5">Loading...</Container>;
  if (!product) return (
    <Container className="py-5 text-center">
      <h2>Product not found</h2>
      <Button onClick={() => navigate('/shop')}>Back to Shop</Button>
    </Container>
  );

  const imgSrc = getImageUrl(product.images) || null;

  const stockQty = Number(product.stockQuantity ?? product.quantity ?? product.stock ?? product.count ?? 0);
  const inStock = (typeof product.inStock === 'boolean') ? product.inStock : (stockQty > 0);
  const priceValue = product ? convertPrice(product.price || 0) : 0;
  const formattedPrice = product ? new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(priceValue) : '';
  const formattedOld = (product && product.oldPrice) ? new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convertPrice(product.oldPrice)) : null;

  return (
   <Container className="py-6 shop-page-container" style={{ paddingTop: '100px' }}>
      <Row>
        <Col md={6} className="mb-4">
          {imgSrc ? (
            <div style={{ maxHeight: 420 , overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Image src={imgSrc} alt={product.name} fluid rounded style={{ maxHeight: 420, width: 'auto', display: 'block' }} />
            </div>
          ) : (
            <div style={{height:260,background:'linear-gradient(135deg,#667eea,#764ba2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>
              <div>
                <h4>Image coming soon</h4>
              </div>
            </div>
          )}
        </Col>

        <Col md={6}>
          <div className="p-3 bg-white rounded shadow-sm">
            <h2 className="mb-1">{tProduct(product, 'name') || product.name}</h2>
            {/* show category under name as requested */}
            <p className="text-muted mb-2">{product.category ?? 'Uncategorized'}</p>

            <div className="d-flex align-items-baseline gap-3 mb-3">
              <h3 className="mb-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', color: 'transparent' }}>{formattedPrice}</h3>
              {formattedOld && (<small className="text-muted text-decoration-line-through">{formattedOld}</small>)}
            </div>

            <div className="mb-3">
              <Badge bg={inStock ? 'success' : 'danger'} className="me-2">{inStock ? t('inStock') : 'Out of Stock'}</Badge>
              <small className="text-muted">Available: <strong>{stockQty}</strong></small>
            </div>

            <div className="d-flex align-items-center mb-3">
              <InputGroup style={{ width: 120 }} className="me-3" size="sm">
                <Button
                  variant="outline-secondary"
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ borderRight: '0', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                >-</Button>

                <Form.Control
                  type="number"
                  value={qty}
                  min={1}
                  max={stockQty || 9999}
                  onChange={e => setQty(Math.max(1, Math.min(stockQty || 9999, Number(e.target.value || 1))))}
                  className="text-center"
                  style={{ width: 60, paddingLeft: 8, paddingRight: 8, borderLeft: 0, borderRight: 0 }}
                />

                <Button
                  variant="outline-secondary"
                  onClick={() => setQty(q => Math.min(stockQty || 9999, q + 1))}
                  style={{ borderLeft: '0', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderTopRightRadius: '.375rem', borderBottomRightRadius: '.375rem' }}
                >+</Button>
              </InputGroup>

              <Button onClick={addToCart} disabled={!inStock || qty > stockQty} className="auth-link-cta px-4">{t('addToCart')}</Button>
            </div>

            <div>
              <h5 className="mt-3">{t('description')}</h5>
              <div className="text-muted" style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: tProduct(product, 'description') || tProduct(product, 'shortDescription') || product.description || product.shortDescription || '' }} />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetails;