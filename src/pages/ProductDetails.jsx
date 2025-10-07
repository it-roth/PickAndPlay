import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Breadcrumb, Image, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { productService } from '../services/api';

function ProductDetails() {
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getProductById(id);
        setProduct(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching product details:', error);
        setIsLoading(false);
        // Redirect to 404 page or show error message
      }
    };
    
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (event) => {
    const value = parseInt(event.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  const addToCart = () => {
    if (!product) return;
    
    // Get existing cart or initialize empty array
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // Increase quantity if product exists
      cart[existingItemIndex].quantity += quantity;
    } else {
      // Add new product with selected quantity
      cart.push({
        ...product,
        quantity
      });
    }
    
    // Save updated cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Optional: Show feedback to user
    alert(`${product.name} added to cart!`);
    
    // Trigger event to update cart count in navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };
  
  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <p>Loading product details...</p>
      </Container>
    );
  }
  
  if (!product) {
    return (
      <Container className="py-5 text-center">
        <h2>Product not found</h2>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Breadcrumb navigation */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item href="/shop">Shop</Breadcrumb.Item>
        <Breadcrumb.Item href={`/categories/${product.category.toLowerCase()}`}>
          {product.category}
        </Breadcrumb.Item>
        <Breadcrumb.Item active>{product.name}</Breadcrumb.Item>
      </Breadcrumb>
      
      {/* Product main info */}
      <Row className="mb-5">
        <Col md={6}>
          <Image 
            src={product.imageUrl || 'https://via.placeholder.com/600x400?text=Guitar+Image'} 
            alt={product.name}
            fluid
            className="product-image"
          />
        </Col>
        <Col md={6}>
          <h1 className="mb-2">{product.name}</h1>
          <h5 className="text-muted mb-3">{product.brand}</h5>
          <div className="mb-3">
            <span className="h3">${product.price.toFixed(2)}</span>
            {product.oldPrice && (
              <span className="text-muted text-decoration-line-through ms-3">
                ${product.oldPrice.toFixed(2)}
              </span>
            )}
          </div>
          <p>{product.shortDescription || product.description}</p>
          
          {/* Stock information */}
          <p className={product.inStock ? 'text-success' : 'text-danger'}>
            {product.inStock ? 'In Stock' : 'Out of Stock'}
          </p>
          
          {/* Quantity selector */}
          <div className="d-flex align-items-center mb-4">
            <label htmlFor="quantity" className="me-3">Quantity:</label>
            <input
              id="quantity"
              type="number"
              className="form-control me-3"
              style={{ width: '80px' }}
              value={quantity}
              onChange={handleQuantityChange}
              min="1"
              max={product.inStock ? product.stockQuantity || 10 : 0}
            />
            <Button 
              variant="primary" 
              size="lg"
              onClick={addToCart}
              disabled={!product.inStock}
            >
              Add to Cart
            </Button>
          </div>
          
          {/* Product meta info */}
          <ListGroup variant="flush" className="mb-4">
            <ListGroup.Item>
              <strong>SKU:</strong> {product.sku || `GP-${product.id}`}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Category:</strong> {product.category}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Type:</strong> {product.type}
            </ListGroup.Item>
          </ListGroup>
        </Col>
      </Row>
      
      {/* Product tabs with details */}
      <Tabs
        defaultActiveKey="description"
        className="mb-5"
      >
        <Tab eventKey="description" title="Description">
          <div className="p-4">
            <div dangerouslySetInnerHTML={{ __html: product.description }}></div>
          </div>
        </Tab>
        <Tab eventKey="specs" title="Specifications">
          <div className="p-4">
            <Row>
              <Col md={6}>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Body Material:</strong> {product.specs?.bodyMaterial || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Neck Material:</strong> {product.specs?.neckMaterial || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Fingerboard:</strong> {product.specs?.fingerboard || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Number of Frets:</strong> {product.specs?.frets || 'N/A'}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col md={6}>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <strong>Pickups:</strong> {product.specs?.pickups || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Scale Length:</strong> {product.specs?.scaleLength || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Bridge Type:</strong> {product.specs?.bridgeType || 'N/A'}
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Hardware Finish:</strong> {product.specs?.hardwareFinish || 'N/A'}
                  </ListGroup.Item>
                </ListGroup>
              </Col>
            </Row>
          </div>
        </Tab>
        <Tab eventKey="reviews" title="Reviews">
          <div className="p-4">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map(review => (
                <div key={review.id} className="mb-4 pb-4 border-bottom">
                  <div className="d-flex justify-content-between">
                    <h5>{review.title}</h5>
                    <div>{/* Star rating component would go here */}</div>
                  </div>
                  <p className="text-muted mb-2">By {review.userName} on {new Date(review.date).toLocaleDateString()}</p>
                  <p>{review.comment}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p>No reviews yet. Be the first to review this product!</p>
                <Button variant="outline-primary">Write a Review</Button>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
      
      {/* Related products would go here */}
      <div className="mb-5">
        <h3 className="mb-4">You might also like</h3>
        <p className="text-muted">Related products would appear here.</p>
      </div>
    </Container>
  );
}

export default ProductDetails;