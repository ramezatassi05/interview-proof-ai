'use client';

import { useEffect, useRef } from 'react';

interface TourSpotlightProps {
  targetSelector: string | null;
}

const SPOTLIGHT_CLASS = 'tour-spotlight-active';

export function TourSpotlight({ targetSelector }: TourSpotlightProps) {
  const prevElementRef = useRef<Element | null>(null);

  useEffect(() => {
    // Clean up previous target
    if (prevElementRef.current) {
      prevElementRef.current.classList.remove(SPOTLIGHT_CLASS);
      prevElementRef.current = null;
    }

    if (!targetSelector) return;

    const target = document.querySelector(targetSelector);
    if (!target) return;

    target.classList.add(SPOTLIGHT_CLASS);
    prevElementRef.current = target;

    // Scroll target into view if not visible
    const rect = target.getBoundingClientRect();
    const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight + 100;

    if (!isVisible) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return () => {
      target.classList.remove(SPOTLIGHT_CLASS);
    };
  }, [targetSelector]);

  return null;
}
