'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { scorm, type ScormEvent } from '@/lib/api';

interface ScormPlayerProps {
  packageId: number;
  launchUrl: string;
  title: string;
  onEvent?: (event: ScormEvent) => void;
  onClose?: () => void;
}

const BATCH_INTERVAL = 5000; // Flush events every 5 seconds

export default function ScormPlayer({ packageId, launchUrl, title, onEvent, onClose }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const eventQueue = useRef<ScormEvent[]>([]);
  const flushTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Flush queued events to the API
  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    const batch = [...eventQueue.current];
    eventQueue.current = [];
    try {
      await scorm.track(packageId, batch);
    } catch (err) {
      // Re-queue on failure
      eventQueue.current = [...batch, ...eventQueue.current];
    }
  }, [packageId]);

  // Parse xAPI statement into ScormEvent
  const parseXapiStatement = useCallback((statement: Record<string, unknown>): ScormEvent | null => {
    if (!statement) return null;

    const verb = statement.verb as Record<string, unknown> | undefined;
    const verbId = (verb?.id as string) || '';
    const verbDisplay = verb?.display as Record<string, string> | undefined;
    const verbName = verbDisplay?.['en-US'] || verbDisplay?.en || verbId.split('/').pop() || '';

    const object = statement.object as Record<string, unknown> | undefined;
    const objectId = (object?.id as string) || '';
    const objectDef = object?.definition as Record<string, unknown> | undefined;
    const objectName = objectDef?.name as Record<string, string> | undefined;
    const activityName = objectName?.['en-US'] || objectName?.en || objectId.split('/').pop() || '';

    const result = statement.result as Record<string, unknown> | undefined;

    const event: ScormEvent = {
      verb: verbName,
      activity_id: objectId,
      activity_name: activityName,
      raw_statement: statement,
    };

    if (result) {
      const score = result.score as Record<string, number> | undefined;
      if (score?.scaled !== undefined) event.result_score = Math.round(score.scaled * 100);
      if (result.success !== undefined) event.result_success = result.success as boolean;
      if (result.completion !== undefined) event.result_complete = result.completion as boolean;
      if (result.duration !== undefined) event.result_duration = result.duration as string;
      if (result.extensions) event.extensions = result.extensions as Record<string, unknown>;
    }

    return event;
  }, []);

  // Listen for postMessage events from bridge
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (!event.data || event.data.source !== 'plato-scorm-bridge') return;

      const { type, data } = event.data;

      switch (type) {
        case 'xapi_statement': {
          const parsed = parseXapiStatement(data.statement);
          if (parsed) {
            eventQueue.current.push(parsed);
            onEvent?.(parsed);
          }
          break;
        }
        case 'scorm_api': {
          // SCORM 1.2/2004 API calls
          const scormEvent: ScormEvent = {
            verb: `scorm:${data.method}`,
            activity_id: data.args?.[0] || '',
            activity_name: data.args?.[1] || '',
          };
          if (data.method === 'SetValue') {
            scormEvent.extensions = { element: data.args?.[0], value: data.args?.[1] };
          }
          eventQueue.current.push(scormEvent);
          onEvent?.(scormEvent);
          break;
        }
        case 'localstorage_update': {
          // LocalStorage changes — create a synthetic tracking event
          const lsEvent: ScormEvent = {
            verb: 'progressed',
            activity_id: 'localstorage',
            activity_name: 'Progress Update',
            extensions: data.changes,
          };
          eventQueue.current.push(lsEvent);
          onEvent?.(lsEvent);
          break;
        }
        case 'bridge_ready':
          // Bridge loaded successfully
          break;
        case 'bridge_error':
          console.error('SCORM bridge error:', data.message);
          break;
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [parseXapiStatement, onEvent]);

  // Set up periodic flushing
  useEffect(() => {
    flushTimer.current = setInterval(flushEvents, BATCH_INTERVAL);
    return () => {
      if (flushTimer.current) clearInterval(flushTimer.current);
      // Flush remaining events on unmount
      flushEvents();
    };
  }, [flushEvents]);

  return (
    <div className={`flex flex-col ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-950' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
          {title}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition px-2 py-1 rounded"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
            )}
          </button>
          {onClose && (
            <button
              onClick={() => {
                flushEvents();
                onClose();
              }}
              className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition px-2 py-1 rounded"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* SCORM iframe */}
      <iframe
        ref={iframeRef}
        src={launchUrl}
        title={title}
        className="w-full flex-1 border-none"
        style={{ minHeight: fullscreen ? 'calc(100vh - 44px)' : '600px' }}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
      />
    </div>
  );
}
