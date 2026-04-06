# Plato -- System Reference

**Version:** 3.0.0
**Created:** 2026-04-06
**Purpose:** Insurance document -- any agent or group of agents can read this and fully understand what has been built, how it works, and where everything lives.

---

## 1. What Plato IS

Plato is a **private AI tutoring platform** that adapts to each learner. The tagline: "Your AI tutor. Always on, always learning." It never judges, never pressures, and adjusts to each student's pace and style.

### Brand Architecture (Three Tiers)

| Tier | Brand | Age Range | Positioning | Domain | Port | Status |
|------|-------|-----------|-------------|--------|------|--------|
| 1 | **Plato Kids** | 5-11 (Primary) | Wonder, curiosity, first big questions. "Buddy" is the AI persona. | www.platokids.ai | 3003 | MVP built |
| 2 | **Plato Spark** | 12-18 (Secondary) | Big ideas, philosophy, Socratic dialogue for teens | TBD | TBD | Decision brief in review |
| 3 | **Plato Academy** | 18+ (University) | Full academic rigour -- the original Plato. Canvas LMS integration. | TBD | 3002 | MVP built |

**Plato Agora** is a supplementary app (port 3004) -- an executive learning / professional development reader. Currently hosts one book: "Step Back from the Edge of Disaster" (cybersecurity leadership for C-suite, by Sorin Toma).

---

## 2. Architecture Overview

The project contains **four distinct apps** plus a WordPress backend:

```
plato/
├── pwa/        → Plato Academy (Next.js 16, port 3002)
├── kids/       → Plato Kids (Next.js 15, port 3003)
├── agora/      → Plato Agora (Next.js 15, port 3004)
├── app/        → WordPress backend (plato.local, REST API only)
└── .claude/    → Agent governance, build plans, decisions, knowledge
```

### System Diagram

```
┌─────────────────────────────────────┐
│  Plato Academy PWA (pwa/)           │  Port 3002
│  Next.js 16 · React 19 · TW v4     │  Deployed: Vercel
│  App Router · Sentry · TypeScript   │
└────────────┬────────────────────────┘
             │ REST (JWT Bearer)
┌────────────▼────────────────────────┐
│  WordPress Backend (app/public/)    │  plato.local (Flywheel)
│  plato-core plugin · PHP 8.x       │  MySQL, 17 custom tables
│  Canvas LMS · SCORM · LLM · Diag   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Plato Kids (kids/)                 │  Port 3003
│  Next.js 15 · React 19 · TW v4     │  Deployed: Vercel
│  Clerk Auth · Sanity CMS            │
│  Supabase (10 tables) · Claude API  │
│  5-Layer Safety Pipeline            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Plato Agora (agora/)               │  Port 3004
│  Next.js 15 · React 19 · TW v4     │  Static export
│  No auth, no backend                │
└─────────────────────────────────────┘
```

---

## 3. Tech Stack Per App

### 3.1 Plato Academy (`pwa/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript | ^5 (strict) |
| Styling | Tailwind CSS | v4 (CSS-first, `@tailwindcss/postcss`) |
| Monitoring | Sentry (`@sentry/nextjs`) | ^10.46.0 |
| Fonts | Geist, Geist Mono | Google Fonts |
| Backend | WordPress REST API | plato/v1 namespace |
| Auth | JWT (Bearer tokens in localStorage) | firebase/php-jwt |
| LLM | Anthropic Claude (via WordPress `class-llm.php`) | Configurable model |
| Hosting | Vercel | Auto-deploy from `main` |

### 3.2 Plato Kids (`kids/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.3.3 |
| UI | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | v4 |
| Auth | Clerk (`@clerk/nextjs`) | ^6.12.0 |
| CMS | Sanity (`next-sanity`, `sanity`) | ^9.8.0 / ^3.74.0 |
| Database | Supabase (`@supabase/supabase-js`) | ^2.49.0 |
| LLM | Anthropic Claude (direct API, `lib/llm/provider.ts`) | Haiku 4.5 + Sonnet 4.6 |
| Webhooks | Svix | ^1.45.0 |
| Hosting | Vercel | Auto-deploy from `main` |

### 3.3 Plato Agora (`agora/`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5.12 |
| UI | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | v4 |
| Auth | None (public-facing reader) | -- |
| Backend | None (static content) | -- |
| Hosting | Vercel | Static export (`out/`) |

### 3.4 WordPress Backend (`app/public/`)

| Layer | Technology |
|-------|-----------|
| CMS | WordPress (headless, no theme rendering) |
| Runtime | PHP 8.x |
| Database | MySQL (via Local by Flywheel) |
| Plugin | `plato-core` (custom, single plugin) |
| JWT | firebase/php-jwt (Composer) |
| Encryption | AES-256-CBC using WordPress `AUTH_KEY` |
| Cron | WP-Cron (Canvas sync every 6 hours, doc processing) |

---

## 4. Directory Structure

### 4.1 Academy PWA (`pwa/`)

```
pwa/
├── app/                              # App Router pages
│   ├── layout.tsx                    # Root layout (Sentry-wrapped)
│   ├── page.tsx                      # Landing / login
│   ├── dashboard/page.tsx            # Student dashboard (stats, activity, courses)
│   ├── courses/[courseId]/page.tsx    # Course detail (content, modules, assignments)
│   ├── chat/page.tsx                 # AI tutoring chat (Socratic + ELI5 modes)
│   ├── coach/page.tsx                # Assignment coach (briefs, rubrics, guided writing)
│   ├── coach/trial/page.tsx          # Coach trial experience
│   ├── canvas/connect/page.tsx       # Canvas LMS connection flow
│   ├── diagnostics/page.tsx          # Learner diagnostic overview
│   ├── diagnostics/take/page.tsx     # Take a diagnostic assessment
│   ├── diagnostics/results/page.tsx  # View diagnostic results
│   ├── learning/page.tsx             # Learning dashboard (engagement, knowledge base)
│   ├── notes/page.tsx                # Study notes upload and browse
│   ├── scorm/page.tsx                # SCORM package player + progress
│   ├── settings/page.tsx             # User settings (LLM provider config)
│   ├── team/page.tsx                 # Team/class features
│   └── training/                     # Training zone (AI-generated scenarios)
│       ├── page.tsx                  # Course listing for training
│       ├── [courseId]/page.tsx        # Modules for a course
│       ├── [courseId]/[moduleName]/page.tsx           # Scenarios for a module
│       └── [courseId]/[moduleName]/[scenarioId]/page.tsx  # Take a scenario
├── components/
│   ├── AssignmentList.tsx            # Assignment listing component
│   ├── ChatMessage.tsx               # Chat bubble renderer
│   ├── CourseCard.tsx                # Course card UI
│   ├── ProtectedRoute.tsx            # Auth guard wrapper
│   ├── diagnostics/                  # DimensionCard, LikertScale, RadarChart
│   ├── learning/                     # ActivityChart, CourseBreakdown, KnowledgeBaseSummary, StatCard
│   ├── scorm/                        # ScormPlayer, ScormProgress, ScormChat, ScormScenario
│   └── training/                     # ModuleCard, ScenarioCard, QuestionRenderer, QuizTimer,
│                                     # MasteryBadge, ProgressBar, ScoreDisplay, TrainingConversation,
│                                     # LearningOutcomesSection, ModuleSummarySection
├── lib/
│   ├── api.ts                        # Centralised API client (~1079 lines, typed namespaces)
│   └── auth.ts                       # JWT token management (localStorage)
├── public/                           # Static assets
├── next.config.ts                    # Sentry integration
├── instrumentation.ts                # Sentry server instrumentation
├── instrumentation-client.ts         # Sentry client instrumentation
├── sentry.server.config.ts
├── sentry.edge.config.ts
├── postcss.config.mjs
├── tsconfig.json                     # @/* path alias to pwa/ root
└── package.json
```

### 4.2 Kids App (`kids/`)

```
kids/
├── app/
│   ├── layout.tsx                    # Root layout (Clerk provider)
│   ├── page.tsx                      # Landing / sign-in
│   ├── (app)/                        # Child-facing routes (route group)
│   │   ├── layout.tsx                # Child session layout
│   │   ├── chat/page.tsx             # Buddy Chat (AI tutoring)
│   │   ├── challenges/page.tsx       # Quiz challenges (AI-generated)
│   │   ├── progress/page.tsx         # Child progress view
│   │   └── select-child/page.tsx     # Child profile selector (PIN entry)
│   ├── (parent)/                     # Parent-facing routes (route group)
│   │   ├── layout.tsx                # Parent dashboard layout
│   │   ├── dashboard/page.tsx        # Parent overview dashboard
│   │   ├── children/page.tsx         # Manage child profiles
│   │   ├── conversations/page.tsx    # Review child conversations
│   │   └── settings/page.tsx         # Family settings (screen time, etc.)
│   └── api/                          # API routes (Next.js Route Handlers)
│       ├── chat/route.ts             # POST — Send message to Buddy (streaming SSE)
│       ├── challenges/
│       │   ├── generate/route.ts     # POST — AI-generate quiz questions
│       │   └── submit/route.ts       # POST — Submit quiz answers
│       ├── children/
│       │   ├── route.ts              # GET/POST — List/create child profiles
│       │   └── verify-pin/route.ts   # POST — Verify child PIN
│       ├── parent/
│       │   ├── conversations/route.ts # GET — Parent view of conversations
│       │   ├── dashboard/route.ts     # GET — Parent dashboard stats
│       │   └── screen-time/route.ts   # GET/POST — Screen time rules
│       ├── progress/route.ts          # GET — Child progress data
│       ├── session/route.ts           # POST — Start/end child session
│       └── webhooks/
│           ├── clerk/route.ts         # Clerk user sync webhook (via Svix)
│           └── sanity/route.ts        # Sanity content webhook
├── components/
│   ├── buddy/                        # ChatMessage, SubjectPicker, TtsButton
│   ├── challenges/                   # QuestionCard, ScoreScreen
│   ├── parent/                       # (empty -- planned)
│   ├── progress/                     # (empty -- planned)
│   └── ui/                           # (empty -- planned)
├── lib/
│   ├── hooks/use-child-session.ts    # Child session management hook
│   ├── llm/provider.ts              # Anthropic Claude integration (Haiku + Sonnet routing)
│   ├── safety/                       # 5-layer child safety pipeline
│   │   ├── index.ts                  # Pipeline orchestrator (exports all layers)
│   │   ├── pre-llm-filter.ts         # Layer 1: Input scanning (PII, harmful, jailbreak, off-topic)
│   │   ├── system-prompts.ts         # Layer 2: Buddy personality + curriculum guardrails
│   │   ├── post-llm-scan.ts          # Layer 3: Output scanning (blocked content, leakage, vocabulary)
│   │   └── behavioural-monitor.ts    # Layer 5: Pattern detection (frustration, concerning language)
│   ├── sanity/client.ts             # Sanity CMS client (CDN read, write, preview)
│   └── supabase/
│       ├── client.ts                 # Supabase clients (server service-role + browser anon)
│       └── types.ts                  # TypeScript interfaces for all 10 tables
├── supabase/
│   └── migration.sql                 # Full schema migration (10 tables)
├── middleware.ts                      # Clerk auth middleware (protects all routes except public)
├── next.config.ts                     # Sanity image remote patterns
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

### 4.3 Agora (`agora/`)

```
agora/
├── app/
│   ├── layout.tsx                    # Root layout (dark theme, no auth)
│   ├── page.tsx                      # Homepage (hero, four pillars, chapters)
│   ├── library/page.tsx              # Book library listing
│   ├── read/[chapter]/page.tsx       # Chapter reader (dynamic route)
│   └── tools/
│       ├── page.tsx                  # Interactive tools listing
│       └── [tool]/page.tsx           # Individual tool (e.g. Exposure Mapper)
├── public/
│   └── manifest.json
├── out/                              # Static export output
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

### 4.4 WordPress Plugin (`app/public/wp-content/plugins/plato-core/`)

```
plato-core/
├── plato-core.php                    # Entry point: CORS, cron, encryption, REST route registration
└── includes/
    ├── class-api.php          (~65 KB)  # Core REST endpoints: chat, training, diagnostics, coach, dashboard
    ├── class-api-auth.php               # Auth endpoints: login, register, /auth/me
    ├── class-api-canvas.php             # Canvas LMS endpoints: connect, sync, status, content-sync
    ├── class-api-courses.php            # Course data endpoints: list, content, page-content, module-summaries
    ├── class-api-scorm.php              # SCORM endpoints: packages, tracking, scenarios, review-schedule
    ├── class-database.php     (~66 KB)  # Schema definition (17 tables) + all CRUD operations
    ├── class-auth.php         (~5 KB)   # JWT token issuance and validation
    ├── class-canvas.php       (~34 KB)  # Canvas LMS API integration (course sync, content fetch)
    ├── class-llm.php          (~24 KB)  # LLM integration (multi-provider: OpenAI + Anthropic)
    ├── class-document-processor.php (~16 KB) # Document processing pipeline (chunking, summarisation)
    ├── class-scorm.php        (~28 KB)  # SCORM package handling and xAPI statement processing
    └── class-diagnostics.php  (~20 KB)  # Learner diagnostic engine (5-dimension profiling)
```

---

## 5. Routes and Pages

### 5.1 Academy PWA Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page / login form |
| `/dashboard` | Student dashboard -- overview stats, activity timeline, course breakdown |
| `/courses/[courseId]` | Course detail -- modules, pages, assignments, discussions, progress |
| `/chat` | AI tutoring chat -- Socratic and ELI5 modes, conversation history |
| `/coach` | Assignment coach -- create briefs, import from Canvas, guided writing help |
| `/coach/trial` | Coach trial experience for new users |
| `/canvas/connect` | Canvas LMS token entry and initial sync |
| `/diagnostics` | Diagnostic overview |
| `/diagnostics/take` | Take a diagnostic assessment (Likert scales across 5 dimensions) |
| `/diagnostics/results` | View radar chart results and dimension breakdown |
| `/learning` | Learning dashboard -- engagement stats, knowledge base summary |
| `/notes` | Upload and browse study notes (PDF/DOCX processing) |
| `/scorm` | SCORM package player with xAPI tracking |
| `/settings` | User settings (LLM provider and API key configuration) |
| `/team` | Team/class collaboration features |
| `/training` | Training zone -- AI-generated scenario-based assessments |
| `/training/[courseId]` | Training modules for a specific course |
| `/training/[courseId]/[moduleName]` | Scenarios for a specific module |
| `/training/[courseId]/[moduleName]/[scenarioId]` | Take a training scenario |

### 5.2 Kids App Routes

**Child-facing (`(app)/` route group):**

| Route | Purpose |
|-------|---------|
| `/` | Landing / sign-in page |
| `/select-child` | Child profile selector (avatar + 4-digit PIN) |
| `/chat` | Buddy Chat -- AI tutoring with streaming, safety pipeline |
| `/challenges` | Quiz challenges -- AI-generated questions for maths/english |
| `/progress` | Child's progress view |

**Parent-facing (`(parent)/` route group):**

| Route | Purpose |
|-------|---------|
| `/dashboard` | Parent overview -- child activity, safety alerts |
| `/children` | Manage child profiles (add/edit children) |
| `/conversations` | Review all child conversations (Layer 4: parent review) |
| `/settings` | Family settings -- screen time rules, allowed hours/days |

### 5.3 Agora Routes

| Route | Purpose |
|-------|---------|
| `/` | Book homepage -- hero, four pillars framework, chapter listing |
| `/library` | Book library (currently 1 book) |
| `/read/[chapter]` | Chapter reader (chapters 1-4) |
| `/tools` | Interactive tools listing (Exposure Mapper, Self-Assessment Radar, Board Discussion Prompts) |
| `/tools/[tool]` | Individual tool page |

---

## 6. API Endpoints

### 6.1 Academy REST API (WordPress `plato/v1`)

**Base URL:** `http://plato.local/wp-json/plato/v1` (local) | configured via `NEXT_PUBLIC_API_URL`
**Auth:** `Authorization: Bearer {JWT}` on all authenticated endpoints. 401 triggers auto-redirect to `/`.

#### Auth (`class-api-auth.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Login with username/password, returns JWT |
| POST | `/auth/register` | Register new user, returns JWT |
| GET | `/auth/me` | Get current user profile |

#### Canvas (`class-api-canvas.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/canvas/connect` | Submit Canvas API token, trigger initial sync |
| POST | `/canvas/sync` | Manual re-sync courses and assignments |
| GET | `/canvas/status` | Connection status, sync info, content stats |
| POST | `/canvas/content-sync` | Full content sync (pages, discussions, modules) |

#### Courses (`class-api-courses.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/courses` | List all synced courses |
| GET | `/courses/{id}/content` | Full course content (modules, assignments, discussions, progress) |
| GET | `/courses/{id}/page-content` | Single page content by file_name |
| GET | `/courses/{id}/module-summaries` | AI-generated module summaries |

#### Chat (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/chat/conversations` | List user's conversations |
| POST | `/chat/conversations` | Create new conversation (socratic/eli5 mode) |
| GET | `/chat/conversations/{id}` | Get conversation with messages |
| DELETE | `/chat/conversations/{id}` | Delete a conversation |
| POST | `/chat/conversations/{id}/messages` | Send message (non-streaming) |
| POST | `/chat/conversations/{id}/stream` | Send message (SSE streaming) |

#### Training (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/training/modules` | List training modules (optionally by course) |
| POST | `/training/generate/{courseId}/{moduleName}` | AI-generate training scenarios |
| GET | `/training/scenarios/{courseId}/{moduleName}` | List scenarios for a module |
| POST | `/training/submit` | Submit scenario answers for grading |
| GET | `/training/progress/{courseId}` | Module mastery progress |
| GET | `/training/learning-outcomes/{courseId}/{moduleName}` | Learning outcomes (Canvas or AI) |
| POST | `/training/conversation/{courseId}/{moduleName}` | Get/create training conversation |

#### Assignment Coach (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/coach/briefs` | List assignment briefs |
| POST | `/coach/briefs` | Create manual brief |
| GET | `/coach/briefs/{id}` | Get brief detail |
| DELETE | `/coach/briefs/{id}` | Delete brief |
| POST | `/coach/start` | Start coaching session for a brief |
| GET | `/coach/canvas-assignments` | List Canvas assignments available for import |
| POST | `/coach/briefs/from-canvas` | Create brief from Canvas assignment |
| GET | `/coach/briefs/{id}/attachments` | List attachments |
| POST | `/coach/briefs/{id}/attachments` | Upload attachment (multipart) |
| DELETE | `/coach/briefs/{id}/attachments/{aid}` | Delete attachment |

#### Dashboard (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/dashboard/stats` | Full dashboard: overview, engagement, knowledge base, course stats, timeline |

#### Diagnostics (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/diagnostics/questions` | Get diagnostic questionnaire (5 dimensions) |
| POST | `/diagnostics/submit` | Submit diagnostic answers |
| GET | `/diagnostics/profile` | Get latest profile + learner signals |
| GET | `/diagnostics/history` | Get all past diagnostic profiles |

#### Study Notes (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notes` | List study notes (optionally by course) |
| POST | `/notes/upload` | Upload note file (PDF/DOCX, multipart) |
| POST | `/notes/delete` | Delete a note |

#### SCORM (`class-api-scorm.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/scorm/packages` | List SCORM packages |
| GET | `/scorm/packages/{id}` | Package detail + progress |
| POST | `/scorm/packages` | Create/register SCORM package |
| POST | `/scorm/track` | Submit xAPI tracking events |
| GET | `/scorm/progress/{id}` | Package progress data |
| GET | `/scorm/progress/{id}/statements` | Raw xAPI statements |
| POST | `/scorm/conversation` | Get/create SCORM chat conversation |
| POST | `/scorm/scenarios/generate` | AI-generate SCORM scenario |
| GET | `/scorm/scenarios/{packageId}` | List scenarios for a package |
| POST | `/scorm/scenarios/{id}/submit` | Submit scenario answers |
| GET | `/scorm/review-schedule` | Spaced repetition review schedule |

#### Settings (`class-api.php`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/settings/llm` | Get LLM provider config |
| POST | `/settings/llm` | Save LLM provider + API key |

### 6.2 Kids API Routes (Next.js Route Handlers)

All routes require Clerk authentication (middleware enforced). Child routes also require a child session cookie (`plato-kids-child-id`, `plato-kids-grade`).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Send message to Buddy (streaming SSE, full safety pipeline) |
| POST | `/api/challenges/generate` | AI-generate quiz questions for grade/subject |
| POST | `/api/challenges/submit` | Submit quiz answers |
| GET/POST | `/api/children` | List/create child profiles |
| POST | `/api/children/verify-pin` | Verify child's 4-digit PIN |
| GET | `/api/parent/conversations` | Parent: view all child conversations |
| GET | `/api/parent/dashboard` | Parent: dashboard statistics |
| GET/POST | `/api/parent/screen-time` | Parent: get/set screen time rules |
| GET | `/api/progress` | Child progress data |
| POST | `/api/session` | Start/end child session |
| POST | `/api/webhooks/clerk` | Clerk user sync (Svix-verified) |
| POST | `/api/webhooks/sanity` | Sanity content change webhook |

---

## 7. Database Schemas

### 7.1 WordPress MySQL (Academy -- 17 custom tables)

All tables prefixed with `{$wpdb->prefix}plato_`. Created via `dbDelta()` in `class-database.php`. Version-gated migration: `PLATO_VERSION` constant triggers `create_tables()` on mismatch.

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `plato_courses` | Synced Canvas courses | user_id, canvas_course_id, name, course_code, workflow_state |
| `plato_conversations` | AI chat conversations | user_id, course_id, module_name, title, mode (socratic/eli5/training) |
| `plato_messages` | Chat messages | conversation_id, role (user/assistant), content, tokens_used |
| `plato_study_notes` | Uploaded study documents | user_id, course_id, file_name, content, summary, status, chunk_index |
| `plato_canvas_content` | Synced Canvas page content | user_id, content_key, title, module_name, html_content, chunks_created |
| `plato_canvas_discussions` | Synced Canvas discussions | user_id, canvas_topic_id, title, posts_json, post_count |
| `plato_canvas_module_progress` | Module completion tracking | user_id, canvas_module_id, module_state, items_total, items_completed |
| `plato_assignments` | Synced Canvas assignments | user_id, canvas_assignment_id, name, due_at, points_possible |
| `plato_learning_outcomes` | AI/Canvas learning outcomes | user_id, course_id, module_name, outcomes (JSON), source |
| `plato_training_scenarios` | AI-generated training scenarios | user_id, course_id, module_name, questions (JSON), total_points |
| `plato_training_attempts` | Training scenario attempts | user_id, scenario_id, score_pct, passed, feedback (JSON) |
| `plato_scorm_packages` | SCORM package registrations | user_id, slug, title, launch_url, duration_mins, module_count |
| `plato_scorm_tracking` | xAPI statement tracking | user_id, package_id, verb, activity_id, result_score, result_success |
| `plato_scorm_scenarios` | SCORM-linked scenarios | user_id, package_id, type, content (JSON), score |
| `plato_diagnostics_results` | Learner diagnostic profiles | user_id, 5 dimension scores, raw_answers, dimension_detail |
| `plato_learner_signals` | Behavioural learning signals | user_id, calibration_gap, help_seeking_rate, wheel_spin_count |
| `plato_coach_briefs` | Assignment coaching briefs | user_id, subject_code, assessment_name, brief_content, rubric_content |
| `plato_coach_attachments` | Coach brief file attachments | user_id, brief_id, file_name, extracted_text, status |

### 7.2 Supabase PostgreSQL (Kids -- 10 tables)

Schema defined in `kids/supabase/migration.sql`. Uses UUID primary keys. RLS currently disabled (server-side service_role key only).

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `families` | Family units (one per Clerk org) | id, clerk_org_id, name |
| `parents` | Parent accounts (linked to Clerk) | id, clerk_user_id, family_id, email, display_name |
| `children` | Child profiles within families | id, family_id, display_name, grade_level (year-3/4/5), pin_hash |
| `chat_conversations` | Buddy chat conversations | id, child_id, family_id, subject (maths/english), sanity_lesson_id |
| `chat_messages` | Individual chat messages | id, conversation_id, child_id, role (child/buddy/system), safety_flagged |
| `quiz_attempts` | Quiz answer tracking | id, child_id, question_type (mcq/fill-blank/drag-drop/true-false), is_correct |
| `progress_events` | Generic progress event log | id, child_id, event_type, event_data (JSONB), sanity_content_id |
| `safety_logs` | Safety pipeline incident log | id, child_id, layer, severity, input_text, output_text, action_taken |
| `screen_time_rules` | Per-child screen time limits | id, child_id, daily_limit_minutes, allowed_start_time, allowed_end_time, allowed_days |
| `screen_time_sessions` | Actual usage tracking | id, child_id, started_at, ended_at, duration_minutes |

---

## 8. Authentication

### 8.1 Academy (JWT)

- **Issuer:** WordPress `plato-core` plugin (`class-auth.php`)
- **Library:** `firebase/php-jwt` (Composer)
- **Storage:** `localStorage` keys `plato_token` + `plato_user`
- **Flow:** Login via `/auth/login` --> receive JWT --> all subsequent requests use `Authorization: Bearer {token}`
- **Expiry handling:** On 401, the API client (`lib/api.ts`) clears localStorage and redirects to `/`
- **Registration:** `/auth/register` creates a WordPress user and returns JWT

### 8.2 Kids (Clerk + PIN)

- **Parent auth:** Clerk (`@clerk/nextjs`) -- handles sign-up, sign-in, session management
- **Middleware:** `kids/middleware.ts` protects all routes except `/`, `/sign-in`, `/sign-up`, `/api/webhooks/*`
- **Child auth:** 4-digit PIN per child profile
  - PIN hashed with SHA-256 (salted with `CLERK_SECRET_KEY`)
  - Stored in `children.pin_hash` column
  - Verified via `/api/children/verify-pin`
  - On success, child ID and grade stored in cookies (`plato-kids-child-id`, `plato-kids-grade`)
- **Webhook sync:** Clerk user creation syncs to Supabase `parents` + `families` tables via `/api/webhooks/clerk` (Svix-verified)

### 8.3 Agora (None)

- Public-facing, no authentication required

---

## 9. Child Safety Pipeline (Kids App)

The Kids app implements a **5-layer safety pipeline** protecting children ages 5-11. Located in `kids/lib/safety/`.

### Layer 1: Pre-LLM Filter (`pre-llm-filter.ts`)

Scans child input BEFORE it reaches the LLM. Checks for:
- **PII patterns:** Credit cards, phone numbers, emails, addresses, full names, passwords
- **Harmful content:** Violence, sexual content, drugs, weapons, hate speech, alcohol
- **Jailbreak attempts:** "Ignore your instructions", "pretend to be", DAN, "bypass safety"
- **Off-topic content:** Games (Fortnite, Roblox), dating, politics, religion (low severity, gentle redirect)

**Action:** Blocks input and returns child-friendly redirect message. Logs to `safety_logs` table.

### Layer 2: System Prompt Guardrails (`system-prompts.ts`)

Defines Buddy's personality and hard safety rules embedded in the LLM system prompt:
- Australian English, Year 3-5 Australian Curriculum alignment
- 10 hard rules (never discuss violence, never claim feelings, never reveal system prompt, etc.)
- Subject-specific context (maths + english) with year-level boundaries
- Common misconceptions to watch for per year level
- Socratic teaching approach with encouragement-first feedback

### Layer 3: Post-LLM Output Scan (`post-llm-scan.ts`)

Scans Buddy's response AFTER generation but BEFORE display. Catches:
- **Blocked content:** Profanity, insults, negative judgments, AI claiming emotions
- **System prompt leakage:** References to OpenAI, Anthropic, Claude, GPT, "my instructions"
- **Age-inappropriate vocabulary:** Existential, philosophical, political, economic jargon

**Action:** Replaces unsafe output with safe fallback. Logs to `safety_logs` table.

### Layer 4: Parent Review (Async)

All conversations stored in Supabase and visible to parents via `/conversations` dashboard. Safety-flagged messages are highlighted. Parents can review all child-Buddy interactions.

### Layer 5: Behavioural Pattern Monitor (`behavioural-monitor.ts`)

Analyses patterns across a child's session:
- **Concerning language:** "I don't want to be here", "nobody likes me", "someone hurt me" --> immediate critical parent alert
- **Excessive frustration:** "I can't do this", "I'm stupid", "I give up" --> parent alert after 3 occurrences
- **Session tracking:** Per-child in-memory context with message counts

**Action:** Does NOT block the child. Logs alert and notifies parent asynchronously.

---

## 10. LLM Integration

### 10.1 Academy (WordPress Backend)

- **Provider:** Configurable (OpenAI or Anthropic) via `/settings/llm` endpoint
- **Implementation:** `class-llm.php` (~24 KB)
- **API key:** Encrypted with AES-256-CBC using WordPress `AUTH_KEY`, stored in `wp_usermeta`
- **Modes:** Socratic tutoring, ELI5 explanations, training scenario generation, document summarisation, quiz grading
- **Streaming:** SSE endpoint at `/chat/conversations/{id}/stream`

### 10.2 Kids (Direct Anthropic API)

- **Provider:** Anthropic Claude exclusively
- **Implementation:** `kids/lib/llm/provider.ts`
- **Model routing:**
  - `fast` tier (Haiku 4.5): Quiz feedback, simple Q&A (~$0.001/interaction)
  - `smart` tier (Sonnet 4.6): Socratic tutoring, explanations, quiz generation (~$0.008/interaction)
- **Streaming:** SSE via TransformStream in `/api/chat` route handler
- **Safety integration:** Full 5-layer pipeline wraps every LLM call

---

## 11. External Integrations

| Integration | App | Purpose | Implementation |
|------------|-----|---------|----------------|
| **Canvas LMS** | Academy | Course sync, assignment import, content sync, module progress | `class-canvas.php`, `class-api-canvas.php` |
| **SCORM / xAPI** | Academy | Interactive learning packages, statement tracking, spaced repetition | `class-scorm.php`, `class-api-scorm.php` |
| **Anthropic Claude** | Academy + Kids | AI tutoring, content generation, grading | `class-llm.php` (WP), `lib/llm/provider.ts` (Kids) |
| **OpenAI** | Academy | Alternative LLM provider (user-configurable) | `class-llm.php` |
| **Clerk** | Kids | Parent authentication, user management | `@clerk/nextjs`, middleware, webhooks |
| **Sanity** | Kids | CMS for educational content (lessons, questions) | `next-sanity`, webhooks, 3 client instances (CDN/write/preview) |
| **Supabase** | Kids | PostgreSQL database, real-time subscriptions | `@supabase/supabase-js`, service_role + anon clients |
| **Sentry** | Academy | Error monitoring, performance tracking | `@sentry/nextjs`, tunnel at `/monitoring` |
| **Svix** | Kids | Webhook signature verification (Clerk webhooks) | `svix` package |
| **Vercel** | All 3 apps | Hosting, auto-deploy, preview URLs | Connected to GitHub `main` branch |
| **Local by Flywheel** | WordPress | Local WordPress development environment | `plato.local`, MySQL, PHP 8.x |

---

## 12. Environment Variables

### 12.1 Academy (`pwa/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | WordPress REST API base URL (e.g. `http://plato.local/wp-json/plato/v1`) |
| `SENTRY_ORG` | Sentry organisation slug |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token for source maps |

### 12.2 Kids (`kids/.env.local`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key |
| `CLERK_SECRET_KEY` | Clerk server-side secret (also used as PIN hash salt) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (client-side, RLS-restricted) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side, bypasses RLS) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (default: `production`) |
| `SANITY_API_WRITE_TOKEN` | Sanity write token (server-only) |
| `SANITY_API_READ_TOKEN` | Sanity read token for preview/drafts (server-only) |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `CLERK_WEBHOOK_SECRET` | Svix webhook signing secret |

### 12.3 WordPress (`wp-config.php`)

Standard WordPress config plus:
- `AUTH_KEY` used as AES encryption key for LLM API keys
- JWT secret derived from WordPress salts
- Database: `local` / `root` / `root` / prefix `wp_`

---

## 13. Development Commands

```bash
# Academy PWA (from pwa/ directory)
npm install          # Install dependencies
npm run dev          # Dev server on localhost:3002
npm run build        # Production build (Sentry source maps uploaded)
npm run lint         # ESLint

# Kids (from kids/ directory)
npm install          # Install dependencies
npm run dev          # Dev server on localhost:3003
npm run build        # Production build
npm run lint         # ESLint

# Agora (from agora/ directory)
npm install          # Install dependencies
npm run dev          # Dev server on localhost:3004
npm run build        # Production build (static export to out/)
npm run lint         # ESLint

# WordPress — no build step
# Activate plato-core plugin in WP admin → creates all 17 database tables
```

---

## 14. Deployment

| App | Host | Trigger | URL |
|-----|------|---------|-----|
| Academy PWA | Vercel | Auto-deploy on push to `main` | app.plato... (TBD) |
| Kids | Vercel | Auto-deploy on push to `main` | www.platokids.ai |
| Agora | Vercel | Auto-deploy on push to `main` | TBD |
| WordPress | Local by Flywheel (local dev only) | Manual | `plato.local` |

- **Preview deployments:** Vercel creates unique preview URLs for every PR
- **CORS:** Allowed origins defined in `plato-core.php` (`plato_get_allowed_origins()`). Vercel preview URLs auto-allowed via regex.
- **Merge-to-main IS deployment** -- devops-manager approval required before any PR merge

---

## 15. Naming Conventions

| Convention | Rule | Example |
|-----------|------|---------|
| PHP classes | `Plato_` prefix | `Plato_API`, `Plato_Database`, `Plato_Canvas` |
| PHP constants | `PLATO_` prefix | `PLATO_VERSION` |
| PHP functions | `plato_` prefix | `plato_get_allowed_origins()` |
| REST namespace | `plato/v1` | `/wp-json/plato/v1/auth/login` |
| DB tables (WP) | `{wpdb->prefix}plato_` | `wp_plato_courses` |
| DB tables (Supabase) | snake_case, no prefix | `chat_messages`, `safety_logs` |
| TS path alias | `@/*` maps to app root | `@/lib/api`, `@/components/ChatMessage` |
| React components | PascalCase `.tsx` files | `CourseCard.tsx`, `RadarChart.tsx` |
| Pages | `page.tsx` in route dirs | `app/dashboard/page.tsx` |
| CSS | Tailwind v4 utility classes | CSS-first config, no `tailwind.config.js` |

---

## 16. Architectural Decisions

1. **WordPress as headless API only** -- no theme rendering. All UI lives in the Next.js PWAs. WordPress provides REST API, auth, and data persistence.

2. **Kids app is fully independent** -- separate tech stack (Clerk, Sanity, Supabase) from Academy (WordPress). This isolates child data from adult data and allows different auth models.

3. **5-layer safety pipeline is non-negotiable** -- every LLM interaction in the Kids app passes through all 5 layers. No shortcuts. Safety logs are immutable and parent-visible.

4. **LLM model routing by interaction type** -- cheap models (Haiku) for simple tasks, expensive models (Sonnet) for reasoning. Keeps costs manageable while maintaining quality.

5. **Canvas LMS integration is the primary data source for Academy** -- courses, assignments, content, discussions, and module progress all sync from Canvas. Plato adds AI tutoring on top.

6. **Version-based DB migrations** -- WordPress tables are created/updated via `dbDelta()` gated on `PLATO_VERSION` constant. No separate migration runner.

7. **Agora is a static reader app** -- no auth, no backend, no database. Pure content delivery with interactive client-side tools.

8. **CORS whitelist approach** -- explicit origin allowlist with regex for Vercel preview URLs. Defined in a single function in `plato-core.php`.

9. **User-configurable LLM provider (Academy)** -- users bring their own API key (OpenAI or Anthropic). Encrypted with AES-256-CBC using WordPress `AUTH_KEY`.

10. **Sentry for observability (Academy only)** -- error tracking and performance monitoring with tunnel route at `/monitoring` to avoid ad blockers.

---

## 17. Key Patterns

1. **Domain-split API classes** -- REST endpoints split by domain: `class-api-auth.php`, `class-api-canvas.php`, `class-api-courses.php`, `class-api-scorm.php`. Remaining endpoints (chat, training, diagnostics, coach, dashboard, notes, settings) still in `class-api.php` (~65 KB, needs further extraction).

2. **Single DB class** -- `class-database.php` (66 KB) handles all schema and CRUD. Uses `dbDelta` for migrations. Monolithic but version-gated.

3. **Centralised API client** -- `pwa/lib/api.ts` (1079 lines) provides typed namespaces: `auth`, `canvas`, `courses`, `assignments`, `chat`, `notes`, `training`, `coach`, `dashboard`, `diagnostics`, `scorm`, `settings`. Includes timeout handling (60s default, 120s for long-running).

4. **WP-Cron for background work** -- Canvas sync (every 6 hours) and document processing run via WordPress cron.

5. **Encryption helpers** -- AES-256-CBC in WordPress using `AUTH_KEY` for LLM API key storage.

6. **Streaming SSE pattern** -- Both Academy and Kids use Server-Sent Events for real-time LLM response streaming. Kids uses `TransformStream` for in-flight safety scanning.

7. **Cookie-based child session** -- Kids app uses HTTP cookies for child ID and grade level, separate from Clerk parent auth.

8. **Sanity triple-client pattern** -- Kids has 3 Sanity clients: CDN (public reads), write (server mutations), preview (draft content).
