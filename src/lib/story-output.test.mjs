import assert from "node:assert/strict";
import test from "node:test";

const { normalizeStoryText, removeStoryMetadataLeaks } = await import("./story-output.ts");

test("metadata leak guard removes selected story fit scaffold", () => {
  const cleaned = normalizeStoryText(`Selected Lantyrn story fit: Small-Town Dread\nStory fit direction: Ordinary town made wrong.\n\nMara found the first impossible footprint beside the closed diner.`);
  assert.equal(cleaned, "Mara found the first impossible footprint beside the closed diner.");
  assert.doesNotMatch(cleaned, /Selected Lantyrn story fit:/i);
  assert.doesNotMatch(cleaned, /Story fit direction:/i);
});

test("metadata leak guard removes story seed scaffold", () => {
  const cleaned = removeStoryMetadataLeaks(`Story seed:\nUse this selected story type as the seed: A hidden road waits.\n\nThe road appeared after the last bus left.`);
  assert.equal(cleaned, "The road appeared after the last bus left.");
  assert.doesNotMatch(cleaned, /Story seed:/i);
});

test("metadata leak guard removes raw craft rule labels", () => {
  const cleaned = normalizeStoryText(`Overcoming the monster: keep the monster symbolic.\nComedy: use a happy reversal.\n\nThe bell in the old house rang once, though no one had touched it.`);
  assert.equal(cleaned, "The bell in the old house rang once, though no one had touched it.");
  assert.doesNotMatch(cleaned, /Overcoming the monster:/i);
  assert.doesNotMatch(cleaned, /Comedy:/i);
});

test("metadata leak guard allows natural story prose with genre words", () => {
  const prose = "Mara thought the quest would end at the bridge, but the monster only watched from the reeds while the town rehearsed its tragedy in whispers.";
  const cleaned = normalizeStoryText(prose);
  assert.equal(cleaned, prose);
});
