import test from "node:test";
import assert from "node:assert/strict";

const {
  BLOODWICK_SERIES_TITLE_PROMPT,
  getBloodwickSeriesDisplayTitle,
  isProtagonistNameFallbackTitle,
  isWeakBloodwickSeriesTitle,
  normalizeBloodwickSeriesTitle,
} = await import("./bloodwick-series-title.ts");

test("normalizes and rejects generic Bloodwick series titles", () => {
  assert.equal(normalizeBloodwickSeriesTitle('  "The Hollow Bell"  '), "The Hollow Bell");
  assert.equal(normalizeBloodwickSeriesTitle("The Curse"), null);
  assert.equal(normalizeBloodwickSeriesTitle("   "), null);
  assert.equal(isWeakBloodwickSeriesTitle("Bloodwick Series"), true);
  assert.equal(isWeakBloodwickSeriesTitle("The Hollow Bell of County Line"), false);
});

test("detects protagonist-name fallback titles", () => {
  assert.equal(isProtagonistNameFallbackTitle("Miles Arlen Series", "Miles Arlen"), true);
  assert.equal(isProtagonistNameFallbackTitle("Miles Arlen's Series", "Miles Arlen"), true);
  assert.equal(isProtagonistNameFallbackTitle("The Hollow Bell", "Miles Arlen"), false);
});

test("prefers generated series titles over protagonist-name saved fallbacks", () => {
  assert.equal(
    getBloodwickSeriesDisplayTitle({
      generatedSeriesTitle: "The Hollow Bell of County Line",
      savedSeriesTitle: "Miles Arlen Series",
      protagonistName: "Miles Arlen",
      firstEpisodeTitle: "Miles Arlen ran at dawn because the world was simplest then, the roads never ended, and nobody had started screaming yet",
    }),
    "The Hollow Bell of County Line",
  );

  assert.notEqual(
    getBloodwickSeriesDisplayTitle({
      savedSeriesTitle: "Miles Arlen Series",
      protagonistName: "Miles Arlen",
      firstEpisodeTitle: "Miles Arlen ran at dawn because the world was simplest then, the roads never ended, and nobody had started screaming yet",
    }),
    "Miles Arlen Series",
  );

  assert.equal(getBloodwickSeriesDisplayTitle({}), "Untitled Series");
});

test("exports the codified Bloodwick series title prompt", () => {
  assert.match(BLOODWICK_SERIES_TITLE_PROMPT, /Bloodwick Series Title Rules:/);
  assert.match(BLOODWICK_SERIES_TITLE_PROMPT, /Create a series_title before drafting the first episode\./);
});
