import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Modal, Row, Col, Accordion, Image, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../lib/api';
import { getImageUrl } from '../lib/utils';
import LogoImg from '../assets/images/Logo.png';
import OrderStatusTimeline from '../components/OrderStatusTimeline';
import '../assets/styles/index.css';

// Compact modal styles
const modalStyles = `
    /* Ensure modal and backdrop sit above the fixed navbar (navbar z-index:1200) */
    .modal-backdrop.show { z-index: 1210 !important; }
    .modal { z-index: 1220 !important; }

    .order-details-modal .modal-content {
        border-radius: 1px;
        border: none;
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
        overflow: hidden;
        font-size: 0.95rem;
    }
    /* Slightly narrower dialog for a compact, centered appearance */
    .order-details-modal .modal-dialog {
        margin: 1.8rem auto; /* push down a bit from the top */
        max-width: 680px; /* narrower compact width */
    }
    .order-details-modal .modal-header {
        padding: 0.45rem 0.6rem;
    }
    .order-details-modal .modal-title { font-size: 0.95rem; }
    .order-details-modal .modal-body { padding: 0.45rem 0.6rem; }
    .order-details-modal .order-item-row { padding: 0.45rem 0.5rem; }
    .order-details-modal .item-image img,
    .order-details-modal .item-image > img {
        width: 24px !important;
        height: 24px !important;
        border-radius: 6px !important;
    }
    .order-details-modal .item-info { font-size: 0.82rem; }
    .order-details-modal .item-price small,
    .order-details-modal .item-total small { font-size: 0.68rem; }
    .order-details-modal .total-row { padding: 0.45rem; font-size: 0.92rem; }
    
    .order-details-modal .modal-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e9ecef;
    }
    
    .order-details-modal .modal-title {
        font-size: 1.1rem;
        font-weight: 600;
    }
    
    .order-items-compact .order-item-row {
        transition: background-color 0.2s;
        border-bottom: 1px solid #f1f3f4 !important;
    }
    
    .order-items-compact .order-item-row:hover {
        background-color: #f8f9fa;
    }
    
    .order-items-compact .order-item-row:last-child {
        border-bottom: none !important;
    }
    
    .compact-timeline {
        max-height: 200px;
        overflow-y: auto;
    }
    
    .total-row {
        border: 1px solid #dee2e6;
    }
    
    @media (max-width: 768px) {
        .order-details-modal .modal-dialog {
            margin: 0.5rem; /* mobile keep small margin */
            margin-top: 1rem;
            max-width: calc(100% - 1rem);
        }
        .order-details-modal .modal-content { font-size: 0.92rem; }
        
        .order-items-compact .order-item-row {
            flex-direction: column;
            align-items: flex-start !important;
            padding: 0.75rem;
        }
        
        .order-items-compact .item-quantity,
        .order-items-compact .item-price,
        .order-items-compact .item-total {
            margin: 0.25rem 0;
        }
    }

        /* Action buttons styling for order list */
        .order-actions .btn {
            border-radius: 999px;
            padding: 0.45rem 0.9rem;
            box-shadow: 0 4px 12px rgba(11,34,64,0.06);
            transition: transform 0.12s ease, box-shadow 0.12s ease;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: .45rem;
        }
        .order-actions .btn i { margin-right: 0.35rem; }
        .order-actions .btn:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(11,34,64,0.12); }
        .order-actions .btn-outline-info { color: #0d6efd; border-color: rgba(13,110,253,0.18); background: linear-gradient(180deg, rgba(13,110,253,0.02), rgba(13,110,253,0.01)); }
        .order-actions .btn-outline-success { color: #198754; border-color: rgba(25,135,84,0.12); }
        /* Make outline-success look filled on hover with white text */
        .order-actions .btn-outline-success:hover,
        .order-actions .btn-outline-success:focus {
            color: #ffffff !important;
            background: linear-gradient(180deg, #198754 0%, #157347 100%) !important;
            border-color: rgba(25,135,84,0.9) !important;
            box-shadow: 0 8px 24px rgba(25,135,84,0.14);
        }
        /* Make outline-secondary look filled on hover with white text */
        .order-actions .btn-outline-secondary:hover,
        .order-actions .btn-outline-secondary:focus {
            color: #ffffff !important;
            background: linear-gradient(180deg, #6c757d 0%, #5a6268 100%) !important;
            border-color: rgba(108,117,125,0.9) !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .order-actions .btn-outline-secondary { color: #6c757d; }
        .order-actions .btn-outline-primary { color: #0d6efd; }
        .order-actions .btn-full { background: linear-gradient(180deg, rgba(14,165,233,0.06), rgba(14,165,233,0.02)); border: 1px solid rgba(14,165,233,0.12); color: #0ea5e9; }
        /* Make primary look like an outlined blue button, fill blue on hover */
        .order-actions .btn-primary {
            background: transparent !important;
            color: #0d6efd !important;
            border: 1px solid rgba(13,110,253,0.18) !important;
        }
        .order-actions .btn-primary:hover,
        .order-actions .btn-primary:focus {
            background: linear-gradient(180deg, #0d6efd 0%, #0b5ed7 100%) !important;
            color: #ffffff !important;
            border-color: rgba(13,110,253,0.95) !important;
            box-shadow: 0 8px 20px rgba(13,110,253,0.12);
        }
`;

function OrderHistory() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const navigate = useNavigate();

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
        // Backward-compatible wrapper: delegate to direct print
        printInvoiceDirect(order);
    };

    // Build printable invoice HTML from an order object (so we don't need the modal DOM)
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
        // build HTML and print via hidden iframe
        const title = `Invoice - Order #${orderToPrint.id}`;
        const content = buildInvoiceHtml(orderToPrint);
        const styles = `
            /* Try to fit the invoice onto a single printed page where possible */
            @page { size: A4; margin: 12mm; }
            /* Avoid forcing 100% height which can push content to an extra page */
            html, body { height: auto; }
            body{font-family:Arial,Helvetica,sans-serif;color:#212529;margin:0;padding:8px 8px 0 8px;-webkit-print-color-adjust:exact}
            .invoice-root { max-width: 820px; margin: 0 auto; }
            .invoice-root h2 { margin:0 }
            table { border-collapse: collapse; width: 100%; font-size:13px }
            table th, table td { border: 1px solid #eee; padding: 8px; }
            thead tr { background: #f8f9fa; }
            /* Prevent tables or rows splitting awkwardly across pages */
            table { page-break-inside: auto; }
            tr    { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            tfoot { display: table-footer-group; }
            .no-break { page-break-inside: avoid; }
            /* Make sure nothing has large fixed height that forces extra page */
            .invoice-root * { max-height: none !important; }
            @media print {
                body { margin: 0; padding: 0; }
                .no-print { display: none !important; }
            }
        `;

        const iframeId = 'print-iframe-invoice';
        let iframe = document.getElementById(iframeId);
        if (iframe) {
            try { document.body.removeChild(iframe); } catch (e) { }
        }
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
            <Container className="py-5" style={{ paddingTop: '20px', minHeight: '60vh' }}>
                <Row className="justify-content-center">
                    <Col md={6} className="text-center">
                        <Spinner animation="border" variant="primary" size="lg" />
                        <p className="mt-3 text-muted">Loading your order history...</p>
                    </Col>
                </Row>
            </Container>
        );
    }

    return (
        <>
            <style>{modalStyles}</style>
            <Container className="py-5" style={{ paddingTop: '20px' }}>
                {/* Page Header */}
                <div className="mb-5">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center">
                            <div
                                className="rounded-3 d-inline-flex align-items-center justify-content-center me-3"
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    background: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)'
                                }}
                            >
                                <i className="bi bi-clock-history text-white fs-3"></i>
                            </div>
                            <div>
                                <h1 className="fw-bold mb-0" style={{ color: '#2c3e50' }}>Order History</h1>
                                <p className="text-muted mb-0">
                                    {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                {orders.length > 0 ? (
                    <Card className="shadow-sm border-0">
                        <Card.Body className="p-0">
                            <Accordion defaultActiveKey="0" className="border-0">
                                {orders.map((order, index) => (
                                    <Accordion.Item eventKey={String(index)} key={order.id} className="border-0 border-bottom">
                                        <Accordion.Header className="bg-light">
                                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                                                <div>
                                                    <strong className="fs-5">Order #{order.id}</strong>
                                                    <span className="text-muted ms-3 d-block d-md-inline">
                                                        <i className="bi bi-calendar me-1"></i>
                                                        {formatDate(order.createdAt || order.date)}
                                                    </span>
                                                </div>
                                                <div className="d-flex gap-2 align-items-center flex-wrap">
                                                    <Badge bg={getStatusBadge(order.status)} className="fs-6 px-3 py-2">
                                                        <i className={`bi ${getStatusIcon(order.status)} me-1`}></i>
                                                        {order.status}
                                                    </Badge>
                                                    <strong className="fs-5" style={{ color: '#0d6efd' }}>
                                                        ${(order.totalAmount || 0).toFixed(2)}
                                                    </strong>
                                                </div>
                                            </div>
                                        </Accordion.Header>
                                        <Accordion.Body className="p-4">
                                            <Row className="mb-4">
                                                <Col md={6}>
                                                    <h6 className="text-muted text-uppercase mb-3">Shipping Information</h6>
                                                    <p className="mb-2"><strong>Customer:</strong> {order.customerName || 'N/A'}</p>
                                                    <p className="mb-0"><strong>Address:</strong> {order.shippingAddress || 'Standard shipping address'}</p>
                                                </Col>
                                                <Col md={6}>
                                                    <h6 className="text-muted text-uppercase mb-3">Payment Information</h6>
                                                    <p className="mb-2">
                                                        <strong>Status:</strong>
                                                        {order.paymentStatus ? (
                                                            <Badge bg={order.paymentStatus === 'paid' ? 'success' : 'warning'} className="ms-2">
                                                                {order.paymentStatus}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-muted ms-2">Processing</span>
                                                        )}
                                                    </p>
                                                    <p className="mb-0">
                                                        <strong>Last Updated:</strong> {formatDate(order.updatedAt || order.createdAt)}
                                                    </p>
                                                </Col>
                                            </Row>

                                            {order.items && order.items.length > 0 ? (
                                                <>
                                                    <h6 className="text-muted text-uppercase mb-3">Order Items</h6>
                                                    <Table responsive bordered className="mb-4">
                                                        <thead style={{ background: '#f8f9fa' }}>
                                                            <tr>
                                                                <th>Product</th>
                                                                <th className="text-center" width="100">Qty</th>
                                                                <th className="text-end" width="120">Price</th>
                                                                <th className="text-end" width="120">Total</th>
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
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center align-middle">{item.quantity}</td>
                                                                    <td className="text-end align-middle">${(item.unitPrice || 0).toFixed(2)}</td>
                                                                    <td className="text-end align-middle fw-semibold">
                                                                        ${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr style={{ background: '#f8f9fa' }}>
                                                                <td colSpan="3" className="text-end fw-bold fs-5">Total Amount:</td>
                                                                <td className="text-end fw-bold fs-4" style={{ color: '#0d6efd' }}>
                                                                    ${(order.totalAmount || 0).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </Table>
                                                </>
                                            ) : (
                                                <Alert variant="info">
                                                    <i className="bi bi-info-circle me-2"></i>
                                                    Order items information not available.
                                                </Alert>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="order-actions d-flex gap-2 flex-wrap justify-content-start">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => handleViewDetails(order)}
                                                >
                                                    <i className="bi bi-eye me-2"></i>View Details & Tracking
                                                </Button>
                                                <Button
                                                    variant="outline-success"
                                                    size="sm"
                                                    onClick={() => handleViewInvoice(order)}
                                                >
                                                    <i className="bi bi-receipt me-2"></i>View Invoice
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
                                                    <i className="bi bi-arrow-up-right-square me-2"></i>Full Page View
                                                </Link>
                                            </div>
                                        </Accordion.Body>
                                    </Accordion.Item>
                                ))}
                            </Accordion>
                        </Card.Body>
                    </Card>
                ) : (
                    <Card className="text-center py-5 shadow-sm border-0">
                        <Card.Body>
                            <div
                                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                                style={{
                                    width: '120px',
                                    height: '120px',
                                    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'
                                }}
                            >
                                <i className="bi bi-cart-x" style={{ fontSize: '4rem', color: '#6c757d' }}></i>
                            </div>
                            <h3 className="mb-3">No Order History Yet</h3>
                            <p className="text-muted mb-4 fs-5">
                                You haven't completed any orders yet. Start shopping to see your order history here!
                            </p>
                        </Card.Body>
                    </Card>
                )}

                {/* Order Details Modal */}
                <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered className="order-details-modal">
                    <Modal.Header closeButton className="bg-light border-bottom">
                        <Modal.Title className="d-flex align-items-center">
                            <i className="bi bi-receipt me-2 text-primary"></i>
                            <span>Order #{selectedOrder?.id}</span>
                            {selectedOrder && (
                                <Badge bg={getStatusBadge(selectedOrder.status)} className="ms-2">
                                    {selectedOrder.status}
                                </Badge>
                            )}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body className="p-0">
                        {selectedOrder && (
                            <div>
                                {/* Compact Info Section */}
                                <div className="p-3 bg-light border-bottom">
                                    <Row className="g-2">
                                        <Col md={3}>
                                            <small className="text-muted d-block">Order Date</small>
                                            <span className="fw-semibold small">{formatDate(selectedOrder.createdAt || selectedOrder.date)}</span>
                                        </Col>
                                        <Col md={2}>
                                            <small className="text-muted d-block">Payment</small>
                                            {selectedOrder.paymentStatus ? <Badge bg={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'} className="small">{selectedOrder.paymentStatus}</Badge> : <span className="small text-muted">Processing</span>}
                                        </Col>
                                        <Col md={3}>
                                            <small className="text-muted d-block">Customer</small>
                                            <span className="fw-semibold small">{selectedOrder.customerName || 'N/A'}</span>
                                        </Col>
                                        <Col md={2}>
                                            <small className="text-muted d-block">Address</small>
                                            <span className="small">{selectedOrder.shippingAddress || 'N/A'}</span>
                                        </Col>
                                        <Col md={2}>
                                            <small className="text-muted d-block">Total</small>
                                            <span className="text-success fw-bold">${(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Compact Items Section */}
                                <div className="p-3">
                                    <h6 className="text-muted mb-2 d-flex align-items-center">
                                        <i className="bi bi-bag me-1"></i>
                                        ORDER ITEMS
                                    </h6>
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        <div className="order-items-compact">
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="order-item-row d-flex align-items-center p-2 border-bottom">
                                                    <div className="item-image me-2">
                                                        {item.product && item.product.images && (
                                                            <Image
                                                                src={getImageUrl(item.product.images)}
                                                                alt={item.product.name}
                                                                style={{
                                                                    width: '35px',
                                                                    height: '35px',
                                                                    objectFit: 'cover',
                                                                    borderRadius: '6px'
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="item-info flex-grow-1 me-2">
                                                        <div className="fw-semibold small mb-0">
                                                            {item.product?.name || `Product #${item.productId}`}
                                                        </div>
                                                        {item.product?.brand && (
                                                            <small className="text-muted">{item.product.brand}</small>
                                                        )}
                                                    </div>
                                                    <div className="item-quantity text-center me-2" style={{ minWidth: '40px' }}>
                                                        <span className="badge bg-light text-dark">{item.quantity}</span>
                                                    </div>
                                                    <div className="item-price text-end me-2" style={{ minWidth: '60px' }}>
                                                        <small className="text-muted d-block">Unit</small>
                                                        <span className="small">${(item.unitPrice || 0).toFixed(2)}</span>
                                                    </div>
                                                    <div className="item-total text-end" style={{ minWidth: '70px' }}>
                                                        <small className="text-muted d-block">Total</small>
                                                        <span className="fw-bold text-success">${(item.totalPrice || (item.quantity * item.unitPrice) || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="total-row d-flex justify-content-between align-items-center p-2 bg-light mt-2 rounded">
                                                <span className="fw-bold">Total Amount:</span>
                                                <span className="fw-bold fs-5 text-success">${(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-muted small">No items in this order.</p>
                                    )}
                                </div>

                                {/* Compact Tracking Section */}
                                <div className="p-3 bg-light border-top">
                                    <h6 className="text-muted mb-2 d-flex align-items-center">
                                        <i className="bi bi-truck me-1"></i>
                                        ORDER TRACKING
                                    </h6>
                                    <div className="compact-timeline">
                                        <OrderStatusTimeline order={selectedOrder} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal.Body>
                    <Modal.Footer className="bg-light border-top justify-content-between">
                        <div className="d-flex align-items-center">
                            <small className="text-muted">
                                <i className="bi bi-info-circle me-1"></i>
                                Order placed on {formatDate(selectedOrder?.createdAt || selectedOrder?.date)}
                            </small>
                        </div>
                        <div>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewInvoice(selectedOrder)}
                                className="me-2"
                            >
                                <i className="bi bi-receipt me-1"></i>Invoice
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => setShowDetailsModal(false)}>
                                <i className="bi bi-x-lg me-1"></i>Close
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>

                {/* Invoice Modal */}
                <Modal show={showInvoiceModal} onHide={() => setShowInvoiceModal(false)} size="lg" centered className="order-details-modal">
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
                        <Button variant="danger" size="sm" onClick={() => setShowInvoiceModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            </Container>
        </>
    );
}

export default OrderHistory;