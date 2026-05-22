"use client";

import { useEffect, useRef } from "react";

export function useRevealOnScroll(staggerMs = 90) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!items.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const idx = Array.from(items).indexOf(el);
            setTimeout(() => el.classList.add('reveal-in'), idx * staggerMs);
            io.unobserve(el);
          }
        });
      },
      { root: container, threshold: 0.15 }
    );

    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [staggerMs]);

  return containerRef;
}
