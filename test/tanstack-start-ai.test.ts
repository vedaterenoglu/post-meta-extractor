import { describe, expect, it } from "vitest";
import { createTanStackStartAIAdapter } from "../src/tanstack-start-ai";

describe("tanstack start ai helper adapter", () => {
  it("maps tanstack-style call to generic adapter", async () => {
    const adapter = createTanStackStartAIAdapter(async () => ({
      description: "TanStack response",
      tags: ["TanStack"],
    }));

    const result = await adapter.generate({
      system: "s",
      user: "u",
      schema: {
        type: "object",
        properties: {
          description: { type: ["string", "null"] },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["description", "tags"],
        additionalProperties: false,
      },
    });

    expect(adapter.name).toBe("tanstack-start-ai");
    expect(result.description).toBe("TanStack response");
    expect(result.tags).toEqual(["TanStack"]);
  });
});
