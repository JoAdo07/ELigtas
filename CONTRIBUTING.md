# Contributing to ELigtas

Thanks for stopping by. ELigtas is a small, early-stage project: an SRS
(`README.md`), a Node core in `backend/`, and a local-first web library in
`web/`. Small, focused contributions are the most welcome — a bug fix with a
test beats a feature without one.

## How to contribute

1. **Pick or open an issue.** Check open issues first; if none covers your
   idea or bug, open one describing what happens now, what should happen
   instead, and how to reproduce it.
2. **Fork, branch, open a PR against `main`.** One concern per PR.
   Branch names: `feat/...`, `fix/...`, `docs/...`, `chore/...`.
3. **Describe the PR**: what changed, how you tested it, and the issue it
   closes (`Closes #N`).

## Backend rules (`backend/`)

- **Standard library only.** `backend/` has no dependencies and must keep
  none — `src/*.js` runs on plain Node 18+ with no install step.
- **Every behavior gets a test.** Tests live in `backend/tests/*.test.js`
  and run with `npm test` (or `node --test "tests/*.test.js"`).
  Cover the happy path, the failure path, and the edge you fixed.
- **Dry-run-safe by default.** Anything that moves, renames, or deletes
  user data must preview first and apply only on explicit confirmation.
- **Errors in plain English.** Rejections and toasts name what's wrong and
  what to do next — never a bare stack trace.

## Web rules (`web/`)

- **Standard library only.** The server and browser code have no build step
  and no runtime dependencies. Keep it that way unless the SRS changes.
- **Tests live in `web/tests/*.test.js`.** Inject metadata/AI fetches instead
  of calling real platforms from tests. Run `npm test` from `web/`.
- **Keep the key server-side.** `OPENAI_API_KEY` belongs in the server
  environment. Never send it to the browser or log it.
- **Be honest about platform limits.** Do not add scraping or fake account
  imports. TikTok/Instagram saved/liked imports need OAuth and API approval.
- **Browser storage is user data.** Destructive actions need a preview or an
  undo; the current library has undo for single-video deletion and a
  confirmation for "start fresh".

## Docs

- User docs live in `backend/README.md` (core usage), `web/README.md` (the web
  library), `OVERVIEW.md` (plain-language status), and the root `README.md`
  (the SRS spec).
- Changing a spec'd behavior? Update the matching SRS section **and** the
  §7.3 revision-history row in the same PR.
- New user-facing feature? Document it in `backend/README.md`.

## What we're looking for

- Reproducible bug fixes with before/after behavior.
- SRS features implemented to spec (§3), each with tests.
- Docs, examples, and translations.
