import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';

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
        
        // Redirect to previous page or home
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
        }
        
        // Switch to login if registration doesn't auto-login
        if (!response.data.token) {
          setIsLogin(true);
          setFormData(prev => ({
            ...prev,
            password: '',
            confirmPassword: ''
          }));
          setError('Registration successful! Please login.');
        } else {
          // Redirect if auto-logged in
          navigate(from);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
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
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
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
                  <div className="mb-3 text-end">
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
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;