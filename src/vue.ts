import { computed, ref, unref, watch } from "vue";
import type { ComputedRef, MaybeRef, Ref } from "vue";
import { extractPostMeta } from "./core/extract";
import { extractPostMetaWithAI } from "./core/ai";
import type {
  ExtractPostMetaInput,
  ExtractPostMetaOptions,
  ExtractPostMetaWithAIOptions,
  PostMeta,
  PostMetaAIResult,
} from "./core/types";

export type {
  ExtractPostMetaInput,
  ExtractPostMetaOptions,
  ExtractPostMetaWithAIInput,
  ExtractPostMetaWithAIOptions,
  PostMeta,
  PostMetaAIResult,
} from "./core/types";

export type UsePostMetaWithAIResult = {
  data: Ref<PostMetaAIResult | null>;
  isLoading: Ref<boolean>;
  error: Ref<Error | null>;
  refresh: () => Promise<void>;
};

export function usePostMeta(
  input: MaybeRef<ExtractPostMetaInput>,
  options?: ExtractPostMetaOptions,
): ComputedRef<PostMeta> {
  return computed(() => extractPostMeta(unref(input), options));
}

export function usePostMetaWithAI(
  input: MaybeRef<ExtractPostMetaInput>,
  options: ExtractPostMetaWithAIOptions,
): UsePostMetaWithAIResult {
  const data = ref<PostMetaAIResult | null>(null);
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  const refresh = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;
    try {
      data.value = await extractPostMetaWithAI(unref(input), options);
    } catch (err) {
      error.value = err instanceof Error ? err : new Error(String(err));
      data.value = null;
    } finally {
      isLoading.value = false;
    }
  };

  watch(
    () => unref(input),
    () => {
      void refresh();
    },
    { immediate: true, deep: true },
  );

  return { data, isLoading, error, refresh };
}
