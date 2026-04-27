import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const snapToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };

    snapToTop();
    const rafId = window.requestAnimationFrame(snapToTop);

    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [pathname, search]);
};

export const ScrollToTopOnRouteChange = () => {
  useScrollToTop();
  return null;
};

export default useScrollToTop;