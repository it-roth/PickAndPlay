import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { productService } from '../../services/api';

function EditProduct() {
  const [productData, setProductData] = useState({
    name: '',
    brand: '',
    category: '',
    type: '',
    price: '',
    stockQuantity: '',
    description: '',
    shortDescription: '',
    imageUrl: '',
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
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
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit Product</h1>
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/admin/products')}
        >
          Cancel
        </Button>
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
                    <option value="Fender">Fender</option>
                    <option value="Gibson">Gibson</option>
                    <option value="Ibanez">Ibanez</option>
                    <option value="Martin">Martin</option>
                    <option value="Taylor">Taylor</option>
                    <option value="ESP">ESP</option>
                    <option value="PRS">PRS</option>
                    <option value="Yamaha">Yamaha</option>
                    <option value="Epiphone">Epiphone</option>
                    <option value="Jackson">Jackson</option>
                    <option value="Other">Other</option>
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
                    <option value="Electric">Electric</option>
                    <option value="Acoustic">Acoustic</option>
                    <option value="Classical">Classical</option>
                    <option value="Bass">Bass</option>
                    <option value="Accessories">Accessories</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="type"
                    value={productData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Stratocaster, Dreadnought"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
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
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                name="imageUrl"
                value={productData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
              {productData.imageUrl && (
                <div className="mt-2">
                  <img 
                    src={productData.imageUrl} 
                    alt="Product preview" 
                    style={{ maxHeight: '100px' }} 
                    className="img-thumbnail"
                  />
                </div>
              )}
            </Form.Group>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Description</h5>
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Short Description</Form.Label>
              <Form.Control
                as="textarea"
                name="shortDescription"
                value={productData.shortDescription}
                onChange={handleInputChange}
                rows={2}
                placeholder="Brief overview of the product (appears on product cards)"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Full Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={productData.description}
                onChange={handleInputChange}
                rows={5}
                required
                placeholder="Detailed product description"
              />
            </Form.Group>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Technical Specifications</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Body Material</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.bodyMaterial"
                    value={productData.specs.bodyMaterial}
                    onChange={handleInputChange}
                    placeholder="e.g., Alder, Mahogany"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Neck Material</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.neckMaterial"
                    value={productData.specs.neckMaterial}
                    onChange={handleInputChange}
                    placeholder="e.g., Maple, Mahogany"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fingerboard</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.fingerboard"
                    value={productData.specs.fingerboard}
                    onChange={handleInputChange}
                    placeholder="e.g., Rosewood, Maple, Ebony"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Frets</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.frets"
                    value={productData.specs.frets}
                    onChange={handleInputChange}
                    placeholder="e.g., 22, 24"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Pickups</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.pickups"
                    value={productData.specs.pickups}
                    onChange={handleInputChange}
                    placeholder="e.g., 3x Single Coil, 2x Humbucker"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Scale Length</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.scaleLength"
                    value={productData.specs.scaleLength}
                    onChange={handleInputChange}
                    placeholder="e.g., 25.5&quot;, 24.75&quot;"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Bridge Type</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.bridgeType"
                    value={productData.specs.bridgeType}
                    onChange={handleInputChange}
                    placeholder="e.g., Tune-O-Matic, Tremolo"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hardware Finish</Form.Label>
                  <Form.Control
                    type="text"
                    name="specs.hardwareFinish"
                    value={productData.specs.hardwareFinish}
                    onChange={handleInputChange}
                    placeholder="e.g., Chrome, Gold"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-between">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary"
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