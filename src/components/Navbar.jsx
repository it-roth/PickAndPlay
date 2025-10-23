import { useEffect, useState, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../lib/api';
import logoImage from '../assets/images/Logo.png';
const CAM_URL = new URL('../assets/images/Flag_of_Cambodia.webp', import.meta.url).href;
const US_URL = new URL('../assets/images/Flag_of_the_United_Kingdom.webp', import.meta.url).href;
const CN_URL = new URL('../assets/images/Flag_of_China.png', import.meta.url).href;
import { getImageUrl } from '../lib/utils';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../assets/styles/navbar.css';
import { LocaleContext } from '../contexts/LocaleContext';
import { useAuth } from '../contexts/AuthContext';
import { STORAGE_KEYS } from '../lib/constants';


function Navbar() {
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [anchorRight, setAnchorRight] = useState(false);
  const { lang, setLanguage: localeSetLanguage, t } = useContext(LocaleContext);
  
  const [userOpen, setUserOpen] = useState(false);
  const langCloseTimer = useRef(null);
  const langButtonRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalItems);
    };

    updateCartCount();

    window.addEventListener('cartUpdated', updateCartCount);

    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (langCloseTimer.current) {
        clearTimeout(langCloseTimer.current);
        langCloseTimer.current = null;
      }
    }
  }, []);

  const hideOnAuth = location.pathname === '/login' || location.pathname === '/register';
  if (hideOnAuth) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleLangToggle = () => {
    if (!langOpen && langCloseTimer.current) {
      clearTimeout(langCloseTimer.current);
      langCloseTimer.current = null;
    }
    if (!langOpen) {
      try {
        const btn = langButtonRef.current?.getBoundingClientRect();
        const spaceRight = window.innerWidth - (btn?.right || 0);
        setAnchorRight(spaceRight < 220);
      } catch (e) { setAnchorRight(false); }
    }
    setLangOpen(!langOpen);
    setUserOpen(false);
  };

  const setLanguage = (value) => {
    localeSetLanguage(value);
    setLangOpen(false);
  };

  const openLangMenu = () => {
    if (langCloseTimer.current) {
      clearTimeout(langCloseTimer.current);
      langCloseTimer.current = null;
    }
    try {
      const btn = langButtonRef.current?.getBoundingClientRect();
      const spaceRight = window.innerWidth - (btn?.right || 0);
      setAnchorRight(spaceRight < 220);
    } catch (e) { setAnchorRight(false); }
    setLangOpen(true);
    setUserOpen(false);
  };

  const scheduleCloseLangMenu = (delay = 180) => {
    if (langCloseTimer.current) clearTimeout(langCloseTimer.current);
    langCloseTimer.current = setTimeout(() => {
      setLangOpen(false);
      langCloseTimer.current = null;
    }, delay);
  };

  return (
    <div className="navbar-wrapper">
      <div className="black-friday-banner">
        <div className="container-fluid d-flex justify-content-between align-items-center py-1 py-sm-2">
          <div className="banner-text">{t('blackFriday')}</div>
          <div className="banner-discount">69% OFF</div>
          <button
            type="button"
            className="btn btn-dark shop-now-btn shop-now-btn-custom"
            onClick={() => { setExpanded(false); navigate('/shop'); }}
          >
            <span className="d-none d-sm-inline">{t('shopNow')} </span>
            <span className="d-sm-none">{t('shopNow').toUpperCase()}</span>
          </button>
        </div>
      </div>

      <nav className={`navbar navbar-expand-lg main-navbar navbar-modern py-2`}>
        <div className="container-fluid">
          <Link to="/" className="navbar-brand logo-container" onClick={() => setExpanded(false)}>
            <img src={logoImage} alt="Pick & Play" className="brand-logo" />
          </Link>
          <div className="desktop-nav-container d-none d-lg-block">
            <div className="container-fluid">
              <div className="main-menu">
                <Link to="/" className={`main-nav-link ${isActive("/")}`}>{t('home')}</Link>
                <Link to="/shop" className={`main-nav-link ${isActive("/shop")}`}>{t('shop')}</Link>
                <Link to="/about" className={`main-nav-link ${isActive("/about")}`}>{t('about')}</Link>
                <Link to="/contact" className={`main-nav-link ${isActive("/contact")}`}>{t('contact')}</Link>
              </div>
            </div>
          </div>

          <div className="nav-icons d-flex align-items-center">
            <Link to="/cart" className="nav-icon-link position-relative">
                <i className="bi bi-cart3"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>
            <div className="language-selector ms-2 d-flex">
              <div className="dropdown d-inline" onMouseEnter={openLangMenu} onMouseLeave={() => scheduleCloseLangMenu()}>
                <button
                  type="button"
                  ref={langButtonRef}
                  className="btn btn-sm language-dropdown language-flag-only no-caret"
                  onClick={handleLangToggle}
                  aria-expanded={langOpen}
                  aria-haspopup="true"
                  aria-label={lang === 'EN' ? 'English' : lang === 'KH' ? 'Khmer' : 'Chinese'}
                >
                  <img
                    src={lang === 'EN' ? US_URL : (lang === 'KH' ? CAM_URL : CN_URL)}
                    alt={lang}
                    className="lang-flag"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const emoji = e.currentTarget.nextElementSibling;
                      if (emoji) emoji.style.display = 'inline-block';
                    }}
                  />
                  <span className="lang-emoji" style={{ display: 'none' }}>{lang === 'EN' ? '🇺🇸' : lang === 'KH' ? '🇰🇭' : '🇨🇳'}</span>
                </button>
                <ul className={`dropdown-menu language-menu${langOpen ? ' show' : ''}${anchorRight ? ' anchor-right' : ''}`} onMouseEnter={openLangMenu} onMouseLeave={() => scheduleCloseLangMenu()}>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => setLanguage('KH')}
                    >
                      <img
                        src={CAM_URL}
                        alt="KH"
                        className="lang-flag"
                        onError={(e) => { e.currentTarget.style.display = 'none'; const em = e.currentTarget.nextElementSibling; if (em) em.style.display = 'inline-block'; }}
                      />
                      <span className="lang-emoji" style={{ display: 'none' }}>🇰🇭</span>
                      ខ្មែរ (Khmer)
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => setLanguage('EN')}
                    >
                      <img
                        src={US_URL}
                        alt="EN"
                        className="lang-flag"
                        onError={(e) => { e.currentTarget.style.display = 'none'; const em = e.currentTarget.nextElementSibling; if (em) em.style.display = 'inline-block'; }}
                      />
                      <span className="lang-emoji" style={{ display: 'none' }}>🇺🇸</span>
                      English
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => setLanguage('ZH')}
                    >
                      <img
                        src={CN_URL}
                        alt="ZH"
                        className="lang-flag"
                        onError={(e) => { e.currentTarget.style.display = 'none'; const em = e.currentTarget.nextElementSibling; if (em) em.style.display = 'inline-block'; }}
                      />
                      <span className="lang-emoji" style={{ display: 'none' }}>🇨🇳</span>
                      中文 (Chinese)
                    </button>
                  </li>
                </ul>
              </div>
              
            </div>



            {user ? (
              <div className="dropdown d-inline user-dropdown">
                <button
                  type="button"
                  className="btn btn-link p-0 d-flex align-items-center nav-icon-link user-toggle"
                  onClick={() => { setUserOpen(!userOpen); setExpanded(false); }}
                >
                  {(() => {
                    const avatar = getImageUrl(user?.avatar ? [user.avatar] : (user?.images || []));
                    if (avatar) {
                      return <img src={avatar} alt={user?.name || 'User'} className="user-avatar rounded-circle" style={{ width: 36, height: 36, objectFit: 'cover' }} />;
                    }
                    const name = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
                    const initials = (name || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
                    return (
                      <div className="user-avatar-placeholder rounded-circle d-flex align-items-center justify-content-center bg-primary text-white" style={{ width: 36, height: 36, fontSize: 14 }}>
                        {initials}
                      </div>
                    );
                  })()}
                </button>

                <ul className={`dropdown-menu${userOpen ? ' show' : ''} dropdown-menu-end`}>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/profile"
                      onClick={(e) => {
                        e.preventDefault();
                        setExpanded(false);
                        setUserOpen(false);
                        if (import.meta.env.DEV) console.debug('Navbar: navigating to /profile via navigate()');
                        navigate('/profile');
                      }}
                    >
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="dropdown-item"
                      to="/cart"
                      onClick={(e) => {
                        e.preventDefault();
                        setExpanded(false);
                        setUserOpen(false);
                        if (import.meta.env.DEV) console.debug('Navbar: navigating to /cart via navigate()');
                        navigate('/cart');
                      }}
                    >
                      Orders
                    </Link>
                  </li>
                  {(user?.role && String(user.role).toLowerCase().includes('admin')) || (Array.isArray(user?.roles) && user.roles.some(r => String(r).toLowerCase().includes('admin'))) ? (
                    <li><Link className="dropdown-item" to="/admin/dashboard" onClick={() => { setExpanded(false); setUserOpen(false); }}>Admin</Link></li>
                  ) : null}
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={() => { handleLogout(); setExpanded(false); setUserOpen(false); }}>Logout</button></li>
                </ul>
              </div>
            ) : (
              <div className="auth-links d-flex align-items-center">
                <Link to="/login" className="auth-link auth-link-cta d-none d-sm-inline-block ms-2" onClick={() => setExpanded(false)}>{t('signIn')}</Link>
              </div>
            )}
          </div>

          <button
            className="navbar-toggler"
            type="button"
            aria-controls="main-navbar-nav"
            aria-expanded={expanded ? 'true' : 'false'}
            aria-label="Toggle navigation"
            onClick={() => setExpanded(expanded ? false : true)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse${expanded ? ' show' : ''}`} id="main-navbar-nav">
            <div className="mobile-nav d-block d-lg-none">
              <Link to="/" className={`mobile-nav-link ${isActive("/")}`} onClick={() => setExpanded(false)}>
                {t('home')}
              </Link>
              <Link to="/shop" className={`mobile-nav-link ${isActive("/shop")}`} onClick={() => setExpanded(false)}>
                {t('shop')}
              </Link>
              <Link to="/about" className={`mobile-nav-link ${isActive("/about")}`} onClick={() => setExpanded(false)}>
                {t('about')}
              </Link>
              <Link to="/contact" className={`mobile-nav-link ${isActive("/contact")}`} onClick={() => setExpanded(false)}>
                {t('contact')}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;