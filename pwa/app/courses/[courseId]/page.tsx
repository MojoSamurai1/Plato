'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  courses,
  canvas,
  type CourseContentResponse,
  type ModuleSummary,
  type Assignment,
  type CourseDiscussion,
  type ModuleProgress,
  type EmbeddedResource,
} from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';

const CANVAS_BASE = 'https://mylearn.torrens.edu.au';

function parseCanvasPageUrl(contentKey: string): string | null {
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

/** Lookup map keyed by file_name for instant content access */
interface ContentMap {
  [fileName: string]: {
    summary: string;
    content: string;
    status: string;
    content_type: string;
    html_content: string | null;
    embedded_resources: EmbeddedResource[] | null;
  };
}

/** Build progress lookup keyed by module_name */
function buildProgressMap(progress: ModuleProgress[]): Record<string, ModuleProgress> {
  const map: Record<string, ModuleProgress> = {};
  for (const p of progress) {
    map[p.module_name] = p;
  }
  return map;
}

/** Group discussions by module_name */
function groupDiscussions(discussions: CourseDiscussion[]): Record<string, CourseDiscussion[]> {
  const map: Record<string, CourseDiscussion[]> = {};
  for (const d of discussions) {
    const key = d.module_name || 'Ungrouped';
    if (!map[key]) map[key] = [];
    map[key].push(d);
  }
  return map;
}

/** Render embedded resources inline */
function EmbeddedResources({ resources }: { resources: EmbeddedResource[] }) {
  if (!resources || resources.length === 0) return null;

  const youtubeResources = resources.filter((r) => r.type === 'youtube');
  const otherResources = resources.filter((r) => r.type !== 'youtube');

  return (
    <div className="space-y-3">
      {youtubeResources.map((r) => (
        <div key={r.id || r.url} className="rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube.com/embed/${r.id}`}
            title="YouTube video"
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ))}
      {otherResources.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherResources.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                r.type === 'ebook'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
              }`}
            >
              {r.type === 'ebook' ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
              {r.type === 'ebook' ? 'eBook' : 'Link'}
              <span className="opacity-60">&nearr;</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

/** Render a discussion thread */
function DiscussionThread({ discussion }: { discussion: CourseDiscussion }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {discussion.title}
          </span>
        </div>
        <span className="text-[10px] text-gray-400 flex-shrink-0">
          {discussion.post_count} post{discussion.post_count !== 1 ? 's' : ''}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3">
          {discussion.message && (
            <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {discussion.message}
            </div>
          )}
          {discussion.posts.length > 0 && (
            <div className="space-y-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              {discussion.posts.map((post, i) => (
                <div key={i} className="text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {post.user_name}
                  </span>
                  {post.created_at && (
                    <span className="text-[10px] text-gray-400 ml-2">
                      {formatDate(post.created_at)}
                    </span>
                  )}
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed whitespace-pre-wrap">
                    {post.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Module progress bar */
function ModuleProgressBar({ progress }: { progress: ModuleProgress }) {
  const pct = progress.items_total > 0
    ? Math.round((progress.items_completed / progress.items_total) * 100)
    : 0;

  const stateColor = progress.module_state === 'completed'
    ? 'bg-emerald-500'
    : progress.module_state === 'started'
    ? 'bg-indigo-500'
    : 'bg-gray-300 dark:bg-gray-600';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${stateColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-400">
        {progress.items_completed}/{progress.items_total}
      </span>
    </div>
  );
}

function CourseDetailContent() {
  const params = useParams();
  const router = useRouter();
  const user = getUser();
  const courseId = Number(params.courseId);

  const [data, setData] = useState<CourseContentResponse | null>(null);
  const [contentMap, setContentMap] = useState<ContentMap>({});
  const [contentLoaded, setContentLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [expandedAssignment, setExpandedAssignment] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Load course structure + all content in parallel
  useEffect(() => {
    const loadCourse = courses.content(courseId);
    const loadContent = courses.moduleSummaries(courseId);

    Promise.all([loadCourse, loadContent])
      .then(([courseData, summariesData]) => {
        setData(courseData);
        const allModules = new Set(courseData.modules.map((m) => m.module_name));
        setExpandedModules(allModules);

        // Build a flat lookup map for instant page expansion
        const map: ContentMap = {};
        for (const mod of summariesData.modules) {
          for (const page of mod.pages) {
            map[page.file_name] = {
              summary: page.summary,
              content: page.content,
              status: page.status,
              content_type: page.content_type,
              html_content: page.html_content,
              embedded_resources: page.embedded_resources,
            };
          }
        }
        setContentMap(map);
        setContentLoaded(true);
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

  function togglePage(fileName: string) {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  }

  /** Build the file_name key matching what class-canvas.php stores */
  function buildFileName(moduleName: string, pageTitle: string): string {
    const raw = `canvas-${moduleName}-${pageTitle}`;
    return raw
      .toLowerCase()
      .replace(/[^a-z0-9\-_.]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleContentSync() {
    setSyncing(true);
    setSyncMsg('');
    try {
      const res = await canvas.contentSync();
      setSyncMsg(res.message);
      // Reload both course data and content
      const [updated, summaries] = await Promise.all([
        courses.content(courseId),
        courses.moduleSummaries(courseId),
      ]);
      setData(updated);
      const allModules = new Set(updated.modules.map((m) => m.module_name));
      setExpandedModules(allModules);

      const map: ContentMap = {};
      for (const mod of summaries.modules) {
        for (const page of mod.pages) {
          map[page.file_name] = {
            summary: page.summary,
            content: page.content,
            status: page.status,
            content_type: page.content_type,
            html_content: page.html_content,
            embedded_resources: page.embedded_resources,
          };
        }
      }
      setContentMap(map);
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

  const { course, modules, assignments, study_notes, discussions, module_progress, total_pages } = data;
  const isConcluded = course.end_at && new Date(course.end_at) < new Date();
  const progressMap = buildProgressMap(module_progress);
  const discussionMap = groupDiscussions(discussions);

  // Calculate overall completion
  const totalItems = module_progress.reduce((sum, p) => sum + p.items_total, 0);
  const completedItems = module_progress.reduce((sum, p) => sum + p.items_completed, 0);
  const completionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{modules.length} module{modules.length !== 1 ? 's' : ''}</span>
            <span>{total_pages} page{total_pages !== 1 ? 's' : ''}</span>
            <span>{assignments.length} assignment{assignments.length !== 1 ? 's' : ''}</span>
            {discussions.length > 0 && (
              <span>{discussions.length} discussion{discussions.length !== 1 ? 's' : ''}</span>
            )}
            {study_notes.length > 0 && (
              <span>{study_notes.length} note{study_notes.length !== 1 ? 's' : ''}</span>
            )}
            {totalItems > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {completionPct}% complete
              </span>
            )}
          </div>

          {/* Completion bar */}
          {totalItems > 0 && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
          )}

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
              {modules.map((mod) => {
                const progress = progressMap[mod.module_name];
                const moduleDiscussions = discussionMap[mod.module_name] || [];

                return (
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
                      <div className="flex items-center gap-3">
                        {progress && <ModuleProgressBar progress={progress} />}
                        <span className="text-xs text-gray-400">
                          {mod.pages.length} page{mod.pages.length !== 1 ? 's' : ''}
                          {moduleDiscussions.length > 0 && ` · ${moduleDiscussions.length} discussion${moduleDiscussions.length !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </button>

                    {/* Module pages */}
                    {expandedModules.has(mod.module_name) && (
                      <div className="border-t border-gray-100 dark:border-gray-800">
                        {mod.pages.map((page) => {
                          const canvasUrl = parseCanvasPageUrl(page.content_key);
                          const fileName = buildFileName(mod.module_name, page.title);
                          const isPageExpanded = expandedPages.has(fileName);
                          const cached = contentMap[fileName];

                          // Icon based on content type
                          const typeIcon = page.content_type === 'discussion' ? (
                            <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : page.content_type === 'assignment' ? (
                            <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : page.content_type === 'external_link' ? (
                            <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          ) : null;

                          return (
                            <div key={page.id}>
                              {/* Page row — clickable to expand content */}
                              <button
                                onClick={() => togglePage(fileName)}
                                className="w-full flex items-center justify-between px-4 py-2.5 pl-10 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <svg
                                    className={`w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0 transition-transform ${
                                      isPageExpanded ? 'rotate-90' : ''
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                  </svg>
                                  {typeIcon}
                                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                    {page.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {page.content_type !== 'page' && (
                                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                                      {page.content_type}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-gray-400">
                                    {page.chunks_created} chunk{page.chunks_created !== 1 ? 's' : ''}
                                  </span>
                                  {canvasUrl && (
                                    <a
                                      href={canvasUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Open in Canvas"
                                    >
                                      &nearr;
                                    </a>
                                  )}
                                </div>
                              </button>

                              {/* Expanded content — instant, no loading needed */}
                              {isPageExpanded && (
                                <div className="mx-4 ml-10 mb-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                  {!contentLoaded ? (
                                    <div className="px-4 py-6 text-center">
                                      <div className="animate-pulse text-sm text-gray-400">Loading content...</div>
                                    </div>
                                  ) : cached && (cached.summary || cached.content || cached.html_content || cached.embedded_resources) ? (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                      {/* Embedded resources (YouTube, eBooks, links) */}
                                      {cached.embedded_resources && cached.embedded_resources.length > 0 && (
                                        <div className="px-4 py-3">
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                            Resources
                                          </p>
                                          <EmbeddedResources resources={cached.embedded_resources} />
                                        </div>
                                      )}
                                      {cached.summary && (
                                        <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10">
                                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                                            Summary
                                          </p>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {cached.summary}
                                          </p>
                                        </div>
                                      )}
                                      {/* Rich HTML content if available, otherwise plain text */}
                                      {cached.html_content ? (
                                        <div className="px-4 py-3">
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                            Full Content
                                          </p>
                                          <div
                                            className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose prose-sm dark:prose-invert max-w-none max-h-96 overflow-y-auto"
                                            dangerouslySetInnerHTML={{ __html: cached.html_content }}
                                          />
                                        </div>
                                      ) : cached.content ? (
                                        <div className="px-4 py-3">
                                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                            Full Content
                                          </p>
                                          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                                            {cached.content}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <div className="px-4 py-4 text-center text-sm text-gray-400">
                                      No content available for this page yet.
                                      {canvasUrl && (
                                        <>
                                          {' '}
                                          <a
                                            href={canvasUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-500 hover:underline"
                                          >
                                            Read in Canvas &nearr;
                                          </a>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Discussions grouped under their module */}
                        {moduleDiscussions.length > 0 && (
                          <div className="px-4 pl-10 pb-3 pt-1 space-y-1.5">
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                              Discussions
                            </p>
                            {moduleDiscussions.map((d) => (
                              <DiscussionThread key={d.id} discussion={d} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

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
