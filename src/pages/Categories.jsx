import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { productService } from '../lib/api';
import ProductCard from '../components/ProductCard';

const categoriesList = ['acoustic', 'electric', 'classical', 'bass'];

function Categories() {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productService.getAllProducts();
        setProducts(res.data || []);
      } catch (e) {
        console.error('Failed to load products for categories', e);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (name) {
    const key = name.toLowerCase();
    const filtered = products.filter(p => (p.category || '').toLowerCase() === key);

    return (
      <Container className="py-3" style={{ paddingTop: '20px' }}>
        <h2 className="mb-4 text-capitalize">{key} Guitars</h2>

        {isLoading ? (
          <div className="text-center py-5">Loading products...</div>
        ) : (
          <Row>
            {filtered.length > 0 ? (
              filtered.map(product => (
                <Col md={3} sm={6} key={product.id} className="mb-4">
                  <ProductCard product={product} />
                </Col>
              ))
            ) : (
              <div className="text-center py-3">
                <p>No products found for <strong className="text-capitalize">{key}</strong>.</p>
                <p>
                  <Button as={Link} to="/shop" variant="primary">Browse All Products</Button>
                </p>
              </div>
            )}
          </Row>
        )}
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">All Categories</h2>
      <Row>
        {categoriesList.map(c => (
          <Col md={3} sm={6} key={c} className="mb-3">
            <Card className="text-center h-100 category-card">
              <Card.Body>
                <Card.Title className="text-capitalize">{c} Guitars</Card.Title>
                <Button as={Link} to={`/categories/${c}`} variant="outline-primary">Browse {c}</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export default Categories;
