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
import type { GenerateStoryRequest, GenerateStoryResponse, StoryDiagnostics } from "@/lib/types";

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
export const maxDuration = 300;


export async function POST(request: Request) {
  const generationStartedAt = new Date();
  const serverRequestId = getGenerationServerRequestId(request);
  logGenerationLifecycle(serverRequestId, "request_received", { method: request.method });

  try {
    return await handleGenerateRequest(request, generationStartedAt, serverRequestId);
  } catch (error) {
    const message = summarizeOpenAIError(error);
    logGenerationLifecycle(serverRequestId, "unhandled_failure", { message, elapsedSeconds: elapsedSecondsSince(generationStartedAt) }, "error");
    const userMessage = message.includes("Fallback rejected for metadata leak") ? CLEAN_GENERATION_FAILURE_MESSAGE : "Story generation failed before a response could be completed.";
    return NextResponse.json({ error: userMessage, diagnostic: { message, serverRequestId, generationAttemptId: serverRequestId, generationEndpointStatusCode: 500, generationRequestStatus: "failed", serverGenerationDurationSeconds: elapsedSecondsSince(generationStartedAt), timeoutLikeFailure: isTimeoutLikeError(message) } }, { status: 500 });
  }
}

async function handleGenerateRequest(request: Request, generationStartedAt: Date, serverRequestId: string) {
  const authSessionPresent = hasAuthSession(request);
  const authRequiredForGeneration = false;
  let body: Partial<GenerateStoryRequest>;

  try {
    body = (await request.json()) as Partial<GenerateStoryRequest>;
    logGenerationLifecycle(serverRequestId, "payload_parsed", { elapsedSeconds: elapsedSecondsSince(generationStartedAt) });
  } catch {
    logGenerationLifecycle(serverRequestId, "validation_complete", { valid: false, reason: "invalid_json", elapsedSeconds: elapsedSecondsSince(generationStartedAt) }, "warn");
    return buildPayloadFailureResponse("Request body must be valid JSON.", generationStartedAt, authSessionPresent, authRequiredForGeneration, serverRequestId);
  }

  const validationError = validateRequest(body);
  if (validationError) {
    logGenerationLifecycle(serverRequestId, "validation_complete", { valid: false, reason: validationError, elapsedSeconds: elapsedSecondsSince(generationStartedAt) }, "warn");
    return buildPayloadFailureResponse(validationError, generationStartedAt, authSessionPresent, authRequiredForGeneration, serverRequestId);
  }

  logGenerationLifecycle(serverRequestId, "validation_complete", { valid: true, authSessionPresent, elapsedSeconds: elapsedSecondsSince(generationStartedAt) });

  const readerMood = isReaderMoodSnapshot(body.readerMood) ? body.readerMood : null;
  const readerProfileGenerationSnapshot = normalizeReaderProfileGenerationSnapshot(body.readerProfileGenerationSnapshot);

  const input = {
    worldBible: body.worldBible!.trim(),
    characterProfiles: body.characterProfiles!.trim(),
    storySeed: body.storySeed!.trim(),
    storyRules: buildStoryRules(body.storyRules, readerMood, body.personalizationContext, {
      label: body.selectedStoryTypeChipLabel,
      guidance: body.selectedStoryTypeGuidance,
      keywords: body.selectedStoryTypeKeywords
    }),
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
    readerProfileGenerationSnapshot,
    readerProfileInput: body.readerProfileInput && typeof body.readerProfileInput === "object" ? body.readerProfileInput : undefined
  } satisfies GenerateStoryRequest;

  if (!hasOpenAIKey()) {
    logGenerationLifecycle(serverRequestId, "openai_response_failed", { errorType: "missing_env", elapsedSeconds: elapsedSecondsSince(generationStartedAt), timeoutLikeFailure: false }, "error");
    return buildGenerationFailureResponse(input, generationStartedAt, {
      fallbackReason: "Model generation is unavailable in this environment.",
      modelGenerationAttempted: false,
      modelGenerationErrorType: "missing_env",
      authRequiredForGeneration,
      authSessionPresent,
      serverRequestId
    });
  }

  try {
    logGenerationLifecycle(serverRequestId, "openai_request_start", buildSafeInputDiagnostics(input, generationStartedAt));
    const generatedResponse = await generateOpenAIStoryWithLongFloor(input);
    logGenerationLifecycle(serverRequestId, "openai_response_received", { elapsedSeconds: elapsedSecondsSince(generationStartedAt), wordCount: generatedResponse.metadata.wordCount, source: generatedResponse.metadata.source });
    const response = NextResponse.json(withRequestDiagnostics(withServerGenerationDuration(withReaderProfileGenerationSnapshot(generatedResponse, input.readerProfileGenerationSnapshot), generationStartedAt), { authRequiredForGeneration, authSessionPresent, statusCode: 200, serverRequestId }));
    logGenerationLifecycle(serverRequestId, "final_response_returned", { statusCode: 200, elapsedSeconds: elapsedSecondsSince(generationStartedAt) });
    return response;
  } catch (error) {
    const errorSummary = summarizeOpenAIError(error);

    if (isBlueprintGenerationFailure(errorSummary)) {
      try {
        logGenerationLifecycle(serverRequestId, "repair_start", { reason: "blueprint_generation_failure", elapsedSeconds: elapsedSecondsSince(generationStartedAt) }, "warn");
        const repairedResponse = await generateOpenAIStoryWithLongFloor(buildBlueprintRepairRetryInput(input, errorSummary));
        logGenerationLifecycle(serverRequestId, "repair_end", { succeeded: true, elapsedSeconds: elapsedSecondsSince(generationStartedAt), wordCount: repairedResponse.metadata.wordCount });
        const response = NextResponse.json(
          withRequestDiagnostics(withServerGenerationDuration(
            withReaderProfileGenerationSnapshot(withBlueprintRepairSuccessDiagnostics(repairedResponse, errorSummary), input.readerProfileGenerationSnapshot),
            generationStartedAt
          ), { authRequiredForGeneration, authSessionPresent, statusCode: 200, repairAttempted: true, repairSucceeded: true, serverRequestId })
        );
        logGenerationLifecycle(serverRequestId, "final_response_returned", { statusCode: 200, repaired: true, elapsedSeconds: elapsedSecondsSince(generationStartedAt) });
        return response;
      } catch (repairError) {
        const repairSummary = summarizeOpenAIError(repairError);
        logGenerationLifecycle(serverRequestId, "repair_end", { succeeded: false, errorType: classifyGenerationError(repairSummary), elapsedSeconds: elapsedSecondsSince(generationStartedAt) }, "error");
        return buildGenerationFailureResponse(input, generationStartedAt, {
          fallbackReason: `Model generation failed after blueprint repair retry.`,
          modelGenerationAttempted: true,
          modelGenerationErrorType: classifyGenerationError(repairSummary),
          repairAttempted: true,
          blueprintFailedReason: `${errorSummary}; repair retry: ${repairSummary}`,
          modelGenerationErrorMessageSafe: repairSummary,
          authRequiredForGeneration,
          authSessionPresent,
          serverRequestId,
          storyCleanlinessDiagnostics: readStoryCleanlinessDiagnostics(repairError)
        });
      }
    }

    logGenerationLifecycle(serverRequestId, "openai_response_failed", { errorType: classifyGenerationError(errorSummary), elapsedSeconds: elapsedSecondsSince(generationStartedAt), timeoutLikeFailure: isTimeoutLikeError(errorSummary) }, "error");
    return buildGenerationFailureResponse(input, generationStartedAt, {
      fallbackReason: "Model generation failed before a clean episode could be created.",
      modelGenerationAttempted: true,
      modelGenerationErrorType: classifyGenerationError(errorSummary),
      repairAttempted: isBlueprintGenerationFailure(errorSummary),
      blueprintFailedReason: errorSummary.startsWith("Blueprint generation failed") ? errorSummary : null,
      modelGenerationErrorMessageSafe: errorSummary,
      authRequiredForGeneration,
      authSessionPresent,
      serverRequestId,
      storyCleanlinessDiagnostics: readStoryCleanlinessDiagnostics(error)
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
    explicitReaderPreferencesForGeneration: snapshot.explicitReaderPreferencesForGeneration && typeof snapshot.explicitReaderPreferencesForGeneration === "object" ? snapshot.explicitReaderPreferencesForGeneration : undefined,
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

function withRequestDiagnostics(
  response: GenerateStoryResponse,
  options: {
    authRequiredForGeneration: boolean;
    authSessionPresent: boolean;
    statusCode: number;
    repairAttempted?: boolean;
    repairSucceeded?: boolean;
    serverRequestId: string;
  }
): GenerateStoryResponse {
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        deployedAppVersion: getBuildInfo().appVersion,
        generationRequestStarted: true,
        generationRequestStatus: "succeeded",
        generationEndpointStatusCode: options.statusCode,
        serverRequestId: options.serverRequestId,
        generationAttemptId: options.serverRequestId,
        authRequiredForGeneration: options.authRequiredForGeneration,
        authSessionPresent: options.authSessionPresent,
        requestPayloadValid: true,
        requestPayloadValidationError: null,
        modelGenerationErrorMessageSafe: null,
        fallbackReached: false,
        fallbackUserDisplayBlocked: true,
        repairAttempted: options.repairAttempted ?? response.metadata.diagnostics.repairAttempted,
        repairSucceeded: options.repairSucceeded ?? response.metadata.diagnostics.repairSucceeded
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
    modelGenerationErrorMessageSafe?: string | null;
    repairAttempted?: boolean;
    blueprintFailedReason?: string | null;
    authRequiredForGeneration: boolean;
    authSessionPresent: boolean;
    serverRequestId: string;
    storyCleanlinessDiagnostics?: Partial<StoryDiagnostics>;
  }
) {
  console.error("Story generation failed; deterministic fallback blocked from user display.", {
    fallbackReason: options.fallbackReason,
    modelGenerationAttempted: options.modelGenerationAttempted,
    modelGenerationErrorType: options.modelGenerationErrorType,
    repairAttempted: Boolean(options.repairAttempted),
    serverRequestId: options.serverRequestId
  });

  const failureStatus = isTimeoutLikeError(options.modelGenerationErrorMessageSafe ?? options.fallbackReason) ? 504 : 502;
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
    generationRequestStarted: true,
    generationRequestStatus: "failed",
    generationEndpointStatusCode: failureStatus,
    serverRequestId: options.serverRequestId,
    generationAttemptId: options.serverRequestId,
    timeoutLikeFailure: isTimeoutLikeError(options.modelGenerationErrorMessageSafe ?? options.fallbackReason),
    authRequiredForGeneration: options.authRequiredForGeneration,
    authSessionPresent: options.authSessionPresent,
    requestPayloadValid: true,
    requestPayloadValidationError: null,
    modelGenerationErrorMessageSafe: options.modelGenerationErrorMessageSafe ?? options.fallbackReason,
    deployedAppVersion: getBuildInfo().appVersion,
    storyGenerationFailureStage: options.storyCleanlinessDiagnostics?.storyGenerationFailureStage ?? classifyGenerationFailureStage(options.modelGenerationErrorMessageSafe ?? options.fallbackReason, options),
    storyGenerationFailureReason: options.storyCleanlinessDiagnostics?.storyGenerationFailureReason ?? classifyGenerationFailureReason(options.modelGenerationErrorMessageSafe ?? options.fallbackReason, options),
    storyGenerationFailureSource: options.storyCleanlinessDiagnostics?.storyGenerationFailureSource ?? (options.modelGenerationAttempted ? "model" : "environment"),
    storyGenerationRetryAttempted: options.storyCleanlinessDiagnostics?.storyGenerationRetryAttempted ?? Boolean((options.modelGenerationErrorMessageSafe ?? "").includes("retry")),
    storyGenerationRetrySucceeded: options.storyCleanlinessDiagnostics?.storyGenerationRetrySucceeded ?? false,
    storyMetadataLeakGuardEnabled: true,
    storyMetadataLeakScanTarget: options.storyCleanlinessDiagnostics?.storyMetadataLeakScanTarget ?? "final-story-prose",
    storyMetadataLeakDetected: options.storyCleanlinessDiagnostics?.storyMetadataLeakDetected ?? Boolean((options.modelGenerationErrorMessageSafe ?? "").toLowerCase().includes("metadata")),
    storyMetadataLeakSanitized: options.storyCleanlinessDiagnostics?.storyMetadataLeakSanitized ?? Boolean((options.modelGenerationErrorMessageSafe ?? "").toLowerCase().includes("sanitization")),
    storyMetadataLeakFinalClean: options.storyCleanlinessDiagnostics?.storyMetadataLeakFinalClean ?? false,
    storyMetadataLeakRemovedPatterns: options.storyCleanlinessDiagnostics?.storyMetadataLeakRemovedPatterns ?? [],
    storyRawCandidateLength: options.storyCleanlinessDiagnostics?.storyRawCandidateLength ?? 0,
    storySanitizedCandidateLength: options.storyCleanlinessDiagnostics?.storySanitizedCandidateLength ?? 0,
    storyRepairAttempted: options.storyCleanlinessDiagnostics?.storyRepairAttempted ?? Boolean(options.repairAttempted),
    fallbackDisplayBlocked: true,
    generationSource: "model",
    fallbackUsed: false,
    fallbackReached: false,
    fallbackRejectedForUserDisplay: false,
    fallbackUserDisplayBlocked: true,
    modelGenerationAttempted: options.modelGenerationAttempted,
    modelGenerationSucceeded: false,
    modelGenerationErrorType: options.modelGenerationErrorType,
    repairAttempted: Boolean(options.repairAttempted),
    repairSucceeded: false,
    metadataLeakGuardTriggered: Boolean(options.storyCleanlinessDiagnostics?.storyMetadataLeakDetected)
  });

  const buildInfo = getBuildInfo();
  const generationFinishedAt = new Date();
  const serverGenerationDurationSeconds = Math.max(
    0,
    Math.round((generationFinishedAt.getTime() - generationStartedAt.getTime()) / 1000)
  );

  logGenerationLifecycle(options.serverRequestId, "final_response_returned", { statusCode: failureStatus, elapsedSeconds: serverGenerationDurationSeconds });

  return NextResponse.json({
    error: CLEAN_GENERATION_FAILURE_MESSAGE,
    diagnostic: {
      ...diagnostics,
      serverRequestId: options.serverRequestId,
      generationAttemptId: options.serverRequestId,
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
  }, { status: failureStatus });
}

function buildPayloadFailureResponse(
  validationError: string,
  generationStartedAt: Date,
  authSessionPresent: boolean,
  authRequiredForGeneration: boolean,
  serverRequestId: string
) {
  const buildInfo = getBuildInfo();
  const serverGenerationDurationSeconds = Math.max(
    0,
    Math.round((Date.now() - generationStartedAt.getTime()) / 1000)
  );

  logGenerationLifecycle(serverRequestId, "final_response_returned", { statusCode: 400, elapsedSeconds: serverGenerationDurationSeconds }, "warn");

  return NextResponse.json({
    error: validationError,
    diagnostic: {
      ...getOpenAIDiagnostics({
        fallbackReason: null,
        generationRequestStarted: true,
        generationRequestStatus: "failed",
        generationEndpointStatusCode: 400,
        serverRequestId,
        generationAttemptId: serverRequestId,
        authRequiredForGeneration,
        authSessionPresent,
        requestPayloadValid: false,
        requestPayloadValidationError: validationError,
        modelGenerationAttempted: false,
        modelGenerationSucceeded: false,
        modelGenerationErrorType: "payload_validation",
        modelGenerationErrorMessageSafe: validationError,
        generationSource: "model",
        fallbackUsed: false,
        fallbackReached: false,
        fallbackRejectedForUserDisplay: false,
        fallbackUserDisplayBlocked: true,
        deployedAppVersion: getBuildInfo().appVersion,
        storyGenerationFailureStage: "payload-validation",
        storyGenerationFailureReason: validationError,
        storyGenerationFailureSource: "request",
        storyGenerationRetryAttempted: false,
        storyGenerationRetrySucceeded: false,
        storyMetadataLeakGuardEnabled: true,
        storyMetadataLeakScanTarget: "not-started",
        storyMetadataLeakDetected: false,
        storyMetadataLeakSanitized: false,
        storyMetadataLeakFinalClean: false,
        storyMetadataLeakRemovedPatterns: [],
        storyRawCandidateLength: 0,
        storySanitizedCandidateLength: 0,
        storyRepairAttempted: false,
        fallbackDisplayBlocked: true
      }),
      serverGenerationDurationSeconds,
      appVersion: buildInfo.appVersion,
      buildEnvironment: buildInfo.buildEnvironment,
      gitBranch: buildInfo.gitBranch,
      commitSha: buildInfo.commitSha,
      buildTimestamp: buildInfo.buildTimestamp
    }
  }, { status: 400 });
}

function getGenerationServerRequestId(request: Request): string {
  const headerAttemptId = request.headers.get("x-generation-attempt-id")?.trim();
  if (headerAttemptId && /^[a-zA-Z0-9_-]{1,80}$/.test(headerAttemptId)) return headerAttemptId;
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function elapsedSecondsSince(startedAt: Date): number {
  return Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
}

function logGenerationLifecycle(serverRequestId: string, event: string, details: Record<string, unknown> = {}, level: "info" | "warn" | "error" = "info") {
  const payload = { route: "/api/generate", serverRequestId, generationAttemptId: serverRequestId, event, ...details };
  if (level === "error") console.error("/api/generate lifecycle", payload);
  else if (level === "warn") console.warn("/api/generate lifecycle", payload);
  else console.info("/api/generate lifecycle", payload);
}

function buildSafeInputDiagnostics(input: GenerateStoryRequest, generationStartedAt: Date): Record<string, unknown> {
  return {
    elapsedSeconds: elapsedSecondsSince(generationStartedAt),
    generationMode: input.generationMode,
    lengthTarget: input.lengthTarget,
    genrePreset: input.genrePreset,
    storyId: input.generationIdentity.storyId,
    seriesId: input.generationIdentity.seriesId,
    continuationContextIncluded: input.continuationContextIncluded,
    worldBibleChars: input.worldBible.length,
    characterProfileChars: input.characterProfiles.length,
    storySeedChars: input.storySeed.length,
    storyRulesChars: input.storyRules.length,
    personalizationContextPresent: Boolean(input.personalizationContext),
    readerProfileSnapshotPresent: Boolean(input.readerProfileGenerationSnapshot)
  };
}

function isTimeoutLikeError(message: string): boolean {
  return /timeout|timed out|504|gateway|network|socket|terminated|aborted/i.test(message);
}

function classifyGenerationFailureStage(
  message: string,
  options: { modelGenerationAttempted: boolean; modelGenerationErrorType: string; repairAttempted?: boolean }
): string {
  const lower = message.toLowerCase();
  if (!options.modelGenerationAttempted && options.modelGenerationErrorType === "missing_env") return "missing-env";
  if (lower.includes("clean story prose") || lower.includes("metadata sanitization")) return "story-clean-retry";
  if (lower.includes("story draft request")) return "story-draft-request";
  if (lower.includes("story draft parse")) return "story-draft-parse";
  if (lower.includes("forbidden")) return "forbidden-term-repair";
  if (lower.includes("expansion")) return "expansion";
  if (lower.includes("long floor")) return "long-floor-pass";
  if (lower.includes("blueprint")) return options.repairAttempted ? "blueprint-repair" : "blueprint-generation";
  if (lower.includes("fallback")) return "fallback-display-policy";
  return options.modelGenerationAttempted ? "unknown-model-error" : "missing-env";
}

function classifyGenerationFailureReason(
  message: string,
  options: { modelGenerationAttempted: boolean; modelGenerationErrorType: string }
): string {
  if (!options.modelGenerationAttempted && options.modelGenerationErrorType === "missing_env") return "missing_env";
  if (message.toLowerCase().includes("clean story prose")) return "no_clean_story_after_sanitization_retry";
  return options.modelGenerationErrorType || "unknown";
}

function readStoryCleanlinessDiagnostics(error: unknown): Partial<StoryDiagnostics> | undefined {
  if (!error || typeof error !== "object" || !("storyCleanlinessDiagnostics" in error)) return undefined;
  const diagnostics = (error as { storyCleanlinessDiagnostics?: unknown }).storyCleanlinessDiagnostics;
  return diagnostics && typeof diagnostics === "object" ? diagnostics as Partial<StoryDiagnostics> : undefined;
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

function buildStoryRules(
  storyRules: string | undefined,
  readerMood: GenerateStoryRequest["readerMood"] = null,
  personalizationContext?: string,
  storyFit?: { label?: unknown; guidance?: unknown; keywords?: unknown }
): string {
  const baseRules = storyRules?.trim() || DEFAULT_STORY_RULES;
  const readerMoodGuidance = formatReaderMoodForPrompt(readerMood);
  const controlledPersonalization = personalizationContext?.trim() || "";
  const storyFitGuidance = formatSelectedStoryFitForPrivateRules(storyFit);

  return [baseRules, formatStoryCraftGuidance(), readerMoodGuidance, storyFitGuidance, controlledPersonalization].filter(Boolean).join("\n\n");
}

function formatSelectedStoryFitForPrivateRules(storyFit?: { label?: unknown; guidance?: unknown; keywords?: unknown }): string {
  const label = normalizeOptionalString(storyFit?.label);
  const guidance = normalizeOptionalString(storyFit?.guidance);
  const keywords = Array.isArray(storyFit?.keywords)
    ? storyFit.keywords.filter((keyword): keyword is string => typeof keyword === "string" && Boolean(keyword.trim())).map((keyword) => keyword.trim()).slice(0, 8)
    : [];
  if (!label && !guidance && keywords.length === 0) return "";

  return [
    "Private story-fit planning context:",
    label ? `- Selected story fit: ${label}. Express this through scene, setting, character pressure, and consequence without printing labels or instructions.` : "",
    guidance ? `- Direction: ${guidance}` : "",
    keywords.length ? `- Useful motifs: ${keywords.join(", ")}` : "",
    "- The final story must begin directly as prose and must not print story-fit labels, ids, keyword lists, craft labels, or prompt instructions."
  ].filter(Boolean).join("\n");
}
function normalizeOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function hasAuthSession(request: Request): boolean {
  const authorization = request.headers.get("authorization") ?? "";
  return /^Bearer\s+\S+/i.test(authorization);
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
