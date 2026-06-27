export type GenerationMode = "new_story" | "continue_series" | "rewrite_retry";

export type GenerationIdentity = {
  generationMode: GenerationMode;
  storyId: string;
  seriesId: string;
  parentSeriesId?: string | null;
  sourceStoryId?: string | null;
  createdAt: string;
};

function createId(): string {
  return crypto.randomUUID();
}

export function createGenerationIdentity(args: {
  generationMode: GenerationMode;
  activeStoryId?: string | null;
  activeSeriesId?: string | null;
  selectedSeriesId?: string | null;
  sourceStoryId?: string | null;
}): GenerationIdentity {
  const createdAt = new Date().toISOString();

  if (args.generationMode === "new_story") {
    return {
      generationMode: "new_story",
      storyId: createId(),
      seriesId: createId(),
      parentSeriesId: null,
      sourceStoryId: args.sourceStoryId ?? null,
      createdAt,
    };
  }

  if (args.generationMode === "continue_series") {
    const seriesId = args.selectedSeriesId ?? args.activeSeriesId;
    if (!seriesId) {
      throw new Error("continue_series requires selectedSeriesId or activeSeriesId");
    }

    return {
      generationMode: "continue_series",
      storyId: createId(),
      seriesId,
      parentSeriesId: seriesId,
      sourceStoryId: args.sourceStoryId ?? args.activeStoryId ?? null,
      createdAt,
    };
  }

  if (args.generationMode === "rewrite_retry") {
    if (!args.activeSeriesId) {
      throw new Error("rewrite_retry requires activeSeriesId");
    }

    return {
      generationMode: "rewrite_retry",
      storyId: createId(),
      seriesId: args.activeSeriesId,
      parentSeriesId: args.activeSeriesId,
      sourceStoryId: args.sourceStoryId ?? args.activeStoryId ?? null,
      createdAt,
    };
  }

  throw new Error("Unknown generation mode");
}
