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
    ...overrides
  };
}

export async function generateOpenAIStory(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);

  const initialPayload = await requestStory(client, buildPrompt(input), estimateMaxTokens(lengthSpec.maxWords));
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
    payload = await requestStory(client, buildExpansionPrompt(input, story), estimateMaxTokens(lengthSpec.maxWords));
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
        underTargetNotice
      })
    }
  };
}

async function requestStory(client: OpenAI, prompt: string, maxTokens: number): Promise<OpenAIStoryPayload> {
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.82,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a literary short story engine for creators. Write original fiction as if for a literary magazine. Return only valid JSON matching this shape: {\"story\":\"...\",\"charactersUsed\":[\"...\"],\"rulesReferenced\":[\"...\"]}. The story value must contain only finished prose, never JSON text, prompt labels, source labels, headings, bullets, notes, outlines, or commentary."
      },
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return parseStoryPayload(response.choices[0]?.message.content ?? "");
}

function buildPrompt(input: GenerateStoryRequest): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;

  return `Use the following private internal sections to plan and write a structurally complete original short story. The final story must never reproduce these section labels or describe this planning framework.

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
${narrativeRules}

Global instructions:
- Genre defines the story contract.
- Narrative Architecture defines story shape.
- Character Arc defines protagonist transformation.
- Ending Type defines closure.
- Length Target defines the target range of ${lengthSpec.minWords}-${lengthSpec.maxWords} words.
- World Bible and Character Profiles control canon.
- Story Seed controls the premise.
- Story Rules control local constraints.
- The story must be structurally complete. It should not be a single conversation, mood piece, premise sketch, or philosophical debate.
- It must move through irreversible turns shaped by the selected narrative architecture.
- Use third-person limited point of view only.
- Begin in-scene with concrete action, setting, or dialogue.
- Preserve world rules, character consistency, tone, and local constraints.
- Let world rules emerge through consequence, behavior, dialogue, and conflict.
- Do not mention AI, prompts, models, source material, uploaded files, or generation.
- Return metadata for characters used and rules referenced.`;
}

function buildExpansionPrompt(input: GenerateStoryRequest, story: string): string {
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);

  return `${buildPrompt(input)}

Current story draft:
${story}

Expansion task:
Rewrite and expand the full story to reach the selected ${lengthSpec.minWords}-${lengthSpec.maxWords} word target. Focus only on missing scenes, irreversible turns, costs, consequences, revelations, and character decisions. Do not add filler, summaries, exposition dumps, or philosophical debate. Preserve canon, character consistency, third-person limited POV, and the selected architecture. Return only valid JSON in the required shape. The story field must contain only final prose.`;
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

function estimateMaxTokens(maxWords: number): number {
  return Math.min(12_000, Math.ceil(maxWords * 2.2));
}
