import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";
import { generateFallbackStory } from "@/lib/fallback-generator";
import { generateOpenAIStoryWithLongFloor } from "@/lib/long-floor-generator";
import { getOpenAIDiagnostics, hasOpenAIKey } from "@/lib/openai-generator";
import { formatReaderMoodForPrompt, isReaderMoodSnapshot } from "@/lib/reader-profile";
import { formatStoryCraftGuidance } from "@/lib/story-craft";
import {
  CHARACTER_ARCS,
  ENDING_TYPES,
  GENRE_PRESETS,
  LENGTH_TARGETS,
  NARRATIVE_ARCHITECTURES
} from "@/lib/types";
import type { GenerateStoryRequest, GenerateStoryResponse } from "@/lib/types";

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
  const generationStartedAt = new Date();
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

  const readerMood = isReaderMoodSnapshot(body.readerMood) ? body.readerMood : null;

  const input = {
    worldBible: body.worldBible!.trim(),
    characterProfiles: body.characterProfiles!.trim(),
    storySeed: body.storySeed!.trim(),
    storyRules: buildStoryRules(body.storyRules, readerMood),
    genrePreset: body.genrePreset!,
    narrativeArchitecture: body.narrativeArchitecture!,
    characterArc: body.characterArc!,
    endingType: body.endingType!,
    lengthTarget: body.lengthTarget!,
    readerMood
  } satisfies GenerateStoryRequest;

  if (!hasOpenAIKey()) {
    return NextResponse.json(
      withServerGenerationDuration(
        generateFallbackStory(
          input,
          getOpenAIDiagnostics({
            fallbackReason: "OPENAI_API_KEY is missing or empty in this deployment environment.",
            genrePreset: input.genrePreset,
            narrativeArchitecture: input.narrativeArchitecture,
            characterArc: input.characterArc,
            endingType: input.endingType,
            lengthTarget: formatLengthTarget(input.lengthTarget)
          })
        ),
        generationStartedAt
      )
    );
  }

  try {
    return NextResponse.json(withServerGenerationDuration(await generateOpenAIStoryWithLongFloor(input), generationStartedAt));
  } catch (error) {
    const errorSummary = summarizeOpenAIError(error);

    if (isBlueprintGenerationFailure(errorSummary)) {
      try {
        const repairedResponse = await generateOpenAIStoryWithLongFloor(buildBlueprintRepairRetryInput(input, errorSummary));
        return NextResponse.json(
          withServerGenerationDuration(
            withBlueprintRepairSuccessDiagnostics(repairedResponse, errorSummary),
            generationStartedAt
          )
        );
      } catch (repairError) {
        const repairSummary = summarizeOpenAIError(repairError);
        return NextResponse.json(
          withServerGenerationDuration(
            buildOpenAIFallbackResponse(input, `OpenAI request failed: ${errorSummary}. Blueprint repair retry failed: ${repairSummary}`, `${errorSummary}; repair retry: ${repairSummary}`),
            generationStartedAt
          )
        );
      }
    }

    return NextResponse.json(
      withServerGenerationDuration(
        buildOpenAIFallbackResponse(input, `OpenAI request failed: ${errorSummary}`, errorSummary.startsWith("Blueprint generation failed") ? errorSummary : null),
        generationStartedAt
      )
    );
  }
}

function withServerGenerationDuration(
  response: GenerateStoryResponse,
  generationStartedAt: Date
): GenerateStoryResponse {
  const generationFinishedAt = new Date();
  const serverGenerationDurationSeconds = Math.max(
    0,
    Math.round((generationFinishedAt.getTime() - generationStartedAt.getTime()) / 1000)
  );
  const buildInfo = getBuildInfo();

  return {
    ...response,
    metadata: {
      ...response.metadata,
      serverGenerationDurationSeconds,
      appVersion: buildInfo.appVersion,
      buildEnvironment: buildInfo.buildEnvironment,
      gitBranch: buildInfo.gitBranch,
      commitSha: buildInfo.commitSha,
      buildTimestamp: buildInfo.buildTimestamp,
      diagnostics: {
        ...response.metadata.diagnostics,
        serverGenerationDurationSeconds,
        appVersion: buildInfo.appVersion,
        buildEnvironment: buildInfo.buildEnvironment,
        gitBranch: buildInfo.gitBranch,
        commitSha: buildInfo.commitSha,
        buildTimestamp: buildInfo.buildTimestamp
      }
    }
  };
}

function buildOpenAIFallbackResponse(input: GenerateStoryRequest, fallbackReason: string, blueprintFailedReason: string | null): GenerateStoryResponse {
  console.error("OpenAI story generation failed; using deterministic fallback.", fallbackReason);
  return generateFallbackStory(
    input,
    getOpenAIDiagnostics({
      openAIRequestAttempted: true,
      fallbackReason,
      genrePreset: input.genrePreset,
      narrativeArchitecture: input.narrativeArchitecture,
      characterArc: input.characterArc,
      endingType: input.endingType,
      lengthTarget: formatLengthTarget(input.lengthTarget),
      timedOutEarly: false,
      stoppedReason: "openai-error",
      blueprintGenerated: false,
      blueprintSceneCount: 0,
      blueprintFailedReason
    })
  );
}

function withBlueprintRepairSuccessDiagnostics(response: GenerateStoryResponse, originalBlueprintFailure: string): GenerateStoryResponse {
  const notice = `Blueprint repair retry succeeded after initial blueprint failure: ${originalBlueprintFailure}`;
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        notice,
        blueprintFailedReason: originalBlueprintFailure
      }
    }
  };
}

function buildBlueprintRepairRetryInput(input: GenerateStoryRequest, previousError: string): GenerateStoryRequest {
  return {
    ...input,
    storyRules: `${input.storyRules}\n\nBlueprint repair retry instructions:\nThe previous OpenAI blueprint failed validation: ${previousError}\nReturn a corrected blueprint before drafting the story. Preserve the original Story Spark, world, cast, genre, narrative architecture, character arc, ending type, length target, and premise requirements. For ${formatLengthTarget(input.lengthTarget)}, the blueprint must include the required number of complete sceneBeats. Every sceneBeat must include location, activeCharacters, concreteAction, newInformation, conflictOrObstacle, irreversibleTurn, consequence, sensoryAnchor, characterPressure, characterStake, and materialConsequence. Do not reduce, summarize, or omit required beats.`
  };
}

function isBlueprintGenerationFailure(errorSummary: string): boolean {
  return errorSummary.startsWith("Blueprint generation failed");
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

  if (!body.genrePreset || !GENRE_PRESETS.includes(body.genrePreset)) {
    return "Choose a valid genre preset.";
  }

  if (!body.narrativeArchitecture || !NARRATIVE_ARCHITECTURES.includes(body.narrativeArchitecture)) {
    return "Choose a valid narrative architecture.";
  }

  if (!body.characterArc || !CHARACTER_ARCS.includes(body.characterArc)) {
    return "Choose a valid character arc.";
  }

  if (!body.endingType || !ENDING_TYPES.includes(body.endingType)) {
    return "Choose a valid ending type.";
  }

  if (!body.lengthTarget || !LENGTH_TARGETS.some((target) => target.value === body.lengthTarget)) {
    return "Choose a valid length target.";
  }

  const readerMoodPrompt = formatReaderMoodForPrompt(body.readerMood);
  const contextLength =
    body.worldBible.length +
    body.characterProfiles.length +
    body.storySeed.length +
    (body.storyRules?.length ?? 0) +
    formatStoryCraftGuidance().length +
    readerMoodPrompt.length;
  if (contextLength > MAX_CONTEXT_CHARS) {
    return "The uploaded context is too large for this local MVP. Please shorten the files and try again.";
  }

  return null;
}

function buildStoryRules(storyRules: string | undefined, readerMood: GenerateStoryRequest["readerMood"] = null): string {
  const baseRules = storyRules?.trim() || DEFAULT_STORY_RULES;
  const readerMoodGuidance = formatReaderMoodForPrompt(readerMood);

  return [baseRules, formatStoryCraftGuidance(), readerMoodGuidance].filter(Boolean).join("\n\n");
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

function formatLengthTarget(lengthTarget: GenerateStoryRequest["lengthTarget"]): string {
  const target = LENGTH_TARGETS.find((candidate) => candidate.value === lengthTarget) ?? LENGTH_TARGETS[1];
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}
