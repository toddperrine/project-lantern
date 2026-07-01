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
const FEAR_CATEGORY_TO_ANCHOR: Record<string, string> = {
  "Small-Town Dread": "town",
  "Uncanny": "mirror",
  "Weird Nature": "orchard",
  "Creature Unease": "dog",
  "Psychological Dread": "room",
  "Gothic Shadows": "house",
  "Cosmic Horror": "signal",
  "Haunted Past": "photograph",
  "Dark Fairy Tale": "road",
};

const FEAR_CATEGORY_TO_PRESSURE: Record<string, string> = {
  "Small-Town Dread": "hidden",
  "Uncanny": "wrong",
  "Weird Nature": "hungry",
  "Creature Unease": "watching",
  "Psychological Dread": "broken",
  "Gothic Shadows": "hollow",
  "Cosmic Horror": "midnight",
  "Haunted Past": "borrowed",
  "Dark Fairy Tale": "returning",
};

const DEFAULT_PROVISIONAL_ANCHOR = "town";
const DEFAULT_PROVISIONAL_PRESSURE = "hidden";

const PROVISIONAL_ANCHOR_WORDS = [
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
  "photo",
  "room",
  "signal",
  "basement",
  "library",
  "archive",
  "key",
  "woods",
  "trail",
  "school",
  "church",
  "attic",
  "platform",
  "field",
  "door",
  "window",
  "well",
  "tower",
] as const;

const PROVISIONAL_PRESSURE_WORDS = [
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
  "forgotten",
  "vanished",
  "buried",
  "cold",
  "silent",
  "empty",
  "shattered",
  "locked",
  "lost",
] as const;

const PROVISIONAL_ANCHOR_SYNONYMS: Record<string, string> = {
  photos: "photograph",
  photo: "photograph",
  pictures: "photograph",
  dogs: "dog",
  roads: "road",
  rooms: "room",
  woods: "woods",
  keys: "key",
};

const PROVISIONAL_PRESSURE_SYNONYMS: Record<string, string> = {
  vanished: "missing",
  lost: "missing",
  buried: "hidden",
  silent: "hollow",
  empty: "hollow",
  locked: "hidden",
  shattered: "broken",
};

const PROVISIONAL_STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "with",
  "without",
  "into",
  "onto",
  "over",
  "under",
  "because",
  "when",
  "while",
  "where",
  "what",
  "who",
  "his",
  "her",
  "their",
  "its",
  "was",
  "were",
  "is",
  "are",
  "had",
  "has",
  "have",
  "not",
  "yet",
  "then",
  "than",
  "from",
  "this",
  "that",
  "there",
  "here",
  "after",
  "before",
  "through",
  "beneath",
  "above",
  "along",
]);

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

export function isSentenceLikeTitle(value: string | null | undefined): boolean {
  const normalized = normalizeBloodwickSeriesTitle(value);
  if (!normalized) return true;
  if (normalized.split(/\s+/).filter(Boolean).length > 7) return true;
  if (normalized.includes(",")) return true;
  if (normalized.includes("…")) return true;
  if (normalized.includes("...")) return true;
  return /[.!?]$/.test(normalized);
}

export function deriveProvisionalBloodwickSeriesTitle(input: BloodwickSeriesTitleInput): string {
  const fearCategory = normalizeFearCategory(input.fearCategory);
  const fallbackAnchor = FEAR_CATEGORY_TO_ANCHOR[fearCategory] ?? DEFAULT_PROVISIONAL_ANCHOR;
  const fallbackPressure = FEAR_CATEGORY_TO_PRESSURE[fearCategory] ?? DEFAULT_PROVISIONAL_PRESSURE;
  const sourceTexts = getProvisionalSourceTexts(input);
  const anchor = extractProvisionalWord(sourceTexts, PROVISIONAL_ANCHOR_WORDS, PROVISIONAL_ANCHOR_SYNONYMS) ?? fallbackAnchor;
  const pressure = extractProvisionalWord(sourceTexts, PROVISIONAL_PRESSURE_WORDS, PROVISIONAL_PRESSURE_SYNONYMS) ?? fallbackPressure;

  return `The ${toTitleWord(pressure)} ${toTitleWord(anchor)}`;
}

export function getBloodwickSeriesDisplayTitle(input: BloodwickSeriesTitleInput): string {
  const explicitTitle = normalizeUsableSeriesTitle(input.explicitTitle, input.protagonistName);
  if (explicitTitle) return explicitTitle;

  const generatedSeriesTitle = normalizeUsableSeriesTitle(input.generatedSeriesTitle, input.protagonistName);
  if (generatedSeriesTitle) return generatedSeriesTitle;

  const savedSeriesTitle = normalizeUsableSeriesTitle(input.savedSeriesTitle, input.protagonistName);
  if (savedSeriesTitle) return savedSeriesTitle;

  return deriveProvisionalBloodwickSeriesTitle(input) || "Untitled Series";
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

function normalizeUsableSeriesTitle(value: string | null | undefined, protagonistName?: string | null): string | null {
  const normalized = normalizeBloodwickSeriesTitle(value);
  if (!normalized) return null;
  if (isWeakBloodwickSeriesTitle(normalized)) return null;
  if (isProtagonistNameFallbackTitle(normalized, protagonistName)) return null;
  if (isSentenceLikeTitle(normalized)) return null;
  return normalized;
}

function getProvisionalSourceTexts(input: BloodwickSeriesTitleInput): string[] {
  return [input.worldLabel, input.firstEpisodeTitle, input.episodeTitle, input.fearCategory]
    .map((value) => normalizeBloodwickSeriesTitle(value))
    .filter((value): value is string => Boolean(value));
}

function extractProvisionalWord(
  sourceTexts: string[],
  preferredWords: readonly string[],
  synonyms: Record<string, string>
): string | null {
  const preferred = new Set(preferredWords);

  for (const text of sourceTexts) {
    const words = tokenizeProvisionalTitleText(text);
    for (const word of words) {
      const candidate = synonyms[word] ?? word;
      if (preferred.has(candidate)) return candidate;
    }
  }

  return null;
}

function tokenizeProvisionalTitleText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word && !PROVISIONAL_STOP_WORDS.has(word));
}

function normalizeFearCategory(value?: string | null): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
  const match = Object.keys(FEAR_CATEGORY_TO_ANCHOR).find((category) => category.toLowerCase() === normalized);
  if (match) return match;
  if (normalized.includes("small-town") || normalized.includes("small town")) return "Small-Town Dread";
  if (normalized.includes("uncanny")) return "Uncanny";
  if (normalized.includes("weird nature") || normalized.includes("nature")) return "Weird Nature";
  if (normalized.includes("creature")) return "Creature Unease";
  if (normalized.includes("psychological")) return "Psychological Dread";
  if (normalized.includes("gothic")) return "Gothic Shadows";
  if (normalized.includes("cosmic")) return "Cosmic Horror";
  if (normalized.includes("haunted") || normalized.includes("past")) return "Haunted Past";
  if (normalized.includes("fairy") || normalized.includes("folklore")) return "Dark Fairy Tale";
  return "Small-Town Dread";
}

function toTitleWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
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

