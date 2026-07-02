"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { BloodwickSignInModal } from "@/components/auth/BloodwickSignInModal";
import { BloodwickHomeHero } from "@/components/home/BloodwickHomeHero";
import { ContinueEpisodeCard } from "@/components/home/ContinueEpisodeCard";
import { FearMoodGrid } from "@/components/home/FearMoodGrid";
import { HOME_DASHBOARD_COLUMNS } from "@/components/home/home-dashboard-order";
import { StoryQueueCard } from "@/components/home/StoryQueueCard";
import { MobileBackToTopButton } from "@/components/navigation/MobileBackToTopButton";
import {
  DEFAULT_EERIE_SAFETY_GUARDRAILS,
  EERIE_READER_PROFILE_STORAGE_KEY,
  clearEerieReaderProfile,
  createDefaultEerieReaderProfile,
  formatEerieReaderProfileForDiagnostics,
  readEerieReaderProfile,
} from "@/lib/eerie-reader-profile";
import {
  READER_PROFILE_STORAGE_KEY,
  CANONICAL_READER_PROFILE_STORAGE_KEY,
  READER_ID_STORAGE_KEY,
  READER_PROFILE_ID_STORAGE_KEY,
  clearReaderProfile,
  createEmptyReaderProfile,
  persistReaderProfile,
  normalizeReaderProfile,
  readOrCreateReaderProfileId,
  getOrCreateReaderId,
  loadCanonicalReaderProfile,
  saveCanonicalReaderProfile,
  applyFeedbackToReaderProfile,
  buildGenerationReaderProfileInput,
  canonicalReaderProfileFromReaderProfile,
  mirrorCanonicalReaderProfilePreferences,
  readReaderProfile,
  readerProfileExistsInLocalStorage,
  recordReaderProfileEvent,
  saveReaderMoodSnapshot,
  saveStoryFeedbackSignal,
  saveReadyStoryQueueSignal,
  DEFAULT_READER_SAFETY_GUARDRAILS,
  normalizeReaderTasteProfile,
  STORY_FEEDBACK_SCORE_BY_RATING,
  createFeedbackEventId,
  saveReaderProfilePreferences,
  hasReaderProfilePreferences,
  addUniquePreferenceItem,
  MAX_READER_HARD_AVOIDANCES,
  MAX_READER_HARD_AVOIDANCE_LENGTH,
  READER_PROFILE_PREFERENCES_VERSION,
  DEFAULT_READER_PROFILE_PREFERENCES,
  STORY_FIT_CHARACTER_LENS_OPTIONS,
  STORY_FIT_EMOTIONAL_PROMISE_OPTIONS,
  STORY_FIT_ENDING_TO_LEGACY,
  STORY_FIT_EPISODE_ENDING_OPTIONS,
  STORY_FIT_INGREDIENT_OPTIONS,
  STORY_FIT_NARRATIVE_PRESSURE_OPTIONS,
  STORY_FIT_PRESSURE_TO_LEGACY,
  STORY_FIT_SELECTION_LIMITS,
  STORY_FIT_STORY_TYPE_OPTIONS,
  STORY_FIT_WORLD_OPTIONS,
  STORY_FIT_CHARACTER_LENS_TO_LEGACY,
} from "@/lib/reader-profile";
import {
  countPreparedReadyStoryQueueItems,
  createReadyStoryQueueItem,
  formatReadyStoryCreatorCredit,
  MAX_READY_STORY_QUEUE_ITEMS,
  persistReadyStoryQueue,
  persistSavedForLaterStoryQueue,
  readReadyStoryQueue,
  readSavedForLaterStoryQueue,
  removeReadyStoryQueueItem,
  upsertSavedForLaterStoryQueueItem,
  type ReadyStoryQueueItem,
  type ReadyStoryQueueSignal,
} from "@/lib/ready-story-queue";
import {
  STORY_SPARK_CATALOG,
  type StorySparkCatalogItem,
} from "@/lib/story-spark-catalog";
import {
  STORY_TYPE_CHIPS,
  getStoryTypePrimaryCategory,
  getStoryTypePromptRequirements,
  getHomeFearLabel,
  getStoryTypeChipLabel,
  getStoryTypeStartCopy,
  getStoryTypeTextCompatibility,
  type StoryTypeChip,
  type StoryTypeChipId,
} from "@/lib/story-types";
import {
  createGenerationIdentity,
  type GenerationIdentity,
  type GenerationMode,
} from "@/lib/generation-identity";
import {
  CLEAN_GENERATION_FAILURE_MESSAGE,
  assertUserDisplayableGenerationResponse,
  isFallbackGenerationResponse,
} from "@/lib/generation-display-policy";
import {
  findLibraryStoryBySavedId,
  findNextSavedEpisodeInSeries,
  groupStoriesBySeries,
  type LibrarySeriesGroup,
  type SeriesEpisode,
} from "@/lib/series-library";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";
import {
  CHARACTER_ARCS,
  ENDING_TYPES,
  GENRE_PRESETS,
  LENGTH_TARGETS,
  NARRATIVE_ARCHITECTURES,
} from "@/lib/types";
import type { EerieReaderProfile } from "@/lib/eerie-reader-profile";
import type {
  CanonicalReaderProfile,
  ReaderEnergyLevel,
  ReaderIntensityLevel,
  ReaderMoodDraft,
  ReaderMoodSnapshot,
  ReaderProfile,
  ReaderProfileEventInput,
  ReaderProfileEventSource,
  ReaderTasteProfileConfidence,
  StoryFeedbackGenerationMode,
  StoryFeedbackRating,
  StoryFeedbackReason,
  StoryFeedbackSignal,
} from "@/lib/reader-profile";
import type {
  CharacterArc,
  ContinuationGenerationDiagnostics,
  EndingType,
  GenerateStoryResponse,
  GenrePreset,
  LengthTarget,
  NarrativeArchitecture,
  ReaderProfileGenerationSnapshot,
} from "@/lib/types";
import {
  createInputArtifactId,
  createSavedProjectId,
  createSavedStory,
  persistInputArtifacts,
  persistSavedProjects,
  persistSavedStories,
  readInputArtifacts,
  readSavedProjects,
  readSavedStories,
  savedStoryToResponse,
} from "@/lib/project-persistence";
import type {
  InputArtifact,
  InputArtifactType,
  SavedProject,
  SavedStory,
  UploadState,
} from "@/lib/project-persistence";
import { APP_VERSION } from "@/lib/build-info";
import { BloodwickWordmark } from "@/components/bloodwick-brand";
import { useAuth, type AuthStatus } from "@/lib/auth";
import { getBloodwickSeriesDisplayTitle } from "@/lib/bloodwick-series-title";
import {
  getBloodwickFearArt,
  normalizeBloodwickFearCategory,
} from "@/lib/bloodwick-fear-art";

const BLOODWICK_FIRST_OPEN_SIGN_IN_DISMISSED_KEY =
  "bloodwick:first-open-sign-in-dismissed";

type AppView =
  | "home"
  | "library"
  | "worlds"
  | "create"
  | "characters"
  | "account"
  | "mood-intake";
type Mood = StoryTypeChipId;
type CloudProjectSummary = Pick<
  SavedProject,
  "id" | "name" | "createdAt" | "updatedAt"
>;
type LibrarySource =
  | "authenticated cloud"
  | "legacy local"
  | "auth-disabled fallback";
type LibraryDiagnosticsState = {
  source: LibrarySource;
  loadedCount: number;
  latestSaveOwnerId: string;
  lastBlockedAction: string;
};
type CloudSavedStoryRecordResponse = {
  ownerId?: string;
  storyId?: string;
  title: string;
  story: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
  sequenceNumber?: number;
  sequenceLabel?: string;
  storyRole?: string;
  canonStatus?: string;
  isFavorite?: boolean;
  favoriteAt?: string | null;
  continuationOfStoryId?: string;
  branchOfStoryId?: string;
};
type CloudSavedStoryResponse = {
  story?: CloudSavedStoryRecordResponse;
  stories?: CloudSavedStoryRecordResponse[];
};
type StoryStart = {
  title: string;
  premise: string;
  genre: GenrePreset;
  mood: Mood;
  heroName: string;
  heroRole: string;
  heroBio: string;
  worldName: string;
  world: string;
  seed: string;
  cast: string;
  rules: string;
  sourceStorySparkId: string;
  sourceStorySparkTitle: string;
  tags: string[];
};
type LibraryStory =
  | SavedStory
  | {
      id: string;
      storyId?: string;
      seriesId?: string;
      sourceStoryId?: string | null;
      parentSeriesId?: string | null;
      generationMode?: GenerationMode;
      title: string;
      story: string;
      wordCount: number;
      createdAt: string;
      genrePreset: GenrePreset;
      selectedStoryTypeChipId?: string;
      selectedStoryTypeChipLabel?: string;
      legacyGenrePreset?: GenrePreset;
      charactersUsed: string[];
      rulesReferenced: string[];
      seriesTitle?: string | null;
    };
type StoryBrief = {
  hook: string;
  recap: string;
  changed: string;
  tension: string;
  nextHook: string;
  heroName: string;
  heroRole: string;
  struggle: string;
};
type MoodIntakeMode = "story-start" | "generate" | null;
type MoodIntakeFormState = ReaderMoodDraft;
type GeneratedStoryPresentation =
  | "first-episode"
  | "continuation"
  | "saved-episode"
  | null;
type GenerationSource = "new-story" | "continue-story" | null;
type ReaderScrollDiagnostics = {
  nextEpisodeClicked: string;
  continuationLoaded: string;
  scrollResetAttempted: string;
  scrollTargetUsed: string;
};
type GenerationFailureDiagnostic = Record<string, unknown> | null;
type GenerationFetchDiagnosticsInput = {
  attemptId: string;
  stage: string;
  endpoint: string;
  action: string;
  response?: Response;
  error?: unknown;
  elapsedSeconds?: number;
  authConfigured: boolean;
  currentUserPresent: boolean;
  authTokenPresent: boolean;
  generationSucceededButLibrarySaveFailed?: boolean;
};
type LastGenerationIdentityDiagnostics = {
  identity: GenerationIdentity | null;
  continuationContextIncluded: boolean;
  newSeriesCreated: boolean;
  trigger: string;
  activeCommittedStoryId: string;
  activeCommittedSeriesId: string;
  pendingGenerationMode: GenerationMode | "none";
  lastGenerationCancelledOrAborted: boolean;
};
type StoryTypeSelectionDiagnostics = {
  selectedStoryTypeChipId: string;
  selectedStoryTypeChipLabel: string;
  selectedChipId: string;
  selectedChip: string;
  availableChips: string;
  storySparkUsed: string;
  selectedStorySparkId: string;
  selectedStorySparkTitle: string;
  selectedStorySparkMatchedChip: string;
  directChipGuidanceUsed: string;
  compatibilityResult: string;
  chipCompatibilityResult: string;
  fallbackSelectionUsed: string;
  selectedChipPreservedDuringGeneration: string;
  storyTypeSelectionMode: string;
  storySeedSource: string;
  visibleCategoryLabel: string;
};
type ProfileSourceUsed = "local" | "cloud" | "default" | "none";
type EpisodeMomentumDiagnostics = NonNullable<
  GenerateStoryResponse["metadata"]["diagnostics"]["episodeMomentum"]
>;
type LastNewStoryPersonalization = {
  profileUsed: boolean;
  profileSourceUsed: ProfileSourceUsed;
  profileConfidence: "low" | "medium" | "high" | "unavailable";
  lastGenerationMode: "new-story" | "continue-story" | "none";
  lastGenerationTrigger: string;
  moodSignal: string;
  genreSignal: string;
  hardAvoidancesIncluded: boolean;
  userHardAvoidancesSummary: string;
  defaultEerieSafetyGuardrailsSummary: string;
  eerieSignalsIncluded: boolean;
  continuationStoryIdIncludedInLastNewStoryRequest: boolean;
  feedbackIncluded: boolean;
  latestStoryFeedbackSummary: string;
  summary: string;
  responseSnapshot?: ReaderProfileGenerationSnapshot;
  identityDiagnostics: LastGenerationIdentityDiagnostics;
};
type CloudReaderProfileStatus =
  | "pending"
  | "synced"
  | "unavailable"
  | "error"
  | "not found"
  | "blocked";
type AccountMode = "guest" | "signed-in" | "unknown";
type AccountDataMode =
  | "signed-in"
  | "browser-profile"
  | "local-profile"
  | "unknown";
type AccountDataClearConfirmation =
  | "story-fit-preferences"
  | "local-reader-memory"
  | null;
type AccountProfileActionStatus =
  | "idle"
  | "blocked"
  | "refreshing"
  | "saving"
  | "success"
  | "error";
type AccountProfileActionDiagnostics = {
  lastAccountProfileAction: string;
  lastAccountProfileActionStatus: AccountProfileActionStatus;
  lastAccountProfileActionMessage: string;
  lastAccountProfileActionAt: string;
  accountProfileRefreshBlockedReason: string;
  accountProfileSaveBlockedReason: string;
};
type AccountProfileSummary = {
  displayName: string;
  profileId?: string;
  accountMode: AccountMode;
  statusText: string;
  preferredStoryTypes: string[];
  emotionalPromises: string[];
  favoriteStoryWorlds: string[];
  storyIngredients: string[];
  characterLensPreferences: string[];
  narrativePressurePreferences: string[];
  episodeEndingShapePreferences: string[];
  hardAvoidances: string[];
  explicitDetails: string[];
  continuationPreference?: string;
  recentFeedback: string[];
  confidenceLabel: string;
  counts: {
    savedStories?: number;
    series?: number;
    characters?: number;
    storySparks?: number;
  };
};
type ReaderPreferencesSaveStatus = "saved" | "saving" | "error";
type StoryFitOnboardingStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
const CONTINUATION_CONTEXT_MAX_CHARS = 3600;
const CONTINUATION_TAIL_MIN_CHARS = 1200;
const CONTINUATION_TAIL_MAX_CHARS = 1800;

type StoryFitOnboardingState = {
  emotionalPromises: string[];
  favoriteStoryWorlds: string[];
  storyIngredients: string[];
  characterLensPreferences: string[];
  narrativePressurePreferences: string[];
  episodeEndingShapePreferences: string[];
  protagonistLensPreferences: string[];
  contentLane: ReaderProfile["explicitReaderPreferences"]["contentLane"];
  hardAvoidances: string[];
  preferredStoryTypes: string[];
};
const STORY_FIT_ONBOARDING_STORAGE_KEY = "projectLantern.storyFitOnboarding.v1";
const STORY_FIT_ONBOARDING_LAST_OPENED_KEY =
  "projectLantern.storyFitOnboarding.lastOpenedAt.v1";
const STORY_FIT_ONBOARDING_LAST_SAVED_KEY =
  "projectLantern.storyFitOnboarding.lastSavedAt.v1";

type AccountDataExportV1 = {
  exportVersion: "account-data-v1";
  exportedAt: string;
  appVersion?: string;
  account: { accountMode: AccountDataMode; profileId?: string; email?: string };
  storyFitProfileV2Preferences?: unknown;
  storyFitPreferences?: unknown;
  readerProfile?: unknown;
  feedbackSignals?: unknown;
  savedContentSummary: {
    savedStories?: number;
    series?: number;
    characters?: number;
    worlds?: number;
    storySparks?: number;
  };
  savedContent?: {
    stories?: unknown[];
    series?: unknown[];
    characters?: unknown[];
    worlds?: unknown[];
    storySparks?: unknown[];
  };
};
type CloudReaderProfileSyncState = {
  profileId: string;
  status: CloudReaderProfileStatus;
  lastSaveOutcome:
    | "none"
    | "saved"
    | "stale-write-ignored"
    | "unavailable"
    | "error";
  lastSyncAt: string;
  lastError: string;
  localUpdatedAt: string;
  cloudUpdatedAt: string;
  localProfileExists: boolean;
  ownerId: string;
  source: "authenticated cloud" | "legacy local" | "auth-disabled fallback";
  cloudProfileExists: boolean;
  lastLoadStatus: string;
  lastBlockedProfileAction: string;
  lastApiPath: string;
  lastApiAction: string;
  lastSanitizedErrorName: string;
  lastSanitizedErrorCode: string;
  initializedDefaultCloudProfile: boolean;
};
type ReaderProfileApiDiagnostic = {
  apiPath?: string;
  action?: string;
  authTokenPresent?: boolean;
  resolvedOwnerId?: string;
  initializedDefaultCloudProfile?: boolean;
  result?: string;
  sanitizedErrorName?: string | null;
  sanitizedErrorCode?: string | number | null;
  operation?: string;
};
type ReaderProfileSaveResponse = {
  profile?: ReaderProfile | null;
  cloudProfileSaveStatus?: "saved" | "stale-write-ignored";
  error?: string;
  cloudProfileExists?: boolean;
  ownerId?: string;
  initializedDefaultCloudProfile?: boolean;
  diagnostic?: ReaderProfileApiDiagnostic;
};

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const INPUT_LABELS: Record<InputArtifactType, string> = {
  worldBible: "Storyworld",
  characterProfiles: "Cast",
  storySeed: "Story Spark",
  storyRules: "Craft Rules",
};
const MOOD_DISPLAY_ORDER: Mood[] = STORY_TYPE_CHIPS.map((chip) => chip.id);
const DEFAULT_STORY_RULES_NOTICE =
  "Default craft rules are used automatically when this is empty.";
const FIRST_PAGE_TEST_STORY_RULES =
  "First-page-test mode: Write a strong opening section of roughly 600-1000 words. Do not resolve the central story event. End at a compelling point of curiosity, pressure, or choice. The result should feel like the first pages of an episode, not a complete chapter.";
const DEMO_LATEST_STORY_STORAGE_KEY = "projectLantern.demoLatestStory.v1";
const DEMO_LATEST_STORY_ID = "demo-the-half-life-of-magic";
const EMPTY_MOOD_INTAKE_FORM: MoodIntakeFormState = {
  mood: "",
  desiredFeeling: "",
  energyLevel: "medium",
  intensityLevel: "moderate",
  avoidances: "",
  needRightNow: "",
};
const AUTHENTICATED_STORY_LIBRARY_PROJECT_ID = "story-library";

const NAV_ITEMS: { label: string; view: AppView }[] = [
  { label: "Home", view: "home" },
  { label: "Shelf", view: "library" },
  { label: "Account", view: "account" },
];

const STORY_FEEDBACK_RATING_OPTIONS: {
  rating: StoryFeedbackRating;
  label: string;
}[] = [
  { rating: "missed", label: "Missed" },
  { rating: "not_quite", label: "Not quite" },
  { rating: "good", label: "Good" },
  { rating: "great", label: "Great" },
  { rating: "favorite", label: "Favorite" },
];
const STORY_FEEDBACK_REASON_OPTIONS: {
  reason: StoryFeedbackReason;
  label: string;
}[] = [
  { reason: "wrong_tone", label: "Wrong tone" },
  { reason: "too_generic", label: "Too generic" },
  { reason: "too_slow", label: "Too slow" },
  { reason: "confusing", label: "Confusing" },
  { reason: "not_personal_enough", label: "Not personal enough" },
  { reason: "too_dark", label: "Too dark" },
  { reason: "not_dark_enough", label: "Not dark enough" },
  { reason: "too_weird", label: "Too weird" },
  { reason: "not_weird_enough", label: "Not weird enough" },
  { reason: "loved_tone", label: "Loved the tone" },
  { reason: "loved_character", label: "Loved a character" },
  { reason: "wanted_more", label: "Wanted more" },
  { reason: "felt_personal", label: "Felt personal" },
  { reason: "surprising", label: "Surprising" },
  { reason: "comforting", label: "Comforting" },
];

const DEMO_STORY_TEXT = [
  "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  "Mara Vale found the first talisman inside a box of ordinary estate-sale objects.",
  "When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  "Someone else knows the talisman has awakened, and they are already looking for it.",
].join("\n\n");
const DEMO_STORY_BRIEF: StoryBrief = {
  hook: "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  recap:
    "Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  changed:
    "The talisman has proven that dead magic is not dead at all, and Mara is now part of whatever has begun to wake.",
  tension:
    "Someone else knows the talisman has awakened, and they are already looking for it.",
  nextHook:
    "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  heroName: "Mara Vale",
  heroRole: "The Seeker",
  struggle:
    "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
};
const EMPTY_CLOUD_READER_PROFILE_SYNC: CloudReaderProfileSyncState = {
  profileId: "",
  status: "pending",
  lastSaveOutcome: "none",
  lastSyncAt: "",
  lastError: "",
  localUpdatedAt: "",
  cloudUpdatedAt: "",
  localProfileExists: false,
  ownerId: "none",
  source: "legacy local",
  cloudProfileExists: false,
  lastLoadStatus: "not loaded",
  lastBlockedProfileAction: "none",
  lastApiPath: "none",
  lastApiAction: "none",
  lastSanitizedErrorName: "none",
  lastSanitizedErrorCode: "none",
  initializedDefaultCloudProfile: false,
};

function inferStoryTypeForCatalogItem(item: StorySparkCatalogItem): Mood {
  const haystack = [
    item.mood,
    item.genre,
    item.title,
    item.premise,
    item.seed,
    item.world,
    item.rules,
    ...item.tags,
  ]
    .join(" ")
    .toLowerCase();
  return (
    STORY_TYPE_CHIPS.find(
      (chip) =>
        chip.keywords.some((keyword) =>
          haystack.includes(keyword.toLowerCase()),
        ) || haystack.includes(chip.label.toLowerCase()),
    )?.id ?? STORY_TYPE_CHIPS[0].id
  );
}

function storySparkCatalogItemToStoryStart(
  item: StorySparkCatalogItem,
): StoryStart {
  return {
    title: item.title,
    premise: item.premise,
    genre: item.genre,
    mood: inferStoryTypeForCatalogItem(item),
    heroName: item.heroName,
    heroRole: item.heroRole,
    heroBio: item.heroBio,
    worldName: item.worldName,
    world: item.world,
    seed: item.seed,
    cast: item.cast,
    rules: item.rules,
    sourceStorySparkId: item.id,
    sourceStorySparkTitle: item.title,
    tags: item.tags,
  };
}

const SUGGESTED_STORY_STARTS: StoryStart[] = STORY_SPARK_CATALOG.map(
  storySparkCatalogItemToStoryStart,
);
const AVAILABLE_MOOD_CHIPS: Mood[] = MOOD_DISPLAY_ORDER;

function createInitialReadyStoryQueue(): ReadyStoryQueueItem[] {
  return STORY_SPARK_CATALOG.slice(0, 3).map(
    storySparkCatalogItemToReadyStoryQueueItem,
  );
}

function storySparkCatalogItemToReadyStoryQueueItem(
  item: StorySparkCatalogItem,
): ReadyStoryQueueItem {
  return createReadyStoryQueueItem({
    title: item.title,
    premise: item.premise,
    genre: item.genre,
    mood: item.mood,
    heroName: item.heroName,
    heroRole: item.heroRole,
    heroBio: item.heroBio,
    worldName: item.worldName,
    world: item.world,
    seed: item.seed,
    cast: item.cast,
    rules: item.rules,
    sourceStorySparkId: item.id,
    sourceStorySparkTitle: item.title,
    creatorId: item.creator.id,
    creatorDisplayName: item.creator.displayName,
    creatorHandle: item.creator.handle,
    creatorCreditLine: item.creator.creditLine,
    creatorKind: item.creator.creatorKind,
    provenance: item.provenance,
    ipMarking: item.ipMarking,
    sourceArchivePath: item.sourceArchivePath,
    sourceArchiveTitle: item.sourceArchiveTitle,
    tags: item.tags,
  });
}

const LEGACY_GENERIC_READY_QUEUE_TITLES = new Set([
  "The Lighthouse Under Main Street",
  "Orchard of Borrowed Moons",
  "The Quiet Engine",
  "Map of the Seventh Door",
]);

function shouldReplaceLegacyGenericReadyQueue(
  items: ReadyStoryQueueItem[],
): boolean {
  return Boolean(
    items.length &&
    items.every((item) => LEGACY_GENERIC_READY_QUEUE_TITLES.has(item.title)) &&
    items.every((item) => !item.sourceStorySparkId),
  );
}

function fillReadyStoryQueueFromCatalog(
  currentQueue: ReadyStoryQueueItem[],
  savedForLaterQueue: ReadyStoryQueueItem[],
  profile: ReaderProfile,
): ReadyStoryQueueItem[] {
  const blockedStorySparkIds = new Set<string>();

  for (const item of currentQueue) {
    if (item.sourceStorySparkId)
      blockedStorySparkIds.add(item.sourceStorySparkId);
  }

  for (const item of savedForLaterQueue) {
    if (item.sourceStorySparkId)
      blockedStorySparkIds.add(item.sourceStorySparkId);
  }

  for (const signal of profile.readyStoryQueueSignals ?? []) {
    if (signal.signal !== "pass" && signal.signal !== "read") continue;
    if (signal.storyCardId) blockedStorySparkIds.add(signal.storyCardId);
  }

  const nextQueue = [...currentQueue];

  for (const catalogItem of STORY_SPARK_CATALOG) {
    if (nextQueue.length >= MAX_READY_STORY_QUEUE_ITEMS) break;
    if (blockedStorySparkIds.has(catalogItem.id)) continue;

    nextQueue.push(storySparkCatalogItemToReadyStoryQueueItem(catalogItem));
    blockedStorySparkIds.add(catalogItem.id);
  }

  return nextQueue.slice(0, MAX_READY_STORY_QUEUE_ITEMS);
}

function readMood(value: string): Mood {
  return MOOD_DISPLAY_ORDER.includes(value as Mood)
    ? (value as Mood)
    : STORY_TYPE_CHIPS[0].id;
}

function getStoryTypeCompatibility(
  story: StoryStart,
  mood: Mood,
): { compatible: boolean; result: string } {
  const chip = getStoryTypeChip(mood);
  return getStoryTypeTextCompatibility(
    chip,
    [
      story.mood,
      story.genre,
      story.title,
      story.premise,
      story.seed,
      story.world,
      story.rules,
      ...story.tags,
    ].join(" "),
  );
}

function storyStartSupportsMood(story: StoryStart, mood: Mood): boolean {
  return getStoryTypeCompatibility(story, mood).compatible;
}

function findStoryStartForMood(mood: Mood): {
  storyStart: StoryStart;
  fallbackUsed: boolean;
  compatibilityResult: string;
} {
  for (const story of SUGGESTED_STORY_STARTS) {
    const compatibility = getStoryTypeCompatibility(story, mood);
    if (compatibility.compatible)
      return {
        storyStart: story,
        fallbackUsed: false,
        compatibilityResult: compatibility.result,
      };
  }

  return {
    storyStart: createStoryStartFromChip(mood),
    fallbackUsed: true,
    compatibilityResult:
      "no compatible StorySpark found; using direct selected chip guidance",
  };
}

function formatMoodChipList(moods: Mood[]): string {
  return moods.length
    ? moods.map((mood) => getStoryTypeChip(mood).label).join(", ")
    : "none";
}

function getStoryTypeChip(mood: Mood): StoryTypeChip {
  return (
    STORY_TYPE_CHIPS.find((chip) => chip.id === mood) ?? STORY_TYPE_CHIPS[0]
  );
}

function buildStoryTypeGuidance(chip: StoryTypeChip): string {
  return [
    `Story fit should lean toward ${chip.label.toLowerCase()} through setting, character pressure, conflict, and consequence rather than labels.`,
    chip.guidance,
    `Potential story material: ${chip.keywords.join(", ")}.`,
    "The final story must begin as prose and must not print story-fit labels, ids, keyword lists, craft labels, or prompt instructions.",
    getStoryTypePromptRequirements(chip),
  ]
    .filter(Boolean)
    .join("\n");
}

function createStoryStartFromChip(mood: Mood): StoryStart {
  const chip = getStoryTypeChip(mood);
  return {
    title: chip.label,
    premise: chip.guidance,
    genre: "Speculative Mystery",
    mood,
    heroName: "The reader",
    heroRole: chip.label,
    heroBio: `A grounded protagonist caught inside ${chip.label.toLowerCase()}.`,
    worldName: chip.label,
    world: chip.guidance,
    seed: chip.guidance,
    cast: `Create a small, reader-first cast grounded in ${chip.label.toLowerCase()}.`,
    rules: `Honor the selected story type: ${chip.guidance} ${getStoryTypePromptRequirements(chip)} Keep the dread specific, serialized, and character-centered.`,
    sourceStorySparkId: "direct-chip-guidance",
    sourceStorySparkTitle: "Direct chip guidance",
    tags: chip.keywords,
  };
}

function formatLatestReadyStoryQueueSignal(
  signals: ReaderProfile["readyStoryQueueSignals"],
): string {
  const latest = Array.isArray(signals) ? signals[0] : null;
  if (!latest) return "none";
  return `${latest.signal}: ${latest.storyTitle}`;
}

export default function Home() {
  const authState = useAuth();
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<AppView>(
    readAppView(searchParams.get("view")) ?? "home",
  );
  const [activeMood, setActiveMood] = useState<Mood>(AVAILABLE_MOOD_CHIPS[0]);
  const [selectedHomeFearCategory, setSelectedHomeFearCategory] = useState<Mood | null>(null);
  const [worldBible, setWorldBible] = useState<UploadState>(EMPTY_UPLOAD);
  const [characterProfiles, setCharacterProfiles] =
    useState<UploadState>(EMPTY_UPLOAD);
  const [storySeed, setStorySeed] = useState<UploadState>(EMPTY_UPLOAD);
  const [storyRules, setStoryRules] = useState<UploadState>(EMPTY_UPLOAD);
  const [genrePreset, setGenrePreset] = useState<GenrePreset>(
    "Speculative Mystery",
  );
  const [narrativeArchitecture, setNarrativeArchitecture] =
    useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>(
    "Positive Change Arc",
  );
  const [endingType, setEndingType] = useState<EndingType>(
    "Resolution with Residue",
  );
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [storyResponse, setStoryResponse] =
    useState<GenerateStoryResponse | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState("");
  const [inputArtifacts, setInputArtifacts] = useState<InputArtifact[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [legacyLocalStoryCount, setLegacyLocalStoryCount] = useState(0);
  const [libraryDiagnostics, setLibraryDiagnostics] =
    useState<LibraryDiagnosticsState>({
      source: "legacy local",
      loadedCount: 0,
      latestSaveOwnerId: "none",
      lastBlockedAction: "none",
    });
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [demoStory, setDemoStory] = useState<SavedStory | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCloudProjectId, setSelectedCloudProjectId] = useState("");
  const [cloudProjectMessage, setCloudProjectMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [modalSignInEmail, setModalSignInEmail] = useState(
    authState.currentUser?.email ?? authState.resetEmail,
  );
  const [modalSignInPassword, setModalSignInPassword] = useState("");
  const [isModalSignInSubmitting, setIsModalSignInSubmitting] =
    useState(false);
  const [isBloodwickSignInModalDismissed, setIsBloodwickSignInModalDismissed] =
    useState(false);
  const [isCloudProjectsLoading, setIsCloudProjectsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [continueDirection, setContinueDirection] = useState("");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile>(
    createEmptyReaderProfile(),
  );
  const [hasLoadedReaderProfileState, setHasLoadedReaderProfileState] =
    useState(false);
  const [storyFitOnboardingDismissed, setStoryFitOnboardingDismissed] =
    useState(false);
  const [storyFitOnboardingLastOpenedAt, setStoryFitOnboardingLastOpenedAt] =
    useState("");
  const [storyFitOnboardingLastSavedAt, setStoryFitOnboardingLastSavedAt] =
    useState("");
  const [isStoryFitOnboardingOpen, setIsStoryFitOnboardingOpen] =
    useState(false);
  const [canonicalReaderProfile, setCanonicalReaderProfile] =
    useState<CanonicalReaderProfile | null>(null);
  const [cloudReaderProfileSync, setCloudReaderProfileSync] =
    useState<CloudReaderProfileSyncState>(EMPTY_CLOUD_READER_PROFILE_SYNC);
  const [accountProfileActionDiagnostics, setAccountProfileActionDiagnostics] =
    useState<AccountProfileActionDiagnostics>({
      lastAccountProfileAction: "none",
      lastAccountProfileActionStatus: "idle",
      lastAccountProfileActionMessage: "none",
      lastAccountProfileActionAt: "",
      accountProfileRefreshBlockedReason: "none",
      accountProfileSaveBlockedReason: "none",
    });
  const [eerieReaderProfile, setEerieReaderProfile] =
    useState<EerieReaderProfile>(createDefaultEerieReaderProfile());
  const [pendingStoryStart, setPendingStoryStart] = useState<StoryStart | null>(
    null,
  );
  const [moodIntakeMode, setMoodIntakeMode] = useState<MoodIntakeMode>(null);
  const [
    generationApprovedMoodSnapshotId,
    setGenerationApprovedMoodSnapshotId,
  ] = useState<string | null>(null);
  const [generatedStoryPresentation, setGeneratedStoryPresentation] =
    useState<GeneratedStoryPresentation>(null);
  const [lastGenerationTrigger, setLastGenerationTrigger] = useState("none");
  const [generationSource, setGenerationSource] =
    useState<GenerationSource>(null);
  const [activeCommittedStoryId, setActiveCommittedStoryId] = useState("");
  const [activeCommittedSeriesId, setActiveCommittedSeriesId] = useState("");
  const [lastLibraryOpenedStoryId, setLastLibraryOpenedStoryId] = useState("");
  const [lastLibraryOpenedEpisodeNumber, setLastLibraryOpenedEpisodeNumber] =
    useState<number | null>(null);
  const [pendingGenerationMode, setPendingGenerationMode] = useState<
    GenerationMode | "none"
  >("none");
  const [
    lastGenerationCancelledOrAborted,
    setLastGenerationCancelledOrAborted,
  ] = useState(false);
  const [lastGenerationFailureDiagnostic, setLastGenerationFailureDiagnostic] =
    useState<GenerationFailureDiagnostic>(null);
  const [
    lastRequestIncludedContinuationStoryId,
    setLastRequestIncludedContinuationStoryId,
  ] = useState(false);
  const [lastContinuationContextIncluded, setLastContinuationContextIncluded] =
    useState(false);
  const [
    lastContinuationBlockedBecauseContextMissing,
    setLastContinuationBlockedBecauseContextMissing,
  ] = useState(false);
  const [readerScrollDiagnostics, setReaderScrollDiagnostics] =
    useState<ReaderScrollDiagnostics>({
      nextEpisodeClicked: "no",
      continuationLoaded: "no",
      scrollResetAttempted: "no",
      scrollTargetUsed: "none",
    });
  const [feedbackDraftHasUnsavedChanges, setFeedbackDraftHasUnsavedChanges] =
    useState(false);
  const [
    feedbackSaveBlockedBecauseRatingMissing,
    setFeedbackSaveBlockedBecauseRatingMissing,
  ] = useState(false);
  const [
    generationBlockedBecauseUnsavedFeedback,
    setGenerationBlockedBecauseUnsavedFeedback,
  ] = useState(false);
  const [lastNewStoryPersonalization, setLastNewStoryPersonalization] =
    useState<LastNewStoryPersonalization>(
      createEmptyLastNewStoryPersonalization(),
    );
  const [readyStoryQueue, setReadyStoryQueue] = useState<ReadyStoryQueueItem[]>(
    [],
  );
  const [savedForLaterStoryQueue, setSavedForLaterStoryQueue] = useState<
    ReadyStoryQueueItem[]
  >([]);
  const [lastReadyStoryQueueAction, setLastReadyStoryQueueAction] =
    useState("none");
  const [readyStoryPreparationStatus, setReadyStoryPreparationStatus] =
    useState("idle");
  const [
    lastReadyStoryPreparationOutcome,
    setLastReadyStoryPreparationOutcome,
  ] = useState("none");
  const [isStoryStartSelectionOpen, setIsStoryStartSelectionOpen] =
    useState(false);
  const [storyTypeSelectionDiagnostics, setStoryTypeSelectionDiagnostics] =
    useState<StoryTypeSelectionDiagnostics>({
      selectedStoryTypeChipId: AVAILABLE_MOOD_CHIPS[0],
      selectedStoryTypeChipLabel: getStoryTypeChip(AVAILABLE_MOOD_CHIPS[0])
        .label,
      selectedChipId: AVAILABLE_MOOD_CHIPS[0],
      selectedChip: getStoryTypeChip(AVAILABLE_MOOD_CHIPS[0]).label,
      availableChips: formatMoodChipList(AVAILABLE_MOOD_CHIPS),
      storySparkUsed: "no",
      selectedStorySparkId: "none",
      selectedStorySparkTitle: "none",
      selectedStorySparkMatchedChip: "none",
      directChipGuidanceUsed: "no",
      compatibilityResult: "not evaluated",
      chipCompatibilityResult: "not evaluated",
      fallbackSelectionUsed: "no",
      selectedChipPreservedDuringGeneration: "not generating",
      storyTypeSelectionMode: "selected",
      storySeedSource: "not generated",
      visibleCategoryLabel: getStoryTypeChip(AVAILABLE_MOOD_CHIPS[0]).label,
    });
  const activeGenerationRequestId = useRef(0);
  const activeGenerationAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const requestedView = readAppView(searchParams.get("view")) ?? "home";
    setActiveView(requestedView);
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () =>
      setActiveView(
        readAppView(new URLSearchParams(window.location.search).get("view")) ??
          "home",
      );
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const browserSavedStories = readSavedStories();
    setInputArtifacts(readInputArtifacts());
    setLegacyLocalStoryCount(browserSavedStories.length);
    if (!authState.authConfigured) {
      setSavedStories(browserSavedStories);
      setLibraryDiagnostics((current) => ({
        ...current,
        source: "auth-disabled fallback",
        loadedCount: browserSavedStories.length,
      }));
    }
    const latestSavedStory = browserSavedStories[0];
    if (latestSavedStory) {
      setActiveCommittedStoryId(latestSavedStory.id);
      setActiveCommittedSeriesId(
        latestSavedStory.seriesId ?? latestSavedStory.id,
      );
    }
    setSavedProjects(readSavedProjects());
    setDemoStory(
      browserSavedStories.length === 0 ? readDemoLatestStory() : null,
    );
    getOrCreateReaderId();
    const canonicalProfile = loadCanonicalReaderProfile();
    const profileId = readOrCreateReaderProfileId();
    const localProfile = readReaderProfile();
    const localEerieProfile = readEerieReaderProfile();
    const enrichedProfile = shouldMirrorEerieProfileToReaderTasteProfile(
      localProfile,
    )
      ? normalizeReaderProfile({
          ...localProfile,
          tasteProfile: readerTasteProfileFromEerieProfile(localEerieProfile),
        })
      : localProfile;
    if (enrichedProfile !== localProfile) persistReaderProfile(enrichedProfile);
    const mirroredCanonicalProfile = mirrorCanonicalReaderProfilePreferences(
      canonicalProfile,
      enrichedProfile,
      localEerieProfile,
    );
    setCanonicalReaderProfile(mirroredCanonicalProfile);
    setReaderProfile(enrichedProfile);
    setHasLoadedReaderProfileState(true);
    setStoryFitOnboardingDismissed(readStoryFitOnboardingDismissed());
    setStoryFitOnboardingLastOpenedAt(
      readStoryFitOnboardingTimestamp(STORY_FIT_ONBOARDING_LAST_OPENED_KEY),
    );
    setStoryFitOnboardingLastSavedAt(
      readStoryFitOnboardingTimestamp(STORY_FIT_ONBOARDING_LAST_SAVED_KEY),
    );
    const storedReadyQueue = readReadyStoryQueue();
    const shouldUseCatalogSeed =
      storedReadyQueue.length === 0 ||
      shouldReplaceLegacyGenericReadyQueue(storedReadyQueue);
    const seededReadyQueue = shouldUseCatalogSeed
      ? createInitialReadyStoryQueue()
      : storedReadyQueue;
    const persistedReadyQueue = persistReadyStoryQueue(seededReadyQueue);
    setReadyStoryQueue(persistedReadyQueue);
    setSavedForLaterStoryQueue(readSavedForLaterStoryQueue());
    setCloudReaderProfileSync((current) => ({
      ...current,
      profileId,
      localUpdatedAt: enrichedProfile.updatedAt,
      localProfileExists: readerProfileExistsInLocalStorage(),
      status: authState.authConfigured ? "pending" : "pending",
      source: authState.authConfigured
        ? "legacy local"
        : "auth-disabled fallback",
      ownerId: authState.authConfigured ? "none" : "auth-disabled-fallback",
    }));
    if (!authState.authConfigured)
      void reconcileReaderProfileWithCloud(profileId, enrichedProfile);
    setEerieReaderProfile(localEerieProfile);
    void handleRefreshCloudProjects();
  }, []);

  useEffect(() => {
    if (!authState.authConfigured) return;
    if (!authState.currentUser) {
      setSavedStories([]);
      setLibraryDiagnostics((current) => ({
        ...current,
        source: legacyLocalStoryCount ? "legacy local" : "authenticated cloud",
        loadedCount: 0,
        latestSaveOwnerId: "none",
      }));
      setReaderProfile(createEmptyReaderProfile());
      setHasLoadedReaderProfileState(true);
      setCloudReaderProfileSync((current) => ({
        ...current,
        profileId: "",
        ownerId: "none",
        source: legacyLocalStoryCount ? "legacy local" : "authenticated cloud",
        status: "blocked",
        lastLoadStatus: "signed out",
        lastSaveOutcome: "none",
      }));
      return;
    }
    void loadAuthenticatedStoryLibrary();
    void loadAuthenticatedReaderProfile();
  }, [authState.authConfigured, authState.currentUser?.id]);

  const hasRealLatestStory = Boolean(storyResponse || savedStories.length);
  const latestStory = useMemo<LibraryStory | null>(() => {
    if (storyResponse)
      return responseToLibraryStory(
        storyResponse,
        currentStoryId || createStoryId(storyResponse.story),
      );
    return savedStories[0] ?? demoStory;
  }, [currentStoryId, demoStory, savedStories, storyResponse]);
  const suggestedStarts = useMemo(
    () => sortStoryStartsByMood(activeMood),
    [activeMood],
  );
  const currentGeneratedStory = useMemo(
    () =>
      storyResponse
        ? responseToLibraryStory(
            storyResponse,
            currentStoryId || createStoryId(storyResponse.story),
          )
        : null,
    [currentStoryId, storyResponse],
  );
  const currentSeriesEpisode = useMemo(
    () => findEpisodeInLibrarySeries(savedStories, currentStoryId),
    [currentStoryId, savedStories],
  );
  const canGenerate = Boolean(
    worldBible.content.trim() &&
    characterProfiles.content.trim() &&
    storySeed.content.trim() &&
    !isGenerating,
  );
  const accountProfileSummary = useMemo(
    () =>
      toAccountProfileSummary({
        authState,
        canonicalProfile: canonicalReaderProfile,
        inputArtifacts,
        profile: readerProfile,
        savedForLaterStoryQueue,
        savedStories,
      }),
    [
      authState,
      canonicalReaderProfile,
      inputArtifacts,
      readerProfile,
      savedForLaterStoryQueue,
      savedStories,
    ],
  );
  const shouldShowFirstRunStoryFitPrompt =
    hasLoadedReaderProfileState &&
    !hasReaderProfilePreferences(readerProfile.explicitReaderPreferences) &&
    !storyFitOnboardingDismissed;
  const [readerPreferencesSaveStatus, setReaderPreferencesSaveStatus] =
    useState<ReaderPreferencesSaveStatus>("saved");

  function authHeaders(): HeadersInit {
    const token = authState.getAccessToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function authTokenPresent(): boolean {
    return Boolean(authState.getAccessToken());
  }

  function updateAccountProfileActionDiagnostics(
    update: Partial<AccountProfileActionDiagnostics>,
  ) {
    setAccountProfileActionDiagnostics((current) => ({
      ...current,
      ...update,
    }));
  }

  async function handleRefreshAccountProfile() {
    const actionAt = new Date().toISOString();
    if (authState.authConfigured && !authState.currentUser) {
      const message = "Sign in to refresh your account profile.";
      updateCloudReaderProfileSync({
        status: "blocked",
        lastLoadStatus: "signed out",
        lastBlockedProfileAction: "manual refresh while signed out",
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileAction: "refresh",
        lastAccountProfileActionStatus: "blocked",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: actionAt,
        accountProfileRefreshBlockedReason: "signed out",
      });
      setStatusMessage(message);
      return;
    }
    if (!authState.authConfigured) {
      const message =
        "Auth is disabled. Local profile data is already available on this device.";
      updateCloudReaderProfileSync({
        source: "auth-disabled fallback",
        status: "synced",
        lastLoadStatus: "auth disabled",
        lastSyncAt: actionAt,
        lastError: "",
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileAction: "refresh",
        lastAccountProfileActionStatus: "success",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: actionAt,
        accountProfileRefreshBlockedReason: "auth disabled",
      });
      setStatusMessage(message);
      return;
    }
    const currentUser = authState.currentUser;
    if (!currentUser) return;
    const profileId = `reader-profile-${currentUser.id}`;
    updateCloudReaderProfileSync({
      profileId,
      ownerId: currentUser.id,
      source: "authenticated cloud",
      status: "pending",
      lastLoadStatus: "loading",
      localUpdatedAt: readerProfile.updatedAt,
      localProfileExists: readerProfileExistsInLocalStorage(),
    });
    updateAccountProfileActionDiagnostics({
      lastAccountProfileAction: "refresh",
      lastAccountProfileActionStatus: "refreshing",
      lastAccountProfileActionMessage: "Refreshing…",
      lastAccountProfileActionAt: actionAt,
      accountProfileRefreshBlockedReason: "none",
    });
    try {
      const response = await fetch("/api/reader-profile", {
        cache: "no-store",
        headers: authHeaders(),
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as ReaderProfileSaveResponse;
      if (!response.ok)
        throw new Error(payload.error ?? "Reader profile cloud load failed.");
      const cloudProfile = normalizeCloudReaderProfile(payload.profile);
      if (!cloudProfile) {
        const message = "No account profile found yet. Local profile was kept.";
        updateCloudReaderProfileSync({
          profileId,
          ownerId: payload.ownerId ?? currentUser.id,
          source: "authenticated cloud",
          status: "not found",
          cloudProfileExists: false,
          lastLoadStatus: "not found",
          localUpdatedAt: readerProfile.updatedAt,
          lastSyncAt: new Date().toISOString(),
          lastError: "",
          ...cloudDiagnosticUpdate(payload.diagnostic),
        });
        updateAccountProfileActionDiagnostics({
          lastAccountProfileActionStatus: "success",
          lastAccountProfileActionMessage: message,
          lastAccountProfileActionAt: new Date().toISOString(),
        });
        setStatusMessage(message);
        return;
      }
      const localEffectivelyEmpty =
        !readerProfile.profileExists &&
        !hasReaderProfilePreferences(readerProfile.explicitReaderPreferences) &&
        !hasReaderMemorySignals(readerProfile, canonicalReaderProfile);
      const cloudNewerOrEqual = isCloudProfileNewerOrEqual(
        cloudProfile.updatedAt,
        readerProfile.updatedAt,
      );
      const appliedCloud = cloudNewerOrEqual || localEffectivelyEmpty;
      if (appliedCloud) {
        setReaderProfile(cloudProfile);
        setHasLoadedReaderProfileState(true);
        setCanonicalReaderProfile(
          canonicalReaderProfileFromReaderProfile(
            cloudProfile,
            currentUser.id,
            "cloud",
          ),
        );
      }
      const message = appliedCloud
        ? "Account profile refreshed."
        : "Local profile is newer than the account copy. Use Save profile to account to update cloud.";
      updateCloudReaderProfileSync({
        profileId,
        ownerId: payload.ownerId ?? currentUser.id,
        source: "authenticated cloud",
        status: "synced",
        cloudUpdatedAt: cloudProfile.updatedAt,
        localUpdatedAt: appliedCloud
          ? cloudProfile.updatedAt
          : readerProfile.updatedAt,
        cloudProfileExists: true,
        lastLoadStatus: appliedCloud ? "success" : "local-newer-kept",
        lastSyncAt: new Date().toISOString(),
        lastError: "",
        ...cloudDiagnosticUpdate(payload.diagnostic),
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileActionStatus: "success",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: new Date().toISOString(),
      });
      setStatusMessage(message);
    } catch (caughtError) {
      const message =
        "Could not refresh account profile. Local profile was kept.";
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastLoadStatus: "error",
        lastError: sanitizeAccountProfileError(caughtError),
        localUpdatedAt: readerProfile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileActionStatus: "error",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: new Date().toISOString(),
      });
      setStatusMessage(message);
    }
  }

  async function handleSaveAccountProfile() {
    const actionAt = new Date().toISOString();
    if (authState.authConfigured && !authState.currentUser) {
      const message = "Sign in to save your profile to your account.";
      updateCloudReaderProfileSync({
        status: "blocked",
        lastSaveOutcome: "error",
        lastBlockedProfileAction: "manual save while signed out",
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileAction: "save",
        lastAccountProfileActionStatus: "blocked",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: actionAt,
        accountProfileSaveBlockedReason: "signed out",
      });
      setStatusMessage(message);
      return;
    }
    const profileId = authState.currentUser?.id
      ? `reader-profile-${authState.currentUser.id}`
      : cloudReaderProfileSync.profileId || readOrCreateReaderProfileId();
    updateAccountProfileActionDiagnostics({
      lastAccountProfileAction: "save",
      lastAccountProfileActionStatus: "saving",
      lastAccountProfileActionMessage: "Saving…",
      lastAccountProfileActionAt: actionAt,
      accountProfileSaveBlockedReason: "none",
    });
    try {
      await saveReaderProfileToCloud(profileId, readerProfile);
      const message = "Profile saved to account.";
      updateAccountProfileActionDiagnostics({
        lastAccountProfileActionStatus: "success",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: new Date().toISOString(),
      });
      setStatusMessage(message);
    } catch (caughtError) {
      const message =
        "Could not save profile to account. Local profile was kept.";
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastSaveOutcome: "error",
        lastError: sanitizeAccountProfileError(caughtError),
        localUpdatedAt: readerProfile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
      });
      updateAccountProfileActionDiagnostics({
        lastAccountProfileActionStatus: "error",
        lastAccountProfileActionMessage: message,
        lastAccountProfileActionAt: new Date().toISOString(),
      });
      setStatusMessage(message);
    }
  }

  async function loadAuthenticatedReaderProfile() {
    if (!authState.currentUser) return;
    const currentUser = authState.currentUser;
    if (!currentUser) return;
    const profileId = `reader-profile-${currentUser.id}`;
    updateCloudReaderProfileSync({
      profileId,
      ownerId: currentUser.id,
      source: "authenticated cloud",
      status: "pending",
      lastLoadStatus: "loading",
      localProfileExists: readerProfileExistsInLocalStorage(),
    });
    try {
      const response = await fetch(`/api/reader-profile`, {
        cache: "no-store",
        headers: authHeaders(),
      });
      const payload = (await response
        .json()
        .catch(() => ({}))) as ReaderProfileSaveResponse;
      if (response.status === 503) {
        updateCloudReaderProfileSync({
          profileId,
          status: "unavailable",
          lastLoadStatus: "unavailable",
          lastSaveOutcome: "unavailable",
          lastError:
            payload.error ?? "Reader profile cloud persistence is unavailable.",
          localProfileExists: readerProfileExistsInLocalStorage(),
          ...cloudDiagnosticUpdate(payload.diagnostic),
        });
        return;
      }
      if (!response.ok) {
        updateCloudReaderProfileSync({
          profileId,
          ownerId: payload.ownerId ?? currentUser.id,
          source: "authenticated cloud",
          status: "error",
          lastLoadStatus: "error",
          lastError: payload.error ?? "Reader profile cloud load failed.",
          localProfileExists: readerProfileExistsInLocalStorage(),
          ...cloudDiagnosticUpdate(payload.diagnostic),
        });
        return;
      }
      const cloudProfile = normalizeCloudReaderProfile(payload.profile);
      if (cloudProfile) {
        setReaderProfile(cloudProfile);
        setHasLoadedReaderProfileState(true);
        setCanonicalReaderProfile(
          canonicalReaderProfileFromReaderProfile(
            cloudProfile,
            currentUser.id,
            "cloud",
          ),
        );
        updateCloudReaderProfileSync({
          profileId,
          ownerId: payload.ownerId ?? currentUser.id,
          source: "authenticated cloud",
          status: "synced",
          cloudUpdatedAt: cloudProfile.updatedAt,
          localUpdatedAt: cloudProfile.updatedAt,
          cloudProfileExists: true,
          lastLoadStatus: "success",
          lastError: "",
          initializedDefaultCloudProfile: false,
          ...cloudDiagnosticUpdate(payload.diagnostic),
        });
        return;
      }
      const defaultProfile = createEmptyReaderProfile();
      setReaderProfile(defaultProfile);
      setHasLoadedReaderProfileState(true);
      setCanonicalReaderProfile(
        canonicalReaderProfileFromReaderProfile(
          defaultProfile,
          authState.currentUser.id,
          "cloud",
        ),
      );
      updateCloudReaderProfileSync({
        profileId,
        ownerId: payload.ownerId ?? currentUser.id,
        source: "authenticated cloud",
        status: "not found",
        cloudProfileExists: false,
        lastLoadStatus: "not_found_then_initializing",
        localUpdatedAt: defaultProfile.updatedAt,
        lastError: "",
        initializedDefaultCloudProfile: true,
        ...cloudDiagnosticUpdate(payload.diagnostic),
      });
      await saveReaderProfileToCloud(profileId, defaultProfile);
      updateCloudReaderProfileSync({
        status: "synced",
        cloudProfileExists: true,
        lastLoadStatus: "not_found_then_initialized",
        lastError: "",
        initializedDefaultCloudProfile: true,
      });
    } catch (caughtError) {
      updateCloudReaderProfileSync({
        profileId,
        ownerId: authState.currentUser.id,
        source: "authenticated cloud",
        status: "error",
        lastLoadStatus: "error",
        lastError: formatErrorMessage(caughtError),
        localProfileExists: readerProfileExistsInLocalStorage(),
      });
    }
  }

  async function loadAuthenticatedStoryLibrary() {
    if (!authState.currentUser) return;
    try {
      const payload = await fetchCloudJson<CloudSavedStoryResponse>(
        `/api/projects/${AUTHENTICATED_STORY_LIBRARY_PROJECT_ID}/stories`,
        { headers: authHeaders() },
      );
      const stories = Array.isArray(payload.stories)
        ? payload.stories.map(cloudRecordToSavedStory)
        : [];
      setSavedStories(stories);
      setLibraryDiagnostics((current) => ({
        ...current,
        source: "authenticated cloud",
        loadedCount: stories.length,
      }));
    } catch (caughtError) {
      setSavedStories([]);
      setStatusMessage(
        `Stories unavailable: ${formatCaughtError(caughtError)}`,
      );
      setLibraryDiagnostics((current) => ({
        ...current,
        source: "authenticated cloud",
        loadedCount: 0,
      }));
    }
  }

  async function saveStoryToAuthenticatedLibrary(
    savedStory: SavedStory,
  ): Promise<SavedStory> {
    if (!authState.authConfigured) {
      const nextSavedStories = [
        savedStory,
        ...savedStories.filter((story) => story.id !== savedStory.id),
      ].slice(0, 25);
      persistSavedStories(nextSavedStories);
      setSavedStories(nextSavedStories);
      setLibraryDiagnostics((current) => ({
        ...current,
        source: "auth-disabled fallback",
        loadedCount: nextSavedStories.length,
        latestSaveOwnerId: "auth-disabled-fallback",
      }));
      return savedStory;
    }
    if (!authState.currentUser) {
      setLibraryDiagnostics((current) => ({
        ...current,
        lastBlockedAction: "save while signed out",
      }));
      throw new Error(
        "Sign in is required to save stories to the authenticated Library.",
      );
    }
    const payload = await fetchCloudJson<CloudSavedStoryResponse>(
      `/api/projects/${AUTHENTICATED_STORY_LIBRARY_PROJECT_ID}/stories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ story: savedStoryToCloudInput(savedStory) }),
      },
    );
    const cloudStory = payload.story
      ? cloudRecordToSavedStory(payload.story)
      : savedStory;
    const nextSavedStories = [
      cloudStory,
      ...savedStories.filter((story) => story.id !== cloudStory.id),
    ].slice(0, 25);
    setSavedStories(nextSavedStories);
    setLibraryDiagnostics((current) => ({
      ...current,
      source: "authenticated cloud",
      loadedCount: nextSavedStories.length,
      latestSaveOwnerId: authState.currentUser?.id ?? "none",
    }));
    return cloudStory;
  }

  function cancelActiveGeneration() {
    activeGenerationRequestId.current += 1;
    const hadActiveGeneration =
      Boolean(activeGenerationAbortController.current) || isGenerating;
    activeGenerationAbortController.current?.abort();
    activeGenerationAbortController.current = null;
    setIsGenerating(false);
    setGenerationSource(null);
    setPendingGenerationMode("none");
    if (hadActiveGeneration) setLastGenerationCancelledOrAborted(true);
  }

  function handleStopGeneration() {
    cancelActiveGeneration();
    setError("");
    setStatusMessage("Story generation stopped.");
  }

  function exitStoryReaderForHome() {
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    setIsStoryStartSelectionOpen(false);
    setPendingStoryStart(null);
    setMoodIntakeMode(null);
    setIsDirectionOpen(false);
    resetFeedbackDraftDiagnostics();
  }

  function navigateHome(options?: { preserveGeneration?: boolean }) {
    if (!options?.preserveGeneration) {
      cancelActiveGeneration();
      exitStoryReaderForHome();
    }
    setActiveView("home");
    if (typeof window !== "undefined")
      window.history.pushState(null, "", window.location.pathname);
  }

  function navigateToView(
    view: AppView,
    options?: { preserveGeneration?: boolean },
  ) {
    if (view === "home") {
      navigateHome(options);
      return;
    }
    setActiveView(view);
    if (typeof window === "undefined") return;
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}?view=${view}`,
    );
  }

  function requireSignInForAppAction(actionLabel = "that action"): boolean {
    if (!authState.appActionsGated) return false;
    navigateHome({ preserveGeneration: true });
    if (/library|saved story|saved episode/i.test(actionLabel))
      setLibraryDiagnostics((current) => ({
        ...current,
        lastBlockedAction: actionLabel,
      }));
    if (
      /profile|recommendations|feedback|reader signals|personalizing|preferences/i.test(
        actionLabel,
      )
    )
      setCloudReaderProfileSync((current) => ({
        ...current,
        status: "blocked",
        lastBlockedProfileAction: actionLabel,
      }));
    setStatusMessage(`Sign in with your email before ${actionLabel}.`);
    return true;
  }

  async function handleGenerate(overrides: {
    generationMode: GenerationMode;
    worldBible?: string;
    characterProfiles?: string;
    storySeed?: string;
    storyRules?: string;
    genrePreset?: GenrePreset;
    selectedStoryTypeChip?: StoryTypeChip;
    storySeedSource?: string;
    narrativeArchitecture?: NarrativeArchitecture;
    characterArc?: CharacterArc;
    endingType?: EndingType;
    lengthTarget?: LengthTarget;
    readerMood?: ReaderMoodSnapshot | null;
    presentation?: Exclude<GeneratedStoryPresentation, null>;
    loadingMessage?: string;
    signalSource?: ReaderProfileEventSource;
    generationSource?: Exclude<GenerationSource, null>;
    continuationStoryId?: string;
    continuationContextIncluded?: boolean;
    selectedSeriesId?: string | null;
    sourceStoryId?: string | null;
    continuationDiagnostics?: ContinuationGenerationDiagnostics;
  }) {
    if (
      requireSignInForAppAction(
        overrides.generationMode === "continue_series"
          ? "continuing a series"
          : "starting generation",
      )
    )
      return;
    const nextGenerationSource =
      overrides.generationSource ??
      (overrides.generationMode === "continue_series"
        ? "continue-story"
        : "new-story");
    const continuationStoryId =
      nextGenerationSource === "continue-story"
        ? (overrides.continuationStoryId?.trim() ?? "")
        : "";

    if (nextGenerationSource === "continue-story" && !continuationStoryId) {
      setLastContinuationContextIncluded(false);
      setLastContinuationBlockedBecauseContextMissing(true);
      setError("Choose an active story before continuing it.");
      return;
    }

    const requestId = activeGenerationRequestId.current + 1;
    activeGenerationRequestId.current = requestId;
    activeGenerationAbortController.current?.abort();
    const abortController = new AbortController();
    activeGenerationAbortController.current = abortController;
    const generationIdentity = createGenerationIdentity({
      generationMode: overrides.generationMode,
      activeStoryId: activeCommittedStoryId || currentStoryId || null,
      activeSeriesId:
        activeCommittedSeriesId ||
        (storyResponse?.metadata.diagnostics.seriesId ?? null),
      selectedSeriesId: overrides.selectedSeriesId ?? null,
      sourceStoryId: overrides.sourceStoryId ?? null,
    });
    setError("");
    const generationAuthTokenPresent = authTokenPresent();
    const generationDiagnosticsBase = {
      authConfigured: authState.authConfigured,
      authRequiredForGeneration: authState.appActionsGated,
      authSessionPresent: Boolean(authState.currentUser),
      authTokenPresent: generationAuthTokenPresent,
      currentUserPresent: Boolean(authState.currentUser),
      ...(overrides.continuationDiagnostics ?? {}),
    };
    const generationFetchStartedAt = Date.now();
    setLastGenerationFailureDiagnostic({
      deployedAppVersion: APP_VERSION,
      latestGenerationAttemptId: String(requestId),
      generationRequestStarted: true,
      generationRequestStatus: "requesting",
      generationEndpointStatusCode: "pending",
      ...generationDiagnosticsBase,
      storyGenerationFailureStage: "requesting",
      storyGenerationFailureReason: null,
      storyGenerationFailureSource: "client",
      storyGenerationRetryAttempted: false,
      storyGenerationRetrySucceeded: false,
      storyMetadataLeakGuardEnabled: true,
      storyMetadataLeakScanTarget: "final-story-prose",
      storyMetadataLeakDetected: false,
      storyMetadataLeakSanitized: false,
      storyMetadataLeakFinalClean: false,
      storyMetadataLeakRemovedPatterns: [],
      storyRawCandidateLength: 0,
      storySanitizedCandidateLength: 0,
      storyRepairAttempted: false,
      fallbackDisplayBlocked: true,
    });
    setStatusMessage(overrides.loadingMessage ?? "");
    setLastGenerationTrigger(overrides.signalSource ?? "create");
    setGenerationSource(nextGenerationSource);
    setPendingGenerationMode(overrides.generationMode);
    setLastGenerationCancelledOrAborted(false);
    setLastRequestIncludedContinuationStoryId(Boolean(continuationStoryId));
    setLastContinuationContextIncluded(
      Boolean(overrides.continuationContextIncluded),
    );
    setLastContinuationBlockedBecauseContextMissing(false);
    const activeReaderProfile = authState.currentUser
      ? readerProfile
      : readReaderProfile();
    const activeCanonicalProfile = authState.currentUser
      ? canonicalReaderProfileFromReaderProfile(
          activeReaderProfile,
          authState.currentUser.id,
          "cloud",
        )
      : mirrorCanonicalReaderProfilePreferences(
          loadCanonicalReaderProfile(),
          activeReaderProfile,
          eerieReaderProfile,
        );
    setCanonicalReaderProfile(activeCanonicalProfile);
    const personalization = buildNewStoryPersonalization({
      eerieProfile: eerieReaderProfile,
      genre: overrides?.genrePreset ?? genrePreset,
      mode: nextGenerationSource,
      profile: activeReaderProfile,
      source: getReaderProfileSource(cloudReaderProfileSync),
      trigger: overrides.signalSource ?? "create",
      continuationStoryId,
      canonicalProfile: activeCanonicalProfile,
    });
    setLastNewStoryPersonalization(personalization.diagnostics);
    setIsGenerating(true);
    try {
      let response: Response;
      try {
        response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Generation-Attempt-Id": String(requestId),
            ...authHeaders(),
          },
          signal: abortController.signal,
          body: JSON.stringify({
            worldBible: overrides?.worldBible ?? worldBible.content,
            characterProfiles:
              overrides?.characterProfiles ?? characterProfiles.content,
            storySeed: overrides?.storySeed ?? storySeed.content,
            storyRules: overrides?.storyRules ?? storyRules.content,
            genrePreset: overrides?.genrePreset ?? genrePreset,
            narrativeArchitecture:
              overrides?.narrativeArchitecture ?? narrativeArchitecture,
            characterArc: overrides?.characterArc ?? characterArc,
            endingType: overrides?.endingType ?? endingType,
            lengthTarget: overrides?.lengthTarget ?? lengthTarget,
            generationMode: overrides.generationMode,
            generationIdentity,
            continuationContextIncluded: Boolean(
              overrides.continuationContextIncluded,
            ),
            generationTrigger: getGenerationTriggerLabel(
              overrides.generationMode,
              overrides.signalSource ?? "create",
            ),
            readerMood:
              overrides?.readerMood ?? readerProfile.latestMood ?? null,
            ...(personalization.prompt
              ? { personalizationContext: personalization.prompt }
              : {}),
            readerProfileGenerationSnapshot: personalization.snapshot,
            readerProfileInput: buildGenerationReaderProfileInput(
              activeCanonicalProfile,
            ),
            ...(overrides.selectedStoryTypeChip
              ? {
                  selectedStoryTypeChipId: overrides.selectedStoryTypeChip.id,
                  selectedStoryTypeChipLabel:
                    overrides.selectedStoryTypeChip.label,
                  legacyGenrePreset: overrides?.genrePreset ?? genrePreset,
                  storyTypeSelectionMode: "selected",
                  storySeedSource: overrides.storySeedSource,
                  selectedStoryTypeGuidance:
                    overrides.selectedStoryTypeChip.guidance,
                  selectedStoryTypeKeywords:
                    overrides.selectedStoryTypeChip.keywords,
                }
              : {}),
            ...(continuationStoryId ? { continuationStoryId } : {}),
            ...(overrides.continuationDiagnostics
              ? { continuationDiagnostics: overrides.continuationDiagnostics }
              : {}),
          }),
        });
      } catch (fetchError) {
        if (abortController.signal.aborted) throw fetchError;
        const diagnostics = buildGenerationFetchDiagnostics({
          attemptId: String(requestId),
          stage: "generation_request",
          endpoint: "/api/generate",
          action: "POST",
          error: fetchError,
          elapsedSeconds: elapsedSecondsSince(generationFetchStartedAt),
          ...generationDiagnosticsBase,
        });
        logGenerationFetchDiagnostics(diagnostics);
        setLastGenerationFailureDiagnostic((current) => ({
          ...(current ?? {}),
          deployedAppVersion: APP_VERSION,
          latestGenerationAttemptId: String(requestId),
          generationRequestStarted: true,
          generationRequestStatus: "failed",
          generationEndpointStatusCode: "none",
          ...diagnostics,
          fallbackDisplayBlocked: true,
        }));
        throw new Error(
          nextGenerationSource === "continue-story"
            ? "Continuation request timed out. Episode 1 is still safe. Try continuing again."
            : "Generation request lost connection before the server responded. Try again.",
        );
      }
      let payload: Record<string, unknown>;
      try {
        payload = await readGenerateResponsePayload(response);
      } catch (parseError) {
        const diagnostics = buildGenerationFetchDiagnostics({
          attemptId: String(requestId),
          stage: "generation_response_parse",
          endpoint: "/api/generate",
          action: "parse_json",
          response,
          error: parseError,
          elapsedSeconds: elapsedSecondsSince(generationFetchStartedAt),
          ...generationDiagnosticsBase,
        });
        logGenerationFetchDiagnostics(diagnostics);
        setLastGenerationFailureDiagnostic((current) => ({
          ...(current ?? {}),
          deployedAppVersion: APP_VERSION,
          latestGenerationAttemptId: String(requestId),
          generationRequestStarted: true,
          generationRequestStatus: "failed",
          generationEndpointStatusCode: response.status,
          ...diagnostics,
          fallbackDisplayBlocked: true,
        }));
        throw new Error(
          response.status === 504
            ? getGenerationTimeoutMessage()
            : "Story generation returned a response the app could not read. Try again.",
        );
      }
      if (activeGenerationRequestId.current !== requestId) return;
      if (!response.ok) {
        setLastGenerationFailureDiagnostic({
          deployedAppVersion: APP_VERSION,
          latestGenerationAttemptId: String(requestId),
          ...readDiagnosticRecord(payload),
          generationRequestStarted: true,
          generationRequestStatus: "failed",
          generationEndpointStatusCode: response.status,
          ...buildGenerationFetchDiagnostics({
            attemptId: String(requestId),
            stage: "generation_response",
            endpoint: "/api/generate",
            action: "POST",
            response,
            elapsedSeconds: elapsedSecondsSince(generationFetchStartedAt),
            ...generationDiagnosticsBase,
          }),
          fallbackDisplayBlocked: true,
        });
        throw new Error(
          response.status === 504
            ? getGenerationTimeoutMessage()
            : typeof payload.error === "string"
              ? payload.error
              : "Story generation failed.",
        );
      }
      const normalizedResponse = assertUserDisplayableGenerationResponse(
        applySelectedStoryTypeMetadata(
          normalizeGenerateStoryResponse(payload),
          overrides.selectedStoryTypeChip,
        ),
      );
      setLastGenerationFailureDiagnostic({
        deployedAppVersion: APP_VERSION,
        latestGenerationAttemptId: String(requestId),
        ...normalizedResponse.metadata.diagnostics,
        generationRequestStarted: true,
        generationRequestStatus: "succeeded",
        generationEndpointStatusCode: response.status,
        ...buildGenerationFetchDiagnostics({
          attemptId: String(requestId),
          stage: "generation_response_parse",
          endpoint: "/api/generate",
          action: "parse_json",
          response,
          elapsedSeconds: elapsedSecondsSince(generationFetchStartedAt),
          ...generationDiagnosticsBase,
        }),
        fallbackDisplayBlocked: true,
      });
      setLastNewStoryPersonalization((current) => ({
        ...current,
        responseSnapshot:
          normalizedResponse.metadata.diagnostics.readerProfileSnapshot ??
          normalizedResponse.metadata.diagnostics
            .readerProfileGenerationSnapshot,
        identityDiagnostics: {
          identity: {
            generationMode:
              normalizedResponse.metadata.diagnostics.generationMode,
            storyId: normalizedResponse.metadata.diagnostics.storyId,
            seriesId: normalizedResponse.metadata.diagnostics.seriesId,
            parentSeriesId:
              normalizedResponse.metadata.diagnostics.parentSeriesId ?? null,
            sourceStoryId:
              normalizedResponse.metadata.diagnostics.sourceStoryId ?? null,
            createdAt: generationIdentity.createdAt,
          },
          continuationContextIncluded:
            normalizedResponse.metadata.diagnostics.continuationContextIncluded,
          newSeriesCreated:
            normalizedResponse.metadata.diagnostics.newSeriesCreated,
          trigger: normalizedResponse.metadata.diagnostics.generationTrigger,
          activeCommittedStoryId:
            normalizedResponse.metadata.diagnostics.storyId,
          activeCommittedSeriesId:
            normalizedResponse.metadata.diagnostics.seriesId,
          pendingGenerationMode: "none",
          lastGenerationCancelledOrAborted: false,
        },
      }));
      const generatedStoryId =
        normalizedResponse.metadata.diagnostics.storyId ||
        generationIdentity.storyId;
      const unsavedGeneratedStory = createSavedStory(
        normalizedResponse,
        generatedStoryId,
      );
      setStoryResponse(normalizedResponse);
      setCurrentStoryId(generatedStoryId);
      setActiveCommittedStoryId(generatedStoryId);
      setActiveCommittedSeriesId(
        normalizedResponse.metadata.diagnostics.seriesId,
      );
      let savedStory = unsavedGeneratedStory;
      let librarySaveFailed = false;
      try {
        savedStory = await saveStoryToAuthenticatedLibrary(
          unsavedGeneratedStory,
        );
      } catch (librarySaveError) {
        librarySaveFailed = true;
        const diagnostics = buildGenerationFetchDiagnostics({
          attemptId: String(requestId),
          stage: "library_save",
          endpoint: `/api/projects/${AUTHENTICATED_STORY_LIBRARY_PROJECT_ID}/stories`,
          action: "POST",
          error: librarySaveError,
          elapsedSeconds: elapsedSecondsSince(generationFetchStartedAt),
          generationSucceededButLibrarySaveFailed: true,
          ...generationDiagnosticsBase,
        });
        logGenerationFetchDiagnostics(diagnostics);
        setLastGenerationFailureDiagnostic((current) => ({
          ...(current ?? {}),
          deployedAppVersion: APP_VERSION,
          latestGenerationAttemptId: String(requestId),
          generationRequestStarted: true,
          generationRequestStatus: "succeeded",
          generationEndpointStatusCode: response.status,
          ...diagnostics,
          fallbackDisplayBlocked: true,
        }));
      }
      const nextPresentation = overrides?.presentation ?? "first-episode";
      setGeneratedStoryPresentation(nextPresentation);
      if (
        nextGenerationSource === "continue-story" ||
        nextPresentation === "continuation"
      ) {
        setReaderScrollDiagnostics((current) => ({
          ...current,
          continuationLoaded: "yes",
          scrollResetAttempted: "pending",
          scrollTargetUsed: "pending",
        }));
      }
      const generatedAt = new Date().toISOString();
      const canonicalAfterGenerationDraft = {
        ...activeCanonicalProfile,
        updatedAt: generatedAt,
        signals: {
          ...activeCanonicalProfile.signals,
          lastStoryGeneratedAt: generatedAt,
          lastGenerationUsedCanonicalProfile: true,
        },
      };
      const canonicalAfterGeneration = authState.currentUser
        ? canonicalAfterGenerationDraft
        : saveCanonicalReaderProfile(canonicalAfterGenerationDraft);
      setCanonicalReaderProfile(canonicalAfterGeneration);
      if (overrides.generationMode === "new_story") {
        recordReaderSignal({
          eventType: "storyGenerated",
          source: "startSomethingNew",
          storyId: generatedStoryId,
          title: savedStory.title,
          genre: savedStory.genrePreset,
          wordCount: savedStory.wordCount,
        });
      } else {
        recordReaderSignal({
          eventType: "storyGenerated",
          source: overrides.signalSource ?? "create",
          storyId: generatedStoryId,
          title: savedStory.title,
          genre: savedStory.genrePreset,
          wordCount: savedStory.wordCount,
        });
      }
      recordReaderSignal({
        eventType: "storyOpened",
        source: overrides?.signalSource ?? "create",
        storyId: generatedStoryId,
        title: savedStory.title,
        genre: savedStory.genrePreset,
        wordCount: savedStory.wordCount,
      });
      setIsStoryStartSelectionOpen(false);
      clearDemoLatestStory();
      setDemoStory(null);
      navigateHome({ preserveGeneration: true });
      setGenerationApprovedMoodSnapshotId(null);
      setStatusMessage(
        librarySaveFailed
          ? "Story generated, but cloud save failed. Your story is still visible."
          : "Story ready.",
      );
    } catch (caughtError) {
      if (activeGenerationRequestId.current !== requestId) return;
      const rawMessage =
        caughtError instanceof Error
          ? caughtError.message
          : "Story generation failed.";
      const message =
        rawMessage === "Load failed"
          ? "Generation request lost connection before the server responded. Try again."
          : rawMessage;
      setStatusMessage("");
      if (message === CLEAN_GENERATION_FAILURE_MESSAGE) {
        setLastGenerationFailureDiagnostic((current) => ({
          ...(current ?? {}),
          deployedAppVersion: APP_VERSION,
          latestGenerationAttemptId: String(requestId),
          generationRequestStarted: true,
          generationRequestStatus: "failed",
          storyGenerationFailureStage:
            current?.storyGenerationFailureStage ?? "display-policy",
          storyGenerationFailureReason:
            current?.storyGenerationFailureReason ??
            "fallback_or_unclean_story_blocked",
          storyGenerationFailureSource:
            current?.storyGenerationFailureSource ?? "client",
          fallbackDisplayBlocked: true,
        }));
      }
      setError(message);
    } finally {
      if (activeGenerationRequestId.current === requestId) {
        activeGenerationAbortController.current = null;
        setIsGenerating(false);
        setGenerationSource(null);
        setPendingGenerationMode("none");
      }
    }
  }

  function applyStoryStart(
    story: StoryStart,
    options: { updateActiveMood?: boolean } = {},
  ) {
    setWorldBible({
      name: `${slugify(story.title)}-world.txt`,
      content: story.world,
    });
    setCharacterProfiles({
      name: `${slugify(story.title)}-cast.txt`,
      content: story.cast,
    });
    setStorySeed({
      name: `${slugify(story.title)}-spark.txt`,
      content: story.seed,
    });
    setStoryRules({
      name: `${slugify(story.title)}-rules.txt`,
      content: story.rules,
    });
    setGenrePreset(story.genre);
    if (options.updateActiveMood) setActiveMood(story.mood);
  }

  function generateFirstPageTestFromStoryStart(story: StoryStart) {
    applyStoryStart(story);
    setIsStoryStartSelectionOpen(false);
    setPendingStoryStart(null);
    setMoodIntakeMode(null);
    setGeneratedStoryPresentation("first-episode");
    setStatusMessage(`Generating ${story.title} from your reader pulse.`);

    void handleGenerate({
      generationMode: "new_story",
      worldBible: story.world,
      characterProfiles: story.cast,
      storySeed: story.seed,
      storyRules: [story.rules, FIRST_PAGE_TEST_STORY_RULES]
        .filter(Boolean)
        .join("\n\n"),
      genrePreset: story.genre,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "First Page Test",
      readerMood: readerProfile.latestMood ?? null,
      presentation: "first-episode",
      signalSource: "startSomethingNew",
      generationSource: "new-story",
    });
  }

  function handleStartRecommendation(story: StoryStart) {
    const approvedCurrentMood = Boolean(
      readerProfile.latestMood?.id &&
      generationApprovedMoodSnapshotId === readerProfile.latestMood.id,
    );

    if (isStoryStartSelectionOpen && approvedCurrentMood) {
      generateFirstPageTestFromStoryStart(story);
      return;
    }

    setPendingStoryStart(story);
    setMoodIntakeMode("story-start");
    setStatusMessage("Tell Bloodwick what you need from this story.");
    navigateToView("mood-intake");
  }

  function recordReadyStoryQueueSignal(
    item: ReadyStoryQueueItem,
    signal: ReadyStoryQueueSignal,
  ): ReaderProfile {
    if (requireSignInForAppAction("updating recommendations"))
      return readerProfile;
    const now = new Date().toISOString();
    const nextProfile = saveReadyStoryQueueSignal(
      {
        storyCardId: item.sourceStorySparkId ?? item.id,
        storyTitle: item.title,
        signal,
        genre: item.genre,
        mood: item.mood,
        source: "desktop-ready-story-queue",
        createdAt: now,
        updatedAt: now,
      },
      readerProfile,
      !authState.authConfigured,
    );

    setReaderProfile(nextProfile);
    void syncReaderProfileToCloud(nextProfile);
    setLastReadyStoryQueueAction(`${signal}: ${item.title}`);
    return nextProfile;
  }

  function removeReadyQueueItemAndPersist(
    itemId: string,
    profileForBackfill = readerProfile,
    savedForLaterQueueForBackfill = savedForLaterStoryQueue,
  ) {
    const queueWithOpenSlot = removeReadyStoryQueueItem(
      readyStoryQueue,
      itemId,
    );
    const backfilledQueue = fillReadyStoryQueueFromCatalog(
      queueWithOpenSlot,
      savedForLaterQueueForBackfill,
      profileForBackfill,
    );
    const nextQueue = persistReadyStoryQueue(backfilledQueue);
    setReadyStoryQueue(nextQueue);
    return nextQueue;
  }

  function removeSavedForLaterQueueItemAndPersist(itemId: string) {
    const nextSaved = persistSavedForLaterStoryQueue(
      removeReadyStoryQueueItem(savedForLaterStoryQueue, itemId),
    );
    setSavedForLaterStoryQueue(nextSaved);
    return nextSaved;
  }

  function readyStoryQueueItemToStoryStart(
    item: ReadyStoryQueueItem,
  ): StoryStart {
    return {
      title: item.title,
      premise: item.premise,
      genre: item.genre,
      mood: readMood(item.mood),
      heroName: item.heroName,
      heroRole: item.heroRole,
      heroBio: item.heroBio,
      worldName: item.worldName,
      world: item.world,
      seed: item.seed,
      cast: item.cast,
      rules: item.rules,
      sourceStorySparkId: item.sourceStorySparkId ?? item.id,
      sourceStorySparkTitle: item.sourceStorySparkTitle ?? item.title,
      tags: item.tags ?? [],
    };
  }

  async function openReadyStoryQueueItem(
    item: ReadyStoryQueueItem,
    removeItem: (itemId: string, profileForBackfill?: ReaderProfile) => void,
  ) {
    if (requireSignInForAppAction("opening a recommended story")) return;
    if (isGenerating || item.generationStatus === "generating") return;

    const nextProfile = recordReadyStoryQueueSignal(item, "read");
    removeItem(item.id, nextProfile);

    if (item.generationStatus === "ready" && item.generatedStory) {
      const generatedStoryId =
        item.generatedStoryId || createStoryId(item.generatedStory.story);
      const savedStory = await saveStoryToAuthenticatedLibrary(
        createSavedStory(item.generatedStory, generatedStoryId),
      );
      setStoryResponse(item.generatedStory);
      setCurrentStoryId(generatedStoryId);
      setActiveCommittedStoryId(generatedStoryId);
      setActiveCommittedSeriesId(
        item.generatedStory.metadata.diagnostics.seriesId,
      );
      setGeneratedStoryPresentation("first-episode");
      setIsStoryStartSelectionOpen(false);
      setPendingStoryStart(null);
      setMoodIntakeMode(null);
      clearDemoLatestStory();
      setDemoStory(null);
      navigateHome({ preserveGeneration: true });
      setStatusMessage(`Opened ${item.title}.`);
      recordReaderSignal({
        eventType: "storyOpened",
        source: "startSomethingNew",
        storyId: generatedStoryId,
        title: savedStory.title,
        genre: savedStory.genrePreset,
        wordCount: savedStory.wordCount,
      });
      return;
    }

    const storyStart = readyStoryQueueItemToStoryStart(item);
    applyStoryStart(storyStart);
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    setIsStoryStartSelectionOpen(false);
    setPendingStoryStart(null);
    setMoodIntakeMode(null);

    void handleGenerate({
      generationMode: "new_story",
      worldBible: storyStart.world,
      characterProfiles: storyStart.cast,
      storySeed: storyStart.seed,
      storyRules: storyStart.rules,
      genrePreset: storyStart.genre,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "Standard",
      readerMood: readerProfile.latestMood ?? null,
      presentation: "first-episode",
      loadingMessage: `Opening ${storyStart.title}…`,
      signalSource: "startSomethingNew",
      generationSource: "new-story",
    });
  }

  function handleReadReadyStory(item: ReadyStoryQueueItem) {
    void openReadyStoryQueueItem(item, removeReadyQueueItemAndPersist);
  }

  function handleReadSavedForLaterStory(item: ReadyStoryQueueItem) {
    void openReadyStoryQueueItem(item, removeSavedForLaterQueueItemAndPersist);
  }

  function handlePassReadyStory(item: ReadyStoryQueueItem) {
    if (requireSignInForAppAction("training recommendations")) return;
    const nextProfile = recordReadyStoryQueueSignal(item, "pass");
    removeReadyQueueItemAndPersist(item.id, nextProfile);
    setStatusMessage(`Passed ${item.title}.`);
  }

  function handleSaveReadyStoryForLater(item: ReadyStoryQueueItem) {
    if (requireSignInForAppAction("saving a recommendation")) return;
    const nextProfile = recordReadyStoryQueueSignal(item, "save_for_later");
    const nextSaved = persistSavedForLaterStoryQueue(
      upsertSavedForLaterStoryQueueItem(savedForLaterStoryQueue, item),
    );
    setSavedForLaterStoryQueue(nextSaved);
    removeReadyQueueItemAndPersist(item.id, nextProfile, nextSaved);
    setStatusMessage(`Saved ${item.title} for later.`);
  }

  function handleMoveSavedForLaterStoryToWaitingQueue(
    item: ReadyStoryQueueItem,
  ) {
    const nextSaved = removeSavedForLaterQueueItemAndPersist(item.id);
    const queueWithMovedItem = [
      item,
      ...readyStoryQueue.filter((queueItem) => queueItem.id !== item.id),
    ].slice(0, MAX_READY_STORY_QUEUE_ITEMS);
    const backfilledQueue = fillReadyStoryQueueFromCatalog(
      queueWithMovedItem,
      nextSaved,
      readerProfile,
    );
    const nextQueue = persistReadyStoryQueue(backfilledQueue);
    setReadyStoryQueue(nextQueue);
    setStatusMessage(`Moved ${item.title} back to the waiting queue.`);
  }

  function handleRemoveSavedForLaterStory(item: ReadyStoryQueueItem) {
    removeSavedForLaterQueueItemAndPersist(item.id);
    setStatusMessage(`Removed ${item.title} from saved for later.`);
  }

  function handleStartSomethingNew() {
    if (requireSignInForAppAction("starting a new story")) return;
    if (isGenerating) return;

    const selectedChip = activeMood;
    const selectedChipDefinition = getStoryTypeChip(selectedChip);
    const { storyStart, fallbackUsed, compatibilityResult } =
      findStoryStartForMood(selectedChip);
    applyStoryStart(storyStart);
    setStoryTypeSelectionDiagnostics({
      selectedChipId: selectedChipDefinition.id,
      selectedChip: selectedChipDefinition.label,
      availableChips: formatMoodChipList(AVAILABLE_MOOD_CHIPS),
      storySparkUsed: fallbackUsed ? "no" : "yes",
      selectedStorySparkId: fallbackUsed
        ? "none"
        : storyStart.sourceStorySparkId,
      selectedStorySparkTitle: fallbackUsed
        ? "none"
        : storyStart.sourceStorySparkTitle,
      selectedStorySparkMatchedChip: fallbackUsed
        ? "none"
        : selectedChipDefinition.label,
      selectedStoryTypeChipId: selectedChipDefinition.id,
      selectedStoryTypeChipLabel: selectedChipDefinition.label,
      directChipGuidanceUsed: fallbackUsed ? "yes" : "no",
      compatibilityResult,
      chipCompatibilityResult: compatibilityResult,
      fallbackSelectionUsed: fallbackUsed
        ? "yes - direct selected chip-guidance seed used"
        : "no",
      selectedChipPreservedDuringGeneration:
        activeMood === selectedChip ? "yes" : "no",
      storyTypeSelectionMode: "selected",
      storySeedSource: fallbackUsed
        ? "direct-chip-guidance"
        : "compatible-storyspark",
      visibleCategoryLabel: selectedChipDefinition.label,
    });
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    setIsStoryStartSelectionOpen(false);
    setPendingStoryStart(null);
    setMoodIntakeMode(null);
    navigateToView("home", { preserveGeneration: true });

    void handleGenerate({
      generationMode: "new_story",
      worldBible: storyStart.world,
      characterProfiles: storyStart.cast,
      storySeed: storyStart.seed,
      storyRules: storyStart.rules,
      genrePreset: storyStart.genre,
      selectedStoryTypeChip: selectedChipDefinition,
      storySeedSource: fallbackUsed
        ? "direct-chip-guidance"
        : "compatible-storyspark",
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "Standard",
      readerMood: readerProfile.latestMood ?? null,
      presentation: "first-episode",
      loadingMessage: "Writing the perfect story for you…",
      signalSource: "startSomethingNew",
      generationSource: "new-story",
    });
  }

  function handleMoodSelect(mood: Mood) {
    if (requireSignInForAppAction("personalizing recommendations")) return;
    setActiveMood(mood);
    setSelectedHomeFearCategory(mood);
    recordReaderSignal({ eventType: "moodSelected", mood });
  }

  function handleCreateGenerateClick() {
    if (requireSignInForAppAction("generating a story")) return;
    if (isGenerating) return;

    const approvedCurrentMood = Boolean(
      readerProfile.latestMood?.id &&
      generationApprovedMoodSnapshotId === readerProfile.latestMood.id,
    );

    if (approvedCurrentMood) {
      void handleGenerate({
        generationMode: "new_story",
        readerMood: readerProfile.latestMood ?? null,
        signalSource: "create",
        generationSource: "new-story",
      });
      return;
    }

    setPendingStoryStart(null);
    setMoodIntakeMode("generate");
    setStatusMessage("Tell Bloodwick what you need before it writes.");
    navigateToView("mood-intake");
  }

  function handleMoodIntakeSubmit(draft: ReaderMoodDraft) {
    if (requireSignInForAppAction("saving reader preferences")) return;
    const nextProfile = saveReaderMoodSnapshot(
      draft,
      readerProfile,
      !authState.authConfigured,
    );
    const latestMood = nextProfile.latestMood ?? null;
    const signaledProfile = recordReaderProfileEvent(
      { eventType: "moodSelected", mood: latestMood?.mood || draft.mood },
      nextProfile,
      !authState.authConfigured,
    );
    const storyStartToApply = pendingStoryStart;
    const modeToComplete = moodIntakeMode;

    setReaderProfile(signaledProfile);
    void syncReaderProfileToCloud(signaledProfile);
    setGenerationApprovedMoodSnapshotId(latestMood?.id ?? null);
    setPendingStoryStart(null);
    setMoodIntakeMode(null);

    if (storyStartToApply) {
      applyStoryStart(storyStartToApply);
      setIsStoryStartSelectionOpen(false);
      setGeneratedStoryPresentation("first-episode");
      setStatusMessage(
        `Generating ${storyStartToApply.title} from your reader pulse.`,
      );
      void handleGenerate({
        generationMode: "new_story",
        worldBible: storyStartToApply.world,
        characterProfiles: storyStartToApply.cast,
        storySeed: storyStartToApply.seed,
        storyRules: [storyStartToApply.rules, FIRST_PAGE_TEST_STORY_RULES]
          .filter(Boolean)
          .join("\n\n"),
        genrePreset: storyStartToApply.genre,
        narrativeArchitecture,
        characterArc,
        endingType,
        lengthTarget: "First Page Test",
        readerMood: latestMood,
        presentation: "first-episode",
        signalSource: "startSomethingNew",
        generationSource: "new-story",
      });
      return;
    }

    if (modeToComplete === "story-start") {
      setIsStoryStartSelectionOpen(true);
      navigateHome({ preserveGeneration: true });
      setStatusMessage(
        "Reader pulse saved. Choose a story based on your reader pulse.",
      );
      return;
    }

    if (modeToComplete === "generate") {
      setStatusMessage("Reader pulse saved. Generating story.");
      void handleGenerate({
        generationMode: "new_story",
        readerMood: latestMood,
        signalSource: "create",
        generationSource: "new-story",
      });
      return;
    }

    navigateToView("create");
    setStatusMessage("Reader pulse saved.");
  }

  function handleMoodIntakeCancel() {
    setPendingStoryStart(null);
    setMoodIntakeMode(null);
    setIsStoryStartSelectionOpen(false);
    navigateToView("home");
    setStatusMessage("Reader pulse skipped. No new story started.");
  }

  function handleClearReaderProfile() {
    const emptyProfile = clearReaderProfile();
    setReaderProfile(emptyProfile);
    const profileId =
      cloudReaderProfileSync.profileId || readOrCreateReaderProfileId();
    setCloudReaderProfileSync((current) => ({
      ...current,
      profileId,
      status: "pending",
      localUpdatedAt: "",
      localProfileExists: false,
    }));
    void deleteCloudReaderProfile(profileId);
    setGenerationApprovedMoodSnapshotId(null);
    setIsStoryStartSelectionOpen(false);
    setStatusMessage("Reader profile cleared from this browser.");
  }

  function handleClearEerieReaderProfile() {
    const defaultProfile = clearEerieReaderProfile();
    setEerieReaderProfile(defaultProfile);
    setStatusMessage("Eerie reader profile cleared from this browser.");
  }

  async function reconcileReaderProfileWithCloud(
    profileId: string,
    localProfile: ReaderProfile,
  ) {
    try {
      const response = await fetch(
        `/api/reader-profile?profileId=${encodeURIComponent(profileId)}`,
        { cache: "no-store", headers: authHeaders() },
      );
      const payload = await response.json().catch(() => ({}));

      if (response.status === 503) {
        updateCloudReaderProfileSync({
          profileId,
          status: "unavailable",
          lastSaveOutcome: "unavailable",
          lastError:
            payload.error ?? "Reader profile cloud persistence is unavailable.",
          localUpdatedAt: localProfile.updatedAt,
          localProfileExists: readerProfileExistsInLocalStorage(),
        });
        return;
      }

      if (!response.ok)
        throw new Error(payload.error ?? "Reader profile cloud sync failed.");

      const cloudProfile = normalizeCloudReaderProfile(payload.profile);
      const cloudUpdatedAt = cloudProfile?.updatedAt ?? "";
      if (cloudProfile && cloudUpdatedAt > localProfile.updatedAt) {
        persistReaderProfile(cloudProfile);
        setReaderProfile(cloudProfile);
        setHasLoadedReaderProfileState(true);
        updateCloudReaderProfileSync({
          profileId,
          status: "synced",
          cloudUpdatedAt,
          localUpdatedAt: cloudProfile.updatedAt,
          localProfileExists: true,
          lastError: "",
        });
        return;
      }

      if (localProfile.profileExists) {
        await saveReaderProfileToCloud(profileId, localProfile);
        return;
      }

      updateCloudReaderProfileSync({
        profileId,
        status: "not found",
        cloudUpdatedAt,
        localUpdatedAt: localProfile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
        lastError: "",
      });
    } catch (caughtError) {
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastSaveOutcome: "error",
        lastError: formatErrorMessage(caughtError),
        localUpdatedAt: localProfile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
      });
    }
  }

  async function syncReaderProfileToCloud(profile: ReaderProfile) {
    if (authState.authConfigured && !authState.currentUser) {
      updateCloudReaderProfileSync({
        status: "blocked",
        lastBlockedProfileAction: "profile save while signed out",
        lastSaveOutcome: "error",
      });
      return;
    }
    const profileId = authState.currentUser?.id
      ? `reader-profile-${authState.currentUser.id}`
      : cloudReaderProfileSync.profileId || readOrCreateReaderProfileId();
    updateCloudReaderProfileSync({
      profileId,
      ownerId: authState.currentUser?.id ?? "auth-disabled-fallback",
      source: authState.currentUser
        ? "authenticated cloud"
        : "auth-disabled fallback",
      status: "pending",
      localUpdatedAt: profile.updatedAt,
      localProfileExists: readerProfileExistsInLocalStorage(),
    });

    try {
      await saveReaderProfileToCloud(profileId, profile);
    } catch (caughtError) {
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastSaveOutcome: "error",
        lastError: formatErrorMessage(caughtError),
        localUpdatedAt: profile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
      });
    }
  }

  async function saveReaderProfileToCloud(
    profileId: string,
    profile: ReaderProfile,
  ) {
    const response = await fetch("/api/reader-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ profileId, profile }),
    });
    const payload = (await response
      .json()
      .catch(() => ({}))) as ReaderProfileSaveResponse;

    if (response.status === 503) {
      updateCloudReaderProfileSync({
        profileId,
        status: "unavailable",
        lastSaveOutcome: "unavailable",
        lastError:
          payload.error ?? "Reader profile cloud persistence is unavailable.",
        localUpdatedAt: profile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
        ...cloudDiagnosticUpdate(payload.diagnostic),
      });
      return;
    }

    if (!response.ok) {
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastSaveOutcome: "error",
        lastError: payload.error ?? "Reader profile cloud save failed.",
        localUpdatedAt: profile.updatedAt,
        localProfileExists: readerProfileExistsInLocalStorage(),
        ...cloudDiagnosticUpdate(payload.diagnostic),
      });
      throw new Error(payload.error ?? "Reader profile cloud save failed.");
    }

    const savedProfile = normalizeCloudReaderProfile(payload.profile);
    if (payload.cloudProfileSaveStatus === "stale-write-ignored") {
      updateCloudReaderProfileSync({
        profileId,
        ownerId: payload.ownerId ?? cloudReaderProfileSync.ownerId,
        source: authState.currentUser
          ? "authenticated cloud"
          : "auth-disabled fallback",
        status: "synced",
        lastSaveOutcome: "stale-write-ignored",
        lastSyncAt: new Date().toISOString(),
        lastError: "",
        localUpdatedAt: profile.updatedAt,
        cloudProfileExists: Boolean(savedProfile),
        ...(savedProfile ? { cloudUpdatedAt: savedProfile.updatedAt } : {}),
        localProfileExists: readerProfileExistsInLocalStorage(),
        ...cloudDiagnosticUpdate(payload.diagnostic),
      });
      return;
    }

    const cloudProfile = savedProfile ?? profile;
    updateCloudReaderProfileSync({
      profileId,
      ownerId: payload.ownerId ?? cloudReaderProfileSync.ownerId,
      source: authState.currentUser
        ? "authenticated cloud"
        : "auth-disabled fallback",
      status: "synced",
      lastSaveOutcome: "saved",
      lastSyncAt: new Date().toISOString(),
      lastError: "",
      localUpdatedAt: cloudProfile.updatedAt,
      cloudUpdatedAt: cloudProfile.updatedAt,
      cloudProfileExists: true,
      localProfileExists: readerProfileExistsInLocalStorage(),
      ...cloudDiagnosticUpdate(payload.diagnostic),
    });
  }

  async function deleteCloudReaderProfile(profileId: string) {
    try {
      const response = await fetch(
        `/api/reader-profile?profileId=${encodeURIComponent(profileId)}`,
        { method: "DELETE", headers: authHeaders() },
      );
      const payload = await response.json().catch(() => ({}));
      if (response.status === 503) {
        updateCloudReaderProfileSync({
          profileId,
          status: "unavailable",
          lastError:
            payload.error ?? "Reader profile cloud persistence is unavailable.",
          localUpdatedAt: "",
          cloudUpdatedAt: "",
          localProfileExists: false,
        });
        return;
      }
      if (!response.ok)
        throw new Error(payload.error ?? "Reader profile cloud delete failed.");
      updateCloudReaderProfileSync({
        profileId,
        status: "not found",
        lastSyncAt: new Date().toISOString(),
        lastError: "",
        localUpdatedAt: "",
        cloudUpdatedAt: "",
        localProfileExists: false,
      });
    } catch (caughtError) {
      updateCloudReaderProfileSync({
        profileId,
        status: "error",
        lastError: formatErrorMessage(caughtError),
        localUpdatedAt: "",
        localProfileExists: false,
      });
    }
  }

  function updateCloudReaderProfileSync(
    update: Partial<CloudReaderProfileSyncState>,
  ) {
    setCloudReaderProfileSync((current) => ({ ...current, ...update }));
  }

  function cloudDiagnosticUpdate(
    diagnostic: ReaderProfileApiDiagnostic | undefined,
  ): Partial<CloudReaderProfileSyncState> {
    if (!diagnostic) return {};
    return {
      lastApiPath: diagnostic.apiPath ?? "unknown",
      lastApiAction: diagnostic.action ?? "unknown",
      ownerId: diagnostic.resolvedOwnerId ?? cloudReaderProfileSync.ownerId,
      initializedDefaultCloudProfile: Boolean(
        diagnostic.initializedDefaultCloudProfile,
      ),
      lastSanitizedErrorName: diagnostic.sanitizedErrorName
        ? String(diagnostic.sanitizedErrorName)
        : "none",
      lastSanitizedErrorCode:
        diagnostic.sanitizedErrorCode === null ||
        diagnostic.sanitizedErrorCode === undefined
          ? "none"
          : String(diagnostic.sanitizedErrorCode),
    };
  }

  function handleLoadDemoStory() {
    if (hasRealLatestStory) return;
    cancelActiveGeneration();
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    const nextDemoStory = createDemoLatestStory();
    persistDemoLatestStory(nextDemoStory);
    recordReaderSignal({
      eventType: "demoStoryLoaded",
      source: "demo",
      storyId: nextDemoStory.id,
      title: nextDemoStory.title,
      genre: nextDemoStory.genrePreset,
      wordCount: nextDemoStory.wordCount,
    });
    recordReaderSignal({
      eventType: "storyOpened",
      source: "demo",
      storyId: nextDemoStory.id,
      title: nextDemoStory.title,
      genre: nextDemoStory.genrePreset,
      wordCount: nextDemoStory.wordCount,
    });
    setDemoStory(nextDemoStory);
    navigateHome({ preserveGeneration: true });
    setStatusMessage(
      "Demo story loaded for review. Your saved history was not changed.",
    );
  }

  function handleClearDemoStory() {
    cancelActiveGeneration();
    clearDemoLatestStory();
    setDemoStory(null);
    setStatusMessage("Demo story cleared. Your saved history was not changed.");
  }

  function buildCompactContinuationContext(
    storyToContinue: LibraryStory,
    storyId: string,
    selectedSeriesId: string | null,
    direction?: string,
  ): {
    seed: string;
    priorStoryWordCount: number;
    priorContextCharsSent: number;
  } {
    const storyText = storyToContinue.story.trim();
    const priorStoryWordCount =
      storyToContinue.wordCount || countWords(storyText);
    const sentences = extractSentences(storyText);
    const conciseRecap = truncateText(
      sentences.slice(0, 4).join(" ") || storyText,
      700,
    );
    const unresolvedPressure = truncateText(
      sentences.slice(-4, -1).join(" ") ||
        "Continue the unresolved emotional and plot pressure from the prior episode.",
      520,
    );
    const endingBeat = truncateText(sentences.at(-1) || storyText, 420);
    const finalEpisodeExcerpt = tailText(
      storyText,
      CONTINUATION_TAIL_MIN_CHARS,
      CONTINUATION_TAIL_MAX_CHARS,
    );
    const keyCharacters = storyToContinue.charactersUsed.length
      ? storyToContinue.charactersUsed.slice(0, 8).join(", ")
      : "Use the established characters from the prior episode.";
    const rawContext = [
      "Continue this series with Episode 2 / the next episode. Do not rewrite, restart, summarize, or retell Episode 1. Begin after the prior ending beat.",
      `Prior title: ${storyToContinue.title}.`,
      `Episode to continue: ${storyId}.`,
      selectedSeriesId
        ? `Series id: ${selectedSeriesId}.`
        : "Series id: use the current series identity from the request.",
      `Source story id: ${storyId}.`,
      `Key characters: ${keyCharacters}.`,
      `Concise recap: ${conciseRecap}`,
      `Unresolved pressure to carry forward: ${unresolvedPressure}`,
      `Last meaningful scene / ending beat: ${endingBeat}`,
      `Final excerpt from prior episode for voice and immediate continuity:\n${finalEpisodeExcerpt}`,
      direction?.trim()
        ? `Reader direction for the next episode: ${direction.trim()}`
        : "Continue directly from the strongest unresolved story pressure.",
    ].join("\n\n");
    const seed =
      rawContext.length <= CONTINUATION_CONTEXT_MAX_CHARS
        ? rawContext
        : `${rawContext.slice(0, CONTINUATION_CONTEXT_MAX_CHARS - 3).replace(/[\s,.;:]+$/, "")}...`;
    return { seed, priorStoryWordCount, priorContextCharsSent: seed.length };
  }

  function estimateContinuationRequestChars(parts: {
    worldBible: string;
    characterProfiles: string;
    storySeed: string;
    storyRules: string;
  }): number {
    return (
      parts.worldBible.length +
      parts.characterProfiles.length +
      parts.storySeed.length +
      parts.storyRules.length
    );
  }

  function tailText(value: string, minChars: number, maxChars: number): string {
    const normalized = value.trim();
    if (normalized.length <= maxChars) return normalized;
    const tail = normalized.slice(-maxChars);
    const sentenceStart = tail.search(/[.!?]\s+[A-Z0-9"“]/);
    const cleanTail =
      sentenceStart > -1 && tail.length - sentenceStart >= minChars
        ? tail.slice(sentenceStart + 1).trim()
        : tail.trim();
    return cleanTail || tail.trim();
  }

  function handleContinueStory(
    storyToContinue: LibraryStory | null | undefined,
    direction?: string,
  ) {
    const storyId = storyToContinue?.id?.trim() ?? "";
    const storyText = storyToContinue?.story?.trim() ?? "";

    if (!storyToContinue || !storyId || !storyText) {
      setLastGenerationTrigger("continueSeries");
      setLastRequestIncludedContinuationStoryId(Boolean(storyId));
      setLastContinuationContextIncluded(false);
      setLastContinuationBlockedBecauseContextMissing(true);
      setStatusMessage(
        "Open a saved story before continuing it. Continuation was not started because story context is missing.",
      );
      return;
    }

    recordReaderSignal({
      eventType: "storyContinued",
      source: "continueSeries",
      storyId,
      title: storyToContinue.title,
      genre: storyToContinue.genrePreset,
      wordCount: storyToContinue.wordCount,
    });
    const selectedSeriesId = getContinuationSeriesId(
      storyToContinue,
      storyId,
      storyResponse,
      activeCommittedStoryId,
      activeCommittedSeriesId,
    );
    const compactContinuationContext = buildCompactContinuationContext(
      storyToContinue,
      storyId,
      selectedSeriesId,
      direction,
    );
    const continuationSeed = compactContinuationContext.seed;
    const continuationDiagnostics: ContinuationGenerationDiagnostics = {
      generationMode: "continue_series",
      continuationStoryIdPresent: Boolean(storyId),
      selectedSeriesId,
      sourceStoryId: storyId,
      priorStoryWordCount: compactContinuationContext.priorStoryWordCount,
      priorContextCharsSent: compactContinuationContext.priorContextCharsSent,
      totalRequestPayloadApproxChars: estimateContinuationRequestChars({
        worldBible:
          worldBible.content.trim() ||
          `Existing story world inferred from ${storyToContinue.title}. Genre: ${storyToContinue.genrePreset}.`,
        characterProfiles:
          characterProfiles.content.trim() ||
          `Top cast: ${storyToContinue.charactersUsed.length ? storyToContinue.charactersUsed.join(", ") : "use the established characters from the prior chapter"}.`,
        storySeed: continuationSeed,
        storyRules: [
          storyRules.content,
          "Continuation rule: write only the next chapter after the prior chapter context; do not rewrite, restart, summarize, or retell the prior chapter.",
        ]
          .filter(Boolean)
          .join("\n\n"),
      }),
      lengthTarget,
    };
    void handleGenerate({
      generationMode: "continue_series",
      selectedSeriesId,
      sourceStoryId: storyId,
      worldBible:
        worldBible.content.trim() ||
        `Existing story world inferred from ${storyToContinue.title}. Genre: ${storyToContinue.genrePreset}.`,
      characterProfiles:
        characterProfiles.content.trim() ||
        `Top cast: ${storyToContinue.charactersUsed.length ? storyToContinue.charactersUsed.join(", ") : "use the established characters from the prior chapter"}.`,
      storySeed: continuationSeed,
      storyRules: [
        storyRules.content,
        "Continuation rule: write only the next chapter after the prior chapter context; do not rewrite, restart, summarize, or retell the prior chapter.",
      ]
        .filter(Boolean)
        .join("\n\n"),
      genrePreset: storyToContinue.genrePreset,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget,
      presentation: "continuation",
      loadingMessage: "Writing the next chapter…",
      signalSource: "continueSeries",
      generationSource: "continue-story",
      continuationStoryId: storyId,
      continuationContextIncluded: true,
      continuationDiagnostics,
    });
  }

  function handleContinueLatest(direction?: string) {
    handleContinueStory(currentGeneratedStory ?? latestStory, direction);
  }

  function handleContinueSavedStoryById(storyId: string) {
    const story = findLibraryStoryBySavedId(savedStories, storyId);
    if (!story) {
      setStatusMessage(
        "Could not continue that saved episode because it was not found.",
      );
      return;
    }

    const episode = findEpisodeInLibrarySeries(savedStories, story.id);
    setLastLibraryOpenedStoryId(story.id);
    setLastLibraryOpenedEpisodeNumber(episode?.episodeNumber ?? null);
    handleContinueStory(story);
  }

  async function handleSaveStory() {
    if (requireSignInForAppAction("saving to the library")) {
      setLibraryDiagnostics((current) => ({
        ...current,
        lastBlockedAction: "save while signed out",
      }));
      return;
    }
    if (!storyResponse) return;
    if (isFallbackGenerationResponse(storyResponse)) {
      setStatusMessage(CLEAN_GENERATION_FAILURE_MESSAGE);
      return;
    }
    try {
      await saveStoryToAuthenticatedLibrary(
        createSavedStory(
          storyResponse,
          currentStoryId || createStoryId(storyResponse.story),
        ),
      );
      setStatusMessage(
        authState.authConfigured
          ? "Story saved to your account Library."
          : "Story saved locally in this browser.",
      );
    } catch (caughtError) {
      setStatusMessage(formatCaughtError(caughtError));
    }
  }

  function handleRestoreStory(story: SavedStory) {
    if (requireSignInForAppAction("opening a saved story")) return;
    cancelActiveGeneration();
    setStoryResponse(savedStoryToResponse(story));
    setCurrentStoryId(story.id);
    setActiveCommittedStoryId(story.id);
    setActiveCommittedSeriesId(story.seriesId ?? story.id);
    setGeneratedStoryPresentation("saved-episode");
    clearDemoLatestStory();
    setDemoStory(null);
    recordReaderSignal({
      eventType: "storyOpened",
      storyId: story.id,
      title: story.title,
      genre: story.genrePreset,
      wordCount: story.wordCount,
    });
    navigateHome({ preserveGeneration: true });
    setStatusMessage(`Restored ${story.title}.`);
  }

  function handleRestoreStoryById(storyId: string) {
    const story = findLibraryStoryBySavedId(savedStories, storyId);
    if (!story) {
      setStatusMessage(
        "Could not open that saved episode because it was not found.",
      );
      return;
    }

    const episode = findEpisodeInLibrarySeries(savedStories, story.id);
    setLastLibraryOpenedStoryId(story.id);
    setLastLibraryOpenedEpisodeNumber(episode?.episodeNumber ?? null);
    handleRestoreStory(story);
  }

  async function handleDeleteStory(storyId: string) {
    const nextStories = savedStories.filter((story) => story.id !== storyId);
    if (!authState.authConfigured) persistSavedStories(nextStories);
    else if (authState.currentUser) {
      try {
        await fetchCloudJson(
          `/api/projects/${AUTHENTICATED_STORY_LIBRARY_PROJECT_ID}/stories/${encodeURIComponent(storyId)}`,
          { method: "DELETE", headers: authHeaders() },
        );
      } catch (caughtError) {
        setStatusMessage(`Delete failed: ${formatCaughtError(caughtError)}`);
        return;
      }
    } else {
      setLibraryDiagnostics((current) => ({
        ...current,
        lastBlockedAction: "delete while signed out",
      }));
      setStatusMessage(
        "Sign in is required to delete authenticated Library stories.",
      );
      return;
    }
    setSavedStories(nextStories);
    setLibraryDiagnostics((current) => ({
      ...current,
      loadedCount: nextStories.length,
    }));
    setStatusMessage("Saved story deleted.");
  }

  function handleOpenCurrentStory() {
    if (currentGeneratedStory)
      recordReaderSignal({
        eventType: "storyOpened",
        storyId: currentGeneratedStory.id,
        title: currentGeneratedStory.title,
        genre: currentGeneratedStory.genrePreset,
        wordCount: currentGeneratedStory.wordCount,
      });
    navigateHome({ preserveGeneration: true });
  }

  function handleExportLatestStory() {
    if (!latestStory) return;
    if (storyResponse && isFallbackGenerationResponse(storyResponse)) {
      setStatusMessage(CLEAN_GENERATION_FAILURE_MESSAGE);
      return;
    }
    recordReaderSignal({
      eventType: "storyExported",
      storyId: latestStory.id,
      title: latestStory.title,
      genre: latestStory.genrePreset,
      wordCount: latestStory.wordCount,
    });
    downloadTextFile(`${slugify(latestStory.title)}.txt`, latestStory.story);
  }

  function handleSaveProject() {
    if (requireSignInForAppAction("saving a project")) return;
    if (storyResponse && isFallbackGenerationResponse(storyResponse)) {
      setError(CLEAN_GENERATION_FAILURE_MESSAGE);
      return;
    }
    const trimmedName = projectName.trim();
    if (!trimmedName)
      return setError("Add a project name before saving this workspace.");
    const now = new Date().toISOString();
    const existing = savedProjects.find(
      (project) =>
        project.id === selectedProjectId ||
        project.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: {
        genrePreset,
        narrativeArchitecture,
        characterArc,
        endingType,
        lengthTarget,
      },
      latestStory: storyResponse,
      latestStoryFeedback: null,
    };
    const nextProjects = [
      savedProject,
      ...savedProjects.filter((project) => project.id !== savedProject.id),
    ];
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId(savedProject.id);
    setStatusMessage(`${savedProject.name} saved locally in this browser.`);
  }

  function handleLoadProject(projectId: string) {
    setSelectedProjectId(projectId);
    const project = savedProjects.find((item) => item.id === projectId);
    if (!project) return;
    applyProject(project);
    clearDemoLatestStory();
    setDemoStory(null);
    setStatusMessage(`${project.name} loaded from this browser.`);
  }

  function handleDeleteProject() {
    if (!selectedProjectId) return;
    const nextProjects = savedProjects.filter(
      (project) => project.id !== selectedProjectId,
    );
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId("");
    setStatusMessage("Project deleted from this browser.");
  }

  async function handleRefreshCloudProjects() {
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{
        projects?: CloudProjectSummary[];
      }>("/api/projects");
      setCloudProjects(Array.isArray(payload.projects) ? payload.projects : []);
      setCloudProjectMessage("");
    } catch (caughtError) {
      setCloudProjects([]);
      setCloudProjectMessage(
        `Cloud projects unavailable: ${formatCaughtError(caughtError)}`,
      );
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleSaveCloudProject() {
    if (requireSignInForAppAction("saving to cloud")) return;
    const trimmedName = projectName.trim();
    if (!trimmedName)
      return setError("Add a project name before saving to cloud projects.");
    const now = new Date().toISOString();
    const existing = cloudProjects.find(
      (project) =>
        project.id === selectedCloudProjectId ||
        project.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: {
        genrePreset,
        narrativeArchitecture,
        characterArc,
        endingType,
        lengthTarget,
      },
      latestStory: storyResponse,
      latestStoryFeedback: null,
    };
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>(
        "/api/projects",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: savedProject }),
        },
      );
      const cloudProject = payload.project ?? savedProject;
      setSelectedCloudProjectId(cloudProject.id);
      setCloudProjects((currentProjects) => [
        cloudProject,
        ...currentProjects.filter((project) => project.id !== cloudProject.id),
      ]);
      setCloudProjectMessage(`${cloudProject.name} saved to cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(
        `Cloud save failed: ${formatCaughtError(caughtError)} Local project save/load still works.`,
      );
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleLoadCloudProject(projectId: string) {
    setSelectedCloudProjectId(projectId);
    if (!projectId) return;
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>(
        `/api/projects/${encodeURIComponent(projectId)}`,
      );
      if (!payload.project)
        throw new Error("Cloud project response was missing a project.");
      applyProject(payload.project);
      clearDemoLatestStory();
      setDemoStory(null);
      setCloudProjectMessage(
        `${payload.project.name} loaded from cloud projects.`,
      );
    } catch (caughtError) {
      setCloudProjectMessage(
        `Cloud load failed: ${formatCaughtError(caughtError)} Local project save/load still works.`,
      );
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleDeleteCloudProject() {
    if (!selectedCloudProjectId) return;
    setIsCloudProjectsLoading(true);
    try {
      await fetchCloudJson(
        `/api/projects/${encodeURIComponent(selectedCloudProjectId)}`,
        { method: "DELETE" },
      );
      setCloudProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project.id !== selectedCloudProjectId,
        ),
      );
      setSelectedCloudProjectId("");
      setCloudProjectMessage("Cloud project deleted.");
    } catch (caughtError) {
      setCloudProjectMessage(
        `Cloud delete failed: ${formatCaughtError(caughtError)} Local project save/load still works.`,
      );
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  function applyProject(project: SavedProject) {
    setProjectName(project.name);
    setWorldBible(project.inputs.worldBible);
    setCharacterProfiles(project.inputs.characterProfiles);
    setStorySeed(project.inputs.storySeed);
    setStoryRules(project.inputs.storyRules);
    setGenrePreset(project.selections.genrePreset);
    setNarrativeArchitecture(project.selections.narrativeArchitecture);
    setCharacterArc(project.selections.characterArc);
    setEndingType(project.selections.endingType);
    setLengthTarget(project.selections.lengthTarget);
    setStoryResponse(project.latestStory);
    setCurrentStoryId(
      project.latestStory
        ? createStoryId(project.latestStory.story, project.updatedAt)
        : "",
    );
  }

  function handleSaveInputArtifact(
    type: InputArtifactType,
    value: UploadState,
  ) {
    if (!value.content.trim())
      return setError(
        `Add ${INPUT_LABELS[type]} content before saving it to the library.`,
      );
    const now = new Date().toISOString();
    const name =
      value.name.trim() || `${INPUT_LABELS[type]} ${formatLibraryVersion(now)}`;
    const artifact: InputArtifact = {
      id: createInputArtifactId(type, name, now),
      type,
      name,
      content: value.content,
      createdAt: now,
      updatedAt: now,
      characterCount: value.content.length,
    };
    const nextArtifacts = [artifact, ...inputArtifacts];
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    setUploadForType(type, {
      name: artifact.name,
      content: artifact.content,
      libraryArtifactId: artifact.id,
    });
    setStatusMessage(`${artifact.name} saved to the local library.`);
  }

  function handleSelectInputArtifact(
    type: InputArtifactType,
    artifactId: string,
  ) {
    const artifact = inputArtifacts.find(
      (item) => item.id === artifactId && item.type === type,
    );
    if (!artifact) return setUploadForType(type, { ...EMPTY_UPLOAD });
    setUploadForType(type, {
      name: artifact.name,
      content: artifact.content,
      libraryArtifactId: artifact.id,
    });
    setStatusMessage(`Loaded ${artifact.name} from the local library.`);
  }

  function setUploadForType(type: InputArtifactType, value: UploadState) {
    if (type === "worldBible") setWorldBible(value);
    else if (type === "characterProfiles") setCharacterProfiles(value);
    else if (type === "storySeed") setStorySeed(value);
    else setStoryRules(value);
  }

  function resetFeedbackDraftDiagnostics() {
    setFeedbackDraftHasUnsavedChanges(false);
    setFeedbackSaveBlockedBecauseRatingMissing(false);
    setGenerationBlockedBecauseUnsavedFeedback(false);
  }

  const handleFeedbackDraftStateChange = useCallback(
    (state: {
      hasUnsavedChanges: boolean;
      saveBlockedBecauseRatingMissing: boolean;
    }) => {
      setFeedbackDraftHasUnsavedChanges(state.hasUnsavedChanges);
      setFeedbackSaveBlockedBecauseRatingMissing(
        state.saveBlockedBecauseRatingMissing,
      );
      if (!state.hasUnsavedChanges)
        setGenerationBlockedBecauseUnsavedFeedback(false);
    },
    [],
  );

  function blockGenerationForUnsavedFeedback(): boolean {
    if (!feedbackDraftHasUnsavedChanges) return false;
    setGenerationBlockedBecauseUnsavedFeedback(true);
    setStatusMessage("Save feedback before starting another story.");
    return true;
  }

  function handleReaderContinue() {
    if (requireSignInForAppAction("continuing a series")) return;
    if (blockGenerationForUnsavedFeedback()) return;
    setReaderScrollDiagnostics((current) => ({
      ...current,
      nextEpisodeClicked: "yes",
      continuationLoaded: "pending",
      scrollResetAttempted: "pending",
      scrollTargetUsed: "pending",
    }));
    handleContinueLatest();
  }

  function handleSavedEpisodeNext() {
    if (requireSignInForAppAction("continuing a saved episode")) return;
    const currentId = currentStoryId.trim();
    if (!currentId) {
      handleReaderContinue();
      return;
    }

    const nextSavedEpisode = findNextSavedEpisodeInSeries(
      savedStories,
      currentId,
    );
    if (nextSavedEpisode) {
      setReaderScrollDiagnostics((current) => ({
        ...current,
        nextEpisodeClicked: "yes",
        continuationLoaded: "yes",
        scrollResetAttempted: "pending",
        scrollTargetUsed: "pending",
      }));
      handleRestoreStoryById(nextSavedEpisode.storyId);
      setStatusMessage(`Opened Episode ${nextSavedEpisode.episodeNumber}.`);
      return;
    }

    handleReaderContinue();
  }

  function handleReaderStartDifferent() {
    if (blockGenerationForUnsavedFeedback()) return;
    handleStartSomethingDifferent();
  }

  function handleStoryFeedbackChange(
    story: LibraryStory,
    rating: StoryFeedbackRating,
    reasons: StoryFeedbackReason[],
  ) {
    if (requireSignInForAppAction("saving story feedback")) return;
    if (!story.id) return;
    const now = new Date().toISOString();
    const existingSignal = readerProfile.storyFeedbackSignals?.find(
      (signal) => signal.storyId === story.id,
    );
    const signal: StoryFeedbackSignal = {
      storyId: story.id,
      storyTitle: story.title,
      rating,
      score: STORY_FEEDBACK_SCORE_BY_RATING[rating],
      reasons,
      generationMode: readStoryFeedbackGenerationMode(
        generatedStoryPresentation,
      ),
      createdAt: existingSignal?.createdAt || now,
      updatedAt: now,
    };
    const nextProfile = saveStoryFeedbackSignal(
      signal,
      readerProfile,
      !authState.authConfigured,
    );
    setReaderProfile(nextProfile);

    const feedbackEvent = {
      id: createFeedbackEventId(),
      storyId: story.id ?? null,
      storyTitle: story.title ?? null,
      rating,
      reasons,
      note: null,
      createdAt: signal.createdAt,
      storyMetadata: {
        genres: [story.genrePreset],
        tones: story.genrePreset ? [story.genrePreset] : [],
        format:
          generatedStoryPresentation === "continuation" ? "episode" : "story",
        durationMinutes: Math.max(1, Math.round((story.wordCount || 0) / 180)),
      },
    };
    const currentCanonicalProfile = authState.currentUser
      ? canonicalReaderProfileFromReaderProfile(
          readerProfile,
          authState.currentUser.id,
          "cloud",
        )
      : loadCanonicalReaderProfile();
    const savedForLaterCount = Math.max(
      currentCanonicalProfile.signals.savedForLaterCount ?? 0,
      nextProfile.readyStoryQueueSignals?.filter(
        (item) => item.signal === "save_for_later",
      ).length ?? 0,
    );
    const nextCanonicalProfileDraft = applyFeedbackToReaderProfile(
      {
        ...currentCanonicalProfile,
        signals: { ...currentCanonicalProfile.signals, savedForLaterCount },
      },
      feedbackEvent,
    );
    const nextCanonicalProfile = authState.currentUser
      ? { ...nextCanonicalProfileDraft, source: "cloud" as const }
      : saveCanonicalReaderProfile(nextCanonicalProfileDraft);
    setCanonicalReaderProfile(nextCanonicalProfile);

    void syncReaderProfileToCloud(nextProfile);
    setGenerationBlockedBecauseUnsavedFeedback(false);
    setStatusMessage("Feedback saved to reader profile.");
  }

  function recordReaderSignal(event: ReaderProfileEventInput) {
    if (requireSignInForAppAction("updating reader signals")) return;
    const nextProfile = recordReaderProfileEvent(
      event,
      readerProfile,
      !authState.authConfigured,
    );
    setReaderProfile(nextProfile);
    void syncReaderProfileToCloud(nextProfile);
  }

  function handleReaderPreferencesChange(
    nextPreferences: ReaderProfile["explicitReaderPreferences"],
  ) {
    setReaderPreferencesSaveStatus("saving");
    try {
      const savedProfile = saveReaderProfilePreferences(
        { ...nextPreferences, updatedAt: new Date().toISOString() },
        readerProfile,
      );
      setReaderProfile(savedProfile);
      const baseCanonicalProfile =
        canonicalReaderProfile ?? loadCanonicalReaderProfile();
      const nextCanonicalProfile = saveCanonicalReaderProfile({
        ...baseCanonicalProfile,
        updatedAt: savedProfile.updatedAt,
        preferences: {
          ...baseCanonicalProfile.preferences,
          hardAvoidances: savedProfile.explicitReaderPreferences.hardAvoidances,
          explicitReaderPreferences: savedProfile.explicitReaderPreferences,
        },
      });
      setCanonicalReaderProfile(nextCanonicalProfile);
      setReaderPreferencesSaveStatus("saved");
      void syncReaderProfileToCloud(savedProfile);
    } catch {
      setReaderPreferencesSaveStatus("error");
    }
  }

  function handleClearStoryFitPreferences() {
    handleReaderPreferencesChange({
      ...DEFAULT_READER_PROFILE_PREFERENCES,
      updatedAt: new Date().toISOString(),
    });
    setStatusMessage("Story Fit Preferences cleared.");
  }

  function handleOpenStoryFitOnboarding() {
    const openedAt = new Date().toISOString();
    saveStoryFitOnboardingTimestamp(
      STORY_FIT_ONBOARDING_LAST_OPENED_KEY,
      openedAt,
    );
    setStoryFitOnboardingLastOpenedAt(openedAt);
    setIsStoryFitOnboardingOpen(true);
  }

  function handleSkipStoryFitOnboarding() {
    saveStoryFitOnboardingDismissed();
    setStoryFitOnboardingDismissed(true);
    setIsStoryFitOnboardingOpen(false);
    setStatusMessage(
      "Story fit setup skipped. You can start it later from Account / Profile.",
    );
  }

  function handleSaveStoryFitOnboarding(
    nextPreferences: ReaderProfile["explicitReaderPreferences"],
  ) {
    handleReaderPreferencesChange(nextPreferences);
    const savedAt = new Date().toISOString();
    saveStoryFitOnboardingDismissed();
    saveStoryFitOnboardingTimestamp(
      STORY_FIT_ONBOARDING_LAST_SAVED_KEY,
      savedAt,
    );
    setStoryFitOnboardingDismissed(true);
    setStoryFitOnboardingLastSavedAt(savedAt);
    setIsStoryFitOnboardingOpen(false);
    setStatusMessage("Story Fit Preferences saved.");
  }

  function handleClearLocalReaderMemory() {
    const now = new Date().toISOString();
    const preservedPreferences = {
      ...readerProfile.explicitReaderPreferences,
      updatedAt: readerProfile.explicitReaderPreferences.updatedAt ?? now,
    };
    const emptyProfile = {
      ...clearReaderProfile(),
      explicitReaderPreferences: preservedPreferences,
      updatedAt: now,
    };
    persistReaderProfile(emptyProfile);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(CANONICAL_READER_PROFILE_STORAGE_KEY);
      } catch {}
    }
    const defaultCanonicalProfile = loadCanonicalReaderProfile();
    const resetCanonicalProfile = saveCanonicalReaderProfile({
      ...defaultCanonicalProfile,
      updatedAt: now,
      preferences: {
        ...defaultCanonicalProfile.preferences,
        hardAvoidances: preservedPreferences.hardAvoidances,
        explicitReaderPreferences: preservedPreferences,
      },
    });
    setReaderProfile(emptyProfile);
    setCanonicalReaderProfile(resetCanonicalProfile);
    setReaderPreferencesSaveStatus("saved");
    void syncReaderProfileToCloud(emptyProfile);
    setStatusMessage("Local reader memory and profile signals cleared.");
  }

  function handleStartSomethingDifferent() {
    if (currentGeneratedStory) {
      recordReaderSignal({
        eventType: "startSomethingDifferentClicked",
        source: "startSomethingNew",
        storyId: currentGeneratedStory.id,
        title: currentGeneratedStory.title,
        genre: currentGeneratedStory.genrePreset,
        wordCount: currentGeneratedStory.wordCount,
      });
    } else {
      recordReaderSignal({
        eventType: "startSomethingDifferentClicked",
        source: "startSomethingNew",
      });
    }
    navigateHome();
    setStatusMessage("Choose what kind of story should find you next.");
  }

  function clearCurrentInputs() {
    cancelActiveGeneration();
    setWorldBible({ ...EMPTY_UPLOAD });
    setCharacterProfiles({ ...EMPTY_UPLOAD });
    setStorySeed({ ...EMPTY_UPLOAD });
    setStoryRules({ ...EMPTY_UPLOAD });
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    setStatusMessage(
      "Current inputs cleared. Saved library items were not changed.",
    );
  }

  const currentStoryFeedback = currentStoryId
    ? (readerProfile.storyFeedbackSignals?.find(
        (signal) => signal.storyId === currentStoryId,
      ) ?? null)
    : null;
  const isNewStoryGenerating = isGenerating && generationSource === "new-story";
  const isContinuationGenerating =
    isGenerating && generationSource === "continue-story";

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsBloodwickSignInModalDismissed(
      window.sessionStorage.getItem(
        BLOODWICK_FIRST_OPEN_SIGN_IN_DISMISSED_KEY,
      ) === "true",
    );
  }, []);

  useEffect(() => {
    if (authState.currentUser?.email) {
      setModalSignInEmail(authState.currentUser.email);
    } else if (authState.resetEmail) {
      setModalSignInEmail(authState.resetEmail);
    }
  }, [authState.currentUser?.email, authState.resetEmail]);

  useEffect(() => {
    if (authState.currentUser) {
      setModalSignInPassword("");
      setIsModalSignInSubmitting(false);
    }
  }, [authState.currentUser]);

  const handleContinueAsGuestFromModal = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        BLOODWICK_FIRST_OPEN_SIGN_IN_DISMISSED_KEY,
        "true",
      );
    }
    setIsBloodwickSignInModalDismissed(true);
  }, []);

  const handleModalSignIn = useCallback(async () => {
    setIsModalSignInSubmitting(true);
    await authState.signIn(modalSignInEmail, modalSignInPassword);
    setIsModalSignInSubmitting(false);
  }, [authState, modalSignInEmail, modalSignInPassword]);

  const handleModalPasswordReset = useCallback(async () => {
    setIsModalSignInSubmitting(true);
    await authState.beginPasswordReset(modalSignInEmail || authState.resetEmail);
    setIsModalSignInSubmitting(false);
  }, [authState, modalSignInEmail]);

  const shouldShowBloodwickSignInModal =
    activeView === "home" &&
    authState.authConfigured &&
    authState.authSessionChecked &&
    !authState.currentUser &&
    !isBloodwickSignInModalDismissed;

  const diagnosticsPanels = (
    <>
      <AppStateDiagnostics
        accountSummary={accountProfileSummary}
        activeView={activeView}
        activeCommittedSeriesId={activeCommittedSeriesId}
        activeCommittedStoryId={activeCommittedStoryId}
        currentEpisodeNumber={currentSeriesEpisode?.episodeNumber ?? null}
        currentStoryFeedback={currentStoryFeedback}
        currentStoryId={currentStoryId}
        feedbackDraftHasUnsavedChanges={feedbackDraftHasUnsavedChanges}
        feedbackSaveBlockedBecauseRatingMissing={
          feedbackSaveBlockedBecauseRatingMissing
        }
        generationBlockedBecauseUnsavedFeedback={
          generationBlockedBecauseUnsavedFeedback
        }
        generationSource={generationSource}
        isGenerating={isGenerating}
        lastContinuationBlockedBecauseContextMissing={
          lastContinuationBlockedBecauseContextMissing
        }
        lastContinuationContextIncluded={lastContinuationContextIncluded}
        lastGenerationCancelledOrAborted={lastGenerationCancelledOrAborted}
        lastGenerationFailureDiagnostic={lastGenerationFailureDiagnostic}
        lastGenerationTrigger={lastGenerationTrigger}
        lastLibraryOpenedEpisodeNumber={lastLibraryOpenedEpisodeNumber}
        lastLibraryOpenedStoryId={lastLibraryOpenedStoryId}
        lastNewStoryPersonalization={lastNewStoryPersonalization}
        lastReadyStoryPreparationOutcome={lastReadyStoryPreparationOutcome}
        lastReadyStoryPreparationStatus={readyStoryPreparationStatus}
        lastReadyStoryQueueAction={lastReadyStoryQueueAction}
        lastRequestIncludedContinuationStoryId={
          lastRequestIncludedContinuationStoryId
        }
        pendingGenerationMode={pendingGenerationMode}
        readerScrollDiagnostics={readerScrollDiagnostics}
        profile={readerProfile}
        readyStoryQueue={readyStoryQueue}
        savedForLaterStoryQueue={savedForLaterStoryQueue}
        storyResponseEpisodeMomentum={
          storyResponse?.metadata.diagnostics.episodeMomentum ?? null
        }
        storyTypeSelectionDiagnostics={storyTypeSelectionDiagnostics}
        storyFitOnboardingAvailable={
          shouldShowFirstRunStoryFitPrompt || isStoryFitOnboardingOpen
        }
        storyFitOnboardingDismissed={storyFitOnboardingDismissed}
        storyFitOnboardingCompleted={hasReaderProfilePreferences(
          readerProfile.explicitReaderPreferences,
        )}
        storyFitOnboardingLastOpenedAt={storyFitOnboardingLastOpenedAt}
        storyFitOnboardingLastSavedAt={storyFitOnboardingLastSavedAt}
        cloudSync={cloudReaderProfileSync}
        accountProfileActionDiagnostics={accountProfileActionDiagnostics}
      />
      <ReaderProfileDiagnostics
        canonicalProfile={canonicalReaderProfile}
        cloudSync={cloudReaderProfileSync}
        lastGenerationUsedCanonicalProfile={Boolean(
          canonicalReaderProfile?.signals.lastGenerationUsedCanonicalProfile ||
          lastNewStoryPersonalization.responseSnapshot
            ?.canonicalReaderProfileUsed,
        )}
        onClear={handleClearReaderProfile}
        profile={readerProfile}
      />
      <EerieReaderProfileDiagnostics
        profile={eerieReaderProfile}
        onClear={handleClearEerieReaderProfile}
      />
      <AuthDiagnostics
        appActionsGated={authState.appActionsGated}
        authConfigured={authState.authConfigured}
        authFlow={authState.authFlow}
        authMode={authState.authMode}
        authStatus={authState.authStatus}
        cognitoUserId={authState.currentUser?.id ?? ""}
        currentUserEmail={authState.currentUser?.email ?? ""}
        lastAuthStep={authState.lastAuthStep}
        lastCognitoErrorCode={authState.lastCognitoErrorCode}
        libraryDiagnostics={libraryDiagnostics}
        profileLibraryMode={authState.profileLibraryMode}
        region={authState.region}
        resetFlowState={authState.resetFlowState}
      />
    </>
  );

  return (
    <main className="min-h-screen overflow-x-hidden px-3 pb-6 pt-3 text-paper sm:px-4 md:px-8 md:py-7">
      <section className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 md:gap-6">
        <MobileTopHeader
          activeView={activeView}
          onGoHome={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("lantern:reset-mobile-home-gate"),
              );
            }
            navigateHome();
          }}
          onNavigate={navigateToView}
        />
        <header className="hidden min-w-0 flex-col gap-5 border-b border-paper/10 pb-6 md:flex md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="bloodwick-kicker">Bloodwick</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-paper md:text-5xl">
              Scary stories that know what haunts you.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-paper/70">
              Start a series. Return whenever you want. Bloodwick keeps the dread alive.
            </p>
          </div>
          <div className="flex min-w-0 flex-col items-stretch gap-2 md:items-end">
            <NavTabs activeView={activeView} onChange={navigateToView} />
          </div>
        </header>

        <BloodwickSignInModal
          email={modalSignInEmail}
          errorMessage={authState.errorMessage || null}
          isOpen={shouldShowBloodwickSignInModal}
          isSubmitting={isModalSignInSubmitting}
          onContinueAsGuest={handleContinueAsGuestFromModal}
          onEmailChange={setModalSignInEmail}
          onPasswordChange={setModalSignInPassword}
          onResetPassword={handleModalPasswordReset}
          onSubmit={handleModalSignIn}
          password={modalSignInPassword}
        />
        {activeView === "account" ? <AuthShell /> : null}
        {statusMessage ? <Status tone="info">{statusMessage}</Status> : null}
        {isGenerating ? (
          <StopGenerationControl onStop={handleStopGeneration} />
        ) : null}
        {error ? <Status tone="error">{error}</Status> : null}
        {isStoryFitOnboardingOpen ? (
          <StoryFitOnboardingPanel
            initialPreferences={readerProfile.explicitReaderPreferences}
            onCancel={() => setIsStoryFitOnboardingOpen(false)}
            onSave={handleSaveStoryFitOnboarding}
          />
        ) : null}

        {activeView === "mood-intake" ? (
          <MoodIntakeView
            onCancel={handleMoodIntakeCancel}
            onSubmit={handleMoodIntakeSubmit}
            pendingStoryTitle={pendingStoryStart?.title ?? null}
          />
        ) : null}
        {activeView === "home" ? (
          <HomeView
            activeMood={activeMood}
            canUseDemoStory={!hasRealLatestStory}
            hasDemoStory={Boolean(demoStory)}
            isGenerating={isGenerating}
            isContinuationGenerating={isContinuationGenerating}
            isNewStoryGenerating={isNewStoryGenerating}
            latestStory={latestStory}
            onClearDemoStory={handleClearDemoStory}
            onContinue={handleContinueLatest}
            onExportStory={handleExportLatestStory}
            onLoadDemoStory={handleLoadDemoStory}
            onMoodSelect={handleMoodSelect}
            onOpenLibrary={() => navigateToView("library")}
            onStartNewStory={handleStartSomethingNew}
            onStartRecommendation={handleStartRecommendation}
            selectedFearCategory={selectedHomeFearCategory}
            showStoryStartOptions={isStoryStartSelectionOpen}
            readyStoryQueue={readyStoryQueue}
            savedForLaterStoryQueue={savedForLaterStoryQueue}
            onPassReadyStory={handlePassReadyStory}
            onReadReadyStory={handleReadReadyStory}
            onSaveReadyStoryForLater={handleSaveReadyStoryForLater}
            suggestedStarts={suggestedStarts}
            showStoryFitPrompt={shouldShowFirstRunStoryFitPrompt}
            onStartStoryFitSetup={handleOpenStoryFitOnboarding}
            onSkipStoryFitSetup={handleSkipStoryFitOnboarding}
          />
        ) : null}
        {activeView === "home" &&
        currentGeneratedStory &&
        generatedStoryPresentation ? (
          <EpisodeReader
            feedback={currentStoryFeedback}
            generationBlockedBecauseUnsavedFeedback={
              generationBlockedBecauseUnsavedFeedback
            }
            isGenerating={isContinuationGenerating}
            onContinue={
              generatedStoryPresentation === "saved-episode"
                ? handleSavedEpisodeNext
                : handleReaderContinue
            }
            onExport={handleExportLatestStory}
            onFeedbackChange={handleStoryFeedbackChange}
            onFeedbackDraftStateChange={handleFeedbackDraftStateChange}
            onScrollResetDiagnostics={setReaderScrollDiagnostics}
            onStartDifferent={handleReaderStartDifferent}
            eyebrow={
              generatedStoryPresentation === "first-episode"
                ? "New Story"
                : generatedStoryPresentation === "saved-episode"
                  ? "Saved Episode"
                  : "Next Episode"
            }
            continueLabel={
              generatedStoryPresentation === "saved-episode"
                ? "Next Episode"
                : "Continue this story"
            }
            episodeNumber={currentSeriesEpisode?.episodeNumber ?? null}
            generationProfileSnapshot={
              storyResponse?.metadata.diagnostics.readerProfileSnapshot ??
              storyResponse?.metadata.diagnostics
                .readerProfileGenerationSnapshot
            }
            story={currentGeneratedStory}
          />
        ) : null}
        {activeView === "home" ? (
          <>
            <MobileDeveloperDiagnostics>
              {diagnosticsPanels}
            </MobileDeveloperDiagnostics>
            <div className="hidden min-w-0 gap-3 md:grid">
              <DesktopDeveloperDiagnostics>
                {diagnosticsPanels}
              </DesktopDeveloperDiagnostics>
            </div>
          </>
        ) : null}
        {activeView === "library" ? (
          <LibraryView
            cloudMessage={cloudProjectMessage}
            cloudProjects={cloudProjects}
            isCloudLoading={isCloudProjectsLoading}
            onDeleteCloudProject={handleDeleteCloudProject}
            onDeleteProject={handleDeleteProject}
            onDeleteStory={handleDeleteStory}
            onLoadCloudProject={handleLoadCloudProject}
            onLoadProject={handleLoadProject}
            onMoveSavedForLaterToWaitingQueue={
              handleMoveSavedForLaterStoryToWaitingQueue
            }
            onContinueSavedStoryById={handleContinueSavedStoryById}
            onOpenSavedStoryById={handleRestoreStoryById}
            onProjectNameChange={setProjectName}
            onReadSavedForLater={handleReadSavedForLaterStory}
            onRefreshCloud={handleRefreshCloudProjects}
            onRemoveSavedForLater={handleRemoveSavedForLaterStory}
            onSaveCloudProject={handleSaveCloudProject}
            onSaveProject={handleSaveProject}
            onSaveStory={handleSaveStory}
            projectName={projectName}
            savedForLaterStoryQueue={savedForLaterStoryQueue}
            savedProjects={savedProjects}
            savedStories={savedStories}
            selectedCloudProjectId={selectedCloudProjectId}
            selectedProjectId={selectedProjectId}
            storyResponse={storyResponse}
          />
        ) : null}
        {activeView === "worlds" ? (
          <WorldsView onOpenStory={handleStartRecommendation} />
        ) : null}
        {activeView === "create" ? (
          <CreateView
            canGenerate={canGenerate}
            characterArc={characterArc}
            characterProfiles={characterProfiles}
            endingType={endingType}
            genrePreset={genrePreset}
            inputArtifacts={inputArtifacts}
            isGenerating={isGenerating}
            lengthTarget={lengthTarget}
            narrativeArchitecture={narrativeArchitecture}
            onChangeCharacterArc={setCharacterArc}
            onChangeCharacterProfiles={setCharacterProfiles}
            onChangeEndingType={setEndingType}
            onChangeGenre={setGenrePreset}
            onChangeLengthTarget={setLengthTarget}
            onChangeNarrative={setNarrativeArchitecture}
            onChangeStoryRules={setStoryRules}
            onChangeStorySeed={setStorySeed}
            onChangeWorld={setWorldBible}
            onClear={clearCurrentInputs}
            onGenerate={handleCreateGenerateClick}
            onSaveInputArtifact={handleSaveInputArtifact}
            onSelectInputArtifact={handleSelectInputArtifact}
            storyRules={storyRules}
            storySeed={storySeed}
            worldBible={worldBible}
          />
        ) : null}
        {activeView === "characters" ? (
          <CharactersView onOpenStory={handleStartRecommendation} />
        ) : null}
        {activeView === "account" ? (
          <AccountView
            authState={authState}
            canonicalProfile={canonicalReaderProfile}
            inputArtifacts={inputArtifacts}
            onClearLocalReaderMemory={handleClearLocalReaderMemory}
            cloudReaderProfileSync={cloudReaderProfileSync}
            accountProfileActionDiagnostics={accountProfileActionDiagnostics}
            onRefreshAccountProfile={handleRefreshAccountProfile}
            onSaveAccountProfile={handleSaveAccountProfile}
            onClearStoryFitPreferences={handleClearStoryFitPreferences}
            onOpenLibrary={() => navigateToView("library")}
            onReaderPreferencesChange={handleReaderPreferencesChange}
            readerPreferences={readerProfile.explicitReaderPreferences}
            readerProfile={readerProfile}
            savedForLaterStoryQueue={savedForLaterStoryQueue}
            savedStories={savedStories}
            saveStatus={readerPreferencesSaveStatus}
            summary={accountProfileSummary}
            onOpenStoryFitOnboarding={handleOpenStoryFitOnboarding}
          />
        ) : null}
        {activeView !== "home" ? (
          <MobileDeveloperDiagnostics>
            {diagnosticsPanels}
          </MobileDeveloperDiagnostics>
        ) : null}
      </section>
      <MobileBackToTopButton />
    </main>
  );
}

function AuthShell() {
  const auth = useAuth();
  const [email, setEmail] = useState(
    auth.currentUser?.email ?? auth.resetEmail,
  );
  const [password, setPassword] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMismatch, setPasswordMismatch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    await auth.signIn(email, password);
    setPassword("");
    setIsSubmitting(false);
  }

  async function handleRequestReset(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setIsSubmitting(true);
    await auth.beginPasswordReset(email || auth.resetEmail);
    setIsSubmitting(false);
  }

  async function handleConfirmReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMismatch("New passwords do not match.");
      return;
    }
    setPasswordMismatch("");
    setIsSubmitting(true);
    await auth.confirmPasswordReset(resetCode, newPassword);
    setResetCode("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  async function handleCompleteNewPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMismatch("New passwords do not match.");
      return;
    }
    setPasswordMismatch("");
    setIsSubmitting(true);
    await auth.completeNewPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  const showResetForm =
    auth.authStatus === "resetting_password" ||
    auth.authStatus === "reset_code_sent";

  return (
    <section
      className="grid gap-3 rounded-xl border border-lantern-gold/20 bg-paper/5 p-4 text-sm text-paper/75 md:max-w-xl"
      aria-label="Reader account"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lantern-gold">
          Reader account
        </p>
        <p className="mt-1 text-paper/65">
          Sign in with an approved email and password. Story generation and
          personalization require sign-in when Cognito is configured.
        </p>
      </div>

      {!auth.authConfigured ? (
        <Status tone="info">
          Auth is not configured. Add NEXT_PUBLIC_COGNITO_USER_POOL_ID,
          NEXT_PUBLIC_COGNITO_APP_CLIENT_ID, and NEXT_PUBLIC_COGNITO_REGION to
          enable Cognito email/password sign-in.
        </Status>
      ) : auth.authStatus === "signed_in" && auth.currentUser ? (
        <div className="grid gap-3">
          <p>
            <span className="font-semibold text-paper">Signed in:</span>{" "}
            {auth.currentUser.email}
          </p>
          <button
            className="min-h-11 w-full rounded-xl border border-paper/15 bg-paper/10 px-4 py-2 font-semibold text-paper md:w-fit"
            onClick={auth.signOut}
            type="button"
          >
            Sign out
          </button>
        </div>
      ) : auth.authStatus === "new_password_required" ? (
        <form className="grid gap-3" onSubmit={handleCompleteNewPassword}>
          <p className="text-paper/70">
            Set a new password for {auth.emailPendingVerification || email} to
            finish signing in.
          </p>
          <PasswordFields
            confirmPassword={confirmPassword}
            newPassword={newPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onNewPasswordChange={setNewPassword}
          />
          {passwordMismatch ? (
            <Status tone="error">{passwordMismatch}</Status>
          ) : null}
          <button
            className="min-h-12 rounded-xl bg-lantern-gold px-4 py-3 font-semibold text-night-ink disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Saving…" : "Set password"}
          </button>
        </form>
      ) : showResetForm ? (
        <form
          className="grid gap-3"
          onSubmit={
            auth.authStatus === "reset_code_sent"
              ? handleConfirmReset
              : handleRequestReset
          }
        >
          <label className="grid gap-1">
            <span className="font-semibold text-paper/80">Approved email</span>
            <input
              className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
              type="email"
              autoComplete="email"
              value={email || auth.resetEmail}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          {auth.authStatus === "reset_code_sent" ? (
            <>
              <label className="grid gap-1">
                <span className="font-semibold text-paper/80">Reset code</span>
                <input
                  className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value)}
                  placeholder="Enter email recovery code"
                  required
                />
              </label>
              <PasswordFields
                confirmPassword={confirmPassword}
                newPassword={newPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onNewPasswordChange={setNewPassword}
              />
              {passwordMismatch ? (
                <Status tone="error">{passwordMismatch}</Status>
              ) : null}
            </>
          ) : null}
          <button
            className="min-h-12 rounded-xl bg-lantern-gold px-4 py-3 font-semibold text-night-ink disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Working…"
              : auth.authStatus === "reset_code_sent"
                ? "Confirm new password"
                : "Send password reset code"}
          </button>
        </form>
      ) : (
        <form className="grid gap-3" onSubmit={handleSignIn}>
          <label className="grid gap-1">
            <span className="font-semibold text-paper/80">Email</span>
            <input
              className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="grid gap-1">
            <span className="font-semibold text-paper/80">Password</span>
            <input
              className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              required
            />
          </label>
          <button
            className="min-h-12 rounded-xl bg-lantern-gold px-4 py-3 font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting || !password.trim()}
            type="submit"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
          {!password.trim() ? (
            <p className="text-xs text-paper/55">Enter your password.</p>
          ) : null}
          <button
            className="text-left text-xs font-semibold text-lantern-gold"
            onClick={() => void handleRequestReset()}
            type="button"
          >
            Set or reset password
          </button>
        </form>
      )}
      {auth.successMessage ? (
        <Status tone="success">{auth.successMessage}</Status>
      ) : null}
      {auth.errorMessage ? (
        <Status tone="error">{auth.errorMessage}</Status>
      ) : null}
    </section>
  );
}

function PasswordFields({
  confirmPassword,
  newPassword,
  onConfirmPasswordChange,
  onNewPasswordChange,
}: {
  confirmPassword: string;
  newPassword: string;
  onConfirmPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
}) {
  return (
    <>
      <label className="grid gap-1">
        <span className="font-semibold text-paper/80">New password</span>
        <input
          className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => onNewPasswordChange(event.target.value)}
          placeholder="New password"
          required
        />
      </label>
      <label className="grid gap-1">
        <span className="font-semibold text-paper/80">
          Confirm new password
        </span>
        <input
          className="min-h-12 rounded-xl border border-paper/15 bg-night-ink/80 px-3 text-base text-paper outline-none focus:border-lantern-gold"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          placeholder="Confirm new password"
          required
        />
      </label>
    </>
  );
}

function AuthDiagnostics({
  appActionsGated,
  authConfigured,
  authFlow,
  authMode,
  authStatus,
  cognitoUserId,
  currentUserEmail,
  lastAuthStep,
  lastCognitoErrorCode,
  libraryDiagnostics,
  profileLibraryMode,
  region,
  resetFlowState,
}: {
  appActionsGated: boolean;
  authConfigured: boolean;
  authFlow: "USER_PASSWORD_AUTH";
  authMode: "email_password";
  authStatus: AuthStatus;
  cognitoUserId: string;
  currentUserEmail: string;
  lastAuthStep: string;
  lastCognitoErrorCode: string;
  libraryDiagnostics: LibraryDiagnosticsState;
  profileLibraryMode: "anonymous" | "authenticated";
  region: string;
  resetFlowState: string;
}) {
  return (
    <details className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">
        Auth diagnostics
      </summary>
      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-paper/80">Auth configured:</span>{" "}
          {authConfigured ? "true" : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Auth status:</span>{" "}
          {authStatus}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Auth mode:</span>{" "}
          {authMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Auth flow used:</span>{" "}
          {authFlow}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last Cognito auth step:
          </span>{" "}
          {lastAuthStep}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last Cognito error code:
          </span>{" "}
          {lastCognitoErrorCode || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Reset flow state:</span>{" "}
          {resetFlowState}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            App actions gated:
          </span>{" "}
          {appActionsGated ? "yes - sign-in required" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Current user email:
          </span>{" "}
          {currentUserEmail || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Cognito user id/sub:
          </span>{" "}
          {cognitoUserId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Cognito region:</span>{" "}
          {region}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Profile/library mode:
          </span>{" "}
          {profileLibraryMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Active Library owner id:
          </span>{" "}
          {cognitoUserId ||
            (authConfigured ? "none" : "auth-disabled fallback")}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Library source:</span>{" "}
          {libraryDiagnostics.source}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Stories loaded for current user:
          </span>{" "}
          {libraryDiagnostics.loadedCount}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Latest save owner id:
          </span>{" "}
          {libraryDiagnostics.latestSaveOwnerId}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last blocked Library action:
          </span>{" "}
          {libraryDiagnostics.lastBlockedAction}
        </p>
      </div>
    </details>
  );
}

function StopGenerationControl({ onStop }: { onStop: () => void }) {
  return (
    <div className="rounded-md border border-red-300/30 bg-red-950/30 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-paper">
          Story generation is running.
        </p>
        <button
          className="w-fit rounded-md border border-red-300/60 bg-red-300 px-4 py-2 text-sm font-semibold text-red-950 transition hover:bg-red-200"
          onClick={onStop}
          type="button"
        >
          Stop generating
        </button>
      </div>
    </div>
  );
}

function EpisodeReader({
  continueLabel = "Continue this story",
  episodeNumber,
  eyebrow,
  feedback,
  generationBlockedBecauseUnsavedFeedback,
  generationProfileSnapshot,
  isGenerating,
  onContinue,
  onExport,
  onFeedbackChange,
  onFeedbackDraftStateChange,
  onScrollResetDiagnostics,
  onStartDifferent,
  story,
}: {
  continueLabel?: string;
  episodeNumber?: number | null;
  eyebrow: string;
  feedback: StoryFeedbackSignal | null;
  generationBlockedBecauseUnsavedFeedback: boolean;
  generationProfileSnapshot?: ReaderProfileGenerationSnapshot;
  isGenerating: boolean;
  onContinue: () => void;
  onExport: () => void;
  onFeedbackChange: (
    story: LibraryStory,
    rating: StoryFeedbackRating,
    reasons: StoryFeedbackReason[],
  ) => void;
  onFeedbackDraftStateChange: (state: {
    hasUnsavedChanges: boolean;
    saveBlockedBecauseRatingMissing: boolean;
  }) => void;
  onScrollResetDiagnostics: (
    diagnostics:
      | ReaderScrollDiagnostics
      | ((current: ReaderScrollDiagnostics) => ReaderScrollDiagnostics),
  ) => void;
  onStartDifferent: () => void;
  story: LibraryStory;
}) {
  const readerTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let animationFrame = 0;
    animationFrame = window.requestAnimationFrame(() => {
      const targets: string[] = [];
      readerTopRef.current?.scrollIntoView({ block: "start" });
      if (readerTopRef.current) targets.push("reader-top");

      const readerContainer = readerTopRef.current?.closest<HTMLElement>(
        '[data-reader-scroll-container="true"]',
      );
      if (readerContainer) {
        readerContainer.scrollTop = 0;
        targets.push("reader-container");
      }

      window.scrollTo({ top: 0 });
      targets.push("window");
      onScrollResetDiagnostics((current) => ({
        ...current,
        continuationLoaded:
          current.continuationLoaded === "pending"
            ? "yes"
            : current.continuationLoaded,
        scrollResetAttempted: "yes",
        scrollTargetUsed: targets.join("+") || "none",
      }));
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [onScrollResetDiagnostics, story.id]);

  return (
    <article
      className="grid min-w-0 gap-5 rounded-md border border-lantern-gold/25 bg-paper/10 p-4 shadow-soft sm:p-6"
      data-reader-scroll-container="true"
    >
      <div ref={readerTopRef} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">
          {episodeNumber ? `${eyebrow} · Episode ${episodeNumber}` : eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-paper md:text-5xl">
          {story.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-paper/60">
          {story.wordCount.toLocaleString()} words |{" "}
          {getLibraryStoryCategoryLabel(story)}
        </p>
      </div>
      <div className="min-w-0 whitespace-pre-wrap rounded-md border border-paper/10 bg-night-ink/70 p-4 text-base leading-8 text-paper/85 sm:p-5">
        {story.story}
      </div>
      {generationProfileSnapshot ? (
        <GenerationProfileSnapshotPanel snapshot={generationProfileSnapshot} />
      ) : null}
      {story.id ? (
        <StoryFeedbackPanel
          feedback={feedback}
          generationBlockedBecauseUnsavedFeedback={
            generationBlockedBecauseUnsavedFeedback
          }
          onDraftStateChange={onFeedbackDraftStateChange}
          onSave={(rating, reasons) => onFeedbackChange(story, rating, reasons)}
          storyId={story.id}
        />
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          className="inline-flex items-center gap-2 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isGenerating}
          onClick={onContinue}
          type="button"
        >
          {isGenerating ? (
            <>
              <span
                className="size-4 animate-spin rounded-full border-2 border-night-ink/30 border-t-night-ink"
                aria-hidden="true"
              />
              Writing the next chapter…
            </>
          ) : (
            continueLabel
          )}
        </button>
        <button
          className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-bloodwick-copper"
          onClick={onExport}
          type="button"
        >
          Export
        </button>
        <button
          className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-bloodwick-copper"
          onClick={onStartDifferent}
          type="button"
        >
          Start something different
        </button>
      </div>
    </article>
  );
}

function GenerationProfileSnapshotPanel({
  snapshot,
}: {
  snapshot: ReaderProfileGenerationSnapshot;
}) {
  const rows = [
    ["Mode", snapshot.mode],
    ["Profile used", snapshot.profileUsed ? "yes" : "no"],
    ["Profile source", snapshot.profileSourceUsed],
    ["Profile updatedAt", snapshot.profileUpdatedAt || "none"],
    ["Taste profile present", snapshot.tasteProfilePresent ? "yes" : "no"],
    ["Taste profile source", snapshot.tasteProfileSource || "none"],
    ["Taste profile updatedAt", snapshot.tasteProfileUpdatedAt || "none"],
    ["Feedback signal count", String(snapshot.feedbackSignalCount)],
    ["Feedback included", snapshot.feedbackIncluded ? "yes" : "no"],
    ["Latest feedback rating", snapshot.latestFeedbackRating || "none"],
    ["User hard avoidances", snapshot.userHardAvoidancesSummary || "none"],
    [
      "Default safety guardrails",
      snapshot.defaultSafetyGuardrailsSummary || "none",
    ],
    ["Mood signal", snapshot.moodSignal || "none"],
    ["Genre signal", snapshot.genreSignal || "none"],
    ["Snapshot created", snapshot.generatedAt || "none"],
  ];

  return (
    <details className="rounded-md border border-paper/10 bg-night-ink/50 p-4 text-sm text-paper/70">
      <summary className="cursor-pointer font-semibold text-paper">
        Generation profile snapshot
      </summary>
      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
              {label}
            </dt>
            <dd className="mt-1 break-words text-paper/80">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function StoryFeedbackPanel({
  feedback,
  generationBlockedBecauseUnsavedFeedback,
  onDraftStateChange,
  onSave,
  storyId,
}: {
  feedback: StoryFeedbackSignal | null;
  generationBlockedBecauseUnsavedFeedback: boolean;
  onDraftStateChange: (state: {
    hasUnsavedChanges: boolean;
    saveBlockedBecauseRatingMissing: boolean;
  }) => void;
  onSave: (rating: StoryFeedbackRating, reasons: StoryFeedbackReason[]) => void;
  storyId: string;
}) {
  const [draftRating, setDraftRating] = useState<StoryFeedbackRating | null>(
    feedback?.rating ?? null,
  );
  const [draftReasons, setDraftReasons] = useState<StoryFeedbackReason[]>(
    feedback?.reasons ?? [],
  );
  const [draftClearedAfterSave, setDraftClearedAfterSave] = useState(false);
  const [clearedFeedbackStoryId, setClearedFeedbackStoryId] = useState<
    string | null
  >(null);
  const [inlineMessage, setInlineMessage] = useState<string>(
    feedback ? "Feedback saved to reader profile." : "",
  );

  useEffect(() => {
    if (feedback?.storyId && feedback.storyId === clearedFeedbackStoryId) {
      setDraftRating(null);
      setDraftReasons([]);
      setDraftClearedAfterSave(true);
      setInlineMessage("Feedback saved to reader profile.");
      return;
    }

    setDraftRating(feedback?.rating ?? null);
    setDraftReasons(feedback?.reasons ?? []);
    setDraftClearedAfterSave(false);
    setClearedFeedbackStoryId(null);
    setInlineMessage(feedback ? "Feedback saved to reader profile." : "");
  }, [clearedFeedbackStoryId, feedback?.storyId]);

  const hasUnsavedChanges =
    draftClearedAfterSave && !draftRating && draftReasons.length === 0
      ? false
      : !areFeedbackDraftsEqual(draftRating, draftReasons, feedback);
  const saveBlockedBecauseRatingMissing = !draftRating;

  useEffect(() => {
    onDraftStateChange({ hasUnsavedChanges, saveBlockedBecauseRatingMissing });
  }, [hasUnsavedChanges, onDraftStateChange, saveBlockedBecauseRatingMissing]);

  function toggleReason(reason: StoryFeedbackReason) {
    setDraftClearedAfterSave(false);
    setClearedFeedbackStoryId(null);
    setDraftReasons((currentReasons) => {
      if (currentReasons.includes(reason))
        return currentReasons.filter(
          (selectedReason) => selectedReason !== reason,
        );
      const mutuallyExclusiveReason =
        getMutuallyExclusiveFeedbackReason(reason);
      return [
        ...currentReasons.filter(
          (selectedReason) => selectedReason !== mutuallyExclusiveReason,
        ),
        reason,
      ];
    });
  }

  function saveFeedback() {
    if (!draftRating) {
      setInlineMessage("Choose a rating before saving feedback.");
      return;
    }
    onSave(draftRating, draftReasons);
    setDraftRating(null);
    setDraftReasons([]);
    setDraftClearedAfterSave(true);
    setClearedFeedbackStoryId(storyId);
    setInlineMessage("Feedback saved to reader profile.");
  }

  return (
    <section className="grid gap-3 rounded-md border border-paper/10 bg-night-ink/50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-paper">
          How was this story?
        </h3>
        <p className="mt-1 text-xs leading-5 text-paper/55">
          Your rating updates future recommendations and new-story
          personalization.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STORY_FEEDBACK_RATING_OPTIONS.map((option) => (
          <button
            aria-pressed={draftRating === option.rating}
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${draftRating === option.rating ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper hover:border-bloodwick-copper"}`}
            key={option.rating}
            onClick={() => {
              setDraftClearedAfterSave(false);
              setClearedFeedbackStoryId(null);
              setDraftRating(option.rating);
            }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/50">
          Optional reasons
        </p>
        <div className="flex flex-wrap gap-2">
          {STORY_FEEDBACK_REASON_OPTIONS.map((option) => {
            const isSelected = draftReasons.includes(option.reason);
            return (
              <button
                aria-pressed={isSelected}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isSelected ? "border-lantern-gold bg-lantern-gold/90 text-night-ink" : "border-paper/15 bg-paper/10 text-paper/80 hover:border-bloodwick-copper"}`}
                key={option.reason}
                onClick={() => toggleReason(option.reason)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          className="w-fit rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink"
          onClick={saveFeedback}
          type="button"
        >
          Save feedback
        </button>
        <p
          className={`text-sm font-semibold ${inlineMessage === "Choose a rating before saving feedback." ? "text-lantern-gold" : hasUnsavedChanges ? "text-lantern-gold" : feedback ? "text-paper/70" : "text-paper/50"}`}
        >
          {inlineMessage ||
            (hasUnsavedChanges
              ? "Unsaved feedback"
              : feedback
                ? "Feedback saved"
                : "Select a rating to save feedback.")}
        </p>
      </div>
      {generationBlockedBecauseUnsavedFeedback && hasUnsavedChanges ? (
        <p className="text-sm font-semibold text-lantern-gold">
          Save feedback before starting another story.
        </p>
      ) : null}
    </section>
  );
}

function HomePrimaryActions({
  hasLatestStory,
  isGenerating,
  isNewStoryGenerating,
  onContinueLatest,
  onOpenLibrary,
  onStartNewStory,
}: {
  hasLatestStory: boolean;
  isGenerating: boolean;
  isNewStoryGenerating: boolean;
  onContinueLatest: () => void;
  onOpenLibrary: () => void;
  onStartNewStory: () => void;
}) {
  return (
    <section className="grid min-w-0 max-w-full gap-3 rounded-xl border border-paper/10 bg-paper/10 p-4 md:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lantern-gold">
        Home
      </p>
      <h1 className="break-words text-2xl font-semibold leading-tight text-paper md:text-3xl">
        What do you want to do?
      </h1>

      <button
        className="min-h-12 w-full rounded-xl bg-lantern-gold px-4 py-3 text-base font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
        disabled={isGenerating}
        onClick={onStartNewStory}
        type="button"
      >
        {isNewStoryGenerating ? "Writing…" : "Start Something New"}
      </button>

      {hasLatestStory ? (
        <button
          className="min-h-12 w-full rounded-xl border border-paper/15 bg-paper/10 px-4 py-3 text-base font-semibold text-paper disabled:cursor-not-allowed disabled:opacity-60 md:w-fit"
          disabled={isGenerating}
          onClick={onContinueLatest}
          type="button"
        >
          Continue Latest Episode
        </button>
      ) : null}

      <button
        className="min-h-12 w-full rounded-xl border border-paper/15 bg-paper/10 px-4 py-3 text-base font-semibold text-paper md:w-fit"
        onClick={onOpenLibrary}
        type="button"
      >
        Stories
      </button>
    </section>
  );
}

function MobileDeveloperDiagnostics({ children }: { children: ReactNode }) {
  return (
    <details className="mt-4 min-w-0 max-w-full overflow-hidden rounded-xl border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65 md:hidden">
      <summary className="cursor-pointer font-semibold text-paper/75">
        Developer diagnostics
      </summary>
      <div className="mt-3 grid min-w-0 gap-3 overflow-auto">{children}</div>
    </details>
  );
}

function HomeView(props: {
  showStoryFitPrompt?: boolean;
  onStartStoryFitSetup?: () => void;
  onSkipStoryFitSetup?: () => void;
  activeMood: Mood;
  canUseDemoStory: boolean;
  hasDemoStory: boolean;
  isGenerating: boolean;
  isContinuationGenerating: boolean;
  isNewStoryGenerating: boolean;
  latestStory: LibraryStory | null;
  onClearDemoStory: () => void;
  onContinue: (direction?: string) => void;
  onExportStory: () => void;
  onLoadDemoStory: () => void;
  onMoodSelect: (mood: Mood) => void;
  onPassReadyStory: (item: ReadyStoryQueueItem) => void;
  onReadReadyStory: (item: ReadyStoryQueueItem) => void;
  onSaveReadyStoryForLater: (item: ReadyStoryQueueItem) => void;
  onOpenLibrary: () => void;
  onStartNewStory: () => void;
  onStartRecommendation: (story: StoryStart) => void;
  readyStoryQueue: ReadyStoryQueueItem[];
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  selectedFearCategory: Mood | null;
  showStoryStartOptions: boolean;
  suggestedStarts: StoryStart[];
}) {
  const {
    activeMood,
    canUseDemoStory,
    hasDemoStory,
    isGenerating,
    isContinuationGenerating,
    isNewStoryGenerating,
    latestStory,
    onClearDemoStory,
    onContinue,
    onExportStory,
    onLoadDemoStory,
    onMoodSelect,
    onOpenLibrary,
    onPassReadyStory,
    onReadReadyStory,
    onSaveReadyStoryForLater,
    onStartNewStory,
    onStartRecommendation,
    readyStoryQueue,
    savedForLaterStoryQueue,
    selectedFearCategory,
    showStoryStartOptions,
    suggestedStarts,
  } = props;
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const storyBrief = latestStory ? createStoryBrief(latestStory) : null;
  void HOME_DASHBOARD_COLUMNS;

  const latestStoryTypeLabel = getHomeFearLabel(
    latestStory
      ? [
          latestStory.selectedStoryTypeChipId,
          latestStory.selectedStoryTypeChipLabel,
          latestStory.genrePreset,
          latestStory.title,
          storyBrief?.hook,
          latestStory.story,
        ]
          .filter(Boolean)
          .join(" ")
      : null,
  );
  const latestSeriesTitle = latestStory
    ? getLibraryStorySeriesTitle(latestStory)
    : "Series Title";

  return (
    <div className="bloodwick-home grid min-w-0 max-w-full gap-6 overflow-x-hidden md:gap-8">
      <BloodwickHomeHero />
      <div className="grid min-w-0 items-stretch gap-4 md:grid-cols-2" data-home-dashboard="reader-actions">
        <div className="grid min-w-0 gap-4">
          <FearMoodGrid
            activeMood={selectedFearCategory}
            isGenerating={isGenerating}
            isNewStoryGenerating={isNewStoryGenerating}
            onRead={onStartNewStory}
            onSelect={onMoodSelect}
          />
          {showStoryStartOptions ? (
            <SuggestedStoryStarts
              activeMood={activeMood}
              canUseDemoStory={false}
              hasDemoStory={hasDemoStory}
              onClearDemoStory={onClearDemoStory}
              onLoadDemoStory={onLoadDemoStory}
              stories={suggestedStarts}
              onStart={onStartRecommendation}
            />
          ) : null}
        </div>
        <div className="min-w-0">
          {latestStory && storyBrief ? (
            <ContinueEpisodeCard
              hook={storyBrief.hook}
              isGenerating={isContinuationGenerating}
              isRecapOpen={isRecapOpen}
              onCloseRecap={() => setIsRecapOpen(false)}
              onContinue={onContinue}
              onExport={onExportStory}
              onOpenRecap={() => setIsRecapOpen(true)}
              recap={storyBrief.recap}
              seriesTitle={latestSeriesTitle}
              storyTypeLabel={latestStoryTypeLabel}
              title={latestStory.title}
            />
          ) : (
            <section className="bloodwick-home-card bloodwick-continue-card flex h-full min-w-0 flex-col justify-between rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/70 p-5 shadow-bloodwick-soft">
              <div>
                <h2 className="text-2xl font-semibold leading-tight text-bloodwick-white">
                  <span className="text-bloodwick-copper">Continue:</span>{" "}
                  <span>No series in progress yet.</span>
                </h2>
                <p className="mt-3 text-sm leading-6 text-bloodwick-white/68">
                  Start something new to begin your first Bloodwick series.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>
      <ReadyStoryQueuePanel
        items={readyStoryQueue}
        onPass={onPassReadyStory}
        onRead={onReadReadyStory}
        onSaveForLater={onSaveReadyStoryForLater}
      />
    </div>
  );
}

function getLibraryStorySeriesTitle(story: LibraryStory): string {
  const candidate = story as LibraryStory & {
    heroName?: string | null;
    protagonistName?: string | null;
    seriesTitle?: string | null;
    metadata?: { seriesTitle?: string | null; heroName?: string | null; protagonistName?: string | null };
  };

  return getBloodwickSeriesDisplayTitle({
    explicitTitle: candidate.seriesTitle ?? candidate.metadata?.seriesTitle ?? null,
    savedSeriesTitle: candidate.seriesTitle ?? candidate.metadata?.seriesTitle ?? null,
    firstEpisodeTitle: story.title,
    episodeTitle: story.title,
    protagonistName: candidate.protagonistName ?? candidate.heroName ?? candidate.metadata?.protagonistName ?? candidate.metadata?.heroName ?? story.charactersUsed?.[0] ?? null,
    fearCategory: getLibraryStoryCategoryLabel(story),
  });
}

function DesktopDeveloperDiagnostics({ children }: { children: ReactNode }) {
  return (
    <details className="min-w-0 max-w-full overflow-hidden rounded-xl border border-paper/10 bg-paper/5 p-4 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">
        Developer diagnostics
      </summary>
      <div className="mt-3 grid min-w-0 gap-3 overflow-auto">{children}</div>
    </details>
  );
}

function StoryFitFirstRunCard({
  onSkip,
  onStart,
}: {
  onSkip: () => void;
  onStart: () => void;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-lantern-gold/35 bg-lantern-gold/10 p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">
        Story fit
      </p>
      <h2 className="mt-1 text-xl font-semibold text-paper">
        Set up your story fit
      </h2>
      <p className="mt-2 text-sm leading-6 text-paper/70">
        Answer a few questions so Bloodwick can shape better episodes for you.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className="min-h-11 rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-night-ink"
          onClick={onStart}
          type="button"
        >
          Start setup
        </button>
        <button
          className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-3 text-sm font-semibold text-paper/75"
          onClick={onSkip}
          type="button"
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}

const CONTENT_LANE_OPTIONS = [
  { label: "Not set", value: "not-set" },
  { label: "Middle grade / family-safe", value: "middle-grade" },
  { label: "Teen / YA", value: "teen" },
  { label: "Adult", value: "adult" },
];
const HARD_AVOIDANCE_QUICK_ADD_OPTIONS = [
  "No dead pets",
  "No gore",
  "No harm to children",
  "No body horror",
  "No spiders",
  "No hopeless endings",
];

function StoryFitOnboardingPanel({
  initialPreferences,
  onCancel,
  onSave,
}: {
  initialPreferences: ReaderProfile["explicitReaderPreferences"];
  onCancel: () => void;
  onSave: (preferences: ReaderProfile["explicitReaderPreferences"]) => void;
}) {
  const [step, setStep] = useState<StoryFitOnboardingStep>(0);
  const [avoidanceDraft, setAvoidanceDraft] = useState("");
  const [limitMessage, setLimitMessage] = useState("");
  const [state, setState] = useState<StoryFitOnboardingState>({
    emotionalPromises:
      initialPreferences.emotionalPromises?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.emotionalPromises,
      ) ?? [],
    favoriteStoryWorlds:
      initialPreferences.favoriteStoryWorlds?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.favoriteStoryWorlds,
      ) ?? [],
    storyIngredients: initialPreferences.storyIngredients.slice(
      0,
      STORY_FIT_SELECTION_LIMITS.storyIngredients,
    ),
    characterLensPreferences:
      initialPreferences.characterLensPreferences?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.characterLensPreferences,
      ) ?? [],
    narrativePressurePreferences:
      initialPreferences.narrativePressurePreferences?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences,
      ) ?? [],
    episodeEndingShapePreferences:
      initialPreferences.episodeEndingShapePreferences?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences,
      ) ?? [],
    protagonistLensPreferences:
      initialPreferences.protagonistLensPreferences?.slice(
        0,
        STORY_FIT_SELECTION_LIMITS.characterLensPreferences,
      ) ?? [],
    contentLane: initialPreferences.contentLane,
    hardAvoidances: initialPreferences.hardAvoidances.slice(
      0,
      STORY_FIT_SELECTION_LIMITS.hardAvoidances,
    ),
    preferredStoryTypes: initialPreferences.preferredStoryTypes.slice(
      0,
      STORY_FIT_SELECTION_LIMITS.preferredStoryTypes,
    ),
  });
  const steps = [
    "Story types / fear flavors",
    "What should the story give you?",
    "Storyworlds / places I want to live inside",
    "Story ingredients",
    "Character lens",
    "Narrative pressure / intensity",
    "Episode ending shape",
    "Hard avoidances",
    "Review",
  ];
  const selectedContentLaneLabel =
    CONTENT_LANE_OPTIONS.find((option) => option.value === state.contentLane)
      ?.label ?? "Not set";
  const countVisibleSelections = (
    values: string[],
    options: { label: string }[],
  ) =>
    values.filter((value) => options.some((option) => option.label === value))
      .length;
  const avoidanceDraftValue = avoidanceDraft.trim().replace(/\s+/g, " ");
  const avoidanceDraftIsDuplicate =
    Boolean(avoidanceDraftValue) &&
    state.hardAvoidances.some(
      (item) => item.toLowerCase() === avoidanceDraftValue.toLowerCase(),
    );
  const hardAvoidancesAtCap =
    state.hardAvoidances.length >= STORY_FIT_SELECTION_LIMITS.hardAvoidances;
  const canAddAvoidance =
    Boolean(avoidanceDraftValue) &&
    !avoidanceDraftIsDuplicate &&
    !hardAvoidancesAtCap;
  const toggleLimitedItem = (
    field: keyof Pick<
      StoryFitOnboardingState,
      | "preferredStoryTypes"
      | "emotionalPromises"
      | "favoriteStoryWorlds"
      | "storyIngredients"
      | "characterLensPreferences"
      | "narrativePressurePreferences"
      | "episodeEndingShapePreferences"
      | "protagonistLensPreferences"
    >,
    value: string,
    max: number,
    label: string,
    options: { label: string }[],
  ) => {
    setState((current) => {
      const currentValues = current[field];
      if (currentValues.includes(value)) {
        setLimitMessage("");
        return {
          ...current,
          [field]: currentValues.filter((item) => item !== value),
        };
      }
      if (countVisibleSelections(currentValues, options) >= max) {
        setLimitMessage(`${label} is limited to ${max} selections.`);
        return current;
      }
      setLimitMessage("");
      return { ...current, [field]: [...currentValues, value] };
    });
  };
  const fillAvoidanceDraft = (value: string) => {
    setAvoidanceDraft(value);
    setLimitMessage("");
  };
  const addAvoidance = () => {
    if (!avoidanceDraftValue) return;
    if (avoidanceDraftIsDuplicate) {
      setLimitMessage("That hard avoidance is already added.");
      return;
    }
    if (hardAvoidancesAtCap) {
      setLimitMessage(
        `Hard avoidances are limited to ${STORY_FIT_SELECTION_LIMITS.hardAvoidances} selections.`,
      );
      return;
    }
    const next = addUniquePreferenceItem(
      state.hardAvoidances,
      avoidanceDraftValue,
      STORY_FIT_SELECTION_LIMITS.hardAvoidances,
    );
    setState((current) => ({ ...current, hardAvoidances: next }));
    setAvoidanceDraft("");
    setLimitMessage("");
  };
  const goNext = () => {
    setLimitMessage("");
    setStep(
      (current) =>
        Math.min(current + 1, steps.length - 1) as StoryFitOnboardingStep,
    );
  };
  const goBack = () => {
    setLimitMessage("");
    setStep((current) => Math.max(current - 1, 0) as StoryFitOnboardingStep);
  };
  const save = () =>
    onSave({
      ...initialPreferences,
      preferredStoryTypes: state.preferredStoryTypes,
      emotionalPromises: state.emotionalPromises,
      favoriteStoryWorlds: state.favoriteStoryWorlds,
      storyIngredients: state.storyIngredients,
      characterLensPreferences: state.characterLensPreferences,
      narrativePressurePreferences: state.narrativePressurePreferences,
      episodeEndingShapePreferences: state.episodeEndingShapePreferences,
      protagonistLensPreferences: state.protagonistLensPreferences,
      hardAvoidances: state.hardAvoidances,
      contentLane: state.contentLane,
      narrativePressure:
        STORY_FIT_PRESSURE_TO_LEGACY[state.narrativePressurePreferences[0]] ??
        "not-set",
      episodeEndingShape:
        STORY_FIT_ENDING_TO_LEGACY[state.episodeEndingShapePreferences[0]] ??
        "not-set",
      protagonistLens:
        STORY_FIT_CHARACTER_LENS_TO_LEGACY[
          state.protagonistLensPreferences[0]
        ] ?? "not-set",
      storyFitProfileVersion: READER_PROFILE_PREFERENCES_VERSION,
      updatedAt: new Date().toISOString(),
    });

  return (
    <section className="mx-auto grid w-full max-w-3xl min-w-0 gap-4 overflow-x-hidden rounded-xl border border-lantern-gold/35 bg-night-ink/95 p-4 pb-24 shadow-soft sm:pb-4">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">
            Story Fit Setup
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-paper">
            {steps[step]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-paper/65">
            Tell Bloodwick what kinds of stories you want to live inside. You
            can change this later.
          </p>
        </div>
        <button
          className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper/70"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
      <p className="text-xs font-semibold text-paper/45">
        Step {step + 1} of {steps.length}
      </p>
      {step === 0 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.preferredStoryTypes, STORY_FIT_STORY_TYPE_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.preferredStoryTypes} selected`}
          question="Story types / fear flavors"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.preferredStoryTypes}.`}
          options={STORY_FIT_STORY_TYPE_OPTIONS}
          selected={state.preferredStoryTypes}
          onSelect={(value) =>
            toggleLimitedItem(
              "preferredStoryTypes",
              value,
              STORY_FIT_SELECTION_LIMITS.preferredStoryTypes,
              "Story types",
              STORY_FIT_STORY_TYPE_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 1 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.emotionalPromises, STORY_FIT_EMOTIONAL_PROMISE_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.emotionalPromises} selected`}
          question="What should the story give you?"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.emotionalPromises}.`}
          options={STORY_FIT_EMOTIONAL_PROMISE_OPTIONS}
          selected={state.emotionalPromises}
          onSelect={(value) =>
            toggleLimitedItem(
              "emotionalPromises",
              value,
              STORY_FIT_SELECTION_LIMITS.emotionalPromises,
              "What should the story give you",
              STORY_FIT_EMOTIONAL_PROMISE_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 2 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.favoriteStoryWorlds, STORY_FIT_WORLD_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.favoriteStoryWorlds} selected`}
          question="Storyworlds / places I want to live inside"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.favoriteStoryWorlds}.`}
          options={STORY_FIT_WORLD_OPTIONS}
          selected={state.favoriteStoryWorlds}
          onSelect={(value) =>
            toggleLimitedItem(
              "favoriteStoryWorlds",
              value,
              STORY_FIT_SELECTION_LIMITS.favoriteStoryWorlds,
              "Storyworlds",
              STORY_FIT_WORLD_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 3 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.storyIngredients, STORY_FIT_INGREDIENT_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.storyIngredients} selected`}
          question="Story ingredients"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.storyIngredients}.`}
          options={STORY_FIT_INGREDIENT_OPTIONS}
          selected={state.storyIngredients}
          onSelect={(value) =>
            toggleLimitedItem(
              "storyIngredients",
              value,
              STORY_FIT_SELECTION_LIMITS.storyIngredients,
              "Story ingredients",
              STORY_FIT_INGREDIENT_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 4 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.characterLensPreferences, STORY_FIT_CHARACTER_LENS_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.characterLensPreferences} selected`}
          question="Character lens"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.characterLensPreferences}.`}
          options={STORY_FIT_CHARACTER_LENS_OPTIONS}
          selected={state.characterLensPreferences}
          onSelect={(value) => {
            toggleLimitedItem(
              "characterLensPreferences",
              value,
              STORY_FIT_SELECTION_LIMITS.characterLensPreferences,
              "Character lens",
              STORY_FIT_CHARACTER_LENS_OPTIONS,
            );
            toggleLimitedItem(
              "protagonistLensPreferences",
              value,
              STORY_FIT_SELECTION_LIMITS.characterLensPreferences,
              "Character lens",
              STORY_FIT_CHARACTER_LENS_OPTIONS,
            );
          }}
        />
      ) : null}
      {step === 5 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.narrativePressurePreferences, STORY_FIT_NARRATIVE_PRESSURE_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences} selected`}
          question="Narrative pressure / intensity"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences}.`}
          options={STORY_FIT_NARRATIVE_PRESSURE_OPTIONS}
          selected={state.narrativePressurePreferences}
          onSelect={(value) =>
            toggleLimitedItem(
              "narrativePressurePreferences",
              value,
              STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences,
              "Narrative pressure / intensity",
              STORY_FIT_NARRATIVE_PRESSURE_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 6 ? (
        <OnboardingChoiceGrid
          countLabel={`${countVisibleSelections(state.episodeEndingShapePreferences, STORY_FIT_EPISODE_ENDING_OPTIONS)} / ${STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences} selected`}
          question="Episode ending shape"
          helper={`Choose up to ${STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences}.`}
          options={STORY_FIT_EPISODE_ENDING_OPTIONS}
          selected={state.episodeEndingShapePreferences}
          onSelect={(value) =>
            toggleLimitedItem(
              "episodeEndingShapePreferences",
              value,
              STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences,
              "Episode ending shape",
              STORY_FIT_EPISODE_ENDING_OPTIONS,
            )
          }
        />
      ) : null}
      {step === 7 ? (
        <div className="grid gap-3">
          <h3 className="text-lg font-semibold text-paper">Hard avoidances</h3>
          <p className="text-sm leading-6 text-paper/60">
            Add anything Bloodwick should avoid. You can add up to{" "}
            {STORY_FIT_SELECTION_LIMITS.hardAvoidances}.
          </p>
          <p className="text-xs font-semibold text-paper/45">
            {state.hardAvoidances.length} /{" "}
            {STORY_FIT_SELECTION_LIMITS.hardAvoidances} added
          </p>
          <div className="grid gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
              Starter suggestions
            </p>
            <div className="flex flex-wrap gap-2">
              {HARD_AVOIDANCE_QUICK_ADD_OPTIONS.map((item) => (
                <button
                  className="min-h-11 rounded-full border border-paper/15 bg-paper/10 px-3 py-1.5 text-xs font-semibold text-paper/75"
                  key={item}
                  onClick={() => fillAvoidanceDraft(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="min-h-11 min-w-0 flex-1 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper outline-none focus:border-lantern-gold"
              maxLength={MAX_READER_HARD_AVOIDANCE_LENGTH}
              onChange={(event) => {
                setAvoidanceDraft(event.target.value);
                if (limitMessage) setLimitMessage("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addAvoidance();
                }
              }}
              placeholder="No dead pets, no gore..."
              value={avoidanceDraft}
            />
            <button
              className="min-h-11 rounded-md border border-lantern-gold/40 bg-lantern-gold/10 px-4 py-2 text-sm font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canAddAvoidance}
              onClick={addAvoidance}
              type="button"
            >
              Add
            </button>
          </div>
          {avoidanceDraftIsDuplicate ? (
            <p className="text-xs font-semibold text-lantern-gold">
              That hard avoidance is already added.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {state.hardAvoidances.map((item) => (
              <button
                className="min-h-11 rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-1 text-xs font-semibold text-lantern-gold"
                key={item}
                onClick={() =>
                  setState((current) => ({
                    ...current,
                    hardAvoidances: current.hardAvoidances.filter(
                      (value) => value !== item,
                    ),
                  }))
                }
                type="button"
              >
                {item} ×
              </button>
            ))}
          </div>
          <p className="text-xs text-paper/45">
            Custom entries can be up to {MAX_READER_HARD_AVOIDANCE_LENGTH}{" "}
            characters each.
          </p>
        </div>
      ) : null}
      {step === 8 ? (
        <div className="grid gap-3">
          <h3 className="text-lg font-semibold text-paper">Review</h3>
          <ProfileSummaryRow
            label="Story types"
            values={state.preferredStoryTypes}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="What the story should give you"
            values={state.emotionalPromises}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Storyworlds / places"
            values={state.favoriteStoryWorlds}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Story ingredients"
            values={state.storyIngredients}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Character lens"
            values={state.characterLensPreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Narrative pressure / intensity"
            values={state.narrativePressurePreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Episode ending shape"
            values={state.episodeEndingShapePreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Hard avoidances"
            values={state.hardAvoidances}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Content lane"
            values={
              state.contentLane === "not-set" ? [] : [selectedContentLaneLabel]
            }
            empty="Not set"
          />
        </div>
      ) : null}
      {limitMessage ? (
        <p className="rounded-md border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-2 text-xs font-semibold text-lantern-gold">
          {limitMessage}
        </p>
      ) : null}
      <div className="sticky bottom-3 z-10 flex flex-col gap-2 rounded-lg border border-paper/10 bg-night-ink/95 p-2 sm:static sm:flex-row sm:border-0 sm:bg-transparent sm:p-0">
        {step > 0 ? (
          <button
            className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper/75"
            onClick={goBack}
            type="button"
          >
            Back
          </button>
        ) : null}
        {step < steps.length - 1 ? (
          <button
            className="min-h-11 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink"
            onClick={goNext}
            type="button"
          >
            Next
          </button>
        ) : (
          <button
            className="min-h-11 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink"
            onClick={save}
            type="button"
          >
            Save Profile
          </button>
        )}
        {step === steps.length - 1 ? (
          <button
            className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper/75"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </section>
  );
}

function OnboardingChoiceGrid({
  countLabel,
  helper,
  onSelect,
  options,
  question,
  selected,
}: {
  countLabel: string;
  helper?: string;
  onSelect: (value: string) => void;
  options: { label: string; description: string }[];
  question: string;
  selected: string[];
}) {
  return (
    <div className="grid gap-3">
      <div>
        <h3 className="text-lg font-semibold text-paper">{question}</h3>
        {helper ? (
          <p className="text-xs font-semibold text-paper/45">{helper}</p>
        ) : null}
        <p className="mt-1 text-xs font-semibold text-lantern-gold">
          {countLabel}
        </p>
      </div>
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button
            className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm font-semibold ${selected.includes(option.label) ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper/75"}`}
            key={option.label}
            onClick={() => onSelect(option.label)}
            type="button"
          >
            <span className="block break-words">{option.label}</span>
            <span
              className={`mt-1 block text-xs font-normal leading-5 ${selected.includes(option.label) ? "text-night-ink/75" : "text-paper/50"}`}
            >
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadyStoryQueuePanel({
  items,
  onPass,
  onRead,
  onSaveForLater,
}: {
  items: ReadyStoryQueueItem[];
  onPass: (item: ReadyStoryQueueItem) => void;
  onRead: (item: ReadyStoryQueueItem) => void;
  onSaveForLater: (item: ReadyStoryQueueItem) => void;
}) {
  if (!items.length) {
    return (
      <section className="bloodwick-home-section bloodwick-story-queue-section min-w-0 rounded-md border border-paper/10 bg-paper/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">
          Community Favorites
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-paper">
          No waiting stories right now.
        </h2>
        <p className="mt-2 text-sm leading-6 text-paper/60">
          Use Start Something New to generate a story while the queue learns
          what to prepare next.
        </p>
      </section>
    );
  }

  return (
    <section className="bloodwick-home-section bloodwick-story-queue-section min-w-0 rounded-md border border-lantern-gold/20 bg-paper/10 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">
        Community Favorites
      </p>

      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <StoryQueueCard
            item={item}
            key={item.id}
            onPass={onPass}
            onRead={onRead}
            onSaveForLater={onSaveForLater}
          />
        ))}
      </div>
    </section>
  );
}

function MobileHomeView({
  activeMood,
  brief,
  canUseDemoStory,
  hasDemoStory,
  isContinuationGenerating,
  isGenerating,
  isNewStoryGenerating,
  isRecapOpen,
  latestStory,
  onClearDemoStory,
  onCloseRecap,
  onContinue,
  onLoadDemoStory,
  onMoodSelect,
  onOpenRecap,
  onStartNewStory,
  onStartRecommendation,
  showStoryStartOptions,
  suggestedStarts,
}: {
  activeMood: Mood;
  brief: StoryBrief | null;
  canUseDemoStory: boolean;
  hasDemoStory: boolean;
  isContinuationGenerating: boolean;
  isGenerating: boolean;
  isNewStoryGenerating: boolean;
  isRecapOpen: boolean;
  latestStory: LibraryStory | null;
  onClearDemoStory: () => void;
  onCloseRecap: () => void;
  onContinue: (direction?: string) => void;
  onLoadDemoStory: () => void;
  onMoodSelect: (mood: Mood) => void;
  onOpenRecap: () => void;
  onStartNewStory: () => void;
  onStartRecommendation: (story: StoryStart) => void;
  showStoryStartOptions: boolean;
  suggestedStarts: StoryStart[];
}) {
  return (
    <div className="grid min-w-0 gap-5">
      {latestStory && brief ? (
        <div
          className="grid min-w-0 gap-3"
          data-mobile-react-current-story="true"
        >
          <MobileCurrentStoryCard
            brief={brief}
            isGenerating={isContinuationGenerating}
            isRecapOpen={isRecapOpen}
            onCloseRecap={onCloseRecap}
            onContinue={onContinue}
            onOpenRecap={onOpenRecap}
            story={latestStory}
          />
        </div>
      ) : null}
      <MobileMoodPicker activeMood={activeMood} onSelect={onMoodSelect} />
      {showStoryStartOptions ? (
        <MobileSuggestedStoryStarts
          activeMood={activeMood}
          canUseDemoStory={canUseDemoStory}
          hasDemoStory={hasDemoStory}
          onClearDemoStory={onClearDemoStory}
          onLoadDemoStory={onLoadDemoStory}
          onStart={onStartRecommendation}
          stories={suggestedStarts}
        />
      ) : null}
    </div>
  );
}

function MobileCurrentStoryCard({
  brief,
  isGenerating,
  isRecapOpen,
  onCloseRecap,
  onContinue,
  onOpenRecap,
  story,
}: {
  brief: StoryBrief;
  isGenerating: boolean;
  isRecapOpen: boolean;
  onCloseRecap: () => void;
  onContinue: (direction?: string) => void;
  onOpenRecap: () => void;
  story: LibraryStory;
}) {
  return (
    <section className="relative min-w-0 overflow-hidden rounded-[1.35rem] border border-lantern-gold/25 bg-soft-card p-3 text-primary-dark shadow-soft">
      <div className="flex min-w-0 gap-3">
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl">
          <CoverArt
            label={getLibraryStoryCategoryLabel(story)}
            title={story.title}
            tone="warm"
            size="mobile"
          />
        </div>
        <div className="min-w-0 flex-1 pr-1">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-primary-dark">
            {story.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-primary-dark/65">
            {brief.hook}
          </p>
          <button
            className="mt-3 rounded-full bg-primary-dark px-4 py-2 text-xs font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            onClick={() => onContinue()}
            type="button"
          >
            {isGenerating ? "⌛ Writing the next chapter…" : "Next Chapter"}
          </button>
        </div>
      </div>
      <button
        aria-label="Open last chapter recap"
        className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-aged-brass/30 bg-white/85 text-base shadow-soft"
        onClick={onOpenRecap}
        type="button"
      >
        ↺
      </button>
      {isRecapOpen ? (
        <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} />
      ) : null}
    </section>
  );
}

function MobileMoodPicker({
  activeMood,
  onSelect,
}: {
  activeMood: Mood;
  onSelect: (mood: Mood) => void;
}) {
  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold leading-tight text-paper">
        Start something new
      </h2>
      <div className="mt-3 flex min-w-0 flex-wrap gap-2">
        {AVAILABLE_MOOD_CHIPS.map((mood) => {
          const chip = getStoryTypeChip(mood);
          return (
            <button
              className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${activeMood === mood ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper"}`}
              key={mood}
              onClick={() => onSelect(mood)}
              type="button"
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function MobileSuggestedStoryStarts({
  activeMood,
  canUseDemoStory,
  hasDemoStory,
  onClearDemoStory,
  onLoadDemoStory,
  onStart,
  stories,
}: {
  activeMood: Mood;
  canUseDemoStory: boolean;
  hasDemoStory: boolean;
  onClearDemoStory: () => void;
  onLoadDemoStory: () => void;
  onStart: (story: StoryStart) => void;
  stories: StoryStart[];
}) {
  return (
    <section className="min-w-0">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-paper">
            Based on your reader pulse
          </h2>
          <p className="mt-1 text-xs leading-5 text-paper/55">
            {getStoryTypeChip(activeMood).label} picks for your next read.
          </p>
        </div>
        {canUseDemoStory ? (
          <div className="flex shrink-0 gap-2">
            {hasDemoStory ? (
              <SmallButton onClick={onClearDemoStory}>Clear demo</SmallButton>
            ) : (
              <SmallButton onClick={onLoadDemoStory}>Demo</SmallButton>
            )}
          </div>
        ) : null}
      </div>
      <div className="mt-3 grid min-w-0 gap-3">
        {stories.map((story) => (
          <MobileStoryStartRow
            key={story.title}
            onStart={onStart}
            story={story}
          />
        ))}
      </div>
    </section>
  );
}

function MobileStoryStartRow({
  onStart,
  story,
}: {
  onStart: (story: StoryStart) => void;
  story: StoryStart;
}) {
  return (
    <button
      className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-paper/12 bg-paper/10 p-2.5 text-left"
      onClick={() => onStart(story)}
      type="button"
    >
      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl">
        <CoverArt
          label={story.mood}
          title={story.title}
          tone="cool"
          size="mobile"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-paper">
          {story.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-xs leading-5 text-paper/60">
          {story.premise}
        </p>
        <div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden">
          <span className="truncate rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-2 py-0.5 text-[0.65rem] font-semibold text-lantern-gold">
            {story.genre}
          </span>
          <span className="shrink-0 rounded-full border border-paper/15 bg-paper/10 px-2 py-0.5 text-[0.65rem] font-semibold text-paper/70">
            {story.mood}
          </span>
        </div>
      </div>
      <span className="shrink-0 text-xl text-paper/45">›</span>
    </button>
  );
}

function CurrentStoryCard({
  brief,
  direction,
  isDirectionOpen,
  isGenerating,
  isRecapOpen,
  onCloseRecap,
  onContinue,
  onDirectionChange,
  onExportStory,
  onOpenRecap,
  onToggleDirection,
  story,
}: {
  brief: StoryBrief;
  direction: string;
  isDirectionOpen: boolean;
  isGenerating: boolean;
  isRecapOpen: boolean;
  onCloseRecap: () => void;
  onContinue: (direction?: string) => void;
  onDirectionChange: (value: string) => void;
  onExportStory: () => void;
  onOpenRecap: () => void;
  onToggleDirection: () => void;
  story: LibraryStory;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-md border border-lantern-gold/35 bg-soft-card text-primary-dark shadow-soft">
      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(220px,340px)_1fr]">
        <div className="min-w-0 bg-primary-dark p-4 sm:p-6">
          <CoverArt
            label={getLibraryStoryCategoryLabel(story)}
            title={story.title}
            tone="warm"
            size="feature"
          />
        </div>
        <div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:p-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">
              Current Story / Next Chapter
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-dark md:text-5xl">
              {story.title}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-primary-dark/72">
              {brief.hook}
            </p>
          </div>
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 rounded-md border border-aged-brass/20 bg-white/65 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">
                Last time
              </p>
              <p className="mt-2 text-sm leading-6 text-primary-dark/75">
                {brief.recap}
              </p>
            </div>
            <div className="min-w-0 rounded-md border border-primary-dark/10 bg-primary-dark p-4 text-primary-light">
              <div className="flex min-w-0 items-center gap-4">
                <HeroPortrait name={brief.heroName} size="large" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lantern-gold/75">
                    Protagonist
                  </p>
                  <p className="mt-1 text-lg font-semibold text-primary-light">
                    {brief.heroName}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-primary-light/55">
                    {brief.heroRole}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-primary-light/75">
                {brief.struggle}
              </p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              className="rounded-md bg-primary-dark px-5 py-3 text-sm font-semibold text-primary-light transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isGenerating}
              onClick={() => onContinue()}
              type="button"
            >
              {isGenerating ? "⌛ Writing the next chapter…" : "Next Chapter"}
            </button>
            <button
              className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10"
              onClick={onOpenRecap}
              type="button"
            >
              Last Chapter Recap
            </button>
            <button
              className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10"
              onClick={onExportStory}
              type="button"
            >
              Export
            </button>
          </div>
        </div>
      </div>
      {isRecapOpen ? (
        <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} />
      ) : null}
    </section>
  );
}

function RecapPanel({
  brief,
  onClose,
  title,
}: {
  brief: StoryBrief;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-night-ink/75 p-3 sm:items-center sm:justify-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} recap`}
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md border border-lantern-gold/30 bg-soft-card p-5 text-primary-dark shadow-soft sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">
              Last Chapter Recap
            </p>
            <h3 className="mt-2 text-2xl font-semibold leading-tight">
              {title}
            </h3>
          </div>
          <button
            className="shrink-0 rounded-md border border-primary-dark/15 px-3 py-2 text-sm font-semibold text-primary-dark"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          <RecapBlock title="What happened" body={brief.recap} />
          <RecapBlock title="What changed" body={brief.changed} />
          <RecapBlock title="What remains unresolved" body={brief.tension} />
          <RecapBlock
            title="Why the next chapter matters"
            body={brief.nextHook}
          />
        </div>
      </div>
    </div>
  );
}

function RecapBlock({ body, title }: { body: string; title: string }) {
  return (
    <section className="rounded-md border border-aged-brass/20 bg-white/65 p-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-aged-brass">
        {title}
      </h4>
      <p className="mt-2 text-sm leading-6 text-primary-dark/75">{body}</p>
    </section>
  );
}

function MoodPicker({
  activeMood,
  hasCurrentStory,
  onSelect,
}: {
  activeMood: Mood;
  hasCurrentStory: boolean;
  onSelect: (mood: Mood) => void;
}) {
  return (
    <section className={hasCurrentStory ? "min-w-0" : "min-w-0 pt-1"}>
      <div className="max-w-3xl">
        <h2 className="text-2xl font-semibold text-paper md:text-3xl">
          Start something new
        </h2>
        {!hasCurrentStory ? (
          <p className="mt-3 text-sm leading-6 text-paper/70">
            Start your first story. Once you have one in progress, your next
            chapter will appear here.
          </p>
        ) : null}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {AVAILABLE_MOOD_CHIPS.map((mood) => (
          <button
            className={`min-w-0 rounded-md border px-4 py-4 text-left transition ${activeMood === mood ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white shadow-soft" : "border-paper/15 bg-paper/10 text-paper hover:border-bloodwick-copper hover:bg-paper/15"}`}
            key={mood}
            onClick={() => onSelect(mood)}
            type="button"
          >
            <span className="block text-base font-semibold">
              {getStoryTypeChip(mood).label}
            </span>
            <span className="mt-2 block text-xs leading-5 opacity-70">
              {moodDescription(mood)}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SuggestedStoryStarts({
  activeMood,
  canUseDemoStory,
  hasDemoStory,
  onClearDemoStory,
  onLoadDemoStory,
  onStart,
  stories,
}: {
  activeMood: Mood;
  canUseDemoStory: boolean;
  hasDemoStory: boolean;
  onClearDemoStory: () => void;
  onLoadDemoStory: () => void;
  onStart: (story: StoryStart) => void;
  stories: StoryStart[];
}) {
  return (
    <section className="min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-paper md:text-3xl">
            Based on your reader pulse
          </h2>
          <p className="mt-2 text-sm leading-6 text-paper/62">
            A small shelf of premieres, with{" "}
            {getStoryTypeChip(activeMood).label.toLowerCase()} closest to the
            front.
          </p>
        </div>
        {canUseDemoStory ? (
          <div className="flex flex-wrap gap-2">
            <SmallButton disabled={hasDemoStory} onClick={onLoadDemoStory}>
              Load demo story
            </SmallButton>
            {hasDemoStory ? (
              <SmallButton onClick={onClearDemoStory}>
                Clear demo story
              </SmallButton>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        {stories.map((story) => (
          <StoryStartCard
            isFeatured={storyStartSupportsMood(story, activeMood)}
            key={story.title}
            onStart={onStart}
            story={story}
          />
        ))}
      </div>
    </section>
  );
}

function StoryStartCard({
  isFeatured,
  onStart,
  story,
}: {
  isFeatured: boolean;
  onStart: (story: StoryStart) => void;
  story: StoryStart;
}) {
  return (
    <article
      className={`min-w-0 rounded-md border p-4 transition ${isFeatured ? "border-lantern-gold/65 bg-paper/15" : "border-paper/12 bg-paper/10"}`}
    >
      <div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
        <CoverArt
          label={story.mood}
          title={story.title}
          tone={isFeatured ? "warm" : "cool"}
        />
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap gap-2">
            <Tag>{story.genre}</Tag>
            <Tag>{story.mood}</Tag>
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-tight text-paper">
            {story.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-paper/70">
            {story.premise}
          </p>
          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-md border border-paper/10 bg-night-ink/35 p-3">
            <HeroPortrait name={story.heroName} />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                Protagonist
              </p>
              <p className="mt-1 text-sm font-semibold text-paper">
                {story.heroName}
              </p>
              <p className="mt-1 text-xs leading-5 text-paper/55">
                {story.heroRole}
              </p>
            </div>
          </div>
          <button
            className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink transition hover:bg-lantern-gold/90"
            onClick={() => onStart(story)}
            type="button"
          >
            Start
          </button>
        </div>
      </div>
    </article>
  );
}

function CreateView(props: {
  canGenerate: boolean;
  characterArc: CharacterArc;
  characterProfiles: UploadState;
  endingType: EndingType;
  genrePreset: GenrePreset;
  inputArtifacts: InputArtifact[];
  isGenerating: boolean;
  lengthTarget: LengthTarget;
  narrativeArchitecture: NarrativeArchitecture;
  onChangeCharacterArc: (value: CharacterArc) => void;
  onChangeCharacterProfiles: (value: UploadState) => void;
  onChangeEndingType: (value: EndingType) => void;
  onChangeGenre: (value: GenrePreset) => void;
  onChangeLengthTarget: (value: LengthTarget) => void;
  onChangeNarrative: (value: NarrativeArchitecture) => void;
  onChangeStoryRules: (value: UploadState) => void;
  onChangeStorySeed: (value: UploadState) => void;
  onChangeWorld: (value: UploadState) => void;
  onClear: () => void;
  onGenerate: () => void;
  onSaveInputArtifact: (type: InputArtifactType, value: UploadState) => void;
  onSelectInputArtifact: (type: InputArtifactType, artifactId: string) => void;
  storyRules: UploadState;
  storySeed: UploadState;
  worldBible: UploadState;
}) {
  const {
    canGenerate,
    characterArc,
    characterProfiles,
    endingType,
    genrePreset,
    inputArtifacts,
    isGenerating,
    lengthTarget,
    narrativeArchitecture,
    onChangeCharacterArc,
    onChangeCharacterProfiles,
    onChangeEndingType,
    onChangeGenre,
    onChangeLengthTarget,
    onChangeNarrative,
    onChangeStoryRules,
    onChangeStorySeed,
    onChangeWorld,
    onClear,
    onGenerate,
    onSaveInputArtifact,
    onSelectInputArtifact,
    storyRules,
    storySeed,
    worldBible,
  } = props;
  return (
    <section className="grid min-w-0 gap-5">
      <PageHeading
        eyebrow="Create"
        title="Create New Story"
        body="Build a story from a world, cast, spark, and craft rules in one dedicated workspace."
      />
      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,460px)_1fr]">
        <section className="grid min-w-0 gap-4">
          <InputPanel
            artifactType="worldBible"
            libraryArtifacts={inputArtifacts.filter(
              (artifact) => artifact.type === "worldBible",
            )}
            onChange={onChangeWorld}
            onSave={onSaveInputArtifact}
            onSelect={onSelectInputArtifact}
            title="Storyworld"
            value={worldBible}
          />
          <InputPanel
            artifactType="characterProfiles"
            libraryArtifacts={inputArtifacts.filter(
              (artifact) => artifact.type === "characterProfiles",
            )}
            onChange={onChangeCharacterProfiles}
            onSave={onSaveInputArtifact}
            onSelect={onSelectInputArtifact}
            title="Cast"
            value={characterProfiles}
          />
          <InputPanel
            artifactType="storySeed"
            libraryArtifacts={inputArtifacts.filter(
              (artifact) => artifact.type === "storySeed",
            )}
            onChange={onChangeStorySeed}
            onSave={onSaveInputArtifact}
            onSelect={onSelectInputArtifact}
            title="Story Spark"
            value={storySeed}
          />
          <InputPanel
            artifactType="storyRules"
            libraryArtifacts={inputArtifacts.filter(
              (artifact) => artifact.type === "storyRules",
            )}
            onChange={onChangeStoryRules}
            onSave={onSaveInputArtifact}
            onSelect={onSelectInputArtifact}
            title="Craft Rules"
            value={storyRules}
          />
          <button
            className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper"
            onClick={onClear}
            type="button"
          >
            Clear current inputs
          </button>
        </section>
        <section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4">
          <h2 className="text-xl font-semibold text-paper">
            Story Architecture
          </h2>
          <div className="mt-4 grid gap-3">
            <SelectControl
              label="Genre Preset"
              onChange={(value) => onChangeGenre(value as GenrePreset)}
              options={GENRE_PRESETS}
              value={genrePreset}
            />
            <SelectControl
              label="Narrative Architecture"
              onChange={(value) =>
                onChangeNarrative(value as NarrativeArchitecture)
              }
              options={NARRATIVE_ARCHITECTURES}
              value={narrativeArchitecture}
            />
            <SelectControl
              label="Character Arc"
              onChange={(value) => onChangeCharacterArc(value as CharacterArc)}
              options={CHARACTER_ARCS}
              value={characterArc}
            />
            <SelectControl
              label="Ending Type"
              onChange={(value) => onChangeEndingType(value as EndingType)}
              options={ENDING_TYPES}
              value={endingType}
            />
            <SelectControl
              label="Length Target"
              onChange={(value) => onChangeLengthTarget(value as LengthTarget)}
              options={LENGTH_TARGETS.filter(
                (target) => target.value !== "First Page Test",
              ).map((target) => ({ value: target.value, label: target.label }))}
              value={lengthTarget}
            />
          </div>
          <button
            className="mt-5 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canGenerate}
            onClick={onGenerate}
            type="button"
          >
            {isGenerating ? "Generating story..." : "Generate Story"}
          </button>
          {!storyRules.content.trim() ? (
            <p className="mt-3 rounded-md bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/55">
              {DEFAULT_STORY_RULES_NOTICE}
            </p>
          ) : null}
        </section>
      </div>
    </section>
  );
}

function InputPanel({
  artifactType,
  libraryArtifacts,
  onChange,
  onSave,
  onSelect,
  title,
  value,
}: {
  artifactType: InputArtifactType;
  libraryArtifacts: InputArtifact[];
  onChange: (value: UploadState) => void;
  onSave: (type: InputArtifactType, value: UploadState) => void;
  onSelect: (type: InputArtifactType, artifactId: string) => void;
  title: string;
  value: UploadState;
}) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return;
    onChange({ name: file.name, content: await file.text() });
  }
  return (
    <section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4">
      <h2 className="text-lg font-semibold text-paper">{title}</h2>
      <select
        className="mt-3 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper"
        onChange={(event) => onSelect(artifactType, event.target.value)}
        value={value.libraryArtifactId ?? ""}
      >
        <option value="">Choose saved item</option>
        {libraryArtifacts.map((artifact) => (
          <option key={artifact.id} value={artifact.id}>
            {artifact.name}
          </option>
        ))}
      </select>
      <textarea
        className="mt-3 min-h-32 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold"
        onChange={(event) =>
          onChange({
            name: value.name || `${slugify(title)}.txt`,
            content: event.target.value,
            libraryArtifactId: value.libraryArtifactId,
          })
        }
        placeholder={`Add ${title.toLowerCase()} text`}
        value={value.content}
      />
      <label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-lantern-gold/50 px-4 py-3 text-sm font-semibold text-lantern-gold">
        <span className="min-w-0 truncate">
          {value.name || "Upload .md or .txt"}
        </span>
        <input
          className="sr-only"
          type="file"
          accept=".md,.txt,text/markdown,text/plain"
          onChange={handleFileChange}
        />
      </label>
      <button
        className="mt-3 rounded-md border border-lantern-gold/45 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!value.content.trim()}
        onClick={() => onSave(artifactType, value)}
        type="button"
      >
        Save to Library
      </button>
    </section>
  );
}

function findEpisodeInLibrarySeries(
  stories: LibraryStory[],
  currentStoryId: string,
): SeriesEpisode<LibraryStory> | null {
  const trimmedCurrentStoryId = currentStoryId.trim();
  if (!trimmedCurrentStoryId) return null;

  for (const group of groupStoriesBySeries(stories)) {
    const currentEpisode = group.episodes.find(
      (episode) =>
        episode.storyId === trimmedCurrentStoryId ||
        episode.story.id === trimmedCurrentStoryId,
    );
    if (currentEpisode) return currentEpisode;
  }

  return null;
}

const READER_STORY_TYPE_OPTIONS = STORY_FIT_STORY_TYPE_OPTIONS.map(
  (option) => option.label,
);
const READER_STORY_INGREDIENT_OPTIONS = STORY_FIT_INGREDIENT_OPTIONS.map(
  (option) => option.label,
);
const NARRATIVE_PRESSURE_OPTIONS = [
  { label: "Not set", value: "not-set" },
  ...Object.entries(STORY_FIT_PRESSURE_TO_LEGACY).map(([label, value]) => ({
    label,
    value,
  })),
];
const EPISODE_ENDING_SHAPE_OPTIONS = [
  { label: "Not set", value: "not-set" },
  ...Object.entries(STORY_FIT_ENDING_TO_LEGACY).map(([label, value]) => ({
    label,
    value,
  })),
];
const PROTAGONIST_LENS_OPTIONS = [
  { label: "Not set", value: "not-set" },
  ...Object.entries(STORY_FIT_CHARACTER_LENS_TO_LEGACY).map(
    ([label, value]) => ({ label, value }),
  ),
];

function AccountView({
  accountProfileActionDiagnostics,
  authState,
  canonicalProfile,
  cloudReaderProfileSync,
  inputArtifacts,
  onClearLocalReaderMemory,
  onClearStoryFitPreferences,
  onOpenLibrary,
  onOpenStoryFitOnboarding,
  onReaderPreferencesChange,
  onRefreshAccountProfile,
  onSaveAccountProfile,
  readerPreferences,
  readerProfile,
  savedForLaterStoryQueue,
  savedStories,
  saveStatus,
  summary,
}: {
  accountProfileActionDiagnostics: AccountProfileActionDiagnostics;
  authState: ReturnType<typeof useAuth>;
  canonicalProfile: CanonicalReaderProfile | null;
  cloudReaderProfileSync: CloudReaderProfileSyncState;
  inputArtifacts: InputArtifact[];
  onClearLocalReaderMemory: () => void;
  onClearStoryFitPreferences: () => void;
  onOpenLibrary: () => void;
  onOpenStoryFitOnboarding: () => void;
  onReaderPreferencesChange: (
    preferences: ReaderProfile["explicitReaderPreferences"],
  ) => void;
  onRefreshAccountProfile: () => void;
  onSaveAccountProfile: () => void;
  readerPreferences: ReaderProfile["explicitReaderPreferences"];
  readerProfile: ReaderProfile;
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  savedStories: SavedStory[];
  saveStatus: ReaderPreferencesSaveStatus;
  summary: AccountProfileSummary;
}) {
  const [avoidanceDraft, setAvoidanceDraft] = useState("");
  const [dataControlMessage, setDataControlMessage] = useState("");
  const [pendingClearConfirmation, setPendingClearConfirmation] =
    useState<AccountDataClearConfirmation>(null);
  const accountMode = getAccountDataMode(
    authState,
    readerProfile,
    canonicalProfile,
  );
  const accountRows = getAccountDataStatusRows({
    accountMode,
    authState,
    canonicalProfile,
    readerProfile,
    summary,
  });
  const storyFitSelectedCount = countStoryFitSelections(
    readerProfile.explicitReaderPreferences,
  );
  const accountProfileSyncRows = getAccountProfileSyncRows({
    authState,
    cloudReaderProfileSync,
    readerProfile,
    savedStoriesCount: savedStories.length,
    storyFitSelectedCount,
  });
  const isRefreshingAccountProfile =
    accountProfileActionDiagnostics.lastAccountProfileAction === "refresh" &&
    accountProfileActionDiagnostics.lastAccountProfileActionStatus ===
      "refreshing";
  const isSavingAccountProfile =
    accountProfileActionDiagnostics.lastAccountProfileAction === "save" &&
    accountProfileActionDiagnostics.lastAccountProfileActionStatus === "saving";
  const savedCountEntries = [
    typeof summary.counts.savedStories === "number"
      ? { label: "Saved stories", value: summary.counts.savedStories }
      : null,
    typeof summary.counts.series === "number"
      ? { label: "Series / storyworlds", value: summary.counts.series }
      : null,
    typeof summary.counts.characters === "number"
      ? { label: "Characters / casts", value: summary.counts.characters }
      : null,
    typeof summary.counts.storySparks === "number"
      ? { label: "Story sparks", value: summary.counts.storySparks }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: number }>;
  const updatePreferences = (
    patch: Partial<ReaderProfile["explicitReaderPreferences"]>,
  ) => onReaderPreferencesChange({ ...readerPreferences, ...patch });
  const toggleItem = (
    field: "preferredStoryTypes" | "storyIngredients",
    value: string,
  ) => {
    const current = readerPreferences[field];
    updatePreferences({
      [field]: current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    });
  };
  const addAvoidance = () => {
    const next = addUniquePreferenceItem(
      readerPreferences.hardAvoidances,
      avoidanceDraft,
      MAX_READER_HARD_AVOIDANCES,
    );
    if (next !== readerPreferences.hardAvoidances)
      updatePreferences({ hardAvoidances: next });
    setAvoidanceDraft("");
  };
  const exportAccountData = () => {
    const exportData = buildAccountDataExport({
      accountMode,
      authState,
      canonicalProfile,
      inputArtifacts,
      readerProfile,
      savedForLaterStoryQueue,
      savedStories,
      summary,
    });
    downloadJsonFile(
      `lantyrn-account-data-${new Date().toISOString().slice(0, 10)}.json`,
      exportData,
    );
    setDataControlMessage("Account/profile data exported as JSON.");
  };
  const clearStoryFitPreferences = () => {
    onClearStoryFitPreferences();
    setPendingClearConfirmation(null);
    setDataControlMessage("Story Fit Preferences cleared.");
  };
  const clearLocalReaderMemory = () => {
    onClearLocalReaderMemory();
    setPendingClearConfirmation(null);
    setDataControlMessage("Local reader memory/profile signals cleared.");
  };

  return (
    <section className="mx-auto grid w-full max-w-5xl min-w-0 gap-5 pb-8 md:pb-0">
      <PageHeading
        eyebrow="Account"
        title="Account / Profile"
        body="A snapshot of your current Bloodwick profile, saved content, reader preferences, and future data controls."
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <article className="grid min-w-0 gap-3 rounded-xl border border-lantern-gold/25 bg-lantern-gold/10 p-4 shadow-soft lg:col-span-2">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">
                Current status
              </p>
              <h2 className="mt-1 text-2xl font-semibold leading-tight text-paper">
                {summary.displayName}
              </h2>
            </div>
            <span className="w-fit rounded-md border border-paper/15 bg-night-ink/70 px-2.5 py-1 text-xs font-semibold capitalize text-paper/70">
              {summary.accountMode}
            </span>
          </div>
          {summary.profileId ? (
            <p className="text-sm font-semibold text-paper/80">
              Profile ID: {summary.profileId}
            </p>
          ) : null}
          <p className="text-sm leading-6 text-paper/70">
            {summary.statusText}
          </p>
        </article>
        <AccountCard title="What Bloodwick knows so far">
          <ProfileSummaryRow
            label="Story types"
            values={summary.preferredStoryTypes}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="What the story should give you"
            values={summary.emotionalPromises}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Storyworlds / places"
            values={summary.favoriteStoryWorlds}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Story ingredients"
            values={summary.storyIngredients}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Character lens"
            values={summary.characterLensPreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Narrative pressure / intensity"
            values={summary.narrativePressurePreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Episode ending shape"
            values={summary.episodeEndingShapePreferences}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Hard avoidances"
            values={summary.hardAvoidances}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Story fit settings"
            values={summary.explicitDetails}
            empty="Not set"
          />
          <ProfileSummaryRow
            label="Continuation preference"
            values={
              summary.continuationPreference
                ? [summary.continuationPreference]
                : []
            }
            empty="Not enough signal yet."
          />
          <ProfileSummaryRow
            label="Recent feedback"
            values={summary.recentFeedback}
            empty="No feedback captured yet."
          />
          <ProfileSummaryRow
            label="Confidence / status"
            values={[summary.confidenceLabel]}
            empty="Still learning."
          />
        </AccountCard>
        <AccountCard title="Account data status">
          <dl className="grid gap-2">
            {accountRows.map((row) => (
              <div
                className="rounded-md border border-paper/10 bg-night-ink/45 px-3 py-2"
                key={row.label}
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                  {row.label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-paper/80">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </AccountCard>
        <AccountCard title="Account profile sync">
          <dl className="grid min-w-0 gap-2 sm:grid-cols-2">
            {accountProfileSyncRows.map((row) => (
              <div
                className="min-w-0 rounded-md border border-paper/10 bg-night-ink/45 px-3 py-2"
                key={row.label}
              >
                <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                  {row.label}
                </dt>
                <dd className="mt-1 break-words text-sm font-semibold text-paper/80">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              className="min-h-11 rounded-md border border-lantern-gold/45 bg-lantern-gold/10 px-4 py-3 text-left text-sm font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isRefreshingAccountProfile}
              onClick={onRefreshAccountProfile}
              type="button"
            >
              {isRefreshingAccountProfile
                ? "Refreshing…"
                : "Refresh account profile"}
            </button>
            <button
              className="min-h-11 rounded-md border border-lantern-gold/45 bg-lantern-gold/10 px-4 py-3 text-left text-sm font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isSavingAccountProfile}
              onClick={onSaveAccountProfile}
              type="button"
            >
              {isSavingAccountProfile ? "Saving…" : "Save profile to account"}
            </button>
            <button
              className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-3 text-left text-sm font-semibold text-paper/80"
              onClick={onOpenStoryFitOnboarding}
              type="button"
            >
              Edit Story Fit Profile
            </button>
            <button
              className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-3 text-left text-sm font-semibold text-paper/80"
              onClick={exportAccountData}
              type="button"
            >
              Export account data
            </button>
          </div>
          {accountProfileActionDiagnostics.lastAccountProfileActionMessage !==
          "none" ? (
            <p className="mt-3 rounded-md border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-2 text-sm font-semibold text-lantern-gold">
              {accountProfileActionDiagnostics.lastAccountProfileActionMessage}
            </p>
          ) : null}
        </AccountCard>
        <AccountCard title="Story fit preferences">
          <button
            className="min-h-11 w-full rounded-md border border-lantern-gold/45 bg-lantern-gold/10 px-4 py-3 text-left text-sm font-semibold text-lantern-gold sm:w-fit"
            onClick={onOpenStoryFitOnboarding}
            type="button"
          >
            Edit via guided setup
          </button>
          <PreferenceChipGroup
            label="Preferred story types"
            options={READER_STORY_TYPE_OPTIONS}
            selected={readerPreferences.preferredStoryTypes}
            onToggle={(value) => toggleItem("preferredStoryTypes", value)}
          />
          <PreferenceChipGroup
            label="Story engines"
            options={READER_STORY_INGREDIENT_OPTIONS}
            selected={readerPreferences.storyIngredients}
            onToggle={(value) => toggleItem("storyIngredients", value)}
          />
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-paper">Hard avoidances</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="min-h-11 min-w-0 flex-1 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper outline-none focus:border-lantern-gold"
                maxLength={60}
                onChange={(event) => setAvoidanceDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addAvoidance();
                  }
                }}
                placeholder="No dead pets, no gore..."
                value={avoidanceDraft}
              />
              <button
                className="min-h-11 rounded-md border border-lantern-gold/40 bg-lantern-gold/10 px-4 py-2 text-sm font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !avoidanceDraft.trim() ||
                  readerPreferences.hardAvoidances.length >=
                    MAX_READER_HARD_AVOIDANCES
                }
                onClick={addAvoidance}
                type="button"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {readerPreferences.hardAvoidances.map((item) => (
                <button
                  className="rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-1 text-xs font-semibold text-lantern-gold"
                  key={item}
                  onClick={() =>
                    updatePreferences({
                      hardAvoidances: readerPreferences.hardAvoidances.filter(
                        (current) => current !== item,
                      ),
                    })
                  }
                  type="button"
                >
                  {item} ×
                </button>
              ))}
            </div>
            <p className="text-xs text-paper/45">
              Up to 10 avoidances, 60 characters each.
            </p>
          </div>
          <PreferenceSelect
            label="Content lane"
            options={CONTENT_LANE_OPTIONS}
            value={readerPreferences.contentLane}
            onChange={(value) =>
              updatePreferences({
                contentLane: value as typeof readerPreferences.contentLane,
              })
            }
          />
          <PreferenceSelect
            label="Narrative pressure"
            options={NARRATIVE_PRESSURE_OPTIONS}
            value={readerPreferences.narrativePressure}
            onChange={(value) =>
              updatePreferences({
                narrativePressure:
                  value as typeof readerPreferences.narrativePressure,
                narrativePressurePreferences:
                  value === "not-set"
                    ? []
                    : [
                        NARRATIVE_PRESSURE_OPTIONS.find(
                          (option) => option.value === value,
                        )?.label ?? "",
                      ],
              })
            }
          />
          <PreferenceSelect
            label="Episode ending shape"
            options={EPISODE_ENDING_SHAPE_OPTIONS}
            value={readerPreferences.episodeEndingShape}
            onChange={(value) =>
              updatePreferences({
                episodeEndingShape:
                  value as typeof readerPreferences.episodeEndingShape,
                episodeEndingShapePreferences:
                  value === "not-set"
                    ? []
                    : [
                        EPISODE_ENDING_SHAPE_OPTIONS.find(
                          (option) => option.value === value,
                        )?.label ?? "",
                      ],
              })
            }
          />
          <PreferenceSelect
            label="Protagonist lens"
            options={PROTAGONIST_LENS_OPTIONS}
            value={readerPreferences.protagonistLens}
            onChange={(value) =>
              updatePreferences({
                protagonistLens:
                  value as typeof readerPreferences.protagonistLens,
                protagonistLensPreferences:
                  value === "not-set"
                    ? []
                    : [
                        PROTAGONIST_LENS_OPTIONS.find(
                          (option) => option.value === value,
                        )?.label ?? "",
                      ],
              })
            }
          />
          <p
            className={`text-xs font-semibold ${saveStatus === "error" ? "text-red-200" : "text-paper/50"}`}
          >
            {saveStatus === "saving"
              ? "Saving…"
              : saveStatus === "error"
                ? "Could not save locally"
                : "Saved"}
          </p>
        </AccountCard>
        <AccountCard title="Your saved Bloodwick content">
          {savedCountEntries.length ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              {savedCountEntries.map((entry) => (
                <div
                  className="rounded-md border border-paper/10 bg-night-ink/45 p-3"
                  key={entry.label}
                >
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                    {entry.label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-paper">
                    {entry.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="rounded-md border border-paper/12 bg-paper/10 px-3 py-3 text-sm text-paper/60">
              No saved items found yet.
            </p>
          )}
          <button
            className="mt-4 min-h-11 w-full rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-night-ink sm:w-fit"
            onClick={onOpenLibrary}
            type="button"
          >
            Go to Shelf
          </button>
        </AccountCard>
        <AccountCard title="Data controls">
          <div className="grid gap-2">
            <button
              className="min-h-11 rounded-md border border-lantern-gold/45 bg-lantern-gold/10 px-4 py-3 text-left text-sm font-semibold text-lantern-gold"
              onClick={exportAccountData}
              type="button"
            >
              Export account data
            </button>
            <button
              className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-3 text-left text-sm font-semibold text-paper/80"
              onClick={() => {
                setPendingClearConfirmation("story-fit-preferences");
                setDataControlMessage("");
              }}
              type="button"
            >
              Clear Story Fit Preferences
            </button>
            <button
              className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-3 text-left text-sm font-semibold text-paper/80"
              onClick={() => {
                setPendingClearConfirmation("local-reader-memory");
                setDataControlMessage("");
              }}
              type="button"
            >
              Clear local reader memory/profile signals
            </button>
            <button
              className="min-h-11 cursor-not-allowed rounded-md border border-paper/12 bg-paper/5 px-4 py-3 text-left text-sm font-semibold text-paper/45"
              disabled
              type="button"
            >
              Account deletion is not available yet.
            </button>
          </div>
          {pendingClearConfirmation ? (
            <div className="rounded-md border border-lantern-gold/35 bg-night-ink/70 p-3">
              <p className="text-sm leading-6 text-paper/75">
                {pendingClearConfirmation === "story-fit-preferences"
                  ? "This clears your selected story types, story ingredients, content lane, narrative pressure, episode ending shape, protagonist lens, and hard avoidances. It does not delete stories."
                  : "This clears local learned reader/profile signals used for personalization. It does not delete stories or sign you out."}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-4 py-2 text-sm font-semibold text-paper/75"
                  onClick={() => setPendingClearConfirmation(null)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="min-h-11 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink"
                  onClick={
                    pendingClearConfirmation === "story-fit-preferences"
                      ? clearStoryFitPreferences
                      : clearLocalReaderMemory
                  }
                  type="button"
                >
                  {pendingClearConfirmation === "story-fit-preferences"
                    ? "Clear Story Fit Preferences"
                    : "Clear local reader memory"}
                </button>
              </div>
            </div>
          ) : null}
          <p className="text-xs leading-5 text-paper/50">
            Exports and clearing actions use only data already available in this
            browser/app state. Account deletion is not enabled here.
          </p>
          {dataControlMessage ? (
            <p className="rounded-md border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-2 text-sm font-semibold text-lantern-gold">
              {dataControlMessage}
            </p>
          ) : null}
        </AccountCard>
      </div>
    </section>
  );
}

function getAccountDataMode(
  authState: ReturnType<typeof useAuth>,
  readerProfile: ReaderProfile,
  canonicalProfile: CanonicalReaderProfile | null,
): AccountDataMode {
  if (authState.currentUser?.id) return "signed-in";
  if (readerProfile.profileExists || readerProfileExistsInLocalStorage())
    return "browser-profile";
  if (canonicalProfile?.source === "local") return "local-profile";
  return authState.authStatus === "error" ? "unknown" : "browser-profile";
}

function getAccountDataStatusRows({
  accountMode,
  authState,
  canonicalProfile,
  readerProfile,
  summary,
}: {
  accountMode: AccountDataMode;
  authState: ReturnType<typeof useAuth>;
  canonicalProfile: CanonicalReaderProfile | null;
  readerProfile: ReaderProfile;
  summary: AccountProfileSummary;
}) {
  const feedbackCount =
    canonicalProfile?.signals.feedbackSignalCount ??
    readerProfile.storyFeedbackSignals?.length;
  return [
    { label: "Account mode", value: formatAccountDataMode(accountMode) },
    summary.profileId
      ? { label: "Profile ID", value: summary.profileId }
      : null,
    authState.currentUser?.email
      ? { label: "Signed-in email", value: authState.currentUser.email }
      : null,
    typeof summary.counts.savedStories === "number"
      ? { label: "Saved stories", value: String(summary.counts.savedStories) }
      : null,
    {
      label: "Story Fit Preferences",
      value: hasReaderProfilePreferences(
        readerProfile.explicitReaderPreferences,
      )
        ? "Saved"
        : "Empty",
    },
    {
      label: "Reader memory/profile signals",
      value: hasReaderMemorySignals(readerProfile, canonicalProfile)
        ? "Saved"
        : "Empty",
    },
    typeof feedbackCount === "number"
      ? { label: "Feedback signals", value: String(feedbackCount) }
      : null,
    readerProfile.updatedAt || canonicalProfile?.updatedAt
      ? {
          label: "Last updated",
          value: readerProfile.updatedAt || canonicalProfile?.updatedAt || "",
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function formatAccountDataMode(accountMode: AccountDataMode) {
  if (accountMode === "signed-in") return "Signed in";
  if (accountMode === "browser-profile") return "Browser profile";
  if (accountMode === "local-profile") return "Local profile";
  return "Unknown";
}

function maskAccountIdentifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 12) return trimmed ? "••••" : "none";
  return `${trimmed.slice(0, 6)}…${trimmed.slice(-4)}`;
}

function countStoryFitSelections(
  preferences: ReaderProfile["explicitReaderPreferences"],
): number {
  return [
    preferences.preferredStoryTypes,
    preferences.emotionalPromises,
    preferences.favoriteStoryWorlds,
    preferences.storyIngredients,
    preferences.characterLensPreferences,
    preferences.protagonistLensPreferences,
    preferences.narrativePressurePreferences,
    preferences.episodeEndingShapePreferences,
    preferences.hardAvoidances,
  ].reduce(
    (total, value) => total + (Array.isArray(value) ? value.length : 0),
    0,
  );
}

function hasStoryFitProfileV2Selections(
  preferences: ReaderProfile["explicitReaderPreferences"],
): boolean {
  return countStoryFitSelections(preferences) > 0;
}

function isCloudProfileNewerOrEqual(
  cloudUpdatedAt: string,
  localUpdatedAt: string,
): boolean {
  if (!cloudUpdatedAt) return false;
  if (!localUpdatedAt) return true;
  return cloudUpdatedAt >= localUpdatedAt;
}

function sanitizeAccountProfileError(error: unknown): string {
  return (
    formatErrorMessage(error)
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      .slice(0, 160) || "Reader profile sync failed."
  );
}

function getAccountProfileModeLabel(authState: ReturnType<typeof useAuth>) {
  if (!authState.authConfigured) return "auth disabled";
  return authState.currentUser ? "signed in" : "signed out";
}

function getAccountProfileSyncRows({
  authState,
  cloudReaderProfileSync,
  readerProfile,
  savedStoriesCount,
  storyFitSelectedCount,
}: {
  authState: ReturnType<typeof useAuth>;
  cloudReaderProfileSync: CloudReaderProfileSyncState;
  readerProfile: ReaderProfile;
  savedStoriesCount: number;
  storyFitSelectedCount: number;
}) {
  return [
    { label: "Account mode", value: getAccountProfileModeLabel(authState) },
    { label: "Signed-in email", value: authState.currentUser?.email ?? "none" },
    { label: "Profile source", value: cloudReaderProfileSync.source },
    { label: "Cloud profile status", value: cloudReaderProfileSync.status },
    {
      label: "Last cloud load status",
      value: cloudReaderProfileSync.lastLoadStatus || "none",
    },
    {
      label: "Last save outcome",
      value: cloudReaderProfileSync.lastSaveOutcome,
    },
    {
      label: "Local profile updated",
      value: readerProfile.updatedAt || "none",
    },
    {
      label: "Cloud profile updated",
      value: cloudReaderProfileSync.cloudUpdatedAt || "none",
    },
    {
      label: "Last sync time",
      value: cloudReaderProfileSync.lastSyncAt || "none",
    },
    {
      label: "Story Fit Profile version",
      value:
        readerProfile.explicitReaderPreferences.storyFitProfileVersion ||
        "none",
    },
    {
      label: "Story Fit Profile saved",
      value: hasStoryFitProfileV2Selections(
        readerProfile.explicitReaderPreferences,
      )
        ? "yes"
        : "no",
    },
    {
      label: "Story Fit selected count total",
      value: String(storyFitSelectedCount),
    },
    { label: "Saved stories count", value: String(savedStoriesCount) },
    {
      label: "Last sync error",
      value: cloudReaderProfileSync.lastError
        ? sanitizeAccountProfileError(cloudReaderProfileSync.lastError)
        : "none",
    },
    cloudReaderProfileSync.ownerId && cloudReaderProfileSync.ownerId !== "none"
      ? {
          label: "Account id",
          value: maskAccountIdentifier(cloudReaderProfileSync.ownerId),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
}

function hasReaderMemorySignals(
  readerProfile: ReaderProfile,
  canonicalProfile: CanonicalReaderProfile | null,
) {
  return Boolean(
    readerProfile.profileExists ||
    readerProfile.latestMood ||
    readerProfile.moodHistory.length ||
    readerProfile.storyFeedbackSignals?.length ||
    readerProfile.readyStoryQueueSignals?.length ||
    canonicalProfile?.signals.feedbackSignalCount ||
    canonicalProfile?.signals.storyCardSignalCount ||
    canonicalProfile?.signals.savedForLaterCount,
  );
}

function buildAccountDataExport({
  accountMode,
  authState,
  canonicalProfile,
  inputArtifacts,
  readerProfile,
  savedForLaterStoryQueue,
  savedStories,
  summary,
}: {
  accountMode: AccountDataMode;
  authState: ReturnType<typeof useAuth>;
  canonicalProfile: CanonicalReaderProfile | null;
  inputArtifacts: InputArtifact[];
  readerProfile: ReaderProfile;
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  savedStories: SavedStory[];
  summary: AccountProfileSummary;
}): AccountDataExportV1 {
  const worlds = inputArtifacts.filter(
    (artifact) => artifact.type === "worldBible",
  );
  const characters = inputArtifacts.filter(
    (artifact) => artifact.type === "characterProfiles",
  );
  const storySparks = inputArtifacts.filter(
    (artifact) => artifact.type === "storySeed",
  );
  return {
    exportVersion: "account-data-v1",
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    account: {
      accountMode,
      ...(summary.profileId ? { profileId: summary.profileId } : {}),
      ...(authState.currentUser?.email
        ? { email: authState.currentUser.email }
        : {}),
    },
    storyFitProfileV2Preferences: {
      ...readerProfile.explicitReaderPreferences,
    },
    storyFitPreferences: readerProfile.explicitReaderPreferences,
    readerProfile: { local: readerProfile, canonical: canonicalProfile },
    feedbackSignals: {
      local: readerProfile.storyFeedbackSignals ?? [],
      canonicalRecentFeedback: canonicalProfile?.recentFeedback ?? [],
    },
    savedContentSummary: {
      savedStories: savedStories.length,
      series: groupStoriesBySeries(savedStories).length,
      characters: characters.length || summary.counts.characters,
      worlds: worlds.length,
      storySparks: storySparks.length + savedForLaterStoryQueue.length,
    },
    savedContent: {
      stories: savedStories,
      series: groupStoriesBySeries(savedStories).map((series) => ({
        seriesId: series.seriesId,
        title: series.title,
        episodeCount: series.episodes.length,
      })),
      characters,
      worlds,
      storySparks: [...storySparks, ...savedForLaterStoryQueue],
    },
  };
}

function downloadJsonFile(filename: string, data: unknown) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

function PreferenceChipGroup({
  label,
  onToggle,
  options,
  selected,
}: {
  label: string;
  onToggle: (value: string) => void;
  options: string[];
  selected: string[];
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-paper">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              className={`min-h-10 rounded-full border px-3 py-2 text-xs font-semibold transition ${isSelected ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper/70"}`}
              key={option}
              onClick={() => onToggle(option)}
              type="button"
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreferenceSelect({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-paper">{label}</span>
      <select
        className="min-h-11 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper outline-none focus:border-lantern-gold"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function AccountCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-paper/12 bg-paper/10 p-4">
      <h2 className="text-xl font-semibold text-paper">{title}</h2>
      <div className="mt-4 grid gap-4">{children}</div>
    </article>
  );
}

function ProfileSummaryRow({
  empty,
  label,
  values,
}: {
  empty: string;
  label: string;
  values: string[];
}) {
  const safeValues = values.map((value) => value.trim()).filter(Boolean);
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
        {label}
      </p>
      {safeValues.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {safeValues.map((value) => (
            <span
              className="rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-3 py-1 text-xs font-semibold text-lantern-gold"
              key={value}
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm leading-6 text-paper/60">{empty}</p>
      )}
    </div>
  );
}

function LibraryView(props: {
  cloudMessage: string;
  cloudProjects: CloudProjectSummary[];
  isCloudLoading: boolean;
  onDeleteCloudProject: () => void;
  onDeleteProject: () => void;
  onDeleteStory: (storyId: string) => void;
  onLoadCloudProject: (projectId: string) => void;
  onLoadProject: (projectId: string) => void;
  onMoveSavedForLaterToWaitingQueue: (item: ReadyStoryQueueItem) => void;
  onContinueSavedStoryById: (storyId: string) => void;
  onOpenSavedStoryById: (storyId: string) => void;
  onProjectNameChange: (name: string) => void;
  onReadSavedForLater: (item: ReadyStoryQueueItem) => void;
  onRefreshCloud: () => void;
  onRemoveSavedForLater: (item: ReadyStoryQueueItem) => void;
  onSaveCloudProject: () => void;
  onSaveProject: () => void;
  onSaveStory: () => void;
  projectName: string;
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  savedProjects: SavedProject[];
  savedStories: SavedStory[];
  selectedCloudProjectId: string;
  selectedProjectId: string;
  storyResponse: GenerateStoryResponse | null;
}) {
  const {
    onDeleteStory,
    onMoveSavedForLaterToWaitingQueue,
    onOpenSavedStoryById,
    onReadSavedForLater,
    onRemoveSavedForLater,
    savedForLaterStoryQueue,
    savedStories,
  } = props;
  const libraryStoryRows = savedStories.map((story) => ({
    story,
    kind: "saved" as const,
  }));
  const seriesGroups = groupStoriesBySeries(
    libraryStoryRows.map((row) => row.story),
  ).map((group) => ({
    ...group,
    episodes: group.episodes.map((episode) => ({
      ...episode,
      row: libraryStoryRows[episode.originalIndex],
    })),
  }));
  const hasGeneratedStoryRows = seriesGroups.length > 0;

  return (
    <section className="bloodwick-shelf mx-auto grid w-full max-w-4xl min-w-0 gap-5 pb-8 md:pb-0">
      <div className="bloodwick-shelf-header p-4 md:p-5">
        <PageHeading
          eyebrow="SHELF"
          title="Shelf"
          body="Saved and recent Bloodwick stories live here."
        />
      </div>
      <section className="grid min-w-0 gap-4">
        <section className="bloodwick-shelf-saved-later grid min-w-0 gap-3 p-4">
          <div>
            <h2 className="text-lg font-semibold text-paper">
              Saved for later
            </h2>
            <p className="mt-1 text-sm leading-6 text-paper/60">
              Story choices you saved for later.
            </p>
          </div>
          {savedForLaterStoryQueue.length ? (
            savedForLaterStoryQueue.map((item) => (
              <SavedForLaterStoryCard
                item={item}
                key={item.id}
                onMoveToWaitingQueue={() =>
                  onMoveSavedForLaterToWaitingQueue(item)
                }
                onRead={() => onReadSavedForLater(item)}
                onRemove={() => onRemoveSavedForLater(item)}
              />
            ))
          ) : (
            <p className="bloodwick-shelf-empty-state bloodwick-shelf-meta rounded-md px-3 py-3 text-sm">
              No saved-for-later stories yet.
            </p>
          )}
        </section>
        {!hasGeneratedStoryRows ? (
          <EmptyPanel
            title="No saved or recent stories yet"
            body="Generate a story or save one for later and it will appear here."
          />
        ) : null}
        <div className="bloodwick-shelf-series-list">
          {seriesGroups.map((group) => (
            <SeriesLibraryGroup
              key={group.seriesId}
              group={group}
              onDeleteStory={onDeleteStory}
              onOpenSavedStoryById={onOpenSavedStoryById}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

type LibraryStoryRow = { story: SavedStory; kind: "saved" };
type LibrarySeriesGroupWithRows = Omit<
  LibrarySeriesGroup<LibraryStory>,
  "episodes"
> & { episodes: Array<SeriesEpisode<LibraryStory> & { row: LibraryStoryRow }> };

function SeriesLibraryGroup({
  group,
  onDeleteStory,
  onOpenSavedStoryById,
}: {
  group: LibrarySeriesGroupWithRows;
  onDeleteStory: (storyId: string) => void;
  onOpenSavedStoryById: (storyId: string) => void;
}) {
  const [selectedStoryId, setSelectedStoryId] = useState(
    () => group.episodes[0]?.story.id ?? "",
  );
  const [recapStory, setRecapStory] = useState<LibraryStory | null>(null);
  const [deleteStory, setDeleteStory] = useState<LibraryStory | null>(null);
  const selectedEpisode =
    group.episodes.find((episode) => episode.story.id === selectedStoryId) ??
    group.episodes[0];
  const selectedStory = selectedEpisode?.story;
  const rawFearTag = group.episodes
    .map((episode) => getLibraryStoryCategoryLabel(episode.story).trim())
    .find(Boolean);
  const normalizedFearTag = normalizeBloodwickFearCategory(rawFearTag);
  const fearTag = normalizedFearTag ?? rawFearTag;
  const fearArt = getBloodwickFearArt(normalizedFearTag);
  const updatedLabel = group.lastUpdatedAt
    ? `Updated ${formatDateTime(group.lastUpdatedAt)}`
    : "Not updated yet";
  const title = group.title?.trim() || "Untitled Series";
  const recapText = selectedStory ? getShelfEpisodeRecapText(selectedStory) : "";

  return (
    <article
      className="bloodwick-shelf-series-card"
      data-mobile-library-series-group="true"
    >
      <div className="bloodwick-shelf-card-top">
        <div className="bloodwick-shelf-series-media" aria-hidden="true">
          {fearArt.src ? (
            <img
              alt=""
              className="bloodwick-shelf-series-image"
              src={fearArt.src}
            />
          ) : (
            <div className="bloodwick-shelf-series-image-fallback" />
          )}
          <div className="bloodwick-shelf-series-image-overlay" />
        </div>
        <div className="bloodwick-shelf-series-main">
          <div className="min-w-0">
            <h3 className="bloodwick-shelf-series-title break-words text-lg font-semibold leading-tight">
              {title}
            </h3>
            {fearTag ? (
              <span className="bloodwick-shelf-tag mt-2">{fearTag}</span>
            ) : null}
            <p className="bloodwick-shelf-meta mt-2 text-sm leading-6">
              {group.episodeCount}{" "}
              {group.episodeCount === 1 ? "Episode" : "Episodes"} · {updatedLabel}
            </p>
          </div>
        </div>
      </div>

      {selectedStory ? (
        <div className="bloodwick-shelf-selected-episode">
          <p className="text-xs font-semibold uppercase tracking-[0.12em]">
            Selected episode
          </p>
          <h4 className="bloodwick-shelf-episode-title mt-1 break-words text-base font-semibold leading-snug">
            Episode {selectedEpisode.episodeNumber}: {selectedStory.title}
          </h4>
          <p className="bloodwick-shelf-meta mt-1 text-xs leading-5">
            {formatDateTime(selectedStory.createdAt)} · {selectedStory.wordCount.toLocaleString()}{" "}
            words
          </p>
        </div>
      ) : null}

      {selectedStory ? (
        <div
          className="bloodwick-shelf-actions"
          data-mobile-library-card-actions="true"
        >
          <button
            className="bloodwick-shelf-action-primary"
            onClick={() => onOpenSavedStoryById(selectedStory.id)}
            type="button"
          >
            Open
          </button>
          <button
            className="bloodwick-shelf-action-secondary"
            disabled={!recapText}
            onClick={() => setRecapStory(selectedStory)}
            type="button"
          >
            Recap
          </button>
          <button
            aria-label="Delete episode"
            className="bloodwick-shelf-action-icon"
            onClick={() => setDeleteStory(selectedStory)}
            type="button"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" focusable="false">
              <path
                d="M7 3.5h6M4.5 6h11M6 6l.7 10.5h6.6L14 6M8.5 8.5v5M11.5 8.5v5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>
      ) : null}

      <div className="bloodwick-shelf-episode-rail">
        <div
          className="bloodwick-shelf-episode-pills"
          aria-label={`${title} episodes`}
        >
          {group.episodes.map((episode) => (
            <button
              aria-pressed={episode.story.id === selectedStory?.id}
              className="bloodwick-shelf-episode-chip"
              key={episode.story.id}
              onClick={() => setSelectedStoryId(episode.story.id)}
              type="button"
            >
              Ep. {episode.episodeNumber}
            </button>
          ))}
        </div>
      </div>

      {recapStory ? (
        <ShelfRecapModal
          onClose={() => setRecapStory(null)}
          recap={getShelfEpisodeRecapText(recapStory)}
          title={recapStory.title}
        />
      ) : null}

      {deleteStory ? (
        <ShelfDeleteConfirmModal
          onCancel={() => setDeleteStory(null)}
          onConfirm={() => {
            onDeleteStory(deleteStory.id);
            setDeleteStory(null);
          }}
        />
      ) : null}
    </article>
  );
}

function ShelfRecapModal({
  onClose,
  recap,
  title,
}: {
  onClose: () => void;
  recap: string;
  title: string;
}) {
  return (
    <div className="bloodwick-shelf-modal">
      <div
        aria-modal="true"
        aria-label={`${title} recap`}
        className="bloodwick-shelf-modal-panel"
        role="dialog"
      >
        <div className="bloodwick-shelf-modal-header">
          <h3 className="bloodwick-shelf-modal-title">Last time</h3>
          <button
            className="bloodwick-shelf-modal-close"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>
        <p className="bloodwick-shelf-modal-body">{recap}</p>
      </div>
    </div>
  );
}

function ShelfDeleteConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="bloodwick-shelf-modal">
      <div
        aria-modal="true"
        aria-labelledby="bloodwick-shelf-delete-title"
        className="bloodwick-shelf-modal-panel bloodwick-shelf-confirm-panel"
        role="dialog"
      >
        <div className="bloodwick-shelf-modal-header">
          <h3
            className="bloodwick-shelf-modal-title"
            id="bloodwick-shelf-delete-title"
          >
            Delete episode?
          </h3>
        </div>
        <p className="bloodwick-shelf-modal-body">
          This will remove the selected episode from your Shelf.
        </p>
        <div className="bloodwick-shelf-confirm-actions">
          <button
            className="bloodwick-shelf-confirm-cancel"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="bloodwick-shelf-confirm-delete"
            onClick={onConfirm}
            type="button"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function getShelfEpisodeRecapText(story: LibraryStory): string {
  return createStoryBrief(story).recap || truncateText(story.story, 900);
}

function SavedForLaterStoryCard({
  item,
  onMoveToWaitingQueue,
  onRead,
  onRemove,
}: {
  item: ReadyStoryQueueItem;
  onMoveToWaitingQueue: () => void;
  onRead: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="bloodwick-shelf-series-card min-w-0">
      <div className="bloodwick-shelf-series-header">
        <div className="min-w-0">
          <h3 className="bloodwick-shelf-series-title text-base font-semibold">
            {item.title}
          </h3>
          <p className="bloodwick-shelf-meta mt-1 text-sm leading-6">
            {item.genre} | {item.mood}
          </p>
        </div>
        <span className="bloodwick-shelf-tag">Saved for later</span>
      </div>
      <p className="bloodwick-shelf-meta mt-3 text-sm leading-6">
        {item.premise}
      </p>
      <p className="mt-2 text-xs font-semibold text-lantern-gold/80">
        {formatReadyStoryCreatorCredit(item)}
      </p>
      <p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-paper/40">
        {item.provenance ?? "unknown provenance"} ·{" "}
        {item.ipMarking ?? "unmarked"}
      </p>
      <dl className="mt-4 grid gap-2 text-sm text-paper/65 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">
            Hero
          </dt>
          <dd className="mt-1 text-paper/75">{item.heroName}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">
            Role
          </dt>
          <dd className="mt-1 text-paper/75">{item.heroRole}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">
            World
          </dt>
          <dd className="mt-1 text-paper/75">{item.worldName}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <SmallButton onClick={onRead}>Read</SmallButton>
        <SmallButton onClick={onMoveToWaitingQueue}>
          Move back to waiting queue
        </SmallButton>
        <SmallButton onClick={onRemove}>Remove</SmallButton>
      </div>
    </article>
  );
}


function CharactersView({
  onOpenStory,
}: {
  onOpenStory: (story: StoryStart) => void;
}) {
  const characterStories = SUGGESTED_STORY_STARTS.filter(
    (story) => story.heroName,
  );
  return (
    <section className="grid min-w-0 gap-5">
      <PageHeading
        eyebrow="Cast"
        title="Characters / Cast"
        body="Character cards now live outside Home and link back to their stories where possible."
      />
      {characterStories.length === 0 ? (
        <EmptyPanel
          title="No character cards yet"
          body="Characters will appear here once story references are available."
        />
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {characterStories.map((story) => (
            <article
              className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"
              key={story.heroName}
            >
              <div className="flex min-w-0 items-start gap-4">
                <HeroPortrait name={story.heroName} size="large" />
                <div className="min-w-0 flex-1">
                  <h3 className="break-normal text-lg font-semibold leading-snug text-paper [overflow-wrap:normal]">
                    {story.heroName}
                  </h3>
                  <p className="mt-1 break-normal text-sm font-semibold leading-5 text-lantern-gold [overflow-wrap:normal]">
                    {story.heroRole}
                  </p>
                </div>
              </div>
              <p className="mt-4 w-full text-sm leading-6 text-paper/70">
                {story.heroBio}
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                Appears in
              </p>
              <button
                className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4"
                onClick={() => onOpenStory(story)}
                type="button"
              >
                {story.title}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WorldsView({
  onOpenStory,
}: {
  onOpenStory: (story: StoryStart) => void;
}) {
  const worldStories = SUGGESTED_STORY_STARTS.filter(
    (story) => story.worldName,
  );
  return (
    <section className="grid min-w-0 gap-5">
      <PageHeading
        eyebrow="Worlds"
        title="Worlds"
        body="Storyworld cards are reachable as their own app destination."
      />
      {worldStories.length === 0 ? (
        <EmptyPanel
          title="No worlds yet"
          body="World cards will appear here once storyworld references are available."
        />
      ) : (
        <div className="grid min-w-0 gap-4 md:grid-cols-2">
          {worldStories.map((story) => (
            <article
              className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"
              key={story.worldName}
            >
              <div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                <CoverArt
                  label={story.mood}
                  title={story.worldName}
                  tone="cool"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-paper">
                    {story.worldName}
                  </h3>
                  <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    <Tag>{story.genre}</Tag>
                    <Tag>{story.mood}</Tag>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-paper/70">
                    {story.world}
                  </p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">
                    Appears in
                  </p>
                  <button
                    className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4"
                    onClick={() => onOpenStory(story)}
                    type="button"
                  >
                    {story.title}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function MoodIntakeView({
  onCancel,
  onSubmit,
  pendingStoryTitle,
}: {
  onCancel: () => void;
  onSubmit: (draft: ReaderMoodDraft) => void;
  pendingStoryTitle: string | null;
}) {
  const [form, setForm] = useState<MoodIntakeFormState>(EMPTY_MOOD_INTAKE_FORM);
  const canSubmit = Boolean(form.mood.trim() && form.desiredFeeling.trim());

  function updateField<K extends keyof MoodIntakeFormState>(
    field: K,
    value: MoodIntakeFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-5 rounded-md border border-lantern-gold/25 bg-paper/10 p-5 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">
          Reader pulse
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-paper">
          What do you need from this story?
        </h2>
        <p className="mt-2 text-sm leading-6 text-paper/65">
          {pendingStoryTitle
            ? `${pendingStoryTitle} is ready. First, tell Bloodwick what kind of reading moment this should become.`
            : "Before Bloodwick writes, give it the shape of your day and the kind of story you want right now."}
        </p>
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(form);
        }}
      >
        <IntakeTextArea
          label="What kind of day are you having?"
          onChange={(value) => updateField("mood", value)}
          placeholder="Tired but hopeful, restless, overloaded, curious, quiet..."
          required
          value={form.mood}
        />
        <IntakeTextArea
          label="What do you want this story to feel like?"
          onChange={(value) => updateField("desiredFeeling", value)}
          placeholder="Comforting but not cheesy, eerie but not bleak, adventurous, funny, meaningful..."
          required
          value={form.desiredFeeling}
        />
        <SegmentedChoice
          label="Energy level"
          onChange={(value) =>
            updateField("energyLevel", value as ReaderEnergyLevel)
          }
          options={[
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ]}
          value={form.energyLevel}
        />
        <SegmentedChoice
          label="Preferred intensity"
          onChange={(value) =>
            updateField("intensityLevel", value as ReaderIntensityLevel)
          }
          options={[
            { label: "Gentle", value: "gentle" },
            { label: "Moderate", value: "moderate" },
            { label: "Intense", value: "intense" },
          ]}
          value={form.intensityLevel}
        />
        <IntakeTextArea
          label="Anything to avoid?"
          onChange={(value) => updateField("avoidances", value)}
          placeholder="No gore, no ghosts, no dead pets, no bleak ending..."
          value={form.avoidances}
        />
        <IntakeTextArea
          label="What do you need right now?"
          onChange={(value) => updateField("needRightNow", value)}
          placeholder="A reason to keep going, a mystery to disappear into, something warm before bed..."
          value={form.needRightNow}
        />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            className="rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
            type="submit"
          >
            Save pulse
          </button>
          <button
            className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-bloodwick-copper"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}

function IntakeTextArea({
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-paper">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        className="min-h-24 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold focus:ring-2 focus:ring-lantern-gold/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SegmentedChoice({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-paper">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${value === option.value ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper"}`}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function createEmptyLastNewStoryPersonalization(): LastNewStoryPersonalization {
  return {
    profileUsed: false,
    profileSourceUsed: "none",
    profileConfidence: "unavailable",
    lastGenerationMode: "none",
    lastGenerationTrigger: "none",
    moodSignal: "none",
    genreSignal: "none",
    hardAvoidancesIncluded: false,
    userHardAvoidancesSummary: "none",
    defaultEerieSafetyGuardrailsSummary:
      DEFAULT_READER_SAFETY_GUARDRAILS.join(", "),
    eerieSignalsIncluded: false,
    continuationStoryIdIncludedInLastNewStoryRequest: false,
    feedbackIncluded: false,
    latestStoryFeedbackSummary: "No prior story feedback available.",
    summary: "No new-story generation personalization has been applied yet.",
    identityDiagnostics: {
      identity: null,
      continuationContextIncluded: false,
      newSeriesCreated: false,
      trigger: "none",
      activeCommittedStoryId: "none",
      activeCommittedSeriesId: "none",
      pendingGenerationMode: "none",
      lastGenerationCancelledOrAborted: false,
    },
  };
}

function readerTasteProfileFromEerieProfile(eerieProfile: EerieReaderProfile) {
  const updatedAt = eerieProfile.updatedAt || new Date().toISOString();
  const convertPreference = (
    preference: EerieReaderProfile["fearIntensity"],
  ) => ({
    value: preference.value,
    confidence: preference.confidence,
    source: "legacy-eerie-profile" as const,
    updatedAt: preference.updatedAt || updatedAt,
  });

  return normalizeReaderTasteProfile({
    profileConfidence: eerieProfile.profileConfidence,
    fearIntensity: convertPreference(eerieProfile.fearIntensity),
    weirdnessTolerance: convertPreference(eerieProfile.weirdnessTolerance),
    supernaturalAffinity: convertPreference(eerieProfile.supernaturalAffinity),
    ambiguityTolerance: convertPreference(eerieProfile.ambiguityTolerance),
    goreTolerance: convertPreference(eerieProfile.goreTolerance),
    sleepSafePreference: convertPreference(eerieProfile.sleepSafePreference),
    preferredFormat: eerieProfile.preferredFormat,
    preferredDurationMinutes: eerieProfile.preferredDurationMinutes,
    defaultSafetyGuardrails: eerieProfile.hardAvoidances,
    userHardAvoidances: [],
    affinities: Object.fromEntries(
      Object.entries(eerieProfile.affinities).map(([key, preference]) => [
        key,
        convertPreference(preference),
      ]),
    ),
    source: "legacy-eerie-profile",
    updatedAt,
  });
}

function shouldMirrorEerieProfileToReaderTasteProfile(
  profile: ReaderProfile,
): boolean {
  return !profile.tasteProfile || profile.tasteProfile.source === "default";
}

function buildNewStoryPersonalization({
  canonicalProfile,
  continuationStoryId,
  eerieProfile,
  genre,
  mode,
  profile,
  source,
  trigger,
}: {
  canonicalProfile: CanonicalReaderProfile;
  continuationStoryId: string;
  eerieProfile: EerieReaderProfile;
  genre: GenrePreset;
  mode: Exclude<GenerationSource, null>;
  profile: ReaderProfile;
  source: ProfileSourceUsed;
  trigger: ReaderProfileEventSource;
}): {
  diagnostics: LastNewStoryPersonalization;
  prompt: string;
  snapshot: ReaderProfileGenerationSnapshot;
} {
  if (mode === "continue-story") {
    const snapshot = createReaderProfileGenerationSnapshot({
      defaultSafetyGuardrails: DEFAULT_READER_SAFETY_GUARDRAILS,
      feedbackIncluded: false,
      genreSignal: genre,
      mode,
      moodSignal: profile.latestMood?.mood ?? "none",
      profile,
      profileSource: "none",
      profileUsed: false,
      tasteProfile: profile.tasteProfile ?? null,
      userHardAvoidances: [],
      canonicalProfile,
    });

    return {
      diagnostics: {
        ...createEmptyLastNewStoryPersonalization(),
        lastGenerationMode: "continue-story",
        lastGenerationTrigger: trigger,
        profileSourceUsed: "none",
        continuationStoryIdIncludedInLastNewStoryRequest: false,
        summary:
          "Continuation generation did not use new-story reader profile personalization.",
      },
      prompt: "",
      snapshot,
    };
  }

  const topMood = getTopCount(profile.moodCounts);
  const topGenre = getTopCount(profile.genreCounts);
  const confidence = getReaderProfileConfidence(profile);
  const tasteProfile =
    profile.tasteProfile ?? readerTasteProfileFromEerieProfile(eerieProfile);
  const userHardAvoidances = dedupe([
    ...splitAvoidances(profile.latestMood?.avoidances),
    ...(tasteProfile.userHardAvoidances ?? []),
  ]);
  const defaultEerieSafetyGuardrails = dedupe(
    tasteProfile.defaultSafetyGuardrails?.length
      ? tasteProfile.defaultSafetyGuardrails
      : DEFAULT_READER_SAFETY_GUARDRAILS,
  );
  const profileUsed = profile.profileExists;
  const feedbackSummary = summarizeStoryFeedback(profile.storyFeedbackSignals);
  const feedbackIncluded =
    feedbackSummary !== "No prior story feedback available.";
  const profileSource = profileUsed && source === "none" ? "local" : source;
  const includeEerieSignals = shouldUseEerieSignalsForGenre(genre);
  const weakly =
    confidence === "low"
      ? "Treat these as weak preferences, not hard rules."
      : "Treat these as preferences, not hard rules.";
  const prompt = profileUsed
    ? [
        "Controlled reader-profile personalization for this brand-new story only:",
        `- Profile source: ${profileSource}. Profile confidence: ${confidence}. Taste profile source: ${tasteProfile.source}. ${weakly}`,
        `- Top mood signal: ${topMood ?? profile.latestMood?.mood ?? "none"}.`,
        `- Top genre signal: ${topGenre ?? "none"}. Current selected genre: ${genre}.`,
        `- Preferred format: ${tasteProfile.preferredFormat}. Preferred duration: ${tasteProfile.preferredDurationMinutes} minutes.`,
        `- Engagement totals: generated ${profile.counters.totalStoriesGenerated}, opened ${profile.counters.totalStoriesOpened}, continued ${profile.counters.totalContinues}.`,
        `- Mood selection counts: ${formatCounts(profile.moodCounts)}.`,
        `- Genre counts: ${formatCounts(profile.genreCounts)}.`,
        `- Recent story feedback, as weak preference guidance: ${feedbackSummary}`,
        hasReaderProfilePreferences(profile.explicitReaderPreferences)
          ? `- Explicit reader preferences: ${formatExplicitReaderPreferencesForGeneration(profile.explicitReaderPreferences)}.`
          : "- Explicit reader preferences: none saved.",
        userHardAvoidances.length
          ? `- User hard avoidances, as hard constraints: ${userHardAvoidances.join(", ")}.`
          : "- User hard avoidances: none recorded.",
        defaultEerieSafetyGuardrails.length
          ? `- Default/eerie safety guardrails, not user-entered avoidances: ${defaultEerieSafetyGuardrails.join(", ")}.`
          : "- Default/eerie safety guardrails: none recorded.",
        includeEerieSignals
          ? `- Taste profile guidance: fear intensity ${formatWeightedPreference(tasteProfile.fearIntensity)}, weirdness tolerance ${formatWeightedPreference(tasteProfile.weirdnessTolerance)}, supernatural affinity ${formatWeightedPreference(tasteProfile.supernaturalAffinity)}, ambiguity tolerance ${formatWeightedPreference(tasteProfile.ambiguityTolerance)}, gore tolerance ${formatWeightedPreference(tasteProfile.goreTolerance)} as a safety constraint, sleep-safe preference ${formatWeightedPreference(tasteProfile.sleepSafePreference)}.`
          : "- Eerie profile signals are present but should be used only lightly because the selected genre is not primarily eerie/horror/dark-adjacent. Do not let horror preferences dominate.",
        "Do not mention personalization or the reader profile in the story.",
      ].join("\n")
    : "";

  const snapshot = createReaderProfileGenerationSnapshot({
    defaultSafetyGuardrails: defaultEerieSafetyGuardrails,
    feedbackIncluded: profileUsed && feedbackIncluded,
    genreSignal: topGenre ?? genre,
    mode,
    moodSignal: topMood ?? profile.latestMood?.mood ?? "none",
    profile,
    profileSource: profileUsed ? profileSource : "none",
    profileUsed,
    tasteProfile,
    userHardAvoidances,
    canonicalProfile,
  });

  return {
    diagnostics: {
      profileUsed,
      profileSourceUsed: profileUsed ? profileSource : "none",
      profileConfidence: profileUsed ? confidence : "unavailable",
      lastGenerationMode: "new-story",
      lastGenerationTrigger: trigger,
      moodSignal: topMood ?? profile.latestMood?.mood ?? "none",
      genreSignal: topGenre ?? genre,
      hardAvoidancesIncluded: profileUsed && userHardAvoidances.length > 0,
      userHardAvoidancesSummary: userHardAvoidances.length
        ? userHardAvoidances.join(", ")
        : "none",
      defaultEerieSafetyGuardrailsSummary: defaultEerieSafetyGuardrails.length
        ? defaultEerieSafetyGuardrails.join(", ")
        : "none",
      eerieSignalsIncluded: profileUsed,
      continuationStoryIdIncludedInLastNewStoryRequest:
        Boolean(continuationStoryId),
      feedbackIncluded: profileUsed && feedbackIncluded,
      identityDiagnostics:
        createEmptyLastNewStoryPersonalization().identityDiagnostics,
      latestStoryFeedbackSummary: feedbackSummary,
      summary: profileUsed
        ? `Used ${confidence}-confidence reader profile ${confidence === "low" ? "lightly" : "as preference guidance"}: favored ${topGenre ?? genre} and ${topMood ?? profile.latestMood?.mood ?? "available mood"} mood; ${userHardAvoidances.length ? "included user hard avoidances" : "no user hard avoidances found"}; ${feedbackIncluded ? "included recent story feedback as weak guidance" : "no story feedback found"}; ${includeEerieSignals ? "included taste profile guidance without forcing horror." : "did not force eerie preferences."}`
        : "No persisted reader profile was available; generated with the existing new-story inputs only.",
    },
    prompt,
    snapshot,
  };
}

function createReaderProfileGenerationSnapshot({
  canonicalProfile,
  defaultSafetyGuardrails,
  feedbackIncluded,
  genreSignal,
  mode,
  moodSignal,
  profile,
  profileSource,
  profileUsed,
  tasteProfile,
  userHardAvoidances,
}: {
  canonicalProfile: CanonicalReaderProfile;
  defaultSafetyGuardrails: string[];
  feedbackIncluded: boolean;
  genreSignal: string;
  mode: Exclude<GenerationSource, null>;
  moodSignal: string;
  profile: ReaderProfile;
  profileSource: ProfileSourceUsed;
  profileUsed: boolean;
  tasteProfile: ReaderProfile["tasteProfile"] | null;
  userHardAvoidances: string[];
}): ReaderProfileGenerationSnapshot {
  const feedbackSignals = profile.storyFeedbackSignals ?? [];
  const latestFeedback = [...feedbackSignals].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];

  return {
    mode,
    profileUsed,
    profileSourceUsed: profileSource,
    profileUpdatedAt: profileUsed ? profile.updatedAt : "none",
    profileConfidence: profileUsed
      ? getReaderProfileConfidence(profile)
      : "unavailable",
    tasteProfilePresent: Boolean(tasteProfile),
    tasteProfileSource: tasteProfile?.source ?? "none",
    tasteProfileUpdatedAt: tasteProfile?.updatedAt ?? "none",
    feedbackSignalCount: feedbackSignals.length,
    feedbackIncluded,
    latestFeedbackRating: latestFeedback?.rating ?? "none",
    userHardAvoidanceCount: userHardAvoidances.length,
    userHardAvoidancesSummary: userHardAvoidances.length
      ? userHardAvoidances.join(", ")
      : "none",
    defaultSafetyGuardrailCount: defaultSafetyGuardrails.length,
    defaultSafetyGuardrailsSummary: defaultSafetyGuardrails.length
      ? defaultSafetyGuardrails.join(", ")
      : "none",
    explicitReaderPreferencesForGeneration: {
      storyFitProfileVersion:
        profile.explicitReaderPreferences.storyFitProfileVersion,
      preferredStoryTypes:
        profile.explicitReaderPreferences.preferredStoryTypes,
      emotionalPromises:
        profile.explicitReaderPreferences.emotionalPromises ?? [],
      favoriteStoryWorlds:
        profile.explicitReaderPreferences.favoriteStoryWorlds ?? [],
      storyIngredients: profile.explicitReaderPreferences.storyIngredients,
      characterLensPreferences:
        profile.explicitReaderPreferences.characterLensPreferences ?? [],
      protagonistLensPreferences:
        profile.explicitReaderPreferences.protagonistLensPreferences ?? [],
      narrativePressurePreferences:
        profile.explicitReaderPreferences.narrativePressurePreferences ?? [],
      episodeEndingShapePreferences:
        profile.explicitReaderPreferences.episodeEndingShapePreferences ?? [],
      hardAvoidances: profile.explicitReaderPreferences.hardAvoidances,
      contentLane: profile.explicitReaderPreferences.contentLane,
      narrativePressure: profile.explicitReaderPreferences.narrativePressure,
      episodeEndingShape: profile.explicitReaderPreferences.episodeEndingShape,
      protagonistLens: profile.explicitReaderPreferences.protagonistLens,
    },
    moodSignal,
    genreSignal,
    canonicalReaderProfileUsed: true,
    canonicalReaderProfileInput:
      buildGenerationReaderProfileInput(canonicalProfile),
    generatedAt: new Date().toISOString(),
  };
}

function getContinuationSeriesId(
  story: LibraryStory,
  storyId: string,
  storyResponse: GenerateStoryResponse | null,
  activeCommittedStoryId: string,
  activeCommittedSeriesId: string,
): string {
  if (
    activeCommittedStoryId &&
    activeCommittedSeriesId &&
    storyId === activeCommittedStoryId
  )
    return activeCommittedSeriesId;
  if (storyResponse?.metadata.diagnostics.storyId === storyId)
    return storyResponse.metadata.diagnostics.seriesId;
  if (
    "seriesId" in story &&
    typeof story.seriesId === "string" &&
    story.seriesId.trim()
  )
    return story.seriesId;
  return storyId;
}

function getGenerationTriggerLabel(
  generationMode: GenerationMode,
  source: ReaderProfileEventSource,
): "Start Something New" | "Continue Series" | "Retry/Rewrite" | "Create" {
  if (generationMode === "new_story" && source === "startSomethingNew")
    return "Start Something New";
  if (generationMode === "continue_series") return "Continue Series";
  if (generationMode === "rewrite_retry") return "Retry/Rewrite";
  return "Create";
}

function AppStateDiagnostics({
  accountProfileActionDiagnostics,
  accountSummary,
  activeView,
  activeCommittedSeriesId,
  activeCommittedStoryId,
  cloudSync,
  currentEpisodeNumber,
  currentStoryFeedback,
  currentStoryId,
  feedbackDraftHasUnsavedChanges,
  feedbackSaveBlockedBecauseRatingMissing,
  generationBlockedBecauseUnsavedFeedback,
  generationSource,
  isGenerating,
  lastContinuationBlockedBecauseContextMissing,
  lastContinuationContextIncluded,
  lastGenerationCancelledOrAborted,
  lastGenerationFailureDiagnostic,
  lastGenerationTrigger,
  lastLibraryOpenedEpisodeNumber,
  lastLibraryOpenedStoryId,
  lastNewStoryPersonalization,
  lastReadyStoryPreparationOutcome,
  lastReadyStoryPreparationStatus,
  lastReadyStoryQueueAction,
  lastRequestIncludedContinuationStoryId,
  pendingGenerationMode,
  profile,
  readerScrollDiagnostics,
  readyStoryQueue,
  savedForLaterStoryQueue,
  storyResponseEpisodeMomentum,
  storyTypeSelectionDiagnostics,
  storyFitOnboardingAvailable,
  storyFitOnboardingDismissed,
  storyFitOnboardingCompleted,
  storyFitOnboardingLastOpenedAt,
  storyFitOnboardingLastSavedAt,
}: {
  accountProfileActionDiagnostics: AccountProfileActionDiagnostics;
  accountSummary: AccountProfileSummary;
  cloudSync: CloudReaderProfileSyncState;
  activeView: AppView;
  activeCommittedSeriesId: string;
  activeCommittedStoryId: string;
  currentEpisodeNumber: number | null;
  currentStoryFeedback: StoryFeedbackSignal | null;
  currentStoryId: string;
  feedbackDraftHasUnsavedChanges: boolean;
  feedbackSaveBlockedBecauseRatingMissing: boolean;
  generationBlockedBecauseUnsavedFeedback: boolean;
  generationSource: GenerationSource;
  isGenerating: boolean;
  lastContinuationBlockedBecauseContextMissing: boolean;
  lastContinuationContextIncluded: boolean;
  lastGenerationCancelledOrAborted: boolean;
  lastGenerationFailureDiagnostic: GenerationFailureDiagnostic;
  lastGenerationTrigger: string;
  lastLibraryOpenedEpisodeNumber: number | null;
  lastLibraryOpenedStoryId: string;
  lastNewStoryPersonalization: LastNewStoryPersonalization;
  lastReadyStoryPreparationOutcome: string;
  lastReadyStoryPreparationStatus: string;
  lastReadyStoryQueueAction: string;
  lastRequestIncludedContinuationStoryId: boolean;
  pendingGenerationMode: GenerationMode | "none";
  profile: ReaderProfile;
  readerScrollDiagnostics: ReaderScrollDiagnostics;
  readyStoryQueue: ReadyStoryQueueItem[];
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  storyResponseEpisodeMomentum: EpisodeMomentumDiagnostics | null;
  storyTypeSelectionDiagnostics: StoryTypeSelectionDiagnostics;
  storyFitOnboardingAvailable: boolean;
  storyFitOnboardingDismissed: boolean;
  storyFitOnboardingCompleted: boolean;
  storyFitOnboardingLastOpenedAt: string;
  storyFitOnboardingLastSavedAt: string;
}) {
  return (
    <details className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">
        App state diagnostics
      </summary>
      <div className="mt-3 grid gap-1 sm:grid-cols-2">
        <p>
          <span className="font-semibold text-paper/80">Active view:</span>{" "}
          {activeView}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountShellVersion:
          </span>{" "}
          v1
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            readerPreferencesVersion:
          </span>{" "}
          {READER_PROFILE_PREFERENCES_VERSION}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            explicitReaderPreferencesAvailable:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            explicitReaderPreferencesSaved:
          </span>{" "}
          {hasReaderProfilePreferences(profile.explicitReaderPreferences)
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            explicitReaderPreferencesGenerationLinked:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakGuardEnabled:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            fallbackUserDisplayBlocked:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitLegacyNormalizationEnabled:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitGenerationContextVersion:
          </span>{" "}
          v2
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingVersion:
          </span>{" "}
          v2
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingAvailable:
          </span>{" "}
          {storyFitOnboardingAvailable ? "true" : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingDismissed:
          </span>{" "}
          {storyFitOnboardingDismissed ? "true" : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingCompleted:
          </span>{" "}
          {storyFitOnboardingCompleted ? "true" : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingLastOpenedAt:
          </span>{" "}
          {storyFitOnboardingLastOpenedAt || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingLastSavedAt:
          </span>{" "}
          {storyFitOnboardingLastSavedAt || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingWritesPreferences:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitOnboardingNorthStarTaxonomy:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitProfileVersion:
          </span>{" "}
          {profile.explicitReaderPreferences.storyFitProfileVersion ?? "v1"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitV2HasSavedSelections:
          </span>{" "}
          {hasReaderProfilePreferences(profile.explicitReaderPreferences)
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitV2SelectedCounts:
          </span>{" "}
          {`types=${profile.explicitReaderPreferences.preferredStoryTypes.length}; promises=${profile.explicitReaderPreferences.emotionalPromises?.length ?? 0}; worlds=${profile.explicitReaderPreferences.favoriteStoryWorlds?.length ?? 0}; ingredients=${profile.explicitReaderPreferences.storyIngredients.length}; characterLens=${profile.explicitReaderPreferences.characterLensPreferences?.length ?? 0}; pressure=${profile.explicitReaderPreferences.narrativePressurePreferences?.length ?? 0}; endings=${profile.explicitReaderPreferences.episodeEndingShapePreferences?.length ?? 0}; avoidances=${profile.explicitReaderPreferences.hardAvoidances.length}`}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitV2PluralPressurePresent:
          </span>{" "}
          {Array.isArray(
            profile.explicitReaderPreferences.narrativePressurePreferences,
          )
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitV2PluralEndingPresent:
          </span>{" "}
          {Array.isArray(
            profile.explicitReaderPreferences.episodeEndingShapePreferences,
          )
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyFitV2PluralLensPresent:
          </span>{" "}
          {Array.isArray(
            profile.explicitReaderPreferences.protagonistLensPreferences,
          )
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">accountMode:</span>{" "}
          {accountSummary.accountMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileSyncControlsVersion:
          </span>{" "}
          v1
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            lastAccountProfileAction:
          </span>{" "}
          {accountProfileActionDiagnostics.lastAccountProfileAction}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            lastAccountProfileActionStatus:
          </span>{" "}
          {accountProfileActionDiagnostics.lastAccountProfileActionStatus}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            lastAccountProfileActionMessage:
          </span>{" "}
          {accountProfileActionDiagnostics.lastAccountProfileActionMessage}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            lastAccountProfileActionAt:
          </span>{" "}
          {accountProfileActionDiagnostics.lastAccountProfileActionAt || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileLocalUpdatedAt:
          </span>{" "}
          {profile.updatedAt || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileCloudUpdatedAt:
          </span>{" "}
          {cloudSync.cloudUpdatedAt || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileLocalNewerThanCloud:
          </span>{" "}
          {cloudSync.cloudUpdatedAt &&
          profile.updatedAt > cloudSync.cloudUpdatedAt
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileCloudProfileExists:
          </span>{" "}
          {cloudSync.cloudProfileExists ? "true" : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileStoryFitVersion:
          </span>{" "}
          {profile.explicitReaderPreferences.storyFitProfileVersion || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileStoryFitSelectedCount:
          </span>{" "}
          {countStoryFitSelections(profile.explicitReaderPreferences)}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileRefreshBlockedReason:
          </span>{" "}
          {accountProfileActionDiagnostics.accountProfileRefreshBlockedReason}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            accountProfileSaveBlockedReason:
          </span>{" "}
          {accountProfileActionDiagnostics.accountProfileSaveBlockedReason}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            profileSummaryAvailable:
          </span>{" "}
          {accountSummary.preferredStoryTypes.length ||
          accountSummary.emotionalPromises.length ||
          accountSummary.favoriteStoryWorlds.length ||
          accountSummary.storyIngredients.length ||
          accountSummary.characterLensPreferences.length ||
          accountSummary.hardAvoidances.length ||
          accountSummary.recentFeedback.length
            ? "true"
            : "false"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            savedContentCountsAvailable:
          </span>{" "}
          true
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Generation in progress:
          </span>{" "}
          {isGenerating ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation trigger/source:
          </span>{" "}
          {lastGenerationTrigger}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Active generation source:
          </span>{" "}
          {generationSource ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            generationFailureDiagnosticsVersion:
          </span>{" "}
          v2
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            deployedAppVersion:
          </span>{" "}
          {APP_VERSION}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            latestGenerationAttemptId:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.latestGenerationAttemptId,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyGenerationFailureStage:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyGenerationFailureStage,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyGenerationFailureReason:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyGenerationFailureReason,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyGenerationFailureSource:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyGenerationFailureSource,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyGenerationRetryAttempted:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyGenerationRetryAttempted,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyGenerationRetrySucceeded:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyGenerationRetrySucceeded,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakScanTarget:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyMetadataLeakScanTarget,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakDetected:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyMetadataLeakDetected,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakSanitized:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyMetadataLeakSanitized,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakFinalClean:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyMetadataLeakFinalClean,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyMetadataLeakRemovedPatterns:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyMetadataLeakRemovedPatterns,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyRawCandidateLength:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyRawCandidateLength,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storySanitizedCandidateLength:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storySanitizedCandidateLength,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyRepairAttempted:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.storyRepairAttempted,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            fallbackDisplayBlocked:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.fallbackDisplayBlocked,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationRequestStarted:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationRequestStarted,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationRequestStatus:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationRequestStatus,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationEndpointStatusCode:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationEndpointStatusCode,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchDiagnosticStage:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchDiagnosticStage,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchEndpoint:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchEndpoint,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchAction:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchAction,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchHttpStatus:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchHttpStatus,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchElapsedSeconds:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchElapsedSeconds,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last continuationStoryIdPresent:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.continuationStoryIdPresent,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last selectedSeriesId:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.selectedSeriesId,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last sourceStoryId:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.sourceStoryId,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last priorStoryWordCount:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.priorStoryWordCount,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last priorContextCharsSent:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.priorContextCharsSent,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last totalRequestPayloadApproxChars:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.totalRequestPayloadApproxChars,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last continuation lengthTarget:
          </span>{" "}
          {formatDiagnosticValue(lastGenerationFailureDiagnostic?.lengthTarget)}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchErrorName:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchErrorName,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationFetchErrorMessageSafe:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationFetchErrorMessageSafe,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last authConfigured:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.authConfigured,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last currentUserPresent:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.currentUserPresent,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last authTokenPresent:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.authTokenPresent,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationSucceededButLibrarySaveFailed:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationSucceededButLibrarySaveFailed,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last authRequiredForGeneration:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.authRequiredForGeneration,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last authSessionPresent:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.authSessionPresent,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last requestPayloadValid:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.requestPayloadValid,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last requestPayloadValidationError:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.requestPayloadValidationError,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generationSource:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.generationSource,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last fallbackReached:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.fallbackReached,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last fallbackReason:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.fallbackReason,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last fallbackUserDisplayBlocked:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.fallbackUserDisplayBlocked,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last modelGenerationAttempted:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.modelGenerationAttempted,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last modelGenerationSucceeded:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.modelGenerationSucceeded,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last modelGenerationErrorType:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.modelGenerationErrorType,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last modelGenerationErrorMessageSafe:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.modelGenerationErrorMessageSafe,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last repairAttempted:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.repairAttempted,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last repairSucceeded:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.repairSucceeded,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last metadataLeakGuardTriggered:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.metadataLeakGuardTriggered,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last metadataLeakPatternsFound:
          </span>{" "}
          {formatDiagnosticValue(
            lastGenerationFailureDiagnostic?.metadataLeakPatternsFound,
          )}
        </p>
        <p>
          <span className="font-semibold text-paper/80">Current story ID:</span>{" "}
          {currentStoryId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Active committed storyId:
          </span>{" "}
          {activeCommittedStoryId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Active committed seriesId:
          </span>{" "}
          {activeCommittedSeriesId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Reader current story id:
          </span>{" "}
          {currentStoryId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Reader current series id:
          </span>{" "}
          {activeCommittedSeriesId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Reader current episode number:
          </span>{" "}
          {currentEpisodeNumber ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last library opened story id:
          </span>{" "}
          {lastLibraryOpenedStoryId || "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last library opened episode number:
          </span>{" "}
          {lastLibraryOpenedEpisodeNumber ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Pending generation mode:
          </span>{" "}
          {pendingGenerationMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation cancelled/aborted:
          </span>{" "}
          {lastGenerationCancelledOrAborted ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Current story feedback available:
          </span>{" "}
          {currentStoryId ? "yes" : "no - current story id is missing"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Current story feedback saved:
          </span>{" "}
          {currentStoryFeedback ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Current story feedback rating:
          </span>{" "}
          {currentStoryFeedback?.rating ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Current story feedback reasons:
          </span>{" "}
          {currentStoryFeedback?.reasons.length
            ? currentStoryFeedback.reasons.join(", ")
            : "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Total story feedback signals:
          </span>{" "}
          {profile.storyFeedbackSignals?.length ?? 0}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Ready story queue count:
          </span>{" "}
          {readyStoryQueue.length}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            StorySpark catalog count:
          </span>{" "}
          {STORY_SPARK_CATALOG.length}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            selectedStoryTypeChipId:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedStoryTypeChipId}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            selectedStoryTypeChipLabel:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedStoryTypeChipLabel}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            storyTypeSelectionMode:
          </span>{" "}
          {storyTypeSelectionDiagnostics.storyTypeSelectionMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Available story type chips:
          </span>{" "}
          {storyTypeSelectionDiagnostics.availableChips}
        </p>
        <p>
          <span className="font-semibold text-paper/80">StorySpark used:</span>{" "}
          {storyTypeSelectionDiagnostics.storySparkUsed}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Selected StorySpark id:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedStorySparkId}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Selected StorySpark title:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedStorySparkTitle}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Selected StorySpark matched chip/type:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedStorySparkMatchedChip}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Direct chip-guidance generation used:
          </span>{" "}
          {storyTypeSelectionDiagnostics.directChipGuidanceUsed}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            StorySpark compatibility result:
          </span>{" "}
          {storyTypeSelectionDiagnostics.compatibilityResult}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            chipCompatibilityResult:
          </span>{" "}
          {storyTypeSelectionDiagnostics.chipCompatibilityResult}
        </p>
        <p>
          <span className="font-semibold text-paper/80">storySeedSource:</span>{" "}
          {storyTypeSelectionDiagnostics.storySeedSource}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            visibleCategoryLabel:
          </span>{" "}
          {storyTypeSelectionDiagnostics.visibleCategoryLabel}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Fallback story selection used:
          </span>{" "}
          {storyTypeSelectionDiagnostics.fallbackSelectionUsed}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Selected chip preserved during generation:
          </span>{" "}
          {storyTypeSelectionDiagnostics.selectedChipPreservedDuringGeneration}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Ready queue StorySpark source count:
          </span>{" "}
          {readyStoryQueue.filter((item) => item.sourceStorySparkId).length}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Ready story prepared count:
          </span>{" "}
          {countPreparedReadyStoryQueueItems(readyStoryQueue)}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Ready story preparation status:
          </span>{" "}
          {lastReadyStoryPreparationStatus}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last ready story preparation outcome:
          </span>{" "}
          {lastReadyStoryPreparationOutcome}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Saved for later queue count:
          </span>{" "}
          {savedForLaterStoryQueue.length}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last ready story queue action:
          </span>{" "}
          {lastReadyStoryQueueAction}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Feedback draft has unsaved changes:
          </span>{" "}
          {feedbackDraftHasUnsavedChanges ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Feedback save blocked because rating missing:
          </span>{" "}
          {feedbackSaveBlockedBecauseRatingMissing ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Generation blocked because unsaved feedback:
          </span>{" "}
          {generationBlockedBecauseUnsavedFeedback ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last request included continuation story ID:
          </span>{" "}
          {lastRequestIncludedContinuationStoryId ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Continuation context included:
          </span>{" "}
          {lastContinuationContextIncluded ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Continuation blocked because context missing:
          </span>{" "}
          {lastContinuationBlockedBecauseContextMissing ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Next Episode clicked:
          </span>{" "}
          {readerScrollDiagnostics.nextEpisodeClicked}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Continuation loaded:
          </span>{" "}
          {readerScrollDiagnostics.continuationLoaded}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Scroll reset attempted:
          </span>{" "}
          {readerScrollDiagnostics.scrollResetAttempted}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Scroll target used:
          </span>{" "}
          {readerScrollDiagnostics.scrollTargetUsed}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Profile used in last new-story generation:
          </span>{" "}
          {lastNewStoryPersonalization.profileUsed ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Profile source used:
          </span>{" "}
          {lastNewStoryPersonalization.profileSourceUsed}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Profile confidence:
          </span>{" "}
          {lastNewStoryPersonalization.profileConfidence}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation mode:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.identity
            ?.generationMode ?? lastNewStoryPersonalization.lastGenerationMode}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation storyId:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.identity?.storyId ??
            "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation seriesId:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.identity?.seriesId ??
            "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation sourceStoryId:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.identity
            ?.sourceStoryId ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation parentSeriesId:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.identity
            ?.parentSeriesId ?? "none"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation created new series:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.newSeriesCreated
            ? "yes"
            : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation trigger:
          </span>{" "}
          {lastNewStoryPersonalization.identityDiagnostics.trigger}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation mood signal:
          </span>{" "}
          {lastNewStoryPersonalization.moodSignal}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Last generation genre signal:
          </span>{" "}
          {lastNewStoryPersonalization.genreSignal}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            User hard avoidances included:
          </span>{" "}
          {lastNewStoryPersonalization.hardAvoidancesIncluded ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            User hard avoidances:
          </span>{" "}
          {lastNewStoryPersonalization.userHardAvoidancesSummary}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Default/eerie safety guardrails:
          </span>{" "}
          {lastNewStoryPersonalization.defaultEerieSafetyGuardrailsSummary}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Eerie signals included:
          </span>{" "}
          {lastNewStoryPersonalization.eerieSignalsIncluded ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Feedback included in last new-story personalization:
          </span>{" "}
          {lastNewStoryPersonalization.feedbackIncluded ? "yes" : "no"}
        </p>
        <p>
          <span className="font-semibold text-paper/80">
            Continuation story id included in last new-story request:
          </span>{" "}
          {lastNewStoryPersonalization.continuationStoryIdIncludedInLastNewStoryRequest
            ? "yes"
            : "no"}
        </p>
        <p className="sm:col-span-2">
          <span className="font-semibold text-paper/80">
            Latest story feedback summary:
          </span>{" "}
          {lastNewStoryPersonalization.latestStoryFeedbackSummary}
        </p>
        <p className="sm:col-span-2">
          <span className="font-semibold text-paper/80">
            Personalization summary:
          </span>{" "}
          {lastNewStoryPersonalization.summary}
        </p>
        {storyResponseEpisodeMomentum ? (
          <section className="mt-3 grid gap-1 rounded-md border border-lantern-gold/20 bg-lantern-gold/5 p-3 sm:col-span-2">
            <p className="font-semibold text-paper/80">
              Episode Momentum diagnostics
            </p>
            <p>
              <span className="font-semibold text-paper/80">Active:</span>{" "}
              {storyResponseEpisodeMomentum.active ? "true" : "false"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Activation reason:
              </span>{" "}
              {storyResponseEpisodeMomentum.activation_reason}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Continue probability:
              </span>{" "}
              {storyResponseEpisodeMomentum.scores.continue_probability}
            </p>
            <p>
              <span className="font-semibold text-paper/80">Repair ran:</span>{" "}
              {storyResponseEpisodeMomentum.repair_ran ? "true" : "false"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Repair reason:
              </span>{" "}
              {storyResponseEpisodeMomentum.repair_reason}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                JSON parse failed:
              </span>{" "}
              {storyResponseEpisodeMomentum.json_parse_failed
                ? "true"
                : "false"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Fallback used:
              </span>{" "}
              {storyResponseEpisodeMomentum.fallback_used ? "true" : "false"}
            </p>
          </section>
        ) : null}
        <details className="mt-3 sm:col-span-2">
          <summary className="cursor-pointer font-semibold text-paper/75">
            Raw JSON
          </summary>
          <pre className="mt-2 max-h-72 overflow-auto rounded border border-paper/10 bg-night-ink/80 p-3 text-[0.68rem] leading-5 text-paper/70">
            {JSON.stringify(
              {
                readerProfileGenerationSnapshot:
                  lastNewStoryPersonalization.responseSnapshot ?? null,
                latestStoryResponse: {
                  metadata: {
                    diagnostics: {
                      episodeMomentum: storyResponseEpisodeMomentum ?? null,
                    },
                  },
                },
              },
              null,
              2,
            )}
          </pre>
        </details>
      </div>
    </details>
  );
}

function ReaderProfileDiagnostics({
  canonicalProfile,
  cloudSync,
  lastGenerationUsedCanonicalProfile,
  onClear,
  profile,
}: {
  canonicalProfile: CanonicalReaderProfile | null;
  cloudSync: CloudReaderProfileSyncState;
  lastGenerationUsedCanonicalProfile: boolean;
  onClear: () => void;
  profile: ReaderProfile;
}) {
  const topMood = getTopCount(profile.moodCounts);
  const topGenre = getTopCount(profile.genreCounts);
  const tasteProfile = profile.tasteProfile;

  return (
    <details className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">
        Reader profile diagnostics
      </summary>
      <div className="mt-3 grid gap-3">
        <div className="grid gap-1 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-paper/80">Reader ID:</span>{" "}
            {canonicalProfile?.readerId ? "present" : "missing"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Reader ID storage key:
            </span>{" "}
            {READER_ID_STORAGE_KEY}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Canonical profile key:
            </span>{" "}
            {CANONICAL_READER_PROFILE_STORAGE_KEY}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Canonical profile exists:
            </span>{" "}
            {canonicalProfile ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Profile source:</span>{" "}
            {cloudSync.source}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Canonical/effective profile source:
            </span>{" "}
            {cloudSync.source === "authenticated cloud"
              ? "authenticated cloud"
              : (canonicalProfile?.source ?? "default")}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Active Reader Profile owner id:
            </span>{" "}
            {maskAccountIdentifier(cloudSync.ownerId)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Cloud profile exists for current user:
            </span>{" "}
            {cloudSync.cloudProfileExists ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last cloud profile load status:
            </span>{" "}
            {cloudSync.lastLoadStatus}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Initialized default cloud profile:
            </span>{" "}
            {cloudSync.initializedDefaultCloudProfile ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last profile API path/action:
            </span>{" "}
            {cloudSync.lastApiPath} / {cloudSync.lastApiAction}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last sanitized profile API error:
            </span>{" "}
            {cloudSync.lastSanitizedErrorName}
            {cloudSync.lastSanitizedErrorCode !== "none"
              ? ` (${cloudSync.lastSanitizedErrorCode})`
              : ""}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Profile action blocked signed out:
            </span>{" "}
            {cloudSync.lastBlockedProfileAction}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Cloud sync:</span>{" "}
            {cloudSync.status === "synced"
              ? "success"
              : cloudSync.status === "unavailable" ||
                  cloudSync.status === "not found"
                ? "not configured"
                : cloudSync.status === "pending"
                  ? "pending"
                  : "failed"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last generation used canonical profile:
            </span>{" "}
            {lastGenerationUsedCanonicalProfile ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Profile updated:
            </span>{" "}
            {canonicalProfile?.updatedAt || "never"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Onboarding mode:
            </span>{" "}
            {canonicalProfile?.onboarding?.mode ?? "unknown"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Preferred format:
            </span>{" "}
            {canonicalProfile?.preferences.preferredFormat ??
              canonicalProfile?.onboarding?.preferredFormat ??
              "not available"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Preferred duration:
            </span>{" "}
            {canonicalProfile?.preferences.preferredDuration ??
              canonicalProfile?.onboarding?.preferredDuration ??
              "not available"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Fear intensity:</span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.fearIntensity,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Weirdness tolerance:
            </span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.weirdnessTolerance,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Supernatural affinity:
            </span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.supernaturalAffinity,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Ambiguity tolerance:
            </span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.ambiguityTolerance,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Gore tolerance:</span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.goreTolerance,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Sleep-safe preference:
            </span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.preferences.sleepSafePreference,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Hard avoidances:
            </span>{" "}
            {canonicalProfile?.preferences.hardAvoidances.length
              ? canonicalProfile.preferences.hardAvoidances.join(", ")
              : "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Story card signal count:
            </span>{" "}
            {canonicalProfile?.signals.storyCardSignalCount ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Feedback signal count:
            </span>{" "}
            {canonicalProfile?.signals.feedbackSignalCount ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last feedback signal id:
            </span>{" "}
            {canonicalProfile?.signals.lastFeedbackSignalId ?? "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last feedback reason:
            </span>{" "}
            {canonicalProfile?.signals.lastFeedbackReason ?? "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Learned confidence:
            </span>{" "}
            {formatOptionalPreference(canonicalProfile?.learned?.confidence)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Continuation preference:
            </span>{" "}
            {formatOptionalPreference(
              canonicalProfile?.learned?.continuationPreference,
            )}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Learned genres:</span>{" "}
            {formatLearnedScores(canonicalProfile?.learned?.genres)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Learned tones:</span>{" "}
            {formatLearnedScores(canonicalProfile?.learned?.tones)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Applied feedback signal ids:
            </span>{" "}
            {canonicalProfile?.appliedSignalIds?.length ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Favorite count:</span>{" "}
            {canonicalProfile?.signals.favoriteCount ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Saved for later count:
            </span>{" "}
            {canonicalProfile?.signals.savedForLaterCount ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last feedback at:
            </span>{" "}
            {canonicalProfile?.signals.lastFeedbackAt || "never"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Fallback/default status:
            </span>{" "}
            {canonicalProfile?.fallbackReason ??
              (canonicalProfile?.source === "default" ? "default" : "none")}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Profile exists:</span>{" "}
            {profile.profileExists ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Profile ID:</span>{" "}
            {cloudSync.profileId || "pending"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Local profile exists:
            </span>{" "}
            {cloudSync.localProfileExists ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Cloud profile status:
            </span>{" "}
            {cloudSync.status}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last cloud save status:
            </span>{" "}
            {cloudSync.lastSaveOutcome === "saved"
              ? "success"
              : cloudSync.lastSaveOutcome}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last profile save status for feedback:
            </span>{" "}
            {canonicalProfile?.signals.feedbackSignalCount
              ? `profile updated${cloudSync.lastSaveOutcome ? ` / cloud ${cloudSync.lastSaveOutcome === "saved" ? "success" : cloudSync.lastSaveOutcome}` : ""}`
              : "no feedback saved"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last cloud sync:
            </span>{" "}
            {cloudSync.lastSyncAt || "never"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Last cloud error:
            </span>{" "}
            {cloudSync.lastError || "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Local updated:</span>{" "}
            {cloudSync.localUpdatedAt || profile.updatedAt || "never"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Cloud updated:</span>{" "}
            {cloudSync.cloudUpdatedAt || "unknown"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total generated:
            </span>{" "}
            {profile.counters.totalStoriesGenerated}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Total opened:</span>{" "}
            {profile.counters.totalStoriesOpened}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total continued:
            </span>{" "}
            {profile.counters.totalContinues}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Total exported:</span>{" "}
            {profile.counters.totalExports}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total demo loaded:
            </span>{" "}
            {profile.counters.totalDemoStoriesLoaded}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total start something different:
            </span>{" "}
            {profile.counters.totalStartSomethingDifferent}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total mood selections:
            </span>{" "}
            {profile.counters.totalMoodSelections}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Total story feedback signals:
            </span>{" "}
            {profile.storyFeedbackSignals?.length ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Ready story queue signal count:
            </span>{" "}
            {profile.readyStoryQueueSignals?.length ?? 0}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Latest ready story queue signal:
            </span>{" "}
            {formatLatestReadyStoryQueueSignal(profile.readyStoryQueueSignals)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Top mood:</span>{" "}
            {topMood ?? "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Top genre:</span>{" "}
            {topGenre ?? "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Storage key:</span>{" "}
            {READER_PROFILE_STORAGE_KEY}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Profile ID key:</span>{" "}
            {READER_PROFILE_ID_STORAGE_KEY}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Updated:</span>{" "}
            {profile.updatedAt || "never"}
          </p>
        </div>

        <div className="rounded-md border border-lantern-gold/15 bg-night-ink/60 p-3">
          <p className="mb-2 font-semibold text-paper/80">Taste Profile</p>
          <div className="grid gap-1 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-paper/80">
                Taste profile source:
              </span>{" "}
              {tasteProfile?.source ?? "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Taste profile confidence:
              </span>{" "}
              {tasteProfile?.profileConfidence ?? "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Preferred format:
              </span>{" "}
              {tasteProfile?.preferredFormat ?? "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Preferred duration:
              </span>{" "}
              {tasteProfile?.preferredDurationMinutes
                ? `${tasteProfile.preferredDurationMinutes} minutes`
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Fear intensity:
              </span>{" "}
              {tasteProfile?.fearIntensity
                ? formatPreferencePair(tasteProfile.fearIntensity)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Weirdness tolerance:
              </span>{" "}
              {tasteProfile?.weirdnessTolerance
                ? formatPreferencePair(tasteProfile.weirdnessTolerance)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Supernatural affinity:
              </span>{" "}
              {tasteProfile?.supernaturalAffinity
                ? formatPreferencePair(tasteProfile.supernaturalAffinity)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Ambiguity tolerance:
              </span>{" "}
              {tasteProfile?.ambiguityTolerance
                ? formatPreferencePair(tasteProfile.ambiguityTolerance)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Gore tolerance:
              </span>{" "}
              {tasteProfile?.goreTolerance
                ? formatPreferencePair(tasteProfile.goreTolerance)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Sleep-safe preference:
              </span>{" "}
              {tasteProfile?.sleepSafePreference
                ? formatPreferencePair(tasteProfile.sleepSafePreference)
                : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                User hard avoidances:
              </span>{" "}
              {tasteProfile?.userHardAvoidances?.length
                ? tasteProfile.userHardAvoidances.join(", ")
                : tasteProfile
                  ? "none"
                  : "not available"}
            </p>
            <p>
              <span className="font-semibold text-paper/80">
                Default safety guardrails:
              </span>{" "}
              {tasteProfile?.defaultSafetyGuardrails?.length
                ? tasteProfile.defaultSafetyGuardrails.join(", ")
                : "not available"}
            </p>
          </div>
        </div>
        <details className="rounded-md border border-paper/10 bg-night-ink p-3">
          <summary className="cursor-pointer font-semibold text-paper/75">
            Raw JSON
          </summary>
          <pre className="mt-3 max-h-72 overflow-auto text-[0.7rem] leading-5 text-paper/70">
            {JSON.stringify(
              {
                canonicalProfile,
                readerIdStorageKey: READER_ID_STORAGE_KEY,
                canonicalProfileStorageKey:
                  CANONICAL_READER_PROFILE_STORAGE_KEY,
                storageKey: READER_PROFILE_STORAGE_KEY,
                profileIdStorageKey: READER_PROFILE_ID_STORAGE_KEY,
                cloudSync,
                ...profile,
              },
              null,
              2,
            )}
          </pre>
        </details>
        <button
          className="w-fit rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper hover:border-bloodwick-copper"
          onClick={onClear}
          type="button"
        >
          Clear reader profile
        </button>
      </div>
    </details>
  );
}

function areFeedbackDraftsEqual(
  draftRating: StoryFeedbackRating | null,
  draftReasons: StoryFeedbackReason[],
  savedSignal: StoryFeedbackSignal | null | undefined,
): boolean {
  if (!draftRating && !savedSignal) return draftReasons.length === 0;
  if (!draftRating || !savedSignal) return false;
  if (draftRating !== savedSignal.rating) return false;

  const draftSet = new Set(draftReasons);
  const savedSet = new Set(savedSignal.reasons ?? []);

  if (draftSet.size !== savedSet.size) return false;

  for (const reason of draftSet) {
    if (!savedSet.has(reason)) return false;
  }

  return true;
}

function getTopCount(counts: Record<string, number>): string | null {
  const [topKey, topCount] =
    Object.entries(counts).sort(([, left], [, right]) => right - left)[0] ?? [];
  return topKey ? `${topKey} (${topCount})` : null;
}

function getReaderProfileSource(
  sync: CloudReaderProfileSyncState,
): ProfileSourceUsed {
  if (sync.source === "authenticated cloud" && sync.status === "synced")
    return "cloud";
  if (sync.source === "auth-disabled fallback")
    return sync.localProfileExists ? "local" : "default";
  if (sync.source === "legacy local")
    return sync.localProfileExists ? "local" : "none";
  if (sync.status === "not found") return "default";
  return sync.localProfileExists ? "local" : "none";
}

function getReaderProfileConfidence(
  profile: ReaderProfile,
): "low" | "medium" | "high" {
  const signalCount =
    profile.counters.totalStoriesGenerated +
    profile.counters.totalStoriesOpened +
    profile.counters.totalContinues +
    profile.counters.totalMoodSelections;
  if (signalCount >= 12) return "high";
  if (signalCount >= 4) return "medium";
  return "low";
}

function readStoryFeedbackGenerationMode(
  presentation: GeneratedStoryPresentation,
): StoryFeedbackGenerationMode {
  if (presentation === "first-episode") return "new-story";
  if (presentation === "continuation") return "continue-story";
  return "unknown";
}

function summarizeStoryFeedback(
  signals: StoryFeedbackSignal[] | undefined,
): string {
  const recentSignals = Array.isArray(signals) ? signals.slice(-10) : [];
  if (recentSignals.length === 0) return "No prior story feedback available.";

  const latestSignal = recentSignals[recentSignals.length - 1];
  const latestRatingLabel = formatStoryFeedbackRating(latestSignal.rating);
  const latestReasons = latestSignal.reasons
    .map(formatStoryFeedbackReason)
    .filter(Boolean);
  const positiveReasons = recentSignals
    .filter((signal) => signal.score >= 4)
    .flatMap((signal) => signal.reasons.map(formatStoryFeedbackReason));
  const negativeReasons = recentSignals
    .filter((signal) => signal.score <= 2)
    .flatMap((signal) => signal.reasons.map(formatStoryFeedbackReason));

  return [
    `Recent feedback: reader rated the last story ${latestRatingLabel}${latestReasons.length ? ` and selected ${latestReasons.join(" and ")}` : ""}.`,
    positiveReasons.length
      ? `Lean toward ${dedupe(positiveReasons).slice(0, 4).join(", ")}.`
      : "",
    negativeReasons.length
      ? `Avoid or adjust around ${dedupe(negativeReasons).slice(0, 4).join(", ")}.`
      : "",
    "Use feedback as weak preference guidance, not hard constraints.",
  ]
    .filter(Boolean)
    .join(" ");
}

function formatStoryFeedbackRating(rating: StoryFeedbackRating): string {
  return (
    STORY_FEEDBACK_RATING_OPTIONS.find((option) => option.rating === rating)
      ?.label ?? rating
  );
}

function formatStoryFeedbackReason(reason: StoryFeedbackReason): string {
  return (
    STORY_FEEDBACK_REASON_OPTIONS.find((option) => option.reason === reason)
      ?.label ?? reason
  );
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 6);
  return entries.length
    ? entries.map(([key, count]) => `${key}: ${count}`).join("; ")
    : "none";
}

function splitAvoidances(value: string | undefined): string[] {
  return (value ?? "")
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function formatWeightedPreference(preference: {
  value: number;
  confidence: number;
}): string {
  return `${preference.value.toFixed(2)} confidence ${preference.confidence.toFixed(2)}`;
}

function shouldUseEerieSignalsForGenre(genre: GenrePreset): boolean {
  return /eerie|horror|strange|mystery|dark|supernatural|speculative/i.test(
    genre,
  );
}

function normalizeCloudReaderProfile(value: unknown): ReaderProfile | null {
  if (!value) return null;
  const profile = normalizeReaderProfile(value);
  return profile.profileExists ? profile : null;
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Reader profile cloud sync failed.";
}

function EerieReaderProfileDiagnostics({
  onClear,
  profile,
}: {
  onClear: () => void;
  profile: EerieReaderProfile;
}) {
  const profileExists =
    typeof window !== "undefined" &&
    window.localStorage.getItem(EERIE_READER_PROFILE_STORAGE_KEY) !== null;
  const diagnostics = formatEerieReaderProfileForDiagnostics(profile);
  const topAffinities = Object.entries(profile.affinities)
    .sort(([, left], [, right]) => right.value - left.value)
    .slice(0, 8);

  return (
    <details className="min-w-0 rounded-md border border-lantern-gold/15 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">
        Legacy local eerie profile diagnostics
      </summary>
      <div className="mt-3 grid gap-3">
        <div className="grid gap-1 sm:grid-cols-2">
          <p>
            <span className="font-semibold text-paper/80">Persistence:</span>{" "}
            local-only legacy profile; mirrored into cloud-backed reader
            tasteProfile when needed
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Profile exists in local storage:
            </span>{" "}
            {profileExists ? "yes" : "no"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Storage key:</span>{" "}
            {EERIE_READER_PROFILE_STORAGE_KEY}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Onboarding mode:
            </span>{" "}
            {profile.onboardingMode}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Profile confidence:
            </span>{" "}
            {profile.profileConfidence}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Fear intensity:</span>{" "}
            {formatPreferencePair(profile.fearIntensity)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Weirdness tolerance:
            </span>{" "}
            {formatPreferencePair(profile.weirdnessTolerance)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Supernatural affinity:
            </span>{" "}
            {formatPreferencePair(profile.supernaturalAffinity)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Ambiguity tolerance:
            </span>{" "}
            {formatPreferencePair(profile.ambiguityTolerance)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Gore tolerance:</span>{" "}
            {formatPreferencePair(profile.goreTolerance)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Sleep-safe preference:
            </span>{" "}
            {formatPreferencePair(profile.sleepSafePreference)}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Preferred format:
            </span>{" "}
            {profile.preferredFormat}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Preferred duration:
            </span>{" "}
            {profile.preferredDurationMinutes} minutes
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Default/eerie safety guardrails:
            </span>{" "}
            {DEFAULT_EERIE_SAFETY_GUARDRAILS.join(", ") || "none"}
          </p>
          <p>
            <span className="font-semibold text-paper/80">
              Story card signal count:
            </span>{" "}
            {profile.storyCardSignals.length}
          </p>
          <p>
            <span className="font-semibold text-paper/80">Updated:</span>{" "}
            {profile.updatedAt}
          </p>
        </div>
        <div>
          <p className="font-semibold text-paper/80">Top affinities by value</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {topAffinities.map(([key, preference]) => (
              <li key={key}>
                {key}: {formatPreferencePair(preference)}
              </li>
            ))}
          </ul>
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border border-paper/10 bg-night-ink p-3 text-[0.7rem] leading-5 text-paper/70">
          {JSON.stringify({ profileExists, ...diagnostics }, null, 2)}
        </pre>
        <button
          className="w-fit rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper hover:border-bloodwick-copper"
          onClick={onClear}
          type="button"
        >
          Clear eerie reader profile
        </button>
      </div>
    </details>
  );
}

function getMutuallyExclusiveFeedbackReason(
  reason: StoryFeedbackReason,
): StoryFeedbackReason | null {
  if (reason === "too_dark") return "not_dark_enough";
  if (reason === "not_dark_enough") return "too_dark";
  if (reason === "too_weird") return "not_weird_enough";
  if (reason === "not_weird_enough") return "too_weird";
  return null;
}

function formatOptionalPreference(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(2)
    : "not available";
}

function formatLearnedScores(
  scores: Record<string, number> | undefined,
): string {
  const entries = Object.entries(scores ?? {}).slice(0, 5);
  return entries.length
    ? entries.map(([key, value]) => `${key} ${value.toFixed(2)}`).join(", ")
    : "none";
}

function formatPreferencePair(preference: {
  value: number;
  confidence: number;
}): string {
  return `${preference.value.toFixed(2)} / ${preference.confidence.toFixed(2)}`;
}

function MobileTopHeader({
  activeView,
  onGoHome,
  onNavigate,
}: {
  activeView: AppView;
  onGoHome: () => void;
  onNavigate: (view: AppView) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleCloseMobileMenu = () => setIsMenuOpen(false);

    window.addEventListener("lantern:close-mobile-menu", handleCloseMobileMenu);
    return () => window.removeEventListener("lantern:close-mobile-menu", handleCloseMobileMenu);
  }, []);

  const handleNavigate = (view: AppView) => {
    setIsMenuOpen(false);
    if (view === "home") {
      onGoHome();
      return;
    }
    onNavigate(view);
  };

  return (
    <header className="relative h-12 w-full min-w-0 py-1 md:hidden">
      <button
        aria-expanded={isMenuOpen}
        aria-label="Open menu"
        aria-controls="mobile-top-menu"
        className="absolute left-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-xl text-paper"
        onClick={() => setIsMenuOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <a
        aria-label="Go home"
        className="absolute left-1/2 top-1/2 z-0 flex h-11 w-[min(15rem,calc(100%-6rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 no-underline"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onGoHome();
        }}
      >
        <span className="grid place-items-center">
          <BloodwickWordmark className="text-sm" />
        </span>
      </a>

      <button
        aria-label="Open profile"
        className="absolute right-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-lg text-paper"
        onClick={() => handleNavigate("account")}
        type="button"
      >
        <span aria-hidden="true">♡</span>
      </button>

      {isMenuOpen ? (
        <nav
          aria-label="Mobile primary"
          className="absolute left-0 right-0 top-12 z-30 rounded-xl border border-paper/10 bg-night-ink/95 p-2 shadow-soft backdrop-blur"
          id="mobile-top-menu"
        >
          <div className="grid gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                aria-current={activeView === item.view ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-left text-sm font-semibold leading-tight ${activeView === item.view ? "bg-bloodwick-red text-bloodwick-white" : "text-paper/75 hover:bg-paper/10 hover:text-paper"}`}
                key={item.view}
                onClick={() => handleNavigate(item.view)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}


function NavTabs({
  activeView,
  onChange,
}: {
  activeView: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <nav aria-label="Primary" className="w-full min-w-0 md:max-w-xl">
      <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:justify-end">
        {NAV_ITEMS.map((tab) => (
          <button
            aria-current={activeView === tab.view ? "page" : undefined}
            className={`min-w-0 rounded-md border px-2.5 py-2 text-center text-xs font-semibold leading-5 transition sm:px-3 ${activeView === tab.view ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white" : "border-paper/15 bg-paper/10 text-paper hover:border-bloodwick-copper"}`}
            key={tab.view}
            onClick={() => onChange(tab.view)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function PageHeading({
  body,
  eyebrow,
  title,
}: {
  body: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-paper md:text-3xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">{body}</p>
    </div>
  );
}
function CoverArt({
  label,
  title,
  tone = "cool",
  size = "normal",
}: {
  label?: string;
  title: string;
  tone?: "cool" | "warm";
  size?: "normal" | "feature" | "mobile";
}) {
  const palette =
    tone === "warm"
      ? "linear-gradient(145deg, #efe5cf 0%, #c9a46a 42%, #2f4f4f 100%)"
      : "linear-gradient(145deg, #d8ded5 0%, #6f7f72 45%, #26364d 100%)";
  const sizeClass =
    size === "feature"
      ? "min-h-[20rem] sm:min-h-[23rem] max-w-none"
      : size === "mobile"
        ? "h-full min-h-0 max-w-none"
        : "min-h-52 max-w-none sm:min-h-40 sm:max-w-40";
  return (
    <div
      aria-label={`${title} artwork`}
      className={`relative flex aspect-[3/4] w-full ${sizeClass} overflow-hidden rounded-md border border-primary-dark/10 p-4 text-night-ink shadow-soft`}
      style={{ background: palette }}
    >
      <div className="absolute inset-x-5 top-7 h-px bg-night-ink/30" />
      <div className="absolute inset-x-8 top-12 h-px bg-night-ink/20" />
      <div className="absolute left-6 top-20 h-24 w-12 border-l border-night-ink/25" />
      <div className="absolute bottom-8 right-6 h-28 w-20 rounded-t-full border border-night-ink/20 bg-white/10" />
      <div className="absolute bottom-0 left-0 h-24 w-full bg-night-ink/10" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between">
        <span className="max-w-full text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
          {label ?? "Story Artwork"}
        </span>
        <span className="max-w-[13rem] text-2xl font-semibold leading-tight md:text-3xl">
          {title.split(" ").slice(0, 5).join(" ")}
        </span>
      </div>
    </div>
  );
}
function HeroPortrait({
  name,
  size = "normal",
}: {
  name: string;
  size?: "normal" | "large";
}) {
  const className =
    size === "large" ? "h-20 w-20 text-xl" : "h-16 w-16 text-lg";
  return (
    <div
      aria-label={`${name} portrait artwork`}
      className={`relative flex ${className} flex-none items-center justify-center overflow-hidden rounded-md border border-lantern-gold/35 bg-primary-dark font-semibold text-lantern-gold`}
    >
      <span className="absolute top-2 h-8 w-10 rounded-full border border-lantern-gold/25 bg-lantern-gold/10" />
      <span className="absolute bottom-0 h-8 w-14 rounded-t-full border-x border-t border-paper/10 bg-paper/10" />
      <span className="relative z-10">
        {name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)}
      </span>
    </div>
  );
}
function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold leading-5 text-lantern-gold">
      {children}
    </span>
  );
}
function SmallButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="rounded-md border border-lantern-gold/40 bg-paper/10 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
function Status({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "info" | "success" | "error";
}) {
  return (
    <div
      className={`min-w-0 rounded-md border px-4 py-3 text-sm ${tone === "error" ? "border-ember/40 bg-ember/10 text-ember" : tone === "success" ? "border-green-300/40 bg-green-950/20 text-green-100" : "border-lantern-gold/30 bg-paper/10 text-paper/75"}`}
    >
      {children}
    </div>
  );
}
function EmptyPanel({ body, title }: { body: string; title: string }) {
  return (
    <div className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-5">
      <h3 className="text-lg font-semibold text-paper">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-paper/65">{body}</p>
    </div>
  );
}
function SelectControl({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | readonly { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2">
      <span className="text-sm font-semibold text-paper">{label}</span>
      <select
        className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => {
          const optionValue =
            typeof option === "string" ? option : option.value;
          const optionLabel =
            typeof option === "string" ? option : option.label;
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </label>
  );
}
function SelectLibrary({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <label className="mt-4 flex min-w-0 flex-col gap-2">
      <span className="text-sm font-semibold text-paper">{label}</span>
      <select
        className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Choose one</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function savedStoryToCloudInput(story: SavedStory) {
  return {
    storyId: story.id,
    title: story.title,
    story: story.story,
    metadata: story,
  };
}
function cloudRecordToSavedStory(
  record: CloudSavedStoryRecordResponse,
): SavedStory {
  const metadata =
    record.metadata && typeof record.metadata === "object"
      ? (record.metadata as Partial<SavedStory>)
      : {};
  return {
    ...metadata,
    id:
      record.storyId ||
      metadata.id ||
      createStoryId(record.story, record.createdAt),
    title: record.title || metadata.title || createStoryTitle(record.story),
    story: record.story,
    createdAt: metadata.createdAt || record.createdAt,
    wordCount:
      typeof metadata.wordCount === "number"
        ? metadata.wordCount
        : countWords(record.story),
    generatorSource: metadata.generatorSource || "cloud",
    charactersUsed: Array.isArray(metadata.charactersUsed)
      ? metadata.charactersUsed
      : [],
    rulesReferenced: Array.isArray(metadata.rulesReferenced)
      ? metadata.rulesReferenced
      : [],
    genrePreset: metadata.genrePreset || "Speculative Mystery",
    narrativeArchitecture: metadata.narrativeArchitecture || "Revelation Story",
    characterArc: metadata.characterArc || "Positive Change Arc",
    endingType: metadata.endingType || "Resolution with Residue",
    lengthTarget: metadata.lengthTarget || "Standard",
    diagnosticsNotice: metadata.diagnosticsNotice ?? null,
    seriesTitle: metadata.seriesTitle ?? null,
  } as SavedStory;
}
async function readGenerateResponsePayload(
  response: Response,
): Promise<Record<string, unknown>> {
  const responseText = await response.text();
  if (!responseText.trim()) {
    if (response.status === 504) throw new Error(getGenerationTimeoutMessage());
    return { error: "Story generation returned an empty response." };
  }
  try {
    return JSON.parse(responseText) as Record<string, unknown>;
  } catch {
    throw new Error(
      response.status === 504
        ? getGenerationTimeoutMessage()
        : `Story generation returned a non-JSON response (${response.status}).`,
    );
  }
}

function getGenerationTimeoutMessage(): string {
  return "Story generation timed out on the server. Try a shorter generation or try again.";
}

function buildGenerationFetchDiagnostics(
  input: GenerationFetchDiagnosticsInput,
): Record<string, unknown> {
  const error = input.error instanceof Error ? input.error : null;
  return {
    generationFetchDiagnosticsVersion: "v1",
    generationFetchDiagnosticStage: input.stage,
    generationFetchEndpoint: input.endpoint,
    generationFetchAction: input.action,
    generationFetchAttemptId: input.attemptId,
    generationFetchHttpStatus: input.response?.status ?? null,
    generationFetchElapsedSeconds: input.elapsedSeconds ?? null,
    generationFetchErrorName: error?.name ?? null,
    generationFetchErrorMessageSafe:
      error?.message ?? (input.error ? String(input.error) : null),
    authConfigured: input.authConfigured,
    currentUserPresent: input.currentUserPresent,
    authTokenPresent: input.authTokenPresent,
    generationSucceededButLibrarySaveFailed: Boolean(
      input.generationSucceededButLibrarySaveFailed,
    ),
  };
}

function elapsedSecondsSince(startedAt: number): number {
  return Math.max(0, Math.round((Date.now() - startedAt) / 1000));
}

function logGenerationFetchDiagnostics(diagnostics: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;
  console.warn("Project Lantern generation diagnostics", diagnostics);
}

function readDiagnosticRecord(
  payload: Record<string, unknown>,
): Record<string, unknown> | null {
  return payload.diagnostic && typeof payload.diagnostic === "object"
    ? (payload.diagnostic as Record<string, unknown>)
    : null;
}

function formatDiagnosticValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) return value;
  if (Array.isArray(value))
    return value.length ? value.map((item) => String(item)).join(", ") : "none";
  return "none";
}

function applySelectedStoryTypeMetadata(
  response: GenerateStoryResponse,
  chip?: StoryTypeChip,
): GenerateStoryResponse {
  if (!chip) return response;
  return {
    ...response,
    metadata: {
      ...response.metadata,
      diagnostics: {
        ...response.metadata.diagnostics,
        selectedStoryTypeChipId: chip.id,
        selectedStoryTypeChipLabel: chip.label,
        legacyGenrePreset: response.metadata.diagnostics.genrePreset,
      },
    },
  };
}

function getLibraryStoryCategoryLabel(
  story: Pick<LibraryStory, "genrePreset"> & {
    selectedStoryTypeChipLabel?: string | null;
    storyTypeChipLabel?: string | null;
  },
): string {
  return getStoryTypePrimaryCategory({
    selectedStoryTypeChipLabel: story.selectedStoryTypeChipLabel,
    storyTypeChipLabel: story.storyTypeChipLabel,
    genrePreset: story.genrePreset,
  });
}

function responseToLibraryStory(
  response: GenerateStoryResponse,
  id: string,
): LibraryStory {
  return {
    id,
    storyId: response.metadata.diagnostics.storyId,
    seriesId: response.metadata.diagnostics.seriesId,
    sourceStoryId: response.metadata.diagnostics.sourceStoryId ?? null,
    parentSeriesId: response.metadata.diagnostics.parentSeriesId ?? null,
    generationMode: response.metadata.diagnostics.generationMode,
    title: createStoryTitle(response.story),
    story: response.story,
    wordCount: response.metadata.wordCount,
    createdAt:
      response.metadata.generationStartedAt ?? new Date().toISOString(),
    genrePreset: response.metadata.diagnostics.genrePreset,
    selectedStoryTypeChipId:
      response.metadata.diagnostics.selectedStoryTypeChipId,
    selectedStoryTypeChipLabel:
      response.metadata.diagnostics.selectedStoryTypeChipLabel,
    legacyGenrePreset:
      response.metadata.diagnostics.legacyGenrePreset ??
      response.metadata.diagnostics.genrePreset,
    charactersUsed: response.metadata.charactersUsed,
    rulesReferenced: response.metadata.rulesReferenced,
    seriesTitle: response.metadata.seriesTitle ?? response.metadata.diagnostics.seriesTitle ?? null,
  };
}
function normalizeGenerateStoryResponse(
  payload: unknown,
): GenerateStoryResponse {
  const normalizedPayload = normalizeStoryPayload(
    payload,
  ) as Partial<GenerateStoryResponse>;
  const story = normalizeStoryText(normalizedPayload.story);
  if (!story || !normalizedPayload.metadata)
    throw new Error("Story generation returned an invalid response.");
  return {
    ...normalizedPayload,
    story,
    metadata: { ...normalizedPayload.metadata, wordCount: countWords(story) },
  } as GenerateStoryResponse;
}
async function fetchCloudJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, { ...init, cache: "no-store" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(formatCloudApiError(payload, input));
  return payload as T;
}
function formatCloudApiError(payload: unknown, fallbackPath: string): string {
  const value =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : {};
  const diagnostic =
    value.diagnostic && typeof value.diagnostic === "object"
      ? (value.diagnostic as Record<string, unknown>)
      : {};
  const parts = [
    typeof value.error === "string" ? value.error : "Cloud request failed.",
  ];
  const apiPath =
    typeof diagnostic.apiPath === "string" ? diagnostic.apiPath : fallbackPath;
  parts.push(`path=${apiPath}`);
  if ("authTokenPresent" in diagnostic)
    parts.push(
      `authTokenPresent=${diagnostic.authTokenPresent ? "true" : "false"}`,
    );
  if (typeof diagnostic.resolvedOwnerId === "string")
    parts.push(`owner=${diagnostic.resolvedOwnerId}`);
  if (typeof diagnostic.persistenceMode === "string")
    parts.push(`mode=${diagnostic.persistenceMode}`);
  if (typeof diagnostic.sanitizedErrorName === "string")
    parts.push(`error=${diagnostic.sanitizedErrorName}`);
  if (typeof diagnostic.sanitizedErrorCode === "number")
    parts.push(`code=${diagnostic.sanitizedErrorCode}`);
  return parts.join(" ");
}
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
function createStoryId(
  story: string,
  createdAt = new Date().toISOString(),
): string {
  return `${createdAt}-${story.length}`.replace(/[^a-zA-Z0-9_-]/g, "-");
}
function createStoryTitle(story: string): string {
  const firstLine =
    story
      .split(/\n+/)
      .find((line) => line.trim())
      ?.trim() ?? "Generated Story";
  const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine;
  return (
    truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story"
  );
}
function createDemoLatestStory(): SavedStory {
  return {
    id: DEMO_LATEST_STORY_ID,
    title: "The Half-Life of Magic",
    createdAt: new Date().toISOString(),
    story: DEMO_STORY_TEXT,
    wordCount: countWords(DEMO_STORY_TEXT),
    generatorSource: "fallback",
    charactersUsed: ["Mara Vale"],
    rulesReferenced: [],
    genrePreset: "Contemporary Fantastical / Magical Realist",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: "Standard",
    diagnosticsNotice: null,
  };
}
function readDemoLatestStory(): SavedStory | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_LATEST_STORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedStory;
    return parsed?.id === DEMO_LATEST_STORY_ID &&
      typeof parsed.story === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}
function persistDemoLatestStory(story: SavedStory) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DEMO_LATEST_STORY_STORAGE_KEY,
    JSON.stringify(story),
  );
}
function clearDemoLatestStory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_LATEST_STORY_STORAGE_KEY);
}
function createStoryBrief(story: LibraryStory): StoryBrief {
  if (story.id === DEMO_LATEST_STORY_ID) return DEMO_STORY_BRIEF;
  const sentences = extractSentences(story.story);
  const recapSentences = sentences.slice(0, 4);
  const heroName = story.charactersUsed[0] || "The lead";
  const secondCharacter = story.charactersUsed[1];
  const hook = sentences[0]
    ? truncateText(sentences[0], 190)
    : `${story.title} is waiting at the edge of its next turning point.`;
  const recap = recapSentences.length
    ? recapSentences.join(" ")
    : truncateText(story.story, 420);
  return {
    hook,
    recap,
    changed:
      sentences[4] ||
      `${heroName} has crossed a threshold that makes the old version of the story impossible to return to.`,
    tension: secondCharacter
      ? `${heroName} and ${secondCharacter} are still caught in the pressure the last chapter exposed.`
      : `${heroName} is still carrying the central unanswered pressure of the last chapter.`,
    nextHook:
      sentences[5] ||
      `The next chapter should press on the choice ${heroName} can no longer avoid.`,
    heroName,
    heroRole: getLibraryStoryCategoryLabel(story),
    struggle: `${heroName} is trying to move forward while the last chapter's consequences narrow the path ahead.`,
  };
}
function extractSentences(text: string): string[] {
  return (
    text
      .replace(/\s+/g, " ")
      .trim()
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []
  )
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function readStoryFitOnboardingDismissed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(STORY_FIT_ONBOARDING_STORAGE_KEY) ===
      "dismissed"
    );
  } catch {
    return false;
  }
}

function saveStoryFitOnboardingDismissed() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORY_FIT_ONBOARDING_STORAGE_KEY, "dismissed");
  } catch {}
}

function readStoryFitOnboardingTimestamp(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function saveStoryFitOnboardingTimestamp(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
}

function sortStoryStartsByMood(activeMood: Mood): StoryStart[] {
  return [...SUGGESTED_STORY_STARTS].sort(
    (a, b) =>
      Number(storyStartSupportsMood(b, activeMood)) -
      Number(storyStartSupportsMood(a, activeMood)),
  );
}
function moodDescription(mood: Mood): string {
  return getStoryTypeChip(mood).guidance;
}

function toAccountProfileSummary({
  authState,
  canonicalProfile,
  inputArtifacts,
  profile,
  savedForLaterStoryQueue,
  savedStories,
}: {
  authState: ReturnType<typeof useAuth>;
  canonicalProfile: CanonicalReaderProfile | null;
  inputArtifacts: InputArtifact[];
  profile: ReaderProfile;
  savedForLaterStoryQueue: ReadyStoryQueueItem[];
  savedStories: SavedStory[];
}): AccountProfileSummary {
  const userId = authState.currentUser?.id?.trim();
  const accountMode: AccountMode = userId
    ? "signed-in"
    : authState.authStatus === "error"
      ? "unknown"
      : "guest";
  const profileId = userId ? shortenProfileId(userId) : undefined;
  const displayName = userId ? "Signed-in profile" : "Guest profile";
  const statusText = userId
    ? `Profile ID: ${profileId}`
    : "Your stories and preferences are tied to this browser/session until full sign-in is added.";
  const explicitPreferences = profile.explicitReaderPreferences;
  const learnedStoryTypes = filterStoryFitSummaryLabels(
    topLabels(canonicalProfile?.learned?.moods, profile.moodCounts),
    READER_STORY_TYPE_OPTIONS,
  );
  const learnedIngredients = filterStoryFitSummaryLabels(
    topLabels(canonicalProfile?.learned?.genres, profile.genreCounts),
    READER_STORY_INGREDIENT_OPTIONS,
  );
  const emotionalPromises = uniqueNonEmpty(
    explicitPreferences.emotionalPromises ?? [],
  ).slice(0, 6);
  const favoriteStoryWorlds = uniqueNonEmpty(
    explicitPreferences.favoriteStoryWorlds ?? [],
  ).slice(0, 6);
  const characterLensPreferences = uniqueNonEmpty(
    explicitPreferences.characterLensPreferences ?? [],
  ).slice(0, STORY_FIT_SELECTION_LIMITS.characterLensPreferences);
  const narrativePressurePreferences = uniqueNonEmpty(
    explicitPreferences.narrativePressurePreferences ?? [],
  ).slice(0, STORY_FIT_SELECTION_LIMITS.narrativePressurePreferences);
  const episodeEndingShapePreferences = uniqueNonEmpty(
    explicitPreferences.episodeEndingShapePreferences ?? [],
  ).slice(0, STORY_FIT_SELECTION_LIMITS.episodeEndingShapePreferences);
  const preferredStoryTypes = uniqueNonEmpty([
    ...explicitPreferences.preferredStoryTypes,
    ...learnedStoryTypes,
  ]).slice(0, 6);
  const storyIngredients = uniqueNonEmpty([
    ...explicitPreferences.storyIngredients,
    ...learnedIngredients,
  ]).slice(0, 6);
  const hardAvoidances = uniqueNonEmpty([
    ...explicitPreferences.hardAvoidances,
    ...(canonicalProfile?.preferences.hardAvoidances ?? []),
    ...(profile.tasteProfile?.userHardAvoidances ?? []),
  ]).slice(0, 6);
  const continuationPreference = formatContinuationPreference(
    canonicalProfile?.learned?.continuationPreference,
  );
  const recentFeedback = formatRecentFeedback(
    profile.storyFeedbackSignals,
  ).slice(0, 3);
  const confidenceLabel = formatAccountConfidence(
    canonicalProfile?.learned?.confidence,
    profile.tasteProfile?.profileConfidence,
  );
  const series = groupStoriesBySeries(savedStories).length;
  const characters = uniqueNonEmpty(
    savedStories.flatMap((story) => story.charactersUsed ?? []),
  ).length;
  const storySparks =
    inputArtifacts.filter((artifact) => artifact.type === "storySeed").length +
    savedForLaterStoryQueue.length;
  const explicitDetails =
    formatExplicitReaderPreferenceDetails(explicitPreferences);

  return {
    displayName,
    profileId,
    accountMode,
    statusText,
    preferredStoryTypes,
    emotionalPromises,
    favoriteStoryWorlds,
    storyIngredients,
    characterLensPreferences,
    narrativePressurePreferences,
    episodeEndingShapePreferences,
    hardAvoidances,
    explicitDetails,
    continuationPreference,
    recentFeedback,
    confidenceLabel,
    counts: {
      savedStories: savedStories.length,
      series,
      ...(characters ? { characters } : {}),
      storySparks,
    },
  };
}

function topLabels(
  primary?: Record<string, number>,
  fallback?: Record<string, number>,
): string[] {
  const source =
    primary && Object.keys(primary).length ? primary : (fallback ?? {});
  return Object.entries(source)
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label]) => label.trim())
    .filter(Boolean);
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  );
}

function filterStoryFitSummaryLabels(
  values: string[],
  approvedLabels: string[],
): string[] {
  return values.reduce((items, value) => {
    const approved = approvedLabels.find(
      (label) => label.toLowerCase() === value.trim().toLowerCase(),
    );
    return approved ? uniqueNonEmpty([...items, approved]) : items;
  }, [] as string[]);
}

function formatExplicitReaderPreferencesForGeneration(
  preferences: ReaderProfile["explicitReaderPreferences"],
): string {
  return [
    preferences.preferredStoryTypes.length
      ? `preferredStoryTypes=${preferences.preferredStoryTypes.join(", ")}`
      : "preferredStoryTypes=none",
    preferences.emotionalPromises?.length
      ? `emotionalPromises=${preferences.emotionalPromises.join(", ")}`
      : "emotionalPromises=none",
    preferences.favoriteStoryWorlds?.length
      ? `favoriteStoryWorlds=${preferences.favoriteStoryWorlds.join(", ")}`
      : "favoriteStoryWorlds=none",
    preferences.storyIngredients.length
      ? `storyIngredients=${preferences.storyIngredients.join(", ")}`
      : "storyIngredients=none",
    preferences.characterLensPreferences?.length
      ? `characterLensPreferences=${preferences.characterLensPreferences.join(", ")}`
      : "characterLensPreferences=none",
    preferences.narrativePressurePreferences?.length
      ? `narrativePressurePreferences=${preferences.narrativePressurePreferences.join(", ")}`
      : "narrativePressurePreferences=none",
    preferences.episodeEndingShapePreferences?.length
      ? `episodeEndingShapePreferences=${preferences.episodeEndingShapePreferences.join(", ")}`
      : "episodeEndingShapePreferences=none",
    preferences.hardAvoidances.length
      ? `hardAvoidances=${preferences.hardAvoidances.join(", ")}`
      : "hardAvoidances=none",
    `contentLane=${preferences.contentLane}`,
    `narrativePressure=${preferences.narrativePressure}`,
    `episodeEndingShape=${preferences.episodeEndingShape}`,
    `protagonistLens=${preferences.protagonistLens}`,
  ].join("; ");
}

function formatExplicitReaderPreferenceDetails(
  preferences: ReaderProfile["explicitReaderPreferences"],
): string[] {
  const labels: string[] = [];
  if (preferences.contentLane !== "not-set")
    labels.push(
      `Content lane: ${formatPreferenceOptionLabel(preferences.contentLane)}`,
    );
  if (preferences.narrativePressurePreferences?.length)
    labels.push(
      `Narrative pressure / intensity: ${preferences.narrativePressurePreferences.join(", ")}`,
    );
  else if (preferences.narrativePressure !== "not-set")
    labels.push(
      `Narrative pressure / intensity: ${formatPreferenceOptionLabel(preferences.narrativePressure)}`,
    );
  if (preferences.episodeEndingShapePreferences?.length)
    labels.push(
      `Episode ending shape: ${preferences.episodeEndingShapePreferences.join(", ")}`,
    );
  else if (preferences.episodeEndingShape !== "not-set")
    labels.push(
      `Episode ending shape: ${formatPreferenceOptionLabel(preferences.episodeEndingShape)}`,
    );
  if (preferences.protagonistLens !== "not-set")
    labels.push(
      `Character lens: ${formatPreferenceOptionLabel(preferences.protagonistLens)}`,
    );
  return labels;
}

function formatPreferenceOptionLabel(value: string): string {
  const explicitLabels: Record<string, string> = {
    "gentle-unease": "Gentle unease",
    "balanced-tension": "Balanced tension",
    "dark-intense": "Dark / intense",
    "high-dread": "High dread",
    "resolved-incident": "Resolve this episode’s incident",
    "open-mystery": "Leave an open mystery",
    "next-episode-pull": "Strong next-episode pull",
    "quiet-aftermath": "Quiet aftermath with consequences",
    "ordinary-person-pulled-in": "Ordinary person pulled in",
    "investigator-seeker": "Investigator / seeker",
    "caretaker-protector": "Caretaker / protector",
    "reluctant-keeper-heir": "Reluctant keeper / heir",
    "outsider-newcomer": "Outsider / newcomer",
    "animal-bonded-protagonist": "Animal-bonded protagonist",
  };
  return (
    explicitLabels[value] ??
    value
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

function formatContinuationPreference(value?: number): string | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
    return undefined;
  if (value >= 0.66) return "Often continues stories";
  if (value >= 0.33) return "Sometimes continues stories";
  return "Light continuation signal";
}

function formatRecentFeedback(signals?: StoryFeedbackSignal[]): string[] {
  return [...(signals ?? [])]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((signal) => {
      const title = signal.storyTitle?.trim() || "Story";
      const reasons = signal.reasons.length
        ? ` (${signal.reasons.join(", ")})`
        : "";
      return `${title}: ${signal.rating.replaceAll("_", " ")}${reasons}`;
    });
}

function formatAccountConfidence(
  confidence?: number,
  fallback?: ReaderTasteProfileConfidence,
): string {
  if (
    typeof confidence === "number" &&
    Number.isFinite(confidence) &&
    confidence > 0
  ) {
    if (confidence >= 0.66) return "High confidence";
    if (confidence >= 0.33) return "Medium confidence";
    return "Low confidence";
  }
  return fallback
    ? `${fallback.charAt(0).toUpperCase()}${fallback.slice(1)} confidence`
    : "Still learning";
}

function shortenProfileId(value: string): string {
  return value.length > 6 ? `${value.slice(0, 6)}…` : value;
}

function readAppView(value: string | null): AppView | null {
  return value === "library" ||
    value === "worlds" ||
    value === "create" ||
    value === "characters" ||
    value === "account" ||
    value === "home" ||
    value === "mood-intake"
    ? value
    : null;
}
function truncateText(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength
    ? compact
    : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`;
}
function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "story-world-engine-story"
  );
}
function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function formatLibraryVersion(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
    .format(new Date(value))
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+$/g, "");
}
function formatCaughtError(caughtError: unknown): string {
  return caughtError instanceof Error
    ? caughtError.message
    : "Cloud project request failed.";
}
function downloadTextFile(filename: string, contents: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
