export type StoryGenerationRequest = {
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
};

export type StoryGenerationResponse = {
  story: string;
  metadata: {
    wordCount: number;
    charactersUsed: string[];
    rulesReferenced: string[];
  };
};
