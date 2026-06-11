import OpenAI from "openai";
import { LENGTH_TARGETS } from "./types";
import type { GenerateStoryRequest, GenerateStoryResponse, LengthTarget, StoryDiagnostics } from "./types";
import { normalizeStoryPayload, normalizeStoryText, normalizeStringList } from "./story-output";
import {
  countWords,
  inferCharactersUsed,
  inferRulesReferenced
} from "./story-analysis";

type OpenAIStoryPayload = {
  story: string;
  charactersUsed?: string[];
  rulesReferenced?: string[];
};

type StoryBlueprint = {
  protagonist: string;
  pointOfViewCharacter: string;
  centralAnomaly: string;
  speculativeRuleUnderPressure: string;
  characterDesire: string;
  characterFear: string;
  characterBlindSpot: string;
  narrativeArchitecture: string;
  characterArc: string;
  endingType: string;
  concreteRevelation: string;
  concreteCost: string;
  finalDecision: string;
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
};

type BlueprintRequestResult = {
  blueprint: StoryBlueprint;
  repairAttemptsCount: number;
};

type ForbiddenRepairResult = {
  story: string;
  payload: OpenAIStoryPayload;
  repairAttemptsCount: number;
};

const DEFAULT_BLUEPRINT_MODEL = "gpt-4.1-mini";
const DEFAULT_STORY_MODEL = "gpt-4.1";
const DEFAULT_EXPANSION_MODEL = "gpt-4.1";
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
    finalWordCount: 0,
    expansionAttempted: false,
    expansionSucceeded: false,
    expansionAttemptsCount: 0,
    repairAttemptsCount: 0,
    underTargetNotice: null,
    blueprintGenerated: false,
    blueprintSceneCount: 0,
    blueprintFailedReason: null,
    ...overrides
  };
}

export async function generateOpenAIStory(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const blueprintRange = getBlueprintBeatRange(input.lengthTarget);
  const disallowedTerms = getDisallowedForbiddenTerms(input.storyRules);
  let repairAttemptsCount = 0;
  let blueprint: StoryBlueprint;

  try {
    const blueprintResult = await requestBlueprint(client, input, blueprintRange);
    blueprint = blueprintResult.blueprint;
    repairAttemptsCount += blueprintResult.repairAttemptsCount;
  } catch (error) {
    throw new Error(`Blueprint generation failed: ${summarizeError(error)}`);
  }

  let payload = await requestStory(
    client,
    getStoryModel(),
    buildStoryPrompt(input, blueprint, blueprintRange, disallowedTerms),
    estimateStoryMaxTokens(lengthSpec.maxWords)
  );
  let story = normalizeStoryText(payload.story);

  if (!story) {
    throw new Error("OpenAI response did not include a story.");
  }

  let forbiddenRepair = await repairForbiddenTermsIfNeeded(client, input, blueprint, story, payload, disallowedTerms);
  story = forbiddenRepair.story;
  payload = forbiddenRepair.payload;
  repairAttemptsCount += forbiddenRepair.repairAttemptsCount;

  let wordCount = countWords(story);
  let expansionAttemptsCount = 0;
  let expansionSucceeded = wordCount >= lengthSpec.minWords;

  while (wordCount < lengthSpec.minWords && expansionAttemptsCount < 3) {
    expansionAttemptsCount += 1;
    payload = await requestStory(
      client,
      getExpansionModel(),
      buildExpansionPrompt(input, blueprint, story, expansionAttemptsCount, disallowedTerms),
      estimateStoryMaxTokens(lengthSpec.maxWords)
    );
    const expandedStory = normalizeStoryText(payload.story);
    if (!expandedStory) {
      throw new Error(`OpenAI response did not include a story after expansion attempt ${expansionAttemptsCount}.`);
    }

    story = expandedStory;
    forbiddenRepair = await repairForbiddenTermsIfNeeded(client, input, blueprint, story, payload, disallowedTerms);
    story = forbiddenRepair.story;
    payload = forbiddenRepair.payload;
    repairAttemptsCount += forbiddenRepair.repairAttemptsCount;
    wordCount = countWords(story);
    expansionSucceeded = wordCount >= lengthSpec.minWords;
  }

  const underTargetNotice =
    wordCount < lengthSpec.minWords
      ? `Final story is below the selected ${formatLengthTarget(input.lengthTarget)} target after ${expansionAttemptsCount} expansion attempts.`
      : null;
  const ruleSources = `${input.worldBible}\n\n${input.storyRules || DEFAULT_NARRATIVE_RULES}`;

  return {
    story,
    metadata: {
      wordCount,
      charactersUsed: normalizeList(payload.charactersUsed, inferCharactersUsed(story, input.characterProfiles)),
      rulesReferenced: normalizeList(payload.rulesReferenced, inferRulesReferenced(story, ruleSources)),
      source: "openai",
      diagnostics: getOpenAIDiagnostics({
        openAIRequestAttempted: true,
        openAIRequestSucceeded: true,
        notice: underTargetNotice,
        genrePreset: input.genrePreset,
        narrativeArchitecture: input.narrativeArchitecture,
        characterArc: input.characterArc,
        endingType: input.endingType,
        lengthTarget: formatLengthTarget(input.lengthTarget),
        finalWordCount: wordCount,
        expansionAttempted: expansionAttemptsCount > 0,
        expansionSucceeded,
        expansionAttemptsCount,
        repairAttemptsCount,
        underTargetNotice,
        blueprintGenerated: true,
        blueprintSceneCount: blueprint.sceneBeats.length,
        blueprintFailedReason: null
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
      const blueprint = parseBlueprint(response.choices[0]?.message.content ?? "", beatRange);
      return { blueprint, repairAttemptsCount };
    } catch (error) {
      lastError = summarizeError(error);
      repairAttemptsCount += 1;
    }
  }

  throw new Error(lastError);
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
  disallowedTerms: string[]
): Promise<ForbiddenRepairResult> {
  let nextStory = story;
  let nextPayload = payload;
  let repairAttemptsCount = 0;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const foundTerms = findForbiddenTerms(nextStory, disallowedTerms);
    if (foundTerms.length === 0) {
      break;
    }

    repairAttemptsCount += 1;
    nextPayload = await requestStory(
      client,
      getExpansionModel(),
      buildForbiddenRepairPrompt(input, blueprint, nextStory, foundTerms),
      estimateStoryMaxTokens(getLengthTargetSpec(input.lengthTarget).maxWords)
    );
    const repairedStory = normalizeStoryText(nextPayload.story);
    if (!repairedStory) {
      throw new Error("OpenAI response did not include a story after forbidden-term repair.");
    }
    nextStory = repairedStory;
  }

  return { story: nextStory, payload: nextPayload, repairAttemptsCount };
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

  return `Build a private story blueprint as JSON. The blueprint is for planning only and must never be displayed to the reader.${repairInstruction}

Return exactly one JSON object with these keys:
- protagonist
- pointOfViewCharacter
- centralAnomaly
- speculativeRuleUnderPressure
- characterDesire
- characterFear
- characterBlindSpot
- narrativeArchitecture
- characterArc
- endingType
- concreteRevelation
- concreteCost
- finalDecision
- changedWorldState
- sceneBeats

sceneBeats must contain ${beatRange.min}-${beatRange.max} beats for the selected length target. Each beat must include:
- location
- activeCharacters
- concreteAction
- newInformation
- conflictOrObstacle
- irreversibleTurn
- consequence
- sensoryAnchor
- characterPressure

Planning requirements:
- Use the selected narrative architecture, character arc, and ending type.
- Make each beat a scene-level action, not a discussion topic.
- Each beat must introduce new information, a conflict or obstacle, an irreversible turn, and a consequence.
- Each beat must include a sensory anchor and specific character pressure.
- The blueprint must force a concrete cost, a final decision, and a changed world state.
- Use third-person limited point of view through the pointOfViewCharacter.
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

function buildStoryPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  beatRange: { min: number; max: number },
  disallowedTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;
  const forbiddenRule = buildForbiddenLanguageRule(disallowedTerms);

  return `Write the final story from this private blueprint. The blueprint is a hidden planning object. Do not summarize it, quote it, display it, or mention it.

Length requirements:
- Minimum: ${lengthSpec.minWords} words.
- Maximum: ${lengthSpec.maxWords} words.
- Selected target: ${formatLengthTarget(input.lengthTarget)}.
- The blueprint has ${blueprint.sceneBeats.length} beats; dramatize every beat as a distinct lived scene or scene movement.

Final story requirements:
- Follow every blueprint scene beat in order, turning each beat into lived scene action.
- Do not compress beats into summary.
- Do not skip any beat, cost, consequence, revelation, final decision, or changed world state.
- Do not use section labels, headings, outline language, bullet-like transitions, synopsis language, ---, or "Earlier that evening" as a retelling device.
- Do not make philosophical debate the main action.
- Reveal the mystery through action, clues, behavior, sensory detail, and consequence.
- Include the concrete cost, final decision, and changed world state from the blueprint.
- Use third-person limited point of view through ${blueprint.pointOfViewCharacter}.
- Preserve character consistency, world rules, and local narrative rules.
- For this length target, a valid blueprint has ${beatRange.min}-${beatRange.max} beats; treat all ${blueprint.sceneBeats.length} provided beats as mandatory.
${forbiddenRule}
- If source concepts resemble forbidden language, translate them into story-world phenomena: ${STORY_WORLD_TRANSLATIONS.join(", ")}.

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

function buildExpansionPrompt(
  input: GenerateStoryRequest,
  blueprint: StoryBlueprint,
  story: string,
  attempt: number,
  disallowedTerms: string[]
): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const forbiddenRule = buildForbiddenLanguageRule(disallowedTerms);

  return `Rewrite and expand the draft into a complete story that satisfies the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target. This is expansion attempt ${attempt} of 3.

Compare the draft against the private blueprint. Expand missing or compressed scenes, consequences, costs, revelations, character pressure, sensory anchors, and the changed world state. Do not merely add more dialogue, atmosphere, reflection, or debate.

Hard requirements:
- Dramatize every blueprint scene beat in order.
- Do not summarize the blueprint.
- Do not use section labels, headings, outline language, ---, or "Earlier that evening" as a retelling device.
- Do not make philosophical debate the main action.
- Reveal mystery through action, clues, behavior, sensory detail, and consequence.
- Include a concrete cost, final decision, and changed world state.
- Preserve the plot, characters, scene structure, and selected length target.
${forbiddenRule}

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

Preserve plot, characters, scene order, every blueprint beat, concrete cost, final decision, changed world state, and the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target. Replace forbidden meta language with concrete story-world phenomena such as ${STORY_WORLD_TRANSLATIONS.join(", ")}.

Do not use section labels, headings, outline language, ---, or "Earlier that evening" as a retelling device. Return only valid JSON with story, charactersUsed, and rulesReferenced.

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

function parseBlueprint(rawText: string, beatRange: { min: number; max: number }): StoryBlueprint {
  const payload = normalizeStoryPayload(rawText) as Partial<StoryBlueprint>;
  const sceneBeats = Array.isArray(payload.sceneBeats)
    ? payload.sceneBeats.filter(isBlueprintSceneBeat).slice(0, beatRange.max)
    : [];

  if (sceneBeats.length < beatRange.min) {
    throw new Error(`Blueprint included ${sceneBeats.length} complete scene beats; ${beatRange.min}-${beatRange.max} are required.`);
  }

  return {
    protagonist: requireString(payload.protagonist, "protagonist"),
    pointOfViewCharacter: requireString(payload.pointOfViewCharacter, "pointOfViewCharacter"),
    centralAnomaly: requireString(payload.centralAnomaly, "centralAnomaly"),
    speculativeRuleUnderPressure: requireString(payload.speculativeRuleUnderPressure, "speculativeRuleUnderPressure"),
    characterDesire: requireString(payload.characterDesire, "characterDesire"),
    characterFear: requireString(payload.characterFear, "characterFear"),
    characterBlindSpot: requireString(payload.characterBlindSpot, "characterBlindSpot"),
    narrativeArchitecture: requireString(payload.narrativeArchitecture, "narrativeArchitecture"),
    characterArc: requireString(payload.characterArc, "characterArc"),
    endingType: requireString(payload.endingType, "endingType"),
    concreteRevelation: requireString(payload.concreteRevelation, "concreteRevelation"),
    concreteCost: requireString(payload.concreteCost, "concreteCost"),
    finalDecision: requireString(payload.finalDecision, "finalDecision"),
    changedWorldState: requireString(payload.changedWorldState, "changedWorldState"),
    sceneBeats
  };
}

function isBlueprintSceneBeat(value: unknown): value is BlueprintSceneBeat {
  if (!value || typeof value !== "object") {
    return false;
  }

  const beat = value as Partial<BlueprintSceneBeat>;
  return Boolean(
    beat.location &&
      Array.isArray(beat.activeCharacters) &&
      beat.concreteAction &&
      beat.newInformation &&
      beat.conflictOrObstacle &&
      beat.irreversibleTurn &&
      beat.consequence &&
      beat.sensoryAnchor &&
      beat.characterPressure
  );
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Blueprint missing ${label}.`);
  }
  return value.trim();
}

function parseStoryPayload(rawText: string): OpenAIStoryPayload {
  const payload = normalizeStoryPayload(rawText);
  const story = normalizeStoryText(payload.story ?? rawText);

  return {
    story,
    charactersUsed: normalizeStringList(payload.charactersUsed),
    rulesReferenced: normalizeStringList(payload.rulesReferenced)
  };
}

function normalizeList(values: string[] | undefined, fallback: string[]): string[] {
  const source = values && values.length > 0 ? values : fallback;
  return [...new Set(source.map((value) => value.trim()).filter(Boolean))].slice(0, 10);
}

function getLengthTargetSpec(lengthTarget: LengthTarget) {
  return LENGTH_TARGETS.find((target) => target.value === lengthTarget) ?? LENGTH_TARGETS[1];
}

function getBlueprintBeatRange(lengthTarget: LengthTarget): { min: number; max: number } {
  if (lengthTarget === "Compact") {
    return { min: 5, max: 7 };
  }
  if (lengthTarget === "Long") {
    return { min: 9, max: 12 };
  }
  return { min: 7, max: 9 };
}

function formatLengthTarget(lengthTarget: LengthTarget): string {
  const target = getLengthTargetSpec(lengthTarget);
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}

function estimateStoryMaxTokens(maxWords: number): number {
  return Math.min(16_000, Math.ceil(maxWords * 3.2));
}

function getDisallowedForbiddenTerms(storyRules: string): string[] {
  const lowerRules = storyRules.toLowerCase();
  return TECHNICAL_FORBIDDEN_TERMS.filter((term) => !lowerRules.includes(`allow ${term.toLowerCase()}`));
}

function findForbiddenTerms(story: string, disallowedTerms: string[]): string[] {
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
