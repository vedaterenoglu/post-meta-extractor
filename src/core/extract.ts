import {
  normalizeAliases,
  normalizeSlug,
  normalizeTags,
  parseDateFromSlugPrefix,
  parseValidDate,
  truncateText,
} from "./normalize";
import type {
  ExtractPostMetaInput,
  ExtractPostMetaOptions,
  ParsedFrontmatter,
  PostMeta,
} from "./types";

const DEFAULT_MAX_DESCRIPTION_LENGTH = 180;
const RECOGNIZED_KEYS = new Set([
  "title",
  "date",
  "description",
  "thumbnailurl",
  "aliases",
  "tags",
  "published",
]);

type SplitFrontmatterResult = {
  frontmatter: ParsedFrontmatter;
  content: string;
};

type ParsedListValue = {
  values: string[];
  nextIndex: number;
};

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseBoolean(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function parseInlineArray(value: string): string[] {
  const inner = value.trim().replace(/^\[/, "").replace(/]$/, "");
  return inner
    .split(",")
    .map((item) => stripWrappingQuotes(item))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseListValue(
  frontmatterLines: string[],
  startIndex: number,
  value: string,
): ParsedListValue {
  if (!value) {
    const listItems: string[] = [];
    let currentIndex = startIndex;
    while (currentIndex + 1 < frontmatterLines.length) {
      const next = frontmatterLines[currentIndex + 1].trim();
      if (!next.startsWith("- ")) break;
      listItems.push(stripWrappingQuotes(next.slice(2)));
      currentIndex += 1;
    }
    return { values: listItems, nextIndex: currentIndex };
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    return { values: parseInlineArray(value), nextIndex: startIndex };
  }

  if (value.includes(",")) {
    return {
      values: value
        .split(",")
        .map((part) => stripWrappingQuotes(part))
        .map((part) => part.trim())
        .filter(Boolean),
      nextIndex: startIndex,
    };
  }

  const parsedSingle = stripWrappingQuotes(value);
  return { values: parsedSingle ? [parsedSingle] : [], nextIndex: startIndex };
}

function parseFrontmatterBlock(markdown: string): SplitFrontmatterResult {
  const lines = markdown.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") {
    return { frontmatter: {}, content: markdown };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: {}, content: markdown };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const content = lines.slice(endIndex + 1).join("\n");
  const frontmatter: ParsedFrontmatter = {};

  for (let i = 0; i < frontmatterLines.length; i += 1) {
    const rawLine = frontmatterLines[i];
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = /^([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*(.*)$/.exec(rawLine);
    if (!match) continue;

    const keyLower = match[1].toLowerCase();
    const value = match[2].trim();
    if (!RECOGNIZED_KEYS.has(keyLower)) continue;

    if (keyLower === "title") {
      const parsed = stripWrappingQuotes(value);
      if (parsed) frontmatter.title = parsed;
      continue;
    }

    if (keyLower === "date") {
      const parsed = stripWrappingQuotes(value);
      if (parsed) frontmatter.date = parsed;
      continue;
    }

    if (keyLower === "description") {
      const parsed = stripWrappingQuotes(value);
      if (parsed) frontmatter.description = parsed;
      continue;
    }

    if (keyLower === "thumbnailurl") {
      const parsed = stripWrappingQuotes(value);
      if (parsed) frontmatter.thumbnailUrl = parsed;
      continue;
    }

    if (keyLower === "published") {
      frontmatter.published = parseBoolean(value);
      continue;
    }

    if (keyLower === "tags" || keyLower === "aliases") {
      const parsedList = parseListValue(frontmatterLines, i, value);
      i = parsedList.nextIndex;
      if (parsedList.values.length === 0) continue;
      if (keyLower === "tags") {
        frontmatter.tags = parsedList.values;
      } else {
        frontmatter.aliases = parsedList.values;
      }
    }
  }

  return { frontmatter, content };
}

function parseTitleFromMarkdown(content: string): string | null {
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    const match = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const title = match[1].trim();
    if (title) return title;
  }
  return null;
}

function extractThumbnailUrlFromMarkdown(content: string): string | null {
  const match = /!\[[^\]]*]\(\s*([^) \t]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/.exec(
    content,
  );
  const url = match?.[1]?.trim();
  return url || null;
}

function parseDescriptionFromMarkdown(content: string, maxLength: number): string | null {
  const lines = content.split(/\r?\n/);
  let inCodeFence = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith("```")) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    if (
      /^#{1,6}\s+/.test(line) ||
      /^!\[[^\]]*]\(/.test(line) ||
      /^>\s?/.test(line) ||
      /^[-*+]\s+/.test(line) ||
      /^\d+\.\s+/.test(line) ||
      /^\|/.test(line)
    ) {
      continue;
    }

    return truncateText(line, maxLength);
  }

  return null;
}

export function extractPostMeta(
  input: ExtractPostMetaInput,
  options?: ExtractPostMetaOptions,
): PostMeta {
  const maxDescriptionLength = Math.max(
    1,
    options?.maxDescriptionLength ?? DEFAULT_MAX_DESCRIPTION_LENGTH,
  );
  const markdown = typeof input.markdown === "string" ? input.markdown : "";
  const fallbackTitle = input.fallbackTitle?.trim() || null;
  const sourceSlug = input.sourceSlug?.trim() || "";

  const { frontmatter, content } = parseFrontmatterBlock(markdown);

  const title =
    frontmatter.title?.trim() ||
    parseTitleFromMarkdown(content) ||
    fallbackTitle ||
    null;

  const normalizedSourceSlug = sourceSlug ? normalizeSlug(sourceSlug) : "";
  const slug = normalizedSourceSlug || (title ? normalizeSlug(title) : "") || "untitled";

  const fromFrontmatterDate = parseValidDate(frontmatter.date);
  const fromSlugDate = parseDateFromSlugPrefix(sourceSlug || slug);
  const date = fromFrontmatterDate.date ?? fromSlugDate.date;
  const dateValue = fromFrontmatterDate.dateValue || fromSlugDate.dateValue || 0;

  const description =
    frontmatter.description?.trim() ||
    parseDescriptionFromMarkdown(content, maxDescriptionLength) ||
    null;

  const thumbnailUrl =
    frontmatter.thumbnailUrl?.trim() || extractThumbnailUrlFromMarkdown(content) || null;

  const aliases = normalizeAliases(frontmatter.aliases, slug);
  const tags = normalizeTags(frontmatter.tags);
  const published = frontmatter.published ?? null;

  return {
    title,
    description,
    date,
    dateValue,
    slug,
    aliases,
    thumbnailUrl,
    tags,
    published,
  };
}
