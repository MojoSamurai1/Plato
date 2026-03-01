'use client';

import { useEffect, useState } from 'react';
import { courses, type ModuleSummary } from '@/lib/api';

interface ModuleSummarySectionProps {
  courseId: number;
  moduleName: string;
}

export default function ModuleSummarySection({ courseId, moduleName }: ModuleSummarySectionProps) {
  const [summary, setSummary] = useState<ModuleSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    courses
      .moduleSummaries(courseId)
      .then((res) => {
        const match = res.modules?.find((m) => m.module_name === moduleName);
        if (match) setSummary(match);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  const pageCount = summary.pages?.length ?? 0;
  const combinedSummary = summary.summary || summary.pages?.map((p) => p.summary).filter(Boolean).join('\n\n') || '';

  if (!combinedSummary) return null;

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
          </svg>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Module Summary</span>
          <span className="text-xs text-gray-400">{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 whitespace-pre-line leading-relaxed">
            {combinedSummary}
          </p>
        </div>
      )}
    </div>
  );
}
