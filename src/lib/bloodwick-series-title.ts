export const BLOODWICK_CONCRETE_ANCHORS = [
  "house",
  "road",
  "lake",
  "choir",
  "dog",
  "mirror",
  "station",
  "orchard",
  "town",
  "bell",
  "photograph",
  "room",
  "signal",
  "basement",
] as const;

export const BLOODWICK_PRESSURE_WORDS = [
  "hungry",
  "wrong",
  "hollow",
  "last",
  "borrowed",
  "dead",
  "midnight",
  "red",
  "hidden",
  "missing",
  "broken",
  "returning",
  "watching",
] as const;

export const BLOODWICK_GENERIC_TITLE_BLOCKLIST = [
  "the curse",
  "the shadow",
  "dark secrets",
  "the haunted house",
  "the monster within",
  "the darkness",
  "the evil",
  "the horror",
  "the secret",
] as const;

export type BloodwickSeriesTitleInput = {
  explicitTitle?: string | null;
  generatedSeriesTitle?: string | null;
  savedSeriesTitle?: string | null;
  episodeTitle?: string | null;
  firstEpisodeTitle?: string | null;
  protagonistName?: string | null;
  fearCategory?: string | null;
  worldLabel?: string | null;
};

const PLAIN_WEAK_TITLES = new Set(["series", "untitled", "untitled series", "bloodwick series"]);
const TITLE_MAX_LENGTH = 64;

export function normalizeBloodwickSeriesTitle(value?: string | null): string | null {
  const cleaned = removeWrappingQuotes(String(value ?? "").replace(/\s+/g, " ").trim());
  if (!cleaned) return null;
  if (isBlockedGenericTitle(cleaned)) return null;
  return cleaned;
}

export function isProtagonistNameFallbackTitle(title?: string | null, protagonistName?: string | null): boolean {
  const normalizedTitle = normalizeComparable(title);
  const normalizedName = normalizeComparable(protagonistName);
  if (!normalizedTitle || !normalizedName) return false;
  return normalizedTitle === `${normalizedName} series` || normalizedTitle === `${normalizedName}'s series`;
}

export function isWeakBloodwickSeriesTitle(title?: string | null): boolean {
  const normalized = normalizeBloodwickSeriesTitle(title);
  if (!normalized) return true;
  const comparable = normalizeComparable(normalized);
  return PLAIN_WEAK_TITLES.has(comparable) || isBlockedGenericTitle(comparable);
}

export function getBloodwickSeriesDisplayTitle(input: BloodwickSeriesTitleInput): string {
  const explicitTitle = normalizeStrongTitle(input.explicitTitle);
  if (explicitTitle) return explicitTitle;

  const generatedSeriesTitle = normalizeStrongTitle(input.generatedSeriesTitle);
  if (generatedSeriesTitle) return generatedSeriesTitle;

  const savedSeriesTitle = normalizeStrongTitle(input.savedSeriesTitle);
  if (savedSeriesTitle && !isProtagonistNameFallbackTitle(savedSeriesTitle, input.protagonistName)) return savedSeriesTitle;

  const firstEpisodeTitle = normalizeStrongTitle(input.firstEpisodeTitle);
  if (firstEpisodeTitle) return truncateTitleLike(firstEpisodeTitle, TITLE_MAX_LENGTH);

  const episodeTitle = normalizeStrongTitle(input.episodeTitle);
  if (episodeTitle) return truncateTitleLike(episodeTitle, TITLE_MAX_LENGTH);

  return "Untitled Series";
}

export const BLOODWICK_SERIES_TITLE_PROMPT = `
Bloodwick Series Title Rules:
Create a series_title before drafting the first episode.

A strong Bloodwick series title should contain one concrete anchor and one pressure word.
Concrete anchors include: house, road, lake, choir, dog, mirror, station, orchard, town, bell, photograph, room, signal, basement.
Pressure words include: hungry, wrong, hollow, last, borrowed, dead, midnight, red, hidden, missing, broken, returning, watching.

The title must be:
- specific
- pronounceable
- serializable
- suggestive of a repeatable story world
- 2 to 7 words
- not a protagonist name plus "Series"
- not a generic horror prompt

Prefer titles with:
- a specific place
- a strange object
- a social phrase turned sinister
- an impossible fact
- a named rule
- a local legend
- an emotional contradiction

Avoid generic titles such as:
- The Curse
- The Shadow
- Dark Secrets
- The Haunted House
- The Monster Within

Do not copy famous benchmark titles, plots, distinctive locations, monsters, dialogue, or mythology.

Good Bloodwick-native style examples:
- The Orchard That Answered
- The Last Room in Mercy House
- The Hollow Bell of County Line
- We Don't Go Past the Water Tower
- The Dog Who Barked at Yesterday
- The House That Forgot Us
- The Midnight Rule
- The Lake Beneath the Floor
- The Children of Static Road
- What Came Home Wearing His Face
`.trim();

function normalizeStrongTitle(value?: string | null): string | null {
  const normalized = normalizeBloodwickSeriesTitle(value);
  return normalized && !isWeakBloodwickSeriesTitle(normalized) ? normalized : null;
}

function isBlockedGenericTitle(value: string): boolean {
  const comparable = normalizeComparable(value);
  return BLOODWICK_GENERIC_TITLE_BLOCKLIST.some((blocked) => comparable === blocked);
}

function normalizeComparable(value?: string | null): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function removeWrappingQuotes(value: string): string {
  return value.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();
}

function truncateTitleLike(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength).replace(/[\s,.;:!?-]+$/g, "")}...`;
}
