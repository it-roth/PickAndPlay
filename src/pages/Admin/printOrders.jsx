"use client"

import { Container, Table, Badge, Row, Col, Card } from "react-bootstrap"
import { getStatusBadge, formatDate, calculateOrderStats } from "../../lib/orderUtils"
import "../../assets/styles/orders.css"

function PrintOrders({ 
  orders = [], 
  filteredOrders = [], 
  isPrinting = false, 
  hasActiveFilters = false 
}) {
  
  const ordersToDisplay = isPrinting && !hasActiveFilters ? orders : filteredOrders
  const { totalRevenue, totalOrders, averageOrder, totalItems } = calculateOrderStats(ordersToDisplay)

  return (
    <Container fluid className="py-2">
      {/* Print Header Bar */}
      <div className="d-flex justify-content-between align-items-center mb-2 pb-2" style={{ borderBottom: '1px solid #ddd', fontSize: '9pt', color: '#666' }}>
        <span>{new Date().toLocaleDateString("en-US")} {new Date().toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</span>
        <span>Orders Report - {new Date().getFullYear()}</span>
      </div>

      {/* Main Report Header */}
      <div className="mb-3 text-center">
        <h1 className="h2 mb-1 fw-bold text-dark">Orders Management</h1>
        <p className="text-muted mb-0 small">Generated on {new Date().toLocaleDateString("en-US")} at {new Date().toLocaleTimeString("en-US", { 
          hour: '2-digit', 
          minute: '2-digit' 
        })} | Period: All available data</p>
      </div>

      {/* Compact Summary Cards Section */}
      <Row className="mb-3 g-3">
        <Col md={3}>
          <Card className="border-0 h-100" style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <Card.Body className="text-center py-2">
              <h6 className="text-muted text-uppercase small mb-1">TOTAL ORDERS</h6>
              <h2 className="mb-0 fw-bold text-dark">{totalOrders}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 h-100" style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <Card.Body className="text-center py-2">
              <h6 className="text-muted text-uppercase small mb-1">TOTAL REVENUE</h6>
              <h2 className="mb-0 fw-bold text-dark">${totalRevenue.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 h-100" style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <Card.Body className="text-center py-2">
              <h6 className="text-muted text-uppercase small mb-1">AVERAGE ORDER</h6>
              <h2 className="mb-0 fw-bold text-dark">${averageOrder.toFixed(2)}</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 h-100" style={{ backgroundColor: '#fafafa', border: '1px solid #e0e0e0' }}>
            <Card.Body className="text-center py-2">
              <h6 className="text-muted text-uppercase small mb-1">TOTAL ITEMS</h6>
              <h2 className="mb-0 fw-bold text-dark">{totalItems}</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Orders Table Section - Professional Print Style */}
      <Card className="border-0 shadow-sm modern-card">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="mb-0">
              <thead>
                <tr>
                  <th>ORDER #</th>
                  <th>DATE</th>
                  <th>CUSTOMER</th>
                  <th>ITEMS</th>
                  <th>STATUS</th>
                  <th>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {ordersToDisplay.length > 0 ? (
                  ordersToDisplay.map((order) => (
                    <tr 
                      key={order.id}
                      style={{ borderBottom: '1px solid #dee2e6' }}
                    >
                      <td>#{order.id}</td>
                      <td>{formatDate(order.createdAt || order.date)}</td>
                      <td>{order.customerName || "N/A"}</td>
                      <td>
                        <Badge bg="primary">
                          {(order.items || []).length} ITEM{(order.items || []).length !== 1 ? "S" : ""}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadge(order.status)}>
                          {(order.status || "Unknown").toUpperCase()}
                        </Badge>
                      </td>
                      <td>${(order.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      <i className="bi bi-inbox display-1 d-block mb-3"></i>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default PrintOrders