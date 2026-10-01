/**
 * ELigtas AI categorization core (SRS §3.3, prompt in §7.1).
 *
 * Classifies a saved video into one best-fit category with a confidence
 * score. Two paths, stdlib only:
 *
 * - `classifyWithAI` — calls any OpenAI-compatible `/chat/completions`
 *   endpoint and parses `{ category, confidence }` from the reply.
 * - `scoreLocally` — deterministic offline keyword fallback. No network,
 *   no key, fully testable.
 *
 * `categorizeVideo` tries AI first (when an API key is configured) and
 * falls back to local scoring on any failure, so a dead network or a
 * malformed reply degrades instead of erroring. `applyOverride` records
 * a manual user correction (§3.3 FR3).
 */

export const DEFAULT_CATEGORIES = Object.freeze([
  "Cooking",
  "Tech Tips",
  "Travel",
  "Fitness",
  "Beauty",
  "DIY",
  "Education",
  "Entertainment",
  "Other",
]);

const KEYWORDS = Object.freeze({
  Cooking: ["recipe", "cook", "bake", "kitchen", "meal", "ingredient", "chef", "food"],
  "Tech Tips": ["software", "app", "phone", "laptop", "coding", "tutorial", "gadget", "ai"],
  Travel: ["travel", "flight", "hotel", "beach", "city", "trip", "vacation", "itinerary"],
  Fitness: ["workout", "gym", "exercise", "fitness", "muscle", "cardio", "yoga", "training"],
  Beauty: ["makeup", "skincare", "beauty", "hair", "cosmetic", "fragrance"],
  DIY: ["diy", "craft", "woodwork", "repair", "build", "handmade", "tools"],
  Education: ["learn", "course", "lecture", "study", "school", "exam", "language"],
  Entertainment: ["movie", "music", "game", "comedy", "show", "concert", "funny"],
  Other: [],
});

function words(text) {
  return String(text ?? "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function scoreLocally(input = {}, categories = DEFAULT_CATEGORIES) {
  const haystack = [input.title, input.description, input.transcript].join("\n").toLowerCase();
  let best = "Other";
  let bestHits = 0;
  let totalHits = 0;
  for (const category of categories) {
    let hits = 0;
    for (const keyword of KEYWORDS[category] ?? []) {
      if (haystack.includes(keyword)) hits += 1;
    }
    totalHits += hits;
    if (hits > bestHits) {
      best = category;
      bestHits = hits;
    }
  }
  if (bestHits === 0) return { category: "Other", confidence: 0 };
  return { category: best, confidence: Math.round((bestHits / totalHits) * 100) / 100 };
}

function clampConfidence(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100));
}

export function buildClassificationPrompt(input = {}, categories = DEFAULT_CATEGORIES) {
  const list = categories.join(", ");
  return (
    `Classify the following video into one of: ${list}.\n` +
    `Reply with JSON only: {"category": "<one of the list>", "confidence": <0-1>}.\n\n` +
    `Title: ${input.title ?? ""}\nDescription: ${input.description ?? ""}\nTranscript: ${(input.transcript ?? "").slice(0, 2000)}`
  );
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI reply contained no JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

export async function classifyWithAI(
  input = {},
  {
    categories = DEFAULT_CATEGORIES,
    apiKey,
    model = "gpt-4o-mini",
    endpoint = "https://api.openai.com/v1/chat/completions",
    fetchImpl = globalThis.fetch,
  } = {},
) {
  if (!apiKey) throw new Error("classifyWithAI requires an apiKey");
  const res = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: buildClassificationPrompt(input, categories) }],
      temperature: 0,
    }),
  });
  if (!res.ok) throw new Error(`AI classify failed with HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(String(text));
  if (!categories.includes(parsed.category)) {
    throw new Error(`AI returned unknown category: ${JSON.stringify(parsed.category)}`);
  }
  return { category: parsed.category, confidence: clampConfidence(parsed.confidence) };
}

export async function categorizeVideo(input = {}, opts = {}) {
  const categories = opts.categories ?? DEFAULT_CATEGORIES;
  if (opts.apiKey) {
    try {
      const ai = await classifyWithAI(input, { ...opts, categories });
      return { ...ai, source: "ai" };
    } catch {
      // Fall through to the offline scorer below.
    }
  }
  return { ...scoreLocally(input, categories), source: "local" };
}

export function applyOverride(record = {}, category) {
  if (typeof category !== "string" || !category.trim()) {
    throw new Error("applyOverride requires a non-empty category");
  }
  return { ...record, category: category.trim(), source: "manual" };
}
