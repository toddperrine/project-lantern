export const READER_PROFILE_STORAGE_KEY = "projectLantern.readerProfile.v1";
export const READER_PROFILE_ID_STORAGE_KEY = "projectLantern.readerProfileId.v1";
export const READER_PROFILE_SCHEMA_VERSION = 1;
export const MAX_READER_MOOD_HISTORY = 10;
export const MAX_READER_PROFILE_EVENTS = 50;

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
  const counters = normalizeReaderProfileCounters(candidate.counters);
  const updatedAt =
    typeof candidate.updatedAt === "string"
      ? candidate.updatedAt
      : (recentEvents[0]?.timestamp ?? latestMood?.createdAt ?? "");
  const createdAt =
    typeof candidate.createdAt === "string"
      ? candidate.createdAt
      : (recentEvents[recentEvents.length - 1]?.timestamp ?? latestMood?.createdAt ?? "");
  const profileExists = Boolean(
    candidate.profileExists ||
      latestMood ||
      moodHistory.length ||
      recentEvents.length ||
      Object.values(counters).some((count) => count > 0),
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
  };
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
