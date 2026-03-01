'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ModuleCard from '@/components/training/ModuleCard';
import { training, type TrainingModuleInfo } from '@/lib/api';

function ModuleListContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const [modules, setModules] = useState<TrainingModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    training
      .modules(courseId)
      .then((res) => setModules(res.modules ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId]);

  function handleNavigate(moduleName: string, generate: boolean) {
    const base = `/training/${courseId}/${encodeURIComponent(moduleName)}`;
    router.push(generate ? `${base}?generate=true` : base);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading modules...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/training"
              className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
            >
              &larr; Training
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Modules</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discuss module content with Plato, then test yourself with assessments to master each module.
          </p>
        </div>

        {modules.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            No modules found for this course. Make sure Canvas content has been synced.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.module_name}
              module={mod}
              generating={false}
              onGenerate={() => handleNavigate(mod.module_name, true)}
              onClick={() => handleNavigate(mod.module_name, false)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default function ModuleListPage() {
  return (
    <ProtectedRoute>
      <ModuleListContent />
    </ProtectedRoute>
  );
}
