import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../server.js";

async function withApp(options, run) {
  const server = createApp(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections?.();
    });
  }
}

async function request(base, path, options = {}) {
  const response = await fetch(`${base}${path}`, options);
  const text = await response.text();
  let body = text;
  try {
    body = JSON.parse(text);
  } catch {
    // Keep non-JSON responses as text.
  }
  return { response, body };
}

function postJson(base, path, payload) {
  return request(base, path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  };
}

const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

describe("web API", () => {
  it("lists the extended taxonomy", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response, body } = await request(base, "/api/categories");
      assert.equal(response.status, 200);
      assert.equal(body.categories.length, 26);
      assert.equal(body.categories[0], "Cooking");
      assert.equal(body.categories.at(-1), "Other");
      assert.ok(body.categories.includes("Gaming"));
    });
  });

  it("reports whether AI classification is configured without leaking a key", async () => {
    await withApp(
      { env: { OPENAI_API_KEY: "secret", OPENAI_MODEL: "gpt-test" }, fetchImpl: async () => jsonResponse({}) },
      async (base) => {
        const { body } = await request(base, "/api/status");
        assert.deepEqual(body, {
          ai: true,
          model: "gpt-test",
          categories: 26,
          platforms: ["youtube", "tiktok", "instagram"],
        });
        assert.equal(JSON.stringify(body).includes("secret"), false);
      },
    );
  });

  it("imports a link with a manual title without touching the network", async () => {
    let calls = 0;
    await withApp(
      {
        env: {},
        fetchImpl: async () => {
          calls += 1;
          throw new Error("network should not be used");
        },
      },
      async (base) => {
        const { response, body } = await postJson(base, "/api/import", {
          url: youtubeUrl,
          title: "15-minute garlic butter pasta",
          description: "A quick weeknight recipe",
        });
        assert.equal(response.status, 200);
        assert.equal(body.platform, "youtube");
        assert.equal(body.videoId, "dQw4w9WgXcQ");
        assert.equal(body.metadataSource, "manual");
        assert.equal(body.category, "Cooking");
        assert.equal(body.source, "local");
        assert.equal(calls, 0);
      },
    );
  });

  it("uses public oEmbed metadata for YouTube links", async () => {
    await withApp(
      {
        env: {},
        fetchImpl: async (url) => {
          assert.match(String(url), /youtube\.com\/oembed/);
          return jsonResponse({
            title: "15-minute garlic butter pasta",
            author_name: "Weeknight Kitchen",
            thumbnail_url: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          });
        },
      },
      async (base) => {
        const { response, body } = await postJson(base, "/api/import", { url: youtubeUrl });
        assert.equal(response.status, 200);
        assert.equal(body.metadataSource, "oembed");
        assert.equal(body.author, "Weeknight Kitchen");
        assert.match(body.thumbnailUrl, /^https:\/\/i\.ytimg\.com/);
        assert.equal(body.category, "Cooking");
      },
    );
  });

  it("asks for a caption when Instagram metadata is unavailable", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response, body } = await postJson(base, "/api/import", {
        url: "https://www.instagram.com/reel/C8abcDEF123/",
      });
      assert.equal(response.status, 422);
      assert.equal(body.code, "NEEDS_TITLE");
      assert.equal(body.video.platform, "instagram");
      assert.match(body.error, /API token/);
    });
  });

  it("classifies with the AI path when a key is configured", async () => {
    await withApp(
      {
        env: { OPENAI_API_KEY: "test-key", OPENAI_ENDPOINT: "https://ai.test/chat" },
        fetchImpl: async (url) => {
          assert.equal(String(url), "https://ai.test/chat");
          return jsonResponse({
            choices: [{ message: { content: '{"category":"Gaming","confidence":0.97}' } }],
          });
        },
      },
      async (base) => {
        const { response, body } = await postJson(base, "/api/import", {
          url: youtubeUrl,
          title: "Minecraft speedrun in 12 minutes",
        });
        assert.equal(response.status, 200);
        assert.equal(body.source, "ai");
        assert.equal(body.category, "Gaming");
        assert.equal(body.confidence, 0.97);
      },
    );
  });

  it("rejects unsupported links with a plain-English error", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response, body } = await postJson(base, "/api/import", { url: "https://example.com/video" });
      assert.equal(response.status, 400);
      assert.match(body.error, /Unsupported video link/);
    });
  });

  it("rejects malformed JSON", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response, body } = await request(base, "/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not json",
      });
      assert.equal(response.status, 400);
      assert.equal(body.error, "That request was not valid JSON.");
    });
  });

  it("serves the app with a restrictive content security policy", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response, body } = await request(base, "/");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
      assert.match(String(body), /ELigtas/);
    });
  });

  it("does not serve files outside the public directory", async () => {
    await withApp({ env: {}, fetchImpl: async () => jsonResponse({}) }, async (base) => {
      const { response } = await request(base, "/..%2fserver.js");
      assert.equal(response.status, 404);
    });
  });
});
