import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_CATEGORIES,
  applyOverride,
  buildClassificationPrompt,
  categorizeVideo,
  classifyWithAI,
  scoreLocally,
} from "../src/classify.js";

const recipe = {
  title: "15-minute garlic butter pasta",
  description: "Quick weeknight dinner recipe from my favorite chef",
  transcript: "boil water, cook pasta, add garlic and butter",
};

describe("scoreLocally", () => {
  it("picks the best-fit category with a 0-1 confidence", () => {
    const { category, confidence } = scoreLocally(recipe);
    assert.equal(category, "Cooking");
    assert.ok(confidence > 0 && confidence <= 1);
  });

  it("returns Other with 0 confidence when nothing matches", () => {
    assert.deepEqual(scoreLocally({ title: "zzzz qq9" }), { category: "Other", confidence: 0 });
    assert.deepEqual(scoreLocally({}), { category: "Other", confidence: 0 });
  });
});

describe("buildClassificationPrompt", () => {
  it("lists the categories and asks for JSON only", () => {
    const prompt = buildClassificationPrompt(recipe, ["Cooking", "Other"]);
    assert.match(prompt, /Cooking, Other/);
    assert.match(prompt, /JSON only/);
    assert.match(prompt, /garlic butter pasta/);
  });
});

describe("classifyWithAI", () => {
  const stubFetch = (reply, status = 200) =>
    async (url, init) => {
      assert.match(url, /chat\/completions$/);
      assert.equal(init.method, "POST");
      assert.match(init.headers.authorization, /^Bearer /);
      return { ok: status === 200, status, json: async () => reply };
    };

  it("parses category and clamps confidence", async () => {
    const result = await classifyWithAI(recipe, {
      apiKey: "k",
      fetchImpl: stubFetch({ choices: [{ message: { content: '{"category":"Travel","confidence":1.7}' } }] }),
    });
    assert.deepEqual(result, { category: "Travel", confidence: 1 });
  });

  it("rejects unknown categories so callers fall back", async () => {
    await assert.rejects(
      classifyWithAI(recipe, {
        apiKey: "k",
        fetchImpl: stubFetch({ choices: [{ message: { content: '{"category":"Sports","confidence":0.9}' } }] }),
      }),
      /unknown category/,
    );
  });

  it("rejects non-JSON replies so callers fall back", async () => {
    await assert.rejects(
      classifyWithAI(recipe, {
        apiKey: "k",
        fetchImpl: stubFetch({ choices: [{ message: { content: "Cooking, definitely" } }] }),
      }),
      /no JSON/,
    );
  });

  it("requires an apiKey", async () => {
    await assert.rejects(classifyWithAI(recipe, {}), /apiKey/);
  });
});

describe("categorizeVideo", () => {
  it("uses AI when configured and healthy", async () => {
    const fetchImpl = async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"category":"Fitness","confidence":0.8}' } }] }),
    });
    assert.deepEqual(await categorizeVideo(recipe, { apiKey: "k", fetchImpl }), {
      category: "Fitness",
      confidence: 0.8,
      source: "ai",
    });
  });

  it("falls back to local scoring when AI fails", async () => {
    const fetchImpl = async () => {
      throw new Error("network down");
    };
    assert.deepEqual(await categorizeVideo(recipe, { apiKey: "k", fetchImpl }), {
      category: "Cooking",
      confidence: 1,
      source: "local",
    });
  });

  it("scores locally with no key configured", async () => {
    const result = await categorizeVideo(recipe);
    assert.equal(result.source, "local");
    assert.equal(result.category, "Cooking");
  });
});

describe("applyOverride", () => {
  it("records a manual correction", () => {
    const record = applyOverride({ category: "Other", source: "local" }, "Cooking");
    assert.deepEqual(record, { category: "Cooking", source: "manual" });
  });

  it("rejects empty categories", () => {
    assert.throws(() => applyOverride({}, "  "), /non-empty/);
  });
});
