'use client';

import { useState } from 'react';
import type { CognitiveRiskMap } from '@/types';

interface CognitiveRadarProps {
  riskMap: CognitiveRiskMap;
  companyName?: string;
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

// Educational context for each dimension
const DIMENSION_EXPLANATIONS: Record<
  keyof CognitiveRiskMap['dimensions'],
  { meaning: string; interviewContext: string; lowScoreAction: string }
> = {
  analyticalReasoning: {
    meaning: 'How well you break down complex problems and support claims with evidence',
    interviewContext: 'Tested in technical problem walkthroughs, case studies, debugging scenarios',
    lowScoreAction: 'Practice explaining your thought process out loud while solving problems',
  },
  communicationClarity: {
    meaning: 'How clearly and concisely you express technical ideas',
    interviewContext: 'Assessed in all rounds — interviewers evaluate clarity constantly',
    lowScoreAction: 'Record yourself answering questions and review for filler words and structure',
  },
  technicalDepth: {
    meaning: 'Mastery of core technical concepts relevant to the role',
    interviewContext: 'Tested in coding rounds, system design, technical deep-dives',
    lowScoreAction: 'Focus on fundamentals in your weakest JD-required skill areas',
  },
  adaptability: {
    meaning: 'Flexibility in thinking and cultural alignment signals',
    interviewContext: 'Tested in behavioral rounds, culture fit discussions, handling curveballs',
    lowScoreAction:
      'Prepare stories about handling change, learning new things, working with diverse teams',
  },
  problemStructuring: {
    meaning: 'Ability to organize approach to ambiguous or complex problems',
    interviewContext: 'Tested in case studies, system design, open-ended technical questions',
    lowScoreAction: 'Practice the "clarify → structure → solve → verify" framework',
  },
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

export function CognitiveRadar({ riskMap, companyName }: CognitiveRadarProps) {
  const [expandedDimension, setExpandedDimension] = useState<
    keyof CognitiveRiskMap['dimensions'] | null
  >(null);
  const { dimensions } = riskMap;
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;

  // Find lowest dimension for actionable tip
  const dimensionEntries = Object.entries(dimensions) as [keyof typeof dimensions, number][];
  const lowestEntry = dimensionEntries.reduce((min, current) =>
    current[1] < min[1] ? current : min
  );
  const lowestKey = lowestEntry[0];
  const lowestExplanation = DIMENSION_EXPLANATIONS[lowestKey];

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
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {companyName ? `${companyName} Interview Skills Profile` : 'Interview Skills Profile'}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          How your resume signals map to key interview competencies
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

      {/* Legend - Clickable for details */}
      <div className="mt-6">
        <p className="text-xs text-[var(--text-muted)] mb-3">Click a dimension to learn more:</p>
        <div className="space-y-2">
          {(
            Object.entries(DIMENSION_CONFIG) as [
              keyof typeof DIMENSION_CONFIG,
              (typeof DIMENSION_CONFIG)[keyof typeof DIMENSION_CONFIG],
            ][]
          ).map(([key, config]) => {
            const explanation = DIMENSION_EXPLANATIONS[key];
            const value = dimensions[key];
            const isExpanded = expandedDimension === key;

            return (
              <div
                key={key}
                className="border border-[var(--border-default)] rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedDimension(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--text-muted)] w-6">
                      {config.abbrev}
                    </span>
                    <span className="text-[var(--text-secondary)]">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${getScoreColor(value)}`}>
                      {Math.round(value * 100)}%
                    </span>
                    <svg
                      className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 pt-0 space-y-2 text-sm border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
                    <div className="pt-3">
                      <span className="text-[var(--text-muted)]">What it means: </span>
                      <span className="text-[var(--text-secondary)]">{explanation.meaning}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Where it&apos;s tested: </span>
                      <span className="text-[var(--text-secondary)]">
                        {explanation.interviewContext}
                      </span>
                    </div>
                    {value < 0.6 && (
                      <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/20">
                        <span className="text-amber-400 text-xs font-medium">Tip: </span>
                        <span className="text-[var(--text-secondary)] text-xs">
                          {explanation.lowScoreAction}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-emerald-400">Strongest</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {riskMap.highestDimension}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Your resume shows strong evidence in this area
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <span className="text-xs uppercase tracking-wide text-red-400">Focus Area</span>
          <p className="mt-1 text-sm font-medium text-[var(--text-primary)]">
            {riskMap.lowestDimension}
          </p>
          <div className="mt-2 pt-2 border-t border-red-500/20">
            <div className="flex items-start gap-1.5">
              <svg
                className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <p className="text-xs text-[var(--text-secondary)]">
                {lowestExplanation.lowScoreAction}
              </p>
            </div>
          </div>
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
