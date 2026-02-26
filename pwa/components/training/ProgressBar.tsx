interface ProgressBarProps {
  passed: number;
  total: number;
}

export default function ProgressBar({ passed, total }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{passed} of {total} scenarios passed</span>
        <span>{pct}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct === 100
              ? 'bg-green-500'
              : pct > 0
              ? 'bg-yellow-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
