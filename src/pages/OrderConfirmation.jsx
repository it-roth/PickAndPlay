import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Table, Badge, Alert, Spinner } from 'react-bootstrap';
import { orderService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import OrderStatusTimeline from '../components/OrderStatusTimeline';

export default function OrderConfirmation() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        setLoading(true);

        // Check for order data from navigation state first
        const orderData = location.state?.order;
        if (orderData) {
          setOrder(orderData);
          setLoading(false);
          return;
        }

        // Check for order ID in URL params
        const orderId = searchParams.get('orderId');
        if (orderId) {
          const response = await orderService.getOrderById(orderId);
          const fetchedOrder = response.data;
          if (fetchedOrder) {
            setOrder(fetchedOrder);
            setLoading(false);
            return;
          }
        }

        // Try to get the most recent completed order for the user
        const userOrdersResponse = await orderService.getUserOrders();
        const userOrders = userOrdersResponse.data || [];

        // Find the most recent completed order
        const recentOrder = userOrders
          .filter(o => o.status && o.status.toLowerCase() !== 'pending')
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0];

        if (recentOrder) {
          setOrder(recentOrder);
        } else {
          setError('No order found. Please check your order history in your profile.');
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [location, searchParams]);

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  const handleViewOrderHistory = () => {
    navigate('/orders');
  };

  const handlePrintInvoice = () => {
    // Create a hidden iframe for printing without headers/footers
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Generate clean invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - Order ${order.id}</title>
          <style>
            @page { 
              margin: 15mm; 
              size: A4;
            }
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            body { 
              font-family: Arial, sans-serif; 
              color: #333; 
              line-height: 1.4;
              background: white;
            }
            .invoice-header {
              text-align: center;
              margin-bottom: 25px;
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            .order-number {
              font-size: 16px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
              border-bottom: 1px solid #ddd;
              padding-bottom: 3px;
              margin-bottom: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              font-size: 11px;
            }
            .info-label {
              font-weight: bold;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #333;
              margin: 15px 0;
            }
            .items-table th {
              background: #f5f5f5;
              border: 1px solid #333;
              padding: 8px;
              font-size: 11px;
              font-weight: bold;
            }
            .items-table td {
              border: 1px solid #333;
              padding: 8px;
              font-size: 11px;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .total-row {
              background: #f5f5f5;
              font-weight: bold;
            }
            .total-row td {
              border-top: 2px solid #333 !important;
              font-size: 12px !important;
            }
          </style>
        </head>
        <body>
          <div class="invoice-header">
            <div class="invoice-title">INVOICE</div>
            <div class="order-number">Order #${order.id}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span>${formatDate(order.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>${order.status}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment:</span>
              <span>${order.paymentStatus || 'Processing'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Shipping Details</div>
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${order.customerName || 'Sa Roth'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span>${order.shippingAddress || 'Pickup at store'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total:</span>
              <span>$${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40%;">Product</th>
                  <th class="text-center" style="width: 15%;">Quantity</th>
                  <th class="text-right" style="width: 20%;">Unit Price</th>
                  <th class="text-right" style="width: 25%;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items && order.items.length > 0
        ? order.items.map(item => `
                    <tr>
                      <td>${item.product?.name || `Product #${item.productId}`}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">$${(item.unitPrice || 0).toFixed(2)}</td>
                      <td class="text-right">$${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')
        : '<tr><td colspan="4" class="text-center">No items found</td></tr>'
      }
                <tr class="total-row">
                  <td colspan="3" class="text-right">Total Amount:</td>
                  <td class="text-right">$${(order.totalAmount || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    // Write content to iframe and print
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(invoiceHTML);
    doc.close();

    // Print the iframe content
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      // Remove iframe after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  }; const handlePrintInvoiceOld = () => {
    // Create a clean print window with exact layout
    const printWindow = window.open('', '_blank');

    if (printWindow && order) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invoice - Order ${order.id}</title>
          <meta charset="utf-8">
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              background: white;
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .invoice-title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .order-number {
              font-size: 18px;
              font-weight: bold;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 14px;
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 10px;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 3px 0;
            }
            .info-label {
              font-weight: bold;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .table th {
              background: #f5f5f5;
              border: 1px solid #ddd;
              padding: 10px;
              text-align: left;
              font-weight: bold;
            }
            .table td {
              border: 1px solid #ddd;
              padding: 10px;
            }
            .table .text-center {
              text-align: center;
            }
            .table .text-end {
              text-align: right;
            }
            .total-row {
              background: #f5f5f5;
              font-weight: bold;
            }
            .total-row td {
              border-top: 2px solid #333;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="invoice-title">INVOICE</div>
            <div class="order-number">Order #${order.id}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Order Information</div>
            <div class="info-row">
              <span class="info-label">Order Date:</span>
              <span>${formatDate(order.createdAt)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>${order.status}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Payment:</span>
              <span>${order.paymentStatus || 'Processing'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Shipping Details</div>
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${order.customerName || 'Sa Roth'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span>${order.shippingAddress || 'Pickup at store'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total:</span>
              <span>$${(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th class="text-center">Quantity</th>
                  <th class="text-end">Unit Price</th>
                  <th class="text-end">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${order.items && order.items.length > 0 ?
          order.items.map(item => `
                    <tr>
                      <td>${item.product?.name || `Product #${item.productId}`}</td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-end">$${(item.unitPrice || 0).toFixed(2)}</td>
                      <td class="text-end">$${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
                    </tr>
                  `).join('')
          : '<tr><td colspan="4">No items found</td></tr>'
        }
                <tr class="total-row">
                  <td colspan="3" class="text-end"><strong>Total Amount:</strong></td>
                  <td class="text-end"><strong>$${(order.totalAmount || 0).toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();

      // Print and close
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } else {
      // Fallback to regular print
      window.print();
    }
  }; const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'primary';
      case 'partial':
        return 'warning';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="order-confirmation-page loading-state">
        <Container className="py-3" style={{ paddingTop: '20px' }}>
          <Card className="text-center p-5 glass-card">
            <div className="loading-animation">
              <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <p className="mt-4 text-white fs-5">Loading your order details...</p>
          </Card>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-confirmation-page error-state">
        <Container className="py-3" style={{ paddingTop: '20px' }}>
          <Alert variant="danger" className="text-center glass-card">
            <i className="bi bi-exclamation-triangle me-2 fs-2"></i>
            <h4>{error}</h4>
            <div className="mt-3">
              <Button variant="outline-light" onClick={() => navigate('/orders')} className="me-3">
                View Order History
              </Button>
              <Button variant="light" onClick={handleContinueShopping}>
                Continue Shopping
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="order-confirmation-page">
      <Container className="py-3" id="invoice-content" style={{ paddingTop: '20px' }}>
        {/* Animated Background Elements */}
        <div className="background-elements">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
          <div className="floating-circle circle-4"></div>
        </div>

        {/* Success Header with Animation */}
        <div className="text-center mb-3 success-header">
          <div className="success-animation">
            <div className="success-circle d-inline-flex align-items-center justify-content-center rounded-circle mb-2">
              <i className="bi bi-check-lg text-white success-checkmark"></i>
            </div>
          </div>
          <h1 className="h2 mb-2 fw-bold text-gradient">Order Confirmed!</h1>
          <p className="text-white mb-3 fs-6">
            🎉 Thank you for your purchase! Your order has been successfully placed.
          </p>
        </div>

        {order && (
          <>
            {/* Modern Invoice Card */}
            <Card className="invoice-card shadow border-0 mb-3">
              <Card.Header className="invoice-header border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 fw-bold d-flex align-items-center text-white">
                      <div className="icon-wrapper-small me-2">
                        <i className="bi bi-receipt"></i>
                      </div>
                      Invoice
                    </h4>
                    <div className="d-flex align-items-center">
                      <span className="badge bg-light text-dark px-2 py-1 rounded-pill fw-semibold order-badge-small">
                        <i className="bi bi-hash me-1"></i>Order {order.id}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="light"
                    onClick={handlePrintInvoice}
                    className="d-print-none btn-modern-small"
                    size="sm"
                  >
                    <i className="bi bi-printer me-1"></i>Print
                  </Button>
                </div>
              </Card.Header>

              <Card.Body className="p-3">
                {/* Order Information Grid */}
                <Row className="mb-3">
                  <Col md={6}>
                    <div className="info-section-small">
                      <h6 className="section-title-small mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Order Information
                      </h6>
                      <div className="info-item">
                        <strong>Order Date:</strong>
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="info-item">
                        <strong>Order Status:</strong>
                        <Badge bg={getStatusBadge(order.status)} className="status-badge">
                          <i className="bi bi-circle-fill me-1"></i>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="info-item">
                        <strong>Payment Status:</strong>
                        {order.paymentStatus ? (
                          <Badge
                            bg={order.paymentStatus === 'paid' ? 'success' : 'warning'}
                            className="status-badge"
                          >
                            <i className="bi bi-credit-card me-1"></i>
                            {order.paymentStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted">Processing</span>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="info-section-small">
                      <h6 className="section-title-small mb-2">
                        <i className="bi bi-truck me-1"></i>
                        Shipping Details
                      </h6>
                      <div className="info-item">
                        <strong>Customer:</strong>
                        <span>{order.customerName || 'N/A'}</span>
                      </div>
                      <div className="info-item">
                        <strong>Shipping Address:</strong>
                        <span className="address-text">
                          {order.shippingAddress || 'Standard shipping address'}
                        </span>
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* Modern Order Items */}
                <div className="mb-3">
                  <h5 className="section-title-medium mb-2">
                    <div className="icon-wrapper-medium me-2">
                      <i className="bi bi-bag-check"></i>
                    </div>
                    Order Items
                  </h5>

                  {order.items && order.items.length > 0 ? (
                    <div className="modern-table-wrapper">
                      <Table responsive className="modern-table mb-0">
                        <thead>
                          <tr className="table-header">
                            <th>Product</th>
                            <th className="text-center" width="100">Qty</th>
                            <th className="text-end" width="120">Unit Price</th>
                            <th className="text-end" width="120">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item, idx) => (
                            <tr key={idx} className="table-row">
                              <td>
                                <div className="product-info">
                                  {item.product && item.product.images && (
                                    <img
                                      src={getImageUrl(item.product.images)}
                                      alt={item.product.name}
                                      className="product-image"
                                    />
                                  )}
                                  <div className="product-details">
                                    <div className="product-name">
                                      {item.product?.name || `Product #${item.productId}`}
                                    </div>
                                    {item.product?.brand && (
                                      <small className="product-brand">{item.product.brand}</small>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="text-center align-middle">
                                <span className="quantity-badge">{item.quantity}</span>
                              </td>
                              <td className="text-end align-middle">
                                <span className="price-text">${(item.unitPrice || 0).toFixed(2)}</span>
                              </td>
                              <td className="text-end align-middle">
                                <span className="total-text fw-bold">
                                  ${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="total-row">
                            <td colSpan="3" className="text-end fw-bold fs-5">Total Amount:</td>
                            <td className="text-end fw-bold fs-4 total-amount">
                              ${(order.totalAmount || 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    </div>
                  ) : (
                    <Alert variant="info" className="modern-alert">
                      <i className="bi bi-info-circle me-2"></i>
                      Order items are being processed. Please check your order history for detailed information.
                    </Alert>
                  )}
                </div>

                {/* Order Tracking Timeline */}
                <div className="status-timeline-compact mb-3">
                  <h5 className="section-title-medium mb-2">
                    <div className="icon-wrapper-medium me-2">
                      <i className="bi bi-truck"></i>
                    </div>
                    Order Tracking
                  </h5>
                  <OrderStatusTimeline order={order} />
                </div>
              </Card.Body>
            </Card>

            {/* Action Buttons */}
            <div className="action-buttons-compact d-print-none">
              <Row className="g-2">
                <Col md={6}>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={handleViewOrderHistory}
                    className="w-100 btn-action-small"
                  >
                    <i className="bi bi-clock-history me-1"></i>Order History
                  </Button>
                </Col>
                <Col md={6}>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={handleContinueShopping}
                    className="w-100 btn-action-small btn-primary-action-small"
                  >
                    <i className="bi bi-bag-heart me-1"></i>Continue Shopping
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Confirmation Email Notice */}
            <Alert variant="info" className="mt-2 d-print-none modern-alert-small">
              <div className="d-flex align-items-center">
                <i className="bi bi-envelope-check me-2"></i>
                <div>
                  <strong className="small">Confirmation Email Sent</strong>
                  <p className="mb-0 mt-1 small">
                    Email sent to your registered address. View anytime in order history.
                  </p>
                </div>
              </div>
            </Alert>
          </>
        )}
      </Container>

      {/* Modern CSS Styles */}
      <style>{`
        .order-confirmation-page {
          position: relative;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding-top: 100px;
          overflow: hidden;
        }

        .loading-state, .error-state {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .background-elements {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 8s ease-in-out infinite;
        }

        .circle-1 {
          width: 150px;
          height: 150px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 100px;
          height: 100px;
          top: 60%;
          right: 15%;
          animation-delay: 2s;
        }

        .circle-3 {
          width: 80px;
          height: 80px;
          top: 30%;
          right: 30%;
          animation-delay: 4s;
        }

        .circle-4 {
          width: 120px;
          height: 120px;
          bottom: 20%;
          left: 20%;
          animation-delay: 6s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.8; }
        }

        .success-header {
          position: relative;
          z-index: 2;
        }

        .success-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          box-shadow: 0 10px 30px rgba(40, 167, 69, 0.4);
          animation: bounceIn 1s ease-out;
          position: relative;
        }

        .success-checkmark {
          font-size: 2rem;
          animation: checkmark 0.8s ease-in-out 0.5s both;
        }

        .text-gradient {
          background: linear-gradient(135deg, #fff, #f8f9fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 20px rgba(255, 255, 255, 0.3);
        }

        @keyframes bounceIn {
          0% { 
            transform: scale(0.3) rotate(-360deg);
            opacity: 0;
          }
          50% { 
            transform: scale(1.1) rotate(-180deg);
            opacity: 0.8;
          }
          70% {
            transform: scale(0.9) rotate(0deg);
            opacity: 0.9;
          }
          100% { 
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes checkmark {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.3);
            opacity: 0.8;
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        .confetti {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .confetti-piece {
          position: absolute;
          width: 10px;
          height: 10px;
          animation: confetti-fall 4s linear infinite;
        }

        .confetti-1 { background: #28a745; animation-delay: 0s; left: -80px; }
        .confetti-2 { background: #20c997; animation-delay: 0.2s; left: -60px; }
        .confetti-3 { background: #ffc107; animation-delay: 0.4s; left: -40px; }
        .confetti-4 { background: #fd7e14; animation-delay: 0.6s; left: -20px; }
        .confetti-5 { background: #e83e8c; animation-delay: 0.8s; left: 0px; }
        .confetti-6 { background: #6f42c1; animation-delay: 1s; left: 20px; }
        .confetti-7 { background: #0d6efd; animation-delay: 1.2s; left: 40px; }
        .confetti-8 { background: #198754; animation-delay: 1.4s; left: 60px; }
        .confetti-9 { background: #dc3545; animation-delay: 1.6s; left: 80px; }
        .confetti-10 { background: #f8f9fa; animation-delay: 1.8s; left: -70px; }
        .confetti-11 { background: #6c757d; animation-delay: 2s; left: -50px; }
        .confetti-12 { background: #495057; animation-delay: 2.2s; left: -30px; }
        .confetti-13 { background: #17a2b8; animation-delay: 2.4s; left: -10px; }
        .confetti-14 { background: #ff6b6b; animation-delay: 2.6s; left: 10px; }
        .confetti-15 { background: #4ecdc4; animation-delay: 2.8s; left: 30px; }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-150px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(800px) rotate(720deg);
            opacity: 0;
          }
        }

        .pulse-rings {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 220px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          animation: pulse-ring 3s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        .pulse-ring:nth-child(2) {
          animation-delay: 1.5s;
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(0.33);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
          }
        }

        .glass-card, .invoice-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 25px !important;
          overflow: hidden;
        }

        .invoice-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white;
          padding: 15px !important;
          border-radius: 15px 15px 0 0 !important;
        }

        .icon-wrapper {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }

        .icon-wrapper-small {
          width: 35px;
          height: 35px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }

        .icon-wrapper-medium {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .icon-wrapper-large {
          width: 45px;
          height: 45px;
          background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }

        .order-badge {
          font-size: 0.9rem;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { box-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
          to { box-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
        }

        .info-section {
          background: rgba(248, 249, 250, 0.8);
          padding: 20px;
          border-radius: 15px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .info-section-small {
          background: rgba(248, 249, 250, 0.8);
          padding: 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .section-title {
          color: #495057;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 1px;
        }

        .section-title-small {
          color: #495057;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }

        .section-title-medium {
          color: #2c3e50;
          font-weight: 600;
          display: flex;
          align-items: center;
          font-size: 1.1rem;
        }

        .section-title-large {
          color: #2c3e50;
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .status-badge {
          font-size: 0.8rem;
          padding: 6px 12px;
          border-radius: 20px;
        }

        .address-text {
          font-style: italic;
          color: #6c757d;
        }

        .modern-table-wrapper {
          border-radius: 15px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        .modern-table {
          margin: 0;
        }

        .table-header th {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: none;
          font-weight: 600;
          color: #495057;
          padding: 12px 10px;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }

        .table-row {
          transition: all 0.3s ease;
          border-bottom: 1px solid #f1f3f4;
        }

        .table-row:hover {
          background-color: rgba(102, 126, 234, 0.05);
        }

        .product-info {
          display: flex;
          align-items: center;
          padding: 10px 0;
        }

        .product-image {
          width: 45px;
          height: 45px;
          object-fit: cover;
          border-radius: 8px;
          margin-right: 10px;
          border: 1px solid #f8f9fa;
        }

        .product-details {
          flex: 1;
        }

        .product-name {
          font-weight: 600;
          color: #2c3e50;
          font-size: 0.95rem;
        }

        .product-brand {
          color: #6c757d;
          font-size: 0.8rem;
          font-style: italic;
        }

        .quantity-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 50%;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .price-text {
          color: #6c757d;
          font-weight: 500;
        }

        .total-text {
          color: #28a745;
          font-size: 1.05rem;
        }

        .total-row td {
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: none !important;
          padding: 20px 15px !important;
        }

        .total-amount {
          color: #667eea !important;
          font-size: 1.8rem !important;
          font-weight: 700 !important;
        }

        .status-timeline-modern {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 20px;
          padding: 25px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .status-timeline-compact {
          background: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          padding: 15px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-modern {
          border-radius: 50px;
          padding: 12px 25px;
          font-weight: 600;
          transition: all 0.4s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          border: 2px solid transparent;
        }

        .btn-modern:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        }

        .action-buttons-modern {
          position: relative;
          z-index: 2;
        }

        .btn-action {
          border-radius: 50px;
          padding: 15px 30px;
          font-weight: 600;
          font-size: 1.1rem;
          transition: all 0.4s ease;
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }

        .btn-action:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
        }

        .btn-action-small {
          border-radius: 25px;
          padding: 8px 16px;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          box-shadow: 0 3px 15px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-action-small:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .btn-primary-action {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
          border: 2px solid transparent !important;
        }

        .btn-primary-action-small {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%) !important;
          border: 1px solid transparent !important;
        }

        .modern-alert {
          border-radius: 15px;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
        }

        .modern-alert-small {
          border-radius: 10px;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          padding: 0.75rem;
        }

        .order-badge-small {
          font-size: 0.8rem;
          animation: glow 2s ease-in-out infinite alternate;
        }

        .btn-modern-small {
          border-radius: 20px;
          padding: 6px 12px;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          border: 1px solid transparent;
        }

        .btn-modern-small:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }

        .action-buttons-compact {
          position: relative;
          z-index: 2;
        }

        .loading-animation {
          position: relative;
        }

        .loading-dots {
          display: flex;
          justify-content: center;
          margin-top: 20px;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          margin: 0 4px;
          animation: loading-bounce 1.4s ease-in-out infinite both;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes loading-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        @media print {
          /* Remove browser default headers and footers */
          @page {
            margin: 15mm;
            size: A4;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* Hide all non-essential elements */
          .d-print-none { display: none !important; }
          .success-header { display: none !important; }
          .background-elements { display: none !important; }
          .floating-circle { display: none !important; }
          .status-timeline-compact { display: none !important; }
          .action-buttons-compact { display: none !important; }
          .modern-alert-small { display: none !important; }
          
          /* Reset page layout for printing */
          .order-confirmation-page { 
            background: white !important; 
            padding: 20px !important;
            min-height: auto !important;
            margin: 0 !important;
          }
          
          /* Clean container styling */
          .container {
            max-width: 100% !important;
            padding: 20px !important;
          }
          
          /* Professional invoice card */
          .invoice-card { 
            background: white !important; 
            backdrop-filter: none !important;
            border: 2px solid #333 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          
          /* Clean invoice header */
          .invoice-header {
            background: #f8f9fa !important;
            color: #333 !important;
            border: none !important;
            border-bottom: 2px solid #333 !important;
            border-radius: 0 !important;
            padding: 20px !important;
          }
          
          /* Typography for print */
          .invoice-header h4 {
            color: #333 !important;
            margin-bottom: 10px !important;
          }
          
          /* Info sections */
          .info-section-small {
            background: white !important;
            border: 1px solid #ddd !important;
            margin-bottom: 15px !important;
          }
          
          .section-title-small {
            color: #333 !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 5px !important;
          }
          
          /* Table styling */
          .modern-table-wrapper {
            border: 1px solid #333 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          
          .modern-table {
            color: #333 !important;
          }
          
          .table-header th {
            background: #f8f9fa !important;
            color: #333 !important;
            border: 1px solid #ddd !important;
            font-weight: bold !important;
          }
          
          .table-row td {
            border: 1px solid #ddd !important;
            color: #333 !important;
          }
          
          .total-row td {
            background: #f8f9fa !important;
            border: 2px solid #333 !important;
            font-weight: bold !important;
            color: #333 !important;
          }
          
          .total-amount {
            color: #333 !important;
            font-size: 1.2rem !important;
          }
          
          /* Product styling */
          .product-name {
            color: #333 !important;
            font-weight: bold !important;
          }
          
          .product-brand {
            color: #666 !important;
          }
          
          .quantity-badge {
            background: #333 !important;
            color: white !important;
          }
          
          .price-text, .total-text {
            color: #333 !important;
          }
          
          /* Hide order tracking completely */
          .status-timeline-compact,
          .status-timeline-modern {
            display: none !important;
          }
          
          /* Hide any section with order tracking */
          [class*="status-timeline"],
          [class*="order-tracking"] {
            display: none !important;
          }
          
          .section-title-medium {
            color: #333 !important;
          }
          
          /* Badges and status */
          .badge {
            border: 1px solid #333 !important;
            color: #333 !important;
            background: white !important;
          }
          
          .status-badge {
            background: white !important;
            color: #333 !important;
            border: 1px solid #333 !important;
          }
          
          .order-badge-small {
            background: white !important;
            color: #333 !important;
            border: 1px solid #333 !important;
          }
          
          /* Icons for print */
          .icon-wrapper-small,
          .icon-wrapper-medium {
            background: #f0f0f0 !important;
            color: #333 !important;
            border: 1px solid #ddd !important;
          }
          
          /* Remove animations and effects */
          * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
          }
          
          /* Ensure text is readable */
          .text-white {
            color: #333 !important;
          }
          
          .text-muted {
            color: #666 !important;
          }
          
          /* Page breaks */
          .invoice-card {
            page-break-inside: avoid;
          }
          
          .modern-table {
            page-break-inside: auto;
          }
          
          .table-row {
            page-break-inside: avoid;
          }
        }

        @media (max-width: 768px) {
          .success-circle {
            width: 100px !important;
            height: 100px !important;
          }
          
          .success-checkmark {
            font-size: 3rem !important;
          }
          
          .pulse-ring {
            width: 150px;
            height: 150px;
          }
          
          .display-3 {
            font-size: 2.5rem;
          }
          
          .product-image {
            width: 45px;
            height: 45px;
          }
          
          .quantity-badge {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }
          
          .btn-action {
            padding: 12px 20px;
            font-size: 1rem;
          }
          
          .total-amount {
            font-size: 1.4rem !important;
          }
        }
      `}</style>
    </div>
  );
}