import type { TrainingScenario } from '@/lib/api';

interface ScenarioCardProps {
  scenario: TrainingScenario;
  onClick: () => void;
}

export default function ScenarioCard({ scenario, onClick }: ScenarioCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {scenario.title}
        </h3>
        {scenario.passed ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Passed
          </span>
        ) : scenario.best_score !== null ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
            {scenario.best_score}%
          </span>
        ) : null}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
        {scenario.context}
      </p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{scenario.total_points} points</span>
        <span>
          {scenario.attempt_count > 0
            ? `${scenario.attempt_count} attempt${scenario.attempt_count !== 1 ? 's' : ''}`
            : 'Not attempted'}
        </span>
      </div>
    </div>
  );
}
