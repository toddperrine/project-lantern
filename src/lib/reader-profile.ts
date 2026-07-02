import { normalizeBloodwickFearCategory } from "@/lib/bloodwick-fear-art";

export const CANONICAL_READER_PROFILE_STORAGE_KEY = "projectLantern.readerProfile.v1";
export const READER_ID_STORAGE_KEY = "projectLantern.readerId.v1";
export const READER_PROFILE_STORAGE_KEY = "projectLantern.readerInteractionProfile.v1";
export const READER_PROFILE_ID_STORAGE_KEY = "projectLantern.readerProfileId.v1";
export const READER_PROFILE_SCHEMA_VERSION = 1;
export const MAX_READER_MOOD_HISTORY = 10;
export const MAX_READER_PROFILE_EVENTS = 50;
export const MAX_STORY_FEEDBACK_SIGNALS = 50;
export const MAX_CANONICAL_APPLIED_FEEDBACK_SIGNAL_IDS = 100;
export const MAX_CANONICAL_RECENT_FEEDBACK = 10;
export const MAX_READY_STORY_QUEUE_SIGNALS = 100;
export const DEFAULT_READER_SAFETY_GUARDRAILS = [
  "sexual violence",
  "explicit harm to children",
  "extreme gore",
];
export const READER_PROFILE_PREFERENCES_VERSION = "v2";
export const MAX_READER_HARD_AVOIDANCES = 10;
export const MAX_READER_HARD_AVOIDANCE_LENGTH = 60;

export type ReaderEnergyLevel = "low" | "medium" | "high";
export type ReaderIntensityLevel = "gentle" | "moderate" | "intense";
export type ReaderProfileEventType =
  | "storyGenerated"
  | "storyOpened"
  | "storyContinued"
  | "storyExported"
  | "startSomethingDifferentClicked"
  | "moodSelected"
  | "demoStoryLoaded";
export type ReaderProfileEventSource =
  | "startSomethingNew"
  | "demo"
  | "continueSeries"
  | "create";
export type StoryFeedbackRating =
  | "missed"
  | "not_quite"
  | "good"
  | "great"
  | "favorite";
export type StoryFeedbackScore = 1 | 2 | 3 | 4 | 5;
export type StoryFeedbackReason =
  | "wrong_tone"
  | "too_generic"
  | "too_slow"
  | "confusing"
  | "not_personal_enough"
  | "too_dark"
  | "not_dark_enough"
  | "too_weird"
  | "not_weird_enough"
  | "loved_tone"
  | "loved_character"
  | "wanted_more"
  | "felt_personal"
  | "surprising"
  | "comforting";
export type StoryFeedbackGenerationMode = "new-story" | "continue-story" | "unknown";
export type ReadyStoryQueueSignalType = "read" | "pass" | "save_for_later";

export type ReaderTasteProfileSource =
  | "default"
  | "onboarding"
  | "story-card-swipe"
  | "rating"
  | "behavior"
  | "manual"
  | "legacy-eerie-profile";
export type ReaderFormatPreference = "read" | "listen" | "both";
export type CanonicalPreferredFormat = "story" | "chapter" | "both";
export type CanonicalReaderProfileSource = "local" | "cloud" | "merged" | "default";
export type ReaderProfileContentLane = "not-set" | "all-ages" | "middle-grade" | "teen" | "adult";
export type ReaderProfileNarrativePressure = "not-set" | "gentle-unease" | "balanced-tension" | "dark-intense" | "high-dread";
export type ReaderProfileEpisodeEndingShape = "not-set" | "resolved-incident" | "open-mystery" | "next-episode-pull" | "quiet-aftermath";
export type ReaderProfileProtagonistLens = "not-set" | "surprise-me" | "ordinary-person-pulled-in" | "investigator-seeker" | "caretaker-protector" | "reluctant-keeper-heir" | "outsider-newcomer" | "animal-bonded-protagonist";

export type ReaderProfilePreferences = {
  preferredStoryTypes: string[];
  emotionalPromises?: string[];
  favoriteStoryWorlds?: string[];
  storyIngredients: string[];
  characterLensPreferences?: string[];
  hardAvoidances: string[];
  contentLane: ReaderProfileContentLane;
  narrativePressure: ReaderProfileNarrativePressure;
  episodeEndingShape: ReaderProfileEpisodeEndingShape;
  protagonistLens: ReaderProfileProtagonistLens;
  narrativePressurePreferences?: string[];
  episodeEndingShapePreferences?: string[];
  protagonistLensPreferences?: string[];
  storyFitProfileVersion?: "v1" | "v2";
  updatedAt?: string;
};

export const DEFAULT_READER_PROFILE_PREFERENCES: ReaderProfilePreferences = {
  preferredStoryTypes: [],
  emotionalPromises: [],
  favoriteStoryWorlds: [],
  storyIngredients: [],
  characterLensPreferences: [],
  hardAvoidances: [],
  contentLane: "not-set",
  narrativePressure: "not-set",
  episodeEndingShape: "not-set",
  protagonistLens: "not-set",
  narrativePressurePreferences: [],
  episodeEndingShapePreferences: [],
  protagonistLensPreferences: [],
  storyFitProfileVersion: "v2",
};

export const STORY_FIT_SELECTION_LIMITS = {
  preferredStoryTypes: 6,
  emotionalPromises: 6,
  favoriteStoryWorlds: 8,
  storyIngredients: 10,
  characterLensPreferences: 6,
  narrativePressurePreferences: 4,
  episodeEndingShapePreferences: 4,
  hardAvoidances: MAX_READER_HARD_AVOIDANCES,
} as const;

export type StoryFitOption = {
  label: string;
  description: string;
};

export const STORY_FIT_STORY_TYPE_OPTIONS: StoryFitOption[] = [
  { label: "Small-Town", description: "Ordinary towns, neighborhoods, schools, roads, and families hiding something rotten beneath the surface." },
  { label: "Gothic", description: "Decaying houses, old bloodlines, secrets, romance, inheritance, and dread-soaked atmosphere." },
  { label: "Weird", description: "Reality bends in ways that feel impossible, uncanny, or wrong, often without clear rules or explanation." },
  { label: "Cosmic", description: "Vast unknowable forces make human lives, beliefs, and sanity feel small and fragile." },
  { label: "Folk", description: "Old land, old rituals, rural isolation, village belief, and inherited customs turn threatening." },
  { label: "Supernatural", description: "Ghosts, curses, spirits, hauntings, and impossible forces break into the ordinary world." },
  { label: "Monster", description: "Something living, hungry, changed, or inhuman stalks the edge of the story." },
  { label: "Dark Fantasy", description: "Fairy-tale, mythic, or magical elements turn dangerous, beautiful, and morally unsafe." },
  { label: "Psychological", description: "Fear comes from obsession, guilt, paranoia, memory, identity, and the instability of the mind." },
  { label: "Isolation", description: "Trapped people face sealed spaces, hostile systems, or environments where escape may be impossible." },
];
export const STORY_FIT_EMOTIONAL_PROMISE_OPTIONS: StoryFitOption[] = [
  { label: "A world I can disappear into", description: "Immersive place, texture, atmosphere, and continuity." },
  { label: "A mystery I need answered", description: "Questions, clues, pressure, and revelation." },
  { label: "Dread without nihilism", description: "Darkness with meaning, not empty despair." },
  { label: "Wonder and awe", description: "The strange, vast, beautiful, or impossible." },
  { label: "Characters I care about", description: "People worth following across episodes." },
  { label: "Momentum into the next episode", description: "Forward pull, unresolved pressure, and serial energy." },
  { label: "Emotional release", description: "Fear, grief, relief, catharsis, or recognition." },
  { label: "Meaning under pressure", description: "The story tests values, identity, and choice." },
  { label: "Comfort with teeth", description: "A safe reading feeling with real bite." },
  { label: "Moral trouble", description: "Choices with costs and no clean answer." },
  { label: "Strange beauty", description: "Eerie images, uncanny grace, and memorable atmosphere." },
  { label: "Hope that feels earned", description: "Light that survives contact with darkness." },
];
export const STORY_FIT_WORLD_OPTIONS: StoryFitOption[] = [
  { label: "Small town / neighborhood", description: "Local streets, neighbors, schools, churches, stores, and old secrets." },
  { label: "School, library, museum, or institution", description: "Rules, records, archives, students, staff, collections, and locked rooms." },
  { label: "Old house, estate, hotel, or gothic interior", description: "Architecture with memory, inheritance, rooms, corridors, and hidden histories." },
  { label: "Forest, trail, mountain, river, or wilderness", description: "Nature with pressure, silence, hunger, pattern, or intention." },
  { label: "Deep space, derelict ship, station, or isolated colony", description: "Isolation, signals, hulls, void, machinery, crew pressure, and hostile unknowns." },
  { label: "Lab, research site, corporate facility, or experiment zone", description: "Containment, protocols, specimens, corporate secrecy, and controlled disaster." },
  { label: "Ocean, island, coast, or lighthouse", description: "Water, fog, isolation, wreckage, storms, and things below." },
  { label: "Road, motel, borderland, or lost highway", description: "Transit, liminal stops, strange towns, and roads that do not behave." },
  { label: "City, underground, subway, or hidden district", description: "Crowds, tunnels, infrastructure, hidden communities, and urban wrongness." },
  { label: "Folklore threshold, fairy-tale woods, or old bargain place", description: "Crossings, rules, promises, names, debts, and old powers." },
  { label: "Ordinary home or suburb made wrong", description: "Domestic safety bent into unease." },
  { label: "Ancient ruin, buried town, or lost archive", description: "Old records, buried structures, erased people, and history returning." },
];
export const STORY_FIT_INGREDIENT_OPTIONS: StoryFitOption[] = [
  { label: "Hidden past resurfacing", description: "Old truth comes back with consequences." },
  { label: "Impossible object, map, key, or signal", description: "A specific artifact or message that should not exist." },
  { label: "Moral bargain with a cost", description: "Power, safety, knowledge, or survival requires payment." },
  { label: "Secret society, order, or institution", description: "Organized secrecy with rules and reach." },
  { label: "Creature or presence not fully understood", description: "A living pressure that resists easy explanation." },
  { label: "Memory or time behaving strangely", description: "Recall, sequence, age, repetition, or duration becomes unstable." },
  { label: "Rules-based magic", description: "The impossible follows discoverable laws and consequences." },
  { label: "Strange technology or AI", description: "Machines, systems, signals, or intelligence behaving beyond intent." },
  { label: "Disappearance or investigation", description: "Someone or something is missing, and the search changes the seeker." },
  { label: "Family legacy with consequences", description: "Inheritance, bloodline, duty, debt, or old protection turns active." },
  { label: "Place that changes when entered", description: "Location behaves differently once crossed." },
  { label: "Friendship, duo, trio, or team tested by pressure", description: "Relationships are stressed by fear, secrecy, and choice." },
  { label: "Companion animal", description: "An animal matters to the mystery, bond, danger, or survival." },
  { label: "Containment breach", description: "Something held back gets out, or something outside gets in." },
  { label: "Expedition gone wrong", description: "A planned journey, survey, rescue, or study becomes a trap." },
  { label: "Signal from somewhere impossible", description: "A message arrives from a place, time, mind, machine, or entity that should not speak." },
];
export const STORY_FIT_CHARACTER_LENS_OPTIONS: StoryFitOption[] = [
  { label: "Ordinary person pulled in", description: "A grounded person is forced into the impossible." },
  { label: "Investigator / seeker", description: "Someone needs the truth and keeps digging." },
  { label: "Caretaker / protector", description: "Someone acts because another person, place, or creature needs protection." },
  { label: "Reluctant keeper / heir", description: "Someone inherits a duty, secret, curse, object, or role." },
  { label: "Outsider / newcomer", description: "A person enters a place with rules they do not yet understand." },
  { label: "Animal-bonded protagonist", description: "A bond with an animal shapes perception, danger, or survival." },
  { label: "Duo", description: "Two leads with contrasting needs, trust, or secrets." },
  { label: "Trio / ensemble", description: "A small group whose relationships matter to the plot." },
  { label: "Surprise me", description: "Let Lantyrn choose the best lens for the story." },
];
export const STORY_FIT_NARRATIVE_PRESSURE_OPTIONS: StoryFitOption[] = [
  { label: "Gentle unease", description: "Low pressure, subtle wrongness, and emotional safety." },
  { label: "Balanced tension", description: "A steady mix of atmosphere, mystery, danger, and character pressure." },
  { label: "Dark and intense", description: "Harder fear, sharper stakes, and less comfort." },
  { label: "High dread", description: "Heavy dread, threat, and escalation." },
  { label: "Slow-burn atmospheric", description: "Patient escalation through place, mood, and implication." },
  { label: "Fast danger / chase pressure", description: "Threat moves quickly and forces action." },
  { label: "Psychological pressure", description: "Fear works through perception, guilt, obsession, identity, or doubt." },
  { label: "Cosmic scale pressure", description: "The pressure comes from vastness, insignificance, alien logic, or impossible scale." },
];
export const STORY_FIT_EPISODE_ENDING_OPTIONS: StoryFitOption[] = [
  { label: "Resolved incident", description: "This episode answers its immediate problem." },
  { label: "Open mystery", description: "The larger question remains active." },
  { label: "Next-episode pull", description: "The ending creates a clear desire to continue." },
  { label: "Quiet aftermath", description: "The ending lands emotionally after the event." },
  { label: "Emotional aftershock", description: "The ending leaves the character changed or shaken." },
  { label: "New clue revealed", description: "A fresh piece of information reframes what came before." },
  { label: "Door opens into bigger world", description: "The ending reveals a wider storyworld or deeper system." },
  { label: "Consequence lands", description: "A prior choice or event produces a cost." },
];

export const STORY_FIT_PRESSURE_TO_LEGACY: Record<string, ReaderProfileNarrativePressure> = { "Gentle unease": "gentle-unease", "Balanced tension": "balanced-tension", "Dark and intense": "dark-intense", "High dread": "high-dread", "Slow-burn atmospheric": "gentle-unease", "Fast danger / chase pressure": "dark-intense", "Psychological pressure": "balanced-tension", "Cosmic scale pressure": "high-dread" };
export const STORY_FIT_ENDING_TO_LEGACY: Record<string, ReaderProfileEpisodeEndingShape> = { "Resolved incident": "resolved-incident", "Open mystery": "open-mystery", "Next-episode pull": "next-episode-pull", "Quiet aftermath": "quiet-aftermath", "Emotional aftershock": "quiet-aftermath", "New clue revealed": "open-mystery", "Door opens into bigger world": "next-episode-pull", "Consequence lands": "resolved-incident" };
export const STORY_FIT_CHARACTER_LENS_TO_LEGACY: Record<string, ReaderProfileProtagonistLens> = { "Ordinary person pulled in": "ordinary-person-pulled-in", "Investigator / seeker": "investigator-seeker", "Caretaker / protector": "caretaker-protector", "Reluctant keeper / heir": "reluctant-keeper-heir", "Outsider / newcomer": "outsider-newcomer", "Animal-bonded protagonist": "animal-bonded-protagonist", "Duo": "surprise-me", "Trio / ensemble": "surprise-me", "Surprise me": "surprise-me" };

const APPROVED_STORY_FIT_TYPE_LABELS = new Set([...STORY_FIT_STORY_TYPE_OPTIONS.map((option) => option.label), "Small-Town Dread", "Small Town Dread", "Small-town dread", "Gothic Shadows", "Uncanny", "Cosmic Horror", "Weird Nature", "Haunted Past", "Creature Unease", "Dark Fairy Tale", "Psychological Dread", "No-Exit Dread", "No Exit Dread", "Speculative mystery", "Hidden-world adventure", "Folkloric quest", "Strange road / borderland", "Haunted object or house", "Near-future anomaly", "Animal companion mystery", "Family secret"]);
const APPROVED_STORY_FIT_INGREDIENT_LABELS = new Set([...STORY_FIT_INGREDIENT_OPTIONS.map((option) => option.label), "A hidden past resurfacing", "An impossible object, map, or key", "A moral bargain with a cost", "A secret society or institution", "A creature or presence not fully understood", "A disappearance or investigation", "A place that changes when entered", "A friendship or team tested by pressure", "Magic with rules", "Strange technology", "Ancient folklore", "Ordinary place made uncanny", "Found map / key / object", "Secret society or order", "Family legacy", "Lost town / lost road", "Moral bargain", "Unreliable memory", "Hidden room / hidden archive"]);
const APPROVED_STORY_FIT_EMOTIONAL_PROMISE_LABELS = new Set(STORY_FIT_EMOTIONAL_PROMISE_OPTIONS.map((option) => option.label));
const APPROVED_STORY_FIT_WORLD_LABELS = new Set(STORY_FIT_WORLD_OPTIONS.map((option) => option.label));
const APPROVED_STORY_FIT_CHARACTER_LENS_LABELS = new Set(STORY_FIT_CHARACTER_LENS_OPTIONS.map((option) => option.label));
const APPROVED_STORY_FIT_PRESSURE_LABELS = new Set(STORY_FIT_NARRATIVE_PRESSURE_OPTIONS.map((option) => option.label));
const APPROVED_STORY_FIT_ENDING_LABELS = new Set(STORY_FIT_EPISODE_ENDING_OPTIONS.map((option) => option.label));

export type ReaderFeedbackRating = StoryFeedbackRating;
export type ReaderFeedbackEvent = {
  id: string;
  storyId?: string | null;
  storyTitle?: string | null;
  rating: ReaderFeedbackRating;
  reasons: string[];
  note?: string | null;
  createdAt: string;
  storyMetadata?: StoryFeedbackMetadata;
};

export type StoryFeedbackMetadata = {
  genres?: string[];
  moods?: string[];
  tones?: string[];
  format?: string;
  durationMinutes?: number;
  seriesId?: string;
};

export type CanonicalReaderProfile = {
  readerId: string;
  version: 1;
  createdAt: string;
  updatedAt: string;
  source: CanonicalReaderProfileSource;
  onboarding?: { mode?: "completed" | "skip" | "unknown"; lastMood?: string | null; preferredDuration?: string | null; preferredFormat?: CanonicalPreferredFormat | null };
  preferences: {
    fearIntensity?: number; weirdnessTolerance?: number; supernaturalAffinity?: number; ambiguityTolerance?: number; goreTolerance?: number; sleepSafePreference?: number;
    preferredFormat?: CanonicalPreferredFormat | null; preferredDuration?: string | null; hardAvoidances: string[]; explicitReaderPreferences: ReaderProfilePreferences;
  };
  signals: { storyCardSignalCount: number; feedbackSignalCount: number; favoriteCount: number; savedForLaterCount: number; lastFeedbackAt?: string | null; lastStoryGeneratedAt?: string | null; lastGenerationUsedCanonicalProfile?: boolean; lastFeedbackSignalId?: string | null; lastFeedbackReason?: string | null };
  learned?: { confidence?: number; continuationPreference?: number; genres?: Record<string, number>; moods?: Record<string, number>; tones?: Record<string, number>; formats?: Record<string, number>; durations?: Record<string, number> };
  appliedSignalIds?: string[];
  fallbackReason?: string | null;
  recentFeedback?: ReaderFeedbackEvent[];
};
export type ReaderTasteProfileConfidence = "low" | "medium" | "high";

export interface ReaderWeightedPreference {
  value: number;
  confidence: number;
  source: ReaderTasteProfileSource;
  updatedAt: string;
}

export interface ReaderTasteProfile {
  profileConfidence: ReaderTasteProfileConfidence;
  fearIntensity: ReaderWeightedPreference;
  weirdnessTolerance: ReaderWeightedPreference;
  supernaturalAffinity: ReaderWeightedPreference;
  ambiguityTolerance: ReaderWeightedPreference;
  goreTolerance: ReaderWeightedPreference;
  sleepSafePreference: ReaderWeightedPreference;
  preferredFormat: ReaderFormatPreference;
  preferredDurationMinutes: 5 | 10 | 15 | 20;
  defaultSafetyGuardrails: string[];
  userHardAvoidances: string[];
  affinities: Record<string, ReaderWeightedPreference>;
  source: ReaderTasteProfileSource;
  updatedAt: string;
}

export const STORY_FEEDBACK_SCORE_BY_RATING: Record<StoryFeedbackRating, StoryFeedbackScore> = {
  missed: 1,
  not_quite: 2,
  good: 3,
  great: 4,
  favorite: 5,
};

export interface ReaderMoodSnapshot {
  id: string;
  createdAt: string;
  mood: string;
  desiredFeeling: string;
  energyLevel: ReaderEnergyLevel;
  intensityLevel: ReaderIntensityLevel;
  avoidances: string;
  needRightNow: string;
}

export interface ReaderProfileCounters {
  totalStoriesGenerated: number;
  totalStoriesOpened: number;
  totalContinues: number;
  totalExports: number;
  totalStartSomethingDifferent: number;
  totalDemoStoriesLoaded: number;
  totalMoodSelections: number;
}

export interface StoryFeedbackSignal {
  storyId: string;
  storyTitle?: string;
  rating: StoryFeedbackRating;
  score: StoryFeedbackScore;
  reasons: StoryFeedbackReason[];
  generationMode: StoryFeedbackGenerationMode;
  createdAt: string;
  updatedAt: string;
}

export interface ReadyStoryQueueLearningSignal {
  storyCardId: string;
  storyTitle: string;
  signal: ReadyStoryQueueSignalType;
  genre?: string;
  mood?: string;
  source: "desktop-ready-story-queue";
  createdAt: string;
  updatedAt: string;
}

export interface ReaderProfileEvent {
  eventType: ReaderProfileEventType;
  timestamp: string;
  source?: ReaderProfileEventSource;
  storyId?: string;
  title?: string;
  genre?: string;
  mood?: string;
  wordCount?: number;
}

export interface ReaderProfile {
  schemaVersion: typeof READER_PROFILE_SCHEMA_VERSION;
  profileExists: boolean;
  createdAt: string;
  updatedAt: string;
  counters: ReaderProfileCounters;
  moodCounts: Record<string, number>;
  genreCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  recentEvents: ReaderProfileEvent[];
  latestMood?: ReaderMoodSnapshot;
  moodHistory: ReaderMoodSnapshot[];
  storyFeedbackSignals?: StoryFeedbackSignal[];
  readyStoryQueueSignals?: ReadyStoryQueueLearningSignal[];
  tasteProfile?: ReaderTasteProfile;
  explicitReaderPreferences: ReaderProfilePreferences;
}

export type ReaderMoodDraft = {
  mood: string;
  desiredFeeling: string;
  energyLevel: ReaderEnergyLevel;
  intensityLevel: ReaderIntensityLevel;
  avoidances: string;
  needRightNow: string;
};

export type ReaderProfileEventInput = Omit<ReaderProfileEvent, "timestamp"> & {
  timestamp?: string;
};

export function createEmptyReaderProfile(updatedAt = ""): ReaderProfile {
  return {
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
    profileExists: false,
    createdAt: "",
    updatedAt,
    counters: createEmptyReaderProfileCounters(),
    moodCounts: {},
    genreCounts: {},
    sourceCounts: {},
    recentEvents: [],
    moodHistory: [],
    storyFeedbackSignals: [],
    readyStoryQueueSignals: [],
    tasteProfile: createDefaultReaderTasteProfile(updatedAt || new Date().toISOString()),
    explicitReaderPreferences: { ...DEFAULT_READER_PROFILE_PREFERENCES },
  };
}

export function createDefaultReaderTasteProfile(updatedAt = new Date().toISOString()): ReaderTasteProfile {
  const weighted = (value: number): ReaderWeightedPreference => ({
    value,
    confidence: 0.2,
    source: "default",
    updatedAt,
  });

  return {
    profileConfidence: "low",
    fearIntensity: weighted(0.45),
    weirdnessTolerance: weighted(0.45),
    supernaturalAffinity: weighted(0.5),
    ambiguityTolerance: weighted(0.6),
    goreTolerance: weighted(0.15),
    sleepSafePreference: weighted(0.7),
    preferredFormat: "both",
    preferredDurationMinutes: 10,
    defaultSafetyGuardrails: [...DEFAULT_READER_SAFETY_GUARDRAILS],
    userHardAvoidances: [],
    affinities: {},
    source: "default",
    updatedAt,
  };
}

export function createNextReaderProfileUpdatedAt(previousUpdatedAt?: string, requestedUpdatedAt?: string): string {
  const nowMs = Date.now();
  const previousMs = Date.parse(previousUpdatedAt || "");
  const requestedMs = Date.parse(requestedUpdatedAt || "");
  const safePreviousMs = Number.isFinite(previousMs) ? previousMs : 0;
  const safeRequestedMs = Number.isFinite(requestedMs) ? requestedMs : 0;
  const nextMs = Math.max(nowMs, safeRequestedMs, safePreviousMs + 1);

  return new Date(nextMs).toISOString();
}

export function readReaderProfile(): ReaderProfile {
  if (typeof window === "undefined") return createEmptyReaderProfile();

  try {
    const raw = window.localStorage.getItem(READER_PROFILE_STORAGE_KEY);
    if (!raw) return createEmptyReaderProfile();

    return normalizeReaderProfile(JSON.parse(raw));
  } catch {
    return createEmptyReaderProfile();
  }
}

export function readOrCreateReaderProfileId(): string {
  if (typeof window === "undefined") return "";

  try {
    const storedProfileId = window.localStorage.getItem(READER_PROFILE_ID_STORAGE_KEY);
    if (isReaderProfileId(storedProfileId)) return storedProfileId;

    const profileId = createReaderProfileId();
    window.localStorage.setItem(READER_PROFILE_ID_STORAGE_KEY, profileId);
    return profileId;
  } catch {
    return createReaderProfileId();
  }
}

export function readerProfileExistsInLocalStorage(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem(READER_PROFILE_STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function persistReaderProfile(profile: ReaderProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    READER_PROFILE_STORAGE_KEY,
    JSON.stringify(normalizeReaderProfile(profile)),
  );
}

export function clearReaderProfile(): ReaderProfile {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(READER_PROFILE_STORAGE_KEY);
  }

  return createEmptyReaderProfile();
}

export function saveReaderMoodSnapshot(draft: ReaderMoodDraft, profile?: ReaderProfile, persist = true): ReaderProfile {
  const currentProfile = profile ? normalizeReaderProfile(profile) : readReaderProfile();
  const now = createNextReaderProfileUpdatedAt(currentProfile.updatedAt);
  const snapshot: ReaderMoodSnapshot = {
    id: createReaderMoodSnapshotId(now),
    createdAt: now,
    mood: normalizeFreeText(draft.mood),
    desiredFeeling: normalizeFreeText(draft.desiredFeeling),
    energyLevel: isReaderEnergyLevel(draft.energyLevel)
      ? draft.energyLevel
      : "medium",
    intensityLevel: isReaderIntensityLevel(draft.intensityLevel)
      ? draft.intensityLevel
      : "moderate",
    avoidances: normalizeFreeText(draft.avoidances),
    needRightNow: normalizeFreeText(draft.needRightNow),
  };

  const nextProfile: ReaderProfile = {
    ...currentProfile,
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
    profileExists: true,
    createdAt: currentProfile.createdAt || now,
    updatedAt: now,
    latestMood: snapshot,
    moodHistory: [
      snapshot,
      ...currentProfile.moodHistory.filter(isReaderMoodSnapshot),
    ].slice(0, MAX_READER_MOOD_HISTORY),
  };

  if (persist) persistReaderProfile(nextProfile);
  return nextProfile;
}

export function recordReaderProfileEvent(event: ReaderProfileEventInput, profile?: ReaderProfile, persist = true): ReaderProfile {
  const currentProfile = profile ? normalizeReaderProfile(profile) : readReaderProfile();
  const eventTimestamp = event.timestamp ?? createNextReaderProfileUpdatedAt(currentProfile.updatedAt);
  const updatedAt = createNextReaderProfileUpdatedAt(currentProfile.updatedAt, eventTimestamp);
  const normalizedEvent = normalizeReaderProfileEvent({ ...event, timestamp: eventTimestamp });
  const nextProfile: ReaderProfile = {
    ...currentProfile,
    profileExists: true,
    createdAt: currentProfile.createdAt || updatedAt,
    updatedAt,
    counters: incrementReaderProfileCounters(currentProfile.counters, normalizedEvent.eventType),
    moodCounts: incrementCount(currentProfile.moodCounts, normalizedEvent.mood),
    genreCounts: incrementCount(currentProfile.genreCounts, normalizedEvent.genre),
    sourceCounts: incrementCount(currentProfile.sourceCounts, normalizedEvent.source),
    recentEvents: [normalizedEvent, ...currentProfile.recentEvents.filter(isReaderProfileEvent)].slice(0, MAX_READER_PROFILE_EVENTS),
  };

  if (persist) persistReaderProfile(nextProfile);
  return nextProfile;
}

export function saveStoryFeedbackSignal(nextSignal: StoryFeedbackSignal, profile?: ReaderProfile, persist = true): ReaderProfile {
  const currentProfile = profile ? normalizeReaderProfile(profile) : readReaderProfile();
  const now = createNextReaderProfileUpdatedAt(currentProfile.updatedAt, nextSignal.updatedAt);
  const existingSignal = currentProfile.storyFeedbackSignals?.find(
    (signal) => signal.storyId === nextSignal.storyId,
  );
  const normalizedSignal = normalizeStoryFeedbackSignal({
    ...nextSignal,
    createdAt: existingSignal?.createdAt || nextSignal.createdAt || now,
    updatedAt: now,
  });
  if (!normalizedSignal) return currentProfile;

  const nextProfile: ReaderProfile = {
    ...currentProfile,
    profileExists: true,
    createdAt: currentProfile.createdAt || normalizedSignal.createdAt,
    updatedAt: normalizedSignal.updatedAt,
    storyFeedbackSignals: upsertStoryFeedbackSignal(
      currentProfile.storyFeedbackSignals,
      normalizedSignal,
    ),
  };

  if (persist) persistReaderProfile(nextProfile);
  return nextProfile;
}

export function saveReadyStoryQueueSignal(nextSignal: ReadyStoryQueueLearningSignal, profile?: ReaderProfile, persist = true): ReaderProfile {
  const currentProfile = profile ? normalizeReaderProfile(profile) : readReaderProfile();
  const updatedAt = createNextReaderProfileUpdatedAt(currentProfile.updatedAt, nextSignal.updatedAt || nextSignal.createdAt);
  const normalizedSignal = normalizeReadyStoryQueueLearningSignal({
    ...nextSignal,
    createdAt: nextSignal.createdAt || updatedAt,
    updatedAt
  });

  if (!normalizedSignal) return currentProfile;

  const nextProfile: ReaderProfile = {
    ...currentProfile,
    profileExists: true,
    createdAt: currentProfile.createdAt || updatedAt,
    updatedAt,
    readyStoryQueueSignals: [
      normalizedSignal,
      ...(currentProfile.readyStoryQueueSignals ?? []).filter(
        (signal) => !(signal.storyCardId === normalizedSignal.storyCardId && signal.signal === normalizedSignal.signal)
      )
    ].slice(0, MAX_READY_STORY_QUEUE_SIGNALS)
  };

  if (persist) persistReaderProfile(nextProfile);
  return nextProfile;
}

export function upsertStoryFeedbackSignal(
  existingSignals: StoryFeedbackSignal[] | undefined,
  nextSignal: StoryFeedbackSignal
): StoryFeedbackSignal[] {
  const existing = Array.isArray(existingSignals) ? existingSignals : [];
  const withoutCurrentStory = existing.filter(
    (signal) => signal.storyId !== nextSignal.storyId
  );

  return [...withoutCurrentStory, nextSignal].slice(-50);
}

export function normalizeReaderProfile(value: unknown): ReaderProfile {
  const candidate = value as Partial<ReaderProfile>;

  if (
    !candidate ||
    typeof candidate !== "object" ||
    candidate.schemaVersion !== READER_PROFILE_SCHEMA_VERSION
  ) {
    return createEmptyReaderProfile();
  }

  const moodHistory = Array.isArray(candidate.moodHistory)
    ? candidate.moodHistory
        .filter(isReaderMoodSnapshot)
        .slice(0, MAX_READER_MOOD_HISTORY)
    : [];

  const latestMood = isReaderMoodSnapshot(candidate.latestMood)
    ? candidate.latestMood
    : moodHistory[0];
  const recentEvents = Array.isArray(candidate.recentEvents)
    ? candidate.recentEvents
        .filter(isReaderProfileEvent)
        .slice(0, MAX_READER_PROFILE_EVENTS)
    : [];
  const storyFeedbackSignals = Array.isArray(candidate.storyFeedbackSignals)
    ? candidate.storyFeedbackSignals
        .map(normalizeStoryFeedbackSignal)
        .filter((signal): signal is StoryFeedbackSignal => Boolean(signal))
        .slice(-MAX_STORY_FEEDBACK_SIGNALS)
    : [];
  const readyStoryQueueSignals = Array.isArray(candidate.readyStoryQueueSignals)
    ? candidate.readyStoryQueueSignals
        .map(normalizeReadyStoryQueueLearningSignal)
        .filter((signal): signal is ReadyStoryQueueLearningSignal => Boolean(signal))
        .slice(0, MAX_READY_STORY_QUEUE_SIGNALS)
    : [];
  const counters = normalizeReaderProfileCounters(candidate.counters);
  const updatedAt =
    typeof candidate.updatedAt === "string"
      ? candidate.updatedAt
      : (recentEvents[0]?.timestamp ?? latestMood?.createdAt ?? "");
  const createdAt =
    typeof candidate.createdAt === "string"
      ? candidate.createdAt
      : (recentEvents[recentEvents.length - 1]?.timestamp ?? latestMood?.createdAt ?? "");
  const tasteProfile = candidate.tasteProfile
    ? normalizeReaderTasteProfile(candidate.tasteProfile)
    : createDefaultReaderTasteProfile(updatedAt || new Date().toISOString());

  const explicitReaderPreferences = normalizeReaderProfilePreferences(candidate.explicitReaderPreferences);

  const profileExists = Boolean(
    candidate.profileExists ||
      latestMood ||
      moodHistory.length ||
      recentEvents.length ||
      Object.values(counters).some((count) => count > 0) ||
      storyFeedbackSignals.length > 0 ||
      readyStoryQueueSignals.length > 0 ||
      hasReaderProfilePreferences(explicitReaderPreferences),
  );

  return {
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
    profileExists,
    createdAt,
    updatedAt,
    counters,
    moodCounts: normalizeCountRecord(candidate.moodCounts),
    genreCounts: normalizeCountRecord(candidate.genreCounts),
    sourceCounts: normalizeCountRecord(candidate.sourceCounts),
    recentEvents,
    ...(latestMood ? { latestMood } : {}),
    moodHistory,
    storyFeedbackSignals,
    readyStoryQueueSignals,
    tasteProfile,
    explicitReaderPreferences,
  };
}

export function normalizeReaderProfilePreferences(value: unknown): ReaderProfilePreferences {
  const candidate = isRecord(value) ? value : {};
  const legacyMoodValues = readStringArray(candidate.preferredMoods);
  const explicitStoryTypes = normalizeStoryFitStoryTypePreferenceItems(readStringArray(candidate.preferredStoryTypes));
  const preferredStoryTypes = explicitStoryTypes.length
    ? explicitStoryTypes
    : normalizeStoryFitStoryTypePreferenceItems(legacyMoodValues);
  const explicitIngredients = filterApprovedPreferenceItems(readStringArray(candidate.storyIngredients), APPROVED_STORY_FIT_INGREDIENT_LABELS, STORY_FIT_SELECTION_LIMITS.storyIngredients);
  const legacyGenreValues = readStringArray(candidate.preferredGenres);
  const storyIngredients = explicitIngredients.length
    ? explicitIngredients
    : migrateLegacyGenreIngredients(legacyGenreValues);
  const fallbackNarrativePressure = isReaderProfileNarrativePressure(candidate.narrativePressure) ? candidate.narrativePressure : migrateStoryIntensity(candidate.storyIntensity ?? legacyMoodValues);
  const fallbackEndingShape = isReaderProfileEpisodeEndingShape(candidate.episodeEndingShape) ? candidate.episodeEndingShape : migrateEndingPreference(candidate.endingPreference);
  const fallbackProtagonistLens = isReaderProfileProtagonistLens(candidate.protagonistLens) ? candidate.protagonistLens : migrateHeroPreference(candidate.heroPreference);
  const hasPressurePreferences = Array.isArray(candidate.narrativePressurePreferences);
  const hasEndingPreferences = Array.isArray(candidate.episodeEndingShapePreferences);
  const hasLensPreferences = Array.isArray(candidate.protagonistLensPreferences);
  const narrativePressurePreferences = hasPressurePreferences
    ? filterApprovedPreferenceItems(readStringArray(candidate.narrativePressurePreferences), APPROVED_STORY_FIT_PRESSURE_LABELS, STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences)
    : legacyNarrativePressureToStoryFitPreference(fallbackNarrativePressure);
  const episodeEndingShapePreferences = hasEndingPreferences
    ? filterApprovedPreferenceItems(readStringArray(candidate.episodeEndingShapePreferences), APPROVED_STORY_FIT_ENDING_LABELS, STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences)
    : legacyEpisodeEndingToStoryFitPreference(fallbackEndingShape);
  const protagonistLensPreferences = hasLensPreferences
    ? filterApprovedPreferenceItems(readStringArray(candidate.protagonistLensPreferences), APPROVED_STORY_FIT_CHARACTER_LENS_LABELS, STORY_FIT_SELECTION_LIMITS.characterLensPreferences)
    : legacyProtagonistLensToStoryFitPreference(fallbackProtagonistLens);

  return {
    preferredStoryTypes,
    emotionalPromises: filterApprovedPreferenceItems(readStringArray(candidate.emotionalPromises), APPROVED_STORY_FIT_EMOTIONAL_PROMISE_LABELS, STORY_FIT_SELECTION_LIMITS.emotionalPromises),
    favoriteStoryWorlds: filterApprovedPreferenceItems(readStringArray(candidate.favoriteStoryWorlds), APPROVED_STORY_FIT_WORLD_LABELS, STORY_FIT_SELECTION_LIMITS.favoriteStoryWorlds),
    storyIngredients: storyIngredients.slice(0, STORY_FIT_SELECTION_LIMITS.storyIngredients),
    characterLensPreferences: filterApprovedPreferenceItems(readStringArray(candidate.characterLensPreferences), APPROVED_STORY_FIT_CHARACTER_LENS_LABELS, STORY_FIT_SELECTION_LIMITS.characterLensPreferences),
    hardAvoidances: readStringArray(candidate.hardAvoidances).reduce((items, item) => addUniquePreferenceItem(items, item, STORY_FIT_SELECTION_LIMITS.hardAvoidances), [] as string[]),
    contentLane: isReaderProfileContentLane(candidate.contentLane) ? candidate.contentLane : "not-set",
    narrativePressure: narrativePressurePreferences.length ? STORY_FIT_PRESSURE_TO_LEGACY[narrativePressurePreferences[0]] ?? "not-set" : fallbackNarrativePressure,
    episodeEndingShape: episodeEndingShapePreferences.length ? STORY_FIT_ENDING_TO_LEGACY[episodeEndingShapePreferences[0]] ?? "not-set" : fallbackEndingShape,
    protagonistLens: protagonistLensPreferences.length ? STORY_FIT_CHARACTER_LENS_TO_LEGACY[protagonistLensPreferences[0]] ?? "not-set" : fallbackProtagonistLens,
    narrativePressurePreferences,
    episodeEndingShapePreferences,
    protagonistLensPreferences,
    storyFitProfileVersion: "v2",
    ...(typeof candidate.updatedAt === "string" && candidate.updatedAt.trim() ? { updatedAt: candidate.updatedAt } : {}),
  };
}

function normalizeStoryFitStoryTypePreferenceItems(values: string[]): string[] {
  return values.reduce((items, value) => {
    const normalizedCategory = normalizeBloodwickFearCategory(value);
    if (normalizedCategory) {
      return addUniquePreferenceItem(items, normalizedCategory, STORY_FIT_SELECTION_LIMITS.preferredStoryTypes);
    }

    const approved = Array.from(APPROVED_STORY_FIT_TYPE_LABELS).find((label) => label.toLowerCase() === value.trim().toLowerCase());
    return approved ? addUniquePreferenceItem(items, approved, STORY_FIT_SELECTION_LIMITS.preferredStoryTypes) : items;
  }, [] as string[]);
}

function filterApprovedPreferenceItems(values: string[], approvedLabels: Set<string>, maxItems: number): string[] {
  return values.reduce((items, value) => {
    const approved = Array.from(approvedLabels).find((label) => label.toLowerCase() === value.trim().toLowerCase());
    return approved ? addUniquePreferenceItem(items, approved, maxItems) : items;
  }, [] as string[]);
}

function legacyNarrativePressureToStoryFitPreference(value: ReaderProfileNarrativePressure): string[] {
  const match = Object.entries(STORY_FIT_PRESSURE_TO_LEGACY).find(([, legacy]) => legacy === value);
  return match && value !== "not-set" ? [match[0]] : [];
}

function legacyEpisodeEndingToStoryFitPreference(value: ReaderProfileEpisodeEndingShape): string[] {
  const match = Object.entries(STORY_FIT_ENDING_TO_LEGACY).find(([, legacy]) => legacy === value);
  return match && value !== "not-set" ? [match[0]] : [];
}

function legacyProtagonistLensToStoryFitPreference(value: ReaderProfileProtagonistLens): string[] {
  const match = Object.entries(STORY_FIT_CHARACTER_LENS_TO_LEGACY).find(([, legacy]) => legacy === value);
  return match && value !== "not-set" ? [match[0]] : [];
}

function migrateLegacyGenreIngredients(values: string[]): string[] {
  return values.reduce((items, value) => {
    const normalized = normalizePreferenceText(value).toLowerCase();
    if (normalized === "fantasy") return addUniquePreferenceItem(items, "Rules-based magic", STORY_FIT_SELECTION_LIMITS.storyIngredients);
    if (normalized === "science fiction" || normalized === "sci-fi" || normalized === "sci fi") return addUniquePreferenceItem(items, "Strange technology or AI", STORY_FIT_SELECTION_LIMITS.storyIngredients);
    return items;
  }, [] as string[]);
}

export function normalizePreferenceText(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, MAX_READER_HARD_AVOIDANCE_LENGTH);
}

export function addUniquePreferenceItem(items: string[], next: string, maxItems: number): string[] {
  const normalized = normalizePreferenceText(next);
  if (!normalized) return items;
  const exists = items.some((item) => item.toLowerCase() === normalized.toLowerCase());
  if (exists) return items;
  return [...items, normalized].slice(0, maxItems);
}

export function hasReaderProfilePreferences(preferences: ReaderProfilePreferences): boolean {
  return Boolean(preferences.preferredStoryTypes.length || (preferences.emotionalPromises?.length ?? 0) || (preferences.favoriteStoryWorlds?.length ?? 0) || preferences.storyIngredients.length || (preferences.characterLensPreferences?.length ?? 0) || (preferences.narrativePressurePreferences?.length ?? 0) || (preferences.episodeEndingShapePreferences?.length ?? 0) || (preferences.protagonistLensPreferences?.length ?? 0) || preferences.hardAvoidances.length || preferences.contentLane !== "not-set" || preferences.narrativePressure !== "not-set" || preferences.episodeEndingShape !== "not-set" || preferences.protagonistLens !== "not-set");
}

export function saveReaderProfilePreferences(nextPreferences: ReaderProfilePreferences, profile?: ReaderProfile, persist = true): ReaderProfile {
  const currentProfile = profile ? normalizeReaderProfile(profile) : readReaderProfile();
  const updatedAt = createNextReaderProfileUpdatedAt(currentProfile.updatedAt, nextPreferences.updatedAt);
  const explicitReaderPreferences = normalizeReaderProfilePreferences({ ...nextPreferences, updatedAt });
  const nextProfile = normalizeReaderProfile({
    ...currentProfile,
    profileExists: true,
    createdAt: currentProfile.createdAt || updatedAt,
    updatedAt,
    explicitReaderPreferences,
  });
  if (persist) persistReaderProfile(nextProfile);
  return nextProfile;
}

function isReaderProfileContentLane(value: unknown): value is ReaderProfileContentLane { return value === "not-set" || value === "all-ages" || value === "middle-grade" || value === "teen" || value === "adult"; }
function isReaderProfileNarrativePressure(value: unknown): value is ReaderProfileNarrativePressure { return value === "not-set" || value === "gentle-unease" || value === "balanced-tension" || value === "dark-intense" || value === "high-dread"; }
function isReaderProfileEpisodeEndingShape(value: unknown): value is ReaderProfileEpisodeEndingShape { return value === "not-set" || value === "resolved-incident" || value === "open-mystery" || value === "next-episode-pull" || value === "quiet-aftermath"; }
function isReaderProfileProtagonistLens(value: unknown): value is ReaderProfileProtagonistLens { return value === "not-set" || value === "surprise-me" || value === "ordinary-person-pulled-in" || value === "investigator-seeker" || value === "caretaker-protector" || value === "reluctant-keeper-heir" || value === "outsider-newcomer" || value === "animal-bonded-protagonist"; }

function migrateStoryIntensity(value: unknown): ReaderProfileNarrativePressure {
  const values = Array.isArray(value) ? value : [value];
  if (values.some((item) => normalizePreferenceText(String(item)).toLowerCase() === "scary")) return "dark-intense";
  if (values.includes("gentle")) return "gentle-unease";
  if (values.includes("balanced")) return "balanced-tension";
  if (values.includes("intense")) return "dark-intense";
  return "not-set";
}

function migrateEndingPreference(value: unknown): ReaderProfileEpisodeEndingShape {
  if (value === "mostly-resolved") return "resolved-incident";
  if (value === "open-ended") return "open-mystery";
  if (value === "serialized-pressure") return "next-episode-pull";
  return "not-set";
}

function migrateHeroPreference(value: unknown): ReaderProfileProtagonistLens {
  if (value === "surprise-me") return "surprise-me";
  if (value === "hero-like-me") return "ordinary-person-pulled-in";
  if (value === "hero-unlike-me") return "outsider-newcomer";
  return "not-set";
}

export function normalizeReaderTasteProfile(value: unknown): ReaderTasteProfile {
  const fallback = createDefaultReaderTasteProfile();
  const candidate = value as Partial<ReaderTasteProfile>;

  if (!candidate || typeof candidate !== "object") return fallback;

  const updatedAt = typeof candidate.updatedAt === "string" && candidate.updatedAt.trim()
    ? candidate.updatedAt
    : fallback.updatedAt;

  return {
    profileConfidence: isReaderTasteProfileConfidence(candidate.profileConfidence) ? candidate.profileConfidence : fallback.profileConfidence,
    fearIntensity: normalizeReaderWeightedPreference(candidate.fearIntensity, fallback.fearIntensity),
    weirdnessTolerance: normalizeReaderWeightedPreference(candidate.weirdnessTolerance, fallback.weirdnessTolerance),
    supernaturalAffinity: normalizeReaderWeightedPreference(candidate.supernaturalAffinity, fallback.supernaturalAffinity),
    ambiguityTolerance: normalizeReaderWeightedPreference(candidate.ambiguityTolerance, fallback.ambiguityTolerance),
    goreTolerance: normalizeReaderWeightedPreference(candidate.goreTolerance, fallback.goreTolerance),
    sleepSafePreference: normalizeReaderWeightedPreference(candidate.sleepSafePreference, fallback.sleepSafePreference),
    preferredFormat: isReaderFormatPreference(candidate.preferredFormat) ? candidate.preferredFormat : fallback.preferredFormat,
    preferredDurationMinutes: isReaderPreferredDuration(candidate.preferredDurationMinutes) ? candidate.preferredDurationMinutes : fallback.preferredDurationMinutes,
    defaultSafetyGuardrails: Array.isArray(candidate.defaultSafetyGuardrails)
      ? dedupe(candidate.defaultSafetyGuardrails.filter((item): item is string => typeof item === "string"))
      : fallback.defaultSafetyGuardrails,
    userHardAvoidances: Array.isArray(candidate.userHardAvoidances)
      ? dedupe(candidate.userHardAvoidances.filter((item): item is string => typeof item === "string"))
      : [],
    affinities: normalizeReaderTasteAffinities(candidate.affinities, fallback.affinities),
    source: isReaderTasteProfileSource(candidate.source) ? candidate.source : fallback.source,
    updatedAt,
  };
}

function normalizeReaderWeightedPreference(value: unknown, fallback: ReaderWeightedPreference): ReaderWeightedPreference {
  const candidate = value as Partial<ReaderWeightedPreference>;
  if (!candidate || typeof candidate !== "object") return fallback;

  return {
    value: clamp01(typeof candidate.value === "number" ? candidate.value : fallback.value),
    confidence: clamp01(typeof candidate.confidence === "number" ? candidate.confidence : fallback.confidence),
    source: isReaderTasteProfileSource(candidate.source) ? candidate.source : fallback.source,
    updatedAt: typeof candidate.updatedAt === "string" && candidate.updatedAt.trim() ? candidate.updatedAt : fallback.updatedAt,
  };
}

function normalizeReaderTasteAffinities(
  value: unknown,
  fallback: Record<string, ReaderWeightedPreference>
): Record<string, ReaderWeightedPreference> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, preference]) => [
      normalizeFreeText(key),
      normalizeReaderWeightedPreference(preference, createDefaultReaderTasteProfile().fearIntensity),
    ]).filter(([key]) => Boolean(key))
  );
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function isReaderTasteProfileSource(value: unknown): value is ReaderTasteProfileSource {
  return value === "default" ||
    value === "onboarding" ||
    value === "story-card-swipe" ||
    value === "rating" ||
    value === "behavior" ||
    value === "manual" ||
    value === "legacy-eerie-profile";
}

function isReaderFormatPreference(value: unknown): value is ReaderFormatPreference {
  return value === "read" || value === "listen" || value === "both";
}

function isReaderTasteProfileConfidence(value: unknown): value is ReaderTasteProfileConfidence {
  return value === "low" || value === "medium" || value === "high";
}

function isReaderPreferredDuration(value: unknown): value is 5 | 10 | 15 | 20 {
  return value === 5 || value === 10 || value === 15 || value === 20;
}

export function isReaderProfileId(value: unknown): value is string {
  return typeof value === "string" && /^reader-profile-[A-Za-z0-9._:-]+$/.test(value) && value.length <= 120;
}

function createReaderProfileId(): string {
  const randomUUID = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return `reader-profile-${randomUUID}`;
}

export function isReaderMoodSnapshot(
  value: unknown,
): value is ReaderMoodSnapshot {
  const candidate = value as Partial<ReaderMoodSnapshot>;

  return Boolean(
    candidate &&
    typeof candidate === "object" &&
    typeof candidate.id === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.mood === "string" &&
    typeof candidate.desiredFeeling === "string" &&
    isReaderEnergyLevel(candidate.energyLevel) &&
    isReaderIntensityLevel(candidate.intensityLevel) &&
    typeof candidate.avoidances === "string" &&
    typeof candidate.needRightNow === "string",
  );
}

export function isReaderEnergyLevel(
  value: unknown,
): value is ReaderEnergyLevel {
  return value === "low" || value === "medium" || value === "high";
}

export function isReaderIntensityLevel(
  value: unknown,
): value is ReaderIntensityLevel {
  return value === "gentle" || value === "moderate" || value === "intense";
}

export function formatReaderMoodForPrompt(
  snapshot: ReaderMoodSnapshot | null | undefined,
): string {
  if (!isReaderMoodSnapshot(snapshot)) return "";

  return [
    "Reader mood/intention snapshot for this generation:",
    `- Current day / mood: ${snapshot.mood || "not specified"}`,
    `- Desired story feeling: ${snapshot.desiredFeeling || "not specified"}`,
    `- Energy level: ${snapshot.energyLevel}`,
    `- Preferred intensity: ${snapshot.intensityLevel}`,
    `- Things to avoid: ${snapshot.avoidances || "none specified"}`,
    `- What the reader needs right now: ${snapshot.needRightNow || "not specified"}`,
    "Use this to shape tone, pacing, emotional texture, premise pressure, and story suggestions. Respect avoidances. Do not mention the reader profile or explain that personalization was used.",
  ].join("\n");
}

function createEmptyReaderProfileCounters(): ReaderProfileCounters {
  return {
    totalStoriesGenerated: 0,
    totalStoriesOpened: 0,
    totalContinues: 0,
    totalExports: 0,
    totalStartSomethingDifferent: 0,
    totalDemoStoriesLoaded: 0,
    totalMoodSelections: 0,
  };
}

function normalizeReaderProfileCounters(value: unknown): ReaderProfileCounters {
  const candidate = value as Partial<ReaderProfileCounters>;
  const emptyCounters = createEmptyReaderProfileCounters();

  return Object.fromEntries(
    Object.entries(emptyCounters).map(([key]) => [
      key,
      normalizeCount(candidate?.[key as keyof ReaderProfileCounters]),
    ]),
  ) as unknown as ReaderProfileCounters;
}

function incrementReaderProfileCounters(counters: ReaderProfileCounters, eventType: ReaderProfileEventType): ReaderProfileCounters {
  const nextCounters = { ...normalizeReaderProfileCounters(counters) };
  if (eventType === "storyGenerated") nextCounters.totalStoriesGenerated += 1;
  if (eventType === "storyOpened") nextCounters.totalStoriesOpened += 1;
  if (eventType === "storyContinued") nextCounters.totalContinues += 1;
  if (eventType === "storyExported") nextCounters.totalExports += 1;
  if (eventType === "startSomethingDifferentClicked") nextCounters.totalStartSomethingDifferent += 1;
  if (eventType === "demoStoryLoaded") nextCounters.totalDemoStoriesLoaded += 1;
  if (eventType === "moodSelected") nextCounters.totalMoodSelections += 1;
  return nextCounters;
}

function normalizeStoryFeedbackSignal(value: unknown): StoryFeedbackSignal | null {
  const candidate = value as Partial<StoryFeedbackSignal>;
  if (!candidate || typeof candidate !== "object" || !candidate.storyId || !isStoryFeedbackRating(candidate.rating)) return null;

  const score = STORY_FEEDBACK_SCORE_BY_RATING[candidate.rating];
  const reasons = Array.isArray(candidate.reasons)
    ? candidate.reasons.filter(isStoryFeedbackReason)
    : [];

  return {
    storyId: normalizeFreeText(candidate.storyId),
    ...(candidate.storyTitle ? { storyTitle: normalizeFreeText(candidate.storyTitle) } : {}),
    rating: candidate.rating,
    score,
    reasons: dedupe(reasons) as StoryFeedbackReason[],
    generationMode: isStoryFeedbackGenerationMode(candidate.generationMode) ? candidate.generationMode : "unknown",
    createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : "",
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : "",
  };
}

function normalizeReadyStoryQueueLearningSignal(value: unknown): ReadyStoryQueueLearningSignal | null {
  const candidate = value as Partial<ReadyStoryQueueLearningSignal>;
  if (
    !candidate ||
    typeof candidate !== "object" ||
    !candidate.storyCardId ||
    !candidate.storyTitle ||
    !isReadyStoryQueueSignalType(candidate.signal) ||
    candidate.source !== "desktop-ready-story-queue" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.updatedAt !== "string"
  ) {
    return null;
  }

  const storyCardId = normalizeFreeText(candidate.storyCardId);
  const storyTitle = normalizeFreeText(candidate.storyTitle);
  if (!storyCardId || !storyTitle) return null;

  return {
    storyCardId,
    storyTitle,
    signal: candidate.signal,
    ...(candidate.genre ? { genre: normalizeFreeText(candidate.genre) } : {}),
    ...(candidate.mood ? { mood: normalizeFreeText(candidate.mood) } : {}),
    source: "desktop-ready-story-queue",
    createdAt: candidate.createdAt,
    updatedAt: candidate.updatedAt,
  };
}

function isReadyStoryQueueSignalType(value: unknown): value is ReadyStoryQueueSignalType {
  return value === "read" || value === "pass" || value === "save_for_later";
}

function isStoryFeedbackRating(value: unknown): value is StoryFeedbackRating {
  return value === "missed" || value === "not_quite" || value === "good" || value === "great" || value === "favorite";
}

function isStoryFeedbackReason(value: unknown): value is StoryFeedbackReason {
  return value === "wrong_tone" || value === "too_generic" || value === "too_slow" || value === "confusing" || value === "not_personal_enough" || value === "too_dark" || value === "not_dark_enough" || value === "too_weird" || value === "not_weird_enough" || value === "loved_tone" || value === "loved_character" || value === "wanted_more" || value === "felt_personal" || value === "surprising" || value === "comforting";
}

function isStoryFeedbackGenerationMode(value: unknown): value is StoryFeedbackGenerationMode {
  return value === "new-story" || value === "continue-story" || value === "unknown";
}

function normalizeReaderProfileEvent(event: ReaderProfileEvent): ReaderProfileEvent {
  return {
    eventType: event.eventType,
    timestamp: event.timestamp,
    ...(event.source ? { source: event.source } : {}),
    ...(event.storyId ? { storyId: normalizeFreeText(event.storyId) } : {}),
    ...(event.title ? { title: normalizeFreeText(event.title) } : {}),
    ...(event.genre ? { genre: normalizeFreeText(event.genre) } : {}),
    ...(event.mood ? { mood: normalizeFreeText(event.mood) } : {}),
    ...(typeof event.wordCount === "number" && Number.isFinite(event.wordCount) ? { wordCount: Math.max(0, Math.round(event.wordCount)) } : {}),
  };
}

function isReaderProfileEvent(value: unknown): value is ReaderProfileEvent {
  const candidate = value as Partial<ReaderProfileEvent>;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      isReaderProfileEventType(candidate.eventType) &&
      typeof candidate.timestamp === "string",
  );
}

function isReaderProfileEventType(value: unknown): value is ReaderProfileEventType {
  return value === "storyGenerated" || value === "storyOpened" || value === "storyContinued" || value === "storyExported" || value === "startSomethingDifferentClicked" || value === "moodSelected" || value === "demoStoryLoaded";
}

function incrementCount(counts: Record<string, number>, key: string | undefined): Record<string, number> {
  if (!key) return normalizeCountRecord(counts);
  const normalizedCounts = normalizeCountRecord(counts);
  return { ...normalizedCounts, [key]: (normalizedCounts[key] ?? 0) + 1 };
}

function normalizeCountRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, count]) => [normalizeFreeText(key), normalizeCount(count)] as const)
      .filter(([key, count]) => Boolean(key) && count > 0),
  );
}

function normalizeCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function dedupe<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))) as T[];
}

function createReaderMoodSnapshotId(createdAt: string): string {
  return `reader-mood-${createdAt}-${Math.random().toString(36).slice(2, 8)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  );
}

function normalizeFreeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 600);
}

function nowIso() { return new Date().toISOString(); }

function createAnonymousReaderId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function getOrCreateReaderId(): string {
  if (typeof window === "undefined") return "server";
  try {
    const existing = window.localStorage.getItem(READER_ID_STORAGE_KEY);
    if (existing && existing.trim()) return existing;
    const next = createAnonymousReaderId();
    window.localStorage.setItem(READER_ID_STORAGE_KEY, next);
    return next;
  } catch { return createAnonymousReaderId(); }
}

function safeJsonParse<T>(raw: string | null): T | null { if (!raw) return null; try { return JSON.parse(raw) as T; } catch { return null; } }
function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
function readNumber(value: unknown): number | undefined { return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : undefined; }
function readWeightedNumber(value: unknown): number | undefined { return isRecord(value) ? readNumber(value.value) : readNumber(value); }
function toCanonicalFormat(value: unknown): CanonicalPreferredFormat | null { if (value === "story" || value === "chapter" || value === "both") return value; if (value === "read") return "story"; return null; }
function readStringOrNull(value: unknown): string | null { return typeof value === "string" && value.trim() ? value.trim() : null; }
function readStringArray(value: unknown): string[] { return Array.isArray(value) ? dedupe(value.filter((item): item is string => typeof item === "string")) : []; }
function isReaderFeedbackRating(value: unknown): value is ReaderFeedbackRating { return value === "missed" || value === "not_quite" || value === "good" || value === "great" || value === "favorite"; }
function normalizeReaderFeedbackEvent(value: unknown): ReaderFeedbackEvent | null {
  if (!isRecord(value) || !isReaderFeedbackRating(value.rating)) return null;
  const id = readStringOrNull(value.id);
  const createdAt = readStringOrNull(value.createdAt);
  if (!id || !createdAt) return null;
  return { id, storyId: readStringOrNull(value.storyId), storyTitle: readStringOrNull(value.storyTitle), rating: value.rating, reasons: readStringArray(value.reasons), note: readStringOrNull(value.note), createdAt, storyMetadata: normalizeStoryFeedbackMetadata(value.storyMetadata) };
}
function normalizeRecentFeedback(value: unknown): ReaderFeedbackEvent[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const feedback = value.map(normalizeReaderFeedbackEvent).filter((event): event is ReaderFeedbackEvent => Boolean(event)).slice(0, MAX_CANONICAL_RECENT_FEEDBACK);
  return feedback.length ? feedback : undefined;
}
function defaultCanonicalProfile(readerId: string, fallbackReason?: string): CanonicalReaderProfile { const ts = nowIso(); return { readerId, version: 1, createdAt: ts, updatedAt: ts, source: "default", onboarding: { mode: "unknown", lastMood: null, preferredDuration: null, preferredFormat: null }, preferences: { preferredFormat: null, preferredDuration: null, hardAvoidances: [], explicitReaderPreferences: { ...DEFAULT_READER_PROFILE_PREFERENCES } }, signals: { storyCardSignalCount: 0, feedbackSignalCount: 0, favoriteCount: 0, savedForLaterCount: 0, lastFeedbackAt: null, lastStoryGeneratedAt: null, lastGenerationUsedCanonicalProfile: false, lastFeedbackSignalId: null, lastFeedbackReason: null }, learned: { confidence: 0, continuationPreference: 0, genres: {}, moods: {}, tones: {}, formats: {}, durations: {} }, appliedSignalIds: [], fallbackReason: fallbackReason ?? null }; }

function canonicalFromEerie(value: Record<string, unknown>, readerId: string): CanonicalReaderProfile {
  const fallback = defaultCanonicalProfile(readerId);
  const ts = readStringOrNull(value.updatedAt) ?? fallback.updatedAt;
  return { ...fallback, createdAt: readStringOrNull(value.createdAt) ?? fallback.createdAt, updatedAt: ts, source: "local", onboarding: { mode: value.onboardingMode === "full" || value.onboardingMode === "short" ? "completed" : value.onboardingMode === "skip" ? "skip" : "unknown", preferredFormat: toCanonicalFormat(value.preferredFormat), preferredDuration: value.preferredDurationMinutes ? `${value.preferredDurationMinutes} minutes` : null }, preferences: { fearIntensity: readWeightedNumber(value.fearIntensity), weirdnessTolerance: readWeightedNumber(value.weirdnessTolerance), supernaturalAffinity: readWeightedNumber(value.supernaturalAffinity), ambiguityTolerance: readWeightedNumber(value.ambiguityTolerance), goreTolerance: readWeightedNumber(value.goreTolerance), sleepSafePreference: readWeightedNumber(value.sleepSafePreference), preferredFormat: toCanonicalFormat(value.preferredFormat), preferredDuration: value.preferredDurationMinutes ? `${value.preferredDurationMinutes} minutes` : null, hardAvoidances: readStringArray(value.hardAvoidances), explicitReaderPreferences: normalizeReaderProfilePreferences(value.explicitReaderPreferences) }, signals: { ...fallback.signals, storyCardSignalCount: Array.isArray(value.storyCardSignals) ? value.storyCardSignals.length : 0 } };
}

function canonicalFromLegacyReaderProfile(profile: ReaderProfile, readerId: string): CanonicalReaderProfile {
  const taste = profile.tasteProfile;
  return { ...defaultCanonicalProfile(readerId), createdAt: profile.createdAt || nowIso(), updatedAt: profile.updatedAt || nowIso(), source: profile.profileExists ? "local" : "default", onboarding: { mode: profile.latestMood ? "completed" : "unknown", lastMood: profile.latestMood?.mood ?? null, preferredDuration: taste?.preferredDurationMinutes ? `${taste.preferredDurationMinutes} minutes` : null, preferredFormat: toCanonicalFormat(taste?.preferredFormat) }, preferences: { fearIntensity: taste?.fearIntensity.value, weirdnessTolerance: taste?.weirdnessTolerance.value, supernaturalAffinity: taste?.supernaturalAffinity.value, ambiguityTolerance: taste?.ambiguityTolerance.value, goreTolerance: taste?.goreTolerance.value, sleepSafePreference: taste?.sleepSafePreference.value, preferredFormat: toCanonicalFormat(taste?.preferredFormat), preferredDuration: taste?.preferredDurationMinutes ? `${taste.preferredDurationMinutes} minutes` : null, hardAvoidances: taste?.userHardAvoidances ?? [], explicitReaderPreferences: profile.explicitReaderPreferences }, signals: { storyCardSignalCount: profile.readyStoryQueueSignals?.length ?? 0, feedbackSignalCount: profile.storyFeedbackSignals?.length ?? 0, favoriteCount: profile.storyFeedbackSignals?.filter((s) => s.rating === "favorite").length ?? 0, savedForLaterCount: profile.readyStoryQueueSignals?.filter((s) => s.signal === "save_for_later").length ?? 0, lastFeedbackAt: [...(profile.storyFeedbackSignals ?? [])].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt))[0]?.updatedAt ?? null, lastStoryGeneratedAt: profile.recentEvents.find((event) => event.eventType === "storyGenerated")?.timestamp ?? null } };
}

export function canonicalReaderProfileFromReaderProfile(profile: ReaderProfile, readerId: string, source: CanonicalReaderProfile["source"] = "cloud"): CanonicalReaderProfile {
  return { ...canonicalFromLegacyReaderProfile(profile, readerId), source };
}

function normalizeCanonicalReaderProfile(value: unknown, readerId: string): CanonicalReaderProfile | null {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.preferences) || !isRecord(value.signals)) return null;
  const fallback = defaultCanonicalProfile(readerId);
  return { readerId, version: 1, createdAt: readStringOrNull(value.createdAt) ?? fallback.createdAt, updatedAt: readStringOrNull(value.updatedAt) ?? fallback.updatedAt, source: value.source === "cloud" || value.source === "merged" || value.source === "local" || value.source === "default" ? value.source : "default", onboarding: isRecord(value.onboarding) ? { mode: value.onboarding.mode === "completed" || value.onboarding.mode === "skip" || value.onboarding.mode === "unknown" ? value.onboarding.mode : "unknown", lastMood: readStringOrNull(value.onboarding.lastMood), preferredDuration: readStringOrNull(value.onboarding.preferredDuration), preferredFormat: toCanonicalFormat(value.onboarding.preferredFormat) } : fallback.onboarding, preferences: { fearIntensity: readNumber(value.preferences.fearIntensity), weirdnessTolerance: readNumber(value.preferences.weirdnessTolerance), supernaturalAffinity: readNumber(value.preferences.supernaturalAffinity), ambiguityTolerance: readNumber(value.preferences.ambiguityTolerance), goreTolerance: readNumber(value.preferences.goreTolerance), sleepSafePreference: readNumber(value.preferences.sleepSafePreference), preferredFormat: toCanonicalFormat(value.preferences.preferredFormat), preferredDuration: readStringOrNull(value.preferences.preferredDuration), hardAvoidances: readStringArray(value.preferences.hardAvoidances), explicitReaderPreferences: normalizeReaderProfilePreferences(value.preferences.explicitReaderPreferences) }, signals: { storyCardSignalCount: normalizeCount(value.signals.storyCardSignalCount), feedbackSignalCount: normalizeCount(value.signals.feedbackSignalCount), favoriteCount: normalizeCount(value.signals.favoriteCount), savedForLaterCount: normalizeCount(value.signals.savedForLaterCount), lastFeedbackAt: readStringOrNull(value.signals.lastFeedbackAt), lastStoryGeneratedAt: readStringOrNull(value.signals.lastStoryGeneratedAt), lastGenerationUsedCanonicalProfile: Boolean(value.signals.lastGenerationUsedCanonicalProfile), lastFeedbackSignalId: readStringOrNull(value.signals.lastFeedbackSignalId), lastFeedbackReason: readStringOrNull(value.signals.lastFeedbackReason) }, learned: normalizeCanonicalLearnedPreferences(isRecord(value.learned) ? { confidence: readNumber(value.learned.confidence), continuationPreference: readNumber(value.learned.continuationPreference), genres: normalizeRawLearnedScores(value.learned.genres), moods: normalizeRawLearnedScores(value.learned.moods), tones: normalizeRawLearnedScores(value.learned.tones), formats: normalizeRawLearnedScores(value.learned.formats), durations: normalizeRawLearnedScores(value.learned.durations) } : undefined), appliedSignalIds: readStringArray(value.appliedSignalIds).slice(0, MAX_CANONICAL_APPLIED_FEEDBACK_SIGNAL_IDS), fallbackReason: readStringOrNull(value.fallbackReason), recentFeedback: normalizeRecentFeedback(value.recentFeedback) };
}

export function loadCanonicalReaderProfile(): CanonicalReaderProfile {
  const readerId = getOrCreateReaderId();
  if (typeof window === "undefined") return defaultCanonicalProfile(readerId);
  const raw = safeJsonParse<unknown>(window.localStorage.getItem(CANONICAL_READER_PROFILE_STORAGE_KEY));
  const canonical = normalizeCanonicalReaderProfile(raw, readerId);
  if (canonical) return canonical;
  if (raw && isRecord(raw) && raw.schemaVersion === READER_PROFILE_SCHEMA_VERSION) return saveCanonicalReaderProfile(canonicalFromLegacyReaderProfile(normalizeReaderProfile(raw), readerId));
  const eerie = safeJsonParse<unknown>(window.localStorage.getItem("projectLantern.eerieReaderProfile.v1"));
  if (isRecord(eerie)) return saveCanonicalReaderProfile(canonicalFromEerie(eerie, readerId));
  return saveCanonicalReaderProfile(defaultCanonicalProfile(readerId, raw ? "corrupt-canonical-profile" : undefined));
}

export function saveCanonicalReaderProfile(profile: CanonicalReaderProfile): CanonicalReaderProfile {
  const normalized = normalizeCanonicalReaderProfile(profile, profile.readerId || getOrCreateReaderId()) ?? defaultCanonicalProfile(profile.readerId || getOrCreateReaderId(), "corrupt-canonical-profile");
  if (typeof window !== "undefined") { try { window.localStorage.setItem(CANONICAL_READER_PROFILE_STORAGE_KEY, JSON.stringify(normalized)); } catch {} }
  return normalized;
}

export function mergeReaderProfiles(localProfile: CanonicalReaderProfile, cloudProfile: CanonicalReaderProfile): CanonicalReaderProfile {
  const newer = cloudProfile.updatedAt >= localProfile.updatedAt ? cloudProfile : localProfile;
  return saveCanonicalReaderProfile({ ...newer, readerId: localProfile.readerId || cloudProfile.readerId, source: "merged", recentFeedback: [...(localProfile.recentFeedback ?? []), ...(cloudProfile.recentFeedback ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25), preferences: { ...localProfile.preferences, ...cloudProfile.preferences, hardAvoidances: dedupe([...(localProfile.preferences.hardAvoidances ?? []), ...(cloudProfile.preferences.hardAvoidances ?? [])]), explicitReaderPreferences: cloudProfile.updatedAt >= localProfile.updatedAt ? cloudProfile.preferences.explicitReaderPreferences : localProfile.preferences.explicitReaderPreferences }, signals: { storyCardSignalCount: Math.max(localProfile.signals.storyCardSignalCount, cloudProfile.signals.storyCardSignalCount), feedbackSignalCount: Math.max(localProfile.signals.feedbackSignalCount, cloudProfile.signals.feedbackSignalCount), favoriteCount: Math.max(localProfile.signals.favoriteCount, cloudProfile.signals.favoriteCount), savedForLaterCount: Math.max(localProfile.signals.savedForLaterCount, cloudProfile.signals.savedForLaterCount), lastFeedbackAt: [localProfile.signals.lastFeedbackAt, cloudProfile.signals.lastFeedbackAt].filter(Boolean).sort().pop() ?? null, lastStoryGeneratedAt: [localProfile.signals.lastStoryGeneratedAt, cloudProfile.signals.lastStoryGeneratedAt].filter(Boolean).sort().pop() ?? null, lastGenerationUsedCanonicalProfile: Boolean(localProfile.signals.lastGenerationUsedCanonicalProfile || cloudProfile.signals.lastGenerationUsedCanonicalProfile) }, updatedAt: [localProfile.updatedAt, cloudProfile.updatedAt].sort().pop() ?? nowIso() });
}

export function mirrorCanonicalReaderProfilePreferences(profile: CanonicalReaderProfile, legacyProfile: ReaderProfile, eerieProfile?: unknown): CanonicalReaderProfile {
  const legacy = canonicalFromLegacyReaderProfile(legacyProfile, profile.readerId);
  const eerie = isRecord(eerieProfile) ? canonicalFromEerie(eerieProfile, profile.readerId) : null;
  const source = eerie ?? legacy;
  const preferences = {
    ...profile.preferences,
    fearIntensity: profile.preferences.fearIntensity ?? source.preferences.fearIntensity,
    weirdnessTolerance: profile.preferences.weirdnessTolerance ?? source.preferences.weirdnessTolerance,
    supernaturalAffinity: profile.preferences.supernaturalAffinity ?? source.preferences.supernaturalAffinity,
    ambiguityTolerance: profile.preferences.ambiguityTolerance ?? source.preferences.ambiguityTolerance,
    goreTolerance: profile.preferences.goreTolerance ?? source.preferences.goreTolerance,
    sleepSafePreference: profile.preferences.sleepSafePreference ?? source.preferences.sleepSafePreference,
    preferredFormat: profile.preferences.preferredFormat ?? source.preferences.preferredFormat,
    preferredDuration: profile.preferences.preferredDuration ?? source.preferences.preferredDuration,
    hardAvoidances: profile.preferences.hardAvoidances.length ? profile.preferences.hardAvoidances : source.preferences.hardAvoidances,
    explicitReaderPreferences: hasReaderProfilePreferences(profile.preferences.explicitReaderPreferences) ? profile.preferences.explicitReaderPreferences : source.preferences.explicitReaderPreferences,
  };
  const signals = {
    ...profile.signals,
    storyCardSignalCount: Math.max(profile.signals.storyCardSignalCount, source.signals.storyCardSignalCount),
    feedbackSignalCount: Math.max(profile.signals.feedbackSignalCount, legacy.signals.feedbackSignalCount),
    favoriteCount: Math.max(profile.signals.favoriteCount, legacy.signals.favoriteCount),
    savedForLaterCount: Math.max(profile.signals.savedForLaterCount, legacy.signals.savedForLaterCount),
    lastFeedbackAt: profile.signals.lastFeedbackAt ?? legacy.signals.lastFeedbackAt,
    lastStoryGeneratedAt: profile.signals.lastStoryGeneratedAt ?? legacy.signals.lastStoryGeneratedAt,
  };

  return saveCanonicalReaderProfile({ ...profile, source: profile.source === "default" ? source.source : profile.source, preferences, signals });
}

export function createFeedbackEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

export function normalizeSignalText(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function reasonMatches(reasons: string[], expected: string): boolean {
  const normalizedExpected = normalizeSignalText(expected);
  return reasons.map(normalizeSignalText).some((reason) => reason.includes(normalizedExpected));
}

export function buildFeedbackSignalId(signal: ReaderFeedbackEvent): string {
  return [
    signal.storyId ?? "story:unknown",
    signal.storyMetadata?.seriesId ?? "series:unknown",
    signal.createdAt,
    signal.rating,
    [...signal.reasons].map(normalizeSignalText).sort().join("|"),
    normalizeSignalText(signal.note ?? ""),
  ].join("::");
}

export function applyFeedbackToReaderProfile(profile: CanonicalReaderProfile, feedback: ReaderFeedbackEvent): CanonicalReaderProfile {
  return applyStoryFeedbackToReaderProfile(profile, feedback).profile;
}

export function applyStoryFeedbackToReaderProfile(profile: CanonicalReaderProfile, feedback: ReaderFeedbackEvent): { profile: CanonicalReaderProfile; applied: boolean; signalId: string } {
  const signalId = buildFeedbackSignalId(feedback);
  if ((profile.appliedSignalIds ?? []).includes(signalId)) return { profile, applied: false, signalId };

  const updatedAt = createNextReaderProfileUpdatedAt(profile.updatedAt, feedback.createdAt);
  const reasons = feedback.reasons ?? [];
  const preferences = { ...profile.preferences, hardAvoidances: [...(profile.preferences.hardAvoidances ?? [])] };
  const nudge = (key: keyof CanonicalReaderProfile["preferences"], delta: number, fallback: number) => {
    if (key === "hardAvoidances" || key === "preferredFormat" || key === "preferredDuration" || key === "explicitReaderPreferences") return;
    preferences[key] = clamp01((typeof preferences[key] === "number" ? preferences[key] : fallback) + delta);
  };

  const hasTooDark = reasonMatches(reasons, "too dark");
  const hasNotDarkEnough = reasonMatches(reasons, "not dark enough");
  const hasTooWeird = reasonMatches(reasons, "too weird");
  const hasNotWeirdEnough = reasonMatches(reasons, "not weird enough");
  const diagnosticNotes: string[] = [];

  if (hasTooDark && hasNotDarkEnough) diagnosticNotes.push("contradictory feedback ignored for darkness");
  else if (hasTooDark) { nudge("fearIntensity", -0.04, 0.45); nudge("sleepSafePreference", 0.03, 0.7); }
  else if (hasNotDarkEnough) nudge("fearIntensity", 0.04, 0.45);

  if (hasTooWeird && hasNotWeirdEnough) diagnosticNotes.push("contradictory feedback ignored for weirdness");
  else if (hasTooWeird) { nudge("weirdnessTolerance", -0.04, 0.45); nudge("ambiguityTolerance", -0.03, 0.6); }
  else if (hasNotWeirdEnough) { nudge("weirdnessTolerance", 0.04, 0.45); nudge("ambiguityTolerance", 0.03, 0.6); }
  if (reasonMatches(reasons, "too gory")) { nudge("goreTolerance", -0.05, 0.15); nudge("sleepSafePreference", 0.03, 0.7); }

  const learned = normalizeCanonicalLearnedPreferences(profile.learned);
  const reinforceAmount = feedback.rating === "favorite" ? 0.05 : feedback.rating === "great" ? 0.04 : feedback.rating === "good" ? 0.015 : 0;
  const metadataAmount = reasonMatches(reasons, "loved the tone") ? Math.max(reinforceAmount, 0.04) : reinforceAmount;
  if (metadataAmount > 0) reinforceMetadata(learned, feedback.storyMetadata, metadataAmount);
  if (reasonMatches(reasons, "wanted more") || feedback.rating === "favorite" || feedback.rating === "great") learned.continuationPreference = clamp01((learned.continuationPreference ?? 0) + (reasonMatches(reasons, "wanted more") ? 0.05 : 0.02));
  learned.confidence = clamp01((learned.confidence ?? 0) + 0.03);

  const feedbackForDiagnostics = diagnosticNotes.length ? { ...feedback, note: [feedback.note, ...diagnosticNotes].filter(Boolean).join("; ") } : feedback;
  const recentFeedback = [feedbackForDiagnostics, ...(profile.recentFeedback ?? [])].slice(0, MAX_CANONICAL_RECENT_FEEDBACK);
  const appliedSignalIds = [signalId, ...(profile.appliedSignalIds ?? []).filter((id) => id !== signalId)].slice(0, MAX_CANONICAL_APPLIED_FEEDBACK_SIGNAL_IDS);

  return {
    profile: {
      ...profile,
      updatedAt,
      preferences,
      learned,
      appliedSignalIds,
      signals: {
        ...profile.signals,
        feedbackSignalCount: (profile.signals.feedbackSignalCount ?? 0) + 1,
        favoriteCount: feedback.rating === "favorite" ? (profile.signals.favoriteCount ?? 0) + 1 : (profile.signals.favoriteCount ?? 0),
        savedForLaterCount: profile.signals.savedForLaterCount ?? 0,
        lastFeedbackAt: feedback.createdAt,
        lastFeedbackSignalId: signalId,
        lastFeedbackReason: reasons[0] ?? null,
      },
      recentFeedback,
    },
    applied: true,
    signalId,
  };
}

function reinforceMetadata(learned: NonNullable<CanonicalReaderProfile["learned"]>, metadata: StoryFeedbackMetadata | undefined, amount: number) {
  for (const genre of metadata?.genres ?? []) learned.genres = reinforceWeightedScore(learned.genres, genre, amount);
  for (const mood of metadata?.moods ?? []) learned.moods = reinforceWeightedScore(learned.moods, mood, amount);
  for (const tone of metadata?.tones ?? []) learned.tones = reinforceWeightedScore(learned.tones, tone, amount);
  if (metadata?.format) learned.formats = reinforceWeightedScore(learned.formats, metadata.format, amount);
  if (typeof metadata?.durationMinutes === "number" && Number.isFinite(metadata.durationMinutes)) learned.durations = reinforceWeightedScore(learned.durations, `${Math.round(metadata.durationMinutes)} minutes`, amount);
}

function reinforceWeightedScore(scores: Record<string, number> | undefined, rawKey: string, amount: number): Record<string, number> {
  const key = normalizeSignalText(rawKey);
  if (!key) return scores ?? {};
  return Object.fromEntries(Object.entries({ ...(scores ?? {}), [key]: clamp01(((scores ?? {})[key] ?? 0) + amount) }).sort(([, a], [, b]) => b - a).slice(0, 20));
}

function normalizeCanonicalLearnedPreferences(value: CanonicalReaderProfile["learned"]): NonNullable<CanonicalReaderProfile["learned"]> {
  return {
    confidence: clamp01(value?.confidence ?? 0),
    continuationPreference: clamp01(value?.continuationPreference ?? 0),
    genres: normalizeLearnedScoreRecord(value?.genres),
    moods: normalizeLearnedScoreRecord(value?.moods),
    tones: normalizeLearnedScoreRecord(value?.tones),
    formats: normalizeLearnedScoreRecord(value?.formats),
    durations: normalizeLearnedScoreRecord(value?.durations),
  };
}

function normalizeRawLearnedScores(value: unknown): Record<string, number> | undefined {
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, number] => typeof entry[1] === "number"));
}

function normalizeLearnedScoreRecord(value: Record<string, number> | undefined): Record<string, number> {
  if (!value) return {};
  return Object.fromEntries(Object.entries(value).map(([key, score]) => [normalizeSignalText(key), clamp01(score)] as const).filter(([key, score]) => Boolean(key) && score > 0).sort(([, a], [, b]) => b - a).slice(0, 20));
}

function normalizeStoryFeedbackMetadata(value: unknown): StoryFeedbackMetadata | undefined {
  if (!isRecord(value)) return undefined;
  return {
    genres: readStringArray(value.genres),
    moods: readStringArray(value.moods),
    tones: readStringArray(value.tones),
    format: readStringOrNull(value.format) ?? undefined,
    durationMinutes: typeof value.durationMinutes === "number" && Number.isFinite(value.durationMinutes) ? Math.max(0, Math.round(value.durationMinutes)) : undefined,
    seriesId: readStringOrNull(value.seriesId) ?? undefined,
  };
}

export function buildGenerationReaderProfileInput(profile: CanonicalReaderProfile): object {
  const explicit = normalizeReaderProfilePreferences(profile.preferences.explicitReaderPreferences);
  const compactExplicitReaderPreferences = {
    storyFitProfileVersion: explicit.storyFitProfileVersion,
    preferredStoryTypes: explicit.preferredStoryTypes,
    emotionalPromises: explicit.emotionalPromises ?? [],
    favoriteStoryWorlds: explicit.favoriteStoryWorlds ?? [],
    storyIngredients: explicit.storyIngredients,
    characterLensPreferences: explicit.characterLensPreferences ?? [],
    protagonistLensPreferences: explicit.protagonistLensPreferences ?? [],
    narrativePressurePreferences: explicit.narrativePressurePreferences ?? [],
    episodeEndingShapePreferences: explicit.episodeEndingShapePreferences ?? [],
    hardAvoidances: explicit.hardAvoidances,
    contentLane: explicit.contentLane,
    narrativePressure: explicit.narrativePressure,
    episodeEndingShape: explicit.episodeEndingShape,
    protagonistLens: explicit.protagonistLens,
  };
  return { readerId: profile.readerId, canonicalProfileVersion: profile.version, generationUsingCanonicalProfile: true, preferredDuration: profile.preferences.preferredDuration ?? profile.onboarding?.preferredDuration ?? null, preferredFormat: profile.preferences.preferredFormat ?? profile.onboarding?.preferredFormat ?? null, hardAvoidances: profile.preferences.hardAvoidances, explicitReaderPreferences: compactExplicitReaderPreferences, fearIntensity: profile.preferences.fearIntensity, weirdnessTolerance: profile.preferences.weirdnessTolerance, supernaturalAffinity: profile.preferences.supernaturalAffinity, ambiguityTolerance: profile.preferences.ambiguityTolerance, goreTolerance: profile.preferences.goreTolerance, sleepSafePreference: profile.preferences.sleepSafePreference, signals: profile.signals, feedbackSummary: { feedbackSignalCount: profile.signals.feedbackSignalCount, favoriteCount: profile.signals.favoriteCount, savedForLaterCount: profile.signals.savedForLaterCount, recentRatings: profile.recentFeedback?.slice(0, 5).map((event) => ({ rating: event.rating, reasons: event.reasons, storyTitle: event.storyTitle ?? null })) ?? [] } };
}
