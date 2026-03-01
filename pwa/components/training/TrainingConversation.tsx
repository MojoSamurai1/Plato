'use client';

import { useEffect, useState, useRef } from 'react';
import ChatMessage from '@/components/ChatMessage';
import { training, chat, type Message } from '@/lib/api';

interface TrainingConversationProps {
  courseId: number;
  moduleName: string;
}

export default function TrainingConversation({ courseId, moduleName }: TrainingConversationProps) {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Pick<Message, 'role' | 'content'>[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    training
      .conversation(courseId, moduleName)
      .then((res) => {
        setConversationId(res.conversation.id);
        if (res.messages && res.messages.length > 0) {
          setMessages(
            res.messages.map((m) => ({ role: m.role, content: m.content }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [courseId, moduleName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!input.trim() || !conversationId || streaming) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setStreaming(true);

    // Add placeholder for streaming assistant response
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    abortRef.current = chat.streamMessage(
      conversationId,
      userMsg,
      (chunk) => {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === 'assistant') {
            updated[updated.length - 1] = { ...last, content: last.content + chunk };
          }
          return updated;
        });
      },
      () => setStreaming(false),
      () => setStreaming(false)
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <div className="animate-pulse text-sm text-gray-400">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            Discuss with Plato
          </span>
          {messages.length > 0 && (
            <span className="text-xs text-gray-400">
              ({messages.length} message{messages.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {!collapsed && (
        <div>
          {/* Messages area */}
          <div className="h-[400px] overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
                  Ask Plato anything about this module &mdash; concepts, examples, or anything you&apos;re curious about.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 dark:border-gray-800 p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about this module..."
              disabled={streaming}
              className="flex-1 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg px-4 py-2 transition"
            >
              {streaming ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                'Send'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
