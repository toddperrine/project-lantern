import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";
import { generateFallbackStory } from "@/lib/fallback-generator";
import { generateOpenAIStoryWithLongFloor } from "@/lib/long-floor-generator";
import { getOpenAIDiagnostics, hasOpenAIKey } from "@/lib/openai-generator";
import { formatStoryCraftGuidance } from "@/lib/story-craft";
import {
  CHARACTER_ARCS,
  ENDING_TYPES,
  GENRE_PRESETS,
  LENGTH_TARGETS,
  NARRATIVE_ARCHITECTURES
} from "@/lib/types";
import type { FirstPageOpening, GenerateStoryRequest, GenerateStoryResponse } from "@/lib/types";

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

  const generationMode = body.generationMode ?? "story";
  const input = {
    generationMode,
    selectedOpening: normalizeSelectedOpening(body.selectedOpening),
    selectedOpeningIndex: typeof body.selectedOpeningIndex === "number" ? body.selectedOpeningIndex : undefined,
    openingCount: typeof body.openingCount === "number" ? body.openingCount : undefined,
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

  if (generationMode === "firstPageOpenings") {
    return NextResponse.json({
      openings: buildFallbackFirstPageOpenings(input),
      diagnostics: {
        firstPageTest: true,
        openingCount: 3,
        generationPath: "firstPageOpenings",
        usedSelectedOpeningSeed: false
      }
    });
  }

  const storyInput = generationMode === "fullStoryFromOpening" ? buildFullStoryFromOpeningInput(input) : input;

  if (!hasOpenAIKey()) {
    return NextResponse.json(
      withServerGenerationDuration(
        generateFallbackStory(
          storyInput,
          getOpenAIDiagnostics({
            fallbackReason: "OPENAI_API_KEY is missing or empty in this deployment environment.",
            genrePreset: storyInput.genrePreset,
            narrativeArchitecture: storyInput.narrativeArchitecture,
            characterArc: storyInput.characterArc,
            endingType: storyInput.endingType,
            lengthTarget: formatLengthTarget(storyInput.lengthTarget),
            ...buildFirstPageDiagnostics(input, generationMode)
          })
        ),
        generationStartedAt
      )
    );
  }

  try {
    return NextResponse.json(withServerGenerationDuration(withFirstPageDiagnostics(await generateOpenAIStoryWithLongFloor(storyInput), input, generationMode), generationStartedAt));
  } catch (error) {
    const errorSummary = summarizeOpenAIError(error);

    if (isBlueprintGenerationFailure(errorSummary)) {
      try {
        const repairedResponse = await generateOpenAIStoryWithLongFloor(buildBlueprintRepairRetryInput(storyInput, errorSummary));
        return NextResponse.json(
          withServerGenerationDuration(
            withFirstPageDiagnostics(withBlueprintRepairSuccessDiagnostics(repairedResponse, errorSummary), input, generationMode),
            generationStartedAt
          )
        );
      } catch (repairError) {
        const repairSummary = summarizeOpenAIError(repairError);
        return NextResponse.json(
          withServerGenerationDuration(
            withFirstPageDiagnostics(buildOpenAIFallbackResponse(storyInput, `OpenAI request failed: ${errorSummary}. Blueprint repair retry failed: ${repairSummary}`, `${errorSummary}; repair retry: ${repairSummary}`), input, generationMode),
            generationStartedAt
          )
        );
      }
    }

    return NextResponse.json(
      withServerGenerationDuration(
        withFirstPageDiagnostics(buildOpenAIFallbackResponse(storyInput, `OpenAI request failed: ${errorSummary}`, errorSummary.startsWith("Blueprint generation failed") ? errorSummary : null), input, generationMode),
        generationStartedAt
      )
    );
  }
}

function normalizeSelectedOpening(value: unknown): FirstPageOpening | undefined {
  const candidate = value as Partial<FirstPageOpening> | undefined;
  if (!candidate || typeof candidate !== "object") return undefined;
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
  const toneLabel = typeof candidate.toneLabel === "string" ? candidate.toneLabel.trim() : "";
  const openingText = typeof candidate.openingText === "string" ? candidate.openingText.trim() : "";
  return title && openingText ? { title, toneLabel: toneLabel || "Selected opening", openingText } : undefined;
}

function buildFallbackFirstPageOpenings(input: GenerateStoryRequest): FirstPageOpening[] {
  const seed = input.storySeed.replace(/\s+/g, " ").trim();
  const world = input.worldBible.split(/[.\n]/).find(Boolean)?.trim() || "a place that has started keeping secrets";
  const cast = input.characterProfiles.split(/[.\n-]/).map((part) => part.trim()).filter(Boolean);
  const hero = cast[0]?.replace(/[:].*$/, "") || "the reader's next hero";
  const vectors = [
    { title: "A Door That Waited", toneLabel: "Quiet wonder / mystery", image: `${hero} noticed the impossible detail first: ${world.toLowerCase()} had left one door unlocked that had never been a door before.` },
    { title: "Someone Saved a Seat", toneLabel: "Warmth / companionship", image: `By sunset, ${hero} found a handwritten place card beside a cup still warm enough to fog the window, though no one in ${world.toLowerCase()} admitted setting the table.` },
    { title: "The Map Moved First", toneLabel: "Adventure / discovery", image: `The map buckled in ${hero}'s hands and redrew the road away from safety, toward the one landmark the old stories warned everyone to avoid.` }
  ];

  return vectors.map((vector, index) => ({
    title: vector.title,
    toneLabel: vector.toneLabel,
    openingText: `${vector.image}\n\n${seed ? `The story spark kept pressing at the edge of the moment: ${seed}` : "Something in the air wanted a choice before it would explain itself."}\n\nThis version asks whether ${hero} will follow the feeling before the facts are ready.`
  }));
}

function buildFullStoryFromOpeningInput(input: GenerateStoryRequest): GenerateStoryRequest {
  if (!input.selectedOpening) return input;
  return {
    ...input,
    storySeed: `Required starting seed: Continue naturally from this selected First Page Test opening. Do not restart, contradict, or replace it.\n\nTitle/hook: ${input.selectedOpening.title}\nTone/fit: ${input.selectedOpening.toneLabel}\nOpening prose to preserve and continue from:\n${input.selectedOpening.openingText}\n\nOriginal story spark/context:\n${input.storySeed}`,
    storyRules: `${input.storyRules}\n\nFirst Page Test continuation rule: The final story must begin from and continue the selected opening above as the seed. It may lightly smooth transitions, but it must not ignore, restart, or contradict that opening.`
  };
}

function buildFirstPageDiagnostics(input: GenerateStoryRequest, generationMode: GenerateStoryRequest["generationMode"]) {
  const isFirstPageFinal = generationMode === "fullStoryFromOpening";
  return {
    firstPageTest: isFirstPageFinal,
    openingCount: input.openingCount ?? (isFirstPageFinal ? 3 : undefined),
    selectedOpeningIndex: input.selectedOpeningIndex,
    selectedOpeningToneLabel: input.selectedOpening?.toneLabel,
    selectedOpeningTitle: input.selectedOpening?.title,
    generationPath: generationMode ?? "story",
    usedSelectedOpeningSeed: Boolean(isFirstPageFinal && input.selectedOpening?.openingText)
  };
}

function withFirstPageDiagnostics(response: GenerateStoryResponse, input: GenerateStoryRequest, generationMode: GenerateStoryRequest["generationMode"]): GenerateStoryResponse {
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        ...buildFirstPageDiagnostics(input, generationMode)
      }
    }
  };
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
