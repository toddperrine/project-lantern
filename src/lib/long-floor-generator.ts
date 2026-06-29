import OpenAI from "openai";
import { applyEpisodeMomentumEngine } from "./episode-momentum-engine";
import { generateOpenAIStory, getExpansionModel } from "./openai-generator";
import { normalizeStoryPayload, normalizeStoryText, normalizeStringList } from "./story-output";
import { countWords } from "./story-analysis";
import type { GenerateStoryRequest, GenerateStoryResponse, StoryDiagnostics } from "./types";

const LONG_FLOOR_MIN_WORDS = 3500;
const LONG_FLOOR_TARGET_MAX_WORDS = 4200;

export async function generateOpenAIStoryWithLongFloor(input: GenerateStoryRequest): Promise<GenerateStoryResponse> {
  const response = await generateOpenAIStory(input);

  if (!shouldAttemptLongFloor(input, response)) {
    return applyEpisodeMomentumEngine(input, input.lengthTarget === "Long" ? withLongFloorNotAttemptedDiagnostics(response) : response);
  }

  return applyEpisodeMomentumEngine(input, await applyLongFloorPass(input, response));
}

function shouldAttemptLongFloor(input: GenerateStoryRequest, response: GenerateStoryResponse): boolean {
  return (
    input.lengthTarget === "Long" &&
    response.metadata.source === "openai" &&
    countWords(response.story) < LONG_FLOOR_MIN_WORDS &&
    response.metadata.diagnostics.stoppedReason !== "time-budget"
  );
}

function withLongFloorNotAttemptedDiagnostics(response: GenerateStoryResponse): GenerateStoryResponse {
  const finalWordCount = countWords(response.story);
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        longFloorPassAttempted: false,
        longFloorPassSucceeded: finalWordCount >= LONG_FLOOR_MIN_WORDS,
        longFloorPassFinalWordCount: finalWordCount,
        longFloorPassTargetMinimumWordCount: LONG_FLOOR_MIN_WORDS,
        targetMinimumWordCount: response.metadata.diagnostics.targetMinimumWordCount ?? LONG_FLOOR_MIN_WORDS
      }
    }
  };
}

async function applyLongFloorPass(
  input: GenerateStoryRequest,
  response: GenerateStoryResponse
): Promise<GenerateStoryResponse> {
  const previousWordCount = countWords(response.story);
  let nextStory = response.story;
  let nextCharactersUsed = response.metadata.charactersUsed;
  let nextRulesReferenced = response.metadata.rulesReferenced;
  let stoppedReason = response.metadata.diagnostics.stoppedReason ?? "max-expansion-attempts";

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const payload = await requestLongFloorStory(client, input, response.story, previousWordCount);
    const candidateStory = normalizeStoryText(payload.story);
    const candidateWordCount = countWords(candidateStory);

    if (candidateStory && candidateWordCount > previousWordCount) {
      nextStory = candidateStory;
      nextCharactersUsed = normalizeStringList(payload.charactersUsed) ?? nextCharactersUsed;
      nextRulesReferenced = normalizeStringList(payload.rulesReferenced) ?? nextRulesReferenced;
      stoppedReason = candidateWordCount >= LONG_FLOOR_MIN_WORDS ? "complete" : stoppedReason;
    }
  } catch {
    stoppedReason = response.metadata.diagnostics.stoppedReason ?? "openai-error";
  }

  const finalWordCount = countWords(nextStory);
  const longFloorPassSucceeded = finalWordCount >= LONG_FLOOR_MIN_WORDS;
  const diagnostics: StoryDiagnostics = {
    ...response.metadata.diagnostics,
    finalWordCount,
    expansionSucceeded: response.metadata.diagnostics.expansionSucceeded || longFloorPassSucceeded,
    stoppedReason: longFloorPassSucceeded ? "complete" : stoppedReason,
    underTargetNotice: buildUnderTargetNotice(response.metadata.diagnostics.expansionAttemptsCount ?? 0, finalWordCount, longFloorPassSucceeded ? "complete" : stoppedReason),
    notice: buildNotice(response.metadata.diagnostics.notice, finalWordCount, longFloorPassSucceeded),
    longFloorPassAttempted: true,
    longFloorPassSucceeded,
    longFloorPassFinalWordCount: finalWordCount,
    longFloorPassTargetMinimumWordCount: LONG_FLOOR_MIN_WORDS,
    targetMinimumWordCount: response.metadata.diagnostics.targetMinimumWordCount ?? LONG_FLOOR_MIN_WORDS
  };

  return {
    ...response,
    story: nextStory,
    metadata: {
      ...response.metadata,
      wordCount: finalWordCount,
      charactersUsed: nextCharactersUsed,
      rulesReferenced: nextRulesReferenced,
      diagnostics
    }
  };
}

async function requestLongFloorStory(
  client: OpenAI,
  input: GenerateStoryRequest,
  story: string,
  currentWordCount: number
): Promise<{ story: string; charactersUsed?: string[]; rulesReferenced?: string[] }> {
  const response = await client.chat.completions.create({
    model: getExpansionModel(),
    temperature: 0.72,
    max_tokens: 14000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a literary short story expansion editor. Return only valid JSON matching this shape: {\"story\":\"...\",\"charactersUsed\":[\"...\"],\"rulesReferenced\":[\"...\"]}. The story value must contain only finished prose, never labels, notes, outlines, summaries, or commentary."
      },
      { role: "user", content: buildLongFloorPrompt(input, story, currentWordCount) }
    ]
  });

  const payload = normalizeStoryPayload(response.choices[0]?.message.content ?? "");
  return {
    story: normalizeStoryText(payload.story),
    charactersUsed: normalizeStringList(payload.charactersUsed),
    rulesReferenced: normalizeStringList(payload.rulesReferenced)
  };
}

function buildLongFloorPrompt(input: GenerateStoryRequest, story: string, currentWordCount: number): string {
  return `LONG FLOOR PASS
The existing Long draft is complete but under the required minimum. It currently has ${currentWordCount} words. Expand this exact story to ${LONG_FLOOR_MIN_WORDS}-${LONG_FLOOR_TARGET_MAX_WORDS} words.

This is a floor pass, not a restart. Rewrite and expand the existing story while preserving its plot, premise requirements, character consistency, world rules, final decision, final image or action, changed world state, and established scene order. Do not replace the story with a new premise.

Add substantial scene development where the draft is compressed: lived action, transitions, character interiority, sensory detail, consequences, aftermath, tension, reaction, choice, and material cost. Strengthen existing scenes instead of adding filler.

Hard boundaries:
- Preserve the existing story's plot, characters, world logic, ending decision, final image/action, and changed world state.
- Preserve explicit Story Spark obligations and do not summarize them as exposition.
- Expand scene beats already present in the draft; do not restart, re-outline, or introduce a different story.
- Do not add filler, meta commentary, summaries of rules, philosophical padding, repeated exposition, headings, section labels, notes, or bullet-like prose.
- Keep the final story under ${LONG_FLOOR_TARGET_MAX_WORDS} words.

WORLD BIBLE
${input.worldBible}

CHARACTERS
${input.characterProfiles}

STORY SPARK
${input.storySeed}

CRAFT RULES
${input.storyRules}

EXISTING STORY TO EXPAND
${story}`;
}

function buildUnderTargetNotice(
  expansionAttemptsCount: number,
  finalWordCount: number,
  stoppedReason: StoryDiagnostics["stoppedReason"]
): string | null {
  if (finalWordCount >= LONG_FLOOR_MIN_WORDS) {
    return null;
  }

  return `Final story is below the selected Long: ${LONG_FLOOR_MIN_WORDS}-5000 words target. Target minimum: ${LONG_FLOOR_MIN_WORDS} words. Final word count: ${finalWordCount}. Expansion attempts: ${expansionAttemptsCount}. Long floor pass attempted: yes. Stopped reason: ${stoppedReason}.`;
}

function buildNotice(previousNotice: string | null, finalWordCount: number, longFloorPassSucceeded: boolean): string {
  const floorNotice = `Long floor pass attempted: yes. Long floor pass succeeded: ${longFloorPassSucceeded ? "yes" : "no"}. Final word count after Long floor pass: ${finalWordCount}. Target minimum word count: ${LONG_FLOOR_MIN_WORDS}.`;
  if (longFloorPassSucceeded) {
    return floorNotice;
  }
  return [previousNotice, floorNotice].filter(Boolean).join(" ");
}
