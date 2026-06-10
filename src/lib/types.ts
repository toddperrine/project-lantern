export type GenerateStoryRequest = {
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
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
};
