import { createEffect, createSignal } from "solid-js";
import type { Accessor } from "solid-js";
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

export type CreatePostMetaWithAIResult = {
  data: Accessor<PostMetaAIResult | null>;
  loading: Accessor<boolean>;
  error: Accessor<Error | null>;
  refetch: () => Promise<PostMetaAIResult | null>;
};

export function createPostMeta(
  input: () => ExtractPostMetaInput,
  options?: ExtractPostMetaOptions,
): () => PostMeta {
  return () => extractPostMeta(input(), options);
}

export function createPostMetaWithAI(
  input: () => ExtractPostMetaInput,
  options: ExtractPostMetaWithAIOptions,
): CreatePostMetaWithAIResult {
  const [data, setData] = createSignal<PostMetaAIResult | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);

  const run = async (currentInput: ExtractPostMetaInput): Promise<PostMetaAIResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await extractPostMetaWithAI(currentInput, options);
      setData(() => result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refetch = async (): Promise<PostMetaAIResult | null> => run(input());

  createEffect(() => {
    const currentInput = input();
    void run(currentInput);
  });

  return {
    data,
    loading,
    error,
    refetch,
  };
}
