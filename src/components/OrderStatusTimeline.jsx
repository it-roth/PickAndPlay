import React from 'react';
import { Badge } from 'react-bootstrap';

const OrderStatusTimeline = ({ order }) => {
    const formatDate = (dateStr) => {
        if (!dateStr) return null;
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const getStatusSteps = (currentStatus, createdAt, updatedAt) => {
        const status = currentStatus?.toLowerCase() || 'pending';

        const steps = [
            {
                id: 'ordered',
                title: 'Order Placed',
                description: 'Your order has been received and is being processed',
                icon: 'bi-cart-check',
                completed: true,
                timestamp: formatDate(createdAt)
            },
            {
                id: 'paid',
                title: 'Payment Confirmed',
                description: 'Payment has been successfully processed',
                icon: 'bi-credit-card-fill',
                completed: ['paid', 'processing', 'shipped', 'completed', 'delivered'].includes(status),
                timestamp: status !== 'pending' ? formatDate(updatedAt || createdAt) : null
            },
            {
                id: 'processing',
                title: 'Processing',
                description: 'Your order is being prepared for shipment',
                icon: 'bi-gear-fill',
                completed: ['processing', 'shipped', 'completed', 'delivered'].includes(status),
                timestamp: status === 'processing' ? formatDate(updatedAt) : null,
                current: status === 'processing'
            },
            {
                id: 'shipped',
                title: 'Shipped',
                description: 'Your order is on its way to you',
                icon: 'bi-truck',
                completed: ['shipped', 'delivered'].includes(status),
                timestamp: status === 'shipped' ? formatDate(updatedAt) : null,
                current: status === 'shipped'
            },
            {
                id: 'delivered',
                title: 'Delivered',
                description: 'Your order has been successfully delivered',
                icon: 'bi-house-check-fill',
                completed: ['completed', 'delivered'].includes(status),
                timestamp: ['completed', 'delivered'].includes(status) ? formatDate(updatedAt) : null,
                current: ['completed', 'delivered'].includes(status)
            }
        ];

        return steps;
    };

    const steps = getStatusSteps(order?.status, order?.createdAt, order?.updatedAt);

    return (
        <div className="order-timeline">
            <div className="timeline-container">
                {steps.map((step, index) => (
                    <div key={step.id} className="timeline-step d-flex align-items-start mb-4">
                        <div className="timeline-icon-container me-3 text-center">
                            <div
                                className={`timeline-icon d-flex align-items-center justify-content-center rounded-circle ${step.completed
                                    ? 'bg-success text-white'
                                    : step.current
                                        ? 'bg-primary text-white'
                                        : 'bg-light text-muted'
                                    }`}
                                style={{ width: '40px', height: '40px', fontSize: '1.1rem' }}
                            >
                                <i className={step.icon}></i>
                            </div>
                            {index < steps.length - 1 && (
                                <div
                                    className={`timeline-line mt-2 ${steps[index + 1].completed ? 'bg-success' : 'bg-light'
                                        }`}
                                    style={{ width: '2px', height: '40px', margin: '0 auto' }}
                                ></div>
                            )}
                        </div>
                        <div className="timeline-content flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 className={`mb-1 ${step.completed ? 'text-success' : step.current ? 'text-primary' : 'text-muted'}`}>
                                        {step.title}
                                        {step.current && (
                                            <Badge bg="light" className="ms-2 small text-black">Current</Badge>
                                        )}
                                    </h6>
                                    <p className="text-muted small mb-0">{step.description}</p>
                                </div>
                                {step.timestamp && (
                                    <small className="text-muted">{step.timestamp}</small>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
        .timeline-container {
          position: relative;
        }
        
        .timeline-step {
          position: relative;
        }
        
        .timeline-icon {
          position: relative;
          z-index: 2;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .timeline-line {
          position: relative;
          z-index: 1;
        }
        
        @media (max-width: 576px) {
          .timeline-step {
            margin-bottom: 1.5rem;
          }
          
          .timeline-icon-container {
            margin-right: 0.75rem;
          }
          
          .timeline-icon {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }
          
          .timeline-line {
            height: 30px;
          }
        }
      `}</style>
        </div>
    );
};

export default OrderStatusTimeline;