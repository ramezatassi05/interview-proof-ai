'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface OrbitalNode {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface RadialOrbitalTimelineProps {
  nodes: OrbitalNode[];
  centerContent?: React.ReactNode;
  radius?: number;
  className?: string;
}

export default function RadialOrbitalTimeline({
  nodes,
  centerContent,
  radius = 130,
  className,
}: RadialOrbitalTimelineProps) {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate) return;

    const timer = setInterval(() => {
      setRotationAngle((prev) => {
        const next = (prev + 0.3) % 360;
        return Number(next.toFixed(3));
      });
    }, 50);

    return () => clearInterval(timer);
  }, [autoRotate]);

  const calculateNodePosition = useCallback(
    (index: number, total: number) => {
      const angle = ((index / total) * 360 + rotationAngle) % 360;
      const radian = (angle * Math.PI) / 180;

      const x = radius * Math.cos(radian);
      const y = radius * Math.sin(radian);

      const zIndex = Math.round(100 + 50 * Math.cos(radian));
      const opacity = Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2)));

      return { x, y, zIndex, opacity };
    },
    [rotationAngle, radius]
  );

  const centerViewOnNode = useCallback(
    (nodeId: string) => {
      const nodeIndex = nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex === -1) return;
      const targetAngle = (nodeIndex / nodes.length) * 360;
      setRotationAngle(270 - targetAngle);
    },
    [nodes]
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

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center ${className ?? ''}`}
      onClick={handleBackgroundClick}
    >
      {/* Orbit ring */}
      <svg
        className="absolute pointer-events-none"
        width={radius * 2 + 40}
        height={radius * 2 + 40}
        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <circle
          cx={radius + 20}
          cy={radius + 20}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-zinc-200"
          strokeDasharray="4 4"
        />
      </svg>

      {/* Center content */}
      {centerContent && <div className="absolute z-10">{centerContent}</div>}

      {/* Orbital nodes */}
      {nodes.map((node, index) => {
        const position = calculateNodePosition(index, nodes.length);
        const isActive = activeNodeId === node.id;
        // Card flips above node if node is in lower hemisphere
        const cardAbove = position.y > 0;

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
            {/* Node icon circle */}
            <div
              className={`
                flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300
                ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-125'
                    : 'bg-white text-zinc-500 border-zinc-300 shadow-sm hover:border-indigo-300 hover:text-indigo-500'
                }
              `}
            >
              {node.icon}
            </div>

            {/* Node label */}
            <div
              className={`
                absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium tracking-wide transition-all duration-300
                ${isActive ? 'text-zinc-900 font-semibold' : 'text-zinc-400'}
                ${cardAbove ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+4px)]'}
              `}
            >
              {node.title}
            </div>

            {/* Expanded card */}
            {isActive && (
              <div
                className={`
                  absolute left-1/2 -translate-x-1/2 w-56
                  bg-white border border-zinc-200 shadow-xl rounded-xl p-3.5
                  transition-opacity duration-200
                  ${cardAbove ? 'bottom-[calc(100%+28px)]' : 'top-[calc(100%+24px)]'}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Connector line */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 w-px h-3 bg-zinc-200 ${
                    cardAbove ? '-bottom-3' : '-top-3'
                  }`}
                />
                <p className="text-sm font-semibold text-zinc-800 mb-1">{node.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{node.description}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
