"use client";

import { useEffect, useState } from "react";

export function MobileBackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      aria-label="Back to top"
      className="bloodwick-back-to-top"
      onClick={handleClick}
      type="button"
    >
      <span aria-hidden="true" className="bloodwick-back-to-top__icon">
        ↑
      </span>
    </button>
  );
}
