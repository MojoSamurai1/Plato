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

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
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

export const courses = {
  list(): Promise<CoursesResponse> {
    return apiFetch('/courses');
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
