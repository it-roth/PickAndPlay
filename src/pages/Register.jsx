import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../lib/api';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate gender is selected
    if (!formData.gender) {
      setError('Please select a gender');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        gender: formData.gender
      };
      if (import.meta.env.DEV) console.debug('Register payload:', payload);
      const response = await authService.register(payload);

      // If registration auto-logs in
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        navigate('/');
      } else {
        try {
          const stored = localStorage.getItem('userData');
          if (stored) {
            const currentUser = JSON.parse(stored);
            if (currentUser?.role === 'ADMIN') {
              navigate('/admin/users');
              return;
            }
          }
        } catch (e) {
          // ignore parsing errors
        }

        // Redirect to login if registration doesn't auto-login
        navigate('/login', {
          state: {
            message: 'Registration successful! Please login with your new account.'
          }
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error.response?.data?.message ||
        'Registration failed. Please check your information and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="auth-page">
      <Card className="position-relative">
        {/* back icon button top-left */}
        <button type="button" className="back-icon-btn" onClick={() => navigate('/')} aria-label="Back to Home">
          <i className="bi bi-arrow-left-circle-fill"></i>
        </button>
        <Card.Header as="h4" className="text-center">Create an Account</Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">{error}</Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
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
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </Form.Select>
            </Form.Group>

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
                minLength={8}
              />
              <Form.Text className="text-muted">
                Password must be at least 8 characters long.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={8}
              />
            </Form.Group>

            <div className="d-grid mb-3">
              <Button
                className="auth-link-cta"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </Button>
            </div>
          </Form>

          <div className="text-center">
            <p>
              Already have an account?{' '}
              <Link to="/login">Login</Link>
            </p>
          </div>
        </Card.Body>

      </Card>

    </Container>
  );
}

export default Register;