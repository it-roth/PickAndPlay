import React from 'react';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';
import { StarFill, PeopleFill, MusicNoteBeamed, EnvelopeFill } from 'react-bootstrap-icons';
// import './about.css';
import guitarTeam1 from '../assets/images/team/team-member1.jpg';
import guitarTeam2 from '../assets/images/team/team-member2.jpg';
import guitarTeam3 from '../assets/images/team/team-member3.jpg';

function About() {
  // Team members data
  const teamMembers = [
    {
      id: 1,
      name: "Leng Saroth",
      role: "Project Manager",
      bio: "Roth has over 8 years of experience in full-stack development and is passionate about creating seamless user experiences.",
      image: guitarTeam1
    },
    {
      id: 2,
      name: "Sarah Williams",
      role: "UI/UX Designer",
      bio: "Sarah brings creative design solutions with expertise in creating intuitive interfaces and engaging user experiences.",
      image: guitarTeam2
    },
    {
      id: 3,
      name: "Michael Chen",
      role: "Project Manager",
      bio: "Michael coordinates all aspects of the project and ensures that we deliver quality products on schedule.",
      image: guitarTeam3
    }
  ];

  return (
    <div className="about-page-container">
      {/* Hero section */}
      <div className="hero-section">
        <div className="hero-bg"></div>
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold text-white">About Pick & Play</h1>
              <p className="fs-5 text-white">Quality Guitars for Musicians at Every Level</p>
            </Col>
          </Row>
        </Container>
        <div className="wave-separator"></div>
      </div>

      {/* Introduction section */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} className="text-center mb-5">
              <h2 className="section-title">Our Story</h2>
              <div className="section-underline"></div>
              <p className="fs-5 mb-4">
                Pick & Play was founded in 2020 with a simple mission: to provide high-quality guitars 
                and accessories to musicians of all skill levels at fair prices. What started as a small 
                passion project has grown into a comprehensive online destination for guitar enthusiasts.
              </p>
              <p className="fs-5 mb-4">
                We believe that everyone deserves access to quality instruments that inspire creativity 
                and musical growth. Our team of dedicated musicians and experts carefully selects each 
                product in our inventory, ensuring that we offer only the best to our customers.
              </p>
              <p className="fs-5 mb-4">
                Whether you're just starting your musical journey or are a seasoned professional, 
                Pick & Play is committed to helping you find the perfect instrument and accessories 
                to express yourself through music.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team section */}
      <section className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Meet Our Team</h2>
              <div className="section-underline"></div>
              <p className="lead">The passionate people behind Pick & Play</p>
            </Col>
          </Row>
          
          <Row>
            {teamMembers.map(member => (
              <Col md={4} key={member.id}>
                <Card className="h-100 border-0 shadow mb-4 p-3" style={{ transition: 'all 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div className="text-center p-3">
                    <Image 
                      src={member.image} 
                      alt={member.name}
                      className="team-member-image rounded-circle img-thumbnail" 
                      style={{ 
                        width: '180px', 
                        height: '180px', 
                        objectFit: 'cover', 
                        objectPosition: 'center top',
                        borderWidth: '3px',
                        borderColor: '#198754',
                        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                        animation: 'pulse-border 2s infinite'
                      }}
                    />
                  </div>
                  <Card.Body className="text-center pt-3">
                    <Card.Title className="h4 fw-bold" style={{ color: '#fd7e14' }}>{member.name}</Card.Title>
                    <Card.Subtitle className="mb-3 fw-semibold" style={{ color: '#198754' }}>{member.role}</Card.Subtitle>
                    <Card.Text className="text-muted">{member.bio}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Values section */}
      <section className="py-5 mb-0">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Our Values</h2>
              <div className="section-underline"></div>
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col lg={4} md={6} className="mb-4">
              <div className="value-card" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="value-icon">
                  <StarFill size={40} />
                </div>
                <h3 className="value-title">Quality</h3>
                <p>We never compromise on the quality of our products. Every guitar is carefully selected and inspected to ensure the best performance.</p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className="value-card" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="value-icon">
                  <PeopleFill size={40} />
                </div>
                <h3 className="value-title">Community</h3>
                <p>Building a community of passionate musicians through events, workshops, and online forums to share our love for music.</p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className="value-card" onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div className="value-icon">
                  <MusicNoteBeamed size={40} />
                </div>
                <h3 className="value-title">Passion</h3>
                <p>Our love for music drives everything we do. We're not just selling instruments; we're sharing our passion for creating beautiful sounds.</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact CTA section */}
      <section className="contact-cta-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <h2 className="cta-title">Ready to find your perfect guitar?</h2>
              <p className="cta-text">Our team is here to help you choose the right instrument for your musical journey.</p>
              <a href="/shop" className="cta-button">
                <MusicNoteBeamed className="me-2" />Shop Now
              </a>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default About;