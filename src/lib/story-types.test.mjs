import assert from "node:assert/strict";
import test from "node:test";

const { getStoryTypeStartCopy } = await import("./story-types.ts");

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
