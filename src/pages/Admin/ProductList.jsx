import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge } from 'react-bootstrap';
import { Link, useSearchParams } from 'react-router-dom';
import { productService } from '../../lib/api';
import { showSuccess, showError } from '../../lib/notify';
import { getImageUrl } from '../../lib/utils';

function ProductList() {
  // Small image component to gracefully handle errors
  function ImageWithFallback({ src, alt, style }) {
    const [errored, setErrored] = useState(false);
    const width = style?.width || '50px';
    const height = style?.height || '50px';
    if (!src || errored) {
      return (
        <div 
          className="no-image-placeholder"
          style={{ width, height }}
        >
          <i className="bi bi-image text-muted" style={{ fontSize: '1.2rem' }}></i>
        </div>
      );
    }

    return (
      <img 
        src={src}
        alt={alt}
        className="product-image"
        style={{ width, height }}
        onError={() => setErrored(true)}
      />
    );
  }
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const productsPerPage = 5;
  
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

  // Sync state from URL query params on mount / when params change
  useEffect(() => {
    const pageParam = parseInt(searchParams.get('page')) || 1;
    const qParam = searchParams.get('q') || '';
    setCurrentPage(pageParam);
    setSearchTerm(qParam);
  }, [searchParams]);
  
  useEffect(() => {
    // extracted so we can refresh after deletes
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
    // expose fetchProducts for handlers via ref-like pattern
    // (simple local assignment works for our small component)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handler: delete a product
  const handleDelete = async (productId) => {
    try {
      // Show a nicer confirmation dialog using SweetAlert2
      const SwalModule = await import('sweetalert2');
      const Swal = SwalModule.default || SwalModule;
      const confirm = await Swal.fire({
        title: 'Delete product?',
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#dc3545'
      });

      if (!confirm.isConfirmed) return;

      // optimistic update: remove locally first
      const prevProducts = products;
      setProducts(prev => prev.filter(p => p.id !== productId));

      try {
        const resp = await productService.deleteProduct(productId);
        // Success: show success toast
        try { await showSuccess(resp?.data || 'Product deleted'); } catch (e) { /* ignore */ }
      } catch (err) {
        // restore previous list on failure
        setProducts(prevProducts);
        // extract human-friendly message from server response
        let serverMsg = 'Failed to delete product. Please try again.';
        try {
          const data = err?.response?.data;
          if (typeof data === 'string') serverMsg = data;
          else if (data && typeof data === 'object') {
            // Common shapes: { message: '...', error: '...' } or plain map
            serverMsg = data.message || data.error || JSON.stringify(data);
          } else if (err?.message) serverMsg = err.message;
        } catch (ex) {
          serverMsg = err?.message || serverMsg;
        }

        // If server returned 409 (referential integrity), offer force-delete
        const status = err?.response?.status;
        try {
          if (status === 409) {
            const SwalModule = await import('sweetalert2');
            const Swal = SwalModule.default || SwalModule;
            const res = await Swal.fire({
              title: 'Referenced by orders',
              text: serverMsg + '\nDo you want to force-delete this product? This will remove related order items.',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonText: 'Force Delete',
              cancelButtonText: 'Cancel',
              confirmButtonColor: '#d33'
            });
            if (res.isConfirmed) {
              try {
                const fResp = await productService.forceDeleteProduct(productId);
                // remove optimistically
                setProducts(prev => prev.filter(p => p.id !== productId));
                await showSuccess(fResp?.data?.message || 'Product force-deleted');
                return;
              } catch (fErr) {
                const fm = fErr?.response?.data || fErr?.message || 'Force delete failed';
                await showError(typeof fm === 'object' ? JSON.stringify(fm) : fm);
                return;
              }
            }
          }
        } catch (swalErr) {
          /* ignore */
        }

        try { await showError(serverMsg); } catch (e) { /* ignore */ }
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      try { await showError(error?.response?.data?.message || 'Failed to delete product. Please try again.'); } catch (e) { /* ignore */ }
    }
  };
  
  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchTerm(q);
    setCurrentPage(1); // Reset to first page on search
    // update url params (keep page=1)
    setSearchParams({ page: '1', q });
  };
  
  const handlePageChange = (e, pageNumber) => {
    // prevent default link behavior if any
    if (e && e.preventDefault) e.preventDefault();
    // preserve current scroll position and restore after update
    const scrollY = window.scrollY || window.pageYOffset || 0;
    setCurrentPage(pageNumber);
    const q = searchTerm || '';
    setSearchParams({ page: String(pageNumber), q });
    // wait for layout updates, then restore scroll
    requestAnimationFrame(() => {
      // use another frame to be safe
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    });
  };

  return (
    <Container fluid className="py-4">
      {/* Modern Header */}
      <div className="admin-header">
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h2 mb-1 accent-text">
              <i className="bi bi-box-seam-fill me-3"></i>
              Product Management
            </h1>
            <p className="text-muted mb-0">Manage product inventory, update prices, and add new products.</p>
          </div>
          <div className="col-auto">
            <Button as={Link} to="/admin/products/add" className="modern-btn">
              <i className="bi bi-plus-lg me-2"></i>
              Add New Product
            </Button>
          </div>
        </div>
      </div>
      
      {/* Search and filter (constrained width, modern appearance) */}
      <div className="mb-3 product-search-wrapper">
        <div className="product-search-group">
          <button className="product-search-icon" aria-hidden="true">
            <i className="bi bi-search" />
          </button>
          <Form.Control
            className="product-search-input"
            placeholder="Search products by name, brand, or category..."
            value={searchTerm}
            onChange={handleSearch}
            aria-label="Search products"
          />
          <button
            className="product-search-clear-btn"
            title="Clear search"
            aria-label="Clear search"
            onClick={() => {
              setSearchTerm('');
              setSearchParams({ page: '1', q: '' });
            }}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <p>Loading products...</p>
        </div>
      ) : (
        <>
          <Table responsive className="product-table">
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
                        style={{ width: '56px', height: '56px' }}
                      />
                    </td>
                    <td>
                      <Link to={`/admin/products/edit/${product.id}`} className="product-name-link">
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
                          className="product-action-btn"
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="product-action-btn"
                          onClick={() => handleDelete(product.id)}
                        >
                          Delete
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
                  onClick={(e) => handlePageChange(e, 1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={(e) => handlePageChange(e, currentPage - 1)} 
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
                        onClick={(e) => handlePageChange(e, pageNumber)}
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
                  onClick={(e) => handlePageChange(e, currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={(e) => handlePageChange(e, totalPages)} 
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