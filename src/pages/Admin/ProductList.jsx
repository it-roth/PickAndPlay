import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productService } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';

function ProductList() {
  // Small image component to gracefully handle errors
  function ImageWithFallback({ src, alt, style }) {
    const [errored, setErrored] = useState(false);
    if (!src || errored) {
      return (
        <div 
          className="no-image-placeholder d-flex align-items-center justify-content-center"
          style={{ 
            width: style?.width || '50px',
            height: style?.height || '50px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '4px'
          }}
        >
          <i className="bi bi-image text-muted" style={{ fontSize: '1.2rem' }}></i>
        </div>
      );
    }

    return (
      <img 
        src={src}
        alt={alt}
        style={style}
        onError={() => setErrored(true)}
      />
    );
  }
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const productsPerPage = 10;
  
  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Paginate products
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productService.getAllProducts();
        setProducts(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsLoading(false);
      }
    };
    
    fetchProducts();
  }, []);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Product Management</h1>
        <Button as={Link} to="/admin/products/add" variant="primary">
          Add New Product
        </Button>
      </div>
      
      {/* Search and filter */}
      <InputGroup className="mb-3">
        <Form.Control
          placeholder="Search products by name, brand, or category..."
          value={searchTerm}
          onChange={handleSearch}
        />
        <Button 
          variant="outline-secondary"
          onClick={() => setSearchTerm('')}
        >
          Clear
        </Button>
      </InputGroup>
      
      {isLoading ? (
        <div className="text-center py-5">
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length > 0 ? (
                currentProducts.map(product => (
                  <tr key={product.id}>
                    <td width="80">
                      <ImageWithFallback
                        src={getImageUrl(product.images)}
                        alt={product.name}
                        style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </td>
                    <td>
                      <Link to={`/admin/products/edit/${product.id}`}>
                        {product.name}
                      </Link>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.brand}</td>
                    <td>${product.price.toFixed(2)}</td>
                    <td>
                      {product.stockQuantity !== undefined ? (
                        <Badge bg={product.stockQuantity > 10 ? 'success' : 'warning'}>
                          {product.stockQuantity}
                        </Badge>
                      ) : (
                        <Badge bg="secondary">N/A</Badge>
                      )}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button 
                          as={Link} 
                          to={`/admin/products/edit/${product.id}`} 
                          variant="outline-primary" 
                          size="sm"
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {searchTerm ? 'No products match your search criteria.' : 'No products available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Show current page and 2 pages before and after
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={pageNumber} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default ProductList;