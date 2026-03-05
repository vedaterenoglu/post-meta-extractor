import { describe, expect, it } from "vitest";
import { extractPostMetaWithAI } from "../src/core/ai";

describe("extractPostMetaWithAI", () => {
  it("fails gracefully when adapter is missing", async () => {
    const result = await extractPostMetaWithAI(
      { markdown: "# Missing Adapter" },
      {
        ai: {
          adapter: undefined as never,
        },
      },
    );

    expect(result.ai.status).toBe("failed");
    expect(result.ai.attempts).toBe(0);
    expect(result.ai.warnings[0]).toContain("missing or invalid");
    expect(result.description).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it("returns deterministic fields with AI description/tags on success", async () => {
    const markdown = `---
aliases: old-name
---
# AI Title
![image](https://cdn.test/cover.png)`;

    const result = await extractPostMetaWithAI(
      { markdown, sourceSlug: "ai-title" },
      {
        ai: {
          adapter: {
            name: "fake-ai",
            generate: async () => ({
              description: "AI generated summary.",
              tags: ["Tech", " React "],
            }),
          },
        },
      },
    );

    expect(result.title).toBe("AI Title");
    expect(result.slug).toBe("ai-title");
    expect(result.aliases).toEqual(["old-name"]);
    expect(result.thumbnailUrl).toBe("https://cdn.test/cover.png");
    expect(result.description).toBe("AI generated summary.");
    expect(result.tags).toEqual(["tech", "react"]);
    expect(result.ai.status).toBe("success");
    expect(result.ai.attempts).toBe(1);
    expect(result.ai.warnings).toEqual([]);
    expect(result.ai.provider).toBe("fake-ai");
  });

  it("retries on invalid AI payload and succeeds later", async () => {
    let calls = 0;
    const result = await extractPostMetaWithAI(
      { markdown: "# Retry Title" },
      {
        ai: {
          adapter: {
            generate: async () => {
              calls += 1;
              if (calls === 1) {
                return { description: 42 as unknown as string, tags: [] };
              }
              return {
                description: "Valid on second attempt",
                tags: ["Retry"],
              };
            },
          },
          maxRetries: 3,
        },
      },
    );

    expect(result.description).toBe("Valid on second attempt");
    expect(result.tags).toEqual(["retry"]);
    expect(result.ai.status).toBe("success");
    expect(result.ai.attempts).toBe(2);
    expect(result.ai.warnings.length).toBe(1);
    expect(calls).toBe(2);
  });

  it("retries for non-object and invalid-tags responses before succeeding", async () => {
    let calls = 0;
    const result = await extractPostMetaWithAI(
      { markdown: "# Invalid Chain" },
      {
        ai: {
          adapter: {
            generate: async () => {
              calls += 1;
              if (calls === 1) return "bad-response" as unknown as { description: string; tags: string[] };
              if (calls === 2) return { description: "ok", tags: [123] as unknown as string[] };
              return { description: "final", tags: ["A"] };
            },
          },
          maxRetries: 3,
        },
      },
    );

    expect(result.ai.status).toBe("success");
    expect(result.ai.attempts).toBe(3);
    expect(result.ai.warnings.length).toBe(2);
    expect(result.tags).toEqual(["a"]);
    expect(result.description).toBe("final");
  });

  it("normalizes empty AI description to null", async () => {
    const result = await extractPostMetaWithAI(
      { markdown: "# Empty Description" },
      {
        ai: {
          adapter: {
            generate: async () => ({
              description: "   ",
              tags: ["one"],
            }),
          },
        },
      },
    );

    expect(result.description).toBeNull();
    expect(result.tags).toEqual(["one"]);
    expect(result.ai.status).toBe("success");
  });

  it("returns empty AI fields after retries fail with no deterministic fallback", async () => {
    const markdown = `---
description: deterministic description
tags: [fallback]
---
# Strict AI`;

    const result = await extractPostMetaWithAI(
      { markdown },
      {
        ai: {
          adapter: {
            generate: async () => {
              throw new Error("Provider unavailable");
            },
          },
          maxRetries: 3,
        },
      },
    );

    expect(result.title).toBe("Strict AI");
    expect(result.description).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.ai.status).toBe("failed");
    expect(result.ai.attempts).toBe(3);
    expect(result.ai.warnings.length).toBe(3);
  });
});
