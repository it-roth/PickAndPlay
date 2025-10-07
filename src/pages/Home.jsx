import { useState, useEffect } from 'react';
import { Container, Row, Col, Carousel, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // In a real app, you might have endpoints for featured and new products
    // For now, we'll just use the general products endpoint
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        const products = response.data;
        
        // For demo purposes, let's split the products into featured and new
        setFeaturedProducts(products.slice(0, 4));
        setNewArrivals(products.slice(4, 8));
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
    <Container fluid className="p-0 home-container">
      {/* Hero Carousel */}
      <Carousel fade className="hero-carousel" indicators={false} controls={true} interval={5000}>
        {carouselItems.map((item, index) => (
          <Carousel.Item key={index}>
            <img
              className="d-block w-100 carousel-img"
              src={item.image}
              alt={item.title}
              style={{ height: '550px', objectFit: 'cover', objectPosition: 'center' }}
            />
            <Carousel.Caption>
              <h1>{item.title}</h1>
              <p>{item.description}</p>
              <Button as={Link} to={item.link} variant="primary" size="lg" className="shop-now-btn">
                Shop Now
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      {/* Featured Categories */}
      <Container className="py-5">
        <h2 className="text-center mb-4">Guitar Categories</h2>
        <Row>
          {['Acoustic', 'Electric', 'Classical', 'Bass'].map((category, index) => (
            <Col md={3} sm={6} key={index} className="mb-4">
              <Card className="text-center h-100">
                <Card.Body>
                  <Card.Title>{category} Guitars</Card.Title>
                  <Button 
                    as={Link} 
                    to={`/categories/${category.toLowerCase()}`}
                    variant="outline-primary"
                  >
                    Browse {category}
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>

      {/* Featured Products */}
      <Container className="py-3 bg-light">
        <h2 className="text-center mb-4">Featured Products</h2>
        {isLoading ? (
          <div className="text-center py-5">Loading products...</div>
        ) : (
          <Row>
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Col md={3} sm={6} key={product.id} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <div className="text-center py-3">
                <p>No featured products available at the moment.</p>
              </div>
            )}
          </Row>
        )}
        <div className="text-center mt-3">
          <Button as={Link} to="/shop" variant="primary">View All Products</Button>
        </div>
      </Container>

      {/* New Arrivals */}
      <Container className="py-5">
        <h2 className="text-center mb-4">New Arrivals</h2>
        {isLoading ? (
          <div className="text-center py-5">Loading products...</div>
        ) : (
          <Row>
            {newArrivals.length > 0 ? (
              newArrivals.map((product) => (
                <Col md={3} sm={6} key={product.id} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <div className="text-center py-3">
                <p>No new arrivals available at the moment.</p>
              </div>
            )}
          </Row>
        )}
      </Container>

      {/* Brand Highlight */}
      <Container className="py-5 text-center bg-light">
        <h2 className="mb-4">Top Brands</h2>
        <Row className="justify-content-center">
          {['Fender', 'Gibson', 'Ibanez', 'Martin', 'Taylor'].map((brand, index) => (
            <Col key={index} xs={6} md={2} className="mb-4">
              <Card className="border-0 bg-transparent">
                <Card.Body>
                  <h5>{brand}</h5>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </Container>
  );
}

export default Home;