import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  data: PostMetaAIResult | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

export function usePostMeta(
  input: ExtractPostMetaInput,
  options?: ExtractPostMetaOptions,
): PostMeta {
  return useMemo(
    () => extractPostMeta(input, options),
    [
      input.markdown,
      input.sourceSlug,
      input.fallbackTitle,
      options?.maxDescriptionLength,
      options?.strict,
    ],
  );
}

export function usePostMetaWithAI(
  input: ExtractPostMetaInput,
  options: ExtractPostMetaWithAIOptions,
): UsePostMetaWithAIResult {
  const [data, setData] = useState<PostMetaAIResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inputRef = useRef(input);
  const optionsRef = useRef(options);

  inputRef.current = input;
  optionsRef.current = options;

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await extractPostMetaWithAI(inputRef.current, optionsRef.current);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [
    refresh,
    input.markdown,
    input.sourceSlug,
    input.fallbackTitle,
    options.maxDescriptionLength,
    options.ai.maxRetries,
    options.ai.temperature,
  ]);

  return { data, isLoading, error, refresh };
}
