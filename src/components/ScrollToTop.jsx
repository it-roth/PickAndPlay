import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Compute header height (if fixed) so anchors don't hide under it
    const header = document.querySelector('.navbar-wrapper') || document.querySelector('.main-navbar');
    const headerHeight = header ? header.getBoundingClientRect().height : 0;

    const scrollToTop = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      } catch {
        window.scrollTo(0, 0);
      }
    };

    const maxAttempts = 8;
    const delay = 100; // ms between attempts
    const timers = [];

    if (hash) {
      // Try multiple times to find the anchor element in case it renders asynchronously
      const tryScroll = (attempt = 0) => {
        const el = document.querySelector(hash);
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - 8; // small gap
          try {
            window.scrollTo({ top: Math.max(0, top), left: 0, behavior: 'smooth' });
          } catch {
            window.scrollTo(Math.max(0, top), 0);
          }
          return;
        }

        if (attempt < maxAttempts) {
          const t = setTimeout(() => tryScroll(attempt + 1), delay);
          timers.push(t);
        } else {
          // Give up and scroll to top as a fallback
          scrollToTop();
        }
      };

      // Small initial delay to give the route a chance to render
      const firstTimer = setTimeout(() => tryScroll(0), 60);
      timers.push(firstTimer);
    } else {
      // Normal route change: scroll to top of page
      scrollToTop();
    }

    return () => {
      // clear any pending timers on cleanup
      timers.forEach(t => clearTimeout(t));
    };
  }, [pathname, hash]);

  return null;
}
