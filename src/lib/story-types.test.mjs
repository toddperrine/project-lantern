import assert from "node:assert/strict";
import test from "node:test";

const { getStoryTypePrimaryCategory, getStoryTypeStartCopy } = await import("./story-types.ts");

test("start box copy confirms selected story type", () => {
  assert.deepEqual(getStoryTypeStartCopy("Cosmic Horror"), {
    confirmation: "Selected story type: Cosmic Horror",
    detail: "Lantyrn will use this to shape the next story.",
    button: "Start Cosmic Horror Story",
    loading: "Writing a Cosmic Horror story for you…"
  });
});

test("start box copy supports no-chip surprise mode", () => {
  assert.deepEqual(getStoryTypeStartCopy(null), {
    confirmation: "No story type selected. Lantyrn will surprise you.",
    detail: "",
    button: "Start Something New",
    loading: "Writing the perfect story for you…"
  });
});


test("category label helper prefers selected story type over legacy genre", () => {
  assert.equal(
    getStoryTypePrimaryCategory({ selectedStoryTypeChipLabel: "Small-Town Dread", genrePreset: "Speculative Mystery" }),
    "Small-Town Dread"
  );
});

test("category label helper falls back to legacy genre without selected story type", () => {
  assert.equal(
    getStoryTypePrimaryCategory({ genrePreset: "Speculative Mystery" }),
    "Speculative Mystery"
  );
});


test("dark fairy tale rejects small-town mystery spark material", async () => {
  const { STORY_TYPE_CHIPS, getStoryTypeTextCompatibility } = await import("./story-types.ts");
  const chip = STORY_TYPE_CHIPS.find((item) => item.id === "dark-fairy-tale");
  assert.ok(chip);
  const smallTownSpark = "mayor town square municipal archive old mill founding-family crime buried town history Speculative Mystery";
  assert.equal(getStoryTypeTextCompatibility(chip, smallTownSpark).compatible, false);
});

test("dark fairy tale direct guidance contains fairy-tale requirements and avoidance", async () => {
  const { STORY_TYPE_CHIPS, getStoryTypePromptRequirements } = await import("./story-types.ts");
  const chip = STORY_TYPE_CHIPS.find((item) => item.id === "dark-fairy-tale");
  assert.ok(chip);
  const requirements = getStoryTypePromptRequirements(chip);
  assert.match(requirements, /folklore or fairy-tale logic/);
  assert.match(requirements, /rules, bargains, thresholds, curses, transformations, or beautiful cruelty/);
  assert.match(requirements, /Avoid mayor\/town archive\/town scandal/);
});


test("dark fairy tale uses direct chip guidance when no compatible spark exists", async () => {
  const { STORY_TYPE_CHIPS, getStoryTypeSeedSource } = await import("./story-types.ts");
  const chip = STORY_TYPE_CHIPS.find((item) => item.id === "dark-fairy-tale");
  assert.ok(chip);
  const smallTownOnly = ["mayor town square municipal archive old mill founding-family crime buried town history Speculative Mystery"];
  assert.equal(getStoryTypeSeedSource(chip, smallTownOnly), "direct-chip-guidance");
});
