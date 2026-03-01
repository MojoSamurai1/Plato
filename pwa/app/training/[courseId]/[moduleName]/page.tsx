'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import ScenarioCard from '@/components/training/ScenarioCard';
import MasteryBadge from '@/components/training/MasteryBadge';
import ProgressBar from '@/components/training/ProgressBar';
import ModuleSummarySection from '@/components/training/ModuleSummarySection';
import LearningOutcomesSection from '@/components/training/LearningOutcomesSection';
import TrainingConversation from '@/components/training/TrainingConversation';
import { training, type TrainingScenario } from '@/lib/api';

// ─── Sample Scenario (always visible as a guide) ───────────────────────────

const SAMPLE_SCENARIO: TrainingScenario = {
  id: -1,
  scenario_index: 0,
  title: 'Sample Assessment — What to Expect',
  context:
    'This is an example of what an assessment looks like. Each assessment presents a realistic situation related to your module content, then asks you 5 questions: 4 multiple-choice (10 pts each) and 1 short-answer (10 pts). You need 90% to pass. Click "Start" on a real assessment to begin!',
  questions: [
    { type: 'mcq', question: 'Example multiple-choice question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], points: 10 },
    { type: 'mcq', question: 'Another multiple-choice question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], points: 10 },
    { type: 'mcq', question: 'A third multiple-choice question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], points: 10 },
    { type: 'mcq', question: 'A fourth multiple-choice question?', options: ['Option A', 'Option B', 'Option C', 'Option D'], points: 10 },
    { type: 'short_answer', question: 'Example short-answer: explain in your own words...', points: 10 },
  ],
  total_points: 50,
  best_score: null,
  passed: false,
  attempt_count: 0,
  created_at: new Date().toISOString(),
};

function ModuleDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = Number(params.courseId);
  const moduleName = decodeURIComponent(params.moduleName as string);

  const [scenarios, setScenarios] = useState<TrainingScenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const generationTriggered = useRef(false);

  // Load existing scenarios
  useEffect(() => {
    training
      .scenarios(courseId, moduleName)
      .then((res) => setScenarios(res.scenarios ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName]);

  // Auto-trigger generation if ?generate=true
  useEffect(() => {
    if (searchParams.get('generate') === 'true' && !generationTriggered.current && !loading) {
      generationTriggered.current = true;
      if (scenarios.length === 0) {
        handleGenerate();
      }
      // Clean URL
      router.replace(`/training/${courseId}/${encodeURIComponent(moduleName)}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on load/search change, not on handler recreation
  }, [searchParams, loading, scenarios.length]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await training.generate(courseId, moduleName);
      setScenarios(res.scenarios ?? []);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Failed to generate assessments');
    } finally {
      setGenerating(false);
    }
  }

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
            Pass all assessments with 90% or higher to master this module.
          </p>
        </div>

        {/* Module Summary (collapsible) */}
        <ModuleSummarySection courseId={courseId} moduleName={moduleName} />

        {/* Learning Outcomes */}
        <LearningOutcomesSection courseId={courseId} moduleName={moduleName} />

        {/* Training Conversation */}
        <TrainingConversation courseId={courseId} moduleName={moduleName} />

        {/* Generation progress */}
        {generating && (
          <div className="bg-white dark:bg-gray-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating assessments from your course content...
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Plato is reading your module content and creating practice assessments. This usually takes 30-60 seconds.
            </p>
            <div className="w-full h-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-[indeterminate_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* Generation error */}
        {generateError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-400">{generateError}</p>
            <button
              onClick={handleGenerate}
              className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 px-3 py-1.5 rounded-lg transition font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Scenarios section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" />
              </svg>
              Assessments
            </h3>
            {!generating && scenarios.length === 0 && (
              <button
                onClick={handleGenerate}
                className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg transition font-medium"
              >
                Generate Assessments
              </button>
            )}
          </div>

          {total > 0 && (
            <ProgressBar passed={passed} total={total} />
          )}
        </div>

        {/* Scenario cards — real ones first, then sample guide */}
        <div className="space-y-4">
          {scenarios.length > 0 && (
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
          )}

          {scenarios.length === 0 && !generating && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No assessments yet. Click &ldquo;Generate Assessments&rdquo; to create practice exercises from your module content.
            </p>
          )}

          {/* Sample scenario — always visible as a guide */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide font-medium">
              Example — What an assessment looks like
            </p>
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 opacity-75">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {SAMPLE_SCENARIO.title}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  Demo
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {SAMPLE_SCENARIO.context}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{SAMPLE_SCENARIO.total_points} points &middot; {SAMPLE_SCENARIO.questions.length} questions</span>
                <span>4 MCQ + 1 Short Answer</span>
              </div>
            </div>
          </div>
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
