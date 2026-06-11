"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import type { GenerateStoryResponse } from "@/lib/types";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";

type UploadState = {
  name: string;
  content: string;
};

const ACCEPTED_EXTENSIONS = [".md", ".txt"];

export default function Home() {
  const [worldBible, setWorldBible] = useState<UploadState>({ name: "", content: "" });
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>({ name: "", content: "" });
  const [storySeed, setStorySeed] = useState<UploadState>({ name: "", content: "" });
  const [storyRules, setStoryRules] = useState<UploadState>({ name: "", content: "" });
  const [storyResponse, setStoryResponse] = useState<GenerateStoryResponse | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  const canGenerate = useMemo(
    () =>
      Boolean(
        worldBible.content.trim() &&
          characterProfiles.content.trim() &&
          storySeed.content.trim() &&
          !isGenerating
      ),
    [worldBible.content, characterProfiles.content, storySeed.content, isGenerating]
  );

  async function handleGenerate() {
    setError("");
    setStoryResponse(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          worldBible: worldBible.content,
          characterProfiles: characterProfiles.content,
          storySeed: storySeed.content,
          storyRules: storyRules.content
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Story generation failed.");
      }

      setStoryResponse(normalizeGenerateStoryResponse(payload));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Story generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLoadSampleWorld() {
    setError("");
    setStoryResponse(null);
    setIsLoadingSample(true);

    try {
      const [world, characters, seed, generationRules] = await Promise.all([
        fetchSampleFile("world.md"),
        fetchSampleFile("characters.md"),
        fetchSampleFile("story_seed.md"),
        fetchSampleFile("story_generation_rules.md")
      ]);

      setWorldBible({
        name: "world.md",
        content: world
      });
      setCharacterProfiles({
        name: "characters.md",
        content: characters
      });
      setStorySeed({
        name: "story_seed.md",
        content: seed
      });
      setStoryRules({
        name: "story_generation_rules.md",
        content: generationRules
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load the sample world.");
    } finally {
      setIsLoadingSample(false);
    }
  }

  return (
    <main className="min-h-screen px-5 py-6 md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-ink/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brass">Local creator tool</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink md:text-5xl">Story World Engine</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">
              Upload canon, a story request, and narrative rules to generate a literary short story that respects your world and cast.
            </p>
          </div>
          <div className="rounded-md border border-ink/10 bg-white/60 px-4 py-3 text-sm text-ink/70">
            No authentication, database, payments, AWS, voice, memory, or subscriptions.
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="flex flex-col gap-4">
            <button
              className="rounded-md border border-brass/40 bg-white/75 px-5 py-3 text-sm font-semibold text-brass shadow-soft transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoadingSample || isGenerating}
              onClick={handleLoadSampleWorld}
            >
              {isLoadingSample ? "Loading sample world..." : "Load Sample World"}
            </button>

            <UploadPanel
              title="World Bible"
              description="Upload a .md or .txt file with rules, places, tone, history, and canon."
              value={worldBible}
              onChange={setWorldBible}
            />
            <UploadPanel
              title="Character Profiles"
              description="Upload a .md or .txt file with names, motivations, relationships, and constraints."
              value={characterProfiles}
              onChange={setCharacterProfiles}
            />
            <UploadPanel
              title="Story Seed"
              description="Upload a .md or .txt file with the inciting incident, theme, or conflict to explore."
              value={storySeed}
              onChange={setStorySeed}
            />
            <UploadPanel
              title="Story Generation Rules / Narrative Constraints"
              description="Upload a .md or .txt file with narrative rules, constraints, priorities, and endings guidance."
              value={storyRules}
              onChange={setStoryRules}
            />

            {error ? (
              <div className="rounded-md border border-ember/30 bg-ember/10 p-3 text-sm text-ember">{error}</div>
            ) : null}

            <button
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/35"
              disabled={!canGenerate}
              onClick={handleGenerate}
            >
              {isGenerating ? "Generating story..." : "Generate Story"}
            </button>
          </section>

          <StoryOutput response={storyResponse} isGenerating={isGenerating} />
        </div>
      </section>
    </main>
  );
}

async function fetchSampleFile(fileName: string): Promise<string> {
  const response = await fetch(`/sample-content/${fileName}`);
  if (!response.ok) {
    throw new Error(`Unable to load sample file: ${fileName}`);
  }

  return response.text();
}

function normalizeGenerateStoryResponse(payload: unknown): GenerateStoryResponse {
  const normalizedPayload = normalizeStoryPayload(payload) as Partial<GenerateStoryResponse>;
  const story = normalizeStoryText(normalizedPayload.story);

  if (!story || !normalizedPayload.metadata) {
    throw new Error("Story generation returned an invalid response.");
  }

  return {
    ...normalizedPayload,
    story,
    metadata: {
      ...normalizedPayload.metadata,
      wordCount: countWords(story)
    }
  } as GenerateStoryResponse;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function UploadPanel({
  title,
  description,
  value,
  onChange
}: {
  title: string;
  description: string;
  value: UploadState;
  onChange: (value: UploadState) => void;
}) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      event.target.value = "";
      onChange({ name: "", content: "" });
      return;
    }

    onChange({
      name: file.name,
      content: await file.text()
    });
  }

  return (
    <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-6 text-ink/65">{description}</p>
      </div>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-brass/55 bg-paper/70 px-4 py-6 text-center transition hover:border-brass hover:bg-paper">
        <span className="text-sm font-semibold text-brass">{value.name || "Choose .md or .txt file"}</span>
        <span className="mt-1 text-xs text-ink/55">
          {value.content ? `${value.content.length.toLocaleString()} characters loaded` : "Files stay local until generation"}
        </span>
        <input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} />
      </label>
    </section>
  );
}

function StoryOutput({
  response,
  isGenerating
}: {
  response: GenerateStoryResponse | null;
  isGenerating: boolean;
}) {
  if (isGenerating) {
    return (
      <section className="min-h-[640px] rounded-md border border-ink/10 bg-white/75 p-6 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">Drafting</p>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-11/12 animate-pulse rounded bg-ink/10" />
          <div className="h-4 w-10/12 animate-pulse rounded bg-ink/10" />
          <div className="h-4 w-8/12 animate-pulse rounded bg-ink/10" />
        </div>
      </section>
    );
  }

  if (!response) {
    return (
      <section className="flex min-h-[640px] items-center justify-center rounded-md border border-ink/10 bg-white/60 p-6 text-center shadow-soft">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Your story will appear here</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-ink/65">
            The API uses OpenAI when `OPENAI_API_KEY` is set, and the local deterministic engine when it is not.
          </p>
        </div>
      </section>
    );
  }

  const diagnostics = response.metadata.diagnostics;

  return (
    <section className="rounded-md border border-ink/10 bg-white/80 p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-3 border-b border-ink/10 pb-5 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">Generated Story</p>
          <h2 className="mt-2 text-2xl font-semibold text-ink">
            {response.metadata.source === "openai" ? "OpenAI-powered draft" : "Fallback local draft"}
          </h2>
        </div>
        <div className="grid gap-2 text-sm text-ink/70 sm:grid-cols-2 md:min-w-80">
          <MetadataItem label="Word count" value={response.metadata.wordCount.toLocaleString()} />
          <MetadataItem label="Generator source" value={response.metadata.source} />
          <MetadataItem label="Characters" value={formatList(response.metadata.charactersUsed)} />
          <MetadataItem label="Rules" value={formatList(response.metadata.rulesReferenced)} />
          <MetadataItem label="OpenAI Enabled" value={formatBoolean(diagnostics.openAIEnabled)} />
          <MetadataItem label="OPENAI_API_KEY detected" value={formatBoolean(diagnostics.apiKeyDetected)} />
          <MetadataItem label="Model requested" value={diagnostics.modelRequested} />
          <MetadataItem label="OpenAI Attempted" value={formatBoolean(diagnostics.openAIRequestAttempted)} />
          <MetadataItem label="OpenAI Succeeded" value={formatBoolean(diagnostics.openAIRequestSucceeded)} />
          <MetadataItem label="Fallback Reason" value={diagnostics.fallbackReason ?? "None"} />
          <MetadataItem label="Notice" value={diagnostics.notice ?? "None"} />
        </div>
      </div>

      <article className="mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-ink">
        {response.story}
      </article>
    </section>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-paper/80 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 break-words text-sm text-ink">{value}</dd>
    </div>
  );
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None detected";
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}
