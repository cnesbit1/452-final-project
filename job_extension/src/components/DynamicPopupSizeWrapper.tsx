import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type DynamicSizeWrapperProps = {
  children: React.ReactNode;
};

export default function DynamicSizeWrapper({
  children,
}: DynamicSizeWrapperProps) {
  const location = useLocation();

  useEffect(() => {
    // Set responsive body styles
    document.body.style.width = "100vw";
    document.body.style.minHeight = "100vh";
    document.body.style.maxWidth = "100vw";
    document.body.style.overflow = "auto";

    // Remove any fixed sizing
    document.body.style.removeProperty("height");
  }, [location.pathname]);

  return <div className="dynamic-wrapper">{children}</div>;
}
