import type { GenerationIdentity, GenerationMode } from "@/lib/generation-identity";
import type { ReaderMoodSnapshot } from "@/lib/reader-profile";
export const GENRE_PRESETS = [
  "Speculative Mystery",
  "Literary Science Fiction",
  "Contemporary Fantastical / Magical Realist"
] as const;

export const NARRATIVE_ARCHITECTURES = [
  "Revelation Story",
  "Event Story",
  "Character Transformation Story"
] as const;

export const CHARACTER_ARCS = [
  "Positive Change Arc",
  "Flat / Testing Arc",
  "Disillusionment Arc"
] as const;

export const ENDING_TYPES = [
  "Resolution with Residue",
  "Revelation with Cost",
  "Transformation without Victory"
] as const;

export const LENGTH_TARGETS = [
  { value: "First Page Test", label: "First Page Test: 600-1000 words", minWords: 600, maxWords: 1000 },
  { value: "Compact", label: "Compact: 1500-2500 words", minWords: 1500, maxWords: 2500 },
  { value: "Standard", label: "Standard: 2500-3500 words", minWords: 2500, maxWords: 3500 },
  { value: "Long", label: "Long: 3500-5000 words - Experimental / may take longer", minWords: 3500, maxWords: 5000 }
] as const;

export type GenrePreset = (typeof GENRE_PRESETS)[number];
export type NarrativeArchitecture = (typeof NARRATIVE_ARCHITECTURES)[number];
export type CharacterArc = (typeof CHARACTER_ARCS)[number];
export type EndingType = (typeof ENDING_TYPES)[number];
export type LengthTarget = (typeof LENGTH_TARGETS)[number]["value"];

export type ReaderProfileGenerationSnapshot = {
  mode: "new-story" | "continue-story" | "unknown";
  profileUsed: boolean;
  profileSourceUsed: "local" | "cloud" | "default" | "none";
  profileUpdatedAt: string;
  profileConfidence: "low" | "medium" | "high" | "unavailable";
  tasteProfilePresent: boolean;
  tasteProfileSource: string;
  tasteProfileUpdatedAt: string;
  feedbackSignalCount: number;
  feedbackIncluded: boolean;
  latestFeedbackRating: string;
  userHardAvoidanceCount: number;
  userHardAvoidancesSummary: string;
  defaultSafetyGuardrailCount: number;
  defaultSafetyGuardrailsSummary: string;
  moodSignal: string;
  genreSignal: string;
  canonicalReaderProfileUsed?: boolean;
  canonicalReaderProfileInput?: object;
  generatedAt: string;
};

export type GenerateStoryRequest = {
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
  storyRules: string;
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: LengthTarget;
  generationMode: GenerationMode;
  generationIdentity: GenerationIdentity;
  continuationContextIncluded: boolean;
  generationTrigger: "Start Something New" | "Continue Series" | "Retry/Rewrite" | "Create";
  readerMood?: ReaderMoodSnapshot | null;
  personalizationContext?: string;
  continuationStoryId?: string;
  readerProfileGenerationSnapshot?: ReaderProfileGenerationSnapshot;
  readerProfileInput?: object;
};

export type StoryMetadata = {
  wordCount: number;
  charactersUsed: string[];
  rulesReferenced: string[];
  source: "openai" | "fallback";
  generationStartedAt?: string;
  generationFinishedAt?: string;
  generationDurationSeconds?: number;
  serverGenerationDurationSeconds?: number;
  appVersion?: string;
  buildEnvironment?: string;
  gitBranch?: string;
  commitSha?: string;
  buildTimestamp?: string;
  diagnostics: StoryDiagnostics;
};

export type GenerateStoryResponse = {
  story: string;
  metadata: StoryMetadata;
};

export type StoryDiagnostics = {
  openAIEnabled: boolean;
  apiKeyDetected: boolean;
  modelRequested: string;
  blueprintModelRequested?: string;
  storyModelRequested?: string;
  expansionModelRequested?: string;
  openAIRequestAttempted: boolean;
  openAIRequestSucceeded: boolean;
  fallbackReason: string | null;
  notice: string | null;
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: string;
  targetMinimumWordCount?: number;
  targetMaximumWordCount?: number;
  finalWordCount: number;
  longFloorPassAttempted?: boolean;
  longFloorPassSucceeded?: boolean;
  longFloorPassFinalWordCount?: number;
  longFloorPassTargetMinimumWordCount?: number;
  expansionAttempted: boolean;
  expansionSucceeded: boolean;
  expansionAttemptsCount?: number;
  repairAttemptsCount?: number;
  serverGenerationDurationSeconds?: number;
  appVersion?: string;
  buildEnvironment?: string;
  gitBranch?: string;
  commitSha?: string;
  buildTimestamp?: string;
  timedOutEarly?: boolean;
  stoppedReason?: "complete" | "time-budget" | "max-expansion-attempts" | "openai-error";
  remainingForbiddenTerms?: string[];
  underTargetNotice: string | null;
  blueprintGenerated: boolean;
  blueprintSceneCount: number;
  blueprintFailedReason: string | null;
  initialBlueprintCompleteBeatCount?: number;
  repairBlueprintCompleteBeatCount?: number;
  partialBeatNormalizationUsed?: boolean;
  missingBeatRepairAttempted?: boolean;
  finalAcceptedBlueprintSceneCount?: number;
  readerProfileSnapshot?: ReaderProfileGenerationSnapshot;
  readerProfileGenerationSnapshot?: ReaderProfileGenerationSnapshot;
  readerProfileInput?: object;
  generationMode: GenerationMode;
  storyId: string;
  seriesId: string;
  sourceStoryId?: string | null;
  parentSeriesId?: string | null;
  continuationContextIncluded: boolean;
  newSeriesCreated: boolean;
  generationTrigger: string;
};
