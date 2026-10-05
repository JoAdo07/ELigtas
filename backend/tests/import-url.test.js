import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseVideoUrl, supportedPlatforms } from "../src/import-url.js";

describe("parseVideoUrl", () => {
  const valid = [
    ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"],
    ["https://youtu.be/dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"],
    ["https://www.youtube.com/embed/dQw4w9WgXcQ", "youtube", "dQw4w9WgXcQ"],
    ["https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10s", "youtube", "dQw4w9WgXcQ"],
    ["https://www.tiktok.com/@chef/video/7234567890123456789", "tiktok", "7234567890123456789"],
    ["https://m.tiktok.com/v/7234567890123456789", "tiktok", "7234567890123456789"],
    ["https://www.instagram.com/reel/C8abcDEF123/", "instagram", "C8abcDEF123"],
    ["https://www.instagram.com/p/C8abcDEF123", "instagram", "C8abcDEF123"],
    ["https://instagram.com/tv/C8abcDEF123?hl=en", "instagram", "C8abcDEF123"],
  ];
  for (const [url, platform, videoId] of valid) {
    it(`parses ${platform} ${url.slice(0, 48)}…`, () => {
      const parsed = parseVideoUrl(url);
      assert.equal(parsed.platform, platform);
      assert.equal(parsed.videoId, videoId);
      assert.match(parsed.canonicalUrl, /^https:\/\//);
    });
  }

  it("keeps the TikTok username in the canonical URL", () => {
    const parsed = parseVideoUrl("https://www.tiktok.com/@chef/video/7234567890123456789");
    assert.equal(parsed.canonicalUrl, "https://www.tiktok.com/@chef/video/7234567890123456789");
  });

  const invalid = [
    ["", /empty link/],
    ["not a url", /not a valid URL/],
    ["ftp://example.com/x", /unsupported scheme/],
    ["https://vimeo.com/12345", /unsupported host/],
    ["https://www.youtube.com/watch", /no YouTube video id/],
    ["https://www.youtube.com/watch?v=short", /no YouTube video id/],
    ["https://www.tiktok.com/@chef", /no TikTok video id/],
    ["https://vm.tiktok.com/AbC123/", /need resolving/],
    ["https://www.instagram.com/explore/", /no Instagram media id/],
  ];
  for (const [url, pattern] of invalid) {
    it(`rejects ${JSON.stringify(url).slice(0, 48)}`, () => {
      assert.throws(() => parseVideoUrl(url), pattern);
    });
  }

  it("lists the supported platforms", () => {
    assert.deepEqual(supportedPlatforms(), ["youtube", "tiktok", "instagram"]);
  });
});
