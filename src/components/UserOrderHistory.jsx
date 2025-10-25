import { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Row, Col, Accordion } from 'react-bootstrap';
import { orderService } from '../lib/api';

function UserOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchUserOrders();
  }, []);

  const fetchUserOrders = async () => {
    try {
      const response = await orderService.getUserOrders();
      const userOrders = response.data || [];
      
      // Sort by most recent first and filter out pending orders (they're in cart)
      const completedOrders = userOrders
        .filter(order => order.status && order.status.toLowerCase() !== 'pending')
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.date || 0);
          const dateB = new Date(b.createdAt || b.date || 0);
          return dateB - dateA;
        });
      
      setOrders(completedOrders);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      setIsLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bi-check-circle-fill';
      case 'processing':
        return 'bi-arrow-repeat';
      case 'shipped':
        return 'bi-truck';
      case 'cancelled':
        return 'bi-x-circle-fill';
      default:
        return 'bi-clock';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <Card.Body className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading orders...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <h5 className="mb-0">
            <i className="bi bi-clock-history me-2"></i>
            Order History
          </h5>
        </Card.Header>
        <Card.Body>
          {orders.length > 0 ? (
            <Accordion defaultActiveKey="0">
              {orders.map((order, index) => (
                <Accordion.Item eventKey={String(index)} key={order.id}>
                  <Accordion.Header>
                    <div className="d-flex justify-content-between align-items-center w-100 me-3">
                      <div>
                        <strong>Order #{order.id}</strong>
                        <span className="text-muted ms-3">
                          <i className="bi bi-calendar me-1"></i>
                          {formatDate(order.createdAt || order.date)}
                        </span>
                      </div>
                      <div className="d-flex gap-2 align-items-center">
                        <Badge bg={getStatusBadge(order.status)}>
                          <i className={`bi ${getStatusIcon(order.status)} me-1`}></i>
                          {order.status}
                        </Badge>
                        <strong>${(order.totalAmount || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row className="mb-3">
                      <Col md={6}>
                        <p className="mb-1 text-muted small">SHIPPING ADDRESS</p>
                        <p className="mb-0">{order.shippingAddress || 'N/A'}</p>
                      </Col>
                      <Col md={6}>
                        <p className="mb-1 text-muted small">PAYMENT STATUS</p>
                        <p className="mb-0">
                          {order.paymentStatus ? (
                            <Badge bg={order.paymentStatus === 'paid' ? 'success' : 'warning'}>
                              {order.paymentStatus}
                            </Badge>
                          ) : (
                            <span className="text-muted">Not available</span>
                          )}
                        </p>
                      </Col>
                    </Row>

                    {order.items && order.items.length > 0 ? (
                      <>
                        <p className="mb-2 text-muted small fw-bold">ORDER ITEMS</p>
                        <Table size="sm" bordered className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Product</th>
                              <th className="text-center">Qty</th>
                              <th className="text-end">Price</th>
                              <th className="text-end">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>Product #{item.productId}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-end">${(item.unitPrice || 0).toFixed(2)}</td>
                                <td className="text-end">${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="table-light">
                              <td colSpan="3" className="text-end fw-bold">Total Amount:</td>
                              <td className="text-end fw-bold">${(order.totalAmount || 0).toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted mb-0">No items in this order.</p>
                    )}

                    <div className="mt-3">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <i className="bi bi-eye me-1"></i> View Full Details
                      </Button>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-cart-x display-1 text-muted"></i>
              <p className="text-muted mt-3 mb-0">No order history yet.</p>
              <p className="text-muted">Your completed orders will appear here.</p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>
            Order #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h6 className="text-muted mb-3">ORDER INFORMATION</h6>
                  <p className="mb-2"><strong>Order Date:</strong> {formatDate(selectedOrder.createdAt || selectedOrder.date)}</p>
                  <p className="mb-2"><strong>Status:</strong> <Badge bg={getStatusBadge(selectedOrder.status)}>{selectedOrder.status}</Badge></p>
                  <p className="mb-2"><strong>Payment:</strong> {selectedOrder.paymentStatus ? <Badge bg={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>{selectedOrder.paymentStatus}</Badge> : 'N/A'}</p>
                </Col>
                <Col md={6}>
                  <h6 className="text-muted mb-3">SHIPPING DETAILS</h6>
                  <p className="mb-2"><strong>Customer:</strong> {selectedOrder.customerName || 'N/A'}</p>
                  <p className="mb-2"><strong>Address:</strong> {selectedOrder.shippingAddress || 'N/A'}</p>
                  <p className="mb-2"><strong>Total Amount:</strong> <span className="text-primary fs-5 fw-bold">${(selectedOrder.totalAmount || 0).toFixed(2)}</span></p>
                </Col>
              </Row>

              <hr />

              <h6 className="text-muted mb-3">ORDER ITEMS</h6>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <Table bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Product ID</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Unit Price</th>
                      <th className="text-end">Total Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>#{item.productId}</strong>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">${(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="text-end">${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-light">
                      <td colSpan="3" className="text-end fw-bold">Total Amount:</td>
                      <td className="text-end fw-bold">${(selectedOrder.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </Table>
              ) : (
                <p className="text-muted">No items in this order.</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default UserOrderHistory;
