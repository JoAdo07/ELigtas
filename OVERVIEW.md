# ELigtas — Project Overview

**ELigtas** is a smart video organizer for the videos people save across social media. Instead of leaving saved YouTube, TikTok, and Instagram links scattered across apps, ELigtas imports them, classifies them into topics such as Cooking, Tech Tips, Travel, and Fitness, and keeps them searchable in one place.

> **Status:** early MVP. The link-import and classification core plus a local-first web library are implemented and tested. The mobile client, accounts, database, and automatic platform sync are still on the roadmap.

## The problem

Saving a video is easy; finding it again is not. Saved content is spread across platforms, and each app has its own limited search and collections. People save recipes, workouts, travel ideas, and tutorials, then never see them again.

## What ELigtas does

- Imports a video from a pasted YouTube, TikTok, or Instagram link.
- Normalizes the link into a canonical URL and a platform-specific video id.
- Classifies the video into one best-fit category with a confidence score.
- Falls back to a deterministic offline scorer when no AI key is configured or the AI call fails.
- Lets the user override the category with a manual correction.
- Refuses unsupported or malformed links with a plain-English explanation.
- Provides a local-first web library where imported videos can be searched,
  filtered, re-categorized, and exported as JSON.
- Uses a 26-category taxonomy in the web app while keeping the original
  9-category list stable for callers that depend on it.

## Who it is for

People who save a lot of content and want it organized: home cooks, fitness enthusiasts, travelers, DIYers, students, and anyone who uses social platforms as a bookmarking tool.

## Current status

### Implemented

| Area | What works | Where |
| --- | --- | --- |
| Link import | YouTube/TikTok/Instagram URL parsing, canonical URLs, plain-English errors | `backend/src/import-url.js` |
| AI classification | OpenAI-compatible `/chat/completions` call, JSON parsing, confidence clamping | `backend/src/classify.js` |
| Offline fallback | Keyword scorer with whole-word matching and common inflections | `backend/src/classify.js` |
| Manual overrides | `applyOverride()` records a user correction | `backend/src/classify.js` |
| Extended taxonomy | 26 categories and keyword sets used by the web library | `backend/src/categories.js` |
| Local-first web library | Paste-to-sort UI, metadata fallback, search, filters, category overrides, browser storage, JSON export | `web/` |
| Tests and CI | 47 tests (37 backend + 10 web); both suites run on every push and PR | `backend/tests/`, `web/tests/`, `.github/workflows/test.yml` |

### Planned (from the SRS)

- React Native/Expo mobile app
- Authentication (email/password and OAuth) with linked social accounts
- Automatic import of saved or liked videos through platform APIs
- PostgreSQL persistence and daily refresh jobs
- Tags, notes, and drag-and-drop organization
- Search and filtering with relevance ranking
- Embedded playback without downloading or hosting the videos

## How it works

The current core is deliberately dependency-free Node.js:

```text
Paste link
   ↓
parseVideoUrl()  →  { platform, videoId, canonicalUrl }
   ↓
categorizeVideo()
   ├─ AI path: OpenAI-compatible API (when configured)
   └─ local fallback: keyword scorer
   ↓
{ category, confidence, source: "ai" | "local" | "manual" }
```

The web app wraps this flow in a small standard-library HTTP server
(`web/server.js`) and keeps the resulting library in browser storage.

The SRS targets a larger architecture for the finished product:

```text
[React Native app]
        ↓
[Node.js/Express API]
        ↓
[PostgreSQL + Redis]
        ↓
[OpenAI API] + [YouTube/TikTok/Instagram APIs]
```

## Quick start

Run the web library (no install step; Node 20+):

```bash
cd web
npm start
# open http://127.0.0.1:3000
```

Set `OPENAI_API_KEY` in the server environment to enable AI classification.
Without it, the deterministic offline scorer is used.

Run the test suites:

```bash
cd backend && npm test
cd ../web && npm test
```

Use the core from Node.js:

```js
import { parseVideoUrl } from "./backend/src/import-url.js";
import { categorizeVideo, applyOverride } from "./backend/src/classify.js";

const link = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
const result = await categorizeVideo({
  title: "15-minute garlic butter pasta",
});
// { category: "Cooking", confidence: 1, source: "local" }

applyOverride(result, "Travel");
```

## Repository layout

```text
ELigtas/
├─ backend/            # implemented core (standard-library-only Node.js)
│  ├─ src/             # import-url.js, classify.js, categories.js
│  ├─ tests/           # node:test suites
│  └─ README.md
├─ web/                # local-first web library (stdlib server + static UI)
│  ├─ public/          # HTML, CSS, browser JavaScript
│  ├─ tests/           # API tests with injected metadata/AI fetches
│  └─ README.md
├─ frontend/           # planned React Native/Expo app (README only)
├─ README.md           # Software Requirements Specification v1.1
├─ CONTRIBUTING.md
└─ LICENSE
```

## Roadmap

Near term: grow the local-first web library (tags, notes, playback, and better
import/export) and add server-side persistence. After that, build the mobile
client, connect platform OAuth for automatic saved/liked imports, and add
accounts and sync.

See the SRS (`README.md`) for the full requirements, `web/README.md` for the
web app, and `backend/README.md` for core API usage.

## Contributing

Read `CONTRIBUTING.md` first. The backend is standard-library-only and every behavior needs a test.
