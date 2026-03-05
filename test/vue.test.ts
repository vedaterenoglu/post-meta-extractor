import { describe, expect, it } from "vitest";
import { ref } from "vue";
import { usePostMeta, usePostMetaWithAI } from "../src/vue";

function flushPromises(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

describe("vue wrapper", () => {
  it("updates computed sync metadata when ref changes", () => {
    const input = ref({ markdown: "# Start" });
    const meta = usePostMeta(input);

    expect(meta.value.title).toBe("Start");
    input.value = { markdown: "# Changed" };
    expect(meta.value.title).toBe("Changed");
  });

  it("supports async AI metadata loading", async () => {
    const input = ref({ markdown: "# Async Vue" });
    const state = usePostMetaWithAI(input, {
      ai: {
        adapter: {
          generate: async () => ({
            description: "Vue AI description",
            tags: ["Vue"],
          }),
        },
      },
    });

    await flushPromises();

    expect(state.isLoading.value).toBe(false);
    expect(state.error.value).toBeNull();
    expect(state.data.value?.description).toBe("Vue AI description");
    expect(state.data.value?.tags).toEqual(["vue"]);

    input.value = { markdown: "# Async Vue Updated" };
    await state.refresh();
    expect(state.data.value?.title).toBe("Async Vue Updated");
  });
});
