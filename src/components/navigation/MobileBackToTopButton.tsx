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
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <path d="M12 5l7 7-1.4 1.4L13 8.8V20h-2V8.8l-4.6 4.6L5 12l7-7z" />
      </svg>
    </button>
  );
}
