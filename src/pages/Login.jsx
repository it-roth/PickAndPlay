import { useState } from 'react';
import { Container, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService, productService } from '../lib/api';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password
      });

      // Backend may return different shapes depending on implementation.
      // Support both: { ok: true, token, role } and { status: 'success', data: { token, ... } }
      const respData = response?.data || {};

      // Extract token from possible shapes
      let token = null;
      if (respData.token) token = respData.token;
      else if (respData.ok && respData.token) token = respData.token;
      else if (respData.status === 'success' && respData.data && respData.data.token) token = respData.data.token;

      if (!token) {
        setError(respData.message || respData.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      // Store token (frontend expects 'token' key in localStorage)
      localStorage.setItem('token', token);

      // Try to fetch current user and store only the inner user object
      let userObj = null;
      try {
        const me = await authService.getCurrentUser();
        // backend returns { status: 'success', data: user } — normalize to user object
        userObj = me?.data?.data || me?.data || null;
        if (userObj) localStorage.setItem('userData', JSON.stringify(userObj));
      } catch (e) {
        // ignore fetching user - we'll fallback to any role info in login response
      }

      // Determine if user is admin (check fetched user first, fall back to login response)
      const checkIsAdmin = (u) => {
        if (!u) return false;
        const roleField = u.role || u.roles || null;
        if (!roleField) return false;
        if (typeof roleField === 'string') return String(roleField).toLowerCase().includes('admin');
        if (Array.isArray(roleField)) return roleField.some(r => String(r).toLowerCase().includes('admin'));
        return false;
      };

      const isAdminFromUser = checkIsAdmin(userObj);
      const isAdminFromResp = checkIsAdmin(response.data || response?.data?.data || null) || checkIsAdmin(respData);

      if (isAdminFromUser || isAdminFromResp) {
        setError('');
        setSuccess('Admin login successful! Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 800);
        return;
      }

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
                window.dispatchEvent(new CustomEvent('cartUpdated')); // Restore cart update event
              }
            } catch (e) {
              // ignore fetch/add errors
            }
          }
          sessionStorage.removeItem('pendingCartAction');
        }
      } catch (e) { }

      // Show success message with automatic redirect and refresh
      setError(''); // Clear any previous errors
      setSuccess('Login successful! Redirecting...');

      // Use window.location.href to force a full page refresh when going to homepage
      setTimeout(() => {
        if (from === '/') {
          window.location.href = '/'; // This will refresh the homepage
        } else {
          navigate(from); // For other pages, use normal navigation
        }
      }, 1000);
    } catch (error) {
      console.error('Authentication error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="shop-page-container auth-page">
      <Card className="position-relative">
        {/* back icon button top-left */}
        <button type="button" className="back-icon-btn" onClick={() => navigate('/')} aria-label="Back to Home">
          <i className="bi bi-arrow-left-circle-fill"></i>
        </button>
        <Card.Header as="h4" className="text-center">Login</Card.Header>
        <Card.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

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
              <Button className="auth-link-cta" type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Login'}
              </Button>
            </div>
          </Form>

          <div className="text-center">
            <p>Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Login;