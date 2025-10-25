import { useState, useEffect } from 'react';
import { Container, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import logoImage from '../assets/images/Logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../assets/styles/admin-layout.css';

function AdminLayout({ children }) {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [isDevMode, setIsDevMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current page matches the given path
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(response => {
          const u = response.data;
          setUser(u);
          // Check if using dev credentials
          setIsDevMode(token === 'dev-admin-token');
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setUser(null);
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
    logout(); // Use AuthContext logout which properly clears everything including cart
    setUser(null);
    setIsDevMode(false);
    navigate('/');
  };

  if (!user) {
    // If user not authenticated, let effect handle redirect.
    return null;
  }

  return (
    <div className="admin-layout d-flex">
      {/* Left Sidebar */}
  <aside className="admin-sidebar p-3 d-flex flex-column text-white">
        <div className="mb-5 d-flex align-items-center">
          <div className="p-2 rounded-3 me-3" style={{background: 'rgba(255,255,255,0.2)'}}>
            <img src={logoImage} alt="logo" style={{ width: 36, height: 'auto' }} />
          </div>
          <div>
            <div className="fw-bold fs-5">PickAndPlay</div>
            <div style={{fontSize: '0.85rem', opacity: 0.8}}>Admin Dashboard</div>
            {isDevMode && <small className="badge bg-warning text-dark">Dev Mode</small>}
          </div>
        </div>

        <nav className="flex-grow-1">
          <Link to="/admin/dashboard" className={`admin-nav-link ${isActive('/admin/dashboard')}`}>
            <i className="bi bi-grid-1x2-fill"></i> Dashboard
          </Link>
          <Link to="/admin/products" className={`admin-nav-link ${isActive('/admin/products')}`}>
            <i className="bi bi-box-seam-fill"></i> Products
          </Link>
          <Link to="/admin/orders" className={`admin-nav-link ${isActive('/admin/orders')}`}>
            <i className="bi bi-cart-check-fill"></i> Orders
          </Link>
          <Link to="/admin/users" className={`admin-nav-link ${isActive('/admin/users')}`}>
            <i className="bi bi-people-fill"></i> Users
          </Link>
          <hr style={{borderColor: 'rgba(255,255,255,0.2)', margin: '1.5rem 0'}} />
          <Link to="/" className="admin-nav-link">
            <i className="bi bi-shop"></i> View Store
          </Link>
        </nav>

        <div className="mt-auto p-3 rounded-3" style={{background: 'rgba(255,255,255,0.1)'}}>
          <Button 
            variant="outline-light" 
            size="sm" 
            onClick={handleLogout}
            className="w-100"
            style={{borderColor: 'rgba(255,255,255,0.3)'}}
          >
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </Button>
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
