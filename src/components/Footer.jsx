import { Container, Row, Col } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import logoImage from '../assets/images/Logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../assets/styles/footer.css';
import { useContext } from 'react';
import { LocaleContext } from '../contexts/LocaleContext';

function Footer() {
  const location = useLocation();
  const { t } = useContext(LocaleContext);

  // Hide footer on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') return null;
  return (
    <footer className="footer-container">
      <div className="footer-main">
        <Container>
          <Row className="py-4">
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <div className="footer-logo-container mb-3">
                <img src={logoImage} alt="Pick & Play" className="footer-logo" />
              </div>
              <p className="mb-3">{t('footerDescription')}</p>
              <div className="footer-social">
                <a href="#" className="me-2 social-icon"><i className="bi bi-facebook"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-instagram"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-youtube"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-twitter"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-github"></i></a>
              </div>
            </Col>
            
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="footer-heading">{t('features')}</h5>
              <ul className="footer-links">
                <li><Link to="/">{t('home')}</Link></li>
                <li><Link to="/shop">{t('shop')}</Link></li>
                <li><Link to="/about">{t('about')}</Link></li>
                <li><Link to="/contact">{t('contact')}</Link></li>
              </ul>
            </Col>
            
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="footer-heading">{t('legal')}</h5>
              <ul className="footer-links">
                <li><a href="#">{t('privacyPolicy')}</a></li>
                <li><a href="#">{t('licensing')}</a></li>
                <li><a href="#">{t('terms')}</a></li>
              </ul>
            </Col>
            
            <Col lg={3} md={6}>
              <h5 className="footer-heading">{t('download')}</h5>
              <ul className="footer-links">
                <li><a href="#">{t('ios')}</a></li>
                <li><a href="#">{t('android')}</a></li>
                <li><a href="#">{t('windows')}</a></li>
                <li><a href="#">{t('macos')}</a></li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>
      
      <div className="footer-bottom">
        <Container>
          <p className="m-0 text-center py-3">&copy; {new Date().getFullYear()} {t('copyright')}</p>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;