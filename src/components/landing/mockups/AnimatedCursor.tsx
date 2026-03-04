'use client';

import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';

export interface CursorWaypoint {
  /** X position as % of container width */
  x: number;
  /** Y position as % of container height */
  y: number;
  /** Delay in ms from scene start to begin moving */
  delay: number;
  /** Duration in ms for the cursor travel */
  duration: number;
  /** Fire a click animation on arrival */
  action?: 'click';
}

interface AnimatedCursorProps {
  waypoints: CursorWaypoint[];
  playing: boolean;
  sceneIndex: number;
  transitioning: boolean;
}

function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServer() {
  return false;
}

export function AnimatedCursor({ waypoints, playing, sceneIndex, transitioning }: AnimatedCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const ripplesRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rippleId = useRef(0);

  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getReducedMotionServer,
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  // Sync transitioning opacity via ref
  useEffect(() => {
    if (cursorRef.current) {
      cursorRef.current.style.opacity = transitioning ? '0' : '1';
    }
  }, [transitioning]);

  // Schedule waypoint chain via direct DOM manipulation
  useEffect(() => {
    clearTimers();
    const cursor = cursorRef.current;
    const svg = svgRef.current;
    const ripplesContainer = ripplesRef.current;
    if (!cursor || !svg || !ripplesContainer || !playing || !waypoints.length || prefersReducedMotion)
      return;

    // Teleport to first waypoint — no position transition
    cursor.style.transition = 'opacity 250ms ease';
    cursor.style.left = `${waypoints[0].x}%`;
    cursor.style.top = `${waypoints[0].y}%`;
    svg.style.transform = 'scale(1)';
    ripplesContainer.innerHTML = '';

    // Schedule remaining waypoints
    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i];

      // Move
      const moveTimer = setTimeout(() => {
        const trans =
          wp.duration > 0
            ? `left ${wp.duration}ms cubic-bezier(0.4,0,0.2,1), top ${wp.duration}ms cubic-bezier(0.4,0,0.2,1), opacity 250ms ease`
            : 'opacity 250ms ease';
        cursor.style.transition = trans;
        cursor.style.left = `${wp.x}%`;
        cursor.style.top = `${wp.y}%`;
      }, wp.delay);
      timersRef.current.push(moveTimer);

      // Click animation on arrival
      if (wp.action === 'click') {
        const clickTimer = setTimeout(() => {
          // Scale bounce
          svg.style.transform = 'scale(0.82)';
          const unclick = setTimeout(() => {
            svg.style.transform = 'scale(1)';
          }, 150);
          timersRef.current.push(unclick);

          // Ripple
          rippleId.current += 1;
          const ripple = document.createElement('div');
          ripple.className = 'absolute pointer-events-none';
          ripple.style.cssText = `z-index:30;left:${wp.x}%;top:${wp.y}%;transform:translate(-50%,-50%)`;

          const circle = document.createElement('div');
          circle.style.cssText =
            'width:40px;height:40px;border-radius:50%;border:2px solid var(--accent-primary);animation:cursor-ripple 0.6s ease-out forwards';
          ripple.appendChild(circle);
          ripplesContainer.appendChild(ripple);

          const cleanRipple = setTimeout(() => ripple.remove(), 700);
          timersRef.current.push(cleanRipple);
        }, wp.delay + wp.duration);
        timersRef.current.push(clickTimer);
      }
    }

    return clearTimers;
  }, [sceneIndex, playing, waypoints, clearTimers, prefersReducedMotion]);

  if (prefersReducedMotion) return null;

  return (
    <>
      {/* Cursor */}
      <div
        ref={cursorRef}
        className="absolute z-30 pointer-events-none hidden md:block"
        style={{
          left: `${waypoints[0]?.x ?? 50}%`,
          top: `${waypoints[0]?.y ?? 50}%`,
          transition: 'opacity 250ms ease',
        }}
      >
        <svg
          ref={svgRef}
          width="20"
          height="24"
          viewBox="0 0 20 24"
          fill="none"
          style={{
            transition: 'transform 0.1s ease',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
          }}
        >
          <path
            d="M3 1L3 17L7 13L11.5 20L13.5 19L9 12L15 12Z"
            fill="#111827"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Ripple container */}
      <div ref={ripplesRef} className="hidden md:contents" />
    </>
  );
}
