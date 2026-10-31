# Converto — Production Deployment & Security Runbook

This document specifies the deployment architecture, security gates, privacy enforcement verification, and operational runbooks for **Converto**.

---

## 1. Production Architecture Overview

Converto is architected with a **Local-First, Zero-Knowledge Privacy Architecture**:
1. **Frontend Client:** Next.js 15 (App Router, standalone output), Tailwind CSS, Radix UI.
2. **Local PDF Processing:** In-browser Web Workers running `pdf-lib`, `pdf.js`, and WebAssembly. No file bytes leave the browser for standard operations (Merge, Split, Compress, Rotate, Watermark, Organize, Sign, Redact, local OCR).
3. **Encrypted Storage:** IndexedDB with WebCrypto PBKDF2 + AES-GCM (256-bit) user vaults for local offline session state.
4. **Server API (Opt-in only):**
   - AI Document Intelligence (LLM abstraction with page citations and bounding boxes)
   - High-accuracy GPU OCR
   - Tokenized Secure Share Links (AES-256 encrypted at rest, TTL auto-purge)
5. **Auxiliary Services:**
   - **Redis 7:** Rate limiting, session invalidation, ephemeral share tokens.
   - **ClamAV Daemon:** Antivirus scanning for any document uploaded to server API.
   - **Object Storage (S3 / Cloudflare R2):** Lifecycle expiration policy automatically deleting documents after 24–72 hours.

---

## 2. Pre-Launch Security & Privacy Audit Checklist

### Privacy & Data Integrity
- [x] **Zero File Content Logging:** Ensure no logging framework, analytics tag, or server route logs raw document bytes, extracted text, or filenames.
- [x] **Client-Side Privacy Proof Auditor:** Active network sniffer monitoring `XMLHttpRequest` and `window.fetch` to mathematically prove 0 byte leakage to users.
- [x] **Upload Consent Gate:** Explicit opt-in modal before any file or text chunk is dispatched to `/api/v1/ai/*` or `/api/v1/share`.
- [x] **Prompt Injection Defense:** Strict document boundary fencing (`<<<DOCUMENT_DATA>>> ... <<<END_DOCUMENT_DATA>>>`) and user instruction stripping to prevent prompt hijacking.
- [x] **Deterministic PII Sanitization:** Luhn algorithm checksum verification for payment cards and regex masks for SSN, emails, and phone numbers before AI processing.

### HTTP Security Headers
The following headers are enforced in `apps/web/next.config.ts`:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(), geolocation=()
```

### Production CSP Recommendation
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self' data:; connect-src 'self' blob:; frame-src 'self' blob:;
```

---

## 3. Ephemeral Retention & S3 Auto-Delete Policy

Server-side files (used for secure share links and AI temporary parsing) must be configured with an AWS S3 or Cloudflare R2 bucket lifecycle rule:

```json
{
  "Rules": [
    {
      "ID": "ConvertoEphemeralPurge",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "shares/"
      },
      "Expiration": {
        "Days": 1
      },
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 1
      }
    }
  ]
}
```

---

## 4. ClamAV Antivirus Daemon Integration

When documents are uploaded to the optional cloud backend:
1. File buffer is streamed through TCP port `3310` to `converto-clamav`.
2. If `FOUND` is returned by ClamAV, the request is immediately dropped with HTTP `422 Unprocessable Content` and the buffer is overwritten in memory.
3. No infected file is ever saved to persistent storage.

---

## 5. Stripe Billing & Webhook Security

1. **Webhook Signature Verification:** Always verify `stripe-signature` header using the endpoint secret `STRIPE_WEBHOOK_SECRET` before processing subscription events.
2. **Idempotency:** Record `event.id` in Redis with a 24-hour TTL to prevent double-crediting.
3. **Non-Intrusive Freemium:** Never inject watermarks or impose artificial delays on free users. Local tools remain 100% free forever.

---

## 6. Docker Container Deployment

### Local Staging with Docker Compose
```bash
# Build and start all services (Web, Redis, ClamAV)
docker-compose up -d --build

# Inspect service logs
docker-compose logs -f converto-web
```

### Standalone Production Docker Run
```bash
docker build -t converto-web:latest .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  converto-web:latest
```

---

## 7. CI/CD Quality Gates

Every pull request and deployment must pass the automated quality gates:
1. **Unit & Integration Tests:** `npm test` (All 44+ tests covering core PDF operations, WebCrypto vault, batch zip exporter, AI citations, Luhn PII detection, and CLI).
2. **Next.js Production Build:** `npm run build` (Ensuring zero type errors, valid SSG static export for all 20+ tools, and valid API routes).
3. **Accessibility Audit:** WCAG 2.2 AA compliant contrast, aria attributes, and keyboard navigation.
