import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import logoImage from '../assets/images/Logo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-main">
        <Container>
          <Row className="py-4">
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <div className="footer-logo-container mb-3">
                <img src={logoImage} alt="Pick & Play" className="footer-logo" />
              </div>
              <p className="mb-3">Your ultimate destination for quality guitars and accessories at fair prices.</p>
              <div className="footer-social">
                <a href="#" className="me-2 social-icon"><i className="bi bi-facebook"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-instagram"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-youtube"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-twitter"></i></a>
                <a href="#" className="me-2 social-icon"><i className="bi bi-github"></i></a>
              </div>
            </Col>
            
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="footer-heading">Features</h5>
              <ul className="footer-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/shop">Shop</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/blog">Blog</Link></li>
              </ul>
            </Col>
            
            <Col lg={3} md={6} className="mb-4 mb-lg-0">
              <h5 className="footer-heading">Legal</h5>
              <ul className="footer-links">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/licensing">Licensing</Link></li>
                <li><Link to="/terms">Terms & Conditions</Link></li>
              </ul>
            </Col>
            
            <Col lg={3} md={6}>
              <h5 className="footer-heading">Download</h5>
              <ul className="footer-links">
                <li><a href="#">iOS</a></li>
                <li><a href="#">Android</a></li>
                <li><a href="#">Windows</a></li>
                <li><a href="#">MacOS</a></li>
              </ul>
            </Col>
          </Row>
        </Container>
      </div>
      
      <div className="footer-bottom">
        <Container>
          <p className="m-0 text-center py-3">&copy; {new Date().getFullYear()} Pick & Play Guitar Shop. All rights reserved.</p>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;