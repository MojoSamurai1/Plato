'use client';

import { useEffect, useState } from 'react';
import { training, type LearningOutcome } from '@/lib/api';

interface LearningOutcomesSectionProps {
  courseId: number;
  moduleName: string;
}

export default function LearningOutcomesSection({ courseId, moduleName }: LearningOutcomesSectionProps) {
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    training
      .learningOutcomes(courseId, moduleName)
      .then((res) => {
        setOutcomes(res.outcomes ?? []);
        setSource(res.source ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (outcomes.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Learning Outcomes</h3>
        </div>
        {source === 'ai' && (
          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 px-1.5 py-0.5 rounded font-medium">
            AI-generated
          </span>
        )}
      </div>

      <ol className="space-y-2">
        {outcomes.map((outcome, i) => (
          <li key={i} className="flex gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              {i + 1}
            </span>
            <span className="leading-relaxed">{outcome.outcome}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
