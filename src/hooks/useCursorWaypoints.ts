'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import type { CursorWaypoint } from '@/components/landing/mockups/AnimatedCursor';

/**
 * Target names corresponding to data-cursor-target attributes in FlowPages.tsx.
 */
type TargetName = 'cta' | 'tab-risks' | 'tab-questions';

interface MeasuredPosition {
  /** Center X as % of container width */
  x: number;
  /** Center Y as % of container height */
  y: number;
}

type MeasurementCache = Partial<Record<TargetName, MeasuredPosition>>;

/** Hardcoded fallback waypoints — same as the original FLOW_WAYPOINTS. */
const FALLBACK_WAYPOINTS: CursorWaypoint[] = [
  { x: 50, y: 40, delay: 0, duration: 0 },
  { x: 50, y: 82, delay: 300, duration: 400, action: 'click' },
  { x: 58, y: 45, delay: 1500, duration: 500 },
  { x: 55, y: 55, delay: 2800, duration: 1000 },
  { x: 50, y: 30, delay: 4500, duration: 400 },
  { x: 45, y: 55, delay: 5200, duration: 600 },
  { x: 46, y: 60, delay: 6000, duration: 400 },
  { x: 47, y: 66, delay: 6500, duration: 400 },
  { x: 40, y: 30, delay: 7000, duration: 400, action: 'click' },
  { x: 50, y: 50, delay: 7800, duration: 500 },
  { x: 50, y: 60, delay: 8800, duration: 400 },
  { x: 58, y: 30, delay: 10000, duration: 400, action: 'click' },
  { x: 50, y: 55, delay: 11000, duration: 600 },
  { x: 50, y: 75, delay: 12500, duration: 700 },
  { x: 50, y: 50, delay: 14200, duration: 500 },
];

/**
 * Measure the center of a target element as a percentage of the container.
 */
function measureTarget(
  container: HTMLElement,
  targetName: TargetName,
): MeasuredPosition | null {
  const el = container.querySelector<HTMLElement>(`[data-cursor-target="${targetName}"]`);
  if (!el) return null;

  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  if (containerRect.width === 0 || containerRect.height === 0) return null;

  const x = ((elRect.left + elRect.width / 2 - containerRect.left) / containerRect.width) * 100;
  const y = ((elRect.top + elRect.height / 2 - containerRect.top) / containerRect.height) * 100;

  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

/**
 * Build the full waypoints array from measured positions.
 */
function buildWaypoints(m: Required<Record<TargetName, MeasuredPosition>>): CursorWaypoint[] {
  const cta = m['cta'];
  const tabRisks = m['tab-risks'];
  const tabQuestions = m['tab-questions'];

  // Content area is roughly 25% below the tab bar
  const contentY = Math.min(tabRisks.y + 25, 90);
  const contentMidY = Math.min(tabRisks.y + 30, 92);
  const contentLowY = Math.min(tabRisks.y + 38, 95);

  return [
    // Upload: start above CTA, then click it
    { x: cta.x, y: Math.max(cta.y - 30, 10), delay: 0, duration: 0 },
    { x: cta.x, y: cta.y, delay: 300, duration: 400, action: 'click' },

    // Analysis: idle watching progress
    { x: cta.x + 8, y: cta.y - 25, delay: 1500, duration: 500 },
    { x: cta.x + 5, y: cta.y - 15, delay: 2800, duration: 1000 },

    // Report — Score tab: hover dimension bars
    { x: cta.x, y: tabRisks.y, delay: 4500, duration: 400 },
    { x: cta.x - 5, y: contentY, delay: 5200, duration: 600 },
    { x: cta.x - 4, y: contentMidY, delay: 6000, duration: 400 },
    { x: cta.x - 3, y: contentLowY, delay: 6500, duration: 400 },

    // Report — Red Flags tab: click tab, hover risk cards
    { x: tabRisks.x, y: tabRisks.y, delay: 7000, duration: 400, action: 'click' },
    { x: cta.x, y: contentY, delay: 7800, duration: 500 },
    { x: cta.x, y: contentMidY, delay: 8800, duration: 400 },

    // Report — Questions tab: click tab, hover content
    { x: tabQuestions.x, y: tabQuestions.y, delay: 10000, duration: 400, action: 'click' },
    { x: cta.x, y: contentY, delay: 11000, duration: 600 },
    { x: cta.x, y: contentLowY, delay: 12500, duration: 700 },

    // Hold: drift to center
    { x: 50, y: 50, delay: 14200, duration: 500 },
  ];
}

/**
 * Shallow-compare two waypoint arrays to avoid unnecessary re-renders.
 */
function waypointsEqual(a: CursorWaypoint[], b: CursorWaypoint[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].x !== b[i].x || a[i].y !== b[i].y) return false;
  }
  return true;
}

/**
 * Hook that dynamically measures cursor click targets and builds waypoints.
 *
 * Uses MutationObserver to detect when target elements mount (they change
 * across flow phases) and ResizeObserver for responsive re-measurement.
 * Falls back to hardcoded waypoints until all 3 targets have been measured.
 */
export function useCursorWaypoints(
  containerRef: RefObject<HTMLDivElement | null>,
  flowKey: number,
): CursorWaypoint[] {
  const cacheRef = useRef<MeasurementCache>({});
  const [waypoints, setWaypoints] = useState<CursorWaypoint[]>(FALLBACK_WAYPOINTS);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ALL_TARGETS: TargetName[] = ['cta', 'tab-risks', 'tab-questions'];

    function measureAll() {
      const container = containerRef.current;
      if (!container) return;

      let changed = false;
      for (const name of ALL_TARGETS) {
        const pos = measureTarget(container, name);
        if (pos) {
          const prev = cacheRef.current[name];
          if (!prev || prev.x !== pos.x || prev.y !== pos.y) {
            cacheRef.current[name] = pos;
            changed = true;
          }
        }
      }

      if (!changed) return;

      // Check if we have all 3 measurements
      const cache = cacheRef.current;
      if (cache['cta'] && cache['tab-risks'] && cache['tab-questions']) {
        const newWaypoints = buildWaypoints(
          cache as Required<Record<TargetName, MeasuredPosition>>,
        );
        setWaypoints((prev) => (waypointsEqual(prev, newWaypoints) ? prev : newWaypoints));
      }
    }

    // Initial measurement
    measureAll();

    // Watch for DOM changes (elements mount/unmount across phases)
    const mutationObserver = new MutationObserver(() => {
      measureAll();
    });
    mutationObserver.observe(container, { childList: true, subtree: true });

    // Watch for resize
    const resizeObserver = new ResizeObserver(() => {
      measureAll();
    });
    resizeObserver.observe(container);

    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [containerRef, flowKey]);

  return waypoints;
}
