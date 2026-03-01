'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuestionRenderer from '@/components/training/QuestionRenderer';
import ScoreDisplay from '@/components/training/ScoreDisplay';
import QuizTimer from '@/components/training/QuizTimer';
import {
  training,
  type TrainingScenario,
  type TrainingSubmitResponse,
} from '@/lib/api';

const SECONDS_PER_QUESTION = 90;

function QuizContent() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.courseId);
  const moduleName = decodeURIComponent(params.moduleName as string);
  const scenarioId = Number(params.scenarioId);

  const [scenario, setScenario] = useState<TrainingScenario | null>(null);
  const [answers, setAnswers] = useState<(number | string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TrainingSubmitResponse | null>(null);
  const [timeExpired, setTimeExpired] = useState(false);

  useEffect(() => {
    training
      .scenarios(courseId, moduleName)
      .then((res) => {
        const found = res.scenarios?.find((s) => s.id === scenarioId);
        if (found) {
          setScenario(found);
          setAnswers(new Array(found.questions.length).fill(null));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName, scenarioId]);

  async function doSubmit(answersToSubmit: (number | string | null)[]) {
    if (!scenario || submitting) return;
    setSubmitting(true);
    try {
      const res = await training.submit(scenarioId, answersToSubmit);
      setResult(res);
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  }

  const handleTimerExpire = useCallback(() => {
    setTimeExpired(true);
    // Auto-submit with whatever has been answered
    setAnswers((currentAnswers) => {
      // Use timeout to avoid calling doSubmit during state update
      setTimeout(() => doSubmit(currentAnswers), 0);
      return currentAnswers;
    });
  }, [scenario, submitting]);

  function handleAnswerChange(index: number, value: number | string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleSubmit() {
    doSubmit(answers);
  }

  function handleRetry() {
    if (!scenario) return;
    setResult(null);
    setTimeExpired(false);
    setAnswers(new Array(scenario.questions.length).fill(null));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading scenario...</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-sm">Scenario not found.</div>
      </div>
    );
  }

  const backUrl = `/training/${courseId}/${encodeURIComponent(moduleName)}`;
  const allAnswered = answers.every((a) => a !== null && a !== '');
  const totalSeconds = scenario.questions.length * SECONDS_PER_QUESTION;
  const timerPaused = !!result || submitting;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky header with timer */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <Link
              href={backUrl}
              className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
            >
              &larr; Scenarios
            </Link>
            <span className="text-xs text-gray-400">{scenario.total_points} points total</span>
          </div>
          {!result && (
            <QuizTimer
              totalSeconds={totalSeconds}
              paused={timerPaused}
              onExpire={handleTimerExpire}
            />
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Scenario context */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            {scenario.title}
          </h2>
          <p className="text-sm text-gray-700 dark:text-gray-300">{scenario.context}</p>
        </div>

        {/* Score display (after submit) */}
        {result && (
          <>
            <ScoreDisplay
              scorePct={result.score_pct}
              totalPoints={result.total_points}
              maxPoints={result.max_points}
              mcqPoints={result.mcq_points}
              shortAnswerPoints={result.short_answer_points}
              passed={result.passed}
            />
            {timeExpired && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Time expired — unanswered questions scored as 0 points.
              </div>
            )}
          </>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {scenario.questions.map((q, i) => (
            <QuestionRenderer
              key={i}
              question={q}
              index={i}
              value={answers[i]}
              onChange={(val) => handleAnswerChange(i, val)}
              feedback={result?.feedback?.[i]}
              disabled={!!result || submitting || timeExpired}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!result && !timeExpired && (
            <button
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-lg px-5 py-3 transition"
            >
              {submitting ? 'Plato is reviewing your answers...' : 'Submit Answers'}
            </button>
          )}

          {result && !result.passed && (
            <button
              onClick={handleRetry}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-3 transition"
            >
              Try Again
            </button>
          )}

          {result && result.passed && (
            <button
              onClick={() => router.push(backUrl)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg px-5 py-3 transition"
            >
              Back to Module
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <ProtectedRoute>
      <QuizContent />
    </ProtectedRoute>
  );
}
