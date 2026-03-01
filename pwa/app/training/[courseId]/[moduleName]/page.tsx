'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScenarioCard from '@/components/training/ScenarioCard';
import MasteryBadge from '@/components/training/MasteryBadge';
import ProgressBar from '@/components/training/ProgressBar';
import ModuleSummarySection from '@/components/training/ModuleSummarySection';
import LearningOutcomesSection from '@/components/training/LearningOutcomesSection';
import { training, type TrainingScenario } from '@/lib/api';

function ModuleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const moduleName = decodeURIComponent(params.moduleName as string);
  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    training
      .scenarios(courseId, moduleName)
      .then((res) => setScenarios(res.scenarios ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName]);

  const passed = scenarios.filter((s) => s.passed).length;
  const total = scenarios.length;
  const mastered = total > 0 && passed === total;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading module...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/training/${courseId}`}
            className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
          >
            &larr; Modules
          </Link>
          <MasteryBadge totalScenarios={total} passedScenarios={passed} mastered={mastered} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{moduleName}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Pass all scenarios with 90% or higher to master this module.
          </p>
        </div>

        {/* Module Summary (collapsible) */}
        <ModuleSummarySection courseId={courseId} moduleName={moduleName} />

        {/* Learning Outcomes */}
        <LearningOutcomesSection courseId={courseId} moduleName={moduleName} />

        {/* Scenarios */}
        {total > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
              Scenarios
            </h3>
            <ProgressBar passed={passed} total={total} />
          </div>
        )}

        {scenarios.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No scenarios generated yet. Go back and generate scenarios for this module.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              onClick={() =>
                router.push(
                  `/training/${courseId}/${encodeURIComponent(moduleName)}/${scenario.id}`
                )
              }
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ModuleDetailPage() {
  return (
    <ProtectedRoute>
      <ModuleDetailContent />
    </ProtectedRoute>
  );
}
