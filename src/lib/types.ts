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
  { value: "Compact", label: "Compact: 1500-2500 words", minWords: 1500, maxWords: 2500 },
  { value: "Standard", label: "Standard: 2500-3500 words", minWords: 2500, maxWords: 3500 },
  { value: "Long", label: "Long: 3500-5000 words", minWords: 3500, maxWords: 5000 }
] as const;

export type GenrePreset = (typeof GENRE_PRESETS)[number];
export type NarrativeArchitecture = (typeof NARRATIVE_ARCHITECTURES)[number];
export type CharacterArc = (typeof CHARACTER_ARCS)[number];
export type EndingType = (typeof ENDING_TYPES)[number];
export type LengthTarget = (typeof LENGTH_TARGETS)[number]["value"];

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
};

export type StoryMetadata = {
  wordCount: number;
  charactersUsed: string[];
  rulesReferenced: string[];
  source: "openai" | "fallback";
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
  openAIRequestAttempted: boolean;
  openAIRequestSucceeded: boolean;
  fallbackReason: string | null;
  notice: string | null;
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: string;
  finalWordCount: number;
  expansionAttempted: boolean;
  expansionSucceeded: boolean;
  underTargetNotice: string | null;
  blueprintGenerated: boolean;
  blueprintSceneCount: number;
  blueprintFailedReason: string | null;
};
