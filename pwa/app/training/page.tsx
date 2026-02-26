'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProgressBar from '@/components/training/ProgressBar';
import { training, type TrainingCourseInfo } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';

function TrainingContent() {
  const router = useRouter();
  const user = getUser();
  const [courses, setCourses] = useState<TrainingCourseInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    training
      .modules()
      .then((res) => setCourses(res.courses ?? []))
      .catch((err) => setError(err.message || 'Failed to load training data'))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearAuth();
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading Training Zone...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Plato</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Welcome, {user?.display_name || 'Student'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition font-medium"
            >
              Ask Plato
            </Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Dashboard
            </Link>
            <Link href="/learning" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Learning
            </Link>
            <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Settings
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training Zone</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Test your understanding with scenario-based exercises. Score 90% on every scenario to master a module.
          </p>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        {courses.length === 0 && !error && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No course content yet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sync your Canvas course content first so Plato can generate training scenarios.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {courses.map((course) => {
            const totalScenarios = course.modules.reduce((sum, m) => sum + m.total_scenarios, 0);
            const passedScenarios = course.modules.reduce((sum, m) => sum + m.passed_scenarios, 0);

            return (
              <Link
                key={course.course_id}
                href={`/training/${course.course_id}`}
                className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {course.course_name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {course.course_code} · {course.total_modules} module{course.total_modules !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    course.mastered_modules === course.total_modules && course.total_modules > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : course.mastered_modules > 0
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {course.mastered_modules}/{course.total_modules} mastered
                  </span>
                </div>

                {totalScenarios > 0 && (
                  <ProgressBar passed={passedScenarios} total={totalScenarios} />
                )}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default function TrainingPage() {
  return (
    <ProtectedRoute>
      <TrainingContent />
    </ProtectedRoute>
  );
}
