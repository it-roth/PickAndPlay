import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productService, orderService, userService } from '../../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    recentOrders: [],
    lowStockProducts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // In a real app, there might be a specific dashboard endpoint
        // For now, we'll make separate requests and combine the data
        const [productsRes, ordersRes, usersRes] = await Promise.all([
          productService.getAllProducts(),
          orderService.getAllOrders(),
          userService.getAllUsers()
        ]);
        
        setStats({
          totalProducts: productsRes.data.length,
          totalOrders: ordersRes.data.length,
          totalUsers: usersRes.data.length,
          recentOrders: ordersRes.data.slice(-5).reverse(), // Get 5 most recent orders
          lowStockProducts: productsRes.data
            .filter(product => product.stockQuantity && product.stockQuantity < 10)
            .slice(0, 5)
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <Container className="py-5 text-center">
        <p>Loading dashboard data...</p>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      {/* Stats cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 mb-3">
            <Card.Body>
              <h2>{stats.totalProducts}</h2>
              <p className="mb-0">Total Products</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/admin/products" variant="outline-primary" size="sm">
                Manage Products
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 mb-3">
            <Card.Body>
              <h2>{stats.totalOrders}</h2>
              <p className="mb-0">Total Orders</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/admin/orders" variant="outline-primary" size="sm">
                View Orders
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 mb-3">
            <Card.Body>
              <h2>{stats.totalUsers}</h2>
              <p className="mb-0">Total Users</p>
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/admin/users" variant="outline-primary" size="sm">
                Manage Users
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      {/* Recent orders */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Recent Orders</h5>
            </Card.Header>
            <Card.Body>
              {stats.recentOrders.length > 0 ? (
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <Link to={`/admin/orders/${order.id}`}>#{order.id}</Link>
                        </td>
                        <td>{order.customerName}</td>
                        <td>{new Date(order.date).toLocaleDateString()}</td>
                        <td>${order.totalAmount.toFixed(2)}</td>
                        <td>
                          <span className={`badge bg-${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center">No recent orders.</p>
              )}
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/admin/orders" variant="link" className="p-0">
                View All Orders
              </Button>
            </Card.Footer>
          </Card>
        </Col>
        
        {/* Low stock products */}
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Low Stock Alert</h5>
            </Card.Header>
            <Card.Body>
              {stats.lowStockProducts.length > 0 ? (
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Stock</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.lowStockProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <Link to={`/admin/products/edit/${product.id}`}>{product.name}</Link>
                        </td>
                        <td>{product.category}</td>
                        <td>
                          <span className={`badge bg-${product.stockQuantity <= 5 ? 'danger' : 'warning'}`}>
                            {product.stockQuantity}
                          </span>
                        </td>
                        <td>
                          <Button 
                            as={Link}
                            to={`/admin/products/edit/${product.id}`} 
                            size="sm" 
                            variant="outline-primary"
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-center">No low stock products.</p>
              )}
            </Card.Body>
            <Card.Footer>
              <Button as={Link} to="/admin/products" variant="link" className="p-0">
                View All Products
              </Button>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
      
      {/* Quick actions */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Quick Actions</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col sm={3} className="mb-3">
              <div className="d-grid">
                <Button as={Link} to="/admin/products/add" variant="primary">
                  Add New Product
                </Button>
              </div>
            </Col>
            <Col sm={3} className="mb-3">
              <div className="d-grid">
                <Button as={Link} to="/admin/orders" variant="outline-secondary">
                  View Orders
                </Button>
              </div>
            </Col>
            <Col sm={3} className="mb-3">
              <div className="d-grid">
                <Button as={Link} to="/admin/users" variant="outline-secondary">
                  Manage Users
                </Button>
              </div>
            </Col>
            <Col sm={3} className="mb-3">
              <div className="d-grid">
                <Button as={Link} to="/" variant="outline-secondary">
                  View Store
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}

// Helper function for order status badges
function getStatusBadge(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'pending':
      return 'warning';
    case 'processing':
      return 'info';
    case 'shipped':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

export default Dashboard;