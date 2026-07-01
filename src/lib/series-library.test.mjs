import assert from "node:assert/strict";
import test from "node:test";

import jitiModule from "jiti";

const jiti = jitiModule(import.meta.url);
const { findLibraryStoryById, findLibraryStoryBySavedId, findNextSavedEpisodeInSeries, groupStoriesBySeries } = await jiti.import("./series-library.ts", { default: false });

test("groups same-series stories into ordered episode numbers and separates other series", () => {
  const groups = groupStoriesBySeries([
    { id: "two", seriesId: "calder", title: "Second", createdAt: "2026-01-02T00:00:00.000Z", heroName: "Calder Voss" },
    { id: "other", seriesId: "amoma", title: "Ocean Estate", createdAt: "2026-01-04T00:00:00.000Z" },
    { id: "one", seriesId: "calder", title: "First", createdAt: "2026-01-01T00:00:00.000Z", heroName: "Calder Voss" },
    { id: "three", seriesId: "calder", title: "Third", createdAt: "2026-01-03T00:00:00.000Z", heroName: "Calder Voss" }
  ]);

  const calder = groups.find((group) => group.seriesId === "calder");
  const amoma = groups.find((group) => group.seriesId === "amoma");
  assert.equal(groups.length, 2);
  assert.equal(calder.episodeCount, 3);
  assert.deepEqual(calder.episodes.map((episode) => episode.title), ["First", "Second", "Third"]);
  assert.deepEqual(calder.episodes.map((episode) => episode.episodeNumber), [1, 2, 3]);
  assert.equal(calder.title, "The Hidden Town");
  assert.equal(amoma.episodeCount, 1);
});

test("uses generation created timestamp before diagnostics created timestamp", () => {
  const [group] = groupStoriesBySeries([
    { id: "a", seriesId: "s", title: "A", metadata: { diagnostics: { generationCreatedAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" } } },
    { id: "b", seriesId: "s", title: "B", createdAt: "2026-01-01T12:00:00.000Z" }
  ]);

  assert.deepEqual(group.episodes.map((episode) => episode.title), ["B", "A"]);
});

test("treats a story without seriesId as a standalone one-episode group", () => {
  const groups = groupStoriesBySeries([{ id: "legacy-id", title: "Legacy", createdAt: "2026-01-01T00:00:00.000Z" }]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].seriesId, "legacy-id");
  assert.equal(groups[0].episodeCount, 1);
  assert.equal(groups[0].episodes[0].episodeNumber, 1);
});

test("falls back to first episode title when no hero or protagonist exists", () => {
  const groups = groupStoriesBySeries([{ id: "story-id", seriesId: "series-id", title: "A Lonely Door" }]);
  assert.equal(groups[0].title, "The Hidden Town");
});

test("finds the next saved episode in the current series", () => {
  const stories = [
    { id: "episode-1", seriesId: "calder", title: "First", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "other-series", seriesId: "amoma", title: "Other", createdAt: "2026-01-01T12:00:00.000Z" },
    { id: "episode-3", seriesId: "calder", title: "Third", createdAt: "2026-01-03T00:00:00.000Z" },
    { id: "episode-2", seriesId: "calder", title: "Second", createdAt: "2026-01-02T00:00:00.000Z" }
  ];

  assert.equal(findNextSavedEpisodeInSeries(stories, "episode-1")?.story.id, "episode-2");
  assert.equal(findNextSavedEpisodeInSeries(stories, "episode-1")?.episodeNumber, 2);
  assert.equal(findNextSavedEpisodeInSeries(stories, "episode-2")?.story.id, "episode-3");
  assert.equal(findNextSavedEpisodeInSeries(stories, "episode-2")?.episodeNumber, 3);
  assert.equal(findNextSavedEpisodeInSeries(stories, "episode-3"), null);
});

test("does not cross series or invent a next episode for standalone fallback stories", () => {
  const stories = [
    { id: "standalone", title: "Standalone", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "other", seriesId: "other-series", title: "Other", createdAt: "2026-01-02T00:00:00.000Z" }
  ];

  assert.equal(findNextSavedEpisodeInSeries(stories, "standalone"), null);
  assert.equal(findNextSavedEpisodeInSeries(stories, "other"), null);
});


test("finds exact saved stories by clicked id", () => {
  const stories = [
    { id: "story-1", seriesId: "series", title: "Episode 1", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "story-2", seriesId: "series", title: "Episode 2", createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "story-3", seriesId: "series", title: "Episode 3", createdAt: "2026-01-03T00:00:00.000Z" }
  ];

  assert.equal(findLibraryStoryById(stories, "story-1")?.id, "story-1");
  assert.equal(findLibraryStoryById(stories, "story-2")?.id, "story-2");
  assert.equal(findLibraryStoryById(stories, "story-3")?.id, "story-3");
  assert.equal(findNextSavedEpisodeInSeries(stories, "story-1")?.story.id, "story-2");
  assert.equal(findNextSavedEpisodeInSeries(stories, "story-2")?.story.id, "story-3");
  assert.equal(findNextSavedEpisodeInSeries(stories, "story-3"), null);
});


test("finds exact saved stories by saved id without current story shadowing", () => {
  const savedStories = [
    { id: "story-1", seriesId: "series", title: "Episode 1", createdAt: "2026-01-01T00:00:00.000Z" },
    { id: "story-2", seriesId: "series", title: "Episode 2", createdAt: "2026-01-02T00:00:00.000Z" },
    { id: "story-3", seriesId: "series", title: "Episode 3", createdAt: "2026-01-03T00:00:00.000Z" }
  ];
  const currentStory = { id: "story-3", seriesId: "series", title: "Current Episode 3", createdAt: "2026-01-04T00:00:00.000Z" };
  const mixedStories = [currentStory, ...savedStories];

  assert.equal(findLibraryStoryBySavedId(savedStories, "story-1")?.title, "Episode 1");
  assert.equal(findLibraryStoryBySavedId(savedStories, "story-2")?.title, "Episode 2");
  assert.equal(findLibraryStoryBySavedId(savedStories, "story-3")?.title, "Episode 3");
  assert.equal(findLibraryStoryBySavedId(mixedStories, "story-1")?.title, "Episode 1");
  assert.equal(findLibraryStoryBySavedId(mixedStories, "story-2")?.title, "Episode 2");
  assert.equal(findNextSavedEpisodeInSeries(savedStories, "story-1")?.story.id, "story-2");
  assert.equal(findNextSavedEpisodeInSeries(savedStories, "story-2")?.story.id, "story-3");
  assert.equal(findNextSavedEpisodeInSeries(savedStories, "story-3"), null);
});
