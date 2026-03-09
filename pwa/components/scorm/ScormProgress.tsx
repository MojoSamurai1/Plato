'use client';

import { useEffect, useState, useCallback } from 'react';
import { scorm, type ScormProgressData, type ScormEvent } from '@/lib/api';

interface ScormProgressProps {
  packageId: number;
  liveEvent?: ScormEvent | null;
}

export default function ScormProgress({ packageId, liveEvent }: ScormProgressProps) {
  const [progress, setProgress] = useState<ScormProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState<ScormEvent[]>([]);

  const fetchProgress = useCallback(async () => {
    try {
      const data = await scorm.progress(packageId);
      setProgress(data);
    } catch {
      // Silently fail — will retry on next poll
    } finally {
      setLoading(false);
    }
  }, [packageId]);

  // Initial fetch + poll every 15 seconds
  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 15000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  // Track live events from bridge
  useEffect(() => {
    if (liveEvent) {
      setLiveEvents((prev) => [liveEvent, ...prev].slice(0, 20));
    }
  }, [liveEvent]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="animate-pulse text-sm text-gray-400">Loading progress...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Progress</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Completion bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">Completion</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {progress?.completion_pct ?? 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${progress?.completion_pct ?? 0}%` }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Time Spent</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {progress?.time_spent_formatted || '0s'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Score</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {progress?.latest_score !== null && progress?.latest_score !== undefined
                ? `${progress.latest_score}%`
                : '--'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Activities</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {progress?.completed_activities ?? 0}/{progress?.total_activities ?? 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Events</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">
              {progress?.total_statements ?? 0}
            </p>
          </div>
        </div>

        {/* Activity breakdown */}
        {progress?.activities && progress.activities.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Activities
            </p>
            <div className="space-y-1.5">
              {progress.activities.map((act) => (
                <div
                  key={act.activity_id}
                  className="flex items-center justify-between text-xs px-2 py-1.5 rounded bg-gray-50 dark:bg-gray-800/30"
                >
                  <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                    {act.activity_name || act.activity_id.split('/').pop()}
                  </span>
                  <span
                    className={`flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium ${
                      act.passed
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : act.completed
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {act.passed ? 'passed' : act.completed ? 'done' : 'in progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live event feed */}
        {liveEvents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Live Events
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {liveEvents.map((evt, i) => (
                <div
                  key={i}
                  className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2"
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse" />
                  <span className="font-medium text-gray-600 dark:text-gray-300">{evt.verb}</span>
                  {evt.activity_name && (
                    <span className="truncate">{evt.activity_name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
