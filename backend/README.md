# ELigtas backend — AI categorization core (SRS §3.3)

First working code for the spec: classify a saved video into one best-fit
category with a confidence score. Stdlib only (`fetch` for the AI path).

```js
import {
  categorizeVideo,
  applyOverride,
  EXTENDED_CATEGORIES,
} from "./src/classify.js";

// Offline, no key needed:
await categorizeVideo({ title: "15-minute garlic butter pasta", description: "..." });
// → { category: "Cooking", confidence: 1, source: "local" }

// With an OpenAI-compatible key (falls back to local on any failure):
await categorizeVideo(input, { apiKey: process.env.OPENAI_API_KEY });

// Use the 26-category web taxonomy instead of the original 9:
await categorizeVideo(input, { categories: EXTENDED_CATEGORIES });

// User correction (§3.3 FR3):
applyOverride(record, "Travel");
```

`DEFAULT_CATEGORIES` stays at the original 9 categories for compatibility.
`EXTENDED_CATEGORIES` and all keyword sets live in `src/categories.js`; the web
app in `../web` opts into the wider taxonomy.

## Manual import via link (SRS §3.2 FR2)

```js
import { parseVideoUrl } from "./src/import-url.js";

parseVideoUrl("https://youtu.be/dQw4w9WgXcQ");
// → { platform: "youtube", videoId: "dQw4w9WgXcQ",
//     canonicalUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

Unparseable links throw a plain-English error (bad id, short link needing
resolving, unsupported host). Run tests: `npm test`.

For the browser UI, see `../web/README.md`.
