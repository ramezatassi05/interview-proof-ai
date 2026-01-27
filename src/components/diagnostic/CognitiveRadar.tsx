'use client';

import type { CognitiveRiskMap } from '@/types';

interface CognitiveRadarProps {
  riskMap: CognitiveRiskMap;
}

// Dimension display configuration
const DIMENSION_CONFIG: Record<
  keyof CognitiveRiskMap['dimensions'],
  { label: string; abbrev: string }
> = {
  analyticalReasoning: { label: 'Analytical Reasoning', abbrev: 'AR' },
  communicationClarity: { label: 'Communication Clarity', abbrev: 'CC' },
  technicalDepth: { label: 'Technical Depth', abbrev: 'TD' },
  adaptability: { label: 'Adaptability', abbrev: 'AD' },
  problemStructuring: { label: 'Problem Structuring', abbrev: 'PS' },
};

// Generate radar chart points for a pentagon
function getRadarPoints(
  dimensions: CognitiveRiskMap['dimensions'],
  radius: number,
  centerX: number,
  centerY: number
) {
  const entries = Object.entries(dimensions) as [keyof typeof dimensions, number][];
  const angleStep = (2 * Math.PI) / entries.length;
  const startAngle = -Math.PI / 2; // Start from top

  return entries.map(([key, value], index) => {
    const angle = startAngle + index * angleStep;
    const scaledRadius = radius * value;
    const x = centerX + scaledRadius * Math.cos(angle);
    const y = centerY + scaledRadius * Math.sin(angle);
    return { key, value, x, y, angle };
  });
}

// Generate polygon path from points
function getPolygonPath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
}

// Generate label positions
function getLabelPositions(
  dimensions: CognitiveRiskMap['dimensions'],
  radius: number,
  centerX: number,
  centerY: number
) {
  const entries = Object.entries(dimensions) as [keyof typeof dimensions, number][];
  const angleStep = (2 * Math.PI) / entries.length;
  const startAngle = -Math.PI / 2;
  const labelRadius = radius + 30;

  return entries.map(([key], index) => {
    const angle = startAngle + index * angleStep;
    const x = centerX + labelRadius * Math.cos(angle);
    const y = centerY + labelRadius * Math.sin(angle);
    return { key, x, y, angle };
  });
}

function getScoreColor(value: number): string {
  if (value >= 0.7) return 'text-emerald-400';
  if (value >= 0.5) return 'text-amber-400';
  return 'text-red-400';
}

export function CognitiveRadar({ riskMap }: CognitiveRadarProps) {
  const { dimensions } = riskMap;
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;

  // Grid levels for background circles
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Generate data polygon
  const dataPoints = getRadarPoints(dimensions, maxRadius, center, center);
  const dataPath = getPolygonPath(dataPoints);

  // Generate label positions
  const labels = getLabelPositions(dimensions, maxRadius, center, center);

  // Generate grid pentagon vertices (for axis lines)
  const gridPoints = getRadarPoints(
    {
      analyticalReasoning: 1,
      communicationClarity: 1,
      technicalDepth: 1,
      adaptability: 1,
      problemStructuring: 1,
    },
    maxRadius,
    center,
    center
  );

  return (
    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-card)] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Cognitive Risk Map</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Five-dimension assessment of your interview readiness
        </p>
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center">
        <svg width={size} height={size} className="overflow-visible">
          {/* Background grid circles */}
          {gridLevels.map((level) => {
            const points = getRadarPoints(
              {
                analyticalReasoning: level,
                communicationClarity: level,
                technicalDepth: level,
                adaptability: level,
                problemStructuring: level,
              },
              maxRadius,
              center,
              center
            );
            return (
              <polygon
                key={level}
                points={points.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="1"
                opacity={0.5}
              />
            );
          })}

          {/* Axis lines */}
          {gridPoints.map((point) => (
            <line
              key={point.key}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="var(--border-default)"
              strokeWidth="1"
              opacity={0.5}
            />
          ))}

          {/* Data polygon */}
          <path
            d={dataPath}
            fill="var(--color-accent)"
            fillOpacity={0.2}
            stroke="var(--color-accent)"
            strokeWidth="2"
          />

          {/* Data points */}
          {dataPoints.map((point) => (
            <circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r="5"
              fill="var(--color-accent)"
              stroke="var(--bg-card)"
              strokeWidth="2"
            />
          ))}

          {/* Labels */}
          {labels.map((label) => {
            const config = DIMENSION_CONFIG[label.key];
            const value = dimensions[label.key];
            // Adjust text anchor based on position
            let textAnchor: 'start' | 'middle' | 'end' = 'middle';
            if (label.angle > -Math.PI / 4 && label.angle < Math.PI / 4) textAnchor = 'middle';
            else if (label.angle >= Math.PI / 4 && label.angle < (3 * Math.PI) / 4)
              textAnchor = 'start';
            else if (label.angle >= (3 * Math.PI) / 4 || label.angle < (-3 * Math.PI) / 4)
              textAnchor = 'middle';
            else textAnchor = 'end';

            return (
              <g key={label.key}>
                <text
                  x={label.x}
                  y={label.y - 8}
                  textAnchor={textAnchor}
                  className="text-xs fill-[var(--text-secondary)]"
                >
                  {config.abbrev}
                </text>
                <text
                  x={label.x}
                  y={label.y + 8}
                  textAnchor={textAnchor}
                  className={`text-sm font-medium ${getScoreColor(value)}`}
                >
                  {Math.round(value * 100)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(DIMENSION_CONFIG).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2 text-sm">
            <span className="font-medium text-[var(--text-muted)]">{config.abbrev}:</span>
            <span className="text-[var(--text-secondary)]">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Insights */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-emerald-400">Strongest</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {riskMap.highestDimension}
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-red-400">Needs Work</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {riskMap.lowestDimension}
          </p>
        </div>
      </div>

      {/* Version tag */}
      <div className="mt-6 pt-4 border-t border-[var(--border-default)]">
        <span className="text-xs text-[var(--text-muted)]">
          Assessment version {riskMap.version}
        </span>
      </div>
    </div>
  );
}
