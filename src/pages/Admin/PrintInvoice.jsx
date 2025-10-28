import React from "react"
import { Container, Row, Col, Table } from "react-bootstrap"
import { formatDate } from "../../lib/orderUtils"
import "../../assets/styles/orders.css"
import logo from "../../assets/images/Logo.png"

function PrintInvoice({ order = null }) {
    if (!order) return null

    const items = order.items || []
    const subtotal = items.reduce((s, it) => s + ((it.totalPrice != null) ? it.totalPrice : (it.quantity || 0) * (it.unitPrice || 0)), 0)
    const shipping = order.shippingCost || 0
    const tax = order.taxAmount || 0
    const total = order.totalAmount != null ? order.totalAmount : subtotal + shipping + tax

    const green = '#0b9b6e'

    return (
        <Container fluid className="py-3" style={{ background: '#fff', color: '#000' }}>
            {/* Top title */}
            <Row className="mb-2">
                <Col className="text-center">
                    <h1 style={{ color: green, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>INVOICE</h1>
                </Col>
            </Row>

            {/* Header: company info left, logo right */}
            <Row className="align-items-start mb-2">
                <Col md={7}>
                    <div style={{ fontWeight: 700, color: green, fontSize: '12pt' }}>{order.storeName || 'PickAndPlay'}</div>
                    <div style={{ marginTop: 6, fontSize: '9pt', color: '#333' }}>
                        {order.storeAddressLine1 && <div>{order.storeAddressLine1}</div>}
                        {order.storeAddressLine2 && <div>{order.storeAddressLine2}</div>}
                        {order.storeCity && <div>{order.storeCity}</div>}
                        {order.storePhone && <div>Mobile: {order.storePhone}</div>}
                        {order.storeEmail && <div>Email: {order.storeEmail}</div>}
                    </div>
                </Col>
                <Col md={5} className="text-end">
                    {/* Logo */}
                    <div style={{ width: 120, height: 80, marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <img src={logo} alt="PickAndPlay Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                </Col>
            </Row>

            <hr style={{ borderTop: `3px solid ${green}`, margin: '6px 0 12px' }} />

            {/* Bill To and Invoice meta */}
            <Row className="mb-3">
                <Col md={6}>
                    <div style={{ color: green, fontWeight: 700, marginBottom: 6 }}>Bill To</div>
                    <div style={{ fontSize: '9pt' }}>{order.customerName || 'N/A'}</div>
                    {order.shippingAddress && <div style={{ fontSize: '9pt' }}>{order.shippingAddress}</div>}
                    {order.customerCity && <div style={{ fontSize: '9pt' }}>{order.customerCity}</div>}
                </Col>
                <Col md={6} className="text-end">
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Invoice No : <span style={{ color: '#000', fontWeight: 600 }}>INV-{order.id}</span></div>
                    <div style={{ fontSize: '9pt' }}>Invoice Date : {formatDate(order.createdAt || order.date)}</div>
                    {order.dueDate && <div style={{ fontSize: '9pt' }}>Due Date : {formatDate(order.dueDate)}</div>}
                </Col>
            </Row>

            {/* Items table */}
            <Table bordered size="sm" className="mb-2">
                <thead>
                    <tr style={{ background: green, color: '#fff' }}>
                        <th style={{ width: '6%', textAlign: 'center' }}>Sl.</th>
                        <th>Description</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>Qty</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Rate</th>
                        <th style={{ width: '12%', textAlign: 'right' }}>Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {items.length === 0 && (
                        <tr>
                            <td colSpan={5} className="text-center py-3">No items</td>
                        </tr>
                    )}
                    {items.map((it, idx) => {
                        const qty = it.quantity || 0
                        const rate = it.unitPrice || 0
                        const amount = (it.totalPrice != null) ? it.totalPrice : qty * rate
                        return (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#f6fffb' : 'transparent' }}>
                                <td className="text-center align-middle">{idx + 1}</td>
                                <td className="align-middle">{it.title || `Product ${it.productId || ''}`}</td>
                                <td className="text-center align-middle">{qty}</td>
                                <td className="text-end align-middle">${rate.toFixed(2)}</td>
                                <td className="text-end align-middle">${amount.toFixed(2)}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </Table>

            {/* Payment instructions and totals */}
            <Row className="mt-2">
                <Col md={6}>
                    <div style={{ color: green, fontWeight: 700, marginBottom: 6 }}>Payment Instructions</div>
                    <div style={{ fontSize: '9pt' }}>{order.paymentInstructions || 'Please pay by bank transfer to the account on the invoice.'}</div>
                </Col>
                <Col md={6}>
                    <div style={{ maxWidth: 360, marginLeft: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${green}` }}>
                            <div>Subtotal</div>
                            <div style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <div>Shipping</div>
                            <div>${shipping.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                            <div>Tax</div>
                            <div>${tax.toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: `2px solid ${green}`, fontSize: '12pt' }}>
                            <div style={{ fontWeight: 700 }}>Total</div>
                            <div style={{ fontWeight: 900 }}>${total.toFixed(2)}</div>
                        </div>
                    </div>
                </Col>
            </Row>

            {/* Signature area */}
            <Row className="mt-4">
                <Col md={6}>
                </Col>
                <Col md={6} className="text-end">
                    <div style={{ marginTop: 30 }}>
                        <div style={{ height: 60 }} />
                        <div style={{ borderTop: `1px solid ${green}`, display: 'inline-block', paddingTop: 6, minWidth: 180 }}>Authorized Signatory</div>
                    </div>
                </Col>
            </Row>
        </Container>
    )
}

export default PrintInvoice
