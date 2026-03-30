'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';

export interface OrbitalNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  color?: string;
  ring?: 'inner' | 'outer';
  badge?: React.ReactNode;
  previewContent?: React.ReactNode;
  energyLevel?: number;
  relatedIds?: string[];
}

interface RadialOrbitalTimelineProps {
  nodes: OrbitalNode[];
  centerContent?: React.ReactNode;
  /** Single-ring radius (backward compat) */
  radius?: number;
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
  onNavigate?: (href: string) => void;
}

export default function RadialOrbitalTimeline({
  nodes,
  centerContent,
  radius,
  innerRadius: innerRadiusProp = 160,
  outerRadius: outerRadiusProp = 250,
  className,
  onNavigate,
}: RadialOrbitalTimelineProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [hovered, setHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Backward compat: if `radius` is provided, use single-ring mode
  const singleRing = radius !== undefined;
  const innerRadius = radius ?? innerRadiusProp;
  const outerRadius = singleRing ? innerRadius : outerRadiusProp;

  const innerNodes = useMemo(
    () => (singleRing ? nodes : nodes.filter((n) => n.ring !== 'outer')),
    [singleRing, nodes]
  );
  const outerNodes = useMemo(
    () => (singleRing ? [] : nodes.filter((n) => n.ring === 'outer')),
    [singleRing, nodes]
  );

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || hovered) return;

    const timer = setInterval(() => {
      setRotationAngle((prev) => {
        const next = (prev + 0.2) % 360;
        return Number(next.toFixed(3));
      });
    }, 50);

    return () => clearInterval(timer);
  }, [autoRotate, hovered]);

  const calculateNodePosition = useCallback(
    (index: number, total: number, radius: number, ringOffset: number = 0) => {
      const angle = ((index / total) * 360 + rotationAngle + ringOffset) % 360;
      const radian = (angle * Math.PI) / 180;

      const x = radius * Math.cos(radian);
      const y = radius * Math.sin(radian);

      const zIndex = Math.round(100 + 50 * Math.cos(radian));
      const opacity = Math.max(0.5, Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2)));

      return { x, y, zIndex, opacity, angle };
    },
    [rotationAngle]
  );

  const centerViewOnNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const ring = node.ring === 'outer' ? outerNodes : innerNodes;
      const nodeIndex = ring.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;

      const ringOffset = node.ring === 'outer' ? 30 : 0;
      const targetAngle = (nodeIndex / ring.length) * 360 + ringOffset;
      setRotationAngle(270 - targetAngle);
    },
    [nodes, innerNodes, outerNodes]
  );

  const toggleNode = useCallback(
    (nodeId: string) => {
      if (activeNodeId === nodeId) {
        setActiveNodeId(null);
        setAutoRotate(true);
      } else {
        setActiveNodeId(nodeId);
        setAutoRotate(false);
        centerViewOnNode(nodeId);
      }
    },
    [activeNodeId, centerViewOnNode]
  );

  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === containerRef.current) {
        setActiveNodeId(null);
        setAutoRotate(true);
      }
    },
    []
  );

  const activeNode = activeNodeId ? nodes.find((n) => n.id === activeNodeId) : null;
  const relatedIds = activeNode?.relatedIds ?? [];

  const maxSvgRadius = outerRadius + 30;

  const renderNodeSet = (
    nodeSet: OrbitalNode[],
    radius: number,
    ringOffset: number
  ) =>
    nodeSet.map((node, index) => {
      const position = calculateNodePosition(index, nodeSet.length, radius, ringOffset);
      const isActive = activeNodeId === node.id;
      const isRelated = relatedIds.includes(node.id);
      const cardAbove = position.y > 0;
      const energy = node.energyLevel ?? 0;
      const nodeColor = node.color ?? 'var(--accent-primary)';

      return (
        <div
          key={node.id}
          className="absolute transition-all duration-500 ease-out cursor-pointer"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            zIndex: isActive ? 200 : position.zIndex,
            opacity: isActive ? 1 : position.opacity,
          }}
          onClick={(e) => {
            e.stopPropagation();
            toggleNode(node.id);
          }}
        >
          {/* Energy pulse glow */}
          {energy > 0 && (
            <div
              className="absolute inset-0 rounded-full animate-orbital-pulse"
              style={{
                '--pulse-color': nodeColor,
                width: `${32 + energy * 0.2}px`,
                height: `${32 + energy * 0.2}px`,
                left: `${-(32 + energy * 0.2 - 40) / 2}px`,
                top: `${-(32 + energy * 0.2 - 40) / 2}px`,
                opacity: energy / 150,
              } as React.CSSProperties}
            />
          )}

          {/* Node circle */}
          <div
            className={`
              flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
              ${isActive ? 'scale-125 shadow-lg' : isRelated ? 'scale-110' : 'hover:scale-110'}
            `}
            style={{
              backgroundColor: isActive
                ? nodeColor
                : isRelated
                  ? `color-mix(in srgb, ${nodeColor} 25%, var(--bg-card))`
                  : 'var(--bg-card)',
              borderColor: isActive
                ? nodeColor
                : isRelated
                  ? nodeColor
                  : 'var(--border-default)',
              color: isActive ? 'white' : 'var(--text-secondary)',
              boxShadow: isActive ? `0 0 20px ${nodeColor}40` : 'none',
            }}
          >
            {node.icon}
          </div>

          {/* Badge */}
          {node.badge && (
            <div
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
              style={{ backgroundColor: nodeColor }}
            >
              {node.badge}
            </div>
          )}

          {/* Label */}
          <div
            className={`
              absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold tracking-wide transition-all duration-300
              ${cardAbove ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'}
            `}
            style={{
              color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            {node.title}
          </div>

          {/* Expanded card */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: cardAbove ? -8 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: cardAbove ? -8 : 8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className={`
                  absolute left-1/2 -translate-x-1/2 w-60
                  rounded-xl border p-4 backdrop-blur-xl
                  ${cardAbove ? 'bottom-[calc(100%+28px)]' : 'top-[calc(100%+28px)]'}
                `}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: `color-mix(in srgb, ${nodeColor} 30%, var(--border-default))`,
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${nodeColor}15`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Connector line */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-px h-4 ${
                    cardAbove ? '-bottom-4' : '-top-4'
                  }`}
                  style={{ backgroundColor: `color-mix(in srgb, ${nodeColor} 40%, transparent)` }}
                />

                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {node.title}
                </p>
                <p
                  className="text-xs leading-relaxed mb-3"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {node.description}
                </p>

                {/* Preview content */}
                {node.previewContent && (
                  <div className="mb-3 border-t pt-3" style={{ borderColor: 'var(--border-default)' }}>
                    {node.previewContent}
                  </div>
                )}

                {/* Go button */}
                {node.href && onNavigate && (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-all duration-200 hover:brightness-110"
                    style={{ backgroundColor: nodeColor }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(node.href!);
                    }}
                  >
                    Go
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    });

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center ${className ?? ''}`}
      onClick={handleBackgroundClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Orbit rings (SVG) */}
      <svg
        className="absolute pointer-events-none"
        width={maxSvgRadius * 2}
        height={maxSvgRadius * 2}
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Inner ring */}
        <circle
          cx={maxSvgRadius}
          cy={maxSvgRadius}
          r={innerRadius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          strokeDasharray="6 6"
          className="animate-orbital-ring-spin"
          style={{ transformOrigin: `${maxSvgRadius}px ${maxSvgRadius}px` }}
        />
        {/* Outer ring */}
        <circle
          cx={maxSvgRadius}
          cy={maxSvgRadius}
          r={outerRadius}
          fill="none"
          stroke="var(--border-default)"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="animate-orbital-ring-spin"
          style={{
            transformOrigin: `${maxSvgRadius}px ${maxSvgRadius}px`,
            animationDirection: 'reverse',
            animationDuration: '180s',
          }}
        />
      </svg>

      {/* Center content */}
      {centerContent && <div className="absolute z-[150]">{centerContent}</div>}

      {/* Inner ring nodes */}
      {renderNodeSet(innerNodes, innerRadius, 0)}

      {/* Outer ring nodes */}
      {renderNodeSet(outerNodes, outerRadius, 30)}
    </div>
  );
}
