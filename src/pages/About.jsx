import React from "react";
import { Container, Row, Col, Card, Image } from "react-bootstrap";
import { StarFill, PeopleFill, MusicNoteBeamed } from "react-bootstrap-icons";
import { motion } from "framer-motion";
import guitarTeam1 from "../assets/images/team/team-member1.jpg";
import guitarTeam2 from "../assets/images/team/team-member2.jpg";
import guitarTeam3 from "../assets/images/team/team-member3.jpg";

function About() {
 const teamMembers = [
  {
    id: 1,
    name: "Leng Saroth",
    role: "Project Lead",
    bio: "Roth oversees all aspects of the project, from backend to frontend, ensuring everything runs smoothly with a focus on high-quality results.",
    image: guitarTeam1,
  },
  {
    id: 2,
    name: "Pen Khemaraktumpoir",
    role: "UI/UX Designer",
    bio: "Tumpoir focuses exclusively on user interface and experience design, ensuring every layout, color, and interaction is intuitive and visually appealing.",
    image: guitarTeam2,
  },
  {
    id: 3,
    name: "Oeung Panha",
    role: "Frontend Developer",
    bio: "Panha is responsible for the frontend development, turning design concepts into responsive and interactive web interfaces.",
    image: guitarTeam3,
  },
];


  return (
    <div className="about-page-container">
      {/* HERO SECTION */}
      <section
        className="hero-section text-center text-white d-flex align-items-center justify-content-center position-relative"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1500&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "75vh",
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
          <h1 className="display-3 fw-bold mb-3 text-orange">
            About Pick & Play
          </h1>
          <p className="fs-4">Quality Guitars for Musicians at Every Level</p>
        </motion.div>
      </section>

      {/* OUR STORY */}
      <section className="py-5 bg-light text-center">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="section-title mb-3 text-orange">Our Story</h2>
            <div className="section-underline mb-4 mx-auto"></div>
            <p className="lead mx-auto" style={{ maxWidth: "850px" }}>
              Pick & Play was founded in 2020 with a simple mission: to provide
              high-quality guitars and accessories to musicians of all skill
              levels at fair prices. What started as a small passion project has
              grown into a comprehensive online destination for guitar
              enthusiasts.
            </p>
            <p
              className="fs-5 text-muted mx-auto"
              style={{ maxWidth: "850px" }}
            >
              We believe that everyone deserves access to quality instruments
              that inspire creativity and musical growth. Our team of dedicated
              musicians and experts carefully selects each product, ensuring
              that we offer only the best to our customers.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* MEET THE TEAM */}
      <section className="py-5" style={{ backgroundColor: "#f8f9fa" }}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title text-orange">Meet Our Team</h2>
              <div className="section-underline mb-3 mx-auto"></div>
              <p className="text-muted">
                The passionate people behind Pick & Play
              </p>
            </Col>
          </Row>
          <Row>
            {teamMembers.map((member) => (
              <Col md={4} key={member.id}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                    <Card className="team-card border-0 shadow-lg mb-4 rounded-4">
                    <Card.Body className="text-center p-4">
                      <div className="team-image-wrapper">
                        <Image
                          src={member.image}
                          alt={member.name}
                          className="rounded-circle mb-3 border border-3 border-orange shadow-sm"
                          style={{
                            height: "180px",
                            width: "180px",
                            objectFit: "cover",
                          }}
                        />
                      </div>

                      <div className="p-4">
                        <h4 className="fw-bold text-orange">{member.name}</h4>
                        <h6 className="text-orange fw-semibold mb-3">
                          {member.role}
                        </h6>
                        <p className="text-muted small">{member.bio}</p>
                      </div>
                    </Card.Body>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* OUR VALUES */}
      <section className="py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title text-orange">Our Values</h2>
              <div className="section-underline mb-3 mx-auto"></div>
            </Col>
          </Row>
          <Row className="justify-content-center">
            {[
              {
                icon: <StarFill size={50} />,
                title: "Quality",
                desc: "Every guitar we offer is hand-selected to ensure professional sound and craftsmanship.",
              },
              {
                icon: <PeopleFill size={50} />,
                title: "Community",
                desc: "We bring together musicians worldwide through workshops, discussions, and shared creativity.",
              },
              {
                icon: <MusicNoteBeamed size={50} />,
                title: "Passion",
                desc: "We don’t just sell guitars — we celebrate music and the people who make it.",
              },
            ].map((value, idx) => (
              <Col lg={4} md={6} key={idx} className="mb-4">
                <motion.div
                  whileHover={{ y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-white rounded-4 shadow-sm h-100"
                >
                  <div className="text-orange mb-3">{value.icon}</div>
                  <h4 className="fw-bold text-orange">{value.title}</h4>
                  <p className="text-muted">{value.desc}</p>
                </motion.div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* CALL TO ACTION */}
      <section
        className="text-center text-white py-5"
        style={{
          background: "linear-gradient(135deg, #fd7e14 0%, #198754 100%)",
        }}
      >
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="fw-bold mb-3">Ready to find your perfect guitar?</h2>
            <p className="fs-5 mb-4">
              Our team is here to help you choose the right instrument for your
              musical journey.
            </p>
            <a
              href="/shop"
              className="btn btn-light btn-lg px-4 py-2 fw-semibold shadow"
            >
              <MusicNoteBeamed className="me-2" />
              Shop Now
            </a>
          </motion.div>
        </Container>
      </section>
    </div>
  );
}

export default About;