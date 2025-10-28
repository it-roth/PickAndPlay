import { useState, useEffect } from "react"
import { Container, Table, Button, Form, Badge, Modal, Row, Col, Card, Pagination } from "react-bootstrap"
import { orderService } from "../../lib/api"
import { showError, showSuccess } from "../../lib/notify"
import PrintOrders from "./printOrders"
import PrintInvoice from "./PrintInvoice"
import { getStatusBadge, formatDateForScreen, calculateOrderStats } from "../../lib/orderUtils"
import "../../assets/styles/orders.css"

// Local styles for admin orders page
const adminStyles = `
.btn-reset-filters {
  background-color: #dc3545;
  border-color: #dc3545;
  color: #fff;
  font-weight: 600;
}
.btn-reset-filters:hover,
.btn-reset-filters:focus {
  /* slightly lighter red on hover, keep white text */
  background-color: #e35b5b;
  border-color: #e35b5b;
  color: #fff;
  box-shadow: 0 6px 18px rgba(220,53,69,0.12);
  transform: translateY(-2px);
}
`;

function Orders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [customerNameFilter, setCustomerNameFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await orderService.getAllOrders()
      const data = response.data || response
      const sortedOrders = (Array.isArray(data) ? data : []).sort(
        (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date),
      )
      setOrders(sortedOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
      showError("Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }



  const handlePrint = () => {
    setIsPrinting(true)

    // Force a re-render to ensure content is ready
    setTimeout(() => {
      // Add print date to document for PDF filename
      const reportDate = new Date().toISOString().split("T")[0]
      document.title = `Orders_Report_${reportDate}`

      // Add print class to body for better Microsoft Print to PDF compatibility
      document.body.classList.add('printing')
      document.body.style.visibility = 'visible'
      document.body.style.opacity = '1'

      // Longer delay to ensure Microsoft Print to PDF can fully load the content
      setTimeout(() => {
        window.print()

        // Reset state after print dialog
        setTimeout(() => {
          setIsPrinting(false)
          document.body.classList.remove('printing')
          document.title = "PickAndPlay - Admin Dashboard"
        }, 200)
      }, 500)
    }, 150)
  }

  const handlePrintInvoice = (orderToPrint = null) => {
    const order = orderToPrint || selectedOrder
    if (!order) return
    // ensure selectedOrder is set so PrintInvoice receives it
    setSelectedOrder(order)
    // Make sure full-report printing is not active when printing a single invoice
    setIsPrinting(false)
    // Flip the invoice-print flag; the actual print side-effect is handled in a useEffect below
    setIsPrintingInvoice(true)
  }

  const handleDeleteOrder = async (orderId, e) => {
    // If called from a button inside the row, prevent row click
    if (e && e.stopPropagation) e.stopPropagation()

    const confirmed = window.confirm(`Are you sure you want to delete order #${orderId}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      await orderService.deleteOrder(orderId)
      await fetchOrders()
      showSuccess(`Order #${orderId} deleted`)
      // If the deleted order was open in the details modal, close it
      if (selectedOrder && selectedOrder.id === orderId) {
        setShowDetailsModal(false)
        setSelectedOrder(null)
      }
    } catch (error) {
      console.error('Failed to delete order', error)
      showError('Failed to delete order. Please try again or check the server logs.')
    }
  }

  // Side-effect: when isPrintingInvoice becomes true and selectedOrder is ready,
  // wait for the PrintInvoice component to render, then trigger the browser print.
  useEffect(() => {
    if (!isPrintingInvoice || !selectedOrder) return

    // Small helper to run print after the browser has painted the new DOM.
    const triggerPrint = () => {
      const order = selectedOrder
      const reportDate = new Date().toISOString().split("T")[0]
      document.title = `Invoice_${order.id}_${reportDate}`

      document.body.classList.add('printing')
      document.body.style.visibility = 'visible'
      document.body.style.opacity = '1'

      // Use requestAnimationFrame + small timeout to ensure rendering is complete
      requestAnimationFrame(() => {
        const t = setTimeout(() => {
          try {
            window.print()
          } finally {
            // cleanup after print dialog
            setTimeout(() => {
              setIsPrintingInvoice(false)
              document.body.classList.remove('printing')
              document.title = "PickAndPlay - Admin Dashboard"
            }, 200)
          }
          clearTimeout(t)
        }, 350)
      })
    }

    triggerPrint()

    // no cleanup necessary here other than relying on finalizers above
  }, [isPrintingInvoice, selectedOrder])

  const filteredOrders = orders.filter((order) => {
    const matchesCustomerName =
      customerNameFilter === "" ||
      (order.customerName && order.customerName.toLowerCase().includes(customerNameFilter.toLowerCase()))
    const matchesDateFrom = dateFrom === "" || new Date(order.createdAt || order.date) >= new Date(dateFrom)
    const matchesDateTo = dateTo === "" || new Date(order.createdAt || order.date) <= new Date(dateTo + "T23:59:59")
    return matchesCustomerName && matchesDateFrom && matchesDateTo
  })

  // reset to first page whenever filters or orders change
  useEffect(() => {
    setCurrentPage(1)
  }, [customerNameFilter, dateFrom, dateTo, orders])

  // Check if any filters are active
  const hasActiveFilters = customerNameFilter !== "" || dateFrom !== "" || dateTo !== ""

  // For printing: use all orders if no filters, otherwise use filtered orders
  const ordersToDisplay = isPrinting && !hasActiveFilters ? orders : filteredOrders

  const totalPages = Math.max(1, Math.ceil(ordersToDisplay.length / perPage))
  const paginatedOrders = isPrinting ? ordersToDisplay : ordersToDisplay.slice((currentPage - 1) * perPage, currentPage * perPage)

  const clearFilters = () => {
    setCustomerNameFilter("")
    setDateFrom("")
    setDateTo("")
  }

  const { totalRevenue, totalOrders, averageOrder, totalItems } = calculateOrderStats(ordersToDisplay)



  if (isLoading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Screen Content */}
      <div className={isPrinting || isPrintingInvoice ? "no-print" : ""}>
        <style>{adminStyles}</style>
        <div className="admin-header">
          <Row className="align-items-center">
            <Col>
              <h1 className="h2 mb-1 accent-text">
                <i className="bi bi-clipboard-data me-2"></i>
                Orders Management
              </h1>
              <p className="text-muted mb-0">View and manage all customer orders, generate reports, and track sales.</p>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button onClick={handlePrint} className="modern-btn" aria-label="Print orders report">
                  <i className="bi bi-printer me-2"></i>
                  Print Report
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* Report Filters Section */}
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-white border-0 py-3">
            <h5 className="mb-0 fw-bold text-dark">
              <i className="bi bi-funnel me-2"></i>
              Report Filters
            </h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Row className="g-3 align-items-end">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Customer</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by customer name"
                    value={customerNameFilter}
                    onChange={(e) => setCustomerNameFilter(e.target.value)}
                    className="border-1"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Date From</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border-1"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="fw-semibold text-dark">Date To</Form.Label>
                  <Form.Control
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border-1"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <div className="d-flex gap-2">
                  <Button
                    onClick={clearFilters}
                    className="btn-reset-filters"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Reset Filters
                  </Button>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Summary Cards Section - Cinema Style */}
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <Card.Body className="text-center py-4">
                <div className="d-flex justify-content-center mb-2">
                  <i className="bi bi-receipt fs-1" style={{ color: '#007bff' }}></i>
                </div>
                <h6 className="text-muted text-uppercase small mb-1">TOTAL ORDERS</h6>
                <h2 className="mb-0 fw-bold text-dark">{totalOrders}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <Card.Body className="text-center py-4">
                <div className="d-flex justify-content-center mb-2">
                  <i className="bi bi-currency-dollar fs-1" style={{ color: '#28a745' }}></i>
                </div>
                <h6 className="text-muted text-uppercase small mb-1">TOTAL REVENUE</h6>
                <h2 className="mb-0 fw-bold text-dark">${totalRevenue.toFixed(2)}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <Card.Body className="text-center py-4">
                <div className="d-flex justify-content-center mb-2">
                  <i className="bi bi-graph-up fs-1" style={{ color: '#17a2b8' }}></i>
                </div>
                <h6 className="text-muted text-uppercase small mb-1">AVERAGE ORDER</h6>
                <h2 className="mb-0 fw-bold text-dark">${averageOrder.toFixed(2)}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
              <Card.Body className="text-center py-4">
                <div className="d-flex justify-content-center mb-2">
                  <i className="bi bi-box-seam fs-1" style={{ color: '#fd7e14' }}></i>
                </div>
                <h6 className="text-muted text-uppercase small mb-1">TOTAL ITEMS</h6>
                <h2 className="mb-0 fw-bold text-dark">{totalItems}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Orders Table Section - Cinema Style */}
        <Card className="border-0 shadow-sm modern-card">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 py-3 text-center fw-bold text-dark">ORDER #</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">DATE</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">CUSTOMER</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">ITEMS</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">STATUS</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">AMOUNT</th>
                    <th className="border-0 py-3 text-center fw-bold text-dark">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersToDisplay.length > 0 ? (
                    paginatedOrders.map((order) => (
                      <tr
                        key={order.id}
                        style={{ borderBottom: '1px solid #dee2e6', cursor: 'pointer' }}
                        onClick={() => { setSelectedOrder(order); setShowDetailsModal(true); }}
                      >
                        <td className="text-center py-3 fw-bold" style={{ color: '#007bff' }}>#{order.id}</td>
                        <td className="text-center py-3">{formatDateForScreen(order.createdAt || order.date)}</td>
                        <td className="text-center py-3">{order.customerName || "N/A"}</td>
                        <td className="text-center py-3">
                          {(() => {
                            const totalQty = (order.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0)
                            return (
                              <Badge bg="light" text="dark" className="border">
                                {totalQty} item{totalQty !== 1 ? "s" : ""}
                              </Badge>
                            )
                          })()}
                        </td>
                        <td className="text-center py-3">
                          <Badge bg={getStatusBadge(order.status)}>
                            {order.status || "Unknown"}
                          </Badge>
                        </td>
                        <td className="text-center py-3 fw-bold">${(order.totalAmount || 0).toFixed(2)}</td>
                        <td className="text-center py-3">
                          <div className="d-inline-flex gap-2">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handlePrintInvoice(order); }}
                              aria-label={`Print invoice for order ${order.id}`}
                            >
                              <i className="bi bi-printer me-2"></i>
                              Print
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={(e) => handleDeleteOrder(order.id, e)}
                              aria-label={`Delete order ${order.id}`}
                            >
                              <i className="bi bi-trash me-2"></i>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        <i className="bi bi-inbox display-1 d-block mb-3"></i>
                        No orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
            {ordersToDisplay.length > perPage && !isPrinting && (
              <div className="p-3 bg-light border-top text-center text-muted small no-print">
                <div className="d-flex flex-column flex-md-row align-items-center justify-content-between">
                  <div className="mb-2 mb-md-0">
                    {(() => {
                      const from = (currentPage - 1) * perPage + 1
                      const to = Math.min(currentPage * perPage, ordersToDisplay.length)
                      return (
                        <span>
                          Showing <strong>{from}</strong>–<strong>{to}</strong> of <strong>{ordersToDisplay.length}</strong> orders.
                        </span>
                      )
                    })()}
                  </div>
                  <div>
                    <Pagination className="justify-content-center mb-0">
                      <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                      <Pagination.Prev onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} />
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <Pagination.Item key={i + 1} active={currentPage === i + 1} onClick={() => setCurrentPage(i + 1)}>
                          {i + 1}
                        </Pagination.Item>
                      ))}
                      <Pagination.Next onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                      <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                    </Pagination>
                  </div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Print Component */}
      {isPrinting && (
        <div className="print-only">
          <PrintOrders
            orders={orders}
            filteredOrders={filteredOrders}
            isPrinting={isPrinting}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      )}

      {/* Single Invoice Print Component */}
      {isPrintingInvoice && (
        <div className="print-only">
          <PrintInvoice order={selectedOrder} />
        </div>
      )}

      {/* Modal for order details */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <i className="bi bi-receipt me-2"></i>Order Details #{selectedOrder?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body>
                      <h6 className="text-primary mb-3">
                        <i className="bi bi-person-circle me-2"></i>Customer Information
                      </h6>
                      <p className="mb-2">
                        <strong>Name:</strong> {selectedOrder.customerName || "N/A"}
                      </p>
                      <p className="mb-2">
                        <strong>User ID:</strong> {selectedOrder.userId || "N/A"}
                      </p>
                      <p className="mb-0">
                        <strong>Shipping:</strong> {selectedOrder.shippingAddress || "N/A"}
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 bg-light h-100">
                    <Card.Body>
                      <h6 className="text-primary mb-3">
                        <i className="bi bi-info-circle me-2"></i>Order Information
                      </h6>
                      <p className="mb-2">
                        <strong>Date:</strong> {formatDateForScreen(selectedOrder.createdAt || selectedOrder.date)}
                      </p>
                      <p className="mb-2">
                        <strong>Status:</strong>{" "}
                        <Badge bg={getStatusBadge(selectedOrder.status)} pill>
                          {selectedOrder.status}
                        </Badge>
                      </p>
                      <p className="mb-2">
                        <strong>Payment:</strong>{" "}
                        {selectedOrder.paymentStatus ? (
                          <Badge bg={selectedOrder.paymentStatus === "paid" ? "success" : "warning"} pill>
                            {selectedOrder.paymentStatus}
                          </Badge>
                        ) : (
                          "N/A"
                        )}
                      </p>
                      <p className="mb-0">
                        <strong>Total:</strong>{" "}
                        <span className="text-primary fw-bold">${(selectedOrder.totalAmount || 0).toFixed(2)}</span>
                      </p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
              <h6 className="mb-3">
                <i className="bi bi-box-seam me-2"></i>Order Items
              </h6>
              {selectedOrder.items && selectedOrder.items.length > 0 ? (
                <Table bordered hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>Product ID</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>#{item.productId}</td>
                        <td>{item.quantity}</td>
                        <td>${(item.unitPrice || 0).toFixed(2)}</td>
                        <td className="fw-semibold">
                          ${(item.totalPrice || item.quantity * item.unitPrice || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="3" className="text-end">
                        <strong>Total Amount:</strong>
                      </td>
                      <td className="fw-bold text-primary">${(selectedOrder.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-2 d-block mb-2"></i>No items in this order
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          <div className="ms-auto d-flex gap-2">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => selectedOrder && handleDeleteOrder(selectedOrder.id)}
              disabled={!selectedOrder}
            >
              <i className="bi bi-trash me-2"></i>
              Delete
            </Button>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => handlePrintInvoice(selectedOrder)}
              disabled={!selectedOrder}
            >
              <i className="bi bi-printer me-2"></i>
              Print Invoice
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

    </Container>
  )
}

export default Orders;
