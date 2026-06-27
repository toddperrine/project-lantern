import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";

const { createGenerationIdentity } = await import("./generation-identity.ts");

globalThis.crypto ??= { randomUUID };

test("new_story creates new story and series ids without reusing active ids", () => {
  const identity = createGenerationIdentity({ generationMode: "new_story", activeStoryId: "active-story", activeSeriesId: "active-series" });
  assert.equal(identity.generationMode, "new_story");
  assert.ok(identity.storyId);
  assert.ok(identity.seriesId);
  assert.notEqual(identity.storyId, "active-story");
  assert.notEqual(identity.seriesId, "active-series");
  assert.equal(identity.parentSeriesId, null);
});

test("continue_series creates a new story under the selected/current series", () => {
  const identity = createGenerationIdentity({ generationMode: "continue_series", activeStoryId: "active-story", selectedSeriesId: "selected-series" });
  assert.equal(identity.generationMode, "continue_series");
  assert.ok(identity.storyId);
  assert.notEqual(identity.storyId, "active-story");
  assert.equal(identity.seriesId, "selected-series");
  assert.equal(identity.parentSeriesId, "selected-series");
  assert.equal(identity.sourceStoryId, "active-story");
});

test("rewrite_retry creates a new story under the active series and records source story", () => {
  const identity = createGenerationIdentity({ generationMode: "rewrite_retry", activeStoryId: "active-story", activeSeriesId: "active-series" });
  assert.equal(identity.generationMode, "rewrite_retry");
  assert.ok(identity.storyId);
  assert.notEqual(identity.storyId, "active-story");
  assert.equal(identity.seriesId, "active-series");
  assert.equal(identity.parentSeriesId, "active-series");
  assert.equal(identity.sourceStoryId, "active-story");
});
