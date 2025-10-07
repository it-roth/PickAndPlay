import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  const addToCart = () => {
    // Get existing cart or initialize empty array
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product already exists in cart
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Increase quantity if product exists
      existingItem.quantity += 1;
    } else {
      // Add new product with quantity 1
      cart.push({
        ...product,
        quantity: 1
      });
    }
    
    // Save updated cart back to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Optional: Show feedback to user
    alert(`${product.name} added to cart!`);
    
    // Refresh page to update cart count in navbar
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  return (
    <Card className="h-100">
      <Card.Img 
        variant="top" 
        src={product.imageUrl || 'https://via.placeholder.com/300x150?text=Guitar+Image'} 
        alt={product.name}
        style={{ height: '200px', objectFit: 'cover' }}
      />
      <Card.Body className="d-flex flex-column">
        <Card.Title>{product.name}</Card.Title>
        <Card.Text className="text-muted mb-0">{product.brand}</Card.Text>
        <Card.Text className="mb-3">${product.price.toFixed(2)}</Card.Text>
        <div className="mt-auto d-flex justify-content-between">
          <Button 
            as={Link} 
            to={`/product/${product.id}`} 
            variant="outline-primary"
          >
            Details
          </Button>
          <Button 
            variant="primary" 
            onClick={addToCart}
          >
            Add to Cart
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ProductCard;