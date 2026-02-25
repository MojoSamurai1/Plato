'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { settings as settingsApi } from '@/lib/api';

function SettingsContent() {
  const [provider, setProvider] = useState<'openai' | 'anthropic'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [configured, setConfigured] = useState(false);
  const [currentProvider, setCurrentProvider] = useState('');
  const [currentModel, setCurrentModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await settingsApi.getLLM();
        setConfigured(res.configured);
        setCurrentProvider(res.provider);
        setCurrentModel(res.model);
        setProvider(res.provider);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await settingsApi.saveLLM({
        provider,
        api_key: apiKey,
        model: model || undefined,
      });
      setConfigured(true);
      setCurrentProvider(res.provider);
      setCurrentModel(res.model);
      setApiKey('');
      setSuccess('AI provider configured successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Current status */}
        {configured && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              AI configured: <strong>{currentProvider}</strong> using <strong>{currentModel}</strong>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI Provider
          </h2>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Plato uses an AI provider to power the Socratic Tutor. Choose OpenAI or Anthropic and enter your API key.
          </p>

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-lg p-3 mb-4">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Provider selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setProvider('openai')}
                  className={`p-3 rounded-lg border text-sm font-medium text-center transition ${
                    provider === 'openai'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  OpenAI
                  <span className="block text-xs font-normal mt-0.5 opacity-70">GPT-4o / GPT-4o-mini</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('anthropic')}
                  className={`p-3 rounded-lg border text-sm font-medium text-center transition ${
                    provider === 'anthropic'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                  }`}
                >
                  Anthropic
                  <span className="block text-xs font-normal mt-0.5 opacity-70">Claude Sonnet / Haiku</span>
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key {configured && <span className="text-gray-400">(enter a new key to update)</span>}
              </label>
              <input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* Model override (optional) */}
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model <span className="text-gray-400">(optional — leave blank for default)</span>
              </label>
              <input
                id="model"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider === 'openai' ? 'gpt-4o-mini' : 'claude-sonnet-4-20250514'}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !apiKey.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg px-4 py-2.5 transition"
            >
              {saving ? 'Saving...' : configured ? 'Update Provider' : 'Save Provider'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
