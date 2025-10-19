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
          const u = response.data;
          setUser(u);
          // Flexible admin detection: accept 'ADMIN' or 'admin' or roles arrays containing ADMIN
          const roleVal = u && (u.role || u.roles || u.authorities || u.rolesList);
          const isAdminDetected = (() => {
            if (!roleVal) return false;
            if (typeof roleVal === 'string') {
              return roleVal.toUpperCase() === 'ADMIN';
            }
            if (Array.isArray(roleVal)) {
              return roleVal.some(r => String(r).toUpperCase() === 'ADMIN');
            }
            return false;
          })();

          setIsAdmin(isAdminDetected);
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

  // Add a class to body to remove global top padding while admin is active
  useEffect(() => {
    document.body.classList.add('admin-no-top-padding');
    return () => {
      document.body.classList.remove('admin-no-top-padding');
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    setIsAdmin(false);
    setIsDevMode(false);
    navigate('/');
  };

  if (!user || !isAdmin) {
    // If user not authenticated, let effect handle redirect.
    if (!user) return null;

    // Authenticated but not admin — show a helpful message instead of a blank page
    console.debug('AdminLayout: authenticated user without admin role', user);
    return (
      <Container className="py-5 text-center">
        <h3>Access denied</h3>
        <p>You are signed in but do not have admin privileges.</p>
        <p>
          <strong>Role returned:</strong> {String(user?.role || (user?.roles && JSON.stringify(user.roles)) || 'none')}
        </p>
        <div className="mt-3">
          <Button variant="primary" onClick={() => navigate('/')}>Return to store</Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="admin-layout d-flex">
      {/* Left Sidebar */}
  <aside className="admin-sidebar p-3 d-flex flex-column text-white">
        <div className="mb-4 d-flex align-items-center">
          <img src={logoImage} alt="logo" style={{ width: 40, height: 'auto' }} className="me-2" />
          <div>
            <div className="fw-bold">PickAndPlay Admin</div>
            {isDevMode && <small className="text-warning">Dev Mode</small>}
          </div>
        </div>

        <nav className="flex-grow-1">
          <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('/admin/dashboard')}`}>
            <i className="bi bi-speedometer2 me-2"></i> Dashboard
          </Link>
          <Link to="/admin/products" className={`admin-nav-link ${isActive('/admin/products')}`}>
            <i className="bi bi-box me-2"></i> Products
          </Link>
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders')}`}>
            <i className="bi bi-receipt me-2"></i> Orders
          </Link>
          <Link to="/admin/users" className={`admin-nav-link ${isActive('/admin/users')}`}>
            <i className="bi bi-people me-2"></i> Users
          </Link>
        </nav>

        <div className="mt-auto">
          <div className="mb-2">
            <strong>{user.firstName} {user.lastName}</strong>
          </div>
          <div className="d-flex gap-2">
            <Button variant="light" size="sm" as={Link} to="/">View Store</Button>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </aside>

      {/* Main content area (scrollable) */}
      <main className="admin-main-content flex-grow-1" role="main" aria-label="Admin main content">
        <div className="admin-content-inner">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
