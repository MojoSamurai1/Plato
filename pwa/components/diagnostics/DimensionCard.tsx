'use client';

import { useState } from 'react';

interface DimensionCardProps {
  dimensionKey: string;
  label: string;
  description: string;
  score: number;
  subScores: Record<string, number>;
}

function scoreColor(score: number): string {
  if (score < 2) return 'bg-red-500';
  if (score < 3) return 'bg-orange-500';
  if (score < 4) return 'bg-yellow-500';
  return 'bg-emerald-500';
}

function scoreLabel(score: number): string {
  if (score < 2) return 'Needs Development';
  if (score < 3) return 'Developing';
  if (score < 4) return 'Competent';
  return 'Strong';
}

function formatSubDimension(key: string): string {
  // key format: "dimension.sub_dimension" — extract and format the sub part.
  const sub = key.split('.').pop() || key;
  return sub
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DimensionCard({ label, description, score, subScores }: DimensionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const pct = (score / 5) * 100;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full text-white ${scoreColor(score)}`}>
              {scoreLabel(score)}
            </span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{score.toFixed(1)}</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${scoreColor(score)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>

          {Object.entries(subScores).length > 0 && (
            <div className="space-y-2">
              {Object.entries(subScores).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-36 shrink-0">
                    {formatSubDimension(key)}
                  </span>
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor(val)}`}
                      style={{ width: `${(val / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">{val.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
