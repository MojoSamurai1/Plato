'use client';

import { useEffect, useState, useRef, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import ChatMessage from '@/components/ChatMessage';
import {
  chat,
  courses as coursesApi,
  settings as settingsApi,
  type Conversation,
  type Message,
  type Course,
} from '@/lib/api';

type ChatMode = 'socratic' | 'eli5';

function ChatContent() {
  // ─── State ───────────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [mode, setMode] = useState<ChatMode>('socratic');
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [llmConfigured, setLlmConfigured] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ─── Load initial data ───────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        const [convRes, coursesRes, llmRes] = await Promise.all([
          chat.listConversations(),
          coursesApi.list(),
          settingsApi.getLLM(),
        ]);
        setConversations(convRes.conversations);
        setCourseList(coursesRes.courses);
        setLlmConfigured(llmRes.configured);
      } catch {
        // handled by api.ts
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // ─── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  // ─── Load conversation ───────────────────────────────────────────────────
  async function loadConversation(id: number) {
    try {
      const res = await chat.getConversation(id);
      setActiveConv(res.conversation);
      setMessages(res.messages);
      setMode(res.conversation.mode as ChatMode);
      setSelectedCourse(res.conversation.course_id ? Number(res.conversation.course_id) : null);
      setSidebarOpen(false);
    } catch {
      // handled
    }
  }

  // ─── New conversation ────────────────────────────────────────────────────
  async function startNewConversation() {
    setActiveConv(null);
    setMessages([]);
    setStreamContent('');
    setSidebarOpen(false);
  }

  // ─── Delete conversation ─────────────────────────────────────────────────
  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await chat.deleteConversation(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConv?.id === id) {
      setActiveConv(null);
      setMessages([]);
    }
  }

  // ─── Send message ────────────────────────────────────────────────────────
  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || streaming) return;

    setInput('');

    // Create conversation if needed.
    let convId = activeConv?.id;
    if (!convId) {
      try {
        const res = await chat.createConversation({
          course_id: selectedCourse,
          mode,
        });
        setActiveConv(res.conversation);
        convId = res.conversation.id;
        setConversations((prev) => [res.conversation, ...prev]);
      } catch {
        return;
      }
    }

    // Add user message to UI immediately.
    const userMsg: Message = {
      id: Date.now(),
      conversation_id: convId,
      role: 'user',
      content,
      tokens_used: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Stream the response.
    setStreaming(true);
    setStreamContent('');

    let fullResponse = '';

    abortRef.current = chat.streamMessage(
      convId,
      content,
      // onChunk
      (chunk) => {
        fullResponse += chunk;
        setStreamContent(fullResponse);
      },
      // onDone
      () => {
        setStreaming(false);
        if (fullResponse) {
          const assistantMsg: Message = {
            id: Date.now() + 1,
            conversation_id: convId!,
            role: 'assistant',
            content: fullResponse,
            tokens_used: null,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamContent('');

          // Update conversation title in sidebar.
          if (messages.length === 0) {
            const title = content.length > 60 ? content.slice(0, 60) + '...' : content;
            setConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, title } : c))
            );
          }
        }
      },
      // onError
      (error) => {
        setStreaming(false);
        setStreamContent('');
        const errorMsg: Message = {
          id: Date.now() + 1,
          conversation_id: convId!,
          role: 'assistant',
          content: `Sorry, I hit an error: ${error}`,
          tokens_used: null,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // ─── Not configured ──────────────────────────────────────────────────────
  if (!llmConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Set up your AI provider first
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            Plato needs an OpenAI or Anthropic API key to power the Socratic Tutor.
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

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={startNewConversation}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => loadConversation(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition ${
                activeConv?.id === conv.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{conv.title || 'New conversation'}</p>
                {conv.course_code && (
                  <p className="text-xs text-gray-400 truncate">{conv.course_code}</p>
                )}
              </div>
              <button
                onClick={(e) => handleDelete(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition p-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
          <Link
            href="/dashboard"
            className="block text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-2"
          >
            &larr; Dashboard
          </Link>
          <Link
            href="/training"
            className="block text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-2"
          >
            Training Zone
          </Link>
          <Link
            href="/notes"
            className="block text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-2"
          >
            Study Notes
          </Link>
          <Link
            href="/settings"
            className="block text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition px-2"
          >
            Settings
          </Link>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="font-semibold text-gray-900 dark:text-white text-sm flex-1 truncate">
            {activeConv?.title || 'New Chat'}
          </h1>

          {/* Course selector */}
          {!activeConv && (
            <select
              value={selectedCourse ?? ''}
              onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
              className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-gray-700 dark:text-gray-300 outline-none"
            >
              <option value="">All courses</option>
              {courseList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code}
                </option>
              ))}
            </select>
          )}

          {/* Mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode('socratic')}
              className={`text-xs px-3 py-1 rounded-md transition font-medium ${
                mode === 'socratic'
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Socratic
            </button>
            <button
              onClick={() => setMode('eli5')}
              className={`text-xs px-3 py-1 rounded-md transition font-medium ${
                mode === 'eli5'
                  ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              ELI5
            </button>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 && !streaming && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="text-4xl mb-4">{mode === 'eli5' ? '🧒' : '🏛️'}</div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {mode === 'eli5' ? 'ELI5 Mode' : 'Socratic Mode'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                {mode === 'eli5'
                  ? "I'll explain things as simply as possible — like you're five. No jargon, just clear explanations with everyday analogies."
                  : "I'll guide you to understanding through questions. I won't just give you the answer — I'll help you figure it out yourself."}
              </p>
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
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'eli5'
                  ? 'Ask me anything — I\'ll keep it simple...'
                  : 'What would you like to explore?'
              }
              disabled={streaming}
              className="flex-1 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl px-5 py-3 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <ChatContent />
    </ProtectedRoute>
  );
}
