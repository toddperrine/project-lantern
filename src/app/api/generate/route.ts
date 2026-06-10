import { NextResponse } from "next/server";
import { generateFallbackStory } from "@/lib/fallback-generator";
import { generateOpenAIStory, getOpenAIDiagnostics, hasOpenAIKey } from "@/lib/openai-generator";
import type { GenerateStoryRequest } from "@/lib/types";

const MAX_CONTEXT_CHARS = 120_000;

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Partial<GenerateStoryRequest>;

  try {
    body = (await request.json()) as Partial<GenerateStoryRequest>;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const validationError = validateRequest(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const input = {
    worldBible: body.worldBible!.trim(),
    characterProfiles: body.characterProfiles!.trim(),
    storySeed: body.storySeed!.trim()
  };

  if (!hasOpenAIKey()) {
    return NextResponse.json(
      generateFallbackStory(
        input,
        getOpenAIDiagnostics({
          fallbackReason: "OPENAI_API_KEY is missing or empty in this deployment environment."
        })
      )
    );
  }

  try {
    return NextResponse.json(await generateOpenAIStory(input));
  } catch (error) {
    console.error("OpenAI story generation failed; using deterministic fallback.", error);
    return NextResponse.json(
      generateFallbackStory(
        input,
        getOpenAIDiagnostics({
          openAIRequestAttempted: true,
          fallbackReason: `OpenAI request failed: ${summarizeOpenAIError(error)}`
        })
      )
    );
  }
}

function validateRequest(body: Partial<GenerateStoryRequest>): string | null {
  if (!body.worldBible?.trim()) {
    return "Upload a world bible before generating a story.";
  }

  if (!body.characterProfiles?.trim()) {
    return "Upload character profiles before generating a story.";
  }

  if (!body.storySeed?.trim()) {
    return "Add a story seed before generating a story.";
  }

  const contextLength = body.worldBible.length + body.characterProfiles.length + body.storySeed.length;
  if (contextLength > MAX_CONTEXT_CHARS) {
    return "The uploaded context is too large for this local MVP. Please shorten the files and try again.";
  }

  return null;
}

function summarizeOpenAIError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
