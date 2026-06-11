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
};

const DEFAULT_MODEL = "gpt-4.1-mini";
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
const TECHNICAL_FORBIDDEN_TERMS = ["AI", "prompt", "model", "dataset", "simulation", "generated", "source material", "uploaded file"];
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
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getOpenAIDiagnostics(overrides: Partial<StoryDiagnostics> = {}): StoryDiagnostics {
  const apiKeyDetected = hasOpenAIKey();

  return {
    openAIEnabled: apiKeyDetected,
    apiKeyDetected,
    modelRequested: getOpenAIModel(),
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
    underTargetNotice: null,
    blueprintGenerated: false,
    blueprintSceneCount: 0,
    blueprintFailedReason: null,
    ...overrides
  };
}

export async function generateOpenAIStory(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  let blueprint: StoryBlueprint;

  try {
    blueprint = await requestBlueprint(client, input);
  } catch (error) {
    throw new Error(`Blueprint generation failed: ${summarizeError(error)}`);
  }

  const initialPayload = await requestStory(
    client,
    buildStoryPrompt(input, blueprint),
    estimateStoryMaxTokens(lengthSpec.maxWords)
  );
  let story = normalizeStoryText(initialPayload.story);
  let payload = initialPayload;

  if (!story) {
    throw new Error("OpenAI response did not include a story.");
  }

  let wordCount = countWords(story);
  let expansionAttempted = false;
  let expansionSucceeded = false;

  if (wordCount < lengthSpec.minWords) {
    expansionAttempted = true;
    payload = await requestStory(
      client,
      buildExpansionPrompt(input, blueprint, story),
      estimateStoryMaxTokens(lengthSpec.maxWords)
    );
    const expandedStory = normalizeStoryText(payload.story);
    if (!expandedStory) {
      throw new Error("OpenAI response did not include a story after expansion.");
    }

    story = expandedStory;
    wordCount = countWords(story);
    expansionSucceeded = wordCount >= lengthSpec.minWords;
  }

  const underTargetNotice =
    wordCount < lengthSpec.minWords
      ? `Final story is below the selected ${formatLengthTarget(input.lengthTarget)} target.`
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
        expansionAttempted,
        expansionSucceeded,
        underTargetNotice,
        blueprintGenerated: true,
        blueprintSceneCount: blueprint.sceneBeats.length,
        blueprintFailedReason: null
      })
    }
  };
}

async function requestBlueprint(client: OpenAI, input: GenerateStoryRequest): Promise<StoryBlueprint> {
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.45,
    max_tokens: 3500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Create private planning JSON for original short fiction. Return only valid JSON. Do not write prose, notes, markdown, or commentary."
      },
      {
        role: "user",
        content: buildBlueprintPrompt(input)
      }
    ]
  });

  return parseBlueprint(response.choices[0]?.message.content ?? "");
}

async function requestStory(client: OpenAI, prompt: string, maxTokens: number): Promise<OpenAIStoryPayload> {
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.78,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a literary short story engine for creators. Write original fiction as if for a literary magazine. Return only valid JSON matching this shape: {\"story\":\"...\",\"charactersUsed\":[\"...\"],\"rulesReferenced\":[\"...\"]}. The story value must contain only finished prose, never JSON text, labels, headings, bullets, notes, outlines, or commentary."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return parseStoryPayload(response.choices[0]?.message.content ?? "");
}

function buildBlueprintPrompt(input: GenerateStoryRequest): string {
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;

  return `Build a private story blueprint as JSON. The blueprint is for planning only and must never be displayed to the reader.

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

sceneBeats must contain 5-9 beats. Each beat must include:
- location
- activeCharacters
- concreteAction
- newInformation
- conflictOrObstacle
- irreversibleTurn
- consequence

Planning requirements:
- Use the selected narrative architecture, character arc, and ending type.
- Make each beat a scene-level action, not a discussion topic.
- Each beat must introduce new information, a conflict or obstacle, an irreversible turn, and a consequence.
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

function buildStoryPrompt(input: GenerateStoryRequest, blueprint: StoryBlueprint): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;
  const forbiddenRule = buildForbiddenLanguageRule(input.storyRules);

  return `Write the final story from this private blueprint. The blueprint is a hidden planning object. Do not summarize it, quote it, display it, or mention it.

Length requirements:
- Minimum: ${lengthSpec.minWords} words.
- Maximum: ${lengthSpec.maxWords} words.
- Selected target: ${formatLengthTarget(input.lengthTarget)}.

Final story requirements:
- Follow the blueprint scene beats in order, turning each beat into lived scene action.
- Do not use section labels, outline language, bullet-like transitions, or synopsis language.
- Do not make philosophical debate the main action.
- Reveal the mystery through action, clues, behavior, and consequence.
- Include a concrete cost.
- Include a final decision.
- Show a changed world state.
- Use third-person limited point of view through ${blueprint.pointOfViewCharacter}.
- Preserve character consistency, world rules, and local narrative rules.
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

function buildExpansionPrompt(input: GenerateStoryRequest, blueprint: StoryBlueprint, story: string): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const forbiddenRule = buildForbiddenLanguageRule(input.storyRules);

  return `Rewrite and expand the draft into a complete story that satisfies the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target.

Compare the draft against the private blueprint. Add missing scenes, irreversible turns, costs, consequences, revelations, and the changed world state. Do not merely add more dialogue, atmosphere, reflection, or debate.

Hard requirements:
- Follow the blueprint scene beats.
- Do not summarize the blueprint.
- Do not use section labels or outline language.
- Do not make philosophical debate the main action.
- Reveal mystery through action, clues, behavior, and consequence.
- Include a concrete cost, final decision, and changed world state.
${forbiddenRule}

PRIVATE BLUEPRINT JSON
${JSON.stringify(blueprint, null, 2)}

DRAFT STORY
${story}`;
}

function buildForbiddenLanguageRule(storyRules: string): string {
  const lowerRules = storyRules.toLowerCase();
  const explicitlyAllowed = TECHNICAL_FORBIDDEN_TERMS.some((term) => lowerRules.includes(`allow ${term.toLowerCase()}`));

  if (explicitlyAllowed) {
    return "- Uploaded narrative rules explicitly allow some technical meta language; use it only if it belongs inside the story world.";
  }

  return `- Hard forbidden language: do not use these terms in the final story: ${TECHNICAL_FORBIDDEN_TERMS.join(", ")}.`;
}

function parseBlueprint(rawText: string): StoryBlueprint {
  const payload = normalizeStoryPayload(rawText) as Partial<StoryBlueprint>;
  const sceneBeats = Array.isArray(payload.sceneBeats) ? payload.sceneBeats.filter(isBlueprintSceneBeat).slice(0, 9) : [];

  if (sceneBeats.length < 5) {
    throw new Error("Blueprint did not include 5-9 complete scene beats.");
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
      beat.consequence
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

function formatLengthTarget(lengthTarget: LengthTarget): string {
  const target = getLengthTargetSpec(lengthTarget);
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}

function estimateStoryMaxTokens(maxWords: number): number {
  return Math.min(16_000, Math.ceil(maxWords * 2.6));
}

function summarizeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
