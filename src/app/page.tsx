"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
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
  NarrativeArchitecture,
  StoryDiagnostics
} from "@/lib/types";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";

type UploadState = {
  name: string;
  content: string;
  libraryArtifactId?: string;
};

type InputArtifactType = "worldBible" | "characterProfiles" | "storySeed" | "storyRules";

type InputArtifact = {
  id: string;
  type: InputArtifactType;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  characterCount: number;
};

type SelectOption = {
  value: string;
  label: string;
};

type SavedStory = {
  id: string;
  title: string;
  createdAt: string;
  story: string;
  wordCount: number;
  generatorSource: GenerateStoryResponse["metadata"]["source"];
  charactersUsed: string[];
  rulesReferenced: string[];
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: string;
  diagnosticsNotice: string | null;
};

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const INPUT_ARTIFACTS_STORAGE_KEY = "story-world-engine:input-artifacts:v1";
const SAVED_STORIES_STORAGE_KEY = "story-world-engine:saved-stories:v1";
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const INPUT_LABELS: Record<InputArtifactType, string> = {
  worldBible: "World Bible",
  characterProfiles: "Character Profiles",
  storySeed: "Story Seed",
  storyRules: "Story Rules"
};

export default function Home() {
  const [worldBible, setWorldBible] = useState<UploadState>(EMPTY_UPLOAD);
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>(EMPTY_UPLOAD);
  const [storySeed, setStorySeed] = useState<UploadState>(EMPTY_UPLOAD);
  const [storyRules, setStoryRules] = useState<UploadState>(EMPTY_UPLOAD);
  const [genrePreset, setGenrePreset] = useState<GenrePreset>("Speculative Mystery");
  const [narrativeArchitecture, setNarrativeArchitecture] = useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>("Positive Change Arc");
  const [endingType, setEndingType] = useState<EndingType>("Resolution with Residue");
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [recommendation, setRecommendation] = useState<StoryArchitectureRecommendation | null>(null);
  const [storyResponse, setStoryResponse] = useState<GenerateStoryResponse | null>(null);
  const [inputArtifacts, setInputArtifacts] = useState<InputArtifact[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);

  useEffect(() => {
    setInputArtifacts(readInputArtifacts());
    setSavedStories(readSavedStories());
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

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
    setStatusMessage("");
    setStoryResponse(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    setStatusMessage("");
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
      setWorldBible({ name: "world.md", content: world });
      setCharacterProfiles({ name: "characters.md", content: characters });
      setStorySeed({ name: "story_seed.md", content: seed });
      setStoryRules({ name: "story_generation_rules.md", content: generationRules });
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
        currentSelections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget }
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

  function handleClearCurrentInputs() {
    setWorldBible({ ...EMPTY_UPLOAD });
    setCharacterProfiles({ ...EMPTY_UPLOAD });
    setStorySeed({ ...EMPTY_UPLOAD });
    setStoryRules({ ...EMPTY_UPLOAD });
    setRecommendation(null);
    setStoryResponse(null);
    setStatusMessage("Current inputs cleared. Saved library items were not changed.");
  }

  function handleSelectInputArtifact(type: InputArtifactType, artifactId: string) {
    if (!artifactId) {
      setUploadForType(type, { ...EMPTY_UPLOAD });
      return;
    }
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) {
      return;
    }
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setRecommendation(null);
    setStoryResponse(null);
    setStatusMessage(`Loaded ${artifact.name} from the local library.`);
  }

  function handleSaveInputArtifact(type: InputArtifactType, value: UploadState) {
    if (!value.content.trim()) {
      setError(`Add ${INPUT_LABELS[type]} content before saving it to the library.`);
      return;
    }

    setError("");
    const now = new Date().toISOString();
    const baseName = value.name.trim() || `${INPUT_LABELS[type]} ${formatLibraryVersion(now)}`;
    const duplicate = inputArtifacts.some((artifact) => artifact.type === type && artifact.name === baseName);
    let name = baseName;

    if (duplicate) {
      const saveVersion = window.confirm(
        `${baseName} already exists in ${INPUT_LABELS[type]}. Save a new timestamped version instead?`
      );
      if (!saveVersion) {
        return;
      }
      name = `${baseName} (${formatLibraryVersion(now)})`;
    }

    const artifact: InputArtifact = {
      id: createInputArtifactId(type, name, now),
      type,
      name,
      content: value.content,
      createdAt: now,
      updatedAt: now,
      characterCount: value.content.length
    };
    const nextArtifacts = [artifact, ...inputArtifacts];
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setStatusMessage(`${artifact.name} saved to the local library.`);
  }

  function handleRemoveInputArtifact(type: InputArtifactType, artifactId?: string) {
    if (!artifactId) {
      return;
    }
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) {
      return;
    }
    const nextArtifacts = inputArtifacts.filter((item) => item.id !== artifactId);
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    clearSelectedArtifactId(type, artifactId);
    setStatusMessage(`${artifact.name} removed from the local library.`);
  }

  function handleSaveStory() {
    if (!storyResponse) {
      return;
    }
    const savedStory = createSavedStory(storyResponse);
    const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
    persistSavedStories(nextSavedStories);
    setSavedStories(nextSavedStories);
    setStatusMessage("Story saved locally in this browser.");
  }

  function handleRestoreSavedStory(savedStory: SavedStory) {
    setStoryResponse(savedStoryToResponse(savedStory));
    setStatusMessage(`Restored ${savedStory.title}.`);
  }

  function handleDeleteSavedStory(storyId: string) {
    const nextSavedStories = savedStories.filter((story) => story.id !== storyId);
    persistSavedStories(nextSavedStories);
    setSavedStories(nextSavedStories);
    setStatusMessage("Saved story deleted.");
  }

  async function handleCopyStory() {
    if (!storyResponse) {
      return;
    }
    await copyText(storyResponse.story);
    setStatusMessage("Story copied.");
  }

  async function handleCopySocialTeaser() {
    if (!storyResponse) {
      return;
    }
    await copyText(buildSocialTeaser(createSavedStory(storyResponse)));
    setStatusMessage("Social teaser copied.");
  }

  async function handleShareStory() {
    if (!storyResponse || !navigator.share) {
      return;
    }
    const savedStory = createSavedStory(storyResponse);
    await navigator.share({ title: savedStory.title, text: buildSocialTeaser(savedStory) });
  }

  function handleDownloadTxt() {
    if (!storyResponse) {
      return;
    }
    const savedStory = createSavedStory(storyResponse);
    downloadTextFile(`${slugify(savedStory.title)}.txt`, savedStory.story);
  }

  function handleDownloadMarkdown() {
    if (!storyResponse) {
      return;
    }
    const savedStory = createSavedStory(storyResponse);
    downloadTextFile(`${slugify(savedStory.title)}.md`, buildMarkdownExport(savedStory));
  }

  function setUploadForType(type: InputArtifactType, value: UploadState) {
    if (type === "worldBible") {
      setWorldBible(value);
    } else if (type === "characterProfiles") {
      setCharacterProfiles(value);
    } else if (type === "storySeed") {
      setStorySeed(value);
    } else {
      setStoryRules(value);
    }
  }

  function clearSelectedArtifactId(type: InputArtifactType, artifactId: string) {
    const clearIfSelected = (value: UploadState): UploadState =>
      value.libraryArtifactId === artifactId ? { name: value.name, content: value.content } : value;

    if (type === "worldBible") {
      setWorldBible(clearIfSelected);
    } else if (type === "characterProfiles") {
      setCharacterProfiles(clearIfSelected);
    } else if (type === "storySeed") {
      setStorySeed(clearIfSelected);
    } else {
      setStoryRules(clearIfSelected);
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
              type="button"
            >
              {isLoadingSample ? "Loading sample world..." : "Load Sample World"}
            </button>

            <UploadPanel
              artifactType="worldBible"
              description="Upload a .md or .txt file with rules, places, tone, history, and canon."
              libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "worldBible")}
              onChange={setWorldBible}
              onRemoveFromLibrary={handleRemoveInputArtifact}
              onSaveToLibrary={handleSaveInputArtifact}
              onSelectFromLibrary={handleSelectInputArtifact}
              title="World Bible"
              value={worldBible}
            />
            <UploadPanel
              artifactType="characterProfiles"
              description="Upload a .md or .txt file with names, motivations, relationships, and constraints."
              libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "characterProfiles")}
              onChange={setCharacterProfiles}
              onRemoveFromLibrary={handleRemoveInputArtifact}
              onSaveToLibrary={handleSaveInputArtifact}
              onSelectFromLibrary={handleSelectInputArtifact}
              title="Character Profiles"
              value={characterProfiles}
            />
            <UploadPanel
              artifactType="storySeed"
              description="Upload a .md or .txt file with the inciting incident, theme, or conflict to explore."
              libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storySeed")}
              onChange={setStorySeed}
              onRemoveFromLibrary={handleRemoveInputArtifact}
              onSaveToLibrary={handleSaveInputArtifact}
              onSelectFromLibrary={handleSelectInputArtifact}
              title="Story Seed"
              value={storySeed}
            />
            <UploadPanel
              artifactType="storyRules"
              description="Upload a .md or .txt file with narrative rules, constraints, priorities, and endings guidance."
              libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storyRules")}
              onChange={setStoryRules}
              onRemoveFromLibrary={handleRemoveInputArtifact}
              onSaveToLibrary={handleSaveInputArtifact}
              onSelectFromLibrary={handleSelectInputArtifact}
              title="Story Generation Rules / Narrative Constraints"
              value={storyRules}
            />

            <button
              className="rounded-md border border-ink/15 bg-white/75 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isGenerating}
              onClick={handleClearCurrentInputs}
              type="button"
            >
              Clear current inputs
            </button>

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
                <SelectControl label="Genre Preset" onChange={(value) => setGenrePreset(value as GenrePreset)} options={GENRE_PRESETS} value={genrePreset} />
                <SelectControl
                  label="Narrative Architecture"
                  onChange={(value) => setNarrativeArchitecture(value as NarrativeArchitecture)}
                  options={NARRATIVE_ARCHITECTURES}
                  value={narrativeArchitecture}
                />
                <SelectControl label="Character Arc" onChange={(value) => setCharacterArc(value as CharacterArc)} options={CHARACTER_ARCS} value={characterArc} />
                <SelectControl label="Ending Type" onChange={(value) => setEndingType(value as EndingType)} options={ENDING_TYPES} value={endingType} />
                <SelectControl
                  label="Length Target"
                  onChange={(value) => setLengthTarget(value as LengthTarget)}
                  options={LENGTH_TARGETS.map((target) => ({ value: target.value, label: target.label }))}
                  value={lengthTarget}
                />
                <div className="rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/70">POV is locked to third-person limited.</div>
              </div>
            </section>

            <SavedStoriesPanel savedStories={savedStories} onDelete={handleDeleteSavedStory} onRestore={handleRestoreSavedStory} />
            {statusMessage ? <div className="rounded-md border border-brass/25 bg-paper/80 p-3 text-sm text-ink/70">{statusMessage}</div> : null}
            {error ? <div className="rounded-md border border-ember/30 bg-ember/10 p-3 text-sm text-ember">{error}</div> : null}

            <button
              className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/35"
              disabled={!canGenerate}
              onClick={handleGenerate}
              type="button"
            >
              {isGenerating ? "Generating story..." : "Generate Story"}
            </button>
          </section>

          <StoryOutput
            canNativeShare={canNativeShare}
            isGenerating={isGenerating}
            onCopySocialTeaser={handleCopySocialTeaser}
            onCopyStory={handleCopyStory}
            onDownloadMarkdown={handleDownloadMarkdown}
            onDownloadTxt={handleDownloadTxt}
            onSaveStory={handleSaveStory}
            onShareStory={handleShareStory}
            response={storyResponse}
          />
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

function UploadPanel({
  artifactType,
  description,
  libraryArtifacts,
  onChange,
  onRemoveFromLibrary,
  onSaveToLibrary,
  onSelectFromLibrary,
  title,
  value
}: {
  artifactType: InputArtifactType;
  description: string;
  libraryArtifacts: InputArtifact[];
  onChange: (value: UploadState) => void;
  onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void;
  onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void;
  onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void;
  title: string;
  value: UploadState;
}) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      event.target.value = "";
      onChange({ ...EMPTY_UPLOAD });
      return;
    }
    onChange({ name: file.name, content: await file.text() });
  }

  const selectedArtifact = libraryArtifacts.find((artifact) => artifact.id === value.libraryArtifactId);

  return (
    <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        <p className="text-sm leading-6 text-ink/65">{description}</p>
      </div>
      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Choose from library</span>
        <select
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20"
          onChange={(event) => onSelectFromLibrary(artifactType, event.target.value)}
          value={value.libraryArtifactId ?? ""}
        >
          <option value="">Upload new or choose saved</option>
          {libraryArtifacts.map((artifact) => (
            <option key={artifact.id} value={artifact.id}>
              {artifact.name} ({artifact.characterCount.toLocaleString()} chars)
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-brass/55 bg-paper/70 px-4 py-6 text-center transition hover:border-brass hover:bg-paper">
        <span className="text-sm font-semibold text-brass">{value.name || "Choose .md or .txt file"}</span>
        <span className="mt-1 text-xs text-ink/55">
          {value.content ? `${value.content.length.toLocaleString()} characters loaded` : "Files stay local until generation"}
        </span>
        <input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} />
      </label>
      {selectedArtifact ? (
        <p className="mt-3 rounded-md bg-paper/80 px-3 py-2 text-xs leading-5 text-ink/60">
          Loaded from library: {selectedArtifact.name} | {selectedArtifact.characterCount.toLocaleString()} characters
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!value.content.trim()}
          onClick={() => onSaveToLibrary(artifactType, value)}
          type="button"
        >
          Save to Library
        </button>
        <button
          className="rounded-md border border-ember/30 bg-white/70 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!value.libraryArtifactId}
          onClick={() => onRemoveFromLibrary(artifactType, value.libraryArtifactId)}
          type="button"
        >
          Remove from Library
        </button>
      </div>
    </section>
  );
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

function RecommendationItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

function SavedStoriesPanel({
  savedStories,
  onDelete,
  onRestore
}: {
  savedStories: SavedStory[];
  onDelete: (storyId: string) => void;
  onRestore: (story: SavedStory) => void;
}) {
  return (
    <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">Saved Stories</h2>
        <p className="text-sm leading-6 text-ink/65">Stored locally in this browser.</p>
      </div>
      {savedStories.length === 0 ? (
        <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">No saved stories yet.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {savedStories.map((story) => (
            <article key={story.id} className="rounded-md border border-ink/10 bg-paper/80 p-3">
              <h3 className="text-sm font-semibold text-ink">{story.title}</h3>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                {formatDateTime(story.createdAt)} | {story.wordCount.toLocaleString()} words
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/60">
                {story.genrePreset} | {story.narrativeArchitecture}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90" onClick={() => onRestore(story)} type="button">
                  Open
                </button>
                <button
                  className="rounded-md border border-ember/30 bg-white/70 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/10"
                  onClick={() => onDelete(story.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function StoryOutput({
  canNativeShare,
  response,
  isGenerating,
  onCopySocialTeaser,
  onCopyStory,
  onDownloadMarkdown,
  onDownloadTxt,
  onSaveStory,
  onShareStory
}: {
  canNativeShare: boolean;
  response: GenerateStoryResponse | null;
  isGenerating: boolean;
  onCopySocialTeaser: () => void;
  onCopyStory: () => void;
  onDownloadMarkdown: () => void;
  onDownloadTxt: () => void;
  onSaveStory: () => void;
  onShareStory: () => void;
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
      <div className="flex flex-col gap-4 border-b border-ink/10 pb-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">Generated Story</p>
            <h2 className="mt-2 text-2xl font-semibold text-ink">
              {response.metadata.source === "openai" ? "OpenAI-powered draft" : "Fallback local draft"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <OutputButton onClick={onSaveStory}>Save Story</OutputButton>
            <OutputButton onClick={onCopyStory}>Copy story</OutputButton>
            <OutputButton onClick={onDownloadTxt}>Download .txt</OutputButton>
            <OutputButton onClick={onDownloadMarkdown}>Download .md</OutputButton>
            <OutputButton onClick={onCopySocialTeaser}>Copy social teaser</OutputButton>
            {canNativeShare ? <OutputButton onClick={onShareStory}>Share</OutputButton> : null}
          </div>
        </div>
        <div className="grid gap-2 text-sm text-ink/70 sm:grid-cols-2 lg:grid-cols-3">
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
          <MetadataItem label="Blueprint generated" value={formatBoolean(diagnostics.blueprintGenerated)} />
          <MetadataItem label="Blueprint scene count" value={diagnostics.blueprintSceneCount.toLocaleString()} />
          <MetadataItem label="Blueprint failed reason" value={diagnostics.blueprintFailedReason ?? "None"} />
          <MetadataItem label="OpenAI Enabled" value={formatBoolean(diagnostics.openAIEnabled)} />
          <MetadataItem label="OPENAI_API_KEY detected" value={formatBoolean(diagnostics.apiKeyDetected)} />
          <MetadataItem label="Model requested" value={diagnostics.modelRequested} />
          <MetadataItem label="OpenAI Attempted" value={formatBoolean(diagnostics.openAIRequestAttempted)} />
          <MetadataItem label="OpenAI Succeeded" value={formatBoolean(diagnostics.openAIRequestSucceeded)} />
          <MetadataItem label="Fallback Reason" value={diagnostics.fallbackReason ?? "None"} />
          <MetadataItem label="Notice" value={diagnostics.notice ?? "None"} />
        </div>
      </div>
      <article className="mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-ink">{response.story}</article>
    </section>
  );
}

function OutputButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-paper" onClick={onClick} type="button">
      {children}
    </button>
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

function createSavedStory(response: GenerateStoryResponse): SavedStory {
  const diagnostics = response.metadata.diagnostics;
  return {
    id: createStoryId(response.story),
    title: createStoryTitle(response.story),
    createdAt: new Date().toISOString(),
    story: response.story,
    wordCount: response.metadata.wordCount,
    generatorSource: response.metadata.source,
    charactersUsed: response.metadata.charactersUsed,
    rulesReferenced: response.metadata.rulesReferenced,
    genrePreset: diagnostics.genrePreset,
    narrativeArchitecture: diagnostics.narrativeArchitecture,
    characterArc: diagnostics.characterArc,
    endingType: diagnostics.endingType,
    lengthTarget: diagnostics.lengthTarget,
    diagnosticsNotice: diagnostics.notice ?? diagnostics.underTargetNotice
  };
}

function savedStoryToResponse(savedStory: SavedStory): GenerateStoryResponse {
  const diagnostics: StoryDiagnostics = {
    openAIEnabled: false,
    apiKeyDetected: false,
    modelRequested: "Restored local save",
    openAIRequestAttempted: false,
    openAIRequestSucceeded: false,
    fallbackReason: null,
    notice: savedStory.diagnosticsNotice,
    genrePreset: savedStory.genrePreset,
    narrativeArchitecture: savedStory.narrativeArchitecture,
    characterArc: savedStory.characterArc,
    endingType: savedStory.endingType,
    lengthTarget: savedStory.lengthTarget,
    finalWordCount: savedStory.wordCount,
    expansionAttempted: false,
    expansionSucceeded: false,
    underTargetNotice: null,
    blueprintGenerated: false,
    blueprintSceneCount: 0,
    blueprintFailedReason: null
  };
  return {
    story: savedStory.story,
    metadata: {
      wordCount: savedStory.wordCount,
      charactersUsed: savedStory.charactersUsed,
      rulesReferenced: savedStory.rulesReferenced,
      source: savedStory.generatorSource,
      diagnostics
    }
  };
}

function readInputArtifacts(): InputArtifact[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(INPUT_ARTIFACTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as InputArtifact[];
    return Array.isArray(parsed) ? parsed.filter(isInputArtifact) : [];
  } catch {
    return [];
  }
}

function persistInputArtifacts(artifacts: InputArtifact[]) {
  window.localStorage.setItem(INPUT_ARTIFACTS_STORAGE_KEY, JSON.stringify(artifacts));
}

function isInputArtifact(value: unknown): value is InputArtifact {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<InputArtifact>;
  return Boolean(
    candidate.id &&
      isInputArtifactType(candidate.type) &&
      candidate.name &&
      typeof candidate.content === "string" &&
      candidate.createdAt &&
      candidate.updatedAt &&
      typeof candidate.characterCount === "number"
  );
}

function isInputArtifactType(value: unknown): value is InputArtifactType {
  return value === "worldBible" || value === "characterProfiles" || value === "storySeed" || value === "storyRules";
}

function readSavedStories(): SavedStory[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(SAVED_STORIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as SavedStory[];
    return Array.isArray(parsed) ? parsed.filter(isSavedStory) : [];
  } catch {
    return [];
  }
}

function persistSavedStories(stories: SavedStory[]) {
  window.localStorage.setItem(SAVED_STORIES_STORAGE_KEY, JSON.stringify(stories));
}

function isSavedStory(value: unknown): value is SavedStory {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<SavedStory>;
  return Boolean(candidate.id && candidate.title && candidate.createdAt && candidate.story);
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text);
}

function buildMarkdownExport(savedStory: SavedStory): string {
  return `# ${savedStory.title}\n\nGenerated date: ${formatDateTime(savedStory.createdAt)}\nWord count: ${savedStory.wordCount.toLocaleString()}\nGenre Preset: ${savedStory.genrePreset}\nNarrative Architecture: ${savedStory.narrativeArchitecture}\nCharacter Arc: ${savedStory.characterArc}\nEnding Type: ${savedStory.endingType}\nLength Target: ${savedStory.lengthTarget}\n\n${savedStory.story}`;
}

function buildSocialTeaser(savedStory: SavedStory): string {
  return `${savedStory.title}\n\n${truncateText(savedStory.story, 280)}\n\n${savedStory.wordCount.toLocaleString()} words\nGenerated with Story World Engine`;
}

function downloadTextFile(fileName: string, contents: string) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function createStoryId(story: string): string {
  return `${Date.now()}-${story.length}`;
}

function createInputArtifactId(type: InputArtifactType, name: string, createdAt: string): string {
  return `${type}-${createdAt}-${name.length}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function createStoryTitle(story: string): string {
  const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story";
  const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine;
  return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story";
}

function truncateText(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story-world-engine-story";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatLibraryVersion(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })
    .format(new Date(value))
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+$/g, "");
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "None detected";
}

function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No";
}
