import { describe, expect, it } from "vitest";
import { extractPostMeta } from "../src/core/extract";

describe("extractPostMeta core behavior", () => {
  it("extracts frontmatter fields", () => {
    const markdown = `---
title: "My Post"
date: 2025-01-20
description: Intro text
thumbnailUrl: https://cdn.test/image.jpg
tags: [DevOps, Frontend]
aliases: [My Post Legacy, old-my-post]
published: true
---
# Ignored heading`;

    const result = extractPostMeta({ markdown, sourceSlug: "my-post" });

    expect(result.title).toBe("My Post");
    expect(result.date).toBe("2025-01-20");
    expect(result.description).toBe("Intro text");
    expect(result.thumbnailUrl).toBe("https://cdn.test/image.jpg");
    expect(result.tags).toEqual(["devops", "frontend"]);
    expect(result.aliases).toEqual(["my-post-legacy", "old-my-post"]);
    expect(result.published).toBe(true);
    expect(result.slug).toBe("my-post");
  });

  it("falls back to heading title and content description", () => {
    const markdown = `# Hello World

This is the first paragraph and should be description.

## Second Heading`;
    const result = extractPostMeta({ markdown });

    expect(result.title).toBe("Hello World");
    expect(result.description).toBe("This is the first paragraph and should be description.");
    expect(result.slug).toBe("hello-world");
    expect(result.aliases).toEqual([]);
    expect(result.published).toBeNull();
  });

  it("extracts thumbnail from first markdown image", () => {
    const markdown = `# With Image

![hero](https://cdn.test/hero.png "hero")

text`;
    const result = extractPostMeta({ markdown });
    expect(result.thumbnailUrl).toBe("https://cdn.test/hero.png");
  });

  it("returns lenient defaults when content is empty", () => {
    const result = extractPostMeta({ markdown: "" });
    expect(result.title).toBeNull();
    expect(result.description).toBeNull();
    expect(result.date).toBeNull();
    expect(result.dateValue).toBe(0);
    expect(result.thumbnailUrl).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.aliases).toEqual([]);
    expect(result.slug).toBe("untitled");
    expect(result.published).toBeNull();
  });

  it("uses date from slug prefix when frontmatter date is invalid", () => {
    const markdown = `---
date: not-a-date
---
# Post`;
    const result = extractPostMeta({ markdown, sourceSlug: "2024-08-25-my-post" });
    expect(result.date).toBe("2024-08-25");
    expect(result.dateValue).toBeGreaterThan(0);
  });

  it("normalizes tag list and deduplicates values", () => {
    const markdown = `---
tags:
  - React
  - react
  - SOLID
---
Content`;
    const result = extractPostMeta({ markdown });
    expect(result.tags).toEqual(["react", "solid"]);
  });

  it("handles malformed frontmatter as plain markdown", () => {
    const markdown = `---
title: broken frontmatter
# Heading Works`;
    const result = extractPostMeta({ markdown, fallbackTitle: "Fallback" });
    expect(result.title).toBe("Heading Works");
  });

  it("respects maxDescriptionLength option", () => {
    const markdown = "A very long description line that needs truncation in output.";
    const result = extractPostMeta({ markdown }, { maxDescriptionLength: 20 });
    expect(result.description).toBe("A very long descr...");
  });

  it("normalizes aliases and removes canonical slug duplicates", () => {
    const markdown = `---
aliases: legacy-post, Legacy Post, hello-world
---
# Hello World`;
    const result = extractPostMeta({ markdown });
    expect(result.slug).toBe("hello-world");
    expect(result.aliases).toEqual(["legacy-post"]);
  });
});
