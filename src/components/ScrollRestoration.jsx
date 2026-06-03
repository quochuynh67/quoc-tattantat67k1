import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollRestoration() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        sessionStorage.setItem(`scroll-${location.key}`, window.scrollY.toString());
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    };
  }, [location.key]);

  useEffect(() => {
    const scrollPos = sessionStorage.getItem(`scroll-${location.key}`);
    
    if (navType === "POP" && scrollPos) {
      const targetY = parseInt(scrollPos, 10);
      let attempts = 0;
      
      const tryScroll = () => {
        window.scrollTo(0, targetY);
        if (window.scrollY < targetY && document.documentElement.scrollHeight <= targetY + window.innerHeight && attempts < 15) {
          attempts++;
          setTimeout(tryScroll, 100);
        }
      };
      
      tryScroll();
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.key, navType]);

  return null;
}
