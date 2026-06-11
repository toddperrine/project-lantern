import { NextResponse } from "next/server";
import { generateFallbackStory } from "@/lib/fallback-generator";
import { generateOpenAIStory, getOpenAIDiagnostics, hasOpenAIKey } from "@/lib/openai-generator";
import type { GenerateStoryRequest } from "@/lib/types";

const MAX_CONTEXT_CHARS = 120_000;
const DEFAULT_STORY_RULES = `Every story must obey these rules:
1. Begin in-scene with concrete action, setting, or dialogue.
2. Do not summarize the premise.
3. Do not explain the world or simulation.
4. Let world rules emerge through consequence, behavior, dialogue, and conflict.
5. At least two belief systems must collide.
6. Nobody is completely right and nobody is completely wrong.
7. Character decisions matter more than plot mechanics.
8. The central event should resolve.
9. The emotional or thematic question should remain alive.
10. End with transformation, not victory.
11. Avoid generic closing abstractions.`;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    storySeed: body.storySeed!.trim(),
    storyRules: body.storyRules?.trim() || DEFAULT_STORY_RULES
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
    const fallbackReason = `OpenAI request failed: ${summarizeOpenAIError(error)}`;
    console.error("OpenAI story generation failed; using deterministic fallback.", fallbackReason);
    return NextResponse.json(
      generateFallbackStory(
        input,
        getOpenAIDiagnostics({
          openAIRequestAttempted: true,
          fallbackReason
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
    return "Upload a story seed before generating a story.";
  }

  const contextLength =
    body.worldBible.length + body.characterProfiles.length + body.storySeed.length + (body.storyRules?.length ?? 0);
  if (contextLength > MAX_CONTEXT_CHARS) {
    return "The uploaded context is too large for this local MVP. Please shorten the files and try again.";
  }

  return null;
}

function summarizeOpenAIError(error: unknown): string {
  if (error instanceof Error) {
    return redactSecretLikeText(error.message);
  }

  return "Unknown error";
}

function redactSecretLikeText(value: string): string {
  return value.replace(/sk-[A-Za-z0-9_-]+/g, "sk-...[redacted]");
}
