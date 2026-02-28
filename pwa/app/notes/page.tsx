'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { notes as notesApi, courses as coursesApi, type StudyNote, type Course, type PageContentResponse } from '@/lib/api';

function NotesContent() {
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [notesList, setNotesList] = useState<StudyNote[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState<Record<string, PageContentResponse>>({});
  const [loadingContent, setLoadingContent] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const res = await notesApi.list(selectedCourse ?? undefined);
      setNotesList(res.notes);
    } catch {
      // handled
    }
  }, [selectedCourse]);

  useEffect(() => {
    async function init() {
      try {
        const [coursesRes, notesRes] = await Promise.all([
          coursesApi.list(),
          notesApi.list(),
        ]);
        setCourseList(coursesRes.courses);
        setNotesList(notesRes.notes);
      } catch {
        // handled
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Re-fetch when course filter changes.
  useEffect(() => {
    if (!loading) {
      loadNotes();
    }
  }, [selectedCourse, loading, loadNotes]);

  // Poll while any notes are processing/pending.
  useEffect(() => {
    const hasPending = notesList.some(
      (n) => n.status === 'pending' || n.status === 'processing'
    );

    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(loadNotes, 5000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [notesList, loadNotes]);

  async function handleUpload(file: File) {
    if (!selectedCourse) {
      setError('Please select a course first.');
      return;
    }

    setError('');
    setSuccess('');
    setUploading(true);

    try {
      const res = await notesApi.upload(file, selectedCourse);
      setNotesList(res.notes);
      setSuccess(
        res.processing
          ? `"${file.name}" uploaded — processing in background...`
          : `"${file.name}" uploaded and processed!`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  async function handleDelete(fileName: string, courseId: number) {
    try {
      await notesApi.delete(fileName, courseId);
      setNotesList((prev) =>
        prev.filter((n) => !(n.file_name === fileName && n.course_id === courseId))
      );
      // Clear expanded state if this note was expanded.
      if (expandedNote === `${fileName}:${courseId}`) {
        setExpandedNote(null);
      }
    } catch {
      // handled
    }
  }

  async function toggleNote(fileName: string, courseId: number) {
    const key = `${fileName}:${courseId}`;

    if (expandedNote === key) {
      setExpandedNote(null);
      return;
    }

    setExpandedNote(key);

    // Fetch content if not already cached.
    if (!noteContent[key]) {
      setLoadingContent(key);
      try {
        const res = await coursesApi.pageContent(courseId, fileName);
        setNoteContent((prev) => ({ ...prev, [key]: res }));
      } catch {
        // Show empty state
      } finally {
        setLoadingContent(null);
      }
    }
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">
            Study Notes
          </h1>
          <select
            value={selectedCourse ?? ''}
            onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : null)}
            className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="">All courses</option>
            {courseList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Upload area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            dragOver
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-700 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-900'
          } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-3xl mb-2">
            {uploading ? (
              <span className="animate-spin inline-block">&#9696;</span>
            ) : (
              '📄'
            )}
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {uploading
              ? 'Uploading & processing...'
              : 'Drop a PDF or PPTX here, or click to browse'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max 50 MB. Lecture slides, handouts, or notes.
          </p>
          {!selectedCourse && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
              Select a course above before uploading.
            </p>
          )}
        </div>

        {/* Feedback messages */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm rounded-lg p-3">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Notes list */}
        {notesList.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">
            No study notes uploaded yet. Upload your first lecture slides above!
          </div>
        ) : (
          <div className="space-y-3">
            {notesList.map((note) => {
              const noteKey = `${note.file_name}:${note.course_id}`;
              const isExpanded = expandedNote === noteKey;
              const cached = noteContent[noteKey];
              const isLoadingThis = loadingContent === noteKey;
              const isCanvas = note.file_type === 'canvas';

              return (
                <div
                  key={noteKey}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    onClick={() => toggleNote(note.file_name, note.course_id)}
                  >
                    {/* Expand chevron */}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>

                    {/* File type icon */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold uppercase flex-shrink-0 ${
                        isCanvas
                          ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                          : note.file_type === 'pdf'
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                      }`}
                    >
                      {isCanvas ? 'LMS' : note.file_type}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {note.file_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{note.course_code}</span>
                        <span>&middot;</span>
                        <span>{formatSize(Number(note.file_size))}</span>
                        {Number(note.total_chunks) > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>
                              {note.completed_chunks}/{note.total_chunks} chunks
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {note.status === 'completed' && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                          Ready
                        </span>
                      )}
                      {(note.status === 'pending' || note.status === 'processing') && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full animate-pulse">
                          Processing...
                        </span>
                      )}
                      {note.status === 'error' && (
                        <span
                          className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full"
                          title={note.error_message ?? 'Unknown error'}
                        >
                          Error
                        </span>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.file_name, note.course_id);
                        }}
                        className="text-gray-400 hover:text-red-500 transition p-1"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700">
                      {isLoadingThis ? (
                        <div className="px-4 py-8 text-center">
                          <div className="animate-pulse text-sm text-gray-400">Loading content...</div>
                        </div>
                      ) : cached ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {cached.summary && (
                            <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10">
                              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">
                                Summary
                              </p>
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {cached.summary}
                              </p>
                            </div>
                          )}
                          {cached.content ? (
                            <div className="px-4 py-3">
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                Content
                              </p>
                              <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap max-h-[500px] overflow-y-auto">
                                {cached.content}
                              </div>
                            </div>
                          ) : !cached.summary ? (
                            <div className="px-4 py-6 text-center text-sm text-gray-400">
                              Content is still being processed. Check back shortly.
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="px-4 py-6 text-center text-sm text-gray-400">
                          No content available yet. The note may still be processing.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4 text-sm text-indigo-700 dark:text-indigo-300">
          <p className="font-medium mb-1">How it works</p>
          <p className="text-indigo-600 dark:text-indigo-400">
            Upload your lecture slides or notes and Plato will extract the content, summarize key concepts,
            and use them when you chat about that course. The more material you upload, the better Plato can help!
          </p>
        </div>
      </main>
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesContent />
    </ProtectedRoute>
  );
}
