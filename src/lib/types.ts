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
};

export type GenerateStoryResponse = {
  story: string;
  metadata: StoryMetadata;
};
