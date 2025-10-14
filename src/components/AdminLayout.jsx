import { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/api';
import logoImage from '../assets/images/Logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../assets/styles/admin-layout.css';

function AdminLayout({ children }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current page matches the given path
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(response => {
          setUser(response.data);
          setIsAdmin(response.data.role === 'ADMIN');
          // Check if using dev credentials
          setIsDevMode(token === 'dev-admin-token');
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setUser(null);
          setIsAdmin(false);
          setIsDevMode(false);
          navigate('/login');
        });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAdmin(false);
    setIsDevMode(false);
    navigate('/');
  };

  if (!user || !isAdmin) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-vh-100 bg-light">
      {/* Dev Mode Banner */}
      {isDevMode && (
        <div className="bg-warning text-dark">
          <Container fluid className="d-flex justify-content-center align-items-center py-1">
            <small>
              <i className="bi bi-code-slash me-1"></i>
              Development Mode - Logged in as Dev Admin
            </small>
          </Container>
        </div>
      )}

      {/* Admin Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="admin-navbar">
        <Container fluid>
          {/* Logo */}
          <Navbar.Brand as={Link} to="/admin/dashboard" className="d-flex align-items-center">
            <img 
              src={logoImage} 
              alt="PickAndPlay Admin" 
              style={{ height: '30px', width: 'auto' }}
              className="me-2"
            />
            <span className="fw-bold">PickAndPlay Admin</span>
          </Navbar.Brand>

          {/* Admin Navigation */}
          <Navbar.Toggle aria-controls="admin-navbar-nav" />
          <Navbar.Collapse id="admin-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/admin/dashboard" className={isActive("/admin/dashboard")}>
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/products" className={isActive("/admin/products")}>
                <i className="bi bi-box me-1"></i>
                Products
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/orders" className={isActive("/admin/orders")}>
                <i className="bi bi-receipt me-1"></i>
                Orders
              </Nav.Link>
              <Nav.Link as={Link} to="/admin/users" className={isActive("/admin/users")}>
                <i className="bi bi-people me-1"></i>
                Users
              </Nav.Link>
            </Nav>

            {/* User Menu */}
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-2"></i>
                  {user.firstName} {user.lastName}
                  <i className="bi bi-chevron-down ms-2"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/admin/dashboard">
                    <i className="bi bi-speedometer2 me-2"></i>Dashboard
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item as={Link} to="/">
                    <i className="bi bi-shop me-2"></i>View Store
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="admin-main-content">
        {children}
      </main>
    </div>
  );
}

export default AdminLayout;
