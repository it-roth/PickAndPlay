import { useEffect, useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/api';
import logoImage from '../assets/images/Logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../assets/styles/navbar-fixes.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to navigate to a category and close all menus
  // Added event parameter and preventDefault to avoid double navigation
  const handleCategorySelect = (path, e) => {
    if (e) {
      e.preventDefault(); // Prevent default link behavior
      e.stopPropagation(); // Stop event bubbling
    }
    setShowCategoriesDropdown(false);
    setExpanded(false);
    // Prevent navigating to the same page
    if (location.pathname !== path) {
      navigate(path);
    }
  };

  // Check if the current page matches the given path
  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  useEffect(() => {
    // Get cart items count from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    setCartCount(cart.length);

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      authService.getCurrentUser()
        .then(response => {
          setUser(response.data);
          setIsAdmin(response.data.role === 'ADMIN');
        })
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
          setIsAdmin(false);
        });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAdmin(false);
    navigate('/');
  };

  return (
    <div className="navbar-wrapper">
      {/* Black Friday Banner */}
      <div className="black-friday-banner">
        <Container fluid className="d-flex justify-content-between align-items-center py-1 py-sm-2">
          <div className="banner-text">Black Friday</div>
          <div className="banner-discount">69% OFF</div>
          <Button variant="dark" className="shop-now-btn shop-now-btn-custom">
            <span className="d-none d-sm-inline">Shop Now </span>
            <span className="d-sm-none">SHOP</span>
            <i className="bi bi-arrow-right ms-1 shop-now-icon"></i>
          </Button>
        </Container>
      </div>
      
      {/* Top bar */}
      <div className="topbar">
        <Container fluid className="d-flex justify-content-between align-items-center py-2">
          <div className="welcome-text">
            Welcome to Pick & Play
          </div>
          <div className="d-flex align-items-center">
            <div className="social-icons me-2">
              <span>Follow us:</span>
              <a href="#" className="mx-1"><i className="bi bi-facebook"></i></a>
              <a href="#" className="mx-1"><i className="bi bi-instagram"></i></a>
              <a href="#" className="mx-1"><i className="bi bi-youtube"></i></a>
            </div>
            <div className="language-selector ms-2">
              <Dropdown className="d-inline">
                <Dropdown.Toggle variant="success" size="sm" className="language-dropdown no-caret">
                  <span className="d-none d-sm-inline">Eng</span>
                  <span className="d-sm-none">EN</span>
                  <i className="bi bi-chevron-down small ms-1"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#">English</Dropdown.Item>
                  <Dropdown.Item href="#">Spanish</Dropdown.Item>
                  <Dropdown.Item href="#">French</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Dropdown className="d-inline ms-1">
                <Dropdown.Toggle variant="success" size="sm" className="currency-dropdown no-caret">
                  <span className="d-none d-sm-inline">USD</span>
                  <span className="d-sm-none">$</span>
                  <i className="bi bi-chevron-down small ms-1"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#">USD</Dropdown.Item>
                  <Dropdown.Item href="#">EUR</Dropdown.Item>
                  <Dropdown.Item href="#">GBP</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </Container>
      </div>
      
      {/* Main Navbar */}
      <BootstrapNavbar expanded={expanded} expand="lg" className="main-navbar navbar-modern py-2">
        <Container fluid>
          {/* Logo */}
          <BootstrapNavbar.Brand as={Link} to="/" className="logo-container" onClick={() => setExpanded(false)}>
            <img src={logoImage} alt="Pick & Play" className="brand-logo" />
          </BootstrapNavbar.Brand>
          
          {/* Search bar - desktop only */}
          <div className="search-container d-none d-lg-block">
            <Form className="navbar-search-form">
              <InputGroup>
                <Form.Control
                  placeholder="Search products..."
                  className="navbar-search-input"
                />
                <Button variant="dark" className="navbar-search-button search-btn-dark">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>
          </div>
          
          {/* Icons section */}
          <div className="nav-icons d-flex align-items-center">
            {/* Cart icon with count */}
            <Link to="/cart" className="nav-icon-link position-relative">
              <i className="bi bi-cart3"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            
            {/* Wishlist - hidden on mobile */}
            <Link to="/wishlist" className="nav-icon-link d-none d-sm-flex">
              <i className="bi bi-heart"></i>
            </Link>
            
            {/* User menu */}
            {user ? (
              <div className="user-menu d-flex">
                <Link to="/profile" className="nav-icon-link">
                  <i className="bi bi-person-circle"></i>
                </Link>
                {isAdmin && (
                  <Link to="/admin/dashboard" className="nav-icon-link d-none d-sm-flex">
                    <i className="bi bi-speedometer2"></i>
                  </Link>
                )}
                <Button variant="link" className="nav-icon-link p-0" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right"></i>
                </Button>
              </div>
            ) : (
              <>
                <Link to="/login" className="nav-icon-link">Login</Link>
                <Link to="/register" className="nav-icon-link d-none d-sm-inline-block">Register</Link>
              </>
            )}
          </div>
          
          {/* Mobile menu toggle */}
          <BootstrapNavbar.Toggle 
            aria-controls="main-navbar-nav" 
            onClick={() => setExpanded(expanded ? false : "expanded")} 
          />
          
          {/* Mobile menu */}
          <BootstrapNavbar.Collapse id="main-navbar-nav">
            {/* Search bar - mobile only */}
            <Form className="navbar-search-form d-lg-none mt-3 mb-2">
              <InputGroup>
                <Form.Control
                  placeholder="Search products..."
                  className="navbar-search-input"
                />
                <Button variant="dark" className="navbar-search-button search-btn-dark">
                  <i className="bi bi-search"></i>
                </Button>
              </InputGroup>
            </Form>
            
            {/* Mobile navigation links */}
            <Nav className="mobile-nav d-block d-lg-none">
              <Nav.Link as={Link} to="/" className={`mobile-nav-link ${isActive("/")}`} onClick={() => setExpanded(false)}>
                Home
              </Nav.Link>
              <Nav.Link as={Link} to="/shop" className={`mobile-nav-link ${isActive("/shop")}`} onClick={() => setExpanded(false)}>
                Shop
              </Nav.Link>
              <Nav.Link as={Link} to="/about" className={`mobile-nav-link ${isActive("/about")}`} onClick={() => setExpanded(false)}>
                About Us
              </Nav.Link>
              <Nav.Link as={Link} to="/contact" className={`mobile-nav-link ${isActive("/contact")}`} onClick={() => setExpanded(false)}>
                Contact Us
              </Nav.Link>
              
              {/* Categories in mobile menu */}
              <div className="mobile-categories">
                <h6 className="mobile-nav-heading">Categories</h6>
                <Nav.Link as="a" href="#" className={`mobile-nav-link nested-link ${isActive("/category/electric")}`} onClick={(e) => handleCategorySelect('/category/electric', e)}>
                  Electric Guitars
                </Nav.Link>
                <Nav.Link as="a" href="#" className={`mobile-nav-link nested-link ${isActive("/category/acoustic")}`} onClick={(e) => handleCategorySelect('/category/acoustic', e)}>
                  Acoustic Guitars
                </Nav.Link>
                <Nav.Link as="a" href="#" className={`mobile-nav-link nested-link ${isActive("/category/bass")}`} onClick={(e) => handleCategorySelect('/category/bass', e)}>
                  Bass Guitars
                </Nav.Link>
                <Nav.Link as="a" href="#" className={`mobile-nav-link nested-link ${isActive("/category/accessories")}`} onClick={(e) => handleCategorySelect('/category/accessories', e)}>
                  Accessories
                </Nav.Link>
              </div>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
      
      {/* Desktop Navigation & Categories */}
      <div className="desktop-nav-container d-none d-lg-block">
        <Container fluid>
          <div className="d-flex justify-content-between align-items-center">
            {/* Categories Dropdown */}
            <div className="categories-dropdown">
              <Dropdown 
                show={showCategoriesDropdown} 
                onToggle={(isOpen) => {
                  // Only set state, don't trigger additional actions
                  setShowCategoriesDropdown(isOpen);
                }}
                className="unified-dropdown"
              >
                <Dropdown.Toggle variant="light" id="categories-dropdown" className="categories-toggle rounded-0 px-3 py-2">
                  <i className="bi bi-grid me-2"></i> Categories
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item 
                    onClick={(e) => handleCategorySelect('/category/electric', e)} 
                    className={isActive("/category/electric")}
                    as="button"
                  >
                    Electric Guitars
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={(e) => handleCategorySelect('/category/acoustic', e)} 
                    className={isActive("/category/acoustic")}
                    as="button"
                  >
                    Acoustic Guitars
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={(e) => handleCategorySelect('/category/bass', e)} 
                    className={isActive("/category/bass")}
                    as="button"
                  >
                    Bass Guitars
                  </Dropdown.Item>
                  <Dropdown.Item 
                    onClick={(e) => handleCategorySelect('/category/accessories', e)} 
                    className={`category-item ${isActive("/category/accessories")}`}
                    as="button"
                  >
                    Accessories
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
            
            {/* Main Navigation */}
            <Nav className="main-menu">
              <Nav.Link as={Link} to="/" className={`main-nav-link ${isActive("/")}`}>HOME</Nav.Link>
              <Nav.Link as={Link} to="/shop" className={`main-nav-link ${isActive("/shop")}`}>SHOP</Nav.Link>
              <Nav.Link as={Link} to="/about" className={`main-nav-link ${isActive("/about")}`}>ABOUT US</Nav.Link>
              <Nav.Link as={Link} to="/contact" className={`main-nav-link ${isActive("/contact")}`}>CONTACT US</Nav.Link>
            </Nav>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default Navbar;