import { NextResponse } from "next/server";
import { getBuildInfo } from "@/lib/build-info";
import { CLEAN_GENERATION_FAILURE_MESSAGE } from "@/lib/generation-display-policy";
import { createGenerationIdentity } from "@/lib/generation-identity";
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
  try {
    return await handleGenerateRequest(request);
  } catch (error) {
    const message = summarizeOpenAIError(error);
    console.error("Unhandled /api/generate failure", message);
    const userMessage = message.includes("Fallback rejected for metadata leak") ? CLEAN_GENERATION_FAILURE_MESSAGE : "Story generation failed before a response could be completed.";
    return NextResponse.json({ error: userMessage, diagnostic: { message } }, { status: 500 });
  }
}

async function handleGenerateRequest(request: Request) {
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
  const readerProfileGenerationSnapshot = normalizeReaderProfileGenerationSnapshot(body.readerProfileGenerationSnapshot);

  const input = {
    worldBible: body.worldBible!.trim(),
    characterProfiles: body.characterProfiles!.trim(),
    storySeed: body.storySeed!.trim(),
    storyRules: buildStoryRules(body.storyRules, readerMood, body.personalizationContext),
    genrePreset: body.genrePreset!,
    selectedStoryTypeChipId: normalizeOptionalString(body.selectedStoryTypeChipId),
    selectedStoryTypeChipLabel: normalizeOptionalString(body.selectedStoryTypeChipLabel),
    legacyGenrePreset: body.legacyGenrePreset,
    storyTypeSelectionMode: normalizeOptionalString(body.storyTypeSelectionMode),
    storySeedSource: normalizeOptionalString(body.storySeedSource),
    selectedStoryTypeGuidance: normalizeOptionalString(body.selectedStoryTypeGuidance),
    selectedStoryTypeKeywords: Array.isArray(body.selectedStoryTypeKeywords) ? body.selectedStoryTypeKeywords.filter((keyword): keyword is string => typeof keyword === "string" && Boolean(keyword.trim())).map((keyword) => keyword.trim()) : undefined,
    narrativeArchitecture: body.narrativeArchitecture!,
    characterArc: body.characterArc!,
    endingType: body.endingType!,
    lengthTarget: body.lengthTarget!,
    generationMode: body.generationMode!,
    generationIdentity: createGenerationIdentity({
      generationMode: body.generationMode!,
      activeStoryId: typeof body.generationIdentity?.sourceStoryId === "string" ? body.generationIdentity.sourceStoryId : null,
      activeSeriesId: typeof body.generationIdentity?.seriesId === "string" ? body.generationIdentity.seriesId : null,
      selectedSeriesId: typeof body.generationIdentity?.seriesId === "string" ? body.generationIdentity.seriesId : null,
      sourceStoryId: typeof body.generationIdentity?.sourceStoryId === "string" ? body.generationIdentity.sourceStoryId : null
    }),
    continuationContextIncluded: Boolean(body.continuationContextIncluded),
    generationTrigger: body.generationTrigger!,
    readerMood,
    personalizationContext: body.personalizationContext?.trim() || undefined,
    readerProfileGenerationSnapshot
  } satisfies GenerateStoryRequest;

  if (!hasOpenAIKey()) {
    return buildGenerationFailureResponse(input, generationStartedAt, {
      fallbackReason: "Model generation is unavailable in this environment.",
      modelGenerationAttempted: false,
      modelGenerationErrorType: "missing_env"
    });
  }

  try {
    return NextResponse.json(withServerGenerationDuration(withReaderProfileGenerationSnapshot(await generateOpenAIStoryWithLongFloor(input), input.readerProfileGenerationSnapshot), generationStartedAt));
  } catch (error) {
    const errorSummary = summarizeOpenAIError(error);

    if (isBlueprintGenerationFailure(errorSummary)) {
      try {
        const repairedResponse = await generateOpenAIStoryWithLongFloor(buildBlueprintRepairRetryInput(input, errorSummary));
        return NextResponse.json(
          withServerGenerationDuration(
            withReaderProfileGenerationSnapshot(withBlueprintRepairSuccessDiagnostics(repairedResponse, errorSummary), input.readerProfileGenerationSnapshot),
            generationStartedAt
          )
        );
      } catch (repairError) {
        const repairSummary = summarizeOpenAIError(repairError);
        return buildGenerationFailureResponse(input, generationStartedAt, {
          fallbackReason: `Model generation failed after blueprint repair retry.`,
          modelGenerationAttempted: true,
          modelGenerationErrorType: classifyGenerationError(repairSummary),
          repairAttempted: true,
          blueprintFailedReason: `${errorSummary}; repair retry: ${repairSummary}`
        });
      }
    }

    return buildGenerationFailureResponse(input, generationStartedAt, {
      fallbackReason: "Model generation failed before a clean episode could be created.",
      modelGenerationAttempted: true,
      modelGenerationErrorType: classifyGenerationError(errorSummary),
      repairAttempted: isBlueprintGenerationFailure(errorSummary),
      blueprintFailedReason: errorSummary.startsWith("Blueprint generation failed") ? errorSummary : null
    });
  }
}

function withReaderProfileGenerationSnapshot(
  response: GenerateStoryResponse,
  readerProfileGenerationSnapshot: GenerateStoryRequest["readerProfileGenerationSnapshot"]
): GenerateStoryResponse {
  if (!readerProfileGenerationSnapshot) return response;

  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        readerProfileSnapshot: readerProfileGenerationSnapshot,
        readerProfileGenerationSnapshot
      }
    }
  };
}

function normalizeReaderProfileGenerationSnapshot(
  snapshot: Partial<GenerateStoryRequest>["readerProfileGenerationSnapshot"]
): GenerateStoryRequest["readerProfileGenerationSnapshot"] {
  if (!snapshot || typeof snapshot !== "object") return undefined;

  const mode = snapshot.mode === "new-story" || snapshot.mode === "continue-story" ? snapshot.mode : "unknown";
  const profileSourceUsed = ["local", "cloud", "default", "none"].includes(snapshot.profileSourceUsed ?? "")
    ? snapshot.profileSourceUsed!
    : "none";
  const profileConfidence = ["low", "medium", "high", "unavailable"].includes(snapshot.profileConfidence ?? "")
    ? snapshot.profileConfidence!
    : "unavailable";

  return {
    mode,
    profileUsed: Boolean(snapshot.profileUsed),
    profileSourceUsed,
    profileUpdatedAt: normalizeDiagnosticString(snapshot.profileUpdatedAt),
    profileConfidence,
    tasteProfilePresent: Boolean(snapshot.tasteProfilePresent),
    tasteProfileSource: normalizeDiagnosticString(snapshot.tasteProfileSource),
    tasteProfileUpdatedAt: normalizeDiagnosticString(snapshot.tasteProfileUpdatedAt),
    feedbackSignalCount: Math.max(0, Number(snapshot.feedbackSignalCount) || 0),
    feedbackIncluded: Boolean(snapshot.feedbackIncluded),
    latestFeedbackRating: normalizeDiagnosticString(snapshot.latestFeedbackRating),
    userHardAvoidanceCount: Math.max(0, Number(snapshot.userHardAvoidanceCount) || 0),
    userHardAvoidancesSummary: normalizeDiagnosticString(snapshot.userHardAvoidancesSummary),
    defaultSafetyGuardrailCount: Math.max(0, Number(snapshot.defaultSafetyGuardrailCount) || 0),
    defaultSafetyGuardrailsSummary: normalizeDiagnosticString(snapshot.defaultSafetyGuardrailsSummary),
    moodSignal: normalizeDiagnosticString(snapshot.moodSignal),
    genreSignal: normalizeDiagnosticString(snapshot.genreSignal),
    canonicalReaderProfileUsed: Boolean(snapshot.canonicalReaderProfileUsed),
    canonicalReaderProfileInput: snapshot.canonicalReaderProfileInput && typeof snapshot.canonicalReaderProfileInput === "object" ? snapshot.canonicalReaderProfileInput : undefined,
    generatedAt: normalizeDiagnosticString(snapshot.generatedAt) || new Date().toISOString()
  };
}

function normalizeDiagnosticString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
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
        buildTimestamp: buildInfo.buildTimestamp,
        readerProfileSnapshot: response.metadata.diagnostics.readerProfileSnapshot ?? response.metadata.diagnostics.readerProfileGenerationSnapshot,
        readerProfileGenerationSnapshot: response.metadata.diagnostics.readerProfileGenerationSnapshot,
        ...buildGenerationIdentityDiagnostics(response.metadata.diagnostics)
      }
    }
  };
}

function buildGenerationFailureResponse(
  input: GenerateStoryRequest,
  generationStartedAt: Date,
  options: {
    fallbackReason: string;
    modelGenerationAttempted: boolean;
    modelGenerationErrorType: string;
    repairAttempted?: boolean;
    blueprintFailedReason?: string | null;
  }
) {
  console.error("Story generation failed; deterministic fallback blocked from user display.", {
    fallbackReason: options.fallbackReason,
    modelGenerationAttempted: options.modelGenerationAttempted,
    modelGenerationErrorType: options.modelGenerationErrorType,
    repairAttempted: Boolean(options.repairAttempted)
  });

  const diagnostics = getOpenAIDiagnostics({
    openAIRequestAttempted: options.modelGenerationAttempted,
    openAIRequestSucceeded: false,
    fallbackReason: options.fallbackReason,
    genrePreset: input.genrePreset,
    narrativeArchitecture: input.narrativeArchitecture,
    characterArc: input.characterArc,
    endingType: input.endingType,
    lengthTarget: formatLengthTarget(input.lengthTarget),
    ...buildRequestGenerationDiagnostics(input),
    timedOutEarly: false,
    stoppedReason: "openai-error",
    blueprintGenerated: false,
    blueprintSceneCount: 0,
    blueprintFailedReason: options.blueprintFailedReason ?? null,
    generationSource: "fallback",
    fallbackUsed: true,
    fallbackRejectedForUserDisplay: true,
    fallbackUserDisplayBlocked: true,
    modelGenerationAttempted: options.modelGenerationAttempted,
    modelGenerationSucceeded: false,
    modelGenerationErrorType: options.modelGenerationErrorType,
    repairAttempted: Boolean(options.repairAttempted),
    repairSucceeded: false,
    metadataLeakGuardTriggered: false
  });

  const buildInfo = getBuildInfo();
  const generationFinishedAt = new Date();
  const serverGenerationDurationSeconds = Math.max(
    0,
    Math.round((generationFinishedAt.getTime() - generationStartedAt.getTime()) / 1000)
  );

  return NextResponse.json({
    error: CLEAN_GENERATION_FAILURE_MESSAGE,
    diagnostic: {
      ...diagnostics,
      serverGenerationDurationSeconds,
      appVersion: buildInfo.appVersion,
      buildEnvironment: buildInfo.buildEnvironment,
      gitBranch: buildInfo.gitBranch,
      commitSha: buildInfo.commitSha,
      buildTimestamp: buildInfo.buildTimestamp,
      readerProfileSnapshot: input.readerProfileGenerationSnapshot,
      readerProfileGenerationSnapshot: input.readerProfileGenerationSnapshot,
      ...buildGenerationIdentityDiagnostics(diagnostics)
    }
  }, { status: 502 });
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

  if (!body.generationMode || !["new_story", "continue_series", "rewrite_retry"].includes(body.generationMode)) {
    return "Generation mode is required.";
  }

  if (!body.generationIdentity || body.generationIdentity.generationMode !== body.generationMode) {
    return "Generation identity is required and must match generation mode.";
  }

  if (!body.generationTrigger) {
    return "Generation trigger is required.";
  }

  const readerMoodPrompt = formatReaderMoodForPrompt(body.readerMood);
  const contextLength =
    body.worldBible.length +
    body.characterProfiles.length +
    body.storySeed.length +
    (body.storyRules?.length ?? 0) +
    (body.personalizationContext?.length ?? 0) +
    formatStoryCraftGuidance().length +
    readerMoodPrompt.length;
  if (contextLength > MAX_CONTEXT_CHARS) {
    return "The uploaded context is too large for this local MVP. Please shorten the files and try again.";
  }

  return null;
}

function buildRequestGenerationDiagnostics(input: GenerateStoryRequest): Pick<GenerateStoryResponse["metadata"]["diagnostics"], "generationMode" | "storyId" | "seriesId" | "sourceStoryId" | "parentSeriesId" | "continuationContextIncluded" | "newSeriesCreated" | "generationTrigger" | "selectedStoryTypeChipId" | "selectedStoryTypeChipLabel" | "legacyGenrePreset" | "storyTypeSelectionMode" | "storySeedSource"> {
  return {
    generationMode: input.generationIdentity.generationMode,
    storyId: input.generationIdentity.storyId,
    seriesId: input.generationIdentity.seriesId,
    sourceStoryId: input.generationIdentity.sourceStoryId ?? null,
    parentSeriesId: input.generationIdentity.parentSeriesId ?? null,
    continuationContextIncluded: input.continuationContextIncluded,
    newSeriesCreated: input.generationMode === "new_story",
    generationTrigger: input.generationTrigger,
    selectedStoryTypeChipId: input.selectedStoryTypeChipId,
    selectedStoryTypeChipLabel: input.selectedStoryTypeChipLabel,
    legacyGenrePreset: input.legacyGenrePreset,
    storyTypeSelectionMode: input.storyTypeSelectionMode,
    storySeedSource: input.storySeedSource
  };
}

function buildGenerationIdentityDiagnostics(diagnostics: GenerateStoryResponse["metadata"]["diagnostics"]) {
  return {
    generationMode: diagnostics.generationMode,
    storyId: diagnostics.storyId,
    seriesId: diagnostics.seriesId,
    sourceStoryId: diagnostics.sourceStoryId ?? null,
    parentSeriesId: diagnostics.parentSeriesId ?? null,
    continuationContextIncluded: diagnostics.continuationContextIncluded,
    newSeriesCreated: diagnostics.newSeriesCreated,
    generationTrigger: diagnostics.generationTrigger
  };
}

function buildStoryRules(storyRules: string | undefined, readerMood: GenerateStoryRequest["readerMood"] = null, personalizationContext?: string): string {
  const baseRules = storyRules?.trim() || DEFAULT_STORY_RULES;
  const readerMoodGuidance = formatReaderMoodForPrompt(readerMood);
  const controlledPersonalization = personalizationContext?.trim() || "";

  return [baseRules, formatStoryCraftGuidance(), readerMoodGuidance, controlledPersonalization].filter(Boolean).join("\n\n");
}
function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function summarizeOpenAIError(error: unknown): string {
  if (error instanceof Error) {
    return redactSecretLikeText(error.message);
  }

  return "Unknown error";
}

function classifyGenerationError(errorSummary: string): string {
  const normalized = errorSummary.toLowerCase();
  if (normalized.includes("api key") || normalized.includes("missing") || normalized.includes("environment")) return "missing_env";
  if (normalized.includes("timeout") || normalized.includes("timed out")) return "timeout";
  if (normalized.includes("blueprint")) return "blueprint_validation";
  if (normalized.includes("metadata") || normalized.includes("leak")) return "metadata_leak_guard";
  if (normalized.includes("parse") || normalized.includes("json")) return "parse_error";
  return "model_error";
}

function redactSecretLikeText(value: string): string {
  return value.replace(/sk-[A-Za-z0-9_-]+/g, "sk-...[redacted]");
}

function formatLengthTarget(lengthTarget: GenerateStoryRequest["lengthTarget"]): string {
  const target = LENGTH_TARGETS.find((candidate) => candidate.value === lengthTarget) ?? LENGTH_TARGETS[1];
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}
