export const READER_PROFILE_STORAGE_KEY = "projectLantern.readerProfile.v1";
export const READER_PROFILE_SCHEMA_VERSION = 1;
export const MAX_READER_MOOD_HISTORY = 10;

export type ReaderEnergyLevel = "low" | "medium" | "high";
export type ReaderIntensityLevel = "gentle" | "moderate" | "intense";

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

export interface ReaderProfile {
  schemaVersion: typeof READER_PROFILE_SCHEMA_VERSION;
  updatedAt: string;
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

export function createEmptyReaderProfile(updatedAt = ""): ReaderProfile {
  return {
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
    updatedAt,
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
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
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
  const updatedAt =
    typeof candidate.updatedAt === "string"
      ? candidate.updatedAt
      : (latestMood?.createdAt ?? "");

  return {
    schemaVersion: READER_PROFILE_SCHEMA_VERSION,
    updatedAt,
    ...(latestMood ? { latestMood } : {}),
    moodHistory,
  };
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
