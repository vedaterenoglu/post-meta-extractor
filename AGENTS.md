# AGENTS.md

## Purpose
This repository provides a framework-agnostic npm package for post metadata extraction with optional AI-based enrichment and framework wrappers.

## Project Priorities
1. Keep core extraction framework-agnostic and dependency-light.
2. Preserve backward compatibility for sync APIs.
3. Keep AI integration provider-agnostic (no hard provider coupling in core).
4. Ensure strong test coverage, especially branch coverage in parser and AI flow.

## Key Public APIs
- Core sync: `extractPostMeta`
- Core async AI: `extractPostMetaWithAI`
- React: `usePostMeta`, `usePostMetaWithAI`
- Solid: `createPostMeta`, `createPostMetaWithAI`
- Vue: `usePostMeta`, `usePostMetaWithAI`
- TanStack helper: `createTanStackStartAIAdapter`

## Guardrails
- Do not add built-in UI components.
- Do not add persistence/database logic.
- Do not replace parser-derived deterministic fields with AI output.
- Keep AI retries + diagnostics behavior consistent with tests and README.

## Docs Ownership
- `README.md` is the canonical source for package positioning, install, quickstart, and top-level public API framing.
- Deep docs live in the separate docs repository: `https://github.com/vedaterenoglu/post-meta-data-extractor-docs`.
- Avoid copy-paste duplication between README and deep docs; deep reference pages should link back to README canonical anchors.
- Every API change checklist:
  - Update `README.md`
  - Update impacted docs pages in `post-meta-data-extractor-docs`
  - Verify docs repo CI passes (`typecheck`, build, readme drift, links)

## Development Commands
- Install: `npm install`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Test: `npm test`
- Coverage: `npm run test:coverage`

## Testing Expectations
- Any parser or AI logic change must include unit tests.
- Keep global coverage thresholds passing:
  - Lines >= 85
  - Statements >= 85
  - Functions >= 85
  - Branches >= 80
- Avoid lowering thresholds to hide regressions.

## Release Notes
- Use beta versioning for feature expansions before stable (`0.x.0-beta.y`).
- Update README when API shape or behavior changes.
