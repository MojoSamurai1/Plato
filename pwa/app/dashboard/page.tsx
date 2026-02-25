'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import CourseCard from '@/components/CourseCard';
import AssignmentList from '@/components/AssignmentList';
import { courses, assignments, canvas, type Course, type Assignment } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const user = getUser();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [assignmentList, setAssignmentList] = useState<Assignment[]>([]);
  const [syncStatus, setSyncStatus] = useState<string>('never');
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);

  async function loadData() {
    try {
      const [coursesRes, assignmentsRes, statusRes] = await Promise.all([
        courses.list(),
        assignments.list({ upcoming: true, limit: 10 }),
        canvas.status(),
      ]);

      setCourseList(coursesRes.courses);
      setAssignmentList(assignmentsRes.assignments);
      setSyncStatus(coursesRes.sync_status);
      setLastSync(coursesRes.last_sync);
      setConnected(statusRes.connected);
    } catch {
      // 401 is handled by api.ts auto-redirect
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await canvas.sync();
      await loadData();
    } catch {
      // handled
    } finally {
      setSyncing(false);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading dashboard...</div>
      </div>
    );
  }

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
            {connected && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="text-sm bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
              >
                {syncing ? 'Syncing...' : 'Refresh'}
              </button>
            )}
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

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Sync Status Bar */}
        {connected && lastSync && (
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'ok'
                  ? 'bg-green-400'
                  : syncStatus === 'error'
                  ? 'bg-red-400'
                  : syncStatus === 'syncing'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-gray-400'
              }`}
            />
            Last synced:{' '}
            {new Date(lastSync).toLocaleString('en-AU', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {/* Connect Canvas Prompt */}
        {!connected && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Connect your Canvas account
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Link your university Canvas account to see your courses and assignments.
            </p>
            <Link
              href="/canvas/connect"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition"
            >
              Connect Canvas
            </Link>
          </div>
        )}

        {/* Courses */}
        {courseList.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Courses
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {courseList.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Assignments */}
        {connected && (
          <section>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Assignments
            </h2>
            <AssignmentList assignments={assignmentList} />
          </section>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
