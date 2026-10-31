---
name: converto-privacy-security
description: Privacy and security rules for Converto, a local-first PDF toolkit that handles sensitive documents (contracts, IDs, invoices). Covers upload consent, file retention, logging, CSP and headers, server upload validation, share links, API keys, and honest privacy wording. Use this skill whenever a Converto change touches file upload, server processing, storage, sharing, authentication, analytics, logging, AI calls, privacy policy text, or security review, and whenever the user asks "is this safe" or "how do we handle user files".
---

# Converto privacy and security

Users hand Converto documents like passports, contracts and bank statements. The product's trust depends on never being surprising about where those files go. When in doubt, choose the more private option and tell the user.

## Non-negotiable rules

1. **Local by default.** A tool uploads nothing unless it is marked `runtime: 'server'` or `'ai'` in its plugin definition.
2. **Explicit consent before any upload.** Show a clear step: what is sent, why it can't be done locally, how long it's kept, and a Cancel option. Remember the choice per tool only if the user asks.
3. **No file content anywhere it doesn't belong.** Never put file bytes, extracted text, filenames or metadata in logs, error trackers, analytics events or URLs.
4. **Short retention.** Server files auto-delete within 1 hour by default (lifecycle rule on storage, not just a cron). Offer "delete now" after download.
5. **No training on user files.** Contract with AI providers accordingly and say it in the UI.
6. **Secrets stay server-side.** LLM keys, storage keys and signing secrets never reach the client bundle.
7. **Honest wording.** Never write "100% secure" or "we never see your files" for features that upload. Say exactly what is and isn't uploaded.

## Privacy badges

Every tool shows one of: "Processed on your device", "Uses our secure server", "Uses AI (file sent to our server)". The badge is derived from the plugin's `runtime` field, never hand-written per page, so it can't drift from reality.

## Privacy proof panel

Provide a panel that lists network requests made during the session (using the Performance/Resource Timing API or a fetch wrapper) so users can see that local tools made no uploads. Keep it simple and truthful; it demonstrates behavior, it is not a security guarantee.

## Server upload handling

Apply in this order for every uploaded file:
- Authenticate or rate-limit by IP/session; enforce per-file and per-request size limits.
- Validate type by magic bytes, not extension or Content-Type.
- Scan with ClamAV before processing.
- Process inside a sandbox (container with no network egress, read-only root, CPU/memory/time limits), especially for Office conversions, which parse untrusted complex formats.
- Store with random unguessable keys, encrypted at rest, with an expiry lifecycle.
- Serve downloads through short-lived signed URLs.
- Return generic errors to clients; keep detail in logs without file content.

## Web security baseline

- Strict CSP (no inline scripts, nonces for what's needed, restrict `connect-src` and `worker-src`), HSTS, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, frame-ancestors none (except the share viewer if embedding is wanted).
- CSRF protection on cookie-authenticated routes; SameSite cookies.
- Sanitize anything rendered from PDF metadata or extracted text; treat PDF content as untrusted input (it can contain JavaScript, launch actions and malicious links). Never execute PDF JavaScript; strip or neutralize it in the viewer.
- Audit dependencies in CI; pin versions; review WASM binaries' provenance.

## Share links

- Random 128-bit+ ids; optional password stored as a slow hash (argon2/bcrypt).
- Expiry (1 hour to 30 days), download limits, view-only mode, one-click revoke, and deletion of the underlying file at expiry or revoke.
- View-only is a deterrent, not DRM; say so in the UI help text.

## Client-side storage

- Workspace files and signatures live in IndexedDB. Signature and form-profile data is encrypted with a key derived from a user passphrase (PBKDF2/Argon2 plus AES-GCM via WebCrypto). If the user forgets the passphrase it can't be recovered; say so.
- Provide "Clear all local data" in settings and clear the workspace on request.

## Accounts, API keys, billing

- API keys shown once, stored hashed, scoped, rotatable, rate-limited.
- Stripe handles card data; Converto never sees or stores card numbers.
- Account deletion removes all server data and shares; offer data export.

## AI features

- Send the minimum needed (chunks, not whole documents, when possible).
- Use providers under no-retention / no-training terms and disclose the provider in the privacy page.
- Treat document text as untrusted: it may contain prompt-injection ("ignore your instructions..."). Keep system instructions separate, never give the model tools that can take actions from document-derived instructions, and validate structured output with a schema.

## Review checklist (run before merging anything that touches files or servers)

- [ ] Is the `runtime` field correct and is the consent screen shown for any upload?
- [ ] Any file content, filename or metadata in logs, URLs, analytics?
- [ ] Retention and auto-delete configured and tested?
- [ ] Upload validated, scanned, sandboxed, size-limited?
- [ ] Secrets only on the server?
- [ ] Privacy policy and in-app wording still accurate?

Note: this skill gives engineering guidance, not legal advice. Recommend a lawyer review the privacy policy and terms, especially regarding GDPR, CCPA and the Philippine Data Privacy Act if serving those users.
