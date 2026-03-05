import { extractPostMeta } from "./extract";
import { normalizeTags, truncateText } from "./normalize";
import type {
  AIAdapterGenerateInput,
  AIExtractFields,
  ExtractPostMetaWithAIInput,
  ExtractPostMetaWithAIOptions,
  PostMetaAIResult,
} from "./types";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TEMPERATURE = 0.2;

const DESCRIPTION_TAGS_SCHEMA: AIAdapterGenerateInput["schema"] = {
  type: "object",
  properties: {
    description: { type: ["string", "null"] },
    tags: { type: "array", items: { type: "string" } },
  },
  required: ["description", "tags"],
  additionalProperties: false,
};

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return String(error);
}

function buildSystemPrompt(): string {
  return [
    "You extract blog metadata from markdown.",
    "Return only JSON matching the provided schema.",
    "description should be concise and factual.",
    "tags should be specific and useful for categorization.",
  ].join(" ");
}

function buildUserPrompt(markdown: string, temperature: number): string {
  return [
    "Extract description and tags from the markdown below.",
    "If uncertain, return null description and empty tags.",
    `Target creativity temperature: ${temperature}.`,
    "Markdown:",
    "```md",
    markdown,
    "```",
  ].join("\n");
}

function validateAIFields(value: unknown): {
  ok: true;
  data: AIExtractFields;
} | {
  ok: false;
  reason: string;
} {
  if (typeof value !== "object" || value === null) {
    return { ok: false, reason: "AI response is not an object." };
  }

  const candidate = value as Record<string, unknown>;
  const description = candidate.description;
  const tags = candidate.tags;

  if (!(typeof description === "string" || description === null)) {
    return { ok: false, reason: "AI response description must be string or null." };
  }

  if (!Array.isArray(tags) || tags.some((item) => typeof item !== "string")) {
    return { ok: false, reason: "AI response tags must be an array of strings." };
  }

  return {
    ok: true,
    data: {
      description,
      tags,
    },
  };
}

function sanitizeDescription(
  description: string | null,
  maxDescriptionLength: number,
): string | null {
  if (typeof description !== "string") return null;
  const trimmed = description.trim();
  if (!trimmed) return null;
  return truncateText(trimmed, maxDescriptionLength);
}

export async function extractPostMetaWithAI(
  input: ExtractPostMetaWithAIInput,
  options: ExtractPostMetaWithAIOptions,
): Promise<PostMetaAIResult> {
  const deterministic = extractPostMeta(input, options);
  const adapter = options.ai?.adapter;
  const providerName = adapter?.name;
  const maxRetries = Math.max(1, options.ai?.maxRetries ?? DEFAULT_MAX_RETRIES);
  const temperature = options.ai?.temperature ?? DEFAULT_TEMPERATURE;
  const maxDescriptionLength = Math.max(1, options.maxDescriptionLength ?? 180);
  const warnings: string[] = [];

  if (!adapter || typeof adapter.generate !== "function") {
    warnings.push("AI adapter is missing or invalid.");
    return {
      ...deterministic,
      description: null,
      tags: [],
      ai: {
        status: "failed",
        attempts: 0,
        warnings,
        provider: providerName,
      },
    };
  }

  const system = buildSystemPrompt();
  const user = buildUserPrompt(input.markdown, temperature);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const aiResponse = await adapter.generate({
        system,
        user,
        schema: DESCRIPTION_TAGS_SCHEMA,
      });
      const validated = validateAIFields(aiResponse);
      if (!validated.ok) {
        warnings.push(`Attempt ${attempt} invalid response: ${validated.reason}`);
        continue;
      }

      return {
        ...deterministic,
        description: sanitizeDescription(validated.data.description, maxDescriptionLength),
        tags: normalizeTags(validated.data.tags),
        ai: {
          status: "success",
          attempts: attempt,
          warnings,
          provider: providerName,
        },
      };
    } catch (error) {
      warnings.push(`Attempt ${attempt} failed: ${toErrorMessage(error)}`);
    }
  }

  return {
    ...deterministic,
    description: null,
    tags: [],
    ai: {
      status: "failed",
      attempts: maxRetries,
      warnings,
      provider: providerName,
    },
  };
}
