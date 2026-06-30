import assert from "node:assert/strict";
import test from "node:test";

const { normalizeReaderProfilePreferences } = await import("./reader-profile.ts");

test("legacy Scary does not become a preferred story type", () => {
  const preferences = normalizeReaderProfilePreferences({ preferredMoods: ["Scary"] });
  assert.deepEqual(preferences.preferredStoryTypes, []);
  assert.equal(preferences.narrativePressure, "dark-intense");
});

test("legacy Fantasy and Science fiction map to approved ingredients only", () => {
  const preferences = normalizeReaderProfilePreferences({ preferredGenres: ["Fantasy", "Science fiction", "Historical"] });
  assert.deepEqual(preferences.storyIngredients, ["Rules-based magic", "Strange technology or AI"]);
  assert.ok(!preferences.storyIngredients.includes("Fantasy"));
  assert.ok(!preferences.storyIngredients.includes("Science fiction"));
});
