import assert from "node:assert/strict";
import test from "node:test";

const { findStoryMetadataLeakPatterns, normalizeStoryText, removeStoryMetadataLeaks, sanitizeStoryMetadataLeaks } = await import("./story-output.ts");

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

test("metadata leak guard removes private story-fit planning context", () => {
  const cleaned = normalizeStoryText(`Private story-fit planning context:\nSelected story fit: Small-Town Dread.\nUseful motifs: diner, fog, secrets.\nUse the selected story fit only as private planning guidance.\n\nMara found the diner unlocked after midnight.`);
  assert.equal(cleaned, "Mara found the diner unlocked after midnight.");
  assert.doesNotMatch(cleaned, /Selected story fit:/i);
  assert.doesNotMatch(cleaned, /Useful motifs:/i);
});

test("metadata leak sanitizer preserves prose around inline scaffold blocks", () => {
  const result = sanitizeStoryMetadataLeaks("Nia opened the archive door. The trouble began with a premise that would not stay quiet: Selected Lantyrn story fit: Small-Town Dread. Story fit direction: Ordinary town made wrong. Useful story fit ingredients: diner, fog. Story seed: The road returned. In another place, it might have sounded like rumor.");

  assert.equal(result.detected, true);
  assert.equal(result.sanitized, true);
  assert.match(result.text, /Nia opened the archive door\./);
  assert.doesNotMatch(result.text, /Selected Lantyrn story fit:/i);
  assert.doesNotMatch(result.text, /Story fit direction:/i);
  assert.doesNotMatch(result.text, /Useful story fit ingredients:/i);
  assert.doesNotMatch(result.text, /Story seed:/i);
});

test("metadata leak finder detects inline scaffold blocks", () => {
  const patterns = findStoryMetadataLeakPatterns("Nia opened the archive door. Selected Lantyrn story fit: Small-Town Dread. Story seed: The road returned.");

  assert.ok(patterns.some((pattern) => /selected lantyrn story fit/i.test(pattern)));
  assert.ok(patterns.some((pattern) => /story seed/i.test(pattern)));
});

test("metadata leak sanitizer preserves dialogue colons and ordinary lowercase craft words", () => {
  const result = sanitizeStoryMetadataLeaks('Mara whispered: "The quest was never a game." Jonah answered: "Comedy and tragedy both live in this town." The monster under the bridge kept breathing.');

  assert.equal(result.detected, false);
  assert.equal(result.sanitized, false);
  assert.match(result.text, /Mara whispered:/);
  assert.match(result.text, /The quest was never a game/);
  assert.match(result.text, /Comedy and tragedy both live/);
  assert.match(result.text, /monster under the bridge/);
});
