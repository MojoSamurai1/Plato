'use client';

import { useEffect, useRef, useState } from 'react';

interface QuizTimerProps {
  totalSeconds: number;
  paused: boolean;
  onExpire: () => void;
}

export default function QuizTimer({ totalSeconds, paused, onExpire }: QuizTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (paused || expiredRef.current) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!expiredRef.current) {
            expiredRef.current = true;
            // Defer to avoid setState during render
            setTimeout(onExpire, 0);
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [paused, onExpire]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const pct = totalSeconds > 0 ? (remaining / totalSeconds) * 100 : 0;

  let colorClass = 'text-gray-700 dark:text-gray-300';
  let barColor = 'bg-indigo-500';
  let pulse = '';

  if (remaining <= 30) {
    colorClass = 'text-red-600 dark:text-red-400';
    barColor = 'bg-red-500';
    pulse = 'animate-pulse';
  } else if (remaining <= 60) {
    colorClass = 'text-amber-600 dark:text-amber-400';
    barColor = 'bg-amber-500';
  }

  return (
    <div className={`flex items-center gap-3 ${pulse}`}>
      <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
      <span className={`text-sm font-mono font-semibold tabular-nums ${colorClass}`}>
        {display}
      </span>
      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
