'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScenarioCard from '@/components/training/ScenarioCard';
import MasteryBadge from '@/components/training/MasteryBadge';
import ProgressBar from '@/components/training/ProgressBar';
import { training, type TrainingScenario } from '@/lib/api';

function ScenarioListContent() {
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
        <div className="animate-pulse text-gray-400">Loading scenarios...</div>
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

        {total > 0 && (
          <ProgressBar passed={passed} total={total} />
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

export default function ScenarioListPage() {
  return (
    <ProtectedRoute>
      <ScenarioListContent />
    </ProtectedRoute>
  );
}
