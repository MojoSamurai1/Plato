'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import LikertScale from '@/components/diagnostics/LikertScale';
import { diagnostics, type DiagnosticsQuestion, type DiagnosticsDimension } from '@/lib/api';

const DIMENSION_ORDER = ['self_efficacy', 'self_regulation', 'learning_approach', 'metacognitive', 'confidence'];

const STEP_LABELS = ['Self-Efficacy', 'Self-Regulation', 'Learning Approach', 'Metacognition', 'Confidence'];

function TakeContent() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DiagnosticsQuestion[]>([]);
  const [dimensions, setDimensions] = useState<Record<string, DiagnosticsDimension>>({});
  const [version, setVersion] = useState(1);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    diagnostics
      .questions()
      .then((res) => {
        setQuestions(res.questions);
        setDimensions(res.dimensions);
        setVersion(res.version);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const currentDimension = DIMENSION_ORDER[step];
  const stepQuestions = questions.filter((q) => q.dimension === currentDimension);
  const dimensionInfo = dimensions[currentDimension];

  const allStepAnswered = stepQuestions.every((q) => answers[q.id] != null);
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  function handleAnswer(questionId: string, value: number) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      await diagnostics.submit(answers, version);
      router.push('/diagnostics/results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading questionnaire...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/diagnostics" className="text-sm text-gray-500 hover:text-indigo-600 transition">
            &larr; Back to Learning Profile
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
            Discover How You Learn
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {answeredCount} of {totalQuestions} questions answered
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Progress steps */}
        <div className="flex items-center gap-1">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  i < step ? 'bg-indigo-600' : i === step ? 'bg-indigo-400' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
              <span className={`text-[10px] mt-1 block ${
                i === step ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-400'
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Dimension header */}
        {dimensionInfo && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              {dimensionInfo.label}
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {dimensionInfo.description}
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {stepQuestions.map((q, i) => (
            <div key={q.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-800 dark:text-gray-200 mb-4">
                <span className="text-gray-400 mr-2">{i + 1}.</span>
                {q.text}
              </p>
              <LikertScale
                questionId={q.id}
                value={answers[q.id] ?? null}
                onChange={handleAnswer}
              />
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 disabled:opacity-30 transition"
          >
            &larr; Back
          </button>

          {step < DIMENSION_ORDER.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              disabled={!allStepAnswered}
              className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition font-medium"
            >
              Next &rarr;
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allStepAnswered || submitting}
              className="px-6 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition font-medium"
            >
              {submitting ? 'Analysing...' : 'Submit & See Results'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DiagnosticsTakePage() {
  return (
    <ProtectedRoute>
      <TakeContent />
    </ProtectedRoute>
  );
}
