import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, productService } from '../lib/api';

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  // Helper: robust admin detection (supports role string, roles array, ROLE_ prefix)
  const isAdminUser = (user) => {
    if (!user) return false;
    // common shapes: user.role (string) or user.roles (array) or user.authorities
    const maybeRole = user.role ?? user.roles ?? user.authorities;
    if (!maybeRole) return false;
    if (Array.isArray(maybeRole)) {
      return maybeRole.some(r => String(r).toLowerCase().includes('admin'));
    }
    return String(maybeRole).toLowerCase().includes('admin');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Login logic
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        });

        // Store token
        localStorage.setItem('token', response.data.token);
        // Fetch and store current user so UI updates immediately
        try {
          const me = await authService.getCurrentUser();
          localStorage.setItem('userData', JSON.stringify(me.data));
        } catch (e) {
          // ignore; navbar will refetch or fail silently
        }

        // If backend returned role in the login response and it's admin, go straight to dashboard
        try {
          const respRole = response.data?.role;
          if (respRole && String(respRole).toLowerCase().includes('admin')) {
            navigate('/admin/dashboard');
            return;
          }
        } catch (e) {
          // ignore
        }

        // If there's a pending cart action (user tried to add before login), process it
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
        } catch (e) {
          // ignore session errors
        }

        // Redirect based on role (robust check)
        try {
          const stored = localStorage.getItem('userData');
          if (stored) {
            const currentUser = JSON.parse(stored);
            if (isAdminUser(currentUser)) {
              navigate('/admin/dashboard');
              return;
            }
          }
        } catch (e) {
          // ignore parsing errors
        }
        // Default: user goes to previous page or home
        navigate(from);
      } else {
        // Registration logic
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        const response = await authService.register({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });

        // Store token if registration auto-logs in
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Fetch and store current user so UI updates immediately
          try {
            const me = await authService.getCurrentUser();
            localStorage.setItem('userData', JSON.stringify(me.data));
          } catch (e) {
            // ignore
          }

          // Process any pending cart action (same logic as login)
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
          } catch (e) {
            // ignore session errors
          }

          // Redirect if auto-logged in. If admin, send to admin dashboard.
          try {
            const stored = localStorage.getItem('userData');
            if (stored) {
              const currentUser = JSON.parse(stored);
              if (isAdminUser(currentUser)) {
                navigate('/admin/dashboard');
                return;
              }
            }
          } catch (e) {
            // ignore
          }

          navigate(from);
        } else {
          // If an admin is currently logged in, redirect them to the admin users list
          try {
            const stored = localStorage.getItem('userData');
            if (stored) {
              const currentUser = JSON.parse(stored);
              if (isAdminUser(currentUser)) {
                navigate('/admin/dashboard');
                return;
              }
            }
          } catch (e) {
            // ignore parsing errors
          }

          // Switch to login if registration doesn't auto-login
          setIsLogin(true);
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
          setError('Registration successful! Please login.');
        }
      }
    } catch (error) {
      // Use centralized logger
      import('../lib/logger').then(({ default: logger }) => logger.error('Authentication error:', error));
      setError(
        error.response?.data?.message ||
        (isLogin ? 'Login failed. Please check your credentials.' : 'Registration failed. Please try again.')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <Container className="shop-page-container auth-page">
      <Card>
        <Card.Header as="h4" className="text-center">
          {isLogin ? 'Login' : 'Register'}
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {!isLogin && (
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required={!isLogin}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>

            {!isLogin && (
              <Form.Group className="mb-3">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </Form.Group>
            )}

            {isLogin && (
              <div className="mb-3 text-center">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
            )}

            <div className="d-grid mb-3">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
              </Button>

            </div>
          </Form>

          <div className="text-center">
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Button
                variant="link"
                className="p-0"
                onClick={toggleAuthMode}
              >
                {isLogin ? 'Register' : 'Login'}
              </Button>

            </p>
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