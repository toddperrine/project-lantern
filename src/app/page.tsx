"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { recommendStoryArchitecture } from "@/lib/story-architecture-recommendations";
import type { StoryArchitectureRecommendation } from "@/lib/story-architecture-recommendations";
import {
  CHARACTER_ARCS,
  ENDING_TYPES,
  GENRE_PRESETS,
  LENGTH_TARGETS,
  NARRATIVE_ARCHITECTURES
} from "@/lib/types";
import type {
  CharacterArc,
  EndingType,
  GenerateStoryResponse,
  GenrePreset,
  LengthTarget,
  NarrativeArchitecture
} from "@/lib/types";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";

type UploadState = {
  name: string;
  content: string;
};

type SelectOption = {
  value: string;
  label: string;
};

const ACCEPTED_EXTENSIONS = [".md", ".txt"];

export default function Home() {
  const [worldBible, setWorldBible] = useState<UploadState>({ name: "", content: "" });
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>({ name: "", content: "" });
  const [storySeed, setStorySeed] = useState<UploadState>({ name: "", content: "" });
  const [storyRules, setStoryRules] = useState<UploadState>({ name: "", content: "" });
  const [genrePreset, setGenrePreset] = useState<GenrePreset>("Speculative Mystery");
  const [narrativeArchitecture, setNarrativeArchitecture] = useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>("Positive Change Arc");
  const [endingType, setEndingType] = useState<EndingType>("Resolution with Residue");
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [recommendation, setRecommendation] = useState<StoryArchitectureRecommendation | null>(null);
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
          storyRules.content.trim() &&
          !isGenerating
      ),
    [worldBible.content, characterProfiles.content, storySeed.content, storyRules.content, isGenerating]
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
          storyRules: storyRules.content,
          genrePreset,
          narrativeArchitecture,
          characterArc,
          endingType,
          lengthTarget
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
    setRecommendation(null);
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

  function handleRecommendSettings() {
    setRecommendation(
      recommendStoryArchitecture({
        worldBible: worldBible.content,
        characterProfiles: characterProfiles.content,
        storySeed: storySeed.content,
        storyRules: storyRules.content,
        currentSelections: {
          genrePreset,
          narrativeArchitecture,
          characterArc,
          endingType,
          lengthTarget
        }
      })
    );
  }

  function handleApplyRecommendation() {
    if (!recommendation) {
      return;
    }

    setGenrePreset(recommendation.genrePreset);
    setNarrativeArchitecture(recommendation.narrativeArchitecture);
    setCharacterArc(recommendation.characterArc);
    setEndingType(recommendation.endingType);
    setLengthTarget(recommendation.lengthTarget);
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

            <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold text-ink">Story Architecture</h2>
                  <p className="text-sm leading-6 text-ink/65">Compact controls for genre, shape, arc, ending, and length.</p>
                </div>
                <button
                  className="rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-sm font-semibold text-brass transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isGenerating}
                  onClick={handleRecommendSettings}
                  type="button"
                >
                  Recommend Settings
                </button>
              </div>

              {recommendation ? (
                <div className="mt-4 rounded-md border border-brass/25 bg-paper/80 p-3 text-sm text-ink/75">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-ink">Recommended settings</p>
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">
                        Confidence {Math.round(recommendation.confidence * 100)}%
                      </p>
                    </div>
                    <button
                      className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90"
                      onClick={handleApplyRecommendation}
                      type="button"
                    >
                      Apply Recommendation
                    </button>
                  </div>
                  <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                    <RecommendationItem label="Genre" value={recommendation.genrePreset} />
                    <RecommendationItem label="Architecture" value={recommendation.narrativeArchitecture} />
                    <RecommendationItem label="Arc" value={recommendation.characterArc} />
                    <RecommendationItem label="Ending" value={recommendation.endingType} />
                    <RecommendationItem label="Length" value={recommendation.lengthTarget} />
                  </dl>
                  <p className="mt-3 leading-6">{recommendation.explanation}</p>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                <SelectControl
                  label="Genre Preset"
                  value={genrePreset}
                  options={GENRE_PRESETS}
                  onChange={(value) => setGenrePreset(value as GenrePreset)}
                />
                <SelectControl
                  label="Narrative Architecture"
                  value={narrativeArchitecture}
                  options={NARRATIVE_ARCHITECTURES}
                  onChange={(value) => setNarrativeArchitecture(value as NarrativeArchitecture)}
                />
                <SelectControl
                  label="Character Arc"
                  value={characterArc}
                  options={CHARACTER_ARCS}
                  onChange={(value) => setCharacterArc(value as CharacterArc)}
                />
                <SelectControl
                  label="Ending Type"
                  value={endingType}
                  options={ENDING_TYPES}
                  onChange={(value) => setEndingType(value as EndingType)}
                />
                <SelectControl
                  label="Length Target"
                  value={lengthTarget}
                  options={LENGTH_TARGETS.map((target) => ({ value: target.value, label: target.label }))}
                  onChange={(value) => setLengthTarget(value as LengthTarget)}
                />
                <div className="rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/70">
                  POV is locked to third-person limited.
                </div>
              </div>
            </section>

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

function SelectControl({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: readonly string[] | readonly SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <select
        className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
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

function RecommendationItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
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
          <MetadataItem label="Genre preset" value={diagnostics.genrePreset} />
          <MetadataItem label="Narrative architecture" value={diagnostics.narrativeArchitecture} />
          <MetadataItem label="Character arc" value={diagnostics.characterArc} />
          <MetadataItem label="Ending type" value={diagnostics.endingType} />
          <MetadataItem label="Length target" value={diagnostics.lengthTarget} />
          <MetadataItem label="Final word count" value={diagnostics.finalWordCount.toLocaleString()} />
          <MetadataItem label="Expansion attempted" value={formatBoolean(diagnostics.expansionAttempted)} />
          <MetadataItem label="Expansion succeeded" value={formatBoolean(diagnostics.expansionSucceeded)} />
          <MetadataItem label="Under target notice" value={diagnostics.underTargetNotice ?? "None"} />
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
