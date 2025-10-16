import React from 'react';
import { Container, Row, Col, Card, Image } from 'react-bootstrap';
import { StarFill, PeopleFill, MusicNoteBeamed } from 'react-bootstrap-icons';
import guitarTeam1 from '../assets/images/team/team-member1.jpg';
import guitarTeam2 from '../assets/images/team/team-member2.jpg';
import guitarTeam3 from '../assets/images/team/team-member3.jpg';

function About() {
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
      name: "Pen Khemaraktumpoir",
      role: "UI/UX Designer",
      bio: "Por brings creative design solutions with expertise in creating intuitive interfaces and engaging user experiences.",
      image: guitarTeam2
    },
    {
      id: 3,
      name: "Panha",
      role: "Project Manager",
      bio: "Panha coordinates all aspects of the project and ensures that we deliver quality products on schedule.",
      image: guitarTeam3
    }
  ];

  return (
    <div className="about-page-container">
      <div className="hero-section position-relative text-center text-white" style={{
        backgroundImage: "url('../assets/images/hero-guitar.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "400px",
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)" // semi-transparent overlay
        }}></div>

        <Container style={{ position: "relative", zIndex: 1 }}>
          <Row className="justify-content-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold">About Pick & Play</h1>
              <p className="fs-5 mb-4">Quality Guitars for Musicians at Every Level</p>
              <a href="/shop" className="btn btn-warning btn-lg">
                Explore Guitars
              </a>
            </Col>
          </Row>
        </Container>
      </div>


      {/* Our Story */}
      <section className="our-story-section">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10} className="text-center mb-5">
              <h2 className="section-title">Our Story</h2>
              <div className="section-underline"></div>
              <p className="fs-5 mb-4">
                Founded in 2020 by passionate musicians,{" "}
                <strong>Pick & Play</strong> was born from a simple idea: to
                make high-quality guitars accessible to everyone, from beginners
                to seasoned professionals.
              </p>
              <p className="fs-5 mb-4">
                What started as a small passion project has grown into a trusted
                destination for guitar enthusiasts worldwide. Our team carefully
                curates every instrument, ensuring it meets the highest
                standards of playability, tone, and durability.
              </p>
              <Row className="text-start mt-4">
                <Col md={4} className="mb-3">
                  <h5 className="fw-bold" style={{ color: "#fd7e14" }}>
                    Milestones
                  </h5>
                  <ul className="fs-6">
                    <li>
                      2020: Pick & Play founded with the mission to deliver
                      quality guitars.
                    </li>
                    <li>2022: Over 10,000 satisfied customers worldwide.</li>
                    <li>
                      2023: Partnered with local music schools to support
                      aspiring musicians.
                    </li>
                  </ul>
                </Col>
                <Col md={4} className="mb-3">
                  <h5 className="fw-bold" style={{ color: "#fd7e14" }}>
                    Our Promise
                  </h5>
                  <ul className="fs-6">
                    <li>
                      Quality instruments selected with care and expertise.
                    </li>
                    <li>
                      Exceptional customer service to guide your musical
                      journey.
                    </li>
                    <li>
                      Community-driven events and workshops to connect
                      musicians.
                    </li>
                  </ul>
                </Col>
                <Col md={4} className="mb-3">
                  <h5 className="fw-bold" style={{ color: "#fd7e14" }}>
                    Vision
                  </h5>
                  <p className="fs-6">
                    To inspire creativity and empower musicians everywhere by
                    providing the perfect tools to express themselves through
                    music. Join us in making music accessible to all.
                  </p>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Meet Our Team</h2>
              <div className="section-underline"></div>
              <p className="lead">The passionate people behind Pick & Play</p>
            </Col>
          </Row>
          <Row>
            {teamMembers.map((member) => (
              <Col md={4} key={member.id}>
                <Card
                  className="h-100 border-0 shadow mb-4 p-3"
                  style={{ transition: "all 0.3s ease" }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = "translateY(-10px)")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = "translateY(0)")
                  }
                >
                  <div className="text-center p-3">
                    <Image
                      src={member.image}
                      alt={member.name}
                      className="team-member-image rounded-circle img-thumbnail"
                      style={{
                        width: "180px",
                        height: "180px",
                        objectFit: "cover",
                        objectPosition: "center top",
                        borderWidth: "3px",
                        borderColor: "#198754",
                        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
                        animation: "pulse-border 2s infinite",
                      }}
                    />
                  </div>
                  <Card.Body className="text-center pt-3">
                    <Card.Title
                      className="h4 fw-bold"
                      style={{ color: "#fd7e14" }}
                    >
                      {member.name}
                    </Card.Title>
                    <Card.Subtitle
                      className="mb-3 fw-semibold"
                      style={{ color: "#198754" }}
                    >
                      {member.role}
                    </Card.Subtitle>
                    <Card.Text className="text-muted">{member.bio}</Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Values Section */}
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
              <div
                className="value-card"
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-10px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div className="value-icon">
                  <StarFill size={40} />
                </div>
                <h3 className="value-title">Quality</h3>
                <p>
                  We never compromise on the quality of our products. Every
                  guitar is carefully selected and inspected to ensure the best
                  performance.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div
                className="value-card"
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-10px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div className="value-icon">
                  <PeopleFill size={40} />
                </div>
                <h3 className="value-title">Community</h3>
                <p>
                  Building a community of passionate musicians through events,
                  workshops, and online forums to share our love for music.
                </p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div
                className="value-card"
                onMouseOver={(e) =>
                  (e.currentTarget.style.transform = "translateY(-10px)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div className="value-icon">
                  <MusicNoteBeamed size={40} />
                </div>
                <h3 className="value-title">Passion</h3>
                <p>
                  Our love for music drives everything we do. We're not just
                  selling instruments; we're sharing our passion for creating
                  beautiful sounds.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact CTA */}
      <section className="contact-cta-section mb-4">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <h2 className="cta-title">Ready to find your perfect guitar?</h2>
              <p className="cta-text">
                Our team is here to help you choose the right instrument for
                your musical journey.
              </p>
              <a href="/shop" className="cta-button">
                <MusicNoteBeamed className="me-2" />
                Shop Now
              </a>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}

export default About;
