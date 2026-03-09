'use client';

import { useState, useCallback } from 'react';
import { scorm, type ScormScenario as ScormScenarioType } from '@/lib/api';

interface ScormScenarioProps {
  scenario: ScormScenarioType;
  onClose: () => void;
}

interface FeedbackItem {
  question_index: number;
  type: string;
  correct?: boolean;
  correct_option?: number;
  correct_answer?: boolean;
  chosen?: number | boolean | number[];
  score?: number;
  correct_count?: number;
  total_pairs?: number;
  total_items?: number;
  scenario_context?: string;
  explanation: string;
}

// Answer can be: number (mcq/scenario_judgment index), string (short_answer/true_false),
// number[] (matching/ordering), or null
type Answer = number | string | number[] | null;

export default function ScormScenario({ scenario, onClose }: ScormScenarioProps) {
  const [answers, setAnswers] = useState<Answer[]>(
    scenario.questions.map((q) => {
      if (q.type === 'matching' && q.pairs) return q.pairs.map(() => -1);
      if (q.type === 'ordering' && q.items) return q.items.map((_, i) => i);
      return null;
    })
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    total: number;
    feedback: FeedbackItem[];
  } | null>(null);
  const [error, setError] = useState('');

  function handleMCQAnswer(qIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = optionIndex;
      return next;
    });
  }

  function handleTextAnswer(qIndex: number, text: string) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = text;
      return next;
    });
  }

  function handleTrueFalseAnswer(qIndex: number, value: boolean) {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = value ? 'true' : 'false';
      return next;
    });
  }

  function handleMatchingAnswer(qIndex: number, termIndex: number, defIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      const current = [...(next[qIndex] as number[])];
      current[termIndex] = defIndex;
      next[qIndex] = current;
      return next;
    });
  }

  const handleOrderingSwap = useCallback((qIndex: number, fromPos: number, toPos: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      const current = [...(next[qIndex] as number[])];
      const temp = current[fromPos];
      current[fromPos] = current[toPos];
      current[toPos] = temp;
      next[qIndex] = current;
      return next;
    });
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const res = await scorm.submitScenario(scenario.id, answers as (number | string | null)[]);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = answers.every((a) => {
    if (a === null || a === '') return false;
    if (Array.isArray(a)) return a.every((v) => v !== -1);
    return true;
  });

  const typeLabels: Record<string, string> = {
    pre_assessment: 'Pre-Assessment',
    quiz: 'Quiz',
    walkthrough: 'Guided Walkthrough',
    post_assessment: 'Post-Assessment',
    review: 'Spaced Review',
    myth_buster: 'Myth Buster',
    real_world: 'Real-World Scenarios',
    concept_match: 'Concept Match',
  };

  const typeColors: Record<string, string> = {
    myth_buster: 'text-rose-500',
    real_world: 'text-teal-500',
    concept_match: 'text-violet-500',
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <span className={`text-[10px] font-medium uppercase tracking-wide ${typeColors[scenario.type] || 'text-indigo-500'}`}>
            {typeLabels[scenario.type] || scenario.type}
          </span>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {scenario.title}
          </h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`px-4 py-3 ${result.score >= 70 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm font-semibold ${result.score >= 70 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              Score: {result.score.toFixed(0)}%
            </p>
            <p className="text-xs text-gray-500">
              {result.score >= 70 ? 'Great work!' : 'Keep practicing — review the explanations below.'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-2">
          <p className="text-xs text-red-500">{error}</p>
        </div>
      )}

      {/* Questions */}
      <div className="p-4 space-y-6">
        {scenario.questions.map((q, qIndex) => {
          const fb = result?.feedback?.find((f) => f.question_index === qIndex);

          return (
            <div key={qIndex} className="space-y-3">
              {/* Scenario context for scenario_judgment */}
              {q.type === 'scenario_judgment' && q.scenario_context && (
                <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2">
                  <p className="text-[10px] font-medium text-teal-600 uppercase tracking-wide mb-1">Scenario</p>
                  <p className="text-xs text-teal-800 dark:text-teal-200">{q.scenario_context}</p>
                </div>
              )}

              <p className="text-sm text-gray-800 dark:text-gray-200">
                <span className="text-gray-400 mr-2">{qIndex + 1}.</span>
                {q.question}
              </p>

              {/* MCQ + Scenario Judgment — same rendering, different framing */}
              {(q.type === 'mcq' || q.type === 'scenario_judgment') && q.options && (
                <div className="space-y-2 ml-4">
                  {q.options.map((opt, oIndex) => {
                    const selected = answers[qIndex] === oIndex;
                    let optionClass = 'border-gray-200 dark:border-gray-700';

                    if (fb) {
                      if (oIndex === fb.correct_option) {
                        optionClass = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
                      } else if (selected && !fb.correct) {
                        optionClass = 'border-red-400 bg-red-50 dark:bg-red-900/20';
                      }
                    } else if (selected) {
                      optionClass = q.type === 'scenario_judgment'
                        ? 'border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20';
                    }

                    return (
                      <button
                        key={oIndex}
                        type="button"
                        onClick={() => !result && handleMCQAnswer(qIndex, oIndex)}
                        disabled={result !== null}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg border transition ${optionClass} ${
                          !result ? 'hover:border-indigo-300 cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        <span className="text-gray-400 mr-2">{String.fromCharCode(65 + oIndex)}.</span>
                        <span className="text-gray-700 dark:text-gray-300">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True/False */}
              {q.type === 'true_false' && (
                <div className="flex gap-3 ml-4">
                  {[true, false].map((val) => {
                    const selected = answers[qIndex] === (val ? 'true' : 'false');
                    let btnClass = 'border-gray-200 dark:border-gray-700';

                    if (fb) {
                      const correctVal = fb.correct_answer;
                      if (val === correctVal) {
                        btnClass = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
                      } else if (selected && !fb.correct) {
                        btnClass = 'border-red-400 bg-red-50 dark:bg-red-900/20';
                      }
                    } else if (selected) {
                      btnClass = 'border-rose-400 bg-rose-50 dark:bg-rose-900/20';
                    }

                    return (
                      <button
                        key={String(val)}
                        type="button"
                        onClick={() => !result && handleTrueFalseAnswer(qIndex, val)}
                        disabled={result !== null}
                        className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-lg border transition ${btnClass} ${
                          !result ? 'hover:border-rose-300 cursor-pointer' : 'cursor-default'
                        }`}
                      >
                        {val ? 'True' : 'False'}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Matching */}
              {q.type === 'matching' && q.pairs && (
                <div className="ml-4 space-y-2">
                  {q.pairs.map(([term], tIdx) => {
                    const currentAnswer = (answers[qIndex] as number[])?.[tIdx] ?? -1;
                    const isCorrect = fb && currentAnswer === tIdx;
                    const isWrong = fb && currentAnswer !== tIdx && currentAnswer !== -1;

                    // Shuffle definitions for display (use pairs in original order as options)
                    return (
                      <div key={tIdx} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 min-w-[120px]">
                          {term}
                        </span>
                        <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <select
                          value={currentAnswer}
                          onChange={(e) => !result && handleMatchingAnswer(qIndex, tIdx, parseInt(e.target.value))}
                          disabled={result !== null}
                          className={`flex-1 text-xs border rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 outline-none transition ${
                            isCorrect ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                            isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
                            'border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          <option value={-1}>Select a match...</option>
                          {q.pairs!.map(([, def], dIdx) => (
                            <option key={dIdx} value={dIdx}>{def}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                  {fb && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {fb.correct_count}/{fb.total_pairs} correct matches
                    </p>
                  )}
                </div>
              )}

              {/* Ordering */}
              {q.type === 'ordering' && q.items && (
                <div className="ml-4 space-y-1">
                  {(answers[qIndex] as number[])?.map((itemIdx, pos) => {
                    const isCorrect = fb && itemIdx === pos;
                    const isWrong = fb && itemIdx !== pos;

                    return (
                      <div
                        key={pos}
                        className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition ${
                          isCorrect ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' :
                          isWrong ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
                          'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <span className="text-gray-400 font-mono text-[10px] w-4">{pos + 1}.</span>
                        <span className="flex-1 text-gray-700 dark:text-gray-300">{q.items![itemIdx]}</span>
                        {!result && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => pos > 0 && handleOrderingSwap(qIndex, pos, pos - 1)}
                              disabled={pos === 0}
                              className="text-gray-400 hover:text-indigo-500 disabled:opacity-20 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => pos < q.items!.length - 1 && handleOrderingSwap(qIndex, pos, pos + 1)}
                              disabled={pos === q.items!.length - 1}
                              className="text-gray-400 hover:text-indigo-500 disabled:opacity-20 transition"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {fb && (
                    <p className="text-[10px] text-gray-500 mt-1">
                      {fb.correct_count}/{fb.total_items} in correct position
                    </p>
                  )}
                </div>
              )}

              {/* Short Answer */}
              {q.type === 'short_answer' && (
                <textarea
                  value={(answers[qIndex] as string) || ''}
                  onChange={(e) => handleTextAnswer(qIndex, e.target.value)}
                  disabled={result !== null}
                  placeholder="Type your answer..."
                  rows={3}
                  className="w-full ml-4 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60 resize-none"
                />
              )}

              {/* Feedback */}
              {fb && fb.explanation && (
                <div className="ml-4 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700">
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">Explanation</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{fb.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="text-xs text-gray-500 hover:text-gray-700 transition px-3 py-1.5"
        >
          {result ? 'Close' : 'Cancel'}
        </button>
        {!result && (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg transition font-medium"
          >
            {submitting ? 'Checking...' : 'Submit Answers'}
          </button>
        )}
      </div>
    </div>
  );
}
