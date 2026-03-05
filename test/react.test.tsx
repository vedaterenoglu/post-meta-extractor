import { describe, expect, it } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import TestRenderer, { act } from "react-test-renderer";
import type { UsePostMetaWithAIResult } from "../src/react";
import { usePostMeta, usePostMetaWithAI } from "../src/react";

describe("react wrapper", () => {
  it("returns same meta shape through sync hook", () => {
    let outputTitle: string | null = null;

    function Probe(): React.ReactElement {
      const meta = usePostMeta({
        markdown: "# React Wrapper",
        sourceSlug: "react-wrapper",
      });
      outputTitle = meta.title;
      return <div>{meta.slug}</div>;
    }

    renderToString(<Probe />);
    expect(outputTitle).toBe("React Wrapper");
  });

  it("supports defined options path for sync hook", () => {
    let outputDescription: string | null = null;

    function Probe(): React.ReactElement {
      const meta = usePostMeta(
        {
          markdown: "A very long description line that should be truncated.",
          sourceSlug: "react-wrapper-options",
        },
        {
          maxDescriptionLength: 20,
          strict: false,
        },
      );
      outputDescription = meta.description;
      return <div>{meta.slug}</div>;
    }

    renderToString(<Probe />);
    expect(outputDescription).toBe("A very long descr...");
  });

  it("loads AI metadata asynchronously", async () => {
    let latest: UsePostMetaWithAIResult | null = null;

    function Probe(): React.ReactElement {
      latest = usePostMetaWithAI(
        { markdown: "# Async React" },
        {
          ai: {
            adapter: {
              generate: async () => ({
                description: "AI description",
                tags: ["React"],
              }),
            },
          },
        },
      );
      return <div>{latest.data?.slug ?? "pending"}</div>;
    }

    await act(async () => {
      TestRenderer.create(<Probe />);
    });

    await act(async () => {
      await Promise.resolve();
    });

    if (!latest) throw new Error("Expected hook state to be set.");
    const snapshot: UsePostMetaWithAIResult = latest;
    expect(snapshot.isLoading).toBe(false);
    expect(snapshot.error).toBeNull();
    expect(snapshot.data?.description).toBe("AI description");
    expect(snapshot.data?.tags).toEqual(["react"]);
    expect(snapshot.data?.ai.status).toBe("success");
  });
});
