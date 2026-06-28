export type LibraryStoryForSeries = {
  id?: string;
  storyId?: string;
  seriesId?: string | null;
  sourceStoryId?: string | null;
  parentSeriesId?: string | null;
  title?: string;
  genre?: string;
  wordCount?: number;
  createdAt?: string;
  savedAt?: string;
  seriesTitle?: string | null;
  heroName?: string | null;
  protagonistName?: string | null;
  charactersUsed?: string[];
  metadata?: {
    diagnostics?: {
      storyId?: string | null;
      seriesId?: string | null;
      sourceStoryId?: string | null;
      parentSeriesId?: string | null;
      createdAt?: string | null;
      generationCreatedAt?: string | null;
      generationMode?: string | null;
    };
    seriesTitle?: string | null;
    heroName?: string | null;
    protagonistName?: string | null;
  };
};

export type SeriesEpisode<TStory extends LibraryStoryForSeries = LibraryStoryForSeries> = {
  story: TStory;
  episodeNumber: number;
  storyId: string;
  seriesId: string;
  title: string;
  createdAt: string | null;
  originalIndex: number;
};

export type LibrarySeriesGroup<TStory extends LibraryStoryForSeries = LibraryStoryForSeries> = {
  seriesId: string;
  title: string;
  episodeCount: number;
  lastUpdatedAt: string | null;
  episodes: SeriesEpisode<TStory>[];
};

export function getEffectiveStoryId(story: LibraryStoryForSeries, index = 0): string {
  return story.storyId || story.metadata?.diagnostics?.storyId || story.id || `legacy-story-${index}`;
}

export function getEffectiveSeriesId(story: LibraryStoryForSeries, index = 0): string {
  return story.seriesId || story.metadata?.diagnostics?.seriesId || getEffectiveStoryId(story, index);
}

export function getEffectiveCreatedAt(story: LibraryStoryForSeries): string | null {
  return story.metadata?.diagnostics?.generationCreatedAt || story.metadata?.diagnostics?.createdAt || story.createdAt || story.savedAt || null;
}

export function getSeriesDisplayTitle(episodes: Array<SeriesEpisode>): string {
  const first = episodes[0]?.story;
  const explicitSeriesTitle = first?.seriesTitle || first?.metadata?.seriesTitle;
  if (explicitSeriesTitle?.trim()) return explicitSeriesTitle.trim();

  const heroName = first?.heroName || first?.protagonistName || first?.metadata?.heroName || first?.metadata?.protagonistName || first?.charactersUsed?.[0];
  if (heroName?.trim()) return `${heroName.trim()} Series`;

  const firstTitle = episodes[0]?.title;
  if (firstTitle?.trim()) return `Series starting with: ${firstTitle.trim()}`;

  return "Untitled Series";
}

export function groupStoriesBySeries<TStory extends LibraryStoryForSeries>(stories: TStory[]): LibrarySeriesGroup<TStory>[] {
  const groups = new Map<string, SeriesEpisode<TStory>[]>();

  stories.forEach((story, index) => {
    const storyId = getEffectiveStoryId(story, index);
    const seriesId = getEffectiveSeriesId(story, index);
    const createdAt = getEffectiveCreatedAt(story);
    const title = story.title?.trim() || "Untitled Episode";
    const episode: SeriesEpisode<TStory> = { story, episodeNumber: 0, storyId, seriesId, title, createdAt, originalIndex: index };
    groups.set(seriesId, [...(groups.get(seriesId) ?? []), episode]);
  });

  return Array.from(groups.entries())
    .map(([seriesId, episodes]) => {
      const sortedEpisodes = [...episodes].sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          if (Number.isFinite(diff) && diff !== 0) return diff;
        }
        if (a.createdAt && !b.createdAt) return -1;
        if (!a.createdAt && b.createdAt) return 1;
        return a.originalIndex - b.originalIndex;
      });
      const numberedEpisodes = sortedEpisodes.map((episode, index) => ({ ...episode, episodeNumber: index + 1 }));
      const lastUpdatedAt = [...numberedEpisodes].reverse().find((episode) => episode.createdAt)?.createdAt ?? null;
      return { seriesId, title: getSeriesDisplayTitle(numberedEpisodes), episodeCount: numberedEpisodes.length, lastUpdatedAt, episodes: numberedEpisodes };
    })
    .sort((a, b) => {
      if (a.lastUpdatedAt && b.lastUpdatedAt) {
        const diff = new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
        if (Number.isFinite(diff) && diff !== 0) return diff;
      }
      if (a.lastUpdatedAt && !b.lastUpdatedAt) return -1;
      if (!a.lastUpdatedAt && b.lastUpdatedAt) return 1;
      return a.title.localeCompare(b.title);
    });
}

export function findNextSavedEpisodeInSeries<TStory extends LibraryStoryForSeries>(stories: TStory[], currentStoryId: string): SeriesEpisode<TStory> | null {
  const trimmedCurrentStoryId = currentStoryId.trim();
  if (!trimmedCurrentStoryId) return null;

  const groups = groupStoriesBySeries(stories);

  for (const group of groups) {
    const currentIndex = group.episodes.findIndex((episode) => episode.storyId === trimmedCurrentStoryId || episode.story.id === trimmedCurrentStoryId);
    if (currentIndex >= 0) return group.episodes[currentIndex + 1] ?? null;
  }

  return null;
}


export function findLibraryStoryById<TStory extends LibraryStoryForSeries>(stories: TStory[], storyId: string): TStory | null {
  const trimmedStoryId = storyId.trim();
  if (!trimmedStoryId) return null;

  return stories.find((story, index) => getEffectiveStoryId(story, index) === trimmedStoryId || story.id === trimmedStoryId) ?? null;
}


export function findLibraryStoryBySavedId<TStory extends { id: string }>(stories: TStory[], storyId: string): TStory | null {
  return stories.find((story) => story.id === storyId) ?? null;
}
