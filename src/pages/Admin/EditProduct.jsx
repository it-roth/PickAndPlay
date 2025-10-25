import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { productService } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';

function EditProduct() {
  const [productData, setProductData] = useState({
    name: '',
    brand: '',
    category: '',
    type: '',
    price: '',
    stockQuantity: '',
    description: '',
    images: null,
    currentImage: '', // To show existing image
    specs: {
      bodyMaterial: '',
      neckMaterial: '',
      fingerboard: '',
      frets: '',
      pickups: '',
      scaleLength: '',
      bridgeType: '',
      hardwareFinish: '',
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getProductById(id);

        // Set product data, ensuring default values for missing fields
        const product = response.data;
        setProductData({
          ...productData, // Use defaults for missing fields
          ...product, // Override with actual product data
          currentImage: product.images, // Store current image path
          images: null, // Reset file input
          specs: {
            ...productData.specs, // Default specs
            ...(product.specs || {}) // Override with actual specs if available
          }
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Failed to load product. Please try again.');
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [bResp, cResp] = await Promise.all([productService.getBrands(), productService.getCategories()]);
        setBrands(bResp.data || []);
        setCategories(cResp.data || []);
      } catch (e) {
        setBrands(['Fender','Gibson','Ibanez','Martin','Taylor','ESP','PRS','Yamaha','Epiphone','Jackson','Other']);
        setCategories(['Electric','Acoustic','Classical','Bass','Accessories']);
      }
    };
    fetchLists();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // Handle file uploads (images)
    if (name === 'images' && files && files.length > 0) {
      setProductData(prev => ({
        ...prev,
        [name]: files
      }));
      return;
    }

    // Handle nested specs object
    if (name.includes('specs.')) {
      const specName = name.split('.')[1];
      setProductData(prev => ({
        ...prev,
        specs: {
          ...prev.specs,
          [specName]: value
        }
      }));
    } else {
      setProductData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Convert string values to appropriate types
    const formattedData = {
      ...productData,
      price: parseFloat(productData.price),
      stockQuantity: parseInt(productData.stockQuantity),
    };

    try {
      await productService.updateProduct(id, formattedData);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.message || 'Failed to update product. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <p>Loading product information...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Modern Header */}
      <div className="admin-header">
        <div className="row align-items-center">
          <div className="col">
            <h1 className="h2 mb-1 accent-text">
              <i className="bi bi-pencil-square me-3"></i>
              Edit Product
            </h1>
            <p className="text-muted mb-0">Update product details and manage inventory.</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Basic Information</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Product Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Brand</Form.Label>
                  <Form.Select
                    name="brand"
                    value={productData.brand}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Brand</option>
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={productData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Price ($)</Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={productData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Stock Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    name="stockQuantity"
                    value={productData.stockQuantity}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </Form.Group>
              </Col>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={productData.description}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Product Image</Form.Label>
              <Form.Control
                type="file"
                name="images"
                accept="image/*"
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                Upload a new image to replace the current one (optional).
              </Form.Text>
              {productData.currentImage && (
                <div className="mt-2">
                  <p className="mb-1">Current image:</p>
                  <img
                    src={getImageUrl(productData.currentImage)}
                    alt="Current product image"
                    style={{ maxHeight: '100px' }}
                    className="img-thumbnail"
                  />
                </div>
              )}
            </Form.Group>

          </Card.Body>
        </Card>

        <div className="d-flex justify-content-between">
          <Button
            variant="danger"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default EditProduct;