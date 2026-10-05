/**
 * Manual video import via link (SRS §3.2 FR2).
 *
 * Parses a YouTube / TikTok / Instagram URL into a normalized record every
 * import flow (manual paste today, browser extension later) builds on:
 *
 *   { platform: "youtube" | "tiktok" | "instagram",
 *     videoId: string,
 *     canonicalUrl: string }
 *
 * Anything else throws a plain-English error naming what's wrong. Stdlib
 * only, no network — short links that need resolving (vm.tiktok.com,
 * youtu.be is fine, it embeds the id) are rejected explicitly instead of
 * guessed.
 */

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const TIKTOK_ID = /^\d{8,}$/;
const INSTAGRAM_ID = /^[A-Za-z0-9_-]{5,}$/;

function fail(reason) {
  throw new Error(`Unsupported video link: ${reason}`);
}

function youtubeId(url) {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
    if (YOUTUBE_ID.test(id)) return id;
  } else {
    const v = url.searchParams.get("v");
    if (v && YOUTUBE_ID.test(v)) return v;
    const short = url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/);
    if (short && YOUTUBE_ID.test(short[1])) return short[1];
  }
  return null;
}

function tiktokId(url) {
  const host = url.hostname.toLowerCase();
  if (host === "vm.tiktok.com") {
    fail("vm.tiktok.com short links need resolving — open the link once and paste the full tiktok.com URL");
  }
  const m = url.pathname.match(/(?:\/@([^/]+)\/video\/|\/v\/)(\d+)/);
  if (m && TIKTOK_ID.test(m[2])) return { id: m[2], user: m[1] ?? null };
  return null;
}

function instagramId(url) {
  const m = url.pathname.match(/^\/(?:reel|p|tv)\/([^/?#]+)/);
  const id = (m?.[1] ?? "").replace(/\/$/, "");
  if (INSTAGRAM_ID.test(id)) return id;
  return null;
}

export function parseVideoUrl(raw) {
  if (typeof raw !== "string" || !raw.trim()) fail("empty link");
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    fail(`not a valid URL: ${JSON.stringify(String(raw).slice(0, 80))}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(`unsupported scheme ${JSON.stringify(url.protocol)} (use https://)`);
  }
  const host = url.hostname.toLowerCase();
  if (YOUTUBE_HOSTS.has(host)) {
    const id = youtubeId(url);
    if (!id) fail("no YouTube video id found (watch?v=, youtu.be/, /shorts/, /embed/, /live/)");
    return { platform: "youtube", videoId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };
  }
  if (TIKTOK_HOSTS.has(host)) {
    const found = tiktokId(url);
    if (!found) fail("no TikTok video id found (…/@user/video/<id> or …/v/<id>)");
    const canonicalUrl = found.user
      ? `https://www.tiktok.com/@${found.user}/video/${found.id}`
      : `https://www.tiktok.com/v/${found.id}`;
    return { platform: "tiktok", videoId: found.id, canonicalUrl };
  }
  if (INSTAGRAM_HOSTS.has(host)) {
    const id = instagramId(url);
    if (!id) fail("no Instagram media id found (/reel/, /p/, /tv/)");
    return { platform: "instagram", videoId: id, canonicalUrl: `https://www.instagram.com/reel/${id}/` };
  }
  fail(`unsupported host ${JSON.stringify(host)} (youtube.com, tiktok.com, instagram.com)`);
}

export function supportedPlatforms() {
  return ["youtube", "tiktok", "instagram"];
}
