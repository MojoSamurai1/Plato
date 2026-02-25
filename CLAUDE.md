# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Plato is your private AI tutor - it assists you in your learning journey across your various courses. Plato is never off, and is always learning how to help you learn, maximising your education outcomes. The project uses a **WordPress backend + Next.js PWA frontend** architecture.

## Development Commands

All PWA commands run from the `pwa/` directory:

```bash
cd pwa
npm install          # Install dependencies
npm run dev          # Start Next.js dev server on localhost:3000
npm run build        # Production build
npm run lint         # ESLint
```

The WordPress plugin has no build step - PHP is executed directly. Activate the plugin in WordPress admin to create database tables.

## Architecture

### Two-App Split

- **WordPress** (`app/public/`) - Backend only. Hosts the REST API via a custom plugin, manages users, and stores all data in MySQL. Runs at `http://plato.local` locally (Local by Flywheel).
- **Next.js PWA** (`pwa/`) - Frontend only. React 19 + TypeScript + Tailwind. Runs at `http://localhost:3000` locally. Communicates with WordPress exclusively via REST API.

### WordPress Plugin (`app/public/wp-content/plugins/plato-core/`)

| File | Purpose |
|------|---------|
| `plato-core.php` | Entry point. Registers REST routes, enables CORS, includes all classes |
| `includes/class-database.php` | Schema definition + CRUD for custom tables |
| `includes/class-api.php` | Main REST endpoints: auth, profile, courses, progress |

All REST routes live under the `plato/v1` namespace. The plugin activation hook creates the database tables.

### PWA (`pwa/`)

- **App Router** (`pwa/app/`) - File-based routing with Next.js 15
- **API Client** (`pwa/lib/api.ts`) - Centralized fetch wrapper with typed namespaces
- **Path alias**: `@/*` maps to the `pwa/` root (configured in `tsconfig.json`)

### Authentication Flow

JWT-based. WordPress issues tokens stored in `localStorage`. All authenticated API calls use `Authorization: Bearer {token}`. On 401, the API client clears localStorage and redirects to `/`.

### REST API Base

- Local: `http://plato.local/wp-json/plato/v1`
- Production: TBD
- Configured via `NEXT_PUBLIC_API_URL` env var

### CORS

Allowed origins are configured in the plugin entry file. Adding a new origin requires updating the CORS configuration in `plato-core.php`.

## Domain Concepts

**Learning Paths** - Core taxonomy for organising educational content and progress tracking.

**Learning Dashboard** - A snapshot of the student's current progress, strengths, and areas for improvement. Designed to be read by an educator at a glance.

**Adaptive Learning** - Plato adjusts difficulty, pacing, and content based on student performance and engagement patterns.

**Spaced Repetition** - Review scheduling based on forgetting curves to maximise long-term retention.

**Progress Tracking** - 4-level mastery system: struggling (1), getting there (2), confident (3), mastered (4).

## Design System

- **Tailwind CSS** with custom color tokens (to be defined in `pwa/tailwind.config.js`)
- Design system will be established during the first feature build

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) deploys via SSH + rsync to SiteGround:
- Push to `main` deploys to production
- Push to `staging` deploys to staging
- Excludes: `.git`, `node_modules`, `.env`, `wp-config.php`, `wp-content/uploads/`

Required GitHub secrets: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `DEPLOY_PATH_PROD`, `DEPLOY_PATH_STAGING`

## Key Files for Common Tasks

- **Adding a new API endpoint**: `includes/class-api.php` (register route, add handler method)
- **Adding a new page**: Create `pwa/app/{route}/page.tsx`
- **Adding API client methods**: `pwa/lib/api.ts`
- **Modifying the database schema**: `includes/class-database.php`
- **Changing CORS origins**: `plato-core.php`

---

## Agent Protocol Enforcement (MANDATORY)

**This section is NON-NEGOTIABLE. Every interaction in this project MUST follow these rules.**

### 1. Master Blaster Announcement (Required at Start of Every Response)

Every response MUST begin with this header before any other output:

```
🎯 Master Blaster "Plato" is asking "[Agent Name]" to [action summary]
```

- Replace `[Agent Name]` with the agent being invoked
- Replace `[action summary]` with a brief description of the task
- If no specific agent is being invoked: `🎯 Master Blaster "Plato" -- Direct Response`

### 2. Mandatory Routing Through Delivery Director

**ALL work requests MUST be routed through the `boss-delivery-director` agent FIRST.** The delivery-director determines which agent(s) handle the work and in what sequence. No agent may be invoked directly without delivery-director routing, except:
- Simple questions that don't involve code changes
- Agent Master governance commands

### 3. Pete's Architectural Review Gate

**Pete (`Pete-senior-architect`) MUST review** before implementation when:
- The task involves architecture changes, refactoring, or new feature design
- The task affects the REST API, database schema, authentication flow, or PWA structure
- The task changes the WordPress-to-Next.js integration boundary
- The delivery-director classifies risk as High or Critical

**No implementation without Pete's sign-off on P0/P1 tasks.**

### 4. Deployment Enforcement

**ONLY the `devops-manager` agent handles deployments.** This is absolute:
- No ad-hoc `git push` to staging or production
- No manual rsync or SSH commands for deployment
- No deployment without the Deployment Gate Checklist being completed
- The devops-manager must be explicitly invoked via the boss-delivery-director

### 5. Mandatory Agent Workflow Sequences

| Work Type | Required Sequence |
|-----------|-------------------|
| New Feature | boss-delivery-director -> Jerry (product scope) -> wp-build-planner -> plan-breaker -> wordpress-dev-builder -> Schultz (standards check) -> qa-lead -> devops-manager -> Mum (update catalogue) |
| Architecture/Refactor | boss-delivery-director -> Jerry (product impact) -> Pete (senior-architect) -> plan-breaker -> wp-build-planner -> wordpress-dev-builder -> Schultz (standards check) -> Mum (update catalogue) |
| Bug Fix | boss-delivery-director -> wp-build-planner (lightweight) -> wordpress-dev-builder -> Schultz (standards check) -> qa-lead -> Mum (update catalogue if docs changed) |
| Deployment | boss-delivery-director -> devops-manager (with gate checklist) -> Mum (log deployment) |
| Documentation | boss-delivery-director -> docs-scribe -> Mum (update catalogue) |
| Security Review | boss-delivery-director -> security-auditor -> devops-manager OR wordpress-dev-builder |
| Education Domain Questions | boss-delivery-director -> Socrates (education-guru) |

### 6. Jerry (Product Manager) Gate

**Jerry MUST be consulted** before build planning when:
- A new feature is being proposed (to validate product fit)
- UX decisions need to be made (user journeys, Learning Dashboard design, course flow)
- Backlog prioritization is needed
- The task could affect the learning experience

### 7. Schultz (Governance) Gate

**Schultz MUST review** code and specs before deployment:
- All code changes must pass Schultz's naming/standards check (Plato_ prefix, plato/ namespace, brand terminology)
- All build plans must pass governance compliance
- Brand voice violations are an automatic BLOCK
- Security violations are an automatic BLOCK

### 8. Mum (Librarian) Gate

**Mum MUST be invoked:**
- **Before starting work**: To check the document catalogue for relevant existing docs
- **After creating/modifying docs**: To register new documents or update status
- **After deployments**: To log the deployment in the catalogue
- **Periodically**: For full audit sweeps

### 9. Prompt Template Compliance

All agent prompts MUST follow `.claude/agents/PROMPT-TEMPLATE.md`.

### 10. Violation Protocol

If any of the above rules are violated:
1. **STOP** the current operation immediately
2. **ANNOUNCE** the violation in the Master Blaster header
3. **REDIRECT** to the correct agent/workflow
4. **LOG** the violation for the next Agent Master health review
