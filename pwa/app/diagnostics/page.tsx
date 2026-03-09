'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import RadarChart from '@/components/diagnostics/RadarChart';
import DimensionCard from '@/components/diagnostics/DimensionCard';
import { diagnostics, type DiagnosticsProfile, type LearnerSignals } from '@/lib/api';
import { getUser } from '@/lib/auth';

function DiagnosticsContent() {
  const user = getUser();
  const [profile, setProfile] = useState<DiagnosticsProfile | null>(null);
  const [signals, setSignals] = useState<LearnerSignals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diagnostics
      .profile()
      .then((res) => {
        setProfile(res.profile);
        setSignals(res.signals);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const hasProfile = profile !== null;

  const radarValues = hasProfile
    ? [
        { label: 'Self-Efficacy', value: profile.self_efficacy },
        { label: 'Self-Regulation', value: profile.self_regulation },
        { label: 'Learning', value: profile.learning_approach },
        { label: 'Metacognition', value: profile.metacognitive },
        { label: 'Confidence', value: profile.confidence },
      ]
    : [];

  const dimensionKeys = ['self_efficacy', 'self_regulation', 'learning_approach', 'metacognitive', 'confidence'] as const;
  const scores: Record<string, number> = hasProfile
    ? {
        self_efficacy: profile.self_efficacy,
        self_regulation: profile.self_regulation,
        learning_approach: profile.learning_approach,
        metacognitive: profile.metacognitive,
        confidence: profile.confidence,
      }
    : {};

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Plato</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Learning Profile — {user?.display_name || 'Student'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
              Dashboard
            </Link>
            <Link href="/chat" className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg transition font-medium">
              Ask Plato
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 transition">
          &larr; Back to Dashboard
        </Link>

        {!hasProfile ? (
          /* No profile — CTA */
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🧠</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Discover How You Learn
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Take a 5-minute evidence-based questionnaire and Plato will personalise its tutoring
              to match your learning style, motivation, and confidence levels.
            </p>
            <Link
              href="/diagnostics/take"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-6 py-3 transition"
            >
              Start Learning Diagnostic
            </Link>
            <p className="text-[10px] text-gray-400 mt-4">
              Based on MSLQ, MAI, and R-SPQ-2F research instruments
            </p>
          </div>
        ) : (
          <>
            {/* Stale banner */}
            {profile.stale && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-center justify-between">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Your learning profile may be outdated. Consider retaking the diagnostic.
                </p>
                <Link
                  href="/diagnostics/take"
                  className="text-xs font-medium text-amber-600 hover:text-amber-800 transition"
                >
                  Retake
                </Link>
              </div>
            )}

            {/* Radar chart */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Learning Profile Overview
                </h2>
                <Link
                  href="/diagnostics/take"
                  className="text-xs text-gray-400 hover:text-indigo-600 transition"
                >
                  Retake &rarr;
                </Link>
              </div>
              <RadarChart values={radarValues} />
            </div>

            {/* Dimension cards */}
            <div className="space-y-3">
              {dimensionKeys.map((key) => {
                const dim = profile.dimensions?.[key];
                const subScores: Record<string, number> = {};
                for (const [subKey, val] of Object.entries(profile.dimension_detail || {})) {
                  if (subKey.startsWith(key + '.')) {
                    subScores[subKey] = val;
                  }
                }
                return (
                  <DimensionCard
                    key={key}
                    dimensionKey={key}
                    label={dim?.label || key}
                    description={dim?.description || ''}
                    score={scores[key]}
                    subScores={subScores}
                  />
                );
              })}
            </div>

            {/* Shadow signals */}
            {signals && signals.total_interactions > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Behavioral Insights
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  Inferred from {signals.total_interactions} interactions with Plato
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {signals.calibration_gap !== null && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Calibration</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {signals.calibration_gap > 0.5
                          ? 'Overconfident'
                          : signals.calibration_gap < -0.5
                          ? 'Underconfident'
                          : 'Well-calibrated'}
                      </p>
                    </div>
                  )}
                  {signals.help_seeking_rate !== null && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Help-Seeking</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {signals.help_seeking_rate < 0.1 ? 'Low' : signals.help_seeking_rate > 0.5 ? 'High' : 'Moderate'}
                      </p>
                    </div>
                  )}
                  {signals.session_consistency !== null && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Consistency</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {signals.session_consistency >= 0.7 ? 'Regular' : signals.session_consistency >= 0.4 ? 'Moderate' : 'Irregular'}
                      </p>
                    </div>
                  )}
                  {signals.wheel_spin_count > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">Wheel-Spinning</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mt-1">
                        {signals.wheel_spin_count} detected
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default function DiagnosticsPage() {
  return (
    <ProtectedRoute>
      <DiagnosticsContent />
    </ProtectedRoute>
  );
}
