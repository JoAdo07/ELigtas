/**
 * ELigtas web app server.
 *
 * A deliberately small, dependency-free HTTP layer around the existing
 * backend core. It does three jobs:
 *
 *   1. Serve the static single-page library in ./public.
 *   2. Resolve public oEmbed metadata for YouTube/TikTok links.
 *   3. Classify a link with the optional AI path or the offline scorer.
 *
 * Instagram does not expose public oEmbed without an app access token, so an
 * Instagram import asks the browser for a title/caption instead of guessing.
 * There is no account scraping here.
 */

import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, extname, isAbsolute, join, normalize, relative } from "node:path";

import {
  EXTENDED_CATEGORIES,
  categorizeVideo,
} from "../backend/src/classify.js";
import { parseVideoUrl } from "../backend/src/import-url.js";

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), "public");
const MAX_BODY_BYTES = 64 * 1024;
const MAX_TITLE = 500;
const MAX_DESCRIPTION = 4000;
const MAX_TRANSCRIPT = 8000;
const MAX_URL = 2000;

const MIME_TYPES = Object.freeze({
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
});

const SECURITY_HEADERS = Object.freeze({
  "content-security-policy":
    "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
});

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function cleanMultiline(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim().slice(0, maxLength);
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    ...SECURITY_HEADERS,
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const err = new Error("That request is too large. Keep the title and description under 64 KB.");
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const err = new Error("Send a JSON object with a url field.");
      err.status = 400;
      throw err;
    }
    return parsed;
  } catch (error) {
    if (error.status) throw error;
    const err = new Error("That request was not valid JSON.");
    err.status = 400;
    throw err;
  }
}

function oembedUrl(parsed) {
  if (parsed.platform === "youtube") {
    return `https://www.youtube.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}&format=json`;
  }
  if (parsed.platform === "tiktok") {
    return `https://www.tiktok.com/oembed?url=${encodeURIComponent(parsed.canonicalUrl)}`;
  }
  return null;
}

async function fetchMetadata(parsed, fetchImpl) {
  const endpoint = oembedUrl(parsed);
  if (!endpoint) return null;
  try {
    const response = await fetchImpl(endpoint, {
      headers: {
        accept: "application/json",
        // TikTok's oEmbed endpoint rejects custom bot user agents with a 429.
        // A normal browser UA gets the same public JSON the embed widget uses.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const title = cleanText(data?.title, MAX_TITLE);
    if (!title) return null;
    return {
      title,
      author: cleanText(data?.author_name, 200),
      thumbnailUrl: cleanText(data?.thumbnail_url, MAX_URL),
      metadataSource: "oembed",
    };
  } catch {
    return null;
  }
}

function classificationOptions(env, fetchImpl) {
  const apiKey = cleanText(env.OPENAI_API_KEY, 500);
  return {
    categories: EXTENDED_CATEGORIES,
    apiKey: apiKey || undefined,
    model: cleanText(env.OPENAI_MODEL, 100) || "gpt-4o-mini",
    endpoint: cleanText(env.OPENAI_ENDPOINT, MAX_URL) || "https://api.openai.com/v1/chat/completions",
    fetchImpl,
  };
}

async function handleImport(req, res, { env, fetchImpl }) {
  let body;
  try {
    body = await readJson(req);
  } catch (error) {
    json(res, error.status ?? 400, { error: error.message });
    return;
  }

  const rawUrl = cleanText(body.url, MAX_URL);
  if (!rawUrl) {
    json(res, 400, { error: "Paste a video link first." });
    return;
  }

  let parsed;
  try {
    parsed = parseVideoUrl(rawUrl);
  } catch (error) {
    json(res, 400, { error: error.message });
    return;
  }

  const manualTitle = cleanText(body.title, MAX_TITLE);
  const description = cleanMultiline(body.description, MAX_DESCRIPTION);
  const transcript = cleanMultiline(body.transcript, MAX_TRANSCRIPT);

  let metadata = null;
  if (!manualTitle) {
    metadata = await fetchMetadata(parsed, fetchImpl);
    if (!metadata) {
      const platformName = { youtube: "YouTube", tiktok: "TikTok", instagram: "Instagram" }[parsed.platform] || "video";
      json(res, 422, {
        code: "NEEDS_TITLE",
        error:
          parsed.platform === "instagram"
            ? "Instagram doesn't publish captions for public links without an API token. Add a title or caption and ELigtas can sort it."
            : `We couldn't read the ${platformName} title automatically. Add a title or caption and try again.`,
        video: parsed,
      });
      return;
    }
  }

  const title = manualTitle || metadata?.title || "";
  if (!title) {
    json(res, 422, {
      code: "NEEDS_TITLE",
      error: "Add a title or caption so ELigtas has something to classify.",
      video: parsed,
    });
    return;
  }

  const classification = await categorizeVideo(
    { title, description, transcript },
    classificationOptions(env, fetchImpl),
  );

  json(res, 200, {
    ...parsed,
    title,
    description,
    author: metadata?.author || cleanText(body.author, 200),
    thumbnailUrl: metadata?.thumbnailUrl || cleanText(body.thumbnailUrl, MAX_URL),
    metadataSource: manualTitle ? "manual" : metadata?.metadataSource || "none",
    ...classification,
  });
}

function safeStaticPath(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const path = decoded === "/" ? "/index.html" : decoded;
  const filePath = normalize(join(PUBLIC_DIR, path));
  const relativePath = relative(PUBLIC_DIR, filePath);
  if (relativePath.startsWith("..") || isAbsolute(relativePath)) return null;
  return filePath;
}

async function serveStatic(req, res, pathname) {
  const filePath = safeStaticPath(pathname);
  if (!filePath) {
    json(res, 404, { error: "Not found." });
    return;
  }
  try {
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      ...SECURITY_HEADERS,
      "cache-control": "public, max-age=300",
      "content-type": type,
      "content-length": body.length,
    });
    if (req.method === "HEAD") res.end();
    else res.end(body);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "EISDIR") {
      json(res, 404, { error: "Not found." });
      return;
    }
    throw error;
  }
}

export function createApp({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "http://localhost");
      const pathname = url.pathname;

      if (pathname === "/api/health" && req.method === "GET") {
        json(res, 200, { ok: true });
        return;
      }

      if (pathname === "/api/status" && req.method === "GET") {
        const apiKey = cleanText(env.OPENAI_API_KEY, 500);
        json(res, 200, {
          ai: Boolean(apiKey),
          model: apiKey ? cleanText(env.OPENAI_MODEL, 100) || "gpt-4o-mini" : null,
          categories: EXTENDED_CATEGORIES.length,
          platforms: ["youtube", "tiktok", "instagram"],
        });
        return;
      }

      if (pathname === "/api/categories" && req.method === "GET") {
        json(res, 200, { categories: EXTENDED_CATEGORIES });
        return;
      }

      if (pathname === "/api/import" && req.method === "POST") {
        await handleImport(req, res, { env, fetchImpl });
        return;
      }

      if (pathname.startsWith("/api/")) {
        json(res, 404, { error: "Unknown API route." });
        return;
      }

      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { ...SECURITY_HEADERS, allow: "GET, HEAD" });
        res.end("Method not allowed");
        return;
      }

      await serveStatic(req, res, pathname);
    } catch (error) {
      if (!res.headersSent) {
        json(res, 500, { error: "Something went wrong on the server." });
      } else {
        res.destroy();
      }
      console.error("[eligtas] request failed:", error);
    }
  });
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const port = Number.parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "127.0.0.1";
  const server = createApp();
  server.listen(Number.isFinite(port) ? port : 3000, host, () => {
    const address = server.address();
    const shownPort = typeof address === "object" && address ? address.port : port;
    console.log(`ELigtas web library running at http://${host}:${shownPort}`);
    console.log(
      process.env.OPENAI_API_KEY
        ? "AI classification is enabled."
        : "No OPENAI_API_KEY set — using the offline classifier.",
    );
  });
}
