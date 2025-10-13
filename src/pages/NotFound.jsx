import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <Container className="mt-5 pt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6} className="mb-5 text-center">
          <div className="fs-1 mb-4">
            <h2 className="section-title">Contact Us – Pick & Play</h2>
            <div className="section-underline"></div>
            <p className="fs-4 fw-semibold mb-4">
              Have questions or need help? We’re here for you!
            </p>
            <p className="fs-5 mb-4 text-muted">
              Whether you’re looking for product advice, support, or just want
              to say hello, you can reach us through any of the channels below.
            </p>
          </div>
        </Col>
      </Row>

      {/* contact section - full width */}
      <section>
        <Row className="justify-content-center">
          <Col lg={12} className="mb-5">
            <h2 className="section-title mb-4 text-center">
              Our Contact Information
            </h2>
            <div className="section-underline mb-4"></div>

            <div className="d-flex flex-wrap justify-content-center align-items-start fs-5 mb-3 text-start">
              <div
                className="d-flex align-items-start mx-3 mb-2"
                style={{ flexDirection: "column", maxWidth: "250px" }}
              >
                <div className="d-flex align-items-center mb-1">
                  <i
                    className="bi bi-envelope-fill me-2 text-primary"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  <a href="mailto:support@pickandplay.com">
                    support@pickandplay.com
                  </a>
                </div>
                <div className="text-muted fs-6">
                  Perfect for questions about orders, products, or general
                  inquiries.
                </div>
              </div>
              <div
                className="d-flex align-items-start mx-3 mb-2"
                style={{ flexDirection: "column", maxWidth: "250px" }}
              >
                <div className="d-flex align-items-center mb-1">
                  <i
                    className="bi bi-instagram me-2 text-danger"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  <a href="#">@PickAndPlayGuitars</a>
                </div>
                <div className="text-muted fs-6">
                  Follow us for updates, new arrivals, and music inspiration. DM
                  us anytime!
                </div>
              </div>
              <div
                className="d-flex align-items-start mx-3 mb-2"
                style={{ flexDirection: "column", maxWidth: "250px" }}
              >
                <div className="d-flex align-items-center mb-1">
                  <i
                    className="bi bi-facebook me-2 text-primary"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  <a href="#">Pick & Play</a>
                </div>
                <div className="text-muted fs-6">
                  Send us a message or leave a comment for quick responses.
                </div>
              </div>
              <div
                className="d-flex align-items-start mx-3 mb-2"
                style={{ flexDirection: "column", maxWidth: "250px" }}
              >
                <div className="d-flex align-items-center mb-1">
                  <i
                    className="bi bi-telephone-fill me-2 text-success"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  <a href="#">+855 12 345 678</a>
                </div>
                <div className="text-muted fs-6">
                  Call or WhatsApp for fast support during business hours
                  (Mon–Fri, 9 AM–6 PM).
                </div>
              </div>
            </div>

            {/* Location below */}
            <div className="d-flex align-items-start justify-content-center mt-3 fs-5 text-start">
              <i
                className="bi bi-geo-alt-fill me-2 text-danger"
                style={{ fontSize: "1.5rem" }}
              ></i>
              <div>
                Pick & Play HQ, 123 Music Lane, Phnom Penh, Cambodia
                <p className="text-muted mb-0">
                  Drop by if you want to try our guitars in person!
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </section>
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="section-title text-center mb-4">Send Us a Message</h2>
          <div className="section-underline mb-4 mx-auto"></div>

          <div className="row justify-content-center">
            <div className="col-lg-8">
              <p className="text-center mb-4 fs-5 text-muted">
                Have a question or need some advice? Fill out the form below and
                our team will get back to you within 24 hours!
              </p>

              <form>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label fw-semibold">
                    Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="email" className="form-label fw-semibold">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="message" className="form-label fw-semibold">
                    Message
                  </label>
                  <textarea
                    className="form-control"
                    id="message"
                    rows="5"
                    placeholder="Write your message here..."
                    required
                  ></textarea>
                </div>

                <div className="text-center ">
                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2 fw-semibold "
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="mt-5 text-center">
            <h4 className="mb-3">Why Contact Us?</h4>
            <ul className="list-unstyled fs-5 text-muted">
              <li>🎸 Product advice from guitar experts</li>
              <li>🚚 Help with orders, shipping, or returns</li>
              <li>🎶 Custom recommendations based on your skill level</li>
              <li>💬 Feedback or suggestions to make our service better</li>
            </ul>
          </div>
        </div>
      </section>

      <Row className="justify-content-center">
        <Col className="text-center mt-4 mb-4">
          <Link to="/" className="btn btn-primary rounded-pill px-4">
            <i className="bi bi-house-fill me-2 "></i>
            Back to Home
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default NotFound;
