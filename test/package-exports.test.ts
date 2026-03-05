import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package exports contract", () => {
  it("defines required subpath exports and sideEffects false", () => {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
      exports: Record<string, unknown>;
      sideEffects: boolean;
    };

    expect(pkg.sideEffects).toBe(false);
    expect(pkg.exports["."]).toBeTruthy();
    expect(pkg.exports["./react"]).toBeTruthy();
    expect(pkg.exports["./solid"]).toBeTruthy();
    expect(pkg.exports["./vue"]).toBeTruthy();
    expect(pkg.exports["./tanstack-start-ai"]).toBeTruthy();
  });
});
