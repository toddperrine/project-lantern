import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";
import { generateFallbackStory } from "@/lib/fallback-generator";
import { generateOpenAIStory, getOpenAIDiagnostics, hasOpenAIKey } from "@/lib/openai-generator";
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

  const input = {
    worldBible: body.worldBible!.trim(),
    characterProfiles: body.characterProfiles!.trim(),
    storySeed: body.storySeed!.trim(),
    storyRules: buildStoryRules(body.storyRules),
    genrePreset: body.genrePreset!,
    narrativeArchitecture: body.narrativeArchitecture!,
    characterArc: body.characterArc!,
    endingType: body.endingType!,
    lengthTarget: body.lengthTarget!
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
    return NextResponse.json(withServerGenerationDuration(await generateOpenAIStory(input), generationStartedAt));
  } catch (error) {
    const errorSummary = summarizeOpenAIError(error);
    const fallbackReason = `OpenAI request failed: ${errorSummary}`;
    console.error("OpenAI story generation failed; using deterministic fallback.", fallbackReason);
    return NextResponse.json(
      withServerGenerationDuration(
        generateFallbackStory(
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
            blueprintFailedReason: errorSummary.startsWith("Blueprint generation failed") ? errorSummary : null
          })
        ),
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

  const contextLength =
    body.worldBible.length + body.characterProfiles.length + body.storySeed.length + (body.storyRules?.length ?? 0) + formatStoryCraftGuidance().length;
  if (contextLength > MAX_CONTEXT_CHARS) {
    return "The uploaded context is too large for this local MVP. Please shorten the files and try again.";
  }

  return null;
}

function buildStoryRules(storyRules: string | undefined): string {
  const baseRules = storyRules?.trim() || DEFAULT_STORY_RULES;
  return `${baseRules}\n\n${formatStoryCraftGuidance()}`;
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
