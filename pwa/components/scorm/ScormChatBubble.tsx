'use client';

import { useState } from 'react';
import ScormChat from './ScormChat';

interface ScormChatBubbleProps {
  packageId: number;
  packageTitle: string;
}

export default function ScormChatBubble({ packageId, packageTitle }: ScormChatBubbleProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      {/* Floating bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      )}

      {/* Slide-up panel */}
      {open && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl border-t border-gray-200 dark:border-gray-700" style={{ height: '70vh' }}>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Ask Plato</span>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="h-[calc(100%-40px)]">
            <ScormChat packageId={packageId} packageTitle={packageTitle} />
          </div>
        </div>
      )}
    </div>
  );
}
