# Converto Engineering Guidelines & Rules

## 1. Project Philosophy & Core Rules
- **Privacy First & Local Default:** Every tool runs locally in the browser via Web Workers by default. Server or AI execution is strictly opt-in and requires explicit user consent before any file leaves the client device.
- **Zero File Logging:** Never log file contents, filenames, or extracted text to logs, telemetry, analytics, or URLs.
- **Strict TypeScript:** No `any` without documented justification. Zod schemas validate every tool setting and boundary.
- **Architectural Isolation:** `packages/core` is pure TypeScript and must never import from `apps/*` or access DOM (`window`, `document`), allowing it to run cleanly in Web Workers, Node.js CLI, and test environments.
- **Human-Centric Errors:** Never expose raw stack traces. Map all failures (password required, corrupted PDF, memory budget exceeded) to actionable recovery options.

## 2. Active Workspace Skills
The project includes 6 dedicated skills located in `.agents/skills/`:
- `converto-architecture`: System design, local vs. server runtime decision matrix, monorepo layout, and `ConvertoTool` interface.
- `converto-design-system`: Brand rules, tool page layouts, Radix/Tailwind component standards, and WCAG 2.2 AA accessibility.
- `converto-privacy-security`: Client-side encryption (WebCrypto), CSP headers, retention policies, and privacy proof verification.
- `converto-tool-builder`: Development runbook for implementing PDF tools, settings schemas, Web Worker dispatch, and failure handling.
- `converto-testing`: Testing strategy, fixture matrices, memory budgets, and Playwright privacy audits.
- `converto-ai-features`: LLM abstraction layer, bounding-box citations, PII redaction heuristics, and prompt-injection defense.
