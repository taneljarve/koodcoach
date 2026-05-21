# kood// coach — v2 plan

Three additions, no backend/auth changes. All AI work goes through the existing `callAIJson` helper on the Lovable AI Gateway.

## 1. New feature: Code Explainer (`/explain`)

A learning tool where a student pastes a snippet and gets a structured walkthrough — never a rewrite, never a "fixed" version.

**Inputs**
- Code snippet (required, monospace textarea)
- Language (auto-detect default, optional dropdown)
- Optional: "What confuses you?" one-line prompt to focus the explanation

**AI output (single JSON call → `/api/explain-code`)**
- `summary` — 2-sentence plain-English description
- `lineByLine[]` — `{ range: "12-18", what: "...", why: "..." }` so it teaches intent, not just syntax
- `concepts[]` — named concepts to go study (closures, async iterator, etc.) with a 1-line "why it matters"
- `performance[]` — concrete concerns (e.g. "O(n²) inside render", "re-creates regex per call")
- `security[]` — concrete concerns (e.g. "unescaped innerHTML → XSS", "SQL string concat")
- `missingEdgeCases[]` — empty array, null, very large input, unicode, concurrent calls, etc.
- `questionsToAskAuthor[]` — Socratic prompts the learner can bring to the author

Mentor prompt rule reused from `prompts.ts`: explain mechanics and trade-offs, do **not** output corrected code.

## 2. New feature: Review Call Recorder (`/call`)

Records a peer-review call (in-browser), transcribes, then summarizes for both reviewer and submitter.

**Capture**
- `MediaRecorder` API in the browser, mic only (default) + optional tab audio via `getDisplayMedia({ audio: true })` for remote calls
- Live timer, pause/resume, max ~30 min guard, waveform via Web Audio analyser
- Stored only in-memory as a `Blob` — no DB, matches the "don't overengineer" rule

**Transcription**
- Use **Lovable AI Gateway audio transcription** (already covered by `LOVABLE_API_KEY`, no extra secret, free within workspace credits). Server route `POST /api/transcribe` accepts `multipart/form-data`, forwards to the gateway's transcription endpoint, returns `{ text, segments }`.
- Whisper-compatible fallback documented in code comments if the user later wants self-hosted.

**Summarization (`/api/summarize-call`, reuses `MENTOR_SYSTEM`)**
- `tlDr` — 3 bullets
- `decisions[]` — what was agreed
- `actionItems[]` — `{ owner: "submitter" | "reviewer", task, why }`
- `openQuestions[]` — unresolved threads to revisit
- `feedbackQuality` — same 3-axis score as `FeedbackMeter` so the reviewer sees how they coached verbally
- `learningMoments[]` — concept names that came up, for the submitter to study

**UI flow**: Record → live transcript preview → Stop → "Summarize" → two-column result (Reviewer view / Submitter view) with copy buttons.

## 3. Compactness + usability pass (existing pages)

Goal: less scrolling, less prose, more signal.

- **Global density**: drop default card padding `p-6` → `p-4`, section gaps `space-y-8` → `space-y-5`, base font from default to `text-[13.5px]` on body, headings down one step (`text-2xl` → `text-xl`).
- **Home (`/`)**: collapse hero copy to one sentence + 3 feature chips (Review, Explain, Call). Remove redundant "mentor not solver" paragraph — keep as a small badge.
- **Review wizard**:
  - Input step: 2-column grid (title + criteria left, description + code right) instead of stacked.
  - Guide step: convert the 5 `GuideSection` cards into a single tabbed panel (Checklist / Questions / Edges / Mistakes / Focus) — collapses ~5 screens into one.
  - Feedback coach: move scores inline above the textarea as a thin pill bar; suggestions/missing/strengths become an accordion, not 3 stacked cards.
- **Truncation rule**: enforce `maxItems: 5` per AI list in prompts; long items clamp to 2 lines with "show more". Update `prompts.ts` to instruct the model: *"Each bullet ≤ 14 words. Max 5 per list."*
- **Nav**: add a compact top bar (Review · Explain · Call) shared via `__root.tsx` instead of per-page headers.

## File changes

```text
src/routes/
  __root.tsx            (shared compact nav)
  index.tsx             (trim copy, 3 feature cards)
  review.tsx            (tabs + accordion, density)
  explain.tsx           NEW
  call.tsx              NEW
  api/
    explain-code.ts     NEW
    transcribe.ts       NEW  (multipart → gateway)
    summarize-call.ts   NEW
src/components/
  explain-panel.tsx     NEW   (line-by-line + concept cards)
  call-recorder.tsx     NEW   (MediaRecorder hook + UI)
  density.css           NEW   (or tokens added to styles.css)
src/lib/
  prompts.ts            (+ EXPLAIN_SYSTEM, CALL_SUMMARY_SYSTEM, brevity rules)
  review-types.ts       (+ ExplainResult, CallSummary types)
  recorder.ts           NEW   (MediaRecorder helper, blob utils)
```

## Open questions (will ask after plan approval if needed)

1. Should the Code Explainer accept a **diff** as well as a single snippet (for reviewing PRs)?
2. For the call feature, OK to require **Chrome/Edge** (best `getDisplayMedia` audio support) and degrade gracefully on Safari?
3. Should call recordings/transcripts persist across reload (would need Lovable Cloud), or stay session-only as proposed?
