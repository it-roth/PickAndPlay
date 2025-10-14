import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Card, Pagination } from 'react-bootstrap';
import { productService } from '../lib/api';
import ProductCard from '../components/ProductCard';

function Shop() {
  const { categoryName } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    brand: '',
    // default to newest so last/most-recent products show first
    sortBy: 'newest',
  });

  // Map URL category names to actual category values
  const categoryMap = {
    'electric': 'Electric Guitar',
    'acoustic': 'Acoustic Guitar', 
    'bass': 'Bass Guitar',
    'accessories': 'Accessories'
  };
  
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

  // Set category filter based on URL parameter
  useEffect(() => {
    if (categoryName && categoryMap[categoryName]) {
      setFilters(prev => ({
        ...prev,
        category: categoryMap[categoryName]
      }));
    } else {
      // Clear category filter if no category in URL
      setFilters(prev => ({
        ...prev,
        category: ''
      }));
    }
  }, [categoryName, location.pathname]);
  
  useEffect(() => {
    // Apply filters whenever filters change
    applyFilters();
    setCurrentPage(1);
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
      case 'newest':
        // sort by numeric id or fallback to string _id; newest (largest) first
        result.sort((a, b) => {
          const ai = Number(a.id ?? a._id ?? 0);
          const bi = Number(b.id ?? b._id ?? 0);
          return bi - ai;
        });
        break;
      case 'oldest':
        // oldest first
        result.sort((a, b) => {
          const ai = Number(a.id ?? a._id ?? 0);
          const bi = Number(b.id ?? b._id ?? 0);
          return ai - bi;
        });
        break;
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

  // Pagination
  const itemsPerPage = 9;
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(totalItems, currentPage * itemsPerPage);
  const pagedProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    // scroll to top of products list
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const getCategoryTitle = () => {
    if (categoryName && categoryMap[categoryName]) {
      return categoryMap[categoryName] + 's';
    }
    return 'Guitar Shop';
  };

  return (
    <Container className="mt-5 pt-5">
      <div className="mb-4">
        <h1>{getCategoryTitle()}</h1>
        {categoryName && (
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <a href="/shop">Shop</a>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {categoryMap[categoryName]}
              </li>
            </ol>
          </nav>
        )}
      </div>
      
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
                  Showing {startIndex + 1} - {endIndex} of {totalItems} products
                </p>
              </div>
              
              {pagedProducts.length === 0 ? (
                <div className="text-center py-5">
                  <p>No products found matching your criteria.</p>
                  <Button onClick={resetFilters} variant="outline-primary">Reset Filters</Button>
                </div>
              ) : (
                <>
                  <Row>
                    {pagedProducts.map(product => (
                      <Col key={String(product.id ?? product._id ?? product._doc?._id)} lg={4} md={6} xs={6} className="mb-4">
                        <ProductCard product={product} />
                      </Col>
                    ))}
                  </Row>

                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.Prev onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} />
                        {Array.from({ length: totalPages }).map((_, idx) => {
                          const page = idx + 1;
                          return (
                            <Pagination.Item key={page} active={page === currentPage} onClick={() => goToPage(page)}>
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default Shop;