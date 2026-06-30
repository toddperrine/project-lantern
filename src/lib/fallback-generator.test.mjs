import assert from "node:assert/strict";
import test from "node:test";

import jitiModule from "jiti";

const jiti = jitiModule(import.meta.url);
const { generateFallbackStory } = await jiti.import("./fallback-generator.ts", { default: false });
const { getOpenAIDiagnostics } = await jiti.import("./openai-generator.ts", { default: false });
const { createGenerationIdentity } = await jiti.import("./generation-identity.ts", { default: false });

function input(overrides = {}) {
  const generationMode = "new_story";
  return {
    worldBible: "Bellweather is a small town where old promises leave marks on doors.",
    characterProfiles: "Mara Vale: a local archivist. Jonah Reed: a night bus driver.",
    storySeed: "Selected Lantyrn story fit: Small-Town Dread\nStory seed:\nThe diner lights turn on after everyone inside has vanished.",
    storyRules: "Overcoming the monster: A visible or hidden force threatens the town.\nUse the selected Small-Town Dread story fit as private planning guidance.",
    genrePreset: "Speculative Mystery",
    selectedStoryTypeChipLabel: "Small-Town Dread",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: "Compact",
    generationMode,
    generationIdentity: createGenerationIdentity({ generationMode, activeStoryId: null, activeSeriesId: null, selectedSeriesId: null, sourceStoryId: null }),
    continuationContextIncluded: false,
    generationTrigger: "Create",
    ...overrides
  };
}

function diagnostics(overrides = {}) {
  return getOpenAIDiagnostics({
    fallbackReason: "test fallback",
    genrePreset: "Speculative Mystery",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: "Compact: 1500-2500 words",
    ...overrides
  });
}

test("fallback output removes story fit metadata and craft scaffolding", () => {
  const response = generateFallbackStory(input(), diagnostics());
  assert.equal(response.metadata.source, "fallback");
  assert.equal(response.metadata.diagnostics.fallbackMetadataLeakGuardEnabled, true);
  assert.equal(response.metadata.diagnostics.fallbackRejectedForMetadataLeak, false);
  assert.doesNotMatch(response.story, /Use the selected/i);
  assert.doesNotMatch(response.story, /private planning guidance/i);
  assert.doesNotMatch(response.story, /Consider these ingredients/i);
  assert.doesNotMatch(response.story, /Story seed:/i);
  assert.doesNotMatch(response.story, /Overcoming the monster:/i);
  assert.match(response.story, /Mara Vale/);
});

test("fallback preserves clean story prose from a clean seed", () => {
  const response = generateFallbackStory(input({ storySeed: "The old diner lights turn on after everyone inside has vanished.", storyRules: "Old promises leave marks on doors." }), diagnostics());
  assert.match(response.story, /old diner lights turn on/i);
  assert.doesNotMatch(response.story, /Story seed:/i);
});
