import { getToken, clearAuth } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Abort after 15 seconds to prevent indefinite hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    throw err;
  }
  clearTimeout(timeoutId);

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

interface LoginResponse {
  token: string;
  user_id: number;
  display_name: string;
  expires: number;
}

interface MeResponse {
  user_id: number;
  display_name: string;
  email: string;
}

export const auth = {
  login(username: string, password: string): Promise<LoginResponse> {
    return apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
  me(): Promise<MeResponse> {
    return apiFetch('/auth/me');
  },
};

// ─── Canvas ──────────────────────────────────────────────────────────────────

interface ConnectResponse {
  success: boolean;
  message: string;
  courses_synced?: number;
  assignments_synced?: number;
  synced_at?: string;
  error?: string;
}

interface SyncResponse {
  success: boolean;
  courses_synced: number;
  assignments_synced: number;
  synced_at: string;
}

interface CanvasStatusResponse {
  connected: boolean;
  hint: string | null;
  sync: {
    status: string;
    last_sync: string | null;
    error: string | null;
  };
  content_sync: {
    pages_synced: number;
    total_chunks: number;
    last_sync: string | null;
  };
}

interface ContentSyncResponse {
  success: boolean;
  pages_synced: number;
  pages_skipped: number;
  total_pages: number;
  total_chunks: number;
  message: string;
}

export const canvas = {
  connect(canvasToken: string): Promise<ConnectResponse> {
    return apiFetch('/canvas/connect', {
      method: 'POST',
      body: JSON.stringify({ canvas_token: canvasToken }),
    });
  },
  sync(): Promise<SyncResponse> {
    return apiFetch('/canvas/sync', { method: 'POST' });
  },
  status(): Promise<CanvasStatusResponse> {
    return apiFetch('/canvas/status');
  },
  contentSync(): Promise<ContentSyncResponse> {
    return apiFetch('/canvas/content-sync', { method: 'POST' });
  },
};

// ─── Courses ─────────────────────────────────────────────────────────────────

export interface Course {
  id: number;
  canvas_course_id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  start_at: string | null;
  end_at: string | null;
  synced_at: string | null;
  assignment_count: number;
}

interface CoursesResponse {
  courses: Course[];
  total: number;
  sync_status: string;
  last_sync: string | null;
}

export interface CourseContentPage {
  id: number;
  title: string;
  content_type: string;
  content_key: string;
  chunks_created: number;
  synced_at: string;
}

export interface CourseModule {
  module_name: string;
  pages: CourseContentPage[];
}

export interface CourseDetail {
  id: number;
  canvas_course_id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  start_at: string | null;
  end_at: string | null;
  synced_at: string | null;
}

export interface CourseContentResponse {
  course: CourseDetail;
  modules: CourseModule[];
  assignments: Assignment[];
  study_notes: StudyNote[];
  total_pages: number;
}

export interface PageContentResponse {
  file_name: string;
  content: string;
  summary: string;
  total_chunks: number;
  status: string;
}

export interface ModulePageSummary {
  title: string;
  file_name: string;
  summary: string;
  content: string;
  status: string;
}

export interface ModuleSummary {
  module_name: string;
  pages: ModulePageSummary[];
  summary: string;
}

export const courses = {
  list(): Promise<CoursesResponse> {
    return apiFetch('/courses');
  },
  content(courseId: number): Promise<CourseContentResponse> {
    return apiFetch(`/courses/${courseId}/content`);
  },
  pageContent(courseId: number, fileName: string): Promise<PageContentResponse> {
    return apiFetch(`/courses/${courseId}/page-content?file_name=${encodeURIComponent(fileName)}`);
  },
  moduleSummaries(courseId: number): Promise<{ modules: ModuleSummary[] }> {
    return apiFetch(`/courses/${courseId}/module-summaries`);
  },
};

// ─── Assignments ─────────────────────────────────────────────────────────────

export interface Assignment {
  id: number;
  canvas_assignment_id: number;
  canvas_course_id: number;
  plato_course_id: number;
  course_name: string;
  course_code: string;
  name: string;
  description: string | null;
  due_at: string | null;
  points_possible: number | null;
  submission_types: string;
  workflow_state: string;
}

interface AssignmentParams {
  course_id?: number;
  upcoming?: boolean;
  limit?: number;
}

interface AssignmentsResponse {
  assignments: Assignment[];
  total: number;
}

export const assignments = {
  list(params?: AssignmentParams): Promise<AssignmentsResponse> {
    const query = new URLSearchParams();
    if (params?.course_id) query.set('course_id', String(params.course_id));
    if (params?.upcoming) query.set('upcoming', '1');
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return apiFetch(`/assignments${qs ? `?${qs}` : ''}`);
  },
};

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id: number;
  user_id: number;
  course_id: number | null;
  title: string;
  mode: 'socratic' | 'eli5';
  course_name?: string;
  course_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export const chat = {
  listConversations(): Promise<{ conversations: Conversation[] }> {
    return apiFetch('/chat/conversations');
  },
  createConversation(data: {
    title?: string;
    course_id?: number | null;
    mode?: 'socratic' | 'eli5';
  }): Promise<{ conversation: Conversation }> {
    return apiFetch('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getConversation(id: number): Promise<{ conversation: Conversation; messages: Message[] }> {
    return apiFetch(`/chat/conversations/${id}`);
  },
  deleteConversation(id: number): Promise<{ deleted: boolean }> {
    return apiFetch(`/chat/conversations/${id}`, { method: 'DELETE' });
  },
  sendMessage(conversationId: number, content: string): Promise<{
    message: Message;
    tokens_used: number;
  }> {
    return apiFetch(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
  streamMessage(
    conversationId: number,
    content: string,
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (error: string) => void
  ): AbortController {
    const controller = new AbortController();
    const token = getToken();

    fetch(`${API_BASE}/chat/conversations/${conversationId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          onError(body.message || `Request failed (${res.status})`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          onError('No response body');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);

            if (data === '[DONE]') {
              onDone();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                onError(parsed.error);
                return;
              }
              if (parsed.content) {
                onChunk(parsed.content);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }

        onDone();
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message);
        }
      });

    return controller;
  },
};

// ─── Study Notes (P3) ────────────────────────────────────────────────────────

async function apiUpload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // DO NOT set Content-Type — browser sets multipart/form-data with boundary.

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    throw new ApiError('Unauthorized', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

export interface StudyNote {
  file_name: string;
  course_id: number;
  course_name: string;
  course_code: string;
  file_type: string;
  file_size: number;
  total_chunks: number;
  completed_chunks: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message: string | null;
  created_at: string;
}

export const notes = {
  list(courseId?: number): Promise<{ notes: StudyNote[]; total: number }> {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiFetch(`/notes${qs}`);
  },
  upload(file: File, courseId: number): Promise<{ success: boolean; note_id: number; processing: boolean; notes: StudyNote[] }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_id', String(courseId));
    return apiUpload('/notes/upload', formData);
  },
  delete(fileName: string, courseId: number): Promise<{ deleted: boolean }> {
    return apiFetch('/notes/delete', {
      method: 'POST',
      body: JSON.stringify({ file_name: fileName, course_id: courseId }),
    });
  },
};

// ─── Training Zone ────────────────────────────────────────────────────────

export interface TrainingQuestion {
  type: 'mcq' | 'short_answer';
  question: string;
  options?: string[];
  points: number;
}

export interface TrainingScenario {
  id: number;
  scenario_index: number;
  title: string;
  context: string;
  questions: TrainingQuestion[];
  total_points: number;
  best_score: number | null;
  passed: boolean;
  attempt_count: number;
  created_at: string;
}

export interface TrainingModuleInfo {
  module_name: string;
  page_count: number;
  total_scenarios: number;
  passed_scenarios: number;
  mastered: boolean;
}

export interface TrainingCourseInfo {
  course_id: number;
  course_name: string;
  course_code: string;
  total_modules: number;
  mastered_modules: number;
  modules: TrainingModuleInfo[];
}

export interface TrainingFeedbackItem {
  question_index: number;
  type: 'mcq' | 'short_answer';
  correct?: boolean;
  correct_option?: number;
  chosen?: number;
  score?: number;
  points?: number;
  max_points: number;
  feedback?: string;
}

export interface TrainingSubmitResponse {
  attempt_id: number;
  mcq_points: number;
  short_answer_points: number;
  total_points: number;
  max_points: number;
  score_pct: number;
  passed: boolean;
  feedback: TrainingFeedbackItem[];
}

export interface TrainingProgressResponse {
  course_id: number;
  total_modules: number;
  mastered_modules: number;
  modules: TrainingModuleInfo[];
}

export const training = {
  modules(courseId?: number): Promise<{ courses?: TrainingCourseInfo[]; modules?: TrainingModuleInfo[] }> {
    const qs = courseId ? `?course_id=${courseId}` : '';
    return apiFetch(`/training/modules${qs}`);
  },
  generate(courseId: number, moduleName: string): Promise<{ success: boolean; generated: number; scenarios: TrainingScenario[] }> {
    return apiFetch(`/training/generate/${courseId}/${encodeURIComponent(moduleName)}`, { method: 'POST' });
  },
  scenarios(courseId: number, moduleName: string): Promise<{ scenarios: TrainingScenario[] }> {
    return apiFetch(`/training/scenarios/${courseId}/${encodeURIComponent(moduleName)}`);
  },
  submit(scenarioId: number, answers: (number | string | null)[]): Promise<TrainingSubmitResponse> {
    return apiFetch('/training/submit', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId, answers }),
    });
  },
  progress(courseId: number): Promise<TrainingProgressResponse> {
    return apiFetch(`/training/progress/${courseId}`);
  },
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardOverview {
  total_courses: number;
  active_courses: number;
  concluded_courses: number;
  total_assignments: number;
  upcoming_assignments: number;
  overdue_assignments: number;
}

export interface DashboardEngagement {
  total_conversations: number;
  total_messages: number;
  socratic_conversations: number;
  eli5_conversations: number;
  conversations_this_week: number;
  messages_this_week: number;
  avg_messages_per_conversation: number;
  streak_days: number;
}

export interface DashboardKnowledgeBase {
  canvas_pages_synced: number;
  canvas_total_chunks: number;
  study_notes_uploaded: number;
  study_notes_processed: number;
  study_notes_pending: number;
}

export interface DashboardCourseStat {
  course_id: number;
  course_name: string;
  course_code: string;
  workflow_state: string;
  assignment_count: number;
  upcoming_count: number;
  overdue_count: number;
  conversation_count: number;
  message_count: number;
  notes_count: number;
  canvas_pages: number;
  last_activity: string | null;
}

export interface DashboardTimelineEntry {
  date: string;
  messages: number;
  conversations: number;
}

export interface DashboardStats {
  overview: DashboardOverview;
  engagement: DashboardEngagement;
  knowledge_base: DashboardKnowledgeBase;
  course_stats: DashboardCourseStat[];
  activity_timeline: DashboardTimelineEntry[];
  generated_at: string;
}

export const dashboard = {
  stats(): Promise<DashboardStats> {
    return apiFetch('/dashboard/stats');
  },
};

// ─── Settings ────────────────────────────────────────────────────────────────

export interface LLMSettings {
  configured: boolean;
  provider: 'openai' | 'anthropic';
  model: string;
}

export const settings = {
  getLLM(): Promise<LLMSettings> {
    return apiFetch('/settings/llm');
  },
  saveLLM(data: {
    provider: 'openai' | 'anthropic';
    api_key: string;
    model?: string;
  }): Promise<{ success: boolean; provider: string; model: string }> {
    return apiFetch('/settings/llm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
