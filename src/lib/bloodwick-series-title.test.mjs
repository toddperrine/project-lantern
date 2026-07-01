import test from "node:test";
import assert from "node:assert/strict";

const {
  BLOODWICK_SERIES_TITLE_PROMPT,
  getBloodwickSeriesDisplayTitle,
  isProtagonistNameFallbackTitle,
  isSentenceLikeTitle,
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

  assert.equal(getBloodwickSeriesDisplayTitle({}), "The Hidden Town");
});

test("exports the codified Bloodwick series title prompt", () => {
  assert.match(BLOODWICK_SERIES_TITLE_PROMPT, /Bloodwick Series Title Rules:/);
  assert.match(BLOODWICK_SERIES_TITLE_PROMPT, /Create a series_title before drafting the first episode\./);
});


test("rejects long sentence-like episode text as a direct display title", () => {
  assert.equal(isSentenceLikeTitle("Miles Arlen ran at dawn because the world was simplest then"), true);
  assert.equal(isSentenceLikeTitle("The Hollow Bell"), false);
  assert.equal(isSentenceLikeTitle("The Hollow Bell."), true);
  assert.equal(
    getBloodwickSeriesDisplayTitle({
      savedSeriesTitle: "Miles Arlen Series",
      protagonistName: "Miles Arlen",
      firstEpisodeTitle: "Miles Arlen ran at dawn because the world was simplest then, the roads never ended, and nobody had started screaming yet",
      fearCategory: "Gothic Shadows",
    }),
    "The Hollow Road",
  );
});

test("derives deterministic provisional titles by fear category", () => {
  assert.equal(getBloodwickSeriesDisplayTitle({ fearCategory: "Uncanny" }), "The Wrong Mirror");
  assert.equal(getBloodwickSeriesDisplayTitle({ fearCategory: "Cosmic Horror" }), "The Midnight Signal");
});


test("derives provisional titles from episode text anchors and pressure words", () => {
  assert.equal(
    getBloodwickSeriesDisplayTitle({
      firstEpisodeTitle: "Miles found the archive key under a locked platform after midnight",
      fearCategory: "Small-Town Dread",
    }),
    "The Hidden Archive",
  );
  assert.equal(
    getBloodwickSeriesDisplayTitle({
      firstEpisodeTitle: "The dogs waited beside the trail in the silent woods",
      fearCategory: "Creature Unease",
    }),
    "The Hollow Dog",
  );
  assert.equal(
    getBloodwickSeriesDisplayTitle({
      firstEpisodeTitle: "The library basement was cold after the pictures vanished",
      fearCategory: "Gothic Shadows",
    }),
    "The Cold Library",
  );
});

test("uses fear fallback to complete partial provisional extractions", () => {
  assert.equal(
    getBloodwickSeriesDisplayTitle({ firstEpisodeTitle: "The platform waited", fearCategory: "Small-Town Dread" }),
    "The Hidden Platform",
  );
  assert.equal(
    getBloodwickSeriesDisplayTitle({ firstEpisodeTitle: "The vanished music", fearCategory: "Cosmic Horror" }),
    "The Missing Signal",
  );
});
