'use client';

interface ConstellationNetworkProps {
  className?: string;
}

const NODES = [
  { cx: 80, cy: 60 },
  { cx: 200, cy: 40 },
  { cx: 320, cy: 80 },
  { cx: 440, cy: 30 },
  { cx: 560, cy: 70 },
  { cx: 680, cy: 45 },
  { cx: 150, cy: 140 },
  { cx: 280, cy: 160 },
  { cx: 400, cy: 130 },
  { cx: 520, cy: 155 },
  { cx: 640, cy: 120 },
  { cx: 100, cy: 200 },
  { cx: 240, cy: 220 },
  { cx: 380, cy: 210 },
  { cx: 500, cy: 230 },
  { cx: 620, cy: 190 },
];

const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
  [0, 6], [1, 6], [6, 7], [2, 7], [7, 8],
  [3, 8], [8, 9], [4, 9], [9, 10], [5, 10],
  [6, 11], [7, 12], [11, 12], [8, 13], [12, 13],
  [9, 14], [13, 14], [10, 15], [14, 15],
];

export function ConstellationNetwork({ className = '' }: ConstellationNetworkProps) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 720 260"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="node-glow">
          <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#e8b4b8" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Connection lines */}
      {EDGES.map(([a, b], i) => (
        <line
          key={`edge-${i}`}
          x1={NODES[a].cx}
          y1={NODES[a].cy}
          x2={NODES[b].cx}
          y2={NODES[b].cy}
          stroke="#e8b4b8"
          strokeWidth="0.5"
          opacity="0.12"
        />
      ))}

      {/* Nodes */}
      {NODES.map((node, i) => (
        <g key={`node-${i}`}>
          {/* Glow */}
          <circle
            cx={node.cx}
            cy={node.cy}
            r="8"
            fill="url(#node-glow)"
            style={{
              animation: `drift ${6 + (i % 3) * 2}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
          {/* Node dot */}
          <circle
            cx={node.cx}
            cy={node.cy}
            r={i % 3 === 0 ? 2 : 1.5}
            fill="#e8b4b8"
            opacity={0.3 + (i % 3) * 0.15}
            style={{
              animation: `drift ${6 + (i % 3) * 2}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        </g>
      ))}
    </svg>
  );
}
