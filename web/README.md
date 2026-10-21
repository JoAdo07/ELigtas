# ELigtas web library

A local-first web app for the ELigtas core: paste a YouTube, TikTok, or Instagram link, let ELigtas read what it can, and file the video into one of 26 practical categories. The library lives in the browser (`localStorage`) and can be exported as JSON.

This is the first usable web UI for the project, not a mockup. It runs on the existing `backend/src` import and classification code with no frontend dependencies and no build step.

## What works today

- Paste-to-sort import for YouTube, TikTok, and Instagram links.
- Public metadata lookup where the platform allows it:
  - **YouTube** — public oEmbed (title, creator, thumbnail).
  - **TikTok** — public oEmbed, best effort. TikTok rate-limits this endpoint, so a manual caption may be needed.
  - **Instagram** — this build does not use an Instagram app token, so it asks for a title or caption instead of guessing.
- Automatic title fallback: when metadata is unavailable, the app opens a caption dialog and still sorts the video.
- 26-category taxonomy from `backend/src/categories.js`.
- Offline classifier by default; optional server-side OpenAI-compatible classification.
- Category overrides, search, category/source filters, sorting, and match confidence.
- Demo library on first visit, sample clearing, and "start fresh".
- Export the library as JSON.
- Plain-English errors for unsupported links, missing captions, duplicate imports, and server failures.

## What is deliberately not here

- **No account-level saved/liked imports.** Importing a user's TikTok or Instagram saved folder requires that platform's OAuth flow and API approval. Scraping those accounts is not implemented and is not a workaround we pretend to have.
- **No user accounts or server database.** This build is local-first: the library is stored in this browser. Export before clearing site data.
- **No embedded playback.** Cards link back to the original platform.
- **No tags, notes, drag-and-drop, or daily refresh.** Those are SRS roadmap items.

## Run it

Requires Node.js 20 or newer. There is nothing to install.

```bash
cd web
npm start
```

Open <http://127.0.0.1:3000>.

Useful environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `HOST` | `127.0.0.1` | Bind address |
| `OPENAI_API_KEY` | unset | Enables the AI classifier. Without it, the offline scorer is used. |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model name for an OpenAI-compatible endpoint |
| `OPENAI_ENDPOINT` | `https://api.openai.com/v1/chat/completions` | Chat-completions endpoint |

PowerShell:

```powershell
$env:OPENAI_API_KEY = "sk-..."
npm start
```

Bash:

```bash
OPENAI_API_KEY=sk-... npm start
```

The key stays on the server. The browser calls `/api/import`; it never receives the key. If the AI call fails, classification falls back to the offline scorer instead of failing the import.

## Tests

```bash
cd web
npm test
```

The web suite covers the API without calling real platforms (metadata and AI fetches are injected):

- taxonomy and status endpoints
- manual-title imports
- YouTube oEmbed metadata
- Instagram's `NEEDS_TITLE` response
- AI classification
- unsupported links, malformed JSON, static serving, and path traversal

Run the backend suite too when changing the core:

```bash
cd backend
npm test
```

## API

The web server is a small standard-library wrapper around `backend/src`.

### `GET /api/health`

```json
{ "ok": true }
```

### `GET /api/status`

```json
{
  "ai": false,
  "model": null,
  "categories": 26,
  "platforms": ["youtube", "tiktok", "instagram"]
}
```

Never includes the API key.

### `GET /api/categories`

```json
{ "categories": ["Cooking", "Tech Tips", "…", "Other"] }
```

### `POST /api/import`

Request:

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "15-minute garlic butter pasta",
  "description": "Optional context",
  "transcript": "Optional transcript"
}
```

`title` is optional when public metadata is available. If metadata cannot be read, the endpoint returns `422` with `code: "NEEDS_TITLE"` and the parsed video; the browser then asks for a caption and retries.

Success:

```json
{
  "platform": "youtube",
  "videoId": "dQw4w9WgXcQ",
  "canonicalUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "15-minute garlic butter pasta",
  "description": "Optional context",
  "author": "",
  "thumbnailUrl": "",
  "metadataSource": "manual",
  "category": "Cooking",
  "confidence": 1,
  "source": "local"
}
```

Errors use `{ "error": "plain-English message" }`. Import bodies are limited to 64 KB. Only canonical YouTube/TikTok/Instagram URLs are accepted. The app never fetches arbitrary user-supplied hosts.

## Project layout

```text
web/
├─ server.js          # stdlib HTTP server, static files, oEmbed, import API
├─ package.json       # start/test scripts; zero dependencies
├─ public/
│  ├─ index.html
│  ├─ styles.css
│  ├─ app.js          # library state, rendering, localStorage, modal, export
│  └─ favicon.svg
└─ tests/
   └─ server.test.js
```

The server imports `parseVideoUrl`, `categorizeVideo`, and `EXTENDED_CATEGORIES` from `../backend/src`. Keeping the classification core shared means the web app and future clients cannot drift into different taxonomies.

## How sorting works

1. `parseVideoUrl()` normalizes the link and rejects unsupported hosts.
2. The server fetches public oEmbed metadata when a title was not supplied.
3. `categorizeVideo()` runs the AI path if a key is configured, otherwise the offline scorer.
4. The browser stores the result in `localStorage` under `eligtas.library.v1`.
5. A category override sets `source: "manual"` and confidence `1`.

The offline scorer matches whole words (with common inflections), so "said" does not count as "ai" and "happy" does not count as "app". Confidence is the winning category's share of all keyword hits, rounded to two decimals.

## Privacy and security notes

- The library never leaves the browser unless the user exports it or the browser syncs its own storage.
- The server only makes outbound requests to the fixed YouTube/TikTok oEmbed endpoints and the configured AI endpoint.
- Responses include a restrictive Content Security Policy (`frame-ancestors 'none'`, no inline scripts), `nosniff`, and a strict referrer policy.
- Static file resolution rejects paths outside `web/public`.
- This is a local development app, not a hardened multi-user deployment. Add authentication, rate limiting, HTTPS, and server-side persistence before exposing it publicly.

## Related docs

- `../OVERVIEW.md` — plain-language project overview
- `../README.md` — the SRS
- `../backend/README.md` — core API usage
