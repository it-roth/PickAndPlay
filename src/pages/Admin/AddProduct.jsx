import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { productService } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';

function AddProduct() {
  const [productData, setProductData] = useState({
    name: '',
    brand: '',
    category: '',
    type: '',
    price: '',
    stockQuantity: '',
    description: '',
    images: null,
  // currentImage not used in Add form
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();
  

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

    // Convert string values to appropriate types and validate
    const priceParsed = productData.price === '' || productData.price == null ? NaN : parseFloat(productData.price);
    const stockParsed = productData.stockQuantity === '' || productData.stockQuantity == null ? NaN : parseInt(productData.stockQuantity, 10);

    // Basic validation: ensure price and stock are valid numbers
    if (isNaN(priceParsed) || priceParsed < 0) {
      setError('Please enter a valid non-negative price.');
      setIsSubmitting(false);
      return;
    }
    if (isNaN(stockParsed) || stockParsed < 0) {
      setError('Please enter a valid non-negative stock quantity.');
      setIsSubmitting(false);
      return;
    }

    const formattedData = {
      ...productData,
      price: priceParsed,
      stockQuantity: stockParsed,
    };

    try {
      await productService.createProduct(formattedData);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      // Extract friendly message from server response (handles string or JSON body)
      let serverMsg = 'Failed to create product. Please try again.';
      try {
        const data = error?.response?.data;
        if (typeof data === 'string') serverMsg = data;
        else if (data && typeof data === 'object') serverMsg = data.message || data.error || JSON.stringify(data);
        else if (error?.message) serverMsg = error.message;
      } catch (e) {
        serverMsg = error?.message || serverMsg;
      }
      setError(serverMsg);
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add New Product</h1>
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
              {/* No current image on add form */}
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
            {isSubmitting ? 'Creating...' : 'Add Product'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default AddProduct;