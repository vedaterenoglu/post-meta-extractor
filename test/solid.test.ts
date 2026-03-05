import { createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";
import { createPostMeta, createPostMetaWithAI } from "../src/solid";

describe("solid wrapper", () => {
  it("recomputes sync metadata when signal input changes", () => {
    createRoot((dispose) => {
      const [markdown, setMarkdown] = createSignal("# First");
      const meta = createPostMeta(() => ({ markdown: markdown() }));

      expect(meta().title).toBe("First");
      setMarkdown("# Second");
      expect(meta().title).toBe("Second");

      dispose();
    });
  });

  it("supports async AI metadata refetch", async () => {
    await new Promise<void>((resolve, reject) => {
      createRoot((dispose) => {
        const [markdown, setMarkdown] = createSignal("# Async Solid");
        const state = createPostMetaWithAI(
          () => ({ markdown: markdown() }),
          {
            ai: {
              adapter: {
                generate: async () => ({
                  description: "Solid AI description",
                  tags: ["Solid"],
                }),
              },
            },
          },
        );

        state
          .refetch()
          .then((result) => {
            expect(result?.description).toBe("Solid AI description");
            expect(result?.tags).toEqual(["solid"]);
            expect(state.loading()).toBe(false);
            expect(state.error()).toBeNull();

            setMarkdown("# Changed Solid");
            return state.refetch();
          })
          .then((updated) => {
            expect(updated?.title).toBe("Changed Solid");
            dispose();
            resolve();
          })
          .catch((error) => {
            dispose();
            reject(error);
          });
      });
    });
  });
});
