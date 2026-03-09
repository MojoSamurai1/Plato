'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScormPlayer from '@/components/scorm/ScormPlayer';
import ScormProgress from '@/components/scorm/ScormProgress';
import ScormChat from '@/components/scorm/ScormChat';
import ScormChatBubble from '@/components/scorm/ScormChatBubble';
import ScormScenario from '@/components/scorm/ScormScenario';
import { scorm, type ScormPackage, type ScormEvent, type ScormScenario as ScormScenarioType } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth';

type SideTab = 'progress' | 'ask';

function ScormPageContent() {
  const router = useRouter();
  const user = getUser();
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePackage, setActivePackage] = useState<ScormPackage | null>(null);
  const [latestEvent, setLatestEvent] = useState<ScormEvent | null>(null);
  const [sideTab, setSideTab] = useState<SideTab>('progress');
  const [activeScenario, setActiveScenario] = useState<ScormScenarioType | null>(null);
  const [generatingScenario, setGeneratingScenario] = useState<string | null>(null);

  useEffect(() => {
    scorm
      .packages()
      .then((res) => setPackages(res.packages))
      .catch((err) => setError(err.message || 'Failed to load SCORM packages'))
      .finally(() => setLoading(false));
  }, []);

  const handleEvent = useCallback((event: ScormEvent) => {
    setLatestEvent({ ...event });
  }, []);

  const handleClose = useCallback(() => {
    setActivePackage(null);
    setLatestEvent(null);
    setSideTab('progress');
    scorm.packages().then((res) => setPackages(res.packages)).catch(() => {});
  }, []);

  async function handleGenerateScenario(packageId: number, type: string) {
    setGeneratingScenario(type);
    setError('');
    try {
      const res = await scorm.generateScenario(packageId, type);
      setActiveScenario(res.scenario);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scenario');
    } finally {
      setGeneratingScenario(null);
    }
  }

  function handleLogout() {
    clearAuth();
    router.replace('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading SCORM packages...</div>
      </div>
    );
  }

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
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
        >
          &larr; Back to Dashboard
        </Link>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Interactive Modules (SCORM)
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Launch and track interactive learning content
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            {error}
          </div>
        )}

        {/* Active scenario view */}
        {activeScenario && activePackage && (
          <ScormScenario
            scenario={activeScenario}
            onClose={() => setActiveScenario(null)}
          />
        )}

        {/* Active player with tabbed side panel */}
        {activePackage && !activeScenario && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <ScormPlayer
                  packageId={activePackage.id}
                  launchUrl={activePackage.launch_url}
                  title={activePackage.title}
                  onEvent={handleEvent}
                  onClose={handleClose}
                />
              </div>

              {/* Tabbed side panel — desktop */}
              <div className="hidden lg:flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden" style={{ maxHeight: '600px' }}>
                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 shrink-0">
                  <button
                    onClick={() => setSideTab('progress')}
                    className={`flex-1 text-xs font-medium py-2.5 transition ${
                      sideTab === 'progress'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Progress
                  </button>
                  <button
                    onClick={() => setSideTab('ask')}
                    className={`flex-1 text-xs font-medium py-2.5 transition ${
                      sideTab === 'ask'
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    Ask Plato
                  </button>
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden">
                  {sideTab === 'progress' && (
                    <div className="h-full overflow-y-auto">
                      <ScormProgress packageId={activePackage.id} liveEvent={latestEvent} />
                    </div>
                  )}
                  {sideTab === 'ask' && (
                    <ScormChat packageId={activePackage.id} packageTitle={activePackage.title} />
                  )}
                </div>
              </div>

              {/* Progress only on mobile (chat uses bubble) */}
              <div className="lg:hidden">
                <ScormProgress packageId={activePackage.id} liveEvent={latestEvent} />
              </div>
            </div>

            {/* Scenario buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'pre_assessment')}
                disabled={generatingScenario !== null}
                className="text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'pre_assessment' ? 'Generating...' : 'Pre-Assessment'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'quiz')}
                disabled={generatingScenario !== null}
                className="text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'quiz' ? 'Generating...' : 'Quiz Me'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'post_assessment')}
                disabled={generatingScenario !== null}
                className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'post_assessment' ? 'Generating...' : 'Post-Assessment'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'review')}
                disabled={generatingScenario !== null}
                className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'review' ? 'Generating...' : 'Spaced Review'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'myth_buster')}
                disabled={generatingScenario !== null}
                className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'myth_buster' ? 'Generating...' : 'Myth Buster'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'real_world')}
                disabled={generatingScenario !== null}
                className="text-xs bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 px-3 py-1.5 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'real_world' ? 'Generating...' : 'Real-World Scenarios'}
              </button>
              <button
                onClick={() => handleGenerateScenario(activePackage.id, 'concept_match')}
                disabled={generatingScenario !== null}
                className="text-xs bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 px-3 py-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/40 transition font-medium disabled:opacity-40"
              >
                {generatingScenario === 'concept_match' ? 'Generating...' : 'Concept Match'}
              </button>
            </div>

            {/* Mobile chat bubble */}
            <ScormChatBubble packageId={activePackage.id} packageTitle={activePackage.title} />
          </>
        )}

        {/* Package cards */}
        {!activePackage && !activeScenario && packages.length === 0 && !error && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No SCORM packages registered yet. Packages can be added via the API.
            </p>
          </div>
        )}

        {!activePackage && !activeScenario && packages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer"
                onClick={() => setActivePackage(pkg)}
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {pkg.title}
                  </h3>
                  {pkg.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {pkg.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">
                        {pkg.completion_pct}% complete
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {pkg.time_spent}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pkg.completion_pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                    {pkg.duration_mins && <span>{pkg.duration_mins} min</span>}
                    {pkg.module_count > 0 && <span>{pkg.module_count} modules</span>}
                    {pkg.latest_score !== null && (
                      <span className="text-indigo-500">Score: {pkg.latest_score}%</span>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
                    Launch &rarr;
                  </span>
                  <a
                    href={`${process.env.NEXT_PUBLIC_WP_URL || 'http://plato.local'}/scorm-packages/${pkg.slug}/study-guide.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                  >
                    Study Guide ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function ScormPage() {
  return (
    <ProtectedRoute>
      <ScormPageContent />
    </ProtectedRoute>
  );
}
