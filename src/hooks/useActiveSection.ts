'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export function useActiveSection(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0] || '');
  const idsRef = useRef(sectionIds);
  idsRef.current = sectionIds;

  const update = useCallback(() => {
    const ids = idsRef.current;
    // Pick the last section whose top has scrolled past the trigger line (120px from top)
    const triggerY = 120;
    let current = ids[0] || '';

    for (const id of ids) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= triggerY) {
        current = id;
      } else {
        break;
      }
    }

    setActiveId(current);
  }, []);

  useEffect(() => {
    // Run once on mount
    update();

    // Use a scroll listener with passive flag for perf
    const scrollContainer = document.querySelector('main') || window;
    const onScroll = () => {
      requestAnimationFrame(update);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      window.removeEventListener('scroll', onScroll);
    };
  }, [update]);

  return activeId;
}
