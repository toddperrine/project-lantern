export const READER_PROFILE_STORAGE_KEY = "projectLantern.readerProfile.v1";
export const READER_PROFILE_ID_STORAGE_KEY = "projectLantern.readerProfileId.v1";
export const READER_PROFILE_SCHEMA_VERSION = 1;
export const MAX_READER_MOOD_HISTORY = 10;
export const MAX_READER_PROFILE_EVENTS = 50;
export const MAX_STORY_FEEDBACK_SIGNALS = 50;
export const DEFAULT_READER_SAFETY_GUARDRAILS = [
  "sexual violence",
  "explicit harm to children",
  "extreme gore",
];

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
  | "loved_tone"
  | "loved_character"
  | "wanted_more"
  | "felt_personal"
  | "surprising"
  | "comforting";
export type StoryFeedbackGenerationMode = "new-story" | "continue-story" | "unknown";

export type ReaderTasteProfileSource =
  | "default"
  | "onboarding"
  | "story-card-swipe"
  | "rating"
  | "behavior"
  | "manual"
  | "legacy-eerie-profile";
export type ReaderFormatPreference = "read" | "listen" | "both";
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
  tasteProfile?: ReaderTasteProfile;
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
    tasteProfile: createDefaultReaderTasteProfile(updatedAt || new Date().toISOString()),
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

export function saveReaderMoodSnapshot(draft: ReaderMoodDraft): ReaderProfile {
  const now = new Date().toISOString();
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

  const currentProfile = readReaderProfile();
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

  persistReaderProfile(nextProfile);
  return nextProfile;
}

export function recordReaderProfileEvent(event: ReaderProfileEventInput): ReaderProfile {
  const now = event.timestamp ?? new Date().toISOString();
  const currentProfile = readReaderProfile();
  const normalizedEvent = normalizeReaderProfileEvent({ ...event, timestamp: now });
  const nextProfile: ReaderProfile = {
    ...currentProfile,
    profileExists: true,
    createdAt: currentProfile.createdAt || now,
    updatedAt: now,
    counters: incrementReaderProfileCounters(currentProfile.counters, normalizedEvent.eventType),
    moodCounts: incrementCount(currentProfile.moodCounts, normalizedEvent.mood),
    genreCounts: incrementCount(currentProfile.genreCounts, normalizedEvent.genre),
    sourceCounts: incrementCount(currentProfile.sourceCounts, normalizedEvent.source),
    recentEvents: [normalizedEvent, ...currentProfile.recentEvents.filter(isReaderProfileEvent)].slice(0, MAX_READER_PROFILE_EVENTS),
  };

  persistReaderProfile(nextProfile);
  return nextProfile;
}

export function saveStoryFeedbackSignal(nextSignal: StoryFeedbackSignal): ReaderProfile {
  const now = nextSignal.updatedAt || new Date().toISOString();
  const currentProfile = readReaderProfile();
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

  persistReaderProfile(nextProfile);
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

  const profileExists = Boolean(
    candidate.profileExists ||
      latestMood ||
      moodHistory.length ||
      recentEvents.length ||
      Object.values(counters).some((count) => count > 0) ||
      storyFeedbackSignals.length > 0,
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
    tasteProfile,
  };
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

function isStoryFeedbackRating(value: unknown): value is StoryFeedbackRating {
  return value === "missed" || value === "not_quite" || value === "good" || value === "great" || value === "favorite";
}

function isStoryFeedbackReason(value: unknown): value is StoryFeedbackReason {
  return value === "wrong_tone" || value === "too_generic" || value === "too_slow" || value === "confusing" || value === "not_personal_enough" || value === "too_dark" || value === "not_dark_enough" || value === "loved_tone" || value === "loved_character" || value === "wanted_more" || value === "felt_personal" || value === "surprising" || value === "comforting";
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
