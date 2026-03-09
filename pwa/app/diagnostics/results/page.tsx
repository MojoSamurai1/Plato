'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import RadarChart from '@/components/diagnostics/RadarChart';
import DimensionCard from '@/components/diagnostics/DimensionCard';
import { diagnostics, type DiagnosticsProfile } from '@/lib/api';

function ResultsContent() {
  const [profile, setProfile] = useState<DiagnosticsProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    diagnostics
      .profile()
      .then((res) => setProfile(res.profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading results...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No diagnostic results found.</p>
          <Link
            href="/diagnostics/take"
            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            Take the Diagnostic
          </Link>
        </div>
      </div>
    );
  }

  const radarValues = [
    { label: 'Self-Efficacy', value: profile.self_efficacy },
    { label: 'Self-Regulation', value: profile.self_regulation },
    { label: 'Learning', value: profile.learning_approach },
    { label: 'Metacognition', value: profile.metacognitive },
    { label: 'Confidence', value: profile.confidence },
  ];

  const dimensionKeys = ['self_efficacy', 'self_regulation', 'learning_approach', 'metacognitive', 'confidence'] as const;
  const scores: Record<string, number> = {
    self_efficacy: profile.self_efficacy,
    self_regulation: profile.self_regulation,
    learning_approach: profile.learning_approach,
    metacognitive: profile.metacognitive,
    confidence: profile.confidence,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <Link href="/diagnostics" className="text-sm text-gray-500 hover:text-indigo-600 transition">
              &larr; Back to Learning Profile
            </Link>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
              Your Learning Profile
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Completed {new Date(profile.completed_at).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
          <Link
            href="/diagnostics/take"
            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            Retake
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Radar Chart */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-4">
            Learning Profile Overview
          </h2>
          <RadarChart values={radarValues} />
        </div>

        {/* Dimension Cards */}
        <div className="space-y-3">
          {dimensionKeys.map((key) => {
            const dim = profile.dimensions?.[key];
            // Filter sub-scores for this dimension.
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

        {/* Interpretation */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            How Plato Uses This
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Your learning profile helps Plato adapt its tutoring style to match how you learn best.
            If you have lower metacognitive awareness, Plato will model thinking strategies more explicitly.
            If you have high test anxiety, Plato will use a more reassuring, low-pressure approach.
            Your profile updates automatically as Plato observes your learning behaviour over time.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function DiagnosticsResultsPage() {
  return (
    <ProtectedRoute>
      <ResultsContent />
    </ProtectedRoute>
  );
}
