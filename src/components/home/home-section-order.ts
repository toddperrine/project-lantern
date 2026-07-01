export const HOME_SECTION_ORDER = [
  "hero",
  "continue-episode",
  "story-queue",
  "fear-mood-grid",
  "start-something-new",
] as const;

export type HomeSectionKey = (typeof HOME_SECTION_ORDER)[number];
