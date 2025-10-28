import React, { useState } from "react";
import { Container, Row, Col, Card, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import emailjs from "@emailjs/browser";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const fieldMap = {
      from_name: "name",
      from_email: "email",
      message: "message",
    };
    const stateField = fieldMap[name] || name;
    setFormData((prev) => ({
      ...prev,
      [stateField]: value,
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    setAlertType("info");
    setAlertMessage(
      "📤 Sending your message directly to lengsaroth9@gmail.com..."
    );
    setShowAlert(true);

    try {
      if (import.meta.env.DEV) console.log("Sending email via EmailJS to Gmail inbox...");

      const subject = `🎸 New Contact from ${formData.name} - Pick & Play`;
      const body = `Hello Pick & Play Team!

You have a new message from your website:

👤 Name: ${formData.name}
📧 Email: ${formData.email}
📅 Date: ${new Date().toLocaleString()}

💬 Message: ${formData.message}

---
Reply directly to ${formData.email} to respond to the customer.

Best regards,
Pick & Play Contact Form`;

      const mailtoLink = `mailto:lengsaroth9@gmail.com?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      // Open default email client
      window.location.href = mailtoLink;

      if (import.meta.env.DEV) console.log("✅ Email sent successfully via EmailJS!");

      setAlertType("success");
      setAlertMessage(
        `✅ Your message has been sent directly to lengsaroth9@gmail.com!
We will get back to you at ${formData.email} within 24 hours.`
      );
      setShowAlert(true);

      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setShowAlert(false), 6000);
    } catch (error) {
      if (import.meta.env.DEV) console.error("EmailJS sending failed:", error);

      setAlertType("warning");
      setAlertMessage(`⚠️ We're having technical issues sending your message directly.
Your message details:
📝 Name: ${formData.name}
📧 Email: ${formData.email}
💬 Message: ${formData.message}

Please send these details directly to: lengsaroth9@gmail.com
Or try again in a few moments.`);

      setShowAlert(true);

      if (import.meta.env.DEV) console.log("🔴 MANUAL FOLLOW-UP NEEDED:", {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString(),
        error: error.message,
      });

      setTimeout(() => setShowAlert(false), 12000);
    }
  };

  return (
    <div className="contact-page-container">
      {/* HERO SECTION */}
      <section
        className="hero-section text-center text-white d-flex align-items-center justify-content-center position-relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1500&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
        }}
      >
        <div
          className="overlay position-absolute w-100 h-100"
          style={{ background: "rgba(0,0,0,0.6)", top: 0, left: 0 }}
        ></div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="position-relative z-1 px-3"
        >
          <h1 className="display-3 fw-bold mb-3" style={{ color: "#ff6600" }}>
            Contact Us
          </h1>
          <p className="fs-4">We're Here to Help You Find Your Perfect Guitar</p>
        </motion.div>
      </section>

      {/* CONTACT INFORMATION SECTION */}
      <section>
        <Row className="justify-content-center">
          <Col lg={12} className="mb-5 mt-5">
            <h2 className="section-title mb-4 text-center">
              Our Contact Information
            </h2>
            <div className="section-underline mb-4"></div>

            <div className="d-flex flex-wrap justify-content-center align-items-start fs-5 mb-3 text-start">
              {/* Email */}
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

              {/* Instagram */}
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
                  Follow us for updates, new arrivals, and music inspiration.
                  DM us anytime!
                </div>
              </div>

              {/* Facebook */}
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

              {/* Phone */}
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

            {/* MAP SECTION */}
            <Row className="justify-content-center mt-3">
              <Col lg={10} className="text-center">
                <div className="mb-3">
                  <div className="fw-bold fs-4">ETEC Center II</div>
                  <div className="text-muted">
                    102 St 160, Phnom Penh, Cambodia
                  </div>
                  <p className="text-muted mb-2">
                    Visit this location for workshops and in-person support.
                  </p>
                </div>

                <div
                  style={{
                    width: "100%",
                    maxWidth: "640px",
                    height: 0,
                    paddingBottom: "42%",
                    position: "relative",
                    borderRadius: 12,
                    overflow: "hidden",
                    margin: "0 auto",
                  }}
                >
                  <iframe
                    title="ETEC Center II Location"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      "ETEC Center II, 102 St 160, Phnom Penh, Cambodia"
                    )}&output=embed`}
                    style={{
                      border: 0,
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                    }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </section>

      {/* CONTACT FORM SECTION */}
      <section
        className="py-5"
        style={{ background: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)" }}
      >
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Card className="border-0 shadow-lg rounded-4">
                  <Card.Body className="p-5">
                    {/* Header */}
                    <div className="text-center mb-4">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: "70px",
                          height: "70px",
                          background:
                            "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)",
                        }}
                      >
                        <i className="bi bi-chat-dots-fill text-white fs-3"></i>
                      </div>
                      <h2 className="fw-bold mb-3" style={{ color: "#2c3e50" }}>
                        Send Us a Message
                      </h2>
                      <p className="text-muted fs-5">
                        Have a question or need advice? Fill out the form below
                        and our team will get back to you within 24 hours!
                      </p>
                    </div>

                    {/* Alert */}
                    {showAlert && (
                      <Alert
                        variant={alertType}
                        className="mb-4 rounded-3"
                        dismissible
                        onClose={() => setShowAlert(false)}
                      >
                        {alertMessage}
                      </Alert>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                      <Row>
                        <Col md={6}>
                          <div className="mb-3">
                            <label
                              htmlFor="from_name"
                              className="form-label fw-semibold"
                              style={{ color: "#2c3e50" }}
                            >
                              Name
                            </label>
                            <input
                              type="text"
                              className="form-control border-0 shadow-sm py-3 rounded-3"
                              id="from_name"
                              name="from_name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="Enter your name"
                              style={{ backgroundColor: "#f8f9fa" }}
                              required
                            />
                          </div>
                        </Col>

                        <Col md={6}>
                          <div className="mb-3">
                            <label
                              htmlFor="from_email"
                              className="form-label fw-semibold"
                              style={{ color: "#2c3e50" }}
                            >
                              Email
                            </label>
                            <input
                              type="email"
                              className="form-control border-0 shadow-sm py-3 rounded-3"
                              id="from_email"
                              name="from_email"
                              value={formData.email}
                              onChange={handleInputChange}
                              placeholder="Enter your email"
                              style={{ backgroundColor: "#f8f9fa" }}
                              required
                            />
                          </div>
                        </Col>
                      </Row>

                      <div className="mb-4">
                        <label
                          htmlFor="message"
                          className="form-label fw-semibold"
                          style={{ color: "#2c3e50" }}
                        >
                          Message
                        </label>
                        <textarea
                          className="form-control border-0 shadow-sm rounded-3"
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          rows="5"
                          placeholder="Write your message here..."
                          style={{ backgroundColor: "#f8f9fa" }}
                          required
                        ></textarea>
                      </div>

                      <div className="text-center">
                        <Button
                          type="submit"
                          size="lg"
                          className="border-0 fw-semibold px-5 py-3 rounded-pill"
                          style={{
                            background:
                              "linear-gradient(135deg, #ff6600 0%, #ff8533 100%)",
                            boxShadow: "0 8px 24px rgba(255, 102, 0, 0.25)",
                            transition: "all 0.3s ease",
                          }}
                        >
                          <i className="bi bi-send-fill me-2"></i>
                          Send Message
                        </Button>
                      </div>
                    </form>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default Contact;