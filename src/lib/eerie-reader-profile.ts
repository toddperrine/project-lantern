export const EERIE_READER_PROFILE_STORAGE_KEY = "projectLantern.eerieReaderProfile.v1";
export const EERIE_READER_PROFILE_SCHEMA_VERSION = 1;
export const MAX_EERIE_PROFILE_STORY_SIGNALS = 50;

export type EerieOnboardingMode = "skip" | "short" | "full";

export type EerieProfileSource =
  | "default"
  | "onboarding"
  | "story-card-swipe"
  | "rating"
  | "behavior"
  | "manual";

export type EerieFormatPreference = "read" | "listen" | "both";

export type EerieStoryCardSignalType = "left" | "right" | "up";

export type EerieProfileConfidence = "low" | "medium" | "high";

export interface EerieWeightedPreference {
  value: number;
  confidence: number;
  source: EerieProfileSource;
  updatedAt: string;
}

export interface EerieStoryCardSignal {
  id: string;
  storyCardId: string;
  title: string;
  signal: EerieStoryCardSignalType;
  tags: string[];
  createdAt: string;
}

export interface EerieReaderProfile {
  schemaVersion: typeof EERIE_READER_PROFILE_SCHEMA_VERSION;
  createdAt: string;
  updatedAt: string;
  onboardingMode: EerieOnboardingMode;
  profileConfidence: EerieProfileConfidence;

  fearIntensity: EerieWeightedPreference;
  weirdnessTolerance: EerieWeightedPreference;
  supernaturalAffinity: EerieWeightedPreference;
  ambiguityTolerance: EerieWeightedPreference;
  goreTolerance: EerieWeightedPreference;
  sleepSafePreference: EerieWeightedPreference;

  preferredFormat: EerieFormatPreference;
  preferredDurationMinutes: 5 | 10 | 15 | 20;
  hardAvoidances: string[];

  affinities: Record<string, EerieWeightedPreference>;
  storyCardSignals: EerieStoryCardSignal[];
}

export const DEFAULT_EERIE_SAFETY_GUARDRAILS = [
  "sexual violence",
  "explicit harm to children",
  "extreme gore"
];
const DEFAULT_AFFINITIES: Record<string, number> = {
  uncannyMysteryAffinity: 0.6,
  atmosphericDreadAffinity: 0.6,
  slowBurnAffinity: 0.5,
  supernaturalAmbiguityAffinity: 0.55,
  psychologicalDreadAffinity: 0.45,
  ghostAffinity: 0.35,
  folkHorrorAffinity: 0.35,
  cosmicDreadAffinity: 0.35,
  spaceIsolationAffinity: 0.35,
  signalMysteryAffinity: 0.4,
  archiveMysteryAffinity: 0.45,
  smallTownSecretAffinity: 0.45,
  hotelMotelAffinity: 0.35,
  coastalDreadAffinity: 0.35,
  roadsideDreadAffinity: 0.35,
  domesticUncannyAffinity: 0.4,
  workplaceAfterHoursAffinity: 0.35,
  undergroundBunkerAffinity: 0.35,
  creatureInDarkAffinity: 0.3,
  corporateMissionDreadAffinity: 0.3
};

export function createDefaultEerieReaderProfile(mode?: EerieOnboardingMode): EerieReaderProfile {
  const now = new Date().toISOString();
  const onboardingMode = isEerieOnboardingMode(mode) ? mode : "skip";
  const weighted = (value: number): EerieWeightedPreference => ({ value, confidence: 0.2, source: "default", updatedAt: now });

  return {
    schemaVersion: EERIE_READER_PROFILE_SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    onboardingMode,
    profileConfidence: onboardingMode === "full" ? "high" : onboardingMode === "short" ? "medium" : "low",
    fearIntensity: weighted(0.45),
    weirdnessTolerance: weighted(0.45),
    supernaturalAffinity: weighted(0.5),
    ambiguityTolerance: weighted(0.6),
    goreTolerance: weighted(0.15),
    sleepSafePreference: weighted(0.7),
    preferredFormat: "both",
    preferredDurationMinutes: 10,
    hardAvoidances: [...DEFAULT_EERIE_SAFETY_GUARDRAILS],
    affinities: Object.fromEntries(Object.entries(DEFAULT_AFFINITIES).map(([key, value]) => [key, weighted(value)])),
    storyCardSignals: []
  };
}

export function readEerieReaderProfile(): EerieReaderProfile {
  if (typeof window === "undefined") return createDefaultEerieReaderProfile();

  try {
    const stored = window.localStorage.getItem(EERIE_READER_PROFILE_STORAGE_KEY);
    if (!stored) return createDefaultEerieReaderProfile();
    return normalizeEerieReaderProfile(JSON.parse(stored));
  } catch {
    return createDefaultEerieReaderProfile();
  }
}

export function persistEerieReaderProfile(profile: EerieReaderProfile): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(EERIE_READER_PROFILE_STORAGE_KEY, JSON.stringify(normalizeEerieReaderProfile(profile)));
  } catch {
    // Ignore unavailable or full browser storage; callers keep the in-memory profile.
  }
}

export function clearEerieReaderProfile(): EerieReaderProfile {
  const profile = createDefaultEerieReaderProfile();

  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(EERIE_READER_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore unavailable browser storage; callers still receive a reset profile.
  }

  return profile;
}

export function normalizeEerieReaderProfile(value: unknown): EerieReaderProfile {
  if (!isRecord(value) || value.schemaVersion !== EERIE_READER_PROFILE_SCHEMA_VERSION) return createDefaultEerieReaderProfile();

  const fallback = createDefaultEerieReaderProfile(isEerieOnboardingMode(value.onboardingMode) ? value.onboardingMode : undefined);
  const updatedAt = readString(value.updatedAt, fallback.updatedAt);

  return {
    ...fallback,
    createdAt: readString(value.createdAt, fallback.createdAt),
    updatedAt,
    onboardingMode: isEerieOnboardingMode(value.onboardingMode) ? value.onboardingMode : fallback.onboardingMode,
    profileConfidence: isEerieProfileConfidence(value.profileConfidence) ? value.profileConfidence : fallback.profileConfidence,
    fearIntensity: normalizeWeightedPreference(value.fearIntensity, fallback.fearIntensity),
    weirdnessTolerance: normalizeWeightedPreference(value.weirdnessTolerance, fallback.weirdnessTolerance),
    supernaturalAffinity: normalizeWeightedPreference(value.supernaturalAffinity, fallback.supernaturalAffinity),
    ambiguityTolerance: normalizeWeightedPreference(value.ambiguityTolerance, fallback.ambiguityTolerance),
    goreTolerance: normalizeWeightedPreference(value.goreTolerance, fallback.goreTolerance),
    sleepSafePreference: normalizeWeightedPreference(value.sleepSafePreference, fallback.sleepSafePreference),
    preferredFormat: isEerieFormatPreference(value.preferredFormat) ? value.preferredFormat : fallback.preferredFormat,
    preferredDurationMinutes: isPreferredDuration(value.preferredDurationMinutes) ? value.preferredDurationMinutes : fallback.preferredDurationMinutes,
    hardAvoidances: Array.isArray(value.hardAvoidances) ? value.hardAvoidances.filter((item): item is string => typeof item === "string") : fallback.hardAvoidances,
    affinities: normalizeAffinities(value.affinities, fallback.affinities),
    storyCardSignals: normalizeStoryCardSignals(value.storyCardSignals)
  };
}

export function recordEerieStoryCardSignal(profile: EerieReaderProfile, signal: Omit<EerieStoryCardSignal, "id" | "createdAt">): EerieReaderProfile {
  const now = new Date().toISOString();
  return normalizeEerieReaderProfile({
    ...profile,
    updatedAt: now,
    storyCardSignals: [...profile.storyCardSignals, { ...signal, id: createSignalId(), createdAt: now }]
  });
}

export function formatEerieReaderProfileForDiagnostics(profile: EerieReaderProfile): Record<string, unknown> {
  const sortedAffinities = Object.entries(profile.affinities)
    .sort(([, left], [, right]) => right.value - left.value)
    .slice(0, 8)
    .map(([key, preference]) => ({ key, value: preference.value, confidence: preference.confidence }));

  return {
    storageKey: EERIE_READER_PROFILE_STORAGE_KEY,
    onboardingMode: profile.onboardingMode,
    profileConfidence: profile.profileConfidence,
    fearIntensity: summarizeWeightedPreference(profile.fearIntensity),
    weirdnessTolerance: summarizeWeightedPreference(profile.weirdnessTolerance),
    supernaturalAffinity: summarizeWeightedPreference(profile.supernaturalAffinity),
    ambiguityTolerance: summarizeWeightedPreference(profile.ambiguityTolerance),
    goreTolerance: summarizeWeightedPreference(profile.goreTolerance),
    sleepSafePreference: summarizeWeightedPreference(profile.sleepSafePreference),
    preferredFormat: profile.preferredFormat,
    preferredDurationMinutes: profile.preferredDurationMinutes,
    defaultEerieSafetyGuardrails: DEFAULT_EERIE_SAFETY_GUARDRAILS,
    localEerieProfileHardAvoidances: profile.hardAvoidances,
    topAffinities: sortedAffinities,
    storyCardSignalCount: profile.storyCardSignals.length,
    updatedAt: profile.updatedAt
  };
}

function normalizeWeightedPreference(value: unknown, fallback: EerieWeightedPreference): EerieWeightedPreference {
  if (!isRecord(value)) return fallback;
  return {
    value: clamp01(typeof value.value === "number" ? value.value : fallback.value),
    confidence: clamp01(typeof value.confidence === "number" ? value.confidence : fallback.confidence),
    source: isEerieProfileSource(value.source) ? value.source : fallback.source,
    updatedAt: readString(value.updatedAt, fallback.updatedAt)
  };
}

function normalizeAffinities(value: unknown, fallback: Record<string, EerieWeightedPreference>): Record<string, EerieWeightedPreference> {
  if (!isRecord(value)) return fallback;
  return Object.fromEntries(Object.entries(fallback).map(([key, preference]) => [key, normalizeWeightedPreference(value[key], preference)]));
}

function normalizeStoryCardSignals(value: unknown): EerieStoryCardSignal[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isStoryCardSignal)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, MAX_EERIE_PROFILE_STORY_SIGNALS)
    .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt));
}

function isStoryCardSignal(value: unknown): value is EerieStoryCardSignal {
  return isRecord(value) && typeof value.id === "string" && typeof value.storyCardId === "string" && typeof value.title === "string" && isEerieStoryCardSignalType(value.signal) && Array.isArray(value.tags) && value.tags.every((tag) => typeof tag === "string") && typeof value.createdAt === "string";
}

function summarizeWeightedPreference(preference: EerieWeightedPreference): Record<string, number> {
  return { value: preference.value, confidence: preference.confidence };
}

function createSignalId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `eerie-signal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isEerieOnboardingMode(value: unknown): value is EerieOnboardingMode { return value === "skip" || value === "short" || value === "full"; }
function isEerieProfileSource(value: unknown): value is EerieProfileSource { return value === "default" || value === "onboarding" || value === "story-card-swipe" || value === "rating" || value === "behavior" || value === "manual"; }
function isEerieFormatPreference(value: unknown): value is EerieFormatPreference { return value === "read" || value === "listen" || value === "both"; }
function isEerieStoryCardSignalType(value: unknown): value is EerieStoryCardSignalType { return value === "left" || value === "right" || value === "up"; }
function isEerieProfileConfidence(value: unknown): value is EerieProfileConfidence { return value === "low" || value === "medium" || value === "high"; }
function isPreferredDuration(value: unknown): value is 5 | 10 | 15 | 20 { return value === 5 || value === 10 || value === 15 || value === 20; }
