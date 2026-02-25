# Canonical Agent Prompt Template

**Version:** 1.0
**Date:** 2026-02-25
**Status:** APPROVED - CANONICAL
**Approved By:** User (teamm)

---

## Template Structure

```
# [AGENT-TYPE] PROMPT: [Feature/Task Name]

## ROLE
You are [role description] working inside [repository/plugin/codebase].

## CONTEXT
[Brief description of current state, what exists, what's broken/missing]

## TASK
[One-sentence goal statement]

## HARD RULES
- [Non-negotiable constraint 1]
- [Non-negotiable constraint 2]
- DO NOT [explicitly forbidden action]
- DO NOT [explicitly forbidden action]

## FUNCTIONAL REQUIREMENTS
1. [Requirement with acceptance criteria]
2. [Requirement with acceptance criteria]
3. [Requirement with acceptance criteria]

## TECHNICAL REQUIREMENTS
- [Architecture pattern to follow]
- [File naming conventions]
- [Error handling pattern]
- [Security requirements]

## IMPLEMENTATION DETAILS
[Specific how-to instructions, example code if ambiguous]

### Phase/Part A: [Phase Name]
[Detailed steps]

### Phase/Part B: [Phase Name]
[Detailed steps]

## OUTPUT REQUIREMENTS
- [ ] [Artifact 1 to produce]
- [ ] [Artifact 2 to produce]
- [ ] [File path(s) to create/modify]

## VERIFICATION
1. [Step to confirm success]
2. [Step to confirm success]
3. [Click path or test command]

## GOVERNANCE COMPLIANCE
- References: [Link to Design Lock / ADR / Baseline]
- Baseline Impact: [None / Minimal Diff / Requires Approval]
- Rollback: [How to undo if needed]

## COMMIT MESSAGE (EXACT)
`[type]: [description]`

---
END PROMPT
```

---

## Section Definitions

### 1. ROLE
**Purpose:** Set agent expertise and scope boundaries
**Required:** Yes
**Format:** One sentence establishing expertise + repository context

**Examples:**
- "You are my senior WordPress engineer working inside the Plato plugin."
- "You are operating inside the `plato` GitHub repository."
- "You are my senior WordPress + Next.js engineer. I am not a programmer."

---

### 2. CONTEXT
**Purpose:** Establish current state so agent doesn't make assumptions
**Required:** Yes
**Format:** 2-5 sentences describing what exists, what's broken, or what's changing

**Examples:**
- "I have duplicate/broken code intended to add a progress tracking widget on the admin dashboard."
- "This repository already contains Design Lock User Journeys, UX Specifications, and canonical architectural decisions."
- "The log shows: Fatal error: Call to undefined function plato_get_user_progress()"

---

### 3. TASK
**Purpose:** Single clear objective
**Required:** Yes
**Format:** One sentence, imperative mood

**Examples:**
- "Add a DEMO MODE 'Seed Demo Data' and 'Reset Demo Data' capability for fast live demos."
- "CREATE an authoritative BUILD PLAN document."
- "Fix the fatal error stopping the site from loading."

---

### 4. HARD RULES
**Purpose:** Non-negotiable constraints that must never be violated
**Required:** For any task touching existing code or data
**Format:** Bulleted list with explicit DO NOT statements

**Examples:**
```
- Must not delete real data.
- Must only affect posts that are explicitly marked as demo.
- DO NOT write or modify application code.
- DO NOT propose alternatives.
- DO NOT re-interpret requirements.
```

---

### 5. FUNCTIONAL REQUIREMENTS
**Purpose:** What the feature/fix must accomplish (user-facing behavior)
**Required:** Yes
**Format:** Numbered list with testable acceptance criteria

**Examples:**
```
1) Access control
   - Only logged-in users who can `edit_posts` may submit.
   - If not logged in: show friendly message + wp_login_url() link.

2) Form fields and post creation
   - Title (required) -> post_title
   - Summary/Excerpt (optional) -> post_excerpt
   - Use nonce + sanitize all inputs
```

---

### 6. TECHNICAL REQUIREMENTS
**Purpose:** Architecture patterns, coding standards, security requirements
**Required:** For code-producing prompts
**Format:** Bulleted list referencing project conventions

**Examples:**
```
- Use the 'admin_head-edit.php' hook
- Escape URL with esc_url() and escape label with esc_html()
- Guard all logic: global $pagenow, $typenow
- Follow Plato_ class prefix convention
- Returns true|WP_Error (never fatal)
```

---

### 7. IMPLEMENTATION DETAILS
**Purpose:** Specific how-to instructions, removing ambiguity
**Required:** For complex or multi-step tasks
**Format:** Subsections for phases/parts, inline code examples

---

### 8. OUTPUT REQUIREMENTS
**Purpose:** Explicit deliverables expected from the agent
**Required:** Yes
**Format:** Checklist of artifacts

**Examples:**
```
- [ ] List exact files to create/modify
- [ ] Minimal diff summary
- [ ] Generate the code for each file with clear file path headers
- [ ] Commit the file to GitHub
```

---

### 9. VERIFICATION
**Purpose:** How to confirm the task succeeded
**Required:** Yes
**Format:** Numbered steps, click paths, or test commands

**Examples:**
```
1. Activate plugin (WP Admin -> Plugins -> Activate)
2. Create a WP Page called "Submit Article"
3. Add shortcode [plato_submit]
4. Test: Save Draft, Submit for Review, File upload
```

---

### 10. GOVERNANCE COMPLIANCE
**Purpose:** Align with project governance, baselines, and rollback
**Required:** For all code-producing prompts
**Format:** Reference section

**Examples:**
```
- References: Design Lock UJ-001, ADR-007
- Baseline Impact: Minimal diff to class-plato-api.php
- Rollback: Feature flag PLATO_FEATURE_X, or git revert commit hash
```

---

### 11. COMMIT MESSAGE
**Purpose:** Exact commit format for traceability
**Required:** For code-producing prompts
**Format:** Conventional commit string

**Examples:**
```
`feat: Add spaced repetition engine for adaptive learning`
`fix: Wrap plato_get_user_progress() in function_exists check`
`docs: Add canonical progress tracking build plan documentation`
```

---

## Prompt Types and Required Sections

| Section | Build Plan | Code Fix | New Feature | Research |
|---------|:----------:|:--------:|:-----------:|:--------:|
| ROLE | Yes | Yes | Yes | Yes |
| CONTEXT | Yes | Yes | Yes | Yes |
| TASK | Yes | Yes | Yes | Yes |
| HARD RULES | Yes | Yes | Yes | - |
| FUNCTIONAL REQUIREMENTS | - | Yes | Yes | - |
| TECHNICAL REQUIREMENTS | - | Yes | Yes | - |
| IMPLEMENTATION DETAILS | Yes | Yes | Yes | - |
| OUTPUT REQUIREMENTS | Yes | Yes | Yes | Yes |
| VERIFICATION | Yes | Yes | Yes | - |
| GOVERNANCE COMPLIANCE | Yes | Yes | Yes | - |
| COMMIT MESSAGE | Yes | Yes | Yes | - |

---

## Governance Notes

This prompt template:
1. Aligns with Plato's canonical precedence order
2. Enforces baseline freeze awareness
3. Requires explicit rollback planning
4. Produces traceable commits

Future prompts MUST follow this structure to be considered canonical execution guidance.
