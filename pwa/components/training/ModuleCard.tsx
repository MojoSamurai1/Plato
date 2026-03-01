'use client';

import MasteryBadge from './MasteryBadge';
import ProgressBar from './ProgressBar';
import type { TrainingModuleInfo } from '@/lib/api';

interface ModuleCardProps {
  module: TrainingModuleInfo;
  onGenerate: () => void;
  onClick: () => void;
  generating: boolean;
}

export default function ModuleCard({ module, onGenerate, onClick, generating }: ModuleCardProps) {
  const hasScenarios = module.total_scenarios > 0;

  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
      onClick={hasScenarios ? onClick : undefined}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {module.module_name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {module.page_count} page{module.page_count !== 1 ? 's' : ''}
          </p>
        </div>
        <MasteryBadge
          totalScenarios={module.total_scenarios}
          passedScenarios={module.passed_scenarios}
          mastered={module.mastered}
        />
      </div>

      {hasScenarios ? (
        <ProgressBar passed={module.passed_scenarios} total={module.total_scenarios} />
      ) : (
        generating ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Scenarios...
            </div>
            <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onGenerate();
            }}
            className="w-full text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-2 rounded-lg transition font-medium"
          >
            Generate Scenarios
          </button>
        )
      )}
    </div>
  );
}
