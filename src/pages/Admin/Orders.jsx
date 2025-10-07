import { useState, useEffect } from 'react';
import { Container, Table, Button, Form, InputGroup, Pagination, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/api';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({
    search: '',
    status: '',
    dateRange: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  
  const ordersPerPage = 10;
  
  // Apply filters to orders
  const filteredOrders = orders.filter(order => {
    // Search filter (order ID or customer name)
    const searchMatch = 
      filter.search === '' || 
      order.id.toString().includes(filter.search) ||
      order.customerName.toLowerCase().includes(filter.search.toLowerCase());
    
    // Status filter
    const statusMatch = 
      filter.status === '' || 
      order.status.toLowerCase() === filter.status.toLowerCase();
    
    // Date range filter
    let dateMatch = true;
    if (filter.dateRange) {
      const orderDate = new Date(order.date);
      const today = new Date();
      
      switch (filter.dateRange) {
        case 'today':
          dateMatch = 
            orderDate.getDate() === today.getDate() &&
            orderDate.getMonth() === today.getMonth() &&
            orderDate.getFullYear() === today.getFullYear();
          break;
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          dateMatch = orderDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(today.getMonth() - 1);
          dateMatch = orderDate >= monthAgo;
          break;
        default:
          dateMatch = true;
      }
    }
    
    return searchMatch && statusMatch && dateMatch;
  });
  
  // Paginate orders
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getAllOrders();
        setOrders(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };
  
  const resetFilters = () => {
    setFilter({
      search: '',
      status: '',
      dateRange: '',
    });
    setCurrentPage(1);
  };
  
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  
  const getStatusBadge = (status) => {
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
  };

  return (
    <Container fluid className="py-4">
      <h1 className="mb-4">Order Management</h1>
      
      {/* Filters */}
      <div className="mb-4 p-3 border rounded bg-light">
        <div className="row g-3">
          <div className="col-md-4">
            <InputGroup>
              <InputGroup.Text>Search</InputGroup.Text>
              <Form.Control
                placeholder="Order ID or customer name..."
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
              />
            </InputGroup>
          </div>
          
          <div className="col-md-3">
            <InputGroup>
              <InputGroup.Text>Status</InputGroup.Text>
              <Form.Select 
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </InputGroup>
          </div>
          
          <div className="col-md-3">
            <InputGroup>
              <InputGroup.Text>Period</InputGroup.Text>
              <Form.Select
                name="dateRange"
                value={filter.dateRange}
                onChange={handleFilterChange}
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </Form.Select>
            </InputGroup>
          </div>
          
          <div className="col-md-2">
            <Button 
              variant="secondary" 
              onClick={resetFilters}
              className="w-100"
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-5">
          <p>Loading orders...</p>
        </div>
      ) : (
        <>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentOrders.length > 0 ? (
                currentOrders.map(order => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{new Date(order.date).toLocaleDateString()}</td>
                    <td>{order.customerName}</td>
                    <td>${order.totalAmount.toFixed(2)}</td>
                    <td>
                      <Badge bg={getStatusBadge(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td>
                      <Button 
                        as={Link} 
                        to={`/admin/orders/${order.id}`} 
                        variant="outline-primary" 
                        size="sm"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          
          {/* Order summary */}
          <div className="mb-4">
            <p className="mb-0">
              Showing {filteredOrders.length} of {orders.length} orders
            </p>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={currentPage === 1}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(currentPage - 1)} 
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  // Show current page and 2 pages before and after
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <Pagination.Item
                        key={pageNumber}
                        active={pageNumber === currentPage}
                        onClick={() => handlePageChange(pageNumber)}
                      >
                        {pageNumber}
                      </Pagination.Item>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return <Pagination.Ellipsis key={pageNumber} />;
                  }
                  return null;
                })}
                
                <Pagination.Next 
                  onClick={() => handlePageChange(currentPage + 1)} 
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default Orders;