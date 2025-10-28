import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { productService, orderService, userService } from '../../lib/api';

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
      {/* Modern Header */}
      <div className="admin-header">
        <Row className="align-items-center">
          <Col>
            <h1 className="h2 mb-1 accent-text">
              <i className="bi bi-grid-1x2-fill me-3"></i>
              Admin Dashboard
            </h1>
            <p className="text-muted mb-0">Monitor your store's performance and manage operations</p>
          </Col>
          <Col xs="auto">
            <div className="d-flex gap-2">
              <Button as={Link} to="/admin/products/add" className="modern-btn">
                <i className="bi bi-plus-lg me-2"></i>
                Add Product
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Modern Stats Cards */}
      <Row className="mb-5 g-4">
        <Col lg={3} md={6}>
          <div className="stat-card ">
            <div className="mb-3">
              <i className="bi bi-box-seam-fill accent-text" style={{fontSize: '2.5rem'}}></i>
            </div>
            <div className="stat-number">{stats.totalProducts}</div>
            <div className="stat-label">Total Products</div>
            <div className="mt-3">
              <Button as={Link} to="/admin/products" className="modern-btn" size="sm">
                Manage Products
              </Button>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="stat-card">
            <div className="mb-3">
              <i className="bi bi-cart-check-fill" style={{fontSize: '2.5rem', color: '#28a745'}}></i>
            </div>
            <div className="stat-number">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
            <div className="mt-3">
              <Button as={Link} to="/admin/orders" className="modern-btn" size="sm">
                View Orders
              </Button>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="stat-card">
            <div className="mb-3">
              <i className="bi bi-people-fill" style={{fontSize: '2.5rem', color: '#007bff'}}></i>
            </div>
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
            <div className="mt-3">
              <Button as={Link} to="/admin/users" className="modern-btn" size="sm">
                Manage Users
              </Button>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6}>
          <div className="stat-card low-stock-card">
            <div className="mb-3">
              <i className="bi bi-exclamation-triangle-fill low-stock-icon"></i>
            </div>
            <div className="stat-number">{stats.lowStockProducts.length}</div>
            <div className="stat-label low-stock-label">Low Stock Items</div>
            <div className="mt-3">
              <Button
                as={Link}
                to="/admin/products"
                className="modern-btn no-border"
                size="sm"
                style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
              >
                Check Stock
              </Button>
            </div>
          </div>
        </Col>
      </Row>
      
      {/* Recent orders and low stock */}
      <Row className="g-4">
        <Col lg={8}>
          <div className="modern-card">
            <div className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0 accent-text">
                  <i className="bi bi-clock-history me-2"></i>
                  Recent Orders
                </h5>
                  <Button as={Link} to="/admin/orders" variant="link" className="accent-text">
                  View All <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
              {stats.recentOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="accent-gradient">
                      <tr>
                        <th style={{color: 'white', border: 'none'}}>Order ID</th>
                        <th style={{color: 'white', border: 'none'}}>Customer</th>
                        <th style={{color: 'white', border: 'none'}}>Date</th>
                        <th style={{color: 'white', border: 'none'}}>Amount</th>
                        <th style={{color: 'white', border: 'none'}}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map(order => (
                        <tr key={order.id}>
                          <td>
                            <Link to={`/admin/orders/${order.id}`} className="accent-text">#{order.id}</Link>
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
                </div>
              ) : (
                <p className="text-center text-muted">No recent orders.</p>
              )}
            </div>
          </div>
        </Col>
        
        <Col lg={4}>
          <div className="modern-card">
            <div className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="mb-0 low-stock-heading">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Low Stock Alert
                </h5>
                <Button as={Link} to="/admin/products" variant="link" className="accent-text ">
                  View All <i className="bi bi-arrow-right"></i>
                </Button>
              </div>
              {stats.lowStockProducts.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="accent-gradient">
                      <tr>
                        <th style={{color: 'white', border: 'none'}}>Product</th>
                        <th style={{color: 'white', border: 'none'}}>Stock</th>
                        <th style={{color: 'white', border: 'none'}}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.lowStockProducts.map(product => (
                        <tr key={product.id}>
                          <td>
                            <Link to={`/admin/products/edit/${product.id}`} className="accent-text">
                              {product.name}
                            </Link>
                          </td>
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
                              className="modern-btn"
                              style={{fontSize: '0.75rem', padding: '0.25rem 0.5rem'}}
                            >
                              Update
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted">No low stock products.</p>
              )}
            </div>
          </div>
        </Col>
      </Row>
      
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