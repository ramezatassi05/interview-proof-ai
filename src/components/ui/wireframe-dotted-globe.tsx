'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// ── Types ──

interface CityMarker {
  name: string;
  lat: number;
  lng: number;
}

interface WireframeDottedGlobeProps {
  /** ISO alpha-2 country codes to highlight */
  selectedCountries?: string[];
  /** City pins to render on the globe */
  cityMarkers?: CityMarker[];
  /** [lat, lng] to rotate to — null = auto-rotate */
  focusTarget?: [number, number] | null;
  width?: number;
  height?: number;
  className?: string;
}

// ── GeoJSON URL (countries with ISO codes) ──

const COUNTRIES_GEOJSON_URL =
  'https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/cultural/ne_110m_admin_0_countries.json';

// ── Color palette (light-mode, InterviewProof onboarding) ──

const COLORS = {
  ocean: '#F8F9FA',
  oceanStroke: '#E2E4E9',
  landOutline: '#C4C7CF',
  graticuleLine: 'rgba(0, 0, 0, 0.06)',
  dot: '#B0B3BC',
  highlightFill: 'rgba(234, 88, 12, 0.18)',
  highlightStroke: 'rgba(234, 88, 12, 0.6)',
  pinFill: '#EA580C',
  pinGlow: 'rgba(234, 88, 12, 0.4)',
  pinStroke: '#FFFFFF',
};

// ── Helpers ──

function pointInPolygon(point: [number, number], polygon: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pointInFeature(point: [number, number], feature: any): boolean {
  const geometry = feature.geometry;
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates;
    if (!pointInPolygon(point, coords[0])) return false;
    for (let i = 1; i < coords.length; i++) {
      if (pointInPolygon(point, coords[i])) return false;
    }
    return true;
  } else if (geometry.type === 'MultiPolygon') {
    for (const polygon of geometry.coordinates) {
      if (pointInPolygon(point, polygon[0])) {
        let inHole = false;
        for (let i = 1; i < polygon.length; i++) {
          if (pointInPolygon(point, polygon[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
    return false;
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateDotsForFeature(feature: any, dotSpacing = 20): [number, number][] {
  const dots: [number, number][] = [];
  const bounds = d3.geoBounds(feature);
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const stepSize = dotSpacing * 0.08;
  for (let lng = minLng; lng <= maxLng; lng += stepSize) {
    for (let lat = minLat; lat <= maxLat; lat += stepSize) {
      const pt: [number, number] = [lng, lat];
      if (pointInFeature(pt, feature)) {
        dots.push(pt);
      }
    }
  }
  return dots;
}

/** Map ISO_A2 / ISO_A2_EH / POSTAL from GeoJSON properties to our ISO codes */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getIsoCode(properties: any): string | null {
  return properties?.ISO_A2_EH || properties?.ISO_A2 || properties?.POSTAL || null;
}

// ── Component ──

export default function WireframeDottedGlobe({
  selectedCountries = [],
  cityMarkers = [],
  focusTarget = null,
  width = 400,
  height = 400,
  className = '',
}: WireframeDottedGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<{ stop: () => void } | null>(null);

  // Store mutable state in refs to avoid re-creating the entire effect
  const selectedRef = useRef(selectedCountries);
  selectedRef.current = selectedCountries;
  const markersRef = useRef(cityMarkers);
  markersRef.current = cityMarkers;
  const focusRef = useRef(focusTarget);
  focusRef.current = focusTarget;

  const initGlobe = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Responsive sizing
    const containerWidth = Math.min(width, window.innerWidth - 40);
    const containerHeight = Math.min(height, window.innerHeight - 100);
    const radius = Math.min(containerWidth, containerHeight) / 2.3;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const cx = containerWidth / 2;
    const cy = containerHeight / 2;

    // Projection
    const projection = d3.geoOrthographic().scale(radius).translate([cx, cy]).clipAngle(90);

    const path = d3.geoPath().projection(projection).context(context);

    // State
    interface DotData {
      lng: number;
      lat: number;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      feature: any;
    }

    const allDots: DotData[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let countryFeatures: any = null;
    const rotation: [number, number] = [0, 0];
    let autoRotate = true;
    let focusAnimating = false;
    const rotationSpeed = 0.3;

    // Focus animation state
    let focusStartRotation: [number, number] | null = null;
    let focusEndRotation: [number, number] | null = null;
    let focusProgress = 0;
    let lastFocusTarget: [number, number] | null = null;

    // ── Render ──

    const render = () => {
      context.clearRect(0, 0, containerWidth, containerHeight);

      // Ocean background
      context.beginPath();
      context.arc(cx, cy, projection.scale(), 0, 2 * Math.PI);
      context.fillStyle = COLORS.ocean;
      context.fill();
      context.strokeStyle = COLORS.oceanStroke;
      context.lineWidth = 1.5;
      context.stroke();

      if (!countryFeatures) return;

      const selected = selectedRef.current;
      const markers = markersRef.current;

      // Graticule
      const graticule = d3.geoGraticule();
      context.beginPath();
      path(graticule());
      context.strokeStyle = COLORS.graticuleLine;
      context.lineWidth = 0.5;
      context.stroke();

      // Draw each country
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      countryFeatures.features.forEach((feature: any) => {
        const isoCode = getIsoCode(feature.properties);
        const isHighlighted = isoCode ? selected.includes(isoCode) : false;

        context.beginPath();
        path(feature);

        if (isHighlighted) {
          // Fill highlighted countries
          context.fillStyle = COLORS.highlightFill;
          context.fill();
          context.strokeStyle = COLORS.highlightStroke;
          context.lineWidth = 1.5;
          context.stroke();
        } else {
          // Outline only for non-highlighted
          context.strokeStyle = COLORS.landOutline;
          context.lineWidth = 0.6;
          context.stroke();
        }
      });

      // Halftone dots (non-highlighted countries only)
      allDots.forEach((dot) => {
        const isoCode = getIsoCode(dot.feature.properties);
        const isHighlighted = isoCode ? selected.includes(isoCode) : false;
        if (isHighlighted) return; // Skip dots for highlighted countries

        const projected = projection([dot.lng, dot.lat]);
        if (
          projected &&
          projected[0] >= 0 &&
          projected[0] <= containerWidth &&
          projected[1] >= 0 &&
          projected[1] <= containerHeight
        ) {
          context.beginPath();
          context.arc(projected[0], projected[1], 0.9, 0, 2 * Math.PI);
          context.fillStyle = COLORS.dot;
          context.fill();
        }
      });

      // City pins
      markers.forEach((marker) => {
        const coords: [number, number] = [marker.lng, marker.lat];
        // Check if point is on the visible side of the globe
        const dist = d3.geoDistance(coords, projection.invert!([cx, cy]) as [number, number]);
        if (dist > Math.PI / 2) return; // On the back side

        const projected = projection(coords);
        if (!projected) return;
        const [px, py] = projected;

        // Glow
        context.beginPath();
        context.arc(px, py, 6, 0, 2 * Math.PI);
        context.fillStyle = COLORS.pinGlow;
        context.fill();

        // Pin circle
        context.beginPath();
        context.arc(px, py, 3.5, 0, 2 * Math.PI);
        context.fillStyle = COLORS.pinFill;
        context.fill();
        context.strokeStyle = COLORS.pinStroke;
        context.lineWidth = 1.5;
        context.stroke();
      });
    };

    // ── Data loading ──

    const loadData = async () => {
      try {
        const response = await fetch(COUNTRIES_GEOJSON_URL);
        if (!response.ok) throw new Error('Failed to load country data');
        countryFeatures = await response.json();

        // Generate dots for all country features
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        countryFeatures.features.forEach((feature: any) => {
          const dots = generateDotsForFeature(feature, 20);
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat, feature });
          });
        });

        render();
      } catch {
        // Silently fail — globe is decorative
      }
    };

    // ── Animation loop ──

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const tick = () => {
      const currentFocus = focusRef.current;

      // Check if focus target changed
      if (
        currentFocus &&
        (!lastFocusTarget ||
          currentFocus[0] !== lastFocusTarget[0] ||
          currentFocus[1] !== lastFocusTarget[1])
      ) {
        // Start focus animation
        lastFocusTarget = currentFocus;
        focusStartRotation = [...rotation] as [number, number];
        // Convert lat/lng to rotation: rotate = [-lng, -lat]
        focusEndRotation = [-currentFocus[1], -currentFocus[0]];
        focusProgress = 0;
        focusAnimating = true;
        autoRotate = false;
      } else if (!currentFocus && lastFocusTarget) {
        // Focus cleared — resume auto-rotation
        lastFocusTarget = null;
        focusAnimating = false;
        autoRotate = true;
      }

      if (focusAnimating && focusStartRotation && focusEndRotation) {
        focusProgress = Math.min(focusProgress + 0.015, 1);
        const t = easeInOutCubic(focusProgress);

        rotation[0] = focusStartRotation[0] + (focusEndRotation[0] - focusStartRotation[0]) * t;
        rotation[1] = focusStartRotation[1] + (focusEndRotation[1] - focusStartRotation[1]) * t;
        projection.rotate(rotation);
        render();

        if (focusProgress >= 1) {
          focusAnimating = false;
        }
      } else if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
        render();
      } else {
        // Render even when idle (selections may have changed)
        render();
      }
    };

    const timer = d3.timer(tick);

    // ── Drag interaction ──

    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false;
      focusAnimating = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation: [number, number] = [...rotation];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.4;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = startRotation[1] - dy * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
        projection.rotate(rotation);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Resume auto-rotate only if no focus target
        if (!focusRef.current) {
          setTimeout(() => {
            autoRotate = true;
          }, 50);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    // ── Touch support ──

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      autoRotate = false;
      focusAnimating = false;
      const touch = event.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      const startRotation: [number, number] = [...rotation];

      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (moveEvent.touches.length !== 1) return;
        const t = moveEvent.touches[0];
        const sensitivity = 0.4;
        const dx = t.clientX - startX;
        const dy = t.clientY - startY;
        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = startRotation[1] - dy * sensitivity;
        rotation[1] = Math.max(-90, Math.min(90, rotation[1]));
        projection.rotate(rotation);
        render();
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
        if (!focusRef.current) {
          setTimeout(() => {
            autoRotate = true;
          }, 50);
        }
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });

    loadData();

    // Store cleanup ref
    animationRef.current = {
      stop: () => {
        timer.stop();
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('touchstart', handleTouchStart);
      },
    };

    return () => {
      timer.stop();
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [width, height]);

  useEffect(() => {
    const cleanup = initGlobe();
    return () => {
      cleanup?.();
      animationRef.current?.stop();
    };
  }, [initGlobe]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
