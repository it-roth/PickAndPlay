import { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Row, Col, Accordion, Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { orderService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import LogoImg from '../assets/images/Logo.png';
import OrderStatusTimeline from './OrderStatusTimeline';

function UserOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
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

  const handleViewInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = (order) => {
    const orderToPrint = order || selectedOrder;
    if (!orderToPrint) return;
    setSelectedOrder(orderToPrint);
    printInvoiceDirect(orderToPrint);
  };

  const buildInvoiceHtml = (order) => {
    if (!order) return '';
    const rows = (order.items || []).map((item, idx) => `
      <tr>
        <td style="padding:8px;vertical-align:middle">${item.product?.sku || item.productId || ''}</td>
        <td style="padding:8px;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:10px">
            ${item.product && item.product.images ? `<img src="${getImageUrl(item.product.images)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px"/>` : ''}
            <div>
              <div style="font-weight:700">${item.product?.name || `Product #${item.productId}`}</div>
              ${item.product?.brand ? `<div style="color:#6c757d;font-size:0.88rem">${item.product.brand}</div>` : ''}
              ${item.product?.description ? `<div style="color:#6c757d;font-size:0.82rem;margin-top:4px">${item.product.description}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="text-align:center;padding:8px;vertical-align:middle">${item.quantity}</td>
        <td style="text-align:right;padding:8px;vertical-align:middle">$${(item.unitPrice || 0).toFixed(2)}</td>
        <td style="text-align:right;padding:8px;vertical-align:middle">$${((item.totalPrice) || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
      </tr>
    `).join('');

    const subtotal = (order.items || []).reduce((s, it) => s + ((it.totalPrice) || (it.quantity * it.unitPrice) || 0), 0) || 0;
    const shipping = order.shippingAmount || order.shipping || 0;
    const tax = order.taxAmount || order.tax || 0;
    const discount = order.discountAmount || order.discount || 0;
    const total = order.totalAmount || (subtotal + shipping + tax - discount);

    return `
      <div class="invoice-root">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
              <div style="display:flex;align-items:center;gap:12px">
                <img src="${LogoImg}" alt="Pick & Play" style="height:48px;object-fit:contain" />
                <div>
                  <div style="font-weight:600;color:#111">Pick & Play</div>
                  <div style="color:#6c757d;font-size:12px">Pickup & Play Co. · 123 Main St · City</div>
                </div>
              </div>
          </div>
          <div style="text-align:right">
            <div style="font-weight:700">INVOICE</div>
            <div style="color:#6c757d">Order #${order.id}</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin:12px 0;padding:8px 0;border-top:1px solid #eee;border-bottom:1px solid #eee">
          <div style="flex:1">
            <div style="font-size:12px;color:#6c757d">BILL TO</div>
            <div style="font-weight:700">${order.customerName || order.customer?.name || 'Customer'}</div>
            ${order.customer?.email ? `<div style="font-size:12px;color:#6c757d">${order.customer.email}</div>` : ''}
            <div style="margin-top:6px">${order.shippingAddress || order.customer?.address || ''}</div>
          </div>
          <div style="width:240px;text-align:right">
            <div style="font-size:12px;color:#6c757d">Order Date</div>
            <div style="font-weight:700">${formatDate(order.createdAt || order.date)}</div>
            <div style="height:8px"></div>
            <div style="font-size:12px;color:#6c757d">Payment</div>
            <div style="font-weight:700">${order.paymentStatus || 'N/A'}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px">
          <thead>
            <tr style="background:#f8f9fa;text-align:left">
              <th style="padding:10px;border:1px solid #eee;width:80px">SKU</th>
              <th style="padding:10px;border:1px solid #eee">Description</th>
              <th style="padding:10px;border:1px solid #eee;text-align:center;width:80px">Qty</th>
              <th style="padding:10px;border:1px solid #eee;text-align:right;width:110px">Unit</th>
              <th style="padding:10px;border:1px solid #eee;text-align:right;width:110px">Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="display:flex;justify-content:flex-end;margin-top:12px">
          <table style="width:360px;border-collapse:collapse;font-size:13px">
            <tbody>
              <tr><td style="padding:6px;color:#6c757d">Subtotal</td><td style="text-align:right;padding:6px">$${subtotal.toFixed(2)}</td></tr>
              <tr><td style="padding:6px;color:#6c757d">Shipping</td><td style="text-align:right;padding:6px">$${shipping.toFixed(2)}</td></tr>
              <tr><td style="padding:6px;color:#6c757d">Tax</td><td style="text-align:right;padding:6px">$${tax.toFixed(2)}</td></tr>
              ${discount ? `<tr><td style="padding:6px;color:#6c757d">Discount</td><td style="text-align:right;padding:6px">-$${discount.toFixed(2)}</td></tr>` : ''}
              <tr style="background:#f8f9fa;font-weight:700"><td style="padding:8px">Total</td><td style="text-align:right;padding:8px">$${(total || 0).toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top:28px;font-size:12px;color:#6c757d">Thank you for your purchase! If you have any questions, reply to this email or contact support.</div>
      </div>
    `;
  };

  const printInvoiceDirect = (order) => {
    const orderToPrint = order || selectedOrder;
    if (!orderToPrint) return;
    const title = `Invoice - Order #${orderToPrint.id}`;
    const content = buildInvoiceHtml(orderToPrint);
    const styles = `
      @page { size: auto; margin: 15mm; }
      html, body { height: 100%; }
      body{font-family:Arial,Helvetica,sans-serif;color:#212529;margin:0;padding:20px;-webkit-print-color-adjust:exact}
      .invoice-root { max-width: 840px; margin: 0 auto; }
      .invoice-root h2 { margin:0 }
      table { border-collapse: collapse; width: 100%; }
      table th, table td { border: 1px solid #eee; padding: 8px; }
      thead tr { background: #f8f9fa; }
      .no-break { page-break-inside: avoid; }
      @media print {
        body { margin: 0; }
        .no-print { display: none !important; }
      }
    `;

    const iframeId = 'print-iframe-invoice';
    let iframe = document.getElementById(iframeId);
    if (iframe) { try { document.body.removeChild(iframe); } catch (e) { } }
    iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.id = iframeId;
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow || iframe.contentDocument;
    const printDoc = doc.document || doc;
    printDoc.open();
    printDoc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${styles}</style></head><body>${content}</body></html>`);
    printDoc.close();

    let printed = false;
    const trigger = () => {
      if (printed) return;
      printed = true;
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        console.warn('Print via iframe failed, falling back to window.print()', e);
        window.print();
      } finally {
        setTimeout(() => { try { document.body.removeChild(iframe); } catch (err) { } }, 500);
      }
    };

    // Try to print on iframe load, with a fallback timeout for browsers that don't fire onload reliably.
    iframe.onload = () => setTimeout(trigger, 150);
    setTimeout(trigger, 1000);
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
                                <td>
                                  <div className="d-flex align-items-center">
                                    {item.product && item.product.images && (
                                      <Image
                                        src={getImageUrl(item.product.images)}
                                        alt={item.product.name}
                                        style={{
                                          width: '40px',
                                          height: '40px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          marginRight: '10px'
                                        }}
                                        className="d-none d-md-block"
                                      />
                                    )}
                                    <div>
                                      <div className="fw-semibold">
                                        {item.product?.name || `Product #${item.productId}`}
                                      </div>
                                      {item.product?.brand && (
                                        <small className="text-muted">{item.product.brand}</small>
                                      )}
                                    </div>
                                  </div>
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
                              <td className="text-end fw-bold">${(order.totalAmount || 0).toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </Table>
                      </>
                    ) : (
                      <p className="text-muted mb-0">No items in this order.</p>
                    )}

                    <div className="mt-3 d-flex gap-2 flex-wrap">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <i className="bi bi-eye me-1"></i> View Details
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleViewInvoice(order)}
                      >
                        <i className="bi bi-receipt me-1"></i> View Invoice
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => printInvoiceDirect(order)}
                      >
                        <i className="bi bi-printer me-2"></i>Print Invoice
                      </Button>
                      <Link
                        to={`/order-confirmation?orderId=${order.id}`}
                        className="btn btn-outline-info btn-sm"
                      >
                        <i className="bi bi-arrow-up-right-square me-1"></i> Full Page
                      </Link>
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
                          <div className="d-flex align-items-center">
                            {item.product && item.product.images && (
                              <Image
                                src={getImageUrl(item.product.images)}
                                alt={item.product.name}
                                style={{
                                  width: '50px',
                                  height: '50px',
                                  objectFit: 'cover',
                                  borderRadius: '8px',
                                  marginRight: '12px'
                                }}
                                className="d-none d-md-block"
                              />
                            )}
                            <div>
                              <div className="fw-semibold">
                                {item.product?.name || `Product #${item.productId}`}
                              </div>
                              {item.product?.brand && (
                                <small className="text-muted">{item.product.brand}</small>
                              )}
                              <div className="text-muted small">ID: #{item.productId}</div>
                            </div>
                          </div>
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

              <hr />

              <h6 className="text-muted mb-3">ORDER TRACKING</h6>
              <OrderStatusTimeline order={selectedOrder} />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Invoice Modal */}
      <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>
            Invoice - Order #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div id="invoice-content-modal">
            {selectedOrder && (
              <div>
                <div className="invoice-header text-center mb-4">
                  <h4>INVOICE</h4>
                  <p className="text-muted">Order #{selectedOrder.id}</p>
                </div>

                <Row className="order-info mb-4">
                  <Col md={6}>
                    <h6 className="text-muted mb-3">ORDER INFORMATION</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Order Date:</strong></td>
                          <td>{formatDate(selectedOrder.createdAt || selectedOrder.date)}</td>
                        </tr>
                        <tr>
                          <td><strong>Status:</strong></td>
                          <td>
                            <Badge bg={getStatusBadge(selectedOrder.status)}>
                              {selectedOrder.status}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td><strong>Payment:</strong></td>
                          <td>
                            {selectedOrder.paymentStatus ? (
                              <Badge bg={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                                {selectedOrder.paymentStatus}
                              </Badge>
                            ) : (
                              'Processing'
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-muted mb-3">SHIPPING DETAILS</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Customer:</strong></td>
                          <td>{selectedOrder.customerName || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Address:</strong></td>
                          <td>{selectedOrder.shippingAddress || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td><strong>Total:</strong></td>
                          <td>
                            <span className="text-primary fs-5 fw-bold">
                              ${(selectedOrder.totalAmount || 0).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                </Row>

                <h6 className="text-muted mb-3">ORDER ITEMS</h6>
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <table className="items-table table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-end">Unit Price</th>
                        <th className="text-end">Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="d-flex align-items-center">
                              {item.product && item.product.images && (
                                <Image
                                  src={getImageUrl(item.product.images)}
                                  alt={item.product.name}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    marginRight: '10px'
                                  }}
                                  className="d-none d-md-block"
                                />
                              )}
                              <div>
                                <div className="fw-semibold">
                                  {item.product?.name || `Product #${item.productId}`}
                                </div>
                                {item.product?.brand && (
                                  <small className="text-muted">{item.product.brand}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-end">${(item.unitPrice || 0).toFixed(2)}</td>
                          <td className="text-end">${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row table-light">
                        <td colSpan="3" className="text-end fw-bold">Total Amount:</td>
                        <td className="text-end fw-bold">${(selectedOrder.totalAmount || 0).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <p className="text-muted">No items in this order.</p>
                )}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => printInvoiceDirect(selectedOrder)}
          >
            <i className="bi bi-printer me-2"></i>Print Invoice
          </Button>
          <Button variant="secondary" onClick={() => setShowInvoiceModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default UserOrderHistory;
