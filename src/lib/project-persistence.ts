import { CLEAN_GENERATION_FAILURE_MESSAGE } from "./generation-display-policy";
import type {
  CharacterArc,
  EndingType,
  GenerateStoryResponse,
  GenrePreset,
  LengthTarget,
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
  selectedStoryTypeChipId?: string;
  selectedStoryTypeChipLabel?: string;
  legacyGenrePreset?: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: string;
  diagnosticsNotice: string | null;
  seriesTitle?: string | null;
  seriesId?: string;
  parentSeriesId?: string | null;
  sourceStoryId?: string | null;
  generationMode?: StoryDiagnostics["generationMode"];
  coverImageUrl?: string;
  coverImage?: string;
  heroImageUrl?: string;
  heroImage?: string;
  characterImageUrl?: string;
  characterImage?: string;
  feedback?: StoryFeedback[];
};
export type StoryFeedbackScore = 1 | 2 | 3 | 4 | 5;
export type StoryFeedback = {
  storyId: string;
  score: StoryFeedbackScore;
  selectedOptions: string[];
  comment?: string;
  createdAt: string;
  storyMetadata?: {
    title?: string;
    wordCount?: number;
    generatorSource?: GenerateStoryResponse["metadata"]["source"];
    genrePreset?: GenrePreset;
    narrativeArchitecture?: NarrativeArchitecture;
    characterArc?: CharacterArc;
    endingType?: EndingType;
    lengthTarget?: string;
  };
};
export type SavedProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  inputs: {
    worldBible: UploadState;
    characterProfiles: UploadState;
    storySeed: UploadState;
    storyRules: UploadState;
  };
  selections: {
    genrePreset: GenrePreset;
    narrativeArchitecture: NarrativeArchitecture;
    characterArc: CharacterArc;
    endingType: EndingType;
    lengthTarget: LengthTarget;
  };
  latestStory: GenerateStoryResponse | null;
  latestStoryFeedback?: StoryFeedback | null;
};

export const INPUT_ARTIFACTS_STORAGE_KEY = "story-world-engine:input-artifacts:v1";
export const SAVED_STORIES_STORAGE_KEY = "story-world-engine:saved-stories:v1";
export const SAVED_PROJECTS_STORAGE_KEY = "story-world-engine:saved-projects:v1";
export const STORY_FEEDBACK_STORAGE_KEY = "story-world-engine:story-feedback:v1";

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

export function readSavedProjects(): SavedProject[] {
  return readLocalStorageArray(SAVED_PROJECTS_STORAGE_KEY).filter(isSavedProject);
}

export function persistSavedProjects(projects: SavedProject[]) {
  writeLocalStorageArray(SAVED_PROJECTS_STORAGE_KEY, projects);
}

export function readStoryFeedback(): StoryFeedback[] {
  return readLocalStorageArray(STORY_FEEDBACK_STORAGE_KEY).filter(isStoryFeedback);
}

export function persistStoryFeedback(feedback: StoryFeedback[]) {
  writeLocalStorageArray(STORY_FEEDBACK_STORAGE_KEY, feedback);
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

export function isSavedProject(value: unknown): value is SavedProject {
  const candidate = value as Partial<SavedProject>;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      candidate.id &&
      candidate.name &&
      candidate.createdAt &&
      candidate.updatedAt &&
      candidate.inputs &&
      candidate.selections
  );
}

export function isStoryFeedback(value: unknown): value is StoryFeedback {
  const candidate = value as Partial<StoryFeedback>;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      typeof candidate.storyId === "string" &&
      isStoryFeedbackScore(candidate.score) &&
      Array.isArray(candidate.selectedOptions) &&
      candidate.selectedOptions.every((option) => typeof option === "string") &&
      typeof candidate.createdAt === "string"
  );
}

export function isStoryFeedbackScore(value: unknown): value is StoryFeedbackScore {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

export function createSavedStory(response: GenerateStoryResponse, storyId = createStoryId(response.story), feedback: StoryFeedback[] = []): SavedStory {
  if (response.metadata.source === "fallback") {
    throw new Error(CLEAN_GENERATION_FAILURE_MESSAGE);
  }

  const diagnostics = response.metadata.diagnostics;
  return {
    id: storyId,
    title: createStoryTitle(response.story),
    createdAt: new Date().toISOString(),
    story: response.story,
    wordCount: response.metadata.wordCount,
    generatorSource: response.metadata.source,
    charactersUsed: response.metadata.charactersUsed,
    rulesReferenced: response.metadata.rulesReferenced,
    genrePreset: diagnostics.genrePreset,
    selectedStoryTypeChipId: diagnostics.selectedStoryTypeChipId,
    selectedStoryTypeChipLabel: diagnostics.selectedStoryTypeChipLabel,
    legacyGenrePreset: diagnostics.legacyGenrePreset ?? diagnostics.genrePreset,
    narrativeArchitecture: diagnostics.narrativeArchitecture,
    characterArc: diagnostics.characterArc,
    endingType: diagnostics.endingType,
    lengthTarget: diagnostics.lengthTarget,
    diagnosticsNotice: diagnostics.notice ?? diagnostics.underTargetNotice,
    seriesTitle: response.metadata.seriesTitle ?? diagnostics.seriesTitle ?? null,
    seriesId: diagnostics.seriesId,
    parentSeriesId: diagnostics.parentSeriesId ?? null,
    sourceStoryId: diagnostics.sourceStoryId ?? null,
    generationMode: diagnostics.generationMode,
    feedback
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
    selectedStoryTypeChipId: savedStory.selectedStoryTypeChipId,
    selectedStoryTypeChipLabel: savedStory.selectedStoryTypeChipLabel,
    legacyGenrePreset: savedStory.legacyGenrePreset ?? savedStory.genrePreset,
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
    blueprintFailedReason: null,
    generationMode: savedStory.generationMode ?? "new_story",
    storyId: savedStory.id,
    seriesId: savedStory.seriesId ?? savedStory.id,
    sourceStoryId: savedStory.sourceStoryId ?? null,
    parentSeriesId: savedStory.parentSeriesId ?? null,
    continuationContextIncluded: false,
    newSeriesCreated: savedStory.generationMode !== "continue_series",
    generationTrigger: "Restored local save"
  };

  return {
    story: savedStory.story,
    metadata: {
      wordCount: savedStory.wordCount,
      charactersUsed: savedStory.charactersUsed,
      rulesReferenced: savedStory.rulesReferenced,
      source: savedStory.generatorSource,
      seriesTitle: savedStory.seriesTitle ?? null,
      diagnostics: { ...diagnostics, seriesTitle: savedStory.seriesTitle ?? null }
    }
  };
}

export function createInputArtifactId(type: InputArtifactType, name: string, createdAt: string): string {
  return `${type}-${createdAt}-${name.length}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function createSavedProjectId(name: string, createdAt: string): string {
  return `project-${createdAt}-${name.length}`.replace(/[^a-zA-Z0-9_-]/g, "-");
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
