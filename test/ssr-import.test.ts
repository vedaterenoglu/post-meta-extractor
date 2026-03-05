import { describe, expect, it } from "vitest";

describe("subpath imports are SSR-safe", () => {
  it("imports wrappers without browser globals", async () => {
    const core = await import("../src/index");
    const react = await import("../src/react");
    const solid = await import("../src/solid");
    const vue = await import("../src/vue");
    const tanstack = await import("../src/tanstack-start-ai");

    expect(typeof core.extractPostMetaWithAI).toBe("function");
    expect(typeof react.usePostMeta).toBe("function");
    expect(typeof react.usePostMetaWithAI).toBe("function");
    expect(typeof solid.createPostMeta).toBe("function");
    expect(typeof solid.createPostMetaWithAI).toBe("function");
    expect(typeof vue.usePostMeta).toBe("function");
    expect(typeof vue.usePostMetaWithAI).toBe("function");
    expect(typeof tanstack.createTanStackStartAIAdapter).toBe("function");
  });
});
