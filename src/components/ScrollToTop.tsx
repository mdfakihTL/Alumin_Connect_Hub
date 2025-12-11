import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  // Disable browser's automatic scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Scroll to top on pathname change - use multiple methods for browser compatibility
  useLayoutEffect(() => {
    // Method 1: window.scrollTo
    window.scrollTo(0, 0);
    
    // Method 2: Set scrollTop directly on document elements
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    
    // Method 3: Scroll the root element if it exists
    const root = document.getElementById('root');
    if (root) {
      root.scrollTop = 0;
    }
  }, [pathname]);

  // Fallback with useEffect and slight delay
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    // Immediate
    scrollToTop();
    
    // After next frame
    const raf = requestAnimationFrame(scrollToTop);
    
    // After a small delay as final fallback
    const timer = setTimeout(scrollToTop, 0);
    
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;

