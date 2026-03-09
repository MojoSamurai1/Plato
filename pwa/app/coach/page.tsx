'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatMessage from '@/components/ChatMessage';
import {
  coach,
  chat,
  courses as coursesApi,
  settings as settingsApi,
  type CoachBrief,
  type Conversation,
  type Message,
  type Course,
} from '@/lib/api';

type View = 'briefs' | 'create' | 'session';

// ─── Brief Card ──────────────────────────────────────────────────────────────

function BriefCard({
  brief,
  onOpen,
  onDelete,
}: {
  brief: CoachBrief;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:border-indigo-300 dark:hover:border-indigo-700 transition group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="inline-block text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 rounded px-2 py-0.5 mb-2">
            {brief.subject_code}
          </span>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {brief.assessment_name || brief.title}
          </h3>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1"
          title="Delete brief"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
        {brief.word_limit && <span>{brief.word_limit} words</span>}
        {brief.weighting && <span>{brief.weighting}</span>}
      </div>
      <button
        onClick={onOpen}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
      >
        Start Coaching Session
      </button>
    </div>
  );
}

// ─── Create Brief Form ──────────────────────────────────────────────────────

function CreateBriefForm({
  courseList,
  onCreated,
  onCancel,
}: {
  courseList: Course[];
  onCreated: (brief: CoachBrief) => void;
  onCancel: () => void;
}) {
  const [subjectCode, setSubjectCode] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [briefContent, setBriefContent] = useState('');
  const [rubricContent, setRubricContent] = useState('');
  const [wordLimit, setWordLimit] = useState('');
  const [weighting, setWeighting] = useState('');
  const [courseId, setCourseId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!briefContent.trim()) {
      setError('Please paste the assignment brief content.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = await coach.createBrief({
        subject_code: subjectCode,
        assessment_name: assessmentName,
        brief_content: briefContent,
        rubric_content: rubricContent || undefined,
        word_limit: wordLimit ? parseInt(wordLimit) : undefined,
        weighting: weighting || undefined,
        course_id: courseId || undefined,
      });
      onCreated(res.brief);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save brief');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Add Assignment Brief
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Cancel
        </button>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Paste the assignment brief and rubric below. Plato will use this to coach you through your work
        without doing it for you.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Subject Code
          </label>
          <input
            type="text"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
            placeholder="e.g., MKT105"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assessment Name
          </label>
          <input
            type="text"
            value={assessmentName}
            onChange={(e) => setAssessmentName(e.target.value)}
            placeholder="e.g., SWOT Analysis Report"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Word Limit
          </label>
          <input
            type="number"
            value={wordLimit}
            onChange={(e) => setWordLimit(e.target.value)}
            placeholder="750"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Weighting
          </label>
          <input
            type="text"
            value={weighting}
            onChange={(e) => setWeighting(e.target.value)}
            placeholder="30%"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course (optional)
          </label>
          <select
            value={courseId ?? ''}
            onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">None</option>
            {courseList.map((c) => (
              <option key={c.id} value={c.id}>{c.course_code}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Assignment Brief *
        </label>
        <textarea
          value={briefContent}
          onChange={(e) => setBriefContent(e.target.value)}
          placeholder="Paste the full assignment brief here — instructions, requirements, learning outcomes..."
          rows={8}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Rubric (optional but recommended)
        </label>
        <textarea
          value={rubricContent}
          onChange={(e) => setRubricContent(e.target.value)}
          placeholder="Paste the assessment rubric here — grading criteria, HD/D/C/P/F descriptions..."
          rows={6}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-lg px-5 py-3 transition"
      >
        {saving ? 'Saving...' : 'Save Brief & Start Coaching'}
      </button>
    </form>
  );
}

// ─── Coaching Session ────────────────────────────────────────────────────────

function CoachingSession({
  brief,
  initialConversation,
  initialMessages,
  onBack,
}: {
  brief: CoachBrief;
  initialConversation: Conversation;
  initialMessages: Message[];
  onBack: () => void;
}) {
  const [conversation, setConversation] = useState(initialConversation);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [showBrief, setShowBrief] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || streaming) return;

    setInput('');

    const userMsg: Message = {
      id: Date.now(),
      conversation_id: conversation.id,
      role: 'user',
      content,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setStreaming(true);
    setStreamContent('');
    let fullResponse = '';

    abortRef.current = chat.streamMessage(
      conversation.id,
      content,
      (chunk) => {
        fullResponse += chunk;
        setStreamContent(fullResponse);
      },
      () => {
        setStreaming(false);
        if (fullResponse) {
          const assistantMsg: Message = {
            id: Date.now() + 1,
            conversation_id: conversation.id,
            role: 'assistant',
            content: fullResponse,
            tokens_used: null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamContent('');
        }
      },
      (error) => {
        setStreaming(false);
        setStreamContent('');
        const errorMsg: Message = {
          id: Date.now() + 1,
          conversation_id: conversation.id,
          role: 'assistant',
          content: `Sorry, I hit an error: ${error}`,
          tokens_used: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    );
  }

  const quickPrompts = [
    'Here is my draft so far — please review it against the rubric:',
    'What does the rubric say I need for a High Distinction?',
    'Can you check my introduction meets the requirements?',
    'What sections am I missing?',
    'How is my referencing — do I have enough sources?',
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {brief.subject_code} — {brief.assessment_name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {brief.word_limit && <span>{brief.word_limit} words</span>}
            {brief.weighting && <span>{brief.weighting}</span>}
            <span className="text-amber-600 dark:text-amber-400 font-medium">Assignment Coach</span>
          </div>
        </div>

        <button
          onClick={() => setShowBrief(!showBrief)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition font-medium ${
            showBrief
              ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
              : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {showBrief ? 'Hide Brief' : 'View Brief'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Brief Panel (collapsible) */}
        {showBrief && (
          <aside className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
              Assignment Brief
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mb-6">
              {brief.brief_content}
            </div>
            {brief.rubric_content && (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Rubric
                </h3>
                <div className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                  {brief.rubric_content}
                </div>
              </>
            )}
          </aside>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="text-4xl mb-4">&#x1F393;</div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Assignment Coach
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
                  I&apos;ve loaded your assignment brief and rubric for <strong>{brief.subject_code}</strong>.
                  Paste your draft work and I&apos;ll review it against the rubric. I&apos;ll give you specific
                  feedback to improve your grade — but I won&apos;t write it for you!
                </p>

                <div className="w-full max-w-md space-y-2">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick start:</p>
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(prompt)}
                      className="w-full text-left text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {streaming && streamContent && (
              <ChatMessage
                message={{ role: 'assistant', content: streamContent }}
                isStreaming
              />
            )}

            {streaming && !streamContent && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <form onSubmit={handleSend} className="flex gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Paste your draft work here for review, or ask a question about the assignment..."
                disabled={streaming}
                rows={2}
                className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:opacity-50 resize-y min-h-[48px]"
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                className="self-end bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl px-5 py-3 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </form>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              Plato reviews your work and gives feedback — it will never write your assignment for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Coach Page ─────────────────────────────────────────────────────────

function CoachContent() {
  const [view, setView] = useState<View>('briefs');
  const [briefs, setBriefs] = useState<CoachBrief[]>([]);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [llmConfigured, setLlmConfigured] = useState(true);

  // Session state
  const [activeBrief, setActiveBrief] = useState<CoachBrief | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [startingSession, setStartingSession] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const [briefsRes, coursesRes, llmRes] = await Promise.all([
          coach.listBriefs(),
          coursesApi.list(),
          settingsApi.getLLM(),
        ]);
        setBriefs(briefsRes.briefs);
        setCourseList(coursesRes.courses);
        setLlmConfigured(llmRes.configured);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleStartSession(briefId: number) {
    setStartingSession(briefId);
    try {
      const res = await coach.startSession(briefId);
      setActiveBrief(res.brief);
      setActiveConversation(res.conversation);
      setActiveMessages(res.messages);
      setView('session');
    } catch (err) {
      console.error('Failed to start session:', err);
    } finally {
      setStartingSession(null);
    }
  }

  async function handleDeleteBrief(briefId: number) {
    try {
      await coach.deleteBrief(briefId);
      setBriefs((prev) => prev.filter((b) => b.id !== briefId));
    } catch {
      // handled
    }
  }

  function handleBriefCreated(brief: CoachBrief) {
    setBriefs((prev) => [brief, ...prev]);
    handleStartSession(brief.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!llmConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Set up your AI provider first
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Plato needs an API key to power the Assignment Coach.
          </p>
          <Link
            href="/settings"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg px-5 py-2.5 transition"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  // ─── Session View ───────────────────────────────────────────────────────────
  if (view === 'session' && activeBrief && activeConversation) {
    return (
      <CoachingSession
        brief={activeBrief}
        initialConversation={activeConversation}
        initialMessages={activeMessages}
        onBack={() => setView('briefs')}
      />
    );
  }

  // ─── Create View ────────────────────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <CreateBriefForm
          courseList={courseList}
          onCreated={handleBriefCreated}
          onCancel={() => setView('briefs')}
        />
      </div>
    );
  }

  // ─── Briefs List View ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Assignment Coach
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Plato reviews your work and coaches you to a better grade — without doing the work for you.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            &larr; Dashboard
          </Link>
        </div>

        <button
          onClick={() => setView('create')}
          className="w-full bg-white dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-600 transition group mb-6"
        >
          <div className="text-2xl mb-2">+</div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
            Add New Assignment Brief
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Paste your assignment brief and rubric to start a coaching session
          </p>
        </button>

        {briefs.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {briefs.map((brief) => (
              <BriefCard
                key={brief.id}
                brief={brief}
                onOpen={() => handleStartSession(brief.id)}
                onDelete={() => handleDeleteBrief(brief.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">&#x1F393;</div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No assignment briefs yet. Add one to get started!
            </p>
          </div>
        )}

        {startingSession && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 text-center">
              <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300">Starting coaching session...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CoachPage() {
  return (
    <ProtectedRoute>
      <CoachContent />
    </ProtectedRoute>
  );
}
