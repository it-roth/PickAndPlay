import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Image, Form, InputGroup, Badge } from 'react-bootstrap';
import { productService } from '../lib/api';
import { getImageUrl } from '../lib/utils';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

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

  const addToCart = () => {
    if (!product) return;
    const token = localStorage.getItem('token');
    if (!token) {
      // Save pending action so user can resume after logging in
      try { sessionStorage.setItem('pendingCartAction', JSON.stringify({ productId: product.id ?? product._id, qty })); } catch (e) {}
      navigate('/login', { state: { from: `/product/${product.id ?? product._id}` } });
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const found = cart.find(i => String(i.id ?? i._id) === String(product.id ?? product._id));
    if (found) found.quantity = (found.quantity || 1) + qty;
    else cart.push({ ...product, quantity: qty });
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    // simple confirmation
    alert(`${product.name} added to cart`);
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
            <h2 className="mb-1">{product.name}</h2>
            {/* show category under name as requested */}
            <p className="text-muted mb-2">{product.category ?? 'Uncategorized'}</p>

            <div className="d-flex align-items-baseline gap-3 mb-3">
              <h3 className="mb-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', WebkitBackgroundClip: 'text', color: 'transparent' }}>${(product.price || 0).toFixed(2)}</h3>
              {product.oldPrice && (<small className="text-muted text-decoration-line-through">${product.oldPrice}</small>)}
            </div>

            <div className="mb-3">
              <Badge bg={inStock ? 'success' : 'danger'} className="me-2">{inStock ? 'In Stock' : 'Out of Stock'}</Badge>
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

              <Button onClick={addToCart} disabled={!inStock || qty > stockQty} className="px-4" variant="primary">Add to Cart</Button>
            </div>

            <div>
              <h5 className="mt-3">Description</h5>
              <div className="text-muted" style={{ lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: product.description || product.shortDescription || '' }} />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default ProductDetails;