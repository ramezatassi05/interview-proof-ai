'use client';

import { useEffect, useRef, useState } from 'react';

export function useStickyHeader<T extends HTMLElement = HTMLDivElement>() {
  const sentinelRef = useRef<T>(null);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, isSticky };
}
