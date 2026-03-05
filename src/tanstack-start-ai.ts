import type { AIAdapterGenerateInput, AIExtractFields, PostMetaAIAdapter } from "./core/types";

export type TanStackStartAICall = (
  payload: AIAdapterGenerateInput,
) => Promise<AIExtractFields>;

export function createTanStackStartAIAdapter(
  call: TanStackStartAICall,
): PostMetaAIAdapter {
  return {
    name: "tanstack-start-ai",
    generate: async (payload) => call(payload),
  };
}
