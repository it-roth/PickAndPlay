import { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../lib/api';

function AddProduct() {
  const [productData, setProductData] = useState({
    name: '',
    brand: '',
    category: '',
    type: '',
    price: '',
    stockQuantity: '',
    description: '',
    shortDescription: '',
    images: null,
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
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
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
    const form = e.currentTarget;
    
    // Form validation
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Convert string values to appropriate types
    const formattedData = {
      ...productData,
      price: parseFloat(productData.price),
      stockQuantity: parseInt(productData.stockQuantity),
    };
    
    setIsSubmitting(true);
    setError('');
    
    try {
      await productService.createProduct(formattedData);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error creating product:', error);
      setError(error.response?.data?.message || 'Failed to create product. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add New Product</h1>
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
      
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
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
                  <Form.Control.Feedback type="invalid">
                    Product name is required.
                  </Form.Control.Feedback>
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
                  <Form.Control.Feedback type="invalid">
                    Please select a brand.
                  </Form.Control.Feedback>
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
                  <Form.Control.Feedback type="invalid">
                    Please select a category.
                  </Form.Control.Feedback>
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
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid price.
                  </Form.Control.Feedback>
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
                  <Form.Control.Feedback type="invalid">
                    Please enter a valid stock quantity.
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
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
                Upload an image file for the product.
              </Form.Text>
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
              <Form.Control.Feedback type="invalid">
                Please provide a product description.
              </Form.Control.Feedback>
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
            {isSubmitting ? 'Creating...' : 'Add Product'}
          </Button>
        </div>
      </Form>
    </Container>
  );
}

export default AddProduct;