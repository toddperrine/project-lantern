import type {
  CharacterArc,
  EndingType,
  GenerateStoryResponse,
  GenrePreset,
  NarrativeArchitecture,
  StoryDiagnostics
} from "@/lib/types";

export type UploadState = { name: string; content: string; libraryArtifactId?: string };
export type InputArtifactType = "worldBible" | "characterProfiles" | "storySeed" | "storyRules";
export type InputArtifact = {
  id: string;
  type: InputArtifactType;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  characterCount: number;
};
export type SavedStory = {
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

export const INPUT_ARTIFACTS_STORAGE_KEY = "story-world-engine:input-artifacts:v1";
export const SAVED_STORIES_STORAGE_KEY = "story-world-engine:saved-stories:v1";

export function readInputArtifacts(): InputArtifact[] {
  return readLocalStorageArray(INPUT_ARTIFACTS_STORAGE_KEY).filter(isInputArtifact);
}

export function persistInputArtifacts(artifacts: InputArtifact[]) {
  writeLocalStorageArray(INPUT_ARTIFACTS_STORAGE_KEY, artifacts);
}

export function readSavedStories(): SavedStory[] {
  return readLocalStorageArray(SAVED_STORIES_STORAGE_KEY).filter(isSavedStory);
}

export function persistSavedStories(stories: SavedStory[]) {
  writeLocalStorageArray(SAVED_STORIES_STORAGE_KEY, stories);
}

export function readLocalStorageArray(key: string): unknown[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalStorageArray<T>(key: string, values: T[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(values));
}

export function isInputArtifact(value: unknown): value is InputArtifact {
  const candidate = value as Partial<InputArtifact>;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      candidate.id &&
      isInputArtifactType(candidate.type) &&
      candidate.name &&
      typeof candidate.content === "string" &&
      candidate.createdAt &&
      candidate.updatedAt &&
      typeof candidate.characterCount === "number"
  );
}

export function isInputArtifactType(value: unknown): value is InputArtifactType {
  return value === "worldBible" || value === "characterProfiles" || value === "storySeed" || value === "storyRules";
}

export function isSavedStory(value: unknown): value is SavedStory {
  const candidate = value as Partial<SavedStory>;
  return Boolean(candidate && typeof candidate === "object" && candidate.id && candidate.title && candidate.createdAt && candidate.story);
}

export function createSavedStory(response: GenerateStoryResponse): SavedStory {
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

export function savedStoryToResponse(savedStory: SavedStory): GenerateStoryResponse {
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

export function createInputArtifactId(type: InputArtifactType, name: string, createdAt: string): string {
  return `${type}-${createdAt}-${name.length}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function createStoryId(story: string): string {
  return `${Date.now()}-${story.length}`;
}

function createStoryTitle(story: string): string {
  const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story";
  const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine;
  return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story";
}

function truncateText(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`;
}
