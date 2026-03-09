'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { chat, scorm, type Message } from '@/lib/api';

interface ScormChatProps {
  packageId: number;
  packageTitle: string;
}

export default function ScormChat({ packageId, packageTitle }: ScormChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scorm
      .conversation(packageId)
      .then((res) => {
        setConversationId(res.conversation.id);
        setMessages(res.messages);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [packageId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || !conversationId || streaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [
      ...prev,
      { id: 0, conversation_id: conversationId, role: 'user', content: userMessage, tokens_used: null, created_at: new Date().toISOString() },
    ]);
    setStreaming(true);
    setStreamContent('');

    const controller = chat.streamMessage(
      conversationId,
      userMessage,
      (text) => setStreamContent((prev) => prev + text),
      () => {
        setStreaming(false);
        setStreamContent((final) => {
          if (final) {
            setMessages((prev) => [
              ...prev,
              { id: 0, conversation_id: conversationId, role: 'assistant', content: final, tokens_used: null, created_at: new Date().toISOString() },
            ]);
          }
          return '';
        });
      },
      (err) => {
        setError(err);
        setStreaming(false);
        setStreamContent('');
      }
    );
    abortRef.current = controller;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <span className="text-xs text-gray-400 animate-pulse">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Ask Plato about {packageTitle}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.length === 0 && !streaming && (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">
              Ask me anything about this module!
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {streaming && streamContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <div className="whitespace-pre-wrap">{streamContent}</div>
            </div>
          </div>
        )}

        {streaming && !streamContent && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-3 py-1">
          <p className="text-[10px] text-red-500">{error}</p>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this module..."
            disabled={streaming}
            className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 border-0 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-lg transition font-medium shrink-0"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
