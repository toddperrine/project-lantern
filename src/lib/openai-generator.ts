import OpenAI from "openai";
import type { GenerateStoryRequest, GenerateStoryResponse, StoryDiagnostics } from "./types";
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
const MIN_STORY_WORDS = 1500;
const TARGET_STORY_WORDS = 1800;
const MAX_STORY_WORDS = 2000;
const OPENAI_MAX_TOKENS = 7000;
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
    ...overrides
  };
}

export async function generateOpenAIStory(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const initialPayload = await requestStory(client, buildPrompt(input));
  let story = normalizeStoryText(initialPayload.story);
  let payload = initialPayload;

  if (!story) {
    throw new Error("OpenAI response did not include a story.");
  }

  if (countWords(story) < MIN_STORY_WORDS) {
    payload = await requestStory(client, buildExpansionPrompt(input, story));
    story = normalizeStoryText(payload.story);
  }

  if (!story) {
    throw new Error("OpenAI response did not include a story after expansion.");
  }

  const wordCount = countWords(story);
  if (wordCount < MIN_STORY_WORDS) {
    throw new Error(`OpenAI story remained under ${MIN_STORY_WORDS} words after expansion (${wordCount} words).`);
  }

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
        openAIRequestSucceeded: true
      })
    }
  };
}

async function requestStory(client: OpenAI, prompt: string): Promise<OpenAIStoryPayload> {
  const response = await client.chat.completions.create({
    model: getOpenAIModel(),
    temperature: 0.82,
    max_tokens: OPENAI_MAX_TOKENS,
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
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;

  return `Write a complete literary short story of ${TARGET_STORY_WORDS} words.

Length requirements:
- Minimum: ${MIN_STORY_WORDS} words.
- Target: ${TARGET_STORY_WORDS} words.
- Maximum: ${MAX_STORY_WORDS} words.
- Do not return fewer than ${MIN_STORY_WORDS} words.

Quality requirements:
- Write as if the story were being published in a literary magazine.
- Begin in-scene with concrete action, setting, or dialogue.
- Do not summarize the premise.
- Do not use synopsis language, outline language, section headings, or scene labels.
- Do not explain the world.
- Do not explain the simulation.
- Do not mention AI, prompts, models, source material, uploaded files, or generation.
- Do not include prompt labels, file labels, bullet lists, or section headings in the story.
- Let world rules emerge through consequence, behavior, dialogue, and conflict.
- Use concrete sensory detail.
- Make technology feel worn, named, repaired, and personal.
- Give each major character a distinct voice, worldview, fear, and speech pattern.
- Reveal beliefs through action, choices, silences, habits, and conflict rather than direct explanation.
- At least two belief systems should collide.
- Nobody should be completely right.
- Nobody should be completely wrong.
- Resolve the central event.
- Keep the emotional or thematic question alive.
- End with transformation, not victory.
- Avoid generic closing abstractions such as "the world began to breathe anew," "tomorrow yet unwritten," or similar lines.

Source-material requirements:
- The four internal sections below are private source material only.
- Never reproduce section labels, prompt text, bullet lists, or file contents verbatim.
- Use names, rules, constraints, relationships, and conflicts as material for original prose.
- NARRATIVE RULES take priority over generic literary defaults.

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST
${input.storySeed}

NARRATIVE RULES
${narrativeRules}`;
}

function buildExpansionPrompt(input: GenerateStoryRequest, story: string): string {
  const narrativeRules = input.storyRules.trim() || DEFAULT_NARRATIVE_RULES;

  return `Expand the existing short story below into a complete literary short story of ${TARGET_STORY_WORDS} words.

Hard requirements:
- Final length must be between ${MIN_STORY_WORDS} and ${MAX_STORY_WORDS} words.
- Preserve all established facts, characters, tone, causal logic, central event, and ending transformation.
- Do not pad with filler, blank lines, throat-clearing, exposition dumps, or appended summary paragraphs.
- Add lived scenes: action, dialogue, sensory detail, consequence, conflict, and character-specific choices.
- Make character voices more distinct through diction, fear, worldview, and speech rhythm.
- Reveal beliefs through behavior and conflict rather than direct explanation.
- Resolve the central event while leaving the emotional or thematic question alive.
- Avoid generic closing abstractions such as "the world began to breathe anew," "tomorrow yet unwritten," or similar lines.
- Return only valid JSON in the required shape. The story field must contain only final prose.

Private source material, not to be reproduced verbatim:

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY REQUEST
${input.storySeed}

NARRATIVE RULES
${narrativeRules}

EXISTING STORY TO EXPAND
${story}`;
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
