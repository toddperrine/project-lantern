import type { GenerateStoryResponse } from "@/lib/types";

export const CLEAN_GENERATION_FAILURE_MESSAGE = "Story generation failed before a clean episode could be created. Please try again.";

export function isFallbackGenerationResponse(response: Pick<GenerateStoryResponse, "metadata"> | null | undefined): boolean {
  return response?.metadata?.source === "fallback";
}

export function assertUserDisplayableGenerationResponse(response: GenerateStoryResponse): GenerateStoryResponse {
  if (isFallbackGenerationResponse(response)) {
    throw new Error(CLEAN_GENERATION_FAILURE_MESSAGE);
  }

  return response;
}
