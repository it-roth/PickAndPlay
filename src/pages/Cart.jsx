import { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Image, Form, ListGroup, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';

function Cart() {
  // Small image component to handle load/error gracefully
  function ImageWithFallback({ src, alt, ...props }) {
    const [errored, setErrored] = useState(false);
    if (!src || errored) {
      return (
        <div
          className="no-image-placeholder d-flex align-items-center justify-content-center"
          style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '4px'
          }}
        >
          <i className="bi bi-image text-muted"></i>
        </div>
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        fluid
        thumbnail
        loading="lazy"
        onError={() => setErrored(true)}
        {...props}
      />
    );
  }
  const [cartItems, setCartItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expDate: '',
    cvv: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart from localStorage
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(cart);

      // Calculate subtotal
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      setSubtotal(total);

      // Set shipping cost (simplified logic)
      setShipping(total > 100 ? 0 : 10);
    };

    loadCart();

    // Listen for cart updates
    window.addEventListener('cartUpdated', loadCart);
    return () => {
      window.removeEventListener('cartUpdated', loadCart);
    };
  }, []);

  const { currency, convertPrice, tProduct } = useContext(LocaleContext);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cartItems.map(item =>
      item.id === id ? { ...item, quantity: newQuantity } : item
    );

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Update subtotal
    const total = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(total);

    // Update shipping cost
    setShipping(total > 100 ? 0 : 10);
  };

  const removeItem = (id) => {
    const updatedCart = cartItems.filter(item => item.id !== id);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Update subtotal
    const total = updatedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setSubtotal(total);

    // Update shipping cost
    setShipping(total > 100 ? 0 : 10);

    // Trigger event to update cart count in navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    // In a real app, you would validate the form and process payment

    try {
      // Submit order to backend
      const orderData = {
        customerName: `${checkoutForm.firstName} ${checkoutForm.lastName}`,
        shippingAddress: `${checkoutForm.address}, ${checkoutForm.city}, ${checkoutForm.state} ${checkoutForm.zipCode}`,
        totalAmount: subtotal + shipping,
        items: cartItems.map(item => ({
          productId: item.id,
          quantity: item.quantity
        }))
      };

      await orderService.placeOrder(orderData);

      // Clear cart
      localStorage.removeItem('cart');

      // Redirect to order confirmation
      navigate('/order-confirmation');
    } catch (error) {
      console.error('Error placing order:', error);
      alert('There was an error processing your order. Please try again.');
    }
  };

  if (cartItems.length === 0) {
    return (
      <Container className="py-5 text-center">
        <h1 className="mb-4">Your Cart</h1>
        <p>Your cart is empty.</p>
        <Button as={Link} to="/shop" variant="primary">
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-6 shop-page-container" style={{ paddingTop: '100px' }}>
      <h1 className="mb-4">Your Cart</h1>

      <Row>
        <Col lg={8}>
          {/* Cart items */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Cart Items ({cartItems.length})</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {cartItems.map(item => (
                <ListGroup.Item key={item.id}>
                  <Row className="align-items-center">
                    <Col xs={3} md={2}>
                      <ImageWithFallback src={getImageUrl(item.images)} alt={item.name} />
                    </Col>
                    <Col xs={9} md={4}>
                      <h5 className="mb-1">
                        <Link to={`/product/${item.id}`}>{tProduct(item, 'name') || item.name}</Link>
                      </h5>
                      <p className="text-muted mb-0">{item.brand}</p>
                    </Col>
                    <Col md={2} className="text-center">
                      {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convertPrice(item.price))}
                    </Col>
                    <Col md={2}>
                      <div className="d-flex align-items-center">
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          -
                        </Button>
                        <span className="mx-2">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </Col>
                    <Col md={2} className="text-end">
                      <div className="d-flex justify-content-between">
                        <span className="d-inline-block me-3">
                          {new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(convertPrice(item.price * item.quantity))}
                        </span>
                        <Button
                          variant="link"
                          className="text-danger p-0"
                          onClick={() => removeItem(item.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>

          {/* Checkout form (visible only when checking out) */}
          {isCheckingOut && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Shipping & Payment Information</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleCheckout}>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          value={checkoutForm.firstName}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          value={checkoutForm.lastName}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={checkoutForm.email}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                      type="text"
                      name="address"
                      value={checkoutForm.address}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>City</Form.Label>
                        <Form.Control
                          type="text"
                          name="city"
                          value={checkoutForm.city}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>State</Form.Label>
                        <Form.Control
                          type="text"
                          name="state"
                          value={checkoutForm.state}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Form.Group>
                        <Form.Label>Zip Code</Form.Label>
                        <Form.Control
                          type="text"
                          name="zipCode"
                          value={checkoutForm.zipCode}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <h5 className="mb-3">Payment Information</h5>

                  <Form.Group className="mb-3">
                    <Form.Label>Card Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardNumber"
                      value={checkoutForm.cardNumber}
                      onChange={handleInputChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Name on Card</Form.Label>
                    <Form.Control
                      type="text"
                      name="cardName"
                      value={checkoutForm.cardName}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>Expiration Date</Form.Label>
                        <Form.Control
                          type="text"
                          name="expDate"
                          value={checkoutForm.expDate}
                          onChange={handleInputChange}
                          placeholder="MM/YY"
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Group>
                        <Form.Label>CVV</Form.Label>
                        <Form.Control
                          type="text"
                          name="cvv"
                          value={checkoutForm.cvv}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="d-grid">
                    <Button type="submit" variant="primary" size="lg">
                      Place Order
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Order summary */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between fw-bold">
                  <span>Total</span>
                  <span>${(subtotal + shipping).toFixed(2)}</span>
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-2 mt-3">
                {isCheckingOut ? (
                  <Button
                    variant="outline-secondary"
                    onClick={() => setIsCheckingOut(false)}
                  >
                    Edit Cart
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setIsCheckingOut(true)}
                    >
                      Proceed to Checkout
                    </Button>
                    <Button
                      variant="outline-secondary"
                      as={Link}
                      to="/shop"
                    >
                      Continue Shopping
                    </Button>
                  </>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Cart;