# Development Guide — Competition Papers Platform (MVP)

This document describes how to set up, develop, and extend the MVP for a web platform where competition enthusiasts (equity research, business analysis, accounting, strategy, etc.) can upload, discover, and analyze past competition papers.

The current repo is a Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui frontend scaffold. Backend integrations (Auth, Firestore, Storage, Search) will be added in phases.

---

## 1. Goals and MVP Scope

Two core features for MVP:

1) Document Sharing & Upload
- Users can upload their papers (PDF/DOC/DOCX/PPT/PPTX).
- Each upload requires metadata: `competition`, `field/category`, `year`, `institution`, `team`, `title`, `description`, optional `topics`, `companies`.
- Contribution incentive: A user must upload at least one paper before viewing/downloading others.
- Authenticity validation: metadata cross-check + optional organizer verification + community flagging/review with reputation.

2) Smart Search, Suggestions & Analysis
- Search by competition, topic, company/equity, institution, year.
- Suggestion engine in the search box (autocomplete) recommends related analysis methods (DCF, SWOT, Porter’s Five Forces), related companies/fields, and relevant past papers.
- Semantic search over metadata + full text using vector embeddings.

---

## 2. Current App Structure (high level)

- App Router pages
  - `/` Home (landing; not yet wired to data)
  - `/auth/login`, `/auth/signup` (forms; currently mock only)
  - `/upload` (rich upload form; currently simulates upload)
  - `/search` (filters, list UI; currently uses mock data)
  - `/document/[id]` (details/viewer; currently mock data)
- UI: shadcn/ui (Radix Primitives), Tailwind CSS, Notion-inspired minimalist styling.

Planned backend wiring: Firebase (Auth, Firestore, Storage), plus a vector search provider (Pinecone/Weaviate/Supabase Vector) and an embeddings API (e.g., OpenAI/Azure/Open-source local alternatives).

---

## 3. Architecture Overview

Frontend: Next.js 14 App Router (React 18 + TypeScript)
- Client components for forms and interactions.
- Server Actions/Route Handlers for API endpoints (file uploads, metadata persistence, search endpoints).

Backend: Start with Firebase (recommended for MVP)
- Firebase Auth (email/password + OAuth providers)
- Firestore (Users, Papers, Flags/Validations, SearchIndex metadata)
- Firebase Storage (raw files)
- Cloud Functions (webhooks, validations, scheduled re-indexing)

Search: Semantic + keyword hybrid
- External vector DB (Pinecone/Weaviate/Supabase Vector) for embeddings.
- Embeddings provider (OpenAI text-embedding-3-large/small or Azure OpenAI equivalent). Index both metadata and extracted document text.
- Optional: Lightweight keyword search fallback using Firestore queries (for MVP bootstrap).

---

## 4. Data Model (Firestore)

Collections (proposal):

- `users/{userId}`
  - `email` (string)
  - `displayName` (string)
  - `reputation` (number, default 0)
  - `uploadsCount` (number)
  - `createdAt` (timestamp)

- `papers/{paperId}`
  - `title` (string)
  - `category` (enum: business-case, equity-research, accounting, financial-modeling, strategy)
  - `competition` (string)
  - `year` (number)
  - `university` (string)
  - `team` (string, optional)
  - `description` (string)
  - `topics` (string[])
  - `companies` (string[])
  - `authorUserId` (ref)
  - `storagePath` (string) // Firebase Storage path
  - `fileType` (string)
  - `fileSize` (number)
  - `pages` (number, optional if extracted)
  - `views` (number)
  - `downloads` (number)
  - `likes` (number)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - `status` (enum: active, flagged, under-review, removed)
  - `verified` (boolean, default false) // organizer/admin verification

- `flags/{flagId}`
  - `paperId` (ref)
  - `userId` (ref)
  - `reason` (string, enum or free text)
  - `createdAt` (timestamp)
  - `status` (enum: open, resolved, rejected)
  - `resolutionNote` (string)

- `validations/{validationId}` (optional, for reputation-driven validations)
  - `paperId` (ref)
  - `validatorUserId` (ref)
  - `vote` (enum: valid, invalid)
  - `weight` (number, based on reputation)
  - `createdAt` (timestamp)

- `searchIndex/{paperId}`
  - `paperId` (ref)
  - `embeddingId` (string) // external vector DB id
  - `metadata` (object mirror of key searchable fields)
  - `chunks` (array of chunk ids, optional, if chunked embeddings)

---

## 5. Access Control Logic (MVP)

- Gate downloads/views: A user must have `uploadsCount >= 1` to download or view full documents.
- Allow preview (title/metadata, small page preview) for users without uploads to encourage contribution.
- Server checks:
  - On `GET /api/papers/:id/download` or full viewer content, verify `uploadsCount >= 1`.
  - Return 403 with CTA to upload first if not eligible.

---

## 6. API Endpoints (Next.js Route Handlers)

All endpoints should validate Firebase Auth tokens server-side.

- `POST /api/upload`
  - Multipart form: file + JSON metadata.
  - Flow:
    1) Verify auth.
    2) Upload file to Firebase Storage.
    3) Create Firestore `papers` document.
    4) Extract text (via Cloud Function or server) and enqueue embedding job.
    5) Increment user `uploadsCount`.
  - Returns `{ paperId }`.

- `GET /api/papers`
  - Query params: `q`, `category`, `year`, `competition`, `university`, pagination.
  - Keyword search in Firestore; if `q` present and vector search enabled, call semantic search endpoint to get ids, then hydrate from Firestore.

- `GET /api/papers/:id`
  - Returns metadata and allowed preview content.

- `GET /api/papers/:id/download`
  - Checks access gate; generates a signed Storage URL; increments `downloads` counter.

- `POST /api/flags`
  - Body: `{ paperId, reason }`.
  - Creates a `flags` doc for review; optionally triggers admin notification.

- `POST /api/validate`
  - Body: `{ paperId, vote }`.
  - Records community validation with weighted reputation.

- `POST /api/search/semantic`
  - Body: `{ q }`.
  - Returns top-k paper ids + scores; also returns suggested methods/companies via a small ruleset or embedding of method keywords.

---

## 7. Search & Suggestions Implementation

- Embeddings: Use OpenAI `text-embedding-3-small` for cost-efficient MVP. Chunk extracted text into ~800–1200 token chunks; store vectors in Pinecone/Weaviate/Supabase.
- Metadata: Build a composite embedding for (title + description + topics + companies + competition + university).
- Suggestions:
  - Maintain a static list of analysis methods with keywords (DCF, SWOT, Porter’s Five, Comparable Companies, Precedent Transactions, WACC, Sensitivity Analysis, Unit Economics, Cohort Analysis).
  - For a query `q`, compute similarity vs. this method list and return top 3.
  - Also suggest related companies using symbol/name alias list or by nearest-neighbor on companies field.

---

## 8. Validation and Authenticity

- Metadata cross-checks:
  - Require `competition` + `year` + `university`. Optional `team`.
  - Build a `competitions` reference map (name/year typical ranges). Basic sanity checks.
- Organizer verification (optional): store `verified=true` if organizers/admins confirm.
- Community validation:
  - Users with `reputation >= X` can cast validations with weight.
  - Threshold auto-marks `verified=true` and resolves flags.

---

## 9. UI Flow Mapping (current → target)

- `/upload` (exists): Wire to `POST /api/upload`, show progress, error states, success redirect to `/document/[id]`.
- `/search` (exists): Replace mocks with `GET /api/papers` + client autocomplete that calls `/api/search/semantic` after debounce; show mixed keyword + semantic results.
- `/document/[id]` (exists): Hydrate with `GET /api/papers/:id`; gate full preview/download; show related docs (semantic nearest-neighbors).
- `/auth/login`, `/auth/signup` (exist): Wire to Firebase Auth (email/password + OAuth). After login, redirect to `/dashboard`.

Gaps/TODOs are called out as implementation tasks below.

---

## 10. Implementation Tasks (phased)

Phase A — Foundations
- [ ] Add Firebase SDK config, Auth provider, and server-side admin SDK for Route Handlers.
- [ ] Add file upload (client → server → Firebase Storage) with progress and max size checks.
- [ ] Create Firestore collections and security rules.
- [ ] Add `/api/upload`, `/api/papers`, `/api/papers/:id`, `/api/papers/:id/download`.
- [ ] Gate access based on `uploadsCount`.

Phase B — Search MVP
- [ ] Extract text from uploaded files (Cloud Function using `pdf-parse`, `mammoth` for docx, etc.).
- [ ] Generate embeddings and upsert to vector DB.
- [ ] Implement `/api/search/semantic` and client autocomplete.

Phase C — Validation Layer
- [ ] Implement flagging (`/api/flags`) and admin review screen (basic table in `/dashboard`).
- [ ] Add community validations and reputation adjustments.

Phase D — Polish
- [ ] Analytics on views/downloads; related docs widget uses semantic neighbors.
- [ ] Improve empty states, errors, loading skeletons.

---

## 11. Environment & Configuration

Create a `.env.local` with:

- Firebase (Client):
  - `NEXT_PUBLIC_FIREBASE_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `NEXT_PUBLIC_FIREBASE_APP_ID`

- Firebase Admin (Server):
  - `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON string) or `GOOGLE_APPLICATION_CREDENTIALS` path

- Embeddings Provider (pick one):
  - `OPENAI_API_KEY`
  - or `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_EMBEDDING_MODEL`

- Vector DB (pick one):
  - Pinecone: `PINECONE_API_KEY`, `PINECONE_INDEX`
  - Weaviate: `WEAVIATE_URL`, `WEAVIATE_API_KEY`
  - Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`

Optional:
- `NEXT_PUBLIC_APP_URL`

See `.env.example` for a template.

---

## 12. Security and Rules (high level)

- Firestore security rules:
  - Only authenticated users can write `papers` they own.
  - Reads: Allow metadata reads for all, but full-content/download gated by cloud endpoint verifying `uploadsCount`.
  - Flags/validations: Only authenticated users; admin-only resolution.
- Storage rules: Only owner can upload to their namespace; reads via signed URLs.
- Never expose service account keys client-side.

---

## 13. Testing Strategy

- Unit: Pure helpers (e.g., text chunking, suggestion scoring).
- Integration: API route handlers with mocked Firebase Admin + vector DB.
- E2E (later): Auth + upload + search happy path via Playwright.

---

## 14. Local Development

Prereqs: Node 18+, PNPM

Install deps:

```
pnpm install
```

Run dev server:

```
pnpm dev
```

Open: http://localhost:3000

---

## 15. Folder Conventions (planned)

- `app/api/...` — Route Handlers (upload, papers, search)
- `lib/firebase/client.ts` — Firebase Web SDK init
- `lib/firebase/admin.ts` — Admin SDK init (server only)
- `lib/search/` — embeddings, vector db client, chunking utils
- `lib/validators/` — zod schemas for request/metadata validation
- `components/` — UI components (already present)

---

## 16. UI/UX Guidelines (Notion-inspired)

- Neutral, whitespace-focused, black/white with subtle grays.
- Clean typography; minimal iconography.
- Key Screens:
  - Home (search + trending)
  - Upload (simple form + dropzone)
  - Browse/Search Results (filters)
  - Paper Details/Viewer (metadata + gated view/download)
  - Dashboard (uploads, flags/validations)

---

## 17. Open Questions (for product/design)

- Validation: manual (admin/organizer), automated cross-checks, or community-driven? MVP: community + admin override.
- Search: bootstrap with keyword, add semantic ASAP. If costs matter, start with small `text-embedding-3-small` + Supabase Vector.
- Access incentive: Require 1 upload to download; allow limited previews for zero-upload users.

---

## 18. Acceptance Criteria (MVP)

- Authenticated user can upload a paper with required metadata, file stored, Firestore doc created.
- Non-contributor sees previews but cannot download; contributor (>=1 upload) can download/view full content.
- Search returns results by keyword filters; semantic endpoint returns relevant ids and suggestions.
- Users can flag a paper; admin can mark resolved; reputation increases for valid validators.

---

## 19. Next Steps for This Repo

- Add Firebase config files and environment vars.
- Scaffold `app/api/upload/route.ts`, `app/api/papers/route.ts`, `app/api/papers/[id]/route.ts`, `app/api/search/semantic/route.ts`.
- Implement client calls from existing pages to replace mocks.
- Add a lightweight `docs/ARCHITECTURE.md` later for deeper internals.
