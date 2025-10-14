import { useState, useEffect } from 'react';
import { Container, Row, Col, Carousel, Card, Button } from 'react-bootstrap';

import { Link } from 'react-router-dom';

import ProductCard from '../components/ProductCard';
import { productService } from '../lib/api';
import '../assets/styles/Home.css';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        const products = response.data;
        
  // For Featured: pick up to one product per category in the desired order
  const desiredCategories = ['Acoustic', 'Electric', 'Classical', 'Bass'];
  const featured = [];
  desiredCategories.forEach((cat) => {
    const found = products.find(p => {
      if (!p || !p.category) return false;
      return String(p.category).toLowerCase() === cat.toLowerCase();
    });
    if (found) featured.push(found);
  });
  // Fallback: if none found for a category we simply skip it (keeps featured list <= 4)
  setFeaturedProducts(featured);
  // Get the last 8 products and display most recent first
  const lastEight = products.slice(-8) || [];
  setNewArrivals(lastEight.slice().reverse());
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Hero carousel items
  const carouselItems = [
    {
      image: 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0',
      title: 'Find Your Perfect Guitar',
      description: 'Explore our wide selection of acoustic and electric guitars.',
      link: '/shop',
    },
    {
      image: 'https://images.unsplash.com/photo-1556449895-a33c9dba33dd',
      title: 'Professional Gear for Every Level',
      description: 'From beginners to experts, we have everything you need.',
      link: '/categories',
    },
    {
      image: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02',
      title: 'Special Offers',
      description: 'Check out our latest deals and promotions.',
      link: '/shop',
    },
  ];

  return (
    <div className="modern-home">
      {/* Hero Section with Gradient Overlay */}
      <section className="hero-section position-relative">
        <Carousel fade className="hero-carousel" indicators={true} controls={true} interval={6000}>
          {carouselItems.map((item, index) => (
            <Carousel.Item key={index}>
              <div className="hero-image-container">
                <img
                  className="d-block w-100 hero-image"
                  src={item.image}
                  alt={item.title}
                  style={{ 
                    height: '100vh', 
                    objectFit: 'cover', 
                    objectPosition: 'center'
                  }}
                />
              </div>
              <Carousel.Caption className="hero-caption">
                <div className="hero-content">
                  <h1 className={`hero-title ${item.title === 'Special Offers' ? 'hero-title--special' : ''}`}>{item.title}</h1>
                  <p className={`hero-description ${item.title === 'Special Offers' ? 'hero-description--special' : ''}`}>{item.description}</p>
                  <Button 
                    as={Link} 
                    to={item.link} 
                    className={`hero-cta-btn ${item.title === 'Special Offers' ? 'hero-cta-btn--special' : ''}`}
                    size="lg"
                  >
                    <i className="fas fa-guitar me-2"></i>
                    Shop Now
                  </Button>
                </div>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      {/* Categories Section */}
      <section className="categories-section py-10">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="section-title">Guitar Categories</h2>
            <p className="section-subtitle">Discover your perfect instrument</p>
            <div className="section-divider"></div>
          </div>
          <Row className="g-4">
            {['Acoustic', 'Electric', 'Classical', 'Bass'].map((category, index) => (
              <Col lg={3} md={6} key={index}>
                <Card className="category-card h-100 border-0 shadow-sm">
                  <Card.Body className="text-center p-4">
                      <Card.Title className="category-title">{category} Guitars</Card.Title>
                    <p className="category-description text-muted mb-4">
                      {category === 'Acoustic' ? 'Rich, natural sound' : 
                       category === 'Electric' ? 'Powerful & versatile' :
                       category === 'Classical' ? 'Traditional elegance' : 'Deep, rhythmic tones'}
                    </p>
                    <Button 
                      as={Link} 
                      to={`/categories/${category.toLowerCase()}`} 
                      className="category-btn"
                    >
                      Browse {category}
                      <i className="fas fa-arrow-right ms-2"></i>
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Featured Products Section */}
      <section className="featured-section py-5 bg-gradient">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Handpicked instruments for music lovers</p>
            <div className="section-divider"></div>
          </div>
          {isLoading ? (
            <div className="loading-container text-center py-5">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-white mt-3">Loading amazing products...</p>
            </div>
          ) : (
            <>
              <Row className="g-4">
                {featuredProducts.length > 0 ? (
                  featuredProducts.map((product, index) => (
                    <Col lg={3} md={6} key={product.id} className="mb-4" style={{animationDelay: `${index * 0.1}s`}}>
                      <div className="product-card-wrapper">
                        <ProductCard product={product} />
                      </div>
                    </Col>
                  ))
                ) : (
                  <Col xs={12}>
                    <div className="no-products text-center py-5">
                      <i className="fas fa-guitar fa-3x text-white-50 mb-3"></i>
                      <p className="text-white">No featured products available at the moment.</p>
                    </div>
                  </Col>
                )}
              </Row>
            </>
          )}
        </Container>
      </section>

      {/* New Arrivals Section */}
      <section className="new-arrivals-section py-5">
        <Container>
          <div className="section-header text-center mb-5">
            <h2 className="section-title">New Arrivals</h2>
            <p className="section-subtitle">Fresh additions to our collection</p>
            <div className="section-divider"></div>
          </div>
          {isLoading ? (
            <div className="loading-container text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-3">Discovering new instruments...</p>
            </div>
          ) : (
            <Row className="g-4">
              {newArrivals.length > 0 ? (
                newArrivals.map((product, index) => (
                  <Col lg={3} md={6} key={product.id} className="mb-4" style={{animationDelay: `${index * 0.1}s`}}>
                    <div className="product-card-wrapper">
                      <ProductCard product={product} />
                    </div>
                  </Col>
                ))
              ) : (
                <Col xs={12}>
                  <div className="no-products text-center py-5">
                    <i className="fas fa-plus-circle fa-3x text-muted mb-3"></i>
                    <p className="text-muted">No new arrivals available at the moment.</p>
                  </div>
                </Col>
              )}
            </Row>
          )}
        </Container>
      </section>
    </div>
  );
}

export default Home;