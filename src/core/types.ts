export type ExtractPostMetaInput = {
  markdown: string;
  sourceSlug?: string;
  fallbackTitle?: string;
};

export type PostMeta = {
  title: string | null;
  description: string | null;
  date: string | null;
  dateValue: number;
  slug: string;
  aliases: string[];
  thumbnailUrl: string | null;
  tags: string[];
  published: boolean | null;
};

export type ExtractPostMetaOptions = {
  strict?: false;
  maxDescriptionLength?: number;
};

export type ParsedFrontmatter = {
  title?: string;
  date?: string;
  description?: string;
  thumbnailUrl?: string;
  aliases?: string[] | string;
  tags?: string[] | string;
  published?: boolean | null;
};

export type ExtractPostMetaWithAIInput = ExtractPostMetaInput;

export type AIExtractFields = {
  description: string | null;
  tags: string[];
};

export type AIAdapterGenerateInput = {
  system: string;
  user: string;
  schema: {
    type: "object";
    properties: {
      description: { type: ["string", "null"] };
      tags: { type: "array"; items: { type: "string" } };
    };
    required: ["description", "tags"];
    additionalProperties: false;
  };
};

export type PostMetaAIAdapter = {
  name?: string;
  generate: (input: AIAdapterGenerateInput) => Promise<AIExtractFields>;
};

export type ExtractPostMetaWithAIOptions = ExtractPostMetaOptions & {
  ai: {
    adapter: PostMetaAIAdapter;
    maxRetries?: number;
    temperature?: number;
  };
};

export type PostMetaAIResult = PostMeta & {
  ai: {
    status: "success" | "failed";
    attempts: number;
    warnings: string[];
    provider?: string;
  };
};
