'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuestionRenderer from '@/components/training/QuestionRenderer';
import ScoreDisplay from '@/components/training/ScoreDisplay';
import {
  training,
  type TrainingScenario,
  type TrainingSubmitResponse,
} from '@/lib/api';

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

  function handleAnswerChange(index: number, value: number | string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit() {
    if (!scenario) return;
    setSubmitting(true);
    try {
      const res = await training.submit(scenarioId, answers);
      setResult(res);
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetry() {
    if (!scenario) return;
    setResult(null);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={backUrl}
            className="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition"
          >
            &larr; Scenarios
          </Link>
          <span className="text-xs text-gray-400">{scenario.total_points} points total</span>
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
          <ScoreDisplay
            scorePct={result.score_pct}
            totalPoints={result.total_points}
            maxPoints={result.max_points}
            mcqPoints={result.mcq_points}
            shortAnswerPoints={result.short_answer_points}
            passed={result.passed}
          />
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
              disabled={!!result || submitting}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {!result && (
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
