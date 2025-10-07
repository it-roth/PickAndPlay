import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { productService } from '../services/api';
import ProductCard from '../components/ProductCard';

function Shop() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    brand: '',
    sortBy: 'name',
  });
  
  // Get all available categories and brands from products
  const categories = [...new Set(products.map(p => p.category))];
  const brands = [...new Set(products.map(p => p.brand))];
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data);
        setFilteredProducts(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  useEffect(() => {
    // Apply filters whenever filters change
    applyFilters();
  }, [filters, products]);
  
  const applyFilters = () => {
    let result = [...products];
    
    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) || 
        product.description.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(product => product.category === filters.category);
    }
    
    // Apply price filters
    if (filters.minPrice) {
      result = result.filter(product => product.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(product => product.price <= parseFloat(filters.maxPrice));
    }
    
    // Apply brand filter
    if (filters.brand) {
      result = result.filter(product => product.brand === filters.brand);
    }
    
    // Apply sorting
    switch (filters.sortBy) {
      case 'priceAsc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name':
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    setFilteredProducts(result);
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      brand: '',
      sortBy: 'name',
    });
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">Guitar Shop</h1>
      
      <Row>
        {/* Filters sidebar */}
        <Col md={3}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Filters</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search guitars..."
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Price Range</Form.Label>
                  <Row>
                    <Col>
                      <Form.Control
                        type="number"
                        name="minPrice"
                        value={filters.minPrice}
                        onChange={handleFilterChange}
                        placeholder="Min"
                        min="0"
                      />
                    </Col>
                    <Col>
                      <Form.Control
                        type="number"
                        name="maxPrice"
                        value={filters.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Max"
                        min="0"
                      />
                    </Col>
                  </Row>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Select
                    name="brand"
                    value={filters.brand}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Brands</option>
                    {brands.map(brand => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Sort By</Form.Label>
                  <Form.Select
                    name="sortBy"
                    value={filters.sortBy}
                    onChange={handleFilterChange}
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="priceAsc">Price (Low to High)</option>
                    <option value="priceDesc">Price (High to Low)</option>
                  </Form.Select>
                </Form.Group>
                
                <Button 
                  variant="secondary" 
                  type="button" 
                  className="w-100"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Products grid */}
        <Col md={9}>
          {isLoading ? (
            <div className="text-center py-5">
              <p>Loading products...</p>
            </div>
          ) : (
            <>
              <div className="mb-3">
                <p className="mb-0">
                  Showing {filteredProducts.length} of {products.length} products
                </p>
              </div>
              
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <p>No products found matching your criteria.</p>
                  <Button onClick={resetFilters} variant="outline-primary">Reset Filters</Button>
                </div>
              ) : (
                <Row>
                  {filteredProducts.map(product => (
                    <Col key={product.id} lg={4} md={6} sm={12} className="mb-4">
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Shop;