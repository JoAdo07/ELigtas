# ELigtas backend — AI categorization core (SRS §3.3)

First working code for the spec: classify a saved video into one best-fit
category with a confidence score. Stdlib only (`fetch` for the AI path).

```js
import { categorizeVideo, applyOverride } from "./src/classify.js";

// Offline, no key needed:
await categorizeVideo({ title: "15-minute garlic butter pasta", description: "..." });
// → { category: "Cooking", confidence: 1, source: "local" }

// With an OpenAI-compatible key (falls back to local on any failure):
await categorizeVideo(input, { apiKey: process.env.OPENAI_API_KEY });

// User correction (§3.3 FR3):
applyOverride(record, "Travel");
```

Run tests: `npm test`.
