import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Card, Button } from 'react-bootstrap';
import '../assets/styles/Home.css';

export default function OrderConfirmation() {
  const [order, setOrder] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const orderData = location.state?.order;
    if (orderData) {
      setOrder(orderData);
    }
  }, [location]);

  const handleContinueShopping = () => {
    navigate('/shop');
  };

  return (
    <Container className="py-5">
      <Card className="p-4">
        <Card.Body className="text-center">
          <h2 className="mb-4">Order Confirmed</h2>
          <p className="text-success mb-4">
            <i className="bi bi-check-circle-fill"></i> Thank you for your purchase!
          </p>
          
          {order && (
            <div className="text-start mb-4">
              <h5 className="mb-3">Order Details</h5>
              <p><strong>Order ID:</strong> #{order.id}</p>
              <p><strong>Payment Method:</strong> {order.paymentMethod === 'khqr' ? 'KHQR Payment' : 'Credit Card'}</p>
              <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
              {order.paymentMethod === 'khqr' && order.transactionId && (
                <p><strong>Transaction ID:</strong> {order.transactionId}</p>
              )}
            </div>
          )}

          <p className="text-muted mb-4">
            A confirmation email has been sent to your email address.
          </p>

          <div className="d-grid gap-2">
            <Button variant="primary" onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
