import React, { useEffect, useState } from 'react';

export default function BackToTop() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => {
            const y = window.pageYOffset || document.documentElement.scrollTop;
            setVisible(y > 200);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollToTop = () => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        } catch {
            window.scrollTo(0, 0);
        }
    };

    if (!visible) return null;

    return (
        <button
            aria-label="Back to top"
            onClick={scrollToTop}
            title="Back to top"
            style={{
                position: 'fixed',
                right: 20,
                bottom: 20,
                zIndex: 1100,
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg,#ff6600 0%,#ff8533 100%)',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                cursor: 'pointer',
                transition: 'transform 160ms ease, box-shadow 160ms ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
            <i className="bi bi-arrow-up-short" style={{ fontSize: '1.6rem', lineHeight: 1 }}></i>
        </button>
    );
}
