'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  courses,
  canvas,
  type CourseContentResponse,
  type CourseDetail,
  type CourseModule,
  type Assignment,
  type StudyNote,
} from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';

const CANVAS_BASE = 'https://mylearn.torrens.edu.au';

function parseCanvasPageUrl(contentKey: string): string | null {
  // content_key format: "page:{canvas_course_id}:{page_url}"
  const parts = contentKey.split(':');
  if (parts.length >= 3 && parts[0] === 'page') {
    const canvasCourseId = parts[1];
    const pageSlug = parts.slice(2).join(':');
    return `${CANVAS_BASE}/courses/${canvasCourseId}/pages/${pageSlug}`;
  }
  return null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getDueStatus(dueAt: string | null): 'overdue' | 'soon' | 'normal' | 'none' {
  if (!dueAt) return 'none';
  const due = new Date(dueAt);
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 86400000);
  if (due < now) return 'overdue';
  if (due <= weekFromNow) return 'soon';
  return 'normal';
}

function CourseDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = getUser();
  const courseId = Number(params.courseId);

  const [data, setData] = useState<CourseContentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    courses
      .content(courseId)
      .then((res) => {
        setData(res);
        // Auto-expand all modules
        const allModules = new Set(res.modules.map((m) => m.module_name));
        setExpandedModules(allModules);
      })
      .catch((err) => setError(err.message || 'Failed to load course'))
      .finally(() => setLoading(false));
  }, [courseId]);

  function toggleModule(name: string) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleContentSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await canvas.contentSync();
      setSyncMsg(res.message);
      // Reload course data
      const updated = await courses.content(courseId);
      setData(updated);
      const allModules = new Set(updated.modules.map((m) => m.module_name));
      setExpandedModules(allModules);
    } catch (err) {
      setSyncMsg(err instanceof Error ? err.message : 'Sync failed');
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
        <div className="animate-pulse text-gray-400">Loading course...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-sm">{error || 'Failed to load course.'}</div>
      </div>
    );
  }

  const { course, modules, assignments, study_notes, total_pages } = data;
  const isConcluded = course.end_at && new Date(course.end_at) < new Date();

  // Sort assignments by due date
  const sortedAssignments = [...assignments].sort((a, b) => {
    if (!a.due_at && !b.due_at) return 0;
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
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
            <Link href="/training" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Training
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
        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
        >
          &larr; Back to Dashboard
        </Link>

        {/* Course Header */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {course.course_code}
                </span>
                {isConcluded && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                    Concluded
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {course.name}
              </h2>
              {(course.start_at || course.end_at) && (
                <p className="text-xs text-gray-400 mt-1">
                  {course.start_at && formatDate(course.start_at)}
                  {course.start_at && course.end_at && ' – '}
                  {course.end_at && formatDate(course.end_at)}
                </p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            <span>{total_pages} page{total_pages !== 1 ? 's' : ''}</span>
            <span>{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
            {study_notes.length > 0 && (
              <span>{study_notes.length} note{study_notes.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href={`/chat`}
              className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Ask Plato about this course
            </Link>
            <Link
              href={`/training/${course.id}`}
              className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Training Zone
            </Link>
            <a
              href={`${CANVAS_BASE}/courses/${course.canvas_course_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Open in Canvas &nearr;
            </a>
          </div>
        </div>

        {/* Modules & Content */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Modules & Content
          </h3>

          {modules.length === 0 ? (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 text-center">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                No course content synced yet. Pull your lecture content from Canvas so Plato can help you study.
              </p>
              <button
                onClick={handleContentSync}
                disabled={syncing}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg px-5 py-2.5 transition"
              >
                {syncing ? 'Syncing...' : 'Sync Course Content'}
              </button>
              {syncMsg && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">{syncMsg}</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((mod) => (
                <div
                  key={mod.module_name}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                >
                  {/* Module header */}
                  <button
                    onClick={() => toggleModule(mod.module_name)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedModules.has(mod.module_name) ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {mod.module_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {mod.pages.length} page{mod.pages.length !== 1 ? 's' : ''}
                    </span>
                  </button>

                  {/* Module pages */}
                  {expandedModules.has(mod.module_name) && (
                    <div className="border-t border-gray-100 dark:border-gray-800">
                      {mod.pages.map((page) => {
                        const canvasUrl = parseCanvasPageUrl(page.content_key);
                        return (
                          <div
                            key={page.id}
                            className="flex items-center justify-between px-4 py-2.5 pl-10 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                {page.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className="text-[10px] text-gray-400">
                                {page.chunks_created} chunk{page.chunks_created !== 1 ? 's' : ''}
                              </span>
                              {canvasUrl && (
                                <a
                                  href={canvasUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Read in Canvas &nearr;
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {/* Sync more content button */}
              <div className="text-center pt-2">
                <button
                  onClick={handleContentSync}
                  disabled={syncing}
                  className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition disabled:opacity-50"
                >
                  {syncing ? 'Syncing...' : 'Check for new content'}
                </button>
                {syncMsg && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{syncMsg}</p>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Assignments */}
        <section>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Assignments
          </h3>

          {sortedAssignments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No assignments synced for this course.</p>
          ) : (
            <div className="space-y-2">
              {sortedAssignments.map((a) => {
                const status = getDueStatus(a.due_at);
                const isExpanded = expandedAssignment === a.id;
                const hasDescription = a.description && a.description.trim().length > 0;

                return (
                  <div
                    key={a.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
                  >
                    <div
                      className={`flex items-center justify-between px-4 py-3 ${
                        hasDescription ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                      } transition`}
                      onClick={() => hasDescription && setExpandedAssignment(isExpanded ? null : a.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {hasDescription && (
                          <svg
                            className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {a.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            {a.due_at && (
                              <span
                                className={
                                  status === 'overdue'
                                    ? 'text-red-500'
                                    : status === 'soon'
                                    ? 'text-amber-500'
                                    : ''
                                }
                              >
                                {status === 'overdue' ? 'Overdue · ' : status === 'soon' ? 'Due soon · ' : ''}
                                {formatDate(a.due_at)}
                              </span>
                            )}
                            {a.points_possible !== null && (
                              <span>{a.points_possible} pts</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <a
                        href={`${CANVAS_BASE}/courses/${a.canvas_course_id}/assignments/${a.canvas_assignment_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View &nearr;
                      </a>
                    </div>

                    {isExpanded && hasDescription && (
                      <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: a.description! }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Study Notes */}
        {study_notes.length > 0 && (
          <section>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Study Notes
            </h3>
            <div className="space-y-2">
              {study_notes.map((note) => (
                <div
                  key={note.file_name}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{note.file_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {note.file_type.toUpperCase()} · {note.total_chunks} chunk{note.total_chunks !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      note.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : note.status === 'error'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {note.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default function CourseDetailPage() {
  return (
    <ProtectedRoute>
      <CourseDetailContent />
    </ProtectedRoute>
  );
}
