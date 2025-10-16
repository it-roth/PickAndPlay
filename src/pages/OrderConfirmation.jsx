import React from 'react';
import '../assets/styles/Home.css';

// Simple stub page for order confirmation
export default function OrderConfirmation() {
  return (
    <div className="container my-5">
      <div className="card p-4 text-center">
        <h2>Order Confirmed</h2>
        <p className="text-muted">Thank you for your purchase. Your order has been received.</p>
        <div className="mt-3">
          <a className="btn btn-primary" href="/">Continue Shopping</a>
        </div>
      </div>
    </div>
  );
}
