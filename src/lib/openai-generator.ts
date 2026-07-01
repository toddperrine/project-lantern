import OpenAI from "openai";
import { BLOODWICK_SERIES_TITLE_PROMPT, getBloodwickSeriesDisplayTitle } from "./bloodwick-series-title";
import { buildEpisodeMomentumObjective } from "./episode-momentum-engine";
import { LENGTH_TARGETS } from "./types";
import type { GenerateStoryRequest, GenerateStoryResponse, LengthTarget, StoryDiagnostics } from "./types";
import { findStoryMetadataLeakPatterns, normalizeStoryPayload, normalizeStoryText, normalizeStringList, sanitizeStoryMetadataLeaks } from "./story-output";
import {
  countWords,
  inferCharactersUsed,
  inferRulesReferenced
} from "./story-analysis";

type OpenAIStoryPayload = {
  story: string;
  seriesTitle?: string | null;
  charactersUsed?: string[];
  rulesReferenced?: string[];
};

type StoryBlueprint = {
  protagonist: string;
  pointOfViewCharacter: string;
  centralAnomaly: string;
  premiseRequirements: string[];
  speculativeRuleUnderPressure: string;
  characterDesire: string;
  characterFear: string;
  characterBlindSpot: string;
  narrativeArchitecture: string;
  characterArc: string;
  endingType: string;
  concreteRevelation: string;
  concreteCost: string;
  protagonistPersonalStake: string;
  antagonistOrOpposingForceStake: string;
  concreteIrreversibleCost: string;
  finalDecision: string;
  finalImageOrAction: string;
  changedWorldState: string;
  sceneBeats: BlueprintSceneBeat[];
};

type BlueprintSceneBeat = {
  location: string;
  activeCharacters: string[];
  concreteAction: string;
  newInformation: string;
  conflictOrObstacle: string;
  irreversibleTurn: string;
  consequence: string;
  sensoryAnchor: string;
  characterPressure: string;
  characterStake: string;
  materialConsequence: string;
};

type BlueprintRequestResult = {
  blueprint: StoryBlueprint;
  repairAttemptsCount: number;
  initialBlueprintCompleteBeatCount?: number;
  repairBlueprintCompleteBeatCount?: number;
  partialBeatNormalizationUsed: boolean;
  missingBeatRepairAttempted: boolean;
  finalAcceptedBlueprintSceneCount: number;
};

type BlueprintParseResult = {
  blueprint: StoryBlueprint;
  completeBeatCount: number;
  partialBeatNormalizationUsed: boolean;
};

type NormalizedBeatResult = {
  beat: BlueprintSceneBeat | null;
  normalizationUsed: boolean;
};

type ForbiddenRepairResult = {
  story: string;
  payload: OpenAIStoryPayload;
  repairAttemptsCount: number;
  remainingForbiddenTerms: string[];
  stoppedReason: StoryDiagnostics["stoppedReason"];
};

const DEFAULT_BLUEPRINT_MODEL = "gpt-4.1-mini";
const DEFAULT_STORY_MODEL = "gpt-4.1";
const DEFAULT_EXPANSION_MODEL = "gpt-4.1";
const OPTIONAL_CALL_TIME_BUDGET_MS = 240_000;
const MAX_FORBIDDEN_REPAIR_ATTEMPTS = 1;
const LONG_BLUEPRINT_TARGET_BEATS = 10;
const POV = "Third-person limited";
const DEFAULT_NARRATIVE_RULES = `Every story must obey these rules:
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
const TECHNICAL_FORBIDDEN_TERMS = [
  "AI",
  "prompt",
  "model",
  "dataset",
  "simulation",
  "generated",
  "source material",
  "uploaded file",
  "code",
  "system",
  "reboot",
  "reset",
  "parameters"
];
const STORY_WORLD_TRANSLATIONS = [
  "corrupted sound",
  "memory gaps",
  "impossible repetition",
  "changed lyrics",
  "physical glitches",
  "missing names",
  "wrong shadows",
  "broken instruments",
  "altered records",
  "contradictory memories"
];
const META_RULE_TRANSLATIONS: Record<string, string> = {
  AI: "unseen intelligence",
  prompt: "summoning phrase",
  model: "pattern",
  dataset: "archive of patterns",
  simulation: "world's repeated order",
  generated: "newly formed",
  "source material": "old records",
  "uploaded file": "found document",
  code: "hidden order",
  system: "hidden order",
  reboot: "forced return",
  reset: "forced return",
  parameters: "boundaries"
};
const WEAK_COST_TERMS = ["risk", "uncertainty", "instability", "future is unknown", "unknown future"];
const CONCRETE_COST_SIGNALS = [
  "memory",
  "remember",
  "relationship",
  "friend",
  "family",
  "place",
  "room",
  "street",
  "object",
  "transformed",
  "changed",
  "altered",
  "rule",
  "road",
  "path",
  "door",
  "record",
  "archive",
  "setlist",
  "instrument",
  "amp",
  "lyric",
  "sign"
];
const DISCUSSION_ONLY_BEAT_TERMS = ["discussion", "debate", "realization", "philosophical exchange", "conversation about"];

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getOpenAIModel(): string {
  return getStoryModel();
}

export function getBlueprintModel(): string {
  return process.env.OPENAI_BLUEPRINT_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_BLUEPRINT_MODEL;
}

export function getStoryModel(): string {
  return process.env.OPENAI_STORY_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_STORY_MODEL;
}

export function getExpansionModel(): string {
  return process.env.OPENAI_EXPANSION_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || DEFAULT_EXPANSION_MODEL;
}

export function getOpenAIDiagnostics(overrides: Partial<StoryDiagnostics> = {}): StoryDiagnostics {
  const apiKeyDetected = hasOpenAIKey();
  const defaultLengthSpec = getLengthTargetSpec("Standard");

  return {
    openAIEnabled: apiKeyDetected,
    apiKeyDetected,
    modelRequested: getOpenAIModel(),
    blueprintModelRequested: getBlueprintModel(),
    storyModelRequested: getStoryModel(),
    expansionModelRequested: getExpansionModel(),
    openAIRequestAttempted: false,
    openAIRequestSucceeded: false,
    fallbackReason: null,
    notice: null,
    genrePreset: "Speculative Mystery",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: formatLengthTarget("Standard"),
    targetMinimumWordCount: defaultLengthSpec.minWords,
    targetMaximumWordCount: defaultLengthSpec.maxWords,
    finalWordCount: 0,
    expansionAttempted: false,
    expansionSucceeded: false,
    expansionAttemptsCount: 0,
    repairAttemptsCount: 0,
    timedOutEarly: false,
    stoppedReason: "complete",
    remainingForbiddenTerms: [],
    underTargetNotice: null,
    blueprintGenerated: false,
    blueprintSceneCount: 0,
    blueprintFailedReason: null,
    initialBlueprintCompleteBeatCount: undefined,
    repairBlueprintCompleteBeatCount: undefined,
    partialBeatNormalizationUsed: false,
    missingBeatRepairAttempted: false,
    finalAcceptedBlueprintSceneCount: undefined,
    storyMetadataLeakGuardEnabled: true,
    fallbackMetadataLeakGuardEnabled: false,
    fallbackRejectedForMetadataLeak: false,
    metadataLeakPatternsFound: [],
    deployedAppVersion: undefined,
    latestGenerationAttemptId: undefined,
    storyGenerationFailureStage: "none",
    storyGenerationFailureReason: null,
    storyGenerationFailureSource: "none",
    storyGenerationRetryAttempted: false,
    storyGenerationRetrySucceeded: false,
    storyMetadataLeakScanTarget: "final-story-prose",
    storyMetadataLeakDetected: false,
    storyMetadataLeakSanitized: false,
    storyMetadataLeakFinalClean: true,
    storyMetadataLeakRemovedPatterns: [],
    storyRawCandidateLength: 0,
    storySanitizedCandidateLength: 0,
    storyRepairAttempted: false,
    fallbackDisplayBlocked: true,
    generationRequestStarted: false,
    generationRequestStatus: "not-started",
    generationEndpointStatusCode: undefined,
    authRequiredForGeneration: false,
    authSessionPresent: false,
    requestPayloadValid: false,
    requestPayloadValidationError: null,
    modelGenerationErrorMessageSafe: null,
    generationSource: "model",
    fallbackUsed: false,
    fallbackReached: false,
    fallbackRejectedForUserDisplay: false,
    fallbackUserDisplayBlocked: false,
    modelGenerationAttempted: false,
    modelGenerationSucceeded: false,
    modelGenerationErrorType: "none",
    repairAttempted: false,
    repairSucceeded: false,
    metadataLeakGuardTriggered: false,
    storyFitGenerationContextVersion: "v1",
    generationMode: "new_story",
    storyId: "unassigned",
    seriesId: "unassigned",
    sourceStoryId: null,
    parentSeriesId: null,
    continuationContextIncluded: false,
    newSeriesCreated: true,
    generationTrigger: "Create",
    ...overrides
  };
}

export async function generateOpenAIStory(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const generationStartedAt = Date.now();
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const maxExpansionAttempts = getMaxExpansionAttempts(input.lengthTarget);
  const blueprintRange = getBlueprintBeatRange(input.lengthTarget);
  const disallowedTerms = getDisallowedForbiddenTerms(input.storyRules);
  let repairAttemptsCount = 0;
  let blueprint: StoryBlueprint;
  let blueprintResult: BlueprintRequestResult;
  let stoppedReason: StoryDiagnostics["stoppedReason"] = "complete";
  let remainingForbiddenTerms: string[] = [];

  try {
    blueprintResult = await requestBlueprint(client, input, blueprintRange);
    blueprint = blueprintResult.blueprint;
    repairAttemptsCount += blueprintResult.repairAttemptsCount;
  } catch (error) {
    throw createGenerationStageError("blueprint-generation", `Blueprint generation failed: ${summarizeError(error)}`, {
      storyGenerationFailureReason: "blueprint_generation_failed",
      storyGenerationRetryAttempted: false,
      storyGenerationRetrySucceeded: false
    });
  }

  let payload: OpenAIStoryPayload;
  try {
    payload = await requestStory(
      client,
      getStoryModel(),
      buildStoryPrompt(input, blueprint, blueprintRange, disallowedTerms),
      estimateStoryMaxTokens(lengthSpec.maxWords)
    );
  } catch (error) {
    throw createGenerationStageError("story-draft-request", `Story draft request failed: ${summarizeError(error)}`, {
      storyGenerationFailureReason: "story_draft_request_failed",
      storyGenerationRetryAttempted: false,
      storyGenerationRetrySucceeded: false
    });
  }
  let rawCandidateLength = payload.story.length;
  let candidateSanitization = sanitizeStoryMetadataLeaks(payload.story);
  let story = normalizeStoryText(payload.story);
  let cleanStoryRetryAttempted = false;
  let cleanStoryRetrySucceeded = false;

  if (!story && hasOptionalCallBudget(generationStartedAt)) {
    cleanStoryRetryAttempted = true;
    try {
      payload = await requestStory(
        client,
        getStoryModel(),
        buildCleanStoryRetryPrompt(input, blueprint, disallowedTerms),
        estimateStoryMaxTokens(lengthSpec.maxWords)
      );
    } catch (error) {
      throw createGenerationStageError("story-clean-retry", `Clean story retry failed: ${summarizeError(error)}`, {
        storyGenerationFailureReason: "clean_story_retry_request_failed",
        storyGenerationRetryAttempted: true,
        storyGenerationRetrySucceeded: false,
        storyMetadataLeakDetected: candidateSanitization.detected,
        storyMetadataLeakSanitized: candidateSanitization.sanitized,
        storyMetadataLeakFinalClean: false,
        storyMetadataLeakRemovedPatterns: candidateSanitization.removedPatterns,
        metadataLeakPatternsFound: candidateSanitization.removedPatterns,
        storyRawCandidateLength: rawCandidateLength,
        storySanitizedCandidateLength: candidateSanitization.text.length,
        fallbackDisplayBlocked: true
      });
    }
    rawCandidateLength = payload.story.length;
    candidateSanitization = sanitizeStoryMetadataLeaks(payload.story);
    story = normalizeStoryText(payload.story);
    cleanStoryRetrySucceeded = Boolean(story);
    repairAttemptsCount += 1;
  }

  if (!story) {
    throw Object.assign(
      new Error("OpenAI response did not include clean story prose after metadata sanitization and retry."),
      {
        storyCleanlinessDiagnostics: {
          storyGenerationFailureStage: "story-clean-retry",
          storyGenerationFailureReason: "no_clean_story_after_sanitization_retry",
          storyGenerationFailureSource: "model",
          storyGenerationRetryAttempted: cleanStoryRetryAttempted,
          storyGenerationRetrySucceeded: cleanStoryRetrySucceeded,
          storyMetadataLeakGuardEnabled: true,
          storyMetadataLeakScanTarget: "final-story-prose",
          storyMetadataLeakDetected: candidateSanitization.detected,
          storyMetadataLeakSanitized: candidateSanitization.sanitized,
          storyMetadataLeakFinalClean: false,
          storyMetadataLeakRemovedPatterns: candidateSanitization.removedPatterns,
          metadataLeakPatternsFound: candidateSanitization.removedPatterns,
          storyRawCandidateLength: rawCandidateLength,
          storySanitizedCandidateLength: candidateSanitization.text.length,
          storyRepairAttempted: repairAttemptsCount > 0,
          fallbackDisplayBlocked: true
        } satisfies Partial<StoryDiagnostics>
      }
    );
  }

  let forbiddenRepair = await repairForbiddenTermsIfNeeded(
    client,
    input,
    blueprint,
    story,
    payload,
    disallowedTerms,
    generationStartedAt,
    MAX_FORBIDDEN_REPAIR_ATTEMPTS - repairAttemptsCount
  );
  story = forbiddenRepair.story;
  payload = forbiddenRepair.payload;
  repairAttemptsCount += forbiddenRepair.repairAttemptsCount;
  remainingForbiddenTerms = forbiddenRepair.remainingForbiddenTerms;
  if (forbiddenRepair.stoppedReason) {
    stoppedReason = forbiddenRepair.stoppedReason;
  }

  let wordCount = countWords(story);
  let expansionAttemptsCount = 0;
  let expansionSucceeded = wordCount >= lengthSpec.minWords;

  while (wordCount < lengthSpec.minWords && expansionAttemptsCount < maxExpansionAttempts && stoppedReason !== "time-budget") {
    if (!hasOptionalCallBudget(generationStartedAt)) {
      stoppedReason = "time-budget";
      break;
    }

    expansionAttemptsCount += 1;
    try {
      payload = await requestStory(
        client,
        getExpansionModel(),
        buildExpansionPrompt(input, blueprint, story, expansionAttemptsCount, maxExpansionAttempts, disallowedTerms),
        estimateStoryMaxTokens(lengthSpec.maxWords)
      );
    } catch {
      stoppedReason = "openai-error";
      break;
    }
    const expandedStory = normalizeStoryText(payload.story);
    if (!expandedStory) {
      stoppedReason = "openai-error";
      break;
    }

    story = expandedStory;
    forbiddenRepair = await repairForbiddenTermsIfNeeded(
      client,
      input,
      blueprint,
      story,
      payload,
      disallowedTerms,
      generationStartedAt,
      MAX_FORBIDDEN_REPAIR_ATTEMPTS - repairAttemptsCount
    );
    story = forbiddenRepair.story;
    payload = forbiddenRepair.payload;
    repairAttemptsCount += forbiddenRepair.repairAttemptsCount;
    remainingForbiddenTerms = forbiddenRepair.remainingForbiddenTerms;
    if (forbiddenRepair.stoppedReason) {
      stoppedReason = forbiddenRepair.stoppedReason;
    }
    wordCount = countWords(story);
    expansionSucceeded = wordCount >= lengthSpec.minWords;
  }

  if (stoppedReason === "complete" && wordCount < lengthSpec.minWords && expansionAttemptsCount >= maxExpansionAttempts) {
    stoppedReason = "max-expansion-attempts";
  }

  remainingForbiddenTerms = findForbiddenTerms(story, disallowedTerms);

  const underTargetNotice =
    wordCount < lengthSpec.minWords
      ? `Final story is below the selected ${formatLengthTarget(input.lengthTarget)} target. Target minimum: ${lengthSpec.minWords} words. Final word count: ${wordCount}. Expansion attempts: ${expansionAttemptsCount}. Stopped reason: ${stoppedReason}.`
      : null;
  const blueprintNotice = buildBlueprintDiagnosticsNotice(blueprintResult);
  const ruleSources = `${input.worldBible}\n\n${input.storyRules || DEFAULT_NARRATIVE_RULES}`;
  const seriesTitle = getBloodwickSeriesDisplayTitle({
    generatedSeriesTitle: payload.seriesTitle,
    firstEpisodeTitle: createStoryTitleFromText(story),
    episodeTitle: createStoryTitleFromText(story),
    protagonistName: normalizeList(payload.charactersUsed, inferCharactersUsed(story, input.characterProfiles))[0] ?? null,
    fearCategory: input.selectedStoryTypeChipLabel ?? input.genrePreset,
  });

  const rulesReferenced = cleanRulesReferenced(
    normalizeList(payload.rulesReferenced, inferRulesReferenced(story, ruleSources)),
    disallowedTerms
  );

  return {
    story,
    metadata: {
      wordCount,
      seriesTitle,
      charactersUsed: normalizeList(payload.charactersUsed, inferCharactersUsed(story, input.characterProfiles)),
      rulesReferenced,
      source: "openai",
      diagnostics: getOpenAIDiagnostics({
        openAIRequestAttempted: true,
        openAIRequestSucceeded: true,
        notice: [underTargetNotice, blueprintNotice].filter(Boolean).join(" ") || null,
        genrePreset: input.genrePreset,
        narrativeArchitecture: input.narrativeArchitecture,
        characterArc: input.characterArc,
        endingType: input.endingType,
        lengthTarget: formatLengthTarget(input.lengthTarget),
        targetMinimumWordCount: lengthSpec.minWords,
        targetMaximumWordCount: lengthSpec.maxWords,
        finalWordCount: wordCount,
        expansionAttempted: expansionAttemptsCount > 0,
        expansionSucceeded,
        expansionAttemptsCount,
        repairAttemptsCount,
        timedOutEarly: stoppedReason === "time-budget",
        stoppedReason,
        remainingForbiddenTerms,
        generationRequestStarted: true,
        generationRequestStatus: "succeeded",
        generationEndpointStatusCode: 200,
        requestPayloadValid: true,
        requestPayloadValidationError: null,
        modelGenerationErrorMessageSafe: null,
        generationSource: "model",
        fallbackUsed: false,
        fallbackReached: false,
        fallbackRejectedForUserDisplay: false,
        fallbackUserDisplayBlocked: false,
        modelGenerationAttempted: true,
        modelGenerationSucceeded: true,
        modelGenerationErrorType: "none",
        repairAttempted: repairAttemptsCount > 0,
        repairSucceeded: repairAttemptsCount > 0 && remainingForbiddenTerms.length === 0,
        metadataLeakGuardTriggered: remainingForbiddenTerms.length > 0,
        storyGenerationFailureStage: "none",
        storyGenerationFailureReason: null,
        storyGenerationFailureSource: "model",
        storyGenerationRetryAttempted: cleanStoryRetryAttempted,
        storyGenerationRetrySucceeded: cleanStoryRetrySucceeded,
        storyMetadataLeakGuardEnabled: true,
        storyMetadataLeakScanTarget: "final-story-prose",
        storyMetadataLeakDetected: candidateSanitization.detected,
        storyMetadataLeakSanitized: candidateSanitization.sanitized,
        storyMetadataLeakFinalClean: findStoryMetadataLeakPatterns(story).length === 0,
        storyMetadataLeakRemovedPatterns: candidateSanitization.removedPatterns,
        metadataLeakPatternsFound: findStoryMetadataLeakPatterns(story),
        storyRawCandidateLength: rawCandidateLength,
        storySanitizedCandidateLength: story.length,
        storyRepairAttempted: repairAttemptsCount > 0,
        fallbackDisplayBlocked: true,
        underTargetNotice,
        blueprintGenerated: true,
        blueprintSceneCount: blueprint.sceneBeats.length,
        blueprintFailedReason: null,
        initialBlueprintCompleteBeatCount: blueprintResult.initialBlueprintCompleteBeatCount,
        repairBlueprintCompleteBeatCount: blueprintResult.repairBlueprintCompleteBeatCount,
        partialBeatNormalizationUsed: blueprintResult.partialBeatNormalizationUsed,
        missingBeatRepairAttempted: blueprintResult.missingBeatRepairAttempted,
        finalAcceptedBlueprintSceneCount: blueprintResult.finalAcceptedBlueprintSceneCount,
        generationMode: input.generationIdentity.generationMode,
        storyId: input.generationIdentity.storyId,
        seriesId: input.generationIdentity.seriesId,
        sourceStoryId: input.generationIdentity.sourceStoryId ?? null,
        parentSeriesId: input.generationIdentity.parentSeriesId ?? null,
        continuationContextIncluded: input.continuationContextIncluded,
        newSeriesCreated: input.generationMode === "new_story",
        generationTrigger: input.generationTrigger,
        seriesTitle
      })
    }
  };
}

async function requestBlueprint(
  client: OpenAI,
  input: GenerateStoryRequest,
  beatRange: { min: number; max: number }
): Promise<BlueprintRequestResult> {
  let repairAttemptsCount = 0;
  let lastError = "Blueprint generation did not return a usable plan.";
  let initialBlueprintCompleteBeatCount: number | undefined;
  let repairBlueprintCompleteBeatCount: number | undefined;
  let partialBeatNormalizationUsed = false;
  let bestPartial: BlueprintParseResult | null = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await client.chat.completions.create({
      model: getBlueprintModel(),
      temperature: attempt === 0 ? 0.45 : 0.35,
      max_tokens: 5500,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Create private planning JSON for original short fiction. Return only valid JSON. Do not write prose, notes, markdown, or commentary."
        },
        {
          role: "user",
          content: buildBlueprintPrompt(input, beatRange, lastError, attempt)
        }
      ]
    });

    try {
      const parseResult = parseBlueprint(response.choices[0]?.message.content ?? "", beatRange, { allowPartial: true });
      if (attempt === 0) {
        initialBlueprintCompleteBeatCount = parseResult.completeBeatCount;
      } else {
        repairBlueprintCompleteBeatCount = parseResult.completeBeatCount;
      }
      partialBeatNormalizationUsed = partialBeatNormalizationUsed || parseResult.partialBeatNormalizationUsed;
      if (!bestPartial || parseResult.completeBeatCount > bestPartial.completeBeatCount) {
        bestPartial = parseResult;
      }
      if (parseResult.completeBeatCount >= beatRange.min) {
        return {
          blueprint: trimBlueprintBeats(parseResult.blueprint, beatRange.max),
          repairAttemptsCount,
          initialBlueprintCompleteBeatCount,
          repairBlueprintCompleteBeatCount,
          partialBeatNormalizationUsed,
          missingBeatRepairAttempted: false,
          finalAcceptedBlueprintSceneCount: Math.min(parseResult.completeBeatCount, beatRange.max)
        };
      }
      lastError = `Blueprint included ${parseResult.completeBeatCount} usable scene beats; ${beatRange.min}-${beatRange.max} are required.`;
      repairAttemptsCount += 1;
    } catch (error) {
      lastError = summarizeError(error);
      repairAttemptsCount += 1;
    }
  }

  if (input.lengthTarget === "Long" && bestPartial && bestPartial.completeBeatCount > 0 && bestPartial.completeBeatCount < beatRange.min) {
    const missingBeatCount = LONG_BLUEPRINT_TARGET_BEATS - bestPartial.completeBeatCount;
    if (missingBeatCount > 0) {
      try {
        const repairedBlueprint = await requestMissingSceneBeats(client, input, bestPartial.blueprint, missingBeatCount, beatRange);
        const parseResult = parseBlueprintFromPayload(repairedBlueprint, beatRange, { allowPartial: true });
        repairAttemptsCount += 1;
        repairBlueprintCompleteBeatCount = parseResult.completeBeatCount;
        partialBeatNormalizationUsed = partialBeatNormalizationUsed || parseResult.partialBeatNormalizationUsed;
        if (parseResult.completeBeatCount >= beatRange.min) {
          return {
            blueprint: trimBlueprintBeats(parseResult.blueprint, beatRange.max),
            repairAttemptsCount,
            initialBlueprintCompleteBeatCount,
            repairBlueprintCompleteBeatCount,
            partialBeatNormalizationUsed,
            missingBeatRepairAttempted: true,
            finalAcceptedBlueprintSceneCount: Math.min(parseResult.completeBeatCount, beatRange.max)
          };
        }
        lastError = `Blueprint included ${parseResult.completeBeatCount} usable scene beats after missing-beat repair; ${beatRange.min}-${beatRange.max} are required.`;
      } catch (error) {
        repairAttemptsCount += 1;
        lastError = `Missing-beat repair failed: ${summarizeError(error)}`;
      }
    }
  }

  throw new Error(formatBlueprintFailure(lastError, {
    initialBlueprintCompleteBeatCount,
    repairBlueprintCompleteBeatCount,
    partialBeatNormalizationUsed,
    missingBeatRepairAttempted: input.lengthTarget === "Long" && Boolean(bestPartial && bestPartial.completeBeatCount > 0 && bestPartial.completeBeatCount < beatRange.min),
    finalAcceptedBlueprintSceneCount: bestPartial?.completeBeatCount
  }));
}

async function requestMissingSceneBeats(
  client: OpenAI,
  input: GenerateStoryRequest,
  partialBlueprint: StoryBlueprint,
  missingBeatCount: number,
  beatRange: { min: number; max: number }
): Promise<Partial<StoryBlueprint>> {
  const response = await client.chat.completions.create({
    model: getBlueprintModel(),
    temperature: 0.25,
    max_tokens: 2600,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "Return only valid JSON. Add missing compact sceneBeats for an existing private fiction blueprint."
      },
      {
        role: "user",
        content: buildMissingSceneBeatsPrompt(input, partialBlueprint, missingBeatCount, beatRange)
      }
    ]
  });
  const payload = normalizeStoryPayload(response.choices[0]?.message.content ?? "") as Partial<StoryBlueprint>;
  const repairedBeats = Array.isArray(payload.sceneBeats) ? payload.sceneBeats : [];

  return {
    ...partialBlueprint,
    sceneBeats: [...partialBlueprint.sceneBeats, ...repairedBeats].slice(0, beatRange.max)
  } as Partial<StoryBlueprint>;
}

async function requestStory(
  client: OpenAI,
  model: string,
  prompt: string,
  maxTokens: number
): Promise<OpenAIStoryPayload> {
  const response = await client.chat.completions.create({
    model,
    temperature: 0.78,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a literary short story engine for creators. Write original fiction as if for a literary magazine. Return only valid JSON matching this shape: {\"story\":\"...\",\"charactersUsed\":[\"...\"],\"rulesReferenced\":[\"...\"]}. The story value must contain only finished prose, never JSON text, labels, headings, bullets, notes, outlines, or commentary."
      },
      { role: "user", content: prompt }
    ]
  });

  return parseStoryPayload(response.choices[0]?.message.content ?? "");
}

async function repairForbiddenTermsIfNeeded(
  client: OpenAI,
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  story: string,
  payload: OpenAIStoryPayload,
  disallowedTerms: string[],
  generationStartedAt: number,
  remainingRepairAttempts: number
): Promise<ForbiddenRepairResult> {
  let nextStory = story;
  let nextPayload = payload;
  let repairAttemptsCount = 0;
  let remainingForbiddenTerms = findForbiddenTerms(nextStory, disallowedTerms);

  if (remainingForbiddenTerms.length === 0) {
    return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "complete" };
  }

  if (remainingRepairAttempts <= 0) {
    return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "complete" };
  }

  if (!hasOptionalCallBudget(generationStartedAt)) {
    return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "time-budget" };
  }

  try {
    repairAttemptsCount += 1;
    nextPayload = await requestStory(
      client,
      getExpansionModel(),
      buildForbiddenRepairPrompt(input, blueprint, nextStory, remainingForbiddenTerms),
      estimateStoryMaxTokens(getLengthTargetSpec(input.lengthTarget).maxWords)
    );
    const repairedStory = normalizeStoryText(nextPayload.story);
    if (!repairedStory) {
      return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "openai-error" };
    }
    nextStory = repairedStory;
    remainingForbiddenTerms = findForbiddenTerms(nextStory, disallowedTerms);
  } catch {
    return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "openai-error" };
  }

  return { story: nextStory, payload: nextPayload, repairAttemptsCount, remainingForbiddenTerms, stoppedReason: "complete" };
}

function buildBlueprintPrompt(
  input: GenerateStoryRequest,
  beatRange: { min: number; max: number },
  previousError: string,
  attempt: number
): string {
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;
  const repairInstruction =
    attempt > 0
      ? `\nPrevious blueprint was invalid: ${previousError}. Regenerate the full blueprint and satisfy every schema and beat-count requirement.`
      : "";
  const longBeatInstruction = input.lengthTarget === "Long"
    ? `\nFor Long, sceneBeats must contain exactly ${LONG_BLUEPRINT_TARGET_BEATS} beats. Do not return fewer than ${LONG_BLUEPRINT_TARGET_BEATS}. Do not return more than ${LONG_BLUEPRINT_TARGET_BEATS}.`
    : "";

  return `Build a private story blueprint as JSON. The blueprint is for planning only and must never be displayed to the reader.${repairInstruction}${longBeatInstruction}

Return exactly one JSON object with these keys:
- protagonist
- pointOfViewCharacter
- centralAnomaly
- premiseRequirements
- speculativeRuleUnderPressure
- characterDesire
- characterFear
- characterBlindSpot
- narrativeArchitecture
- characterArc
- endingType
- concreteRevelation
- concreteCost
- protagonistPersonalStake
- antagonistOrOpposingForceStake
- concreteIrreversibleCost
- finalDecision
- finalImageOrAction
- changedWorldState
- sceneBeats

premiseRequirements must be an array of 3-12 short strings. Extract explicit, concrete obligations from STORY REQUEST only: required events, objects, witness relationships, locations, separation or convergence, sequence, outcomes, and named character roles. Treat them as hard narrative requirements, not optional inspiration.

sceneBeats must contain ${input.lengthTarget === "Long" ? `exactly ${LONG_BLUEPRINT_TARGET_BEATS}` : `${beatRange.min}-${beatRange.max}`} beats for the selected length target. Each beat must include:
- location
- activeCharacters
- concreteAction
- newInformation
- conflictOrObstacle
- irreversibleTurn
- consequence
- sensoryAnchor
- characterPressure
- characterStake
- materialConsequence

Scene beat style requirements:
- Every sceneBeat must be compact but complete.
- Keep every sceneBeat field short: one concise phrase or sentence, no paragraphs.
- Prefer concrete nouns, verbs, obstacles, and consequences over explanation.
- Do not overload a beat with long prose. The story drafting pass will expand the beat later.

Planning requirements:
- Use the selected narrative architecture, character arc, and ending type.
- Preserve every explicit Story Request premise detail in premiseRequirements and assign each one to scene-level action, not exposition.
- If the Story Request says several characters witness the same event from separate places and converge at a site, the blueprint must show the shared event, each required separate vantage, the movement toward convergence, and the impact or meeting site.
- Do not copy or paraphrase the Story Request as prose. Convert it into dramatized beats, choices, sensory evidence, movement, obstacles, and consequences.
- Make each beat a scene-level action, not a discussion, realization, or philosophical exchange.
- Each beat must introduce new information, a conflict or obstacle, an irreversible turn, and a consequence.
- Each beat must include a sensory anchor, specific character pressure, a personal characterStake, and a materialConsequence visible in the world.
- The blueprint must force a concrete irreversible cost, a final decision, a final concrete image or action, and a changed world state.
- The concrete irreversible cost must be one of: a memory lost or changed, a relationship damaged, a place altered, an object permanently transformed, a rule of the world visibly changed, a road/path/door becoming unavailable, or a record/archive/setlist/instrument altered.
- The concrete irreversible cost must not be only risk, uncertainty, instability, or the future being unknown.
- Major characters must have personal stakes dramatized through behavior: Space Cowboy loses something personal if he stays or runs; Rhiannon risks a truth or relationship; The Architect loses control, authorship, or a beloved pattern.
- Characters may disagree, but they must not speak only as philosophical positions.
- The finalImageOrAction must be visible and concrete, such as a sign changing, a lyric appearing on a physical surface, an unplugged amp humming, a setlist rewriting itself, a door opening to the wrong street, a character leaving or keeping a specific object, or a repeated gesture changing meaning.
- Use third-person limited point of view through the pointOfViewCharacter.
- Avoid abstract engine-like story terms such as "protocol" unless the story defines them in-world through concrete action, objects, and consequences.
- If the materials mention technical meta concepts, translate them into story-world phenomena such as ${STORY_WORLD_TRANSLATIONS.join(", ")}.

GENRE PRESET
${input.genrePreset}

NARRATIVE ARCHITECTURE
${input.narrativeArchitecture}

CHARACTER ARC
${input.characterArc}

ENDING TYPE
${input.endingType}

LENGTH TARGET
${formatLengthTarget(input.lengthTarget)}

POV
${POV}

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST
${input.storySeed}

NARRATIVE RULES
${narrativeRules}`;
}

function buildMissingSceneBeatsPrompt(
  input: GenerateStoryRequest,
  partialBlueprint: StoryBlueprint,
  missingBeatCount: number,
  beatRange: { min: number; max: number }
): string {
  return `The current Long blueprint has ${partialBlueprint.sceneBeats.length} usable sceneBeats, but Long requires ${beatRange.min}-${beatRange.max} and should have exactly ${LONG_BLUEPRINT_TARGET_BEATS}.

Return a JSON object with only this key: sceneBeats.
sceneBeats must contain exactly ${missingBeatCount} additional beats that continue after the existing beats and complete the arc.

Each new beat must be compact but complete. Use short strings for every required field. Do not write paragraphs.
Each beat must include location, activeCharacters, concreteAction, newInformation, conflictOrObstacle, irreversibleTurn, consequence, sensoryAnchor, characterPressure, characterStake, and materialConsequence.
Core fields cannot be empty: location, activeCharacters, concreteAction, conflictOrObstacle, irreversibleTurn, consequence.

Do not repeat existing beats. Add only missing scene-level actions needed to reach a valid Long blueprint before story drafting.

GENRE PRESET
${input.genrePreset}

NARRATIVE ARCHITECTURE
${input.narrativeArchitecture}

CHARACTER ARC
${input.characterArc}

ENDING TYPE
${input.endingType}

PARTIAL BLUEPRINT JSON
${JSON.stringify(partialBlueprint, null, 2)}

STORY REQUEST
${input.storySeed}`;
}

function buildStoryPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  beatRange: { min: number; max: number },
  disallowedTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;
  const forbiddenRule = buildForbiddenLanguageRule(disallowedTerms);
  const beatWordBudgetInstruction = buildBeatWordBudgetInstruction(input, blueprint, lengthSpec);
  const seriesTitlePrompt = input.generationMode === "new_story" ? `\n\n${BLOODWICK_SERIES_TITLE_PROMPT}\n\nReturn series_title as top-level JSON metadata. Do not include the series title as a heading inside story prose.` : "";

  return `Write the final story from this private blueprint. The blueprint is a hidden planning object. Do not summarize it, quote it, display it, or mention it.

Length requirements:
- Minimum: ${lengthSpec.minWords} words.
- Maximum: ${lengthSpec.maxWords} words.
- Selected target: ${formatLengthTarget(input.lengthTarget)}.
- The blueprint has ${blueprint.sceneBeats.length} beats; dramatize every beat as a distinct lived scene or scene movement.
${beatWordBudgetInstruction}

Final story requirements:
- Treat PREMISE REQUIREMENTS as non-negotiable story obligations. Fulfill every one on the page through concrete scene action.
- Dramatize explicit Story Request details naturally through behavior, movement, sensory evidence, choices, obstacles, and consequences. Do not quote, paraphrase, or restate the request as exposition.
- If the premise requires multiple characters to perceive the same event from separate locations and converge at an impact or meeting site, show those separate perceptions, the convergence, and the site in scene.
- Follow every blueprint scene beat in order, turning each beat into lived scene action.
- Do not compress beats into summary.
- Do not skip any beat, personal stake, material consequence, cost, consequence, revelation, final decision, final image/action, changed world state, or premise requirement.
- Do not use section labels, headings, outline language, bullet-like transitions, synopsis language, ---, or "Earlier that evening" as a retelling device.
- Do not make philosophical debate the main action. Characters should want concrete things and reveal beliefs through behavior, choices, omissions, and pressure.
- Reveal the mystery through action, clues, behavior, sensory detail, and consequence.
- Include the protagonistPersonalStake, antagonistOrOpposingForceStake, concreteIrreversibleCost, final decision, finalImageOrAction, and changed world state from the blueprint.
- The concrete irreversible cost must be visible on the page and must not be only risk, uncertainty, instability, or an unknown future.
- The final paragraph must end through the blueprint's finalImageOrAction, not abstract theme. Avoid final abstractions such as "the world was alive", "freedom meant choosing", "the future was uncertain", "hope remained", or "everything had changed".
- Use third-person limited point of view through ${blueprint.pointOfViewCharacter}.
- Preserve character consistency, world rules, and local narrative rules.
- For this length target, a valid blueprint has ${beatRange.min}-${beatRange.max} beats; treat all ${blueprint.sceneBeats.length} provided beats as mandatory.
- Avoid abstract engine-like story terms such as "protocol" unless the story defines them in-world through concrete action, objects, and consequences.
${forbiddenRule}
${buildEpisodeMomentumObjective(input)}${seriesTitlePrompt}
- If source concepts resemble forbidden language, translate them into story-world phenomena: ${STORY_WORLD_TRANSLATIONS.join(", ")}.

PREMISE REQUIREMENTS JSON
${formatPremiseRequirementsForPrompt(blueprint.premiseRequirements)}

PRIVATE BLUEPRINT JSON
${JSON.stringify(blueprint, null, 2)}

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST
${input.storySeed}

NARRATIVE RULES
${narrativeRules}`;
}

function buildCleanStoryRetryPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  disallowedTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const forbiddenRule = buildForbiddenLanguageRule(disallowedTerms);

  return `Write a clean final story from this private blueprint.

Return only valid JSON matching this shape: {"story":"...","charactersUsed":["..."],"rulesReferenced":["..."]}.

The "story" value must contain finished story prose only.
Do not include labels, headings, notes, analysis, prompt instructions, story-fit labels, story seed labels, craft-rule labels, JSON-like context names, private planning text, keyword lists, or blueprint text inside the story.
The story must begin directly with scene prose, concrete action, setting, or dialogue.

Length requirements:
- Minimum: ${lengthSpec.minWords} words.
- Maximum: ${lengthSpec.maxWords} words.
- Selected target: ${formatLengthTarget(input.lengthTarget)}.

Use these private materials only as planning context:

PRIVATE BLUEPRINT JSON
${JSON.stringify(blueprint, null, 2)}

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST
${input.storySeed}

NARRATIVE RULES
${input.storyRules}

${forbiddenRule}`;
}

function buildExpansionPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  story: string,
  attempt: number,
  maxAttempts: number,
  disallowedTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const forbiddenRule = buildForbiddenLanguageRule(disallowedTerms);
  const currentWordCount = countWords(story);
  const beatWordBudgetInstruction = buildBeatWordBudgetInstruction(input, blueprint, lengthSpec);

  return `Rewrite and expand the draft into a complete story that satisfies the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target. This is expansion attempt ${attempt} of ${maxAttempts}.

The current draft is under target: it has ${currentWordCount} words, while the target minimum is ${lengthSpec.minWords} words. Rewrite the whole story so the final story is at least ${lengthSpec.minWords} words and remains no more than ${lengthSpec.maxWords} words.
${beatWordBudgetInstruction}

Compare the draft against the private blueprint and PREMISE REQUIREMENTS. Expand missing or compressed premise details, scene action, sensory detail, character stakes, consequences, transitions, aftermath, costs, revelations, character pressure, sensory anchors, and the changed world state. Do not add filler, summary padding, meta commentary, generic atmosphere, abstract reflection, philosophical padding, or debate that does not change what characters do.

Hard requirements:
- Fulfill every PREMISE REQUIREMENT through concrete scene action; do not quote or restate the Story Request as exposition.
- Dramatize every blueprint scene beat in order as a substantial scene or scene movement.
- Preserve all premiseRequirements, scene beats, character consistency, world rules, final decision, final image/action, changed world state, plot, characters, scene structure, selected length target, and explicit premise requirements.
- Do not summarize the blueprint.
- Do not use section labels, headings, outline language, ---, or "Earlier that evening" as a retelling device.
- Do not make philosophical debate the main action; convert abstract claims into behavior, objects, damage, movement, and choices.
- Reveal mystery through action, clues, behavior, sensory detail, and consequence.
- Include the protagonistPersonalStake, antagonistOrOpposingForceStake, concreteIrreversibleCost, final decision, finalImageOrAction, and changed world state.
- Add connective tissue where the draft jumps: arrival, discovery, reaction, choice, consequence, transition, and aftermath should be visible on the page.
- The final paragraph must end on a concrete visible image or action from finalImageOrAction, not a summary of theme, hope, freedom, change, or uncertainty.
- Avoid abstract engine-like story terms such as "protocol" unless the story defines them in-world through concrete action, objects, and consequences.
${forbiddenRule}

PREMISE REQUIREMENTS JSON
${formatPremiseRequirementsForPrompt(blueprint.premiseRequirements)}

PRIVATE BLUEPRINT JSON
${JSON.stringify(blueprint, null, 2)}

DRAFT STORY
${story}`;
}

function buildForbiddenRepairPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  story: string,
  foundTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  return `Rewrite the story to remove these forbidden terms: ${foundTerms.join(", ")}.

Preserve plot, characters, scene order, every premise requirement, every blueprint beat, concrete cost, final decision, final image/action, changed world state, and the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target. Replace forbidden meta language with concrete story-world phenomena such as ${STORY_WORLD_TRANSLATIONS.join(", ")}.

Do not use section labels, headings, outline language, ---, or "Earlier that evening" as a retelling device. Do not quote, paraphrase, or restate the Story Request as exposition. Avoid abstract engine-like story terms such as "protocol" unless the story defines them in-world through concrete action, objects, and consequences. Return only valid JSON with story, charactersUsed, and rulesReferenced.

PREMISE REQUIREMENTS JSON
${formatPremiseRequirementsForPrompt(blueprint.premiseRequirements)}

PRIVATE BLUEPRINT JSON
${JSON.stringify(blueprint, null, 2)}

STORY TO REPAIR
${story}`;
}

function buildForbiddenLanguageRule(disallowedTerms: string[]): string {
  if (disallowedTerms.length === 0) {
    return "- Uploaded narrative rules explicitly allow the listed technical terms; use them only if they belong inside the story world.";
  }

  return `- Hard forbidden language: do not use these terms in the final story: ${disallowedTerms.join(", ")}.`;
}

function parseBlueprint(rawText: string, beatRange: { min: number; max: number }, options: { allowPartial?: boolean } = {}): BlueprintParseResult {
  const payload = normalizeStoryPayload(rawText) as Partial<StoryBlueprint>;
  return parseBlueprintFromPayload(payload, beatRange, options);
}

function parseBlueprintFromPayload(
  payload: Partial<StoryBlueprint>,
  beatRange: { min: number; max: number },
  options: { allowPartial?: boolean } = {}
): BlueprintParseResult {
  const normalizedBeats = normalizeBlueprintSceneBeats(payload.sceneBeats, beatRange.max);
  const sceneBeats = normalizedBeats.beats;

  if (!options.allowPartial && sceneBeats.length < beatRange.min) {
    throw new Error(`Blueprint included ${sceneBeats.length} usable scene beats; ${beatRange.min}-${beatRange.max} are required.`);
  }

  const blueprint = {
    protagonist: requireString(payload.protagonist, "protagonist"),
    pointOfViewCharacter: requireString(payload.pointOfViewCharacter, "pointOfViewCharacter"),
    centralAnomaly: requireString(payload.centralAnomaly, "centralAnomaly"),
    premiseRequirements: requirePremiseRequirements(payload.premiseRequirements),
    speculativeRuleUnderPressure: requireString(payload.speculativeRuleUnderPressure, "speculativeRuleUnderPressure"),
    characterDesire: requireString(payload.characterDesire, "characterDesire"),
    characterFear: requireString(payload.characterFear, "characterFear"),
    characterBlindSpot: requireString(payload.characterBlindSpot, "characterBlindSpot"),
    narrativeArchitecture: requireString(payload.narrativeArchitecture, "narrativeArchitecture"),
    characterArc: requireString(payload.characterArc, "characterArc"),
    endingType: requireString(payload.endingType, "endingType"),
    concreteRevelation: requireString(payload.concreteRevelation, "concreteRevelation"),
    concreteCost: requireString(payload.concreteCost, "concreteCost"),
    protagonistPersonalStake: requireString(payload.protagonistPersonalStake, "protagonistPersonalStake"),
    antagonistOrOpposingForceStake: requireString(payload.antagonistOrOpposingForceStake, "antagonistOrOpposingForceStake"),
    concreteIrreversibleCost: requireConcreteCost(payload.concreteIrreversibleCost ?? payload.concreteCost),
    finalDecision: requireString(payload.finalDecision, "finalDecision"),
    finalImageOrAction: requireString(payload.finalImageOrAction, "finalImageOrAction"),
    changedWorldState: requireString(payload.changedWorldState, "changedWorldState"),
    sceneBeats
  };

  return {
    blueprint,
    completeBeatCount: sceneBeats.length,
    partialBeatNormalizationUsed: normalizedBeats.normalizationUsed
  };
}

function normalizeBlueprintSceneBeats(value: unknown, maxBeats: number): { beats: BlueprintSceneBeat[]; normalizationUsed: boolean } {
  if (!Array.isArray(value)) {
    return { beats: [], normalizationUsed: false };
  }

  let normalizationUsed = false;
  const beats: BlueprintSceneBeat[] = [];

  for (const item of value) {
    const result = normalizeBlueprintSceneBeat(item);
    normalizationUsed = normalizationUsed || result.normalizationUsed;
    if (result.beat) {
      beats.push(result.beat);
    }
    if (beats.length >= maxBeats) {
      break;
    }
  }

  return { beats, normalizationUsed };
}

function normalizeBlueprintSceneBeat(value: unknown): NormalizedBeatResult {
  if (!value || typeof value !== "object") {
    return { beat: null, normalizationUsed: false };
  }

  const beat = value as Partial<BlueprintSceneBeat>;
  const location = optionalString(beat.location);
  const activeCharacters = normalizeStringList(beat.activeCharacters) ?? [];
  const concreteAction = optionalString(beat.concreteAction);
  const conflictOrObstacle = optionalString(beat.conflictOrObstacle);
  const irreversibleTurn = optionalString(beat.irreversibleTurn);
  const consequence = optionalString(beat.consequence);

  if (!location || activeCharacters.length === 0 || !concreteAction || !conflictOrObstacle || !irreversibleTurn || !consequence) {
    return { beat: null, normalizationUsed: false };
  }

  const normalizedBeat: BlueprintSceneBeat = {
    location,
    activeCharacters,
    concreteAction,
    newInformation: optionalString(beat.newInformation) || irreversibleTurn || consequence,
    conflictOrObstacle,
    irreversibleTurn,
    consequence,
    sensoryAnchor: optionalString(beat.sensoryAnchor) || location,
    characterPressure: optionalString(beat.characterPressure) || conflictOrObstacle,
    characterStake: optionalString(beat.characterStake) || consequence,
    materialConsequence: optionalString(beat.materialConsequence) || consequence
  };

  if (isDiscussionOnlyBeat(normalizedBeat)) {
    return { beat: null, normalizationUsed: false };
  }

  return {
    beat: normalizedBeat,
    normalizationUsed:
      normalizedBeat.newInformation !== optionalString(beat.newInformation) ||
      normalizedBeat.sensoryAnchor !== optionalString(beat.sensoryAnchor) ||
      normalizedBeat.characterPressure !== optionalString(beat.characterPressure) ||
      normalizedBeat.characterStake !== optionalString(beat.characterStake) ||
      normalizedBeat.materialConsequence !== optionalString(beat.materialConsequence)
  };
}

function trimBlueprintBeats(blueprint: StoryBlueprint, maxBeats: number): StoryBlueprint {
  return { ...blueprint, sceneBeats: blueprint.sceneBeats.slice(0, maxBeats) };
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Blueprint missing ${label}.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function requirePremiseRequirements(value: unknown): string[] {
  const requirements = (normalizeStringList(value) ?? []).slice(0, 12);
  if (requirements.length === 0) {
    throw new Error("Blueprint missing premiseRequirements from the Story Request.");
  }
  return requirements;
}

function formatPremiseRequirementsForPrompt(requirements: string[]): string {
  return JSON.stringify(requirements, null, 2);
}

function buildBeatWordBudgetInstruction(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  lengthSpec: (typeof LENGTH_TARGETS)[number]
): string {
  if (input.lengthTarget !== "Long") {
    return "";
  }

  const minimumPerBeat = Math.max(280, Math.floor(lengthSpec.minWords / blueprint.sceneBeats.length));
  const maximumPerBeat = Math.max(minimumPerBeat + 120, Math.ceil(lengthSpec.maxWords / blueprint.sceneBeats.length));
  return `- Long target word budget: aim for roughly ${minimumPerBeat}-${maximumPerBeat} words per blueprint beat on average. Opening, climax, and aftermath may run longer, but every beat must become substantial scene action rather than summary.`;
}

function buildBlueprintDiagnosticsNotice(result: BlueprintRequestResult): string | null {
  if (!result.partialBeatNormalizationUsed && !result.missingBeatRepairAttempted) {
    return null;
  }

  return `Blueprint diagnostics: initial complete beats ${formatOptionalNumber(result.initialBlueprintCompleteBeatCount)}; repair complete beats ${formatOptionalNumber(result.repairBlueprintCompleteBeatCount)}; partial beat normalization used ${result.partialBeatNormalizationUsed ? "yes" : "no"}; missing beat repair attempted ${result.missingBeatRepairAttempted ? "yes" : "no"}; final accepted scene count ${result.finalAcceptedBlueprintSceneCount}.`;
}

function formatBlueprintFailure(
  lastError: string,
  diagnostics: {
    initialBlueprintCompleteBeatCount?: number;
    repairBlueprintCompleteBeatCount?: number;
    partialBeatNormalizationUsed: boolean;
    missingBeatRepairAttempted: boolean;
    finalAcceptedBlueprintSceneCount?: number;
  }
): string {
  return `${lastError} Diagnostics: initial complete beats ${formatOptionalNumber(diagnostics.initialBlueprintCompleteBeatCount)}; repair complete beats ${formatOptionalNumber(diagnostics.repairBlueprintCompleteBeatCount)}; partial beat normalization used ${diagnostics.partialBeatNormalizationUsed ? "yes" : "no"}; missing beat repair attempted ${diagnostics.missingBeatRepairAttempted ? "yes" : "no"}; final accepted scene count ${formatOptionalNumber(diagnostics.finalAcceptedBlueprintSceneCount)}.`;
}

function formatOptionalNumber(value: number | undefined): string {
  return typeof value === "number" ? value.toString() : "unknown";
}

function createGenerationStageError(
  stage: string,
  message: string,
  diagnostics: Partial<StoryDiagnostics> = {}
): Error {
  return Object.assign(new Error(message), {
    storyCleanlinessDiagnostics: {
      storyGenerationFailureStage: stage,
      storyGenerationFailureReason: diagnostics.storyGenerationFailureReason ?? stage,
      storyGenerationFailureSource: diagnostics.storyGenerationFailureSource ?? "model",
      storyGenerationRetryAttempted: diagnostics.storyGenerationRetryAttempted ?? false,
      storyGenerationRetrySucceeded: diagnostics.storyGenerationRetrySucceeded ?? false,
      storyMetadataLeakGuardEnabled: true,
      storyMetadataLeakScanTarget: diagnostics.storyMetadataLeakScanTarget ?? "final-story-prose",
      storyMetadataLeakDetected: diagnostics.storyMetadataLeakDetected ?? false,
      storyMetadataLeakSanitized: diagnostics.storyMetadataLeakSanitized ?? false,
      storyMetadataLeakFinalClean: diagnostics.storyMetadataLeakFinalClean ?? false,
      storyMetadataLeakRemovedPatterns: diagnostics.storyMetadataLeakRemovedPatterns ?? [],
      metadataLeakPatternsFound: diagnostics.metadataLeakPatternsFound ?? [],
      storyRawCandidateLength: diagnostics.storyRawCandidateLength ?? 0,
      storySanitizedCandidateLength: diagnostics.storySanitizedCandidateLength ?? 0,
      storyRepairAttempted: diagnostics.storyRepairAttempted ?? false,
      fallbackDisplayBlocked: true
    } satisfies Partial<StoryDiagnostics>
  });
}

function parseStoryPayload(rawText: string): OpenAIStoryPayload {
  const payload = normalizeStoryPayload(rawText) as ReturnType<typeof normalizeStoryPayload> & { seriesTitle?: unknown; series_title?: unknown };
  const story = normalizeStoryText(payload.story ?? rawText);

  return {
    story,
    seriesTitle: typeof payload.seriesTitle === "string" ? payload.seriesTitle : typeof payload.series_title === "string" ? payload.series_title : null,
    charactersUsed: normalizeStringList(payload.charactersUsed),
    rulesReferenced: normalizeStringList(payload.rulesReferenced)
  };
}

function normalizeList(values: string[] | undefined, fallback: string[]): string[] {
  const source = values && values.length > 0 ? values : fallback;
  return [...new Set(source.map((value) => value.trim()).filter(Boolean))].slice(0, 10);
}

function cleanRulesReferenced(values: string[], disallowedTerms: string[]): string[] {
  return normalizeList(
    values.map((value) => translateMetaTerms(value, disallowedTerms)),
    []
  );
}

function translateMetaTerms(value: string, disallowedTerms: string[]): string {
  return disallowedTerms.reduce((current, term) => {
    const replacement = META_RULE_TRANSLATIONS[term] ?? "story-world pattern";
    return current.replace(buildForbiddenTermRegex(term), (_match, prefix: string, suffix: string) => `${prefix}${replacement}${suffix}`);
  }, value);
}

function getLengthTargetSpec(lengthTarget: LengthTarget) {
  return LENGTH_TARGETS.find((target) => target.value === lengthTarget) ?? LENGTH_TARGETS[1];
}

function getBlueprintBeatRange(lengthTarget: LengthTarget): { min: number; max: number } {
  if (lengthTarget === "First Page Test") {
    return { min: 3, max: 4 };
  }
  if (lengthTarget === "Compact") {
    return { min: 5, max: 7 };
  }
  if (lengthTarget === "Long") {
    return { min: 9, max: 12 };
  }
  return { min: 7, max: 9 };
}

function getMaxExpansionAttempts(lengthTarget: LengthTarget): number {
  if (lengthTarget === "Long") {
    return 3;
  }

  if (lengthTarget === "Standard") {
    return 2;
  }

  return 1;
}

function requireConcreteCost(value: unknown): string {
  const cost = requireString(value, "concreteIrreversibleCost");
  const lowerCost = cost.toLowerCase();
  const hasWeakOnlyCost = WEAK_COST_TERMS.some((term) => lowerCost.includes(term));
  const hasConcreteSignal = CONCRETE_COST_SIGNALS.some((term) => lowerCost.includes(term));

  if (!hasConcreteSignal || (hasWeakOnlyCost && lowerCost.length < 80)) {
    throw new Error("Blueprint concreteIrreversibleCost must be a visible, material, irreversible cost.");
  }

  return cost;
}

function isDiscussionOnlyBeat(beat: Partial<BlueprintSceneBeat>): boolean {
  const actionText = `${beat.concreteAction ?? ""} ${beat.materialConsequence ?? ""}`.toLowerCase();
  return DISCUSSION_ONLY_BEAT_TERMS.some((term) => actionText.includes(term));
}

function hasOptionalCallBudget(generationStartedAt: number): boolean {
  return Date.now() - generationStartedAt < OPTIONAL_CALL_TIME_BUDGET_MS;
}

function formatLengthTarget(lengthTarget: LengthTarget): string {
  const target = getLengthTargetSpec(lengthTarget);
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}

function estimateStoryMaxTokens(maxWords: number): number {
  return Math.min(16_000, Math.ceil(maxWords * 3.2));
}

export function getDisallowedForbiddenTerms(storyRules: string): string[] {
  const lowerRules = storyRules.toLowerCase();
  return TECHNICAL_FORBIDDEN_TERMS.filter((term) => !lowerRules.includes(`allow ${term.toLowerCase()}`));
}

export function findForbiddenTerms(story: string, disallowedTerms: string[]): string[] {
  return disallowedTerms.filter((term) => buildForbiddenTermRegex(term).test(story));
}

function buildForbiddenTermRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, "i");
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function createStoryTitleFromText(story: string): string {
  const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story";
  const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine;
  const compact = firstSentence.replace(/^#+\s*/, "").replace(/\s+/g, " ").trim();
  return compact.length <= 72 ? compact : `${compact.slice(0, 72).replace(/[\s,.;:]+$/g, "")}...`;
}
