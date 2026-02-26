'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import StatCard from '@/components/learning/StatCard';
import ActivityChart from '@/components/learning/ActivityChart';
import CourseBreakdown from '@/components/learning/CourseBreakdown';
import KnowledgeBaseSummary from '@/components/learning/KnowledgeBaseSummary';
import { dashboard, type DashboardStats } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';

function LearningContent() {
  const router = useRouter();
  const user = getUser();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboard
      .stats()
      .then(setStats)
      .catch((err) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearAuth();
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading learning dashboard...</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-sm">{error || 'Failed to load dashboard.'}</div>
      </div>
    );
  }

  const { overview, engagement, knowledge_base, course_stats, activity_timeline } = stats;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
              Plato
            </h1>
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
            <Link
              href="/dashboard"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/notes"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Notes
            </Link>
            <Link
              href="/settings"
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Learning Dashboard
        </h2>

        {/* Overview stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Courses"
            value={overview.total_courses}
            badge={overview.active_courses > 0 ? `${overview.active_courses} active` : undefined}
            badgeColor="green"
          />
          <StatCard
            label="Assignments"
            value={overview.total_assignments}
            badge={
              overview.overdue_assignments > 0
                ? `${overview.overdue_assignments} overdue`
                : overview.upcoming_assignments > 0
                ? `${overview.upcoming_assignments} upcoming`
                : undefined
            }
            badgeColor={overview.overdue_assignments > 0 ? 'red' : 'yellow'}
          />
          <StatCard
            label="Conversations"
            value={engagement.total_conversations}
            badge={
              engagement.conversations_this_week > 0
                ? `${engagement.conversations_this_week} this week`
                : undefined
            }
            badgeColor="indigo"
          />
          <StatCard
            label="Study Streak"
            value={`${engagement.streak_days}d`}
            badge={engagement.streak_days >= 7 ? 'On fire' : undefined}
            badgeColor="green"
          />
        </div>

        {/* Activity chart */}
        <ActivityChart timeline={activity_timeline} />

        {/* Course breakdown */}
        <CourseBreakdown courses={course_stats} />

        {/* Knowledge base summary */}
        <KnowledgeBaseSummary kb={knowledge_base} />

        {/* Footer timestamp */}
        <p className="text-[10px] text-gray-400 text-right">
          Generated at {new Date(stats.generated_at).toLocaleString('en-AU')}
        </p>
      </main>
    </div>
  );
}

export default function LearningPage() {
  return (
    <ProtectedRoute>
      <LearningContent />
    </ProtectedRoute>
  );
}
