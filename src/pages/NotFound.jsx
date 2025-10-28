import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <Container className="py-3 text-center" style={{ paddingTop: '20px' }}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="p-5 bg-white rounded shadow-sm">
            <div className="fs-1 text-warning mb-4">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h1 className="display-5 fw-bold text-primary mb-4">404 - Page Not Found</h1>
            <p className="fs-5 text-muted mb-4">The page you are looking for does not exist.</p>
            <div className="mt-4">
              <Link to="/" className="btn btn-primary rounded-pill px-4">
                <i className="bi bi-house-fill me-2"></i>
                Back to Home
              </Link>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;
