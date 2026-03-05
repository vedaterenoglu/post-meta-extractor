export function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseDateFromSlugPrefix(sourceSlug: string): {
  date: string | null;
  dateValue: number;
} {
  const filenameLike = sourceSlug.split("/").pop() ?? sourceSlug;
  const match = /^(\d{4}-\d{2}-\d{2})-/.exec(filenameLike);
  if (!match) return { date: null, dateValue: 0 };

  const date = match[1];
  const dateValue = Date.parse(date);
  if (!Number.isFinite(dateValue)) return { date: null, dateValue: 0 };
  return { date, dateValue };
}

export function parseValidDate(input: string | undefined): {
  date: string | null;
  dateValue: number;
} {
  if (!input) return { date: null, dateValue: 0 };
  const trimmed = input.trim();
  if (!trimmed) return { date: null, dateValue: 0 };

  const dateValue = Date.parse(trimmed);
  if (!Number.isFinite(dateValue)) return { date: null, dateValue: 0 };
  return { date: trimmed, dateValue };
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return ".".repeat(Math.max(0, maxLength));
  return `${text.slice(0, maxLength - 3)}...`;
}

export function normalizeTags(input: string[] | string | undefined): string[] {
  if (!input) return [];

  const raw = Array.isArray(input)
    ? input
    : input
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of raw) {
    const value = item.trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

export function normalizeAliases(
  input: string[] | string | undefined,
  canonicalSlug: string,
): string[] {
  if (!input) return [];

  const raw = Array.isArray(input)
    ? input
    : input
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of raw) {
    const value = normalizeSlug(item);
    if (!value || value === canonicalSlug || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}
