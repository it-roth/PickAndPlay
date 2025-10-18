import React, { useEffect, useState, useRef } from 'react';
import '../assets/styles/ProductCard.css';

export default function GlobalToast() {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const duration = typeof detail?.timer === 'number' ? detail.timer : 1500;
      const type = detail?.icon || detail?.type || 'success';

      setToast({
        image: detail.image,
        title: detail.title || 'Added to cart',
        sub: detail.sub || '',
        type,
        duration
      });

      // clear any previous timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, duration);
    };

    window.addEventListener('globalAddToCart', handler);
    return () => {
      window.removeEventListener('globalAddToCart', handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className={`toast-compact toast-${toast.type}`} role="status" aria-live="polite">
      <div className="toast-compact-icon" aria-hidden>
        {toast.type === 'success' ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#fff'}}>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{color:'#fff'}}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
        )}
      </div>

      <div className="toast-compact-body">
        <strong>{toast.title}</strong>
        {toast.sub ? <div className="toast-compact-sub">{toast.sub}</div> : null}
      </div>

      <div className="toast-compact-progress" style={{animationDuration: `${toast.duration}ms`}} aria-hidden />
    </div>
  );
}
