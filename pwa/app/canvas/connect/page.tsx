'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { canvas } from '@/lib/api';

function CanvasConnectContent() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await canvas.connect(token.trim());
      setResult(res);
      if (res.success) {
        setToken('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            Connect Canvas
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success state */}
        {result?.success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-6 text-center">
            <div className="text-3xl mb-3">&#10003;</div>
            <h2 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">
              Canvas Connected!
            </h2>
            <p className="text-sm text-green-700 dark:text-green-400 mb-4">
              {result.message}
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {/* Error from sync (token saved but sync failed) */}
        {result && !result.success && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              {result.message}
            </p>
          </div>
        )}

        {/* Form */}
        {!result?.success && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Enter your Canvas Access Token
            </h2>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <p className="font-medium text-gray-700 dark:text-gray-300">
                How to get your token:
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to mylearn.torrens.edu.au</li>
                <li>Go to Account &rarr; Settings</li>
                <li>Scroll to &ldquo;Approved Integrations&rdquo;</li>
                <li>Click &ldquo;+ New Access Token&rdquo;</li>
                <li>Set a purpose (e.g. &ldquo;Plato Tutor&rdquo;) and generate</li>
                <li>Copy the token and paste it below</li>
              </ol>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="canvas-token"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Access Token
                </label>
                <textarea
                  id="canvas-token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  rows={3}
                  placeholder="Paste your Canvas access token here..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !token.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg px-4 py-2.5 transition"
              >
                {loading ? 'Connecting...' : 'Connect Canvas'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default function CanvasConnectPage() {
  return (
    <ProtectedRoute>
      <CanvasConnectContent />
    </ProtectedRoute>
  );
}
