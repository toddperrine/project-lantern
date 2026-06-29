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
