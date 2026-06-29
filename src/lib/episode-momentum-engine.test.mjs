import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import jitiModule from "jiti";

const jiti = jitiModule(import.meta.url);
const {
  applyEpisodeMomentumEngine,
  calculateContinueProbability,
  shouldUseEpisodeMomentumEngine
} = await jiti.import("./episode-momentum-engine.ts", { default: false });
const { createGenerationIdentity } = await jiti.import("./generation-identity.ts", { default: false });

globalThis.crypto ??= { randomUUID };

function input(overrides = {}) {
  const generationMode = overrides.generationMode ?? "new_story";
  return {
    worldBible: "A coastal town where bells remember storms.",
    characterProfiles: "Mara Vale: a careful archivist. Jonah Reed: a missing diver.",
    storySeed: "A quiet standalone story about repairing a pier.",
    storyRules: "No meta terms.",
    genrePreset: "Speculative Mystery",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: "Compact",
    generationMode,
    generationIdentity: createGenerationIdentity({ generationMode, activeStoryId: "story-a", activeSeriesId: "series-a", selectedSeriesId: "series-a", sourceStoryId: generationMode === "continue_series" ? "story-a" : null }),
    continuationContextIncluded: generationMode === "continue_series",
    generationTrigger: generationMode === "continue_series" ? "Continue Series" : "Create",
    ...overrides
  };
}

function response(story = baseStory()) {
  return {
    story,
    metadata: {
      wordCount: story.split(/\s+/).length,
      charactersUsed: ["Mara Vale", "Jonah Reed"],
      rulesReferenced: [],
      source: "openai",
      diagnostics: {
        openAIEnabled: true,
        apiKeyDetected: true,
        modelRequested: "test",
        openAIRequestAttempted: true,
        openAIRequestSucceeded: true,
        fallbackReason: null,
        notice: null,
        genrePreset: "Speculative Mystery",
        narrativeArchitecture: "Revelation Story",
        characterArc: "Positive Change Arc",
        endingType: "Resolution with Residue",
        lengthTarget: "Compact: 1500-2500 words",
        finalWordCount: story.split(/\s+/).length,
        expansionAttempted: false,
        expansionSucceeded: false,
        underTargetNotice: null,
        blueprintGenerated: true,
        blueprintSceneCount: 5,
        blueprintFailedReason: null,
        generationMode: "new_story",
        storyId: "story-id",
        seriesId: "series-id",
        sourceStoryId: null,
        parentSeriesId: null,
        continuationContextIncluded: false,
        newSeriesCreated: true,
        generationTrigger: "Create"
      }
    }
  };
}

function baseStory() {
  return Array(45).fill("Mara Vale followed Jonah Reed through the bell archive while the tide wrote a warning on the glass.").join(" ");
}

test("activates for continue_series", () => {
  assert.equal(shouldUseEpisodeMomentumEngine(input({ generationMode: "continue_series" })), true);
});

test("activates for scary/horror new_story input", () => {
  assert.equal(shouldUseEpisodeMomentumEngine(input({ storySeed: "An eerie horror story about a creepy lighthouse." })), true);
});

test("does not activate for unrelated standalone new_story input", () => {
  assert.equal(shouldUseEpisodeMomentumEngine(input()), false);
});

test("calculates continue probability in code", () => {
  assert.equal(calculateContinueProbability({ curiosity: 80, escalation: 70, unresolved_tension: 75, character_investment: 60, resolution_pressure: 20, ending_strength: 85, cheap_cliffhanger_risk: 10 }), 70);
});

test("JSON parse failure does not break generation and keeps original story", async () => {
  const original = response();
  const result = await applyEpisodeMomentumEngine(input({ storySeed: "A scary mystery under the pier." }), original, {
    evaluate: async () => { throw new Error("bad json"); }
  });

  assert.equal(result.story, original.story);
  assert.equal(result.metadata.diagnostics.episodeMomentum.json_parse_failed, true);
  assert.equal(result.metadata.diagnostics.episodeMomentum.fallback_used, true);
  assert.equal(result.metadata.diagnostics.episodeMomentum.repair_ran, false);
});

test("repair runs at most once and repaired text becomes final response.story with updated counts", async () => {
  let repairCalls = 0;
  const original = response();
  const repaired = `${original.story} Mara Vale saw Jonah Reed's name appear on the drowned bell, followed by tomorrow's date.`;
  const result = await applyEpisodeMomentumEngine(input({ generationMode: "continue_series" }), original, {
    evaluate: async () => ({ active: true, activation_reason: "continue_series", curiosity: 20, escalation: 20, unresolved_tension: 20, character_investment: 50, resolution_pressure: 90, ending_strength: 30, cheap_cliffhanger_risk: 10, repair_recommended: true, repair_reason: "too resolved" }),
    repair: async () => { repairCalls += 1; return repaired; }
  });

  assert.equal(repairCalls, 1);
  assert.equal(result.story, repaired);
  assert.equal(result.metadata.wordCount, repaired.split(/\s+/).length);
  assert.equal(result.metadata.diagnostics.finalWordCount, repaired.split(/\s+/).length);
  assert.equal(result.metadata.diagnostics.episodeMomentum.active, true);
  assert.equal(result.metadata.diagnostics.episodeMomentum.activation_reason, "continue_series");
  assert.equal(result.metadata.diagnostics.episodeMomentum.repair_ran, true);
  assert.equal(result.metadata.diagnostics.storyId, "story-id");
  assert.equal(result.metadata.diagnostics.seriesId, "series-id");
  assert.equal(result.metadata.diagnostics.generationTrigger, "Create");
});

test("forbidden-term safeguard rejects Momentum repair", async () => {
  const original = response();
  const result = await applyEpisodeMomentumEngine(input({ storySeed: "A scary mystery under the pier." }), original, {
    evaluate: async () => ({ active: true, activation_reason: "new_story_trigger:scary", curiosity: 15, escalation: 15, unresolved_tension: 15, character_investment: 40, resolution_pressure: 85, ending_strength: 20, cheap_cliffhanger_risk: 5, repair_recommended: true, repair_reason: "too closed" }),
    repair: async () => `${original.story} The AI system printed the final prompt in the sky.`
  });

  assert.equal(result.story, original.story);
  assert.equal(result.metadata.diagnostics.episodeMomentum.repair_ran, true);
  assert.equal(result.metadata.diagnostics.episodeMomentum.fallback_used, true);
  assert.match(result.metadata.diagnostics.episodeMomentum.repair_reason, /forbidden terms/);
});
