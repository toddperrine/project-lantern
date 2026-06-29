import OpenAI from "openai";
import { countWords } from "./story-analysis";
import { normalizeStoryPayload, normalizeStoryText } from "./story-output";
import type { GenerateStoryRequest, GenerateStoryResponse, StoryDiagnostics } from "./types";

export type EpisodeMomentumScores = {
  curiosity: number;
  escalation: number;
  unresolved_tension: number;
  character_investment: number;
  resolution_pressure: number;
  ending_strength: number;
  cheap_cliffhanger_risk: number;
  continue_probability: number;
};

export type EpisodeMomentumDiagnostics = {
  active: boolean;
  activation_reason: string;
  scores: EpisodeMomentumScores;
  repair_ran: boolean;
  repair_reason: string;
  json_parse_failed: boolean;
  fallback_used: boolean;
};

type EpisodeMomentumEvaluation = {
  active: true;
  activation_reason: string;
  curiosity: number;
  escalation: number;
  unresolved_tension: number;
  character_investment: number;
  resolution_pressure: number;
  ending_strength: number;
  cheap_cliffhanger_risk: number;
  repair_recommended: boolean;
  repair_reason: string;
};

type EpisodeMomentumEngineOptions = {
  evaluate?: (storyText: string, input: GenerateStoryRequest) => Promise<EpisodeMomentumEvaluation>;
  repair?: (storyText: string, evaluation: EpisodeMomentumEvaluation, input: GenerateStoryRequest) => Promise<string>;
};

const TRIGGER_TERMS = [
  "scary",
  "horror",
  "eerie",
  "suspense",
  "thriller",
  "mystery",
  "dark",
  "unsettling",
  "creepy",
  "supernatural",
  "serial",
  "serialized",
  "continue",
  "continue-series"
];

const EMPTY_SCORES: EpisodeMomentumScores = {
  curiosity: 0,
  escalation: 0,
  unresolved_tension: 0,
  character_investment: 0,
  resolution_pressure: 0,
  ending_strength: 0,
  cheap_cliffhanger_risk: 0,
  continue_probability: 0
};

export function shouldUseEpisodeMomentumEngine(input: GenerateStoryRequest): boolean {
  return getEpisodeMomentumActivationReason(input) !== "inactive";
}

export function getEpisodeMomentumActivationReason(input: GenerateStoryRequest): string {
  if (input.generationMode === "continue_series") {
    return "continue_series";
  }

  if (input.generationMode !== "new_story") {
    return "inactive";
  }

  const haystack = buildActivationSearchText(input);
  const matchedTerm = TRIGGER_TERMS.find((term) => haystack.includes(term.toLowerCase()));
  return matchedTerm ? `new_story_trigger:${matchedTerm}` : "inactive";
}

export function buildEpisodeMomentumObjective(input: GenerateStoryRequest): string {
  if (!shouldUseEpisodeMomentumEngine(input)) return "";

  return `EPISODE MOMENTUM OBJECTIVE
This story is being shaped for serialized reader momentum. Preserve every existing quality, safety, reader-profile, craft, and continuity instruction above, and add these ending goals without replacing them:
- Maximize reader desire to continue the next episode.
- Deliver meaningful story progress before the ending; do not substitute a hook for consequence.
- Avoid full emotional or plot closure.
- Preserve at least one major unresolved question.
- End after a revelation, escalation, reversal, new danger, impossible detail, or disturbing discovery.
- Avoid ending after the threat is fully defeated, fully explained, or emotionally resolved.
- Avoid generic shock endings.
- Make the final hook story-specific and earned from the characters, world rules, and events on the page.
- Maintain character investment, not just plot mechanics.
- For Continue Series, honor the prior chapter context and any user direction while making this episode feel necessary to continue.`;
}

export function calculateContinueProbability(scores: Omit<EpisodeMomentumScores, "continue_probability">): number {
  return clampInteger(
    Math.round(
      0.22 * scores.curiosity +
        0.20 * scores.escalation +
        0.22 * scores.unresolved_tension +
        0.14 * scores.character_investment +
        0.22 * scores.ending_strength -
        0.20 * scores.resolution_pressure -
        0.12 * scores.cheap_cliffhanger_risk
    )
  );
}

export async function applyEpisodeMomentumEngine(
  input: GenerateStoryRequest,
  response: GenerateStoryResponse,
  options: EpisodeMomentumEngineOptions = {}
): Promise<GenerateStoryResponse> {
  const activationReason = getEpisodeMomentumActivationReason(input);

  if (activationReason === "inactive" || response.metadata.source !== "openai") {
    return withEpisodeMomentumDiagnostics(response, {
      active: false,
      activation_reason: activationReason,
      scores: EMPTY_SCORES,
      repair_ran: false,
      repair_reason: "inactive",
      json_parse_failed: false,
      fallback_used: false
    });
  }

  let evaluation: EpisodeMomentumEvaluation;
  try {
    evaluation = options.evaluate
      ? await options.evaluate(response.story, input)
      : await evaluateEpisodeMomentum(response.story, input, activationReason);
  } catch {
    return withEpisodeMomentumDiagnostics(response, {
      active: true,
      activation_reason: activationReason,
      scores: EMPTY_SCORES,
      repair_ran: false,
      repair_reason: "evaluation-json-parse-failed",
      json_parse_failed: true,
      fallback_used: true
    });
  }

  const baseScores = normalizeEvaluationScores(evaluation);
  const continueProbability = calculateContinueProbability(baseScores);
  const scores = { ...baseScores, continue_probability: continueProbability };
  const repairReason = getRepairReason(scores, evaluation.repair_reason);

  if (!repairReason) {
    return withEpisodeMomentumDiagnostics(response, {
      active: true,
      activation_reason: evaluation.activation_reason || activationReason,
      scores,
      repair_ran: false,
      repair_reason: evaluation.repair_reason || "repair-not-needed",
      json_parse_failed: false,
      fallback_used: false
    });
  }

  let repairedStory = "";
  try {
    repairedStory = options.repair
      ? await options.repair(response.story, evaluation, input)
      : await repairEpisodeEnding(response.story, evaluation, input);
  } catch {
    repairedStory = "";
  }

  const disallowedTerms = await getDisallowedForbiddenTerms(input.storyRules);
  const forbiddenTerms = await findForbiddenTerms(repairedStory, disallowedTerms);
  const repairAccepted = isLocallyValidRepair(response.story, repairedStory) && forbiddenTerms.length === 0;

  if (!repairAccepted) {
    return withEpisodeMomentumDiagnostics(response, {
      active: true,
      activation_reason: evaluation.activation_reason || activationReason,
      scores,
      repair_ran: true,
      repair_reason: forbiddenTerms.length ? `${repairReason}; repair rejected because forbidden terms were introduced: ${forbiddenTerms.join(", ")}` : `${repairReason}; repair rejected by local validation`,
      json_parse_failed: false,
      fallback_used: true
    });
  }

  const finalWordCount = countWords(repairedStory);
  return withEpisodeMomentumDiagnostics(
    {
      ...response,
      story: repairedStory,
      metadata: {
        ...response.metadata,
        wordCount: finalWordCount,
        diagnostics: {
          ...response.metadata.diagnostics,
          finalWordCount
        }
      }
    },
    {
      active: true,
      activation_reason: evaluation.activation_reason || activationReason,
      scores,
      repair_ran: true,
      repair_reason: repairReason,
      json_parse_failed: false,
      fallback_used: false
    }
  );
}

async function evaluateEpisodeMomentum(
  storyText: string,
  input: GenerateStoryRequest,
  activationReason: string
): Promise<EpisodeMomentumEvaluation> {
  const { getStoryModel } = await import("./openai-generator");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: getStoryModel(),
    temperature: 0.15,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Evaluate serialized episode momentum. Return only strict JSON with the exact requested keys and integer scores from 0 to 100." },
      { role: "user", content: buildEvaluationPrompt(storyText, input, activationReason) }
    ]
  });

  return parseEpisodeMomentumEvaluation(response.choices[0]?.message.content ?? "");
}

async function repairEpisodeEnding(
  storyText: string,
  evaluation: EpisodeMomentumEvaluation,
  input: GenerateStoryRequest
): Promise<string> {
  const { getExpansionModel } = await import("./openai-generator");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.chat.completions.create({
    model: getExpansionModel(),
    temperature: 0.55,
    max_tokens: Math.min(16_000, Math.ceil(countWords(storyText) * 3.2)),
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are a serialized fiction ending editor. Return only valid JSON shaped as {\"story\":\"...\"}." },
      { role: "user", content: buildRepairPrompt(storyText, evaluation, input) }
    ]
  });
  const payload = normalizeStoryPayload(response.choices[0]?.message.content ?? "");
  return normalizeStoryText(payload.story);
}

function parseEpisodeMomentumEvaluation(rawText: string): EpisodeMomentumEvaluation {
  const payload = normalizeStoryPayload(rawText) as Partial<EpisodeMomentumEvaluation>;
  if (payload.active !== true || typeof payload.activation_reason !== "string" || typeof payload.repair_recommended !== "boolean" || typeof payload.repair_reason !== "string") {
    throw new Error("Episode Momentum evaluation JSON did not match the required contract.");
  }

  return {
    active: true,
    activation_reason: payload.activation_reason,
    curiosity: requireScore(payload.curiosity),
    escalation: requireScore(payload.escalation),
    unresolved_tension: requireScore(payload.unresolved_tension),
    character_investment: requireScore(payload.character_investment),
    resolution_pressure: requireScore(payload.resolution_pressure),
    ending_strength: requireScore(payload.ending_strength),
    cheap_cliffhanger_risk: requireScore(payload.cheap_cliffhanger_risk),
    repair_recommended: payload.repair_recommended,
    repair_reason: payload.repair_reason
  };
}

function buildEvaluationPrompt(storyText: string, input: GenerateStoryRequest, activationReason: string): string {
  return `Evaluate the final story for Episode Momentum Engine v1.

Return exactly this strict JSON shape and no other keys:
{
  "active": true,
  "activation_reason": "string",
  "curiosity": 0,
  "escalation": 0,
  "unresolved_tension": 0,
  "character_investment": 0,
  "resolution_pressure": 0,
  "ending_strength": 0,
  "cheap_cliffhanger_risk": 0,
  "repair_recommended": false,
  "repair_reason": "string"
}

All numeric fields must be integers from 0 to 100. Use activation_reason: ${activationReason}.
Score high resolution_pressure when the ending fully defeats, fully explains, or emotionally resolves the threat.
Score high cheap_cliffhanger_risk when the hook is generic, arbitrary, or disconnected from character/world consequences.

GENERATION MODE
${input.generationMode}

GENRE
${input.genrePreset}

STORY REQUEST
${input.storySeed}

STORY TEXT
${storyText}`;
}

function buildRepairPrompt(storyText: string, evaluation: EpisodeMomentumEvaluation, input: GenerateStoryRequest): string {
  return `Rewrite the full final story text, changing only the final movement/ending enough to improve serialized episode momentum.

Repair reason: ${evaluation.repair_reason}

Hard preservation rules:
- Preserve names.
- Preserve setting.
- Preserve timeline.
- Preserve facts.
- Preserve prior discoveries.
- Preserve supernatural rules.
- Preserve tone.
- Preserve user direction.
- Preserve Continue Series continuity.
- Preserve the central event outcome.
- Do not restart, summarize, outline, or replace the story.
- Return the full final story text, not only the revised ending.
- Avoid forbidden meta/technical language from craft instructions.

Episode Momentum goals:
${buildEpisodeMomentumObjective(input)}

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST / CONTINUITY
${input.storySeed}

CURRENT STORY
${storyText}`;
}

function buildActivationSearchText(input: GenerateStoryRequest): string {
  return [
    input.storySeed,
    input.storyRules,
    input.generationMode,
    input.generationTrigger,
    input.personalizationContext,
    input.continuationStoryId,
    input.generationIdentity?.generationMode,
    input.generationIdentity?.storyId,
    input.generationIdentity?.seriesId,
    input.generationIdentity?.sourceStoryId,
    input.generationIdentity?.parentSeriesId,
    input.readerMood?.mood,
    input.readerMood?.desiredFeeling,
    input.readerMood?.needRightNow,
    input.readerMood?.avoidances
  ].filter(Boolean).join("\n").toLowerCase();
}

function normalizeEvaluationScores(evaluation: EpisodeMomentumEvaluation): Omit<EpisodeMomentumScores, "continue_probability"> {
  return {
    curiosity: clampInteger(evaluation.curiosity),
    escalation: clampInteger(evaluation.escalation),
    unresolved_tension: clampInteger(evaluation.unresolved_tension),
    character_investment: clampInteger(evaluation.character_investment),
    resolution_pressure: clampInteger(evaluation.resolution_pressure),
    ending_strength: clampInteger(evaluation.ending_strength),
    cheap_cliffhanger_risk: clampInteger(evaluation.cheap_cliffhanger_risk)
  };
}

function getRepairReason(scores: EpisodeMomentumScores, evaluationReason: string): string {
  const reasons = [
    scores.continue_probability < 70 ? `continue_probability ${scores.continue_probability} < 70` : "",
    scores.resolution_pressure > 70 ? `resolution_pressure ${scores.resolution_pressure} > 70` : "",
    scores.ending_strength < 55 ? `ending_strength ${scores.ending_strength} < 55` : "",
    scores.cheap_cliffhanger_risk > 70 ? `cheap_cliffhanger_risk ${scores.cheap_cliffhanger_risk} > 70` : ""
  ].filter(Boolean);

  return reasons.length ? [reasons.join("; "), evaluationReason].filter(Boolean).join("; ") : "";
}

function withEpisodeMomentumDiagnostics(response: GenerateStoryResponse, episodeMomentum: EpisodeMomentumDiagnostics): GenerateStoryResponse {
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        episodeMomentum
      } as StoryDiagnostics
    }
  };
}

function isLocallyValidRepair(originalStory: string, repairedStory: string): boolean {
  if (!repairedStory.trim()) return false;
  const originalWordCount = countWords(originalStory);
  const repairedWordCount = countWords(repairedStory);
  if (repairedWordCount < Math.max(100, Math.floor(originalWordCount * 0.75))) return false;

  const originalNames = Array.from(new Set(originalStory.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) ?? [])).slice(0, 8);
  if (originalNames.length > 0) {
    const retainedNames = originalNames.filter((name) => repairedStory.includes(name)).length;
    if (retainedNames < Math.ceil(originalNames.length * 0.5)) return false;
  }

  return true;
}

async function getDisallowedForbiddenTerms(storyRules: string): Promise<string[]> {
  const helpers = await import("./openai-generator");
  return helpers.getDisallowedForbiddenTerms(storyRules);
}

async function findForbiddenTerms(story: string, disallowedTerms: string[]): Promise<string[]> {
  if (!story) return [];
  const helpers = await import("./openai-generator");
  return helpers.findForbiddenTerms(story, disallowedTerms);
}

function requireScore(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 100) {
    throw new Error("Episode Momentum score must be an integer from 0 to 100.");
  }
  return value;
}

function clampInteger(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
