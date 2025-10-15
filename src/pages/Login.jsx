import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, productService } from '../lib/api';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Where to redirect after login
  const from = location.state?.from?.pathname || '/';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // Store token
      localStorage.setItem('token', response.data.token);

      // Try to fetch current user and store
      try {
        const me = await authService.getCurrentUser();
        localStorage.setItem('userData', JSON.stringify(me.data));
      } catch (e) {
        // ignore
      }

      // If backend returned an admin role, redirect to admin dashboard
      try {
        const respRole = response.data?.role;
        if (respRole && String(respRole).toLowerCase().includes('admin')) {
          navigate('/admin/dashboard');
          return;
        }
      } catch (e) { }

      // Process pending cart action saved in session (if any)
      try {
        const pending = sessionStorage.getItem('pendingCartAction');
        if (pending) {
          const { productId, qty } = JSON.parse(pending);
          if (productId) {
            try {
              const res = await productService.getProductById(productId);
              const prod = res.data;
              if (prod) {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                const found = cart.find(i => String(i.id ?? i._id) === String(prod.id ?? prod._id));
                if (found) found.quantity = (found.quantity || 0) + (qty || 1);
                else cart.push({ ...prod, quantity: qty || 1 });
                localStorage.setItem('cart', JSON.stringify(cart));
                window.dispatchEvent(new CustomEvent('cartUpdated'));
              }
            } catch (e) {
              // ignore fetch/add errors
            }
          }
          sessionStorage.removeItem('pendingCartAction');
        }
      } catch (e) { }

      // Default redirect
      navigate(from);
    } catch (error) {
      import('../lib/logger').then(({ default: logger }) => logger.error('Authentication error:', error));
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="shop-page-container auth-page">
      <Card>
        <Card.Header as="h4" className="text-center">Login</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" name="password" value={formData.password} onChange={handleInputChange} required />
            </Form.Group>

            <div className="mb-3 text-center">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <div className="d-grid mb-3">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Login'}
              </Button>
            </div>
          </Form>

          <div className="text-center">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>

          <div className="text-center mt-3">
            <Button className="back-home-button" variant="outline-primary" onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;