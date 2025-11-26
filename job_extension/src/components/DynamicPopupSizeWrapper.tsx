import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type DynamicSizeWrapperProps = {
  children: React.ReactNode;
};

export default function DynamicSizeWrapper({ children }: DynamicSizeWrapperProps) {
  const location = useLocation();
  
  useEffect(() => {
    // Set body size based on route
    const path = location.pathname;
    
    if (path === '/Tools' || path.includes('view')) {
      // List page needs to be wider
      document.body.style.width = '1200px';
      document.body.style.minHeight = '750px';
    } else if (path === '/Login' || path === '/Register') {
      // Auth pages can be smaller
      document.body.style.width = '550px';
      document.body.style.minHeight = '650px';
    } else {
      // Default size
      document.body.style.width = '1000px';
      document.body.style.minHeight = '650px';
    }
  }, [location.pathname]);
  
  return <>{children}</>;
}