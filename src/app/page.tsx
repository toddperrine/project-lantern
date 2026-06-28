"use client";

import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  DEFAULT_EERIE_SAFETY_GUARDRAILS,
  EERIE_READER_PROFILE_STORAGE_KEY,
  clearEerieReaderProfile,
  createDefaultEerieReaderProfile,
  formatEerieReaderProfileForDiagnostics,
  readEerieReaderProfile
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
  createFeedbackEventId
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
  type ReadyStoryQueueSignal
} from "@/lib/ready-story-queue";
import { STORY_SPARK_CATALOG, type StorySparkCatalogItem } from "@/lib/story-spark-catalog";
import { createGenerationIdentity, type GenerationIdentity, type GenerationMode } from "@/lib/generation-identity";
import { findLibraryStoryBySavedId, findNextSavedEpisodeInSeries, groupStoriesBySeries, type LibrarySeriesGroup, type SeriesEpisode } from "@/lib/series-library";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";
import { CHARACTER_ARCS, ENDING_TYPES, GENRE_PRESETS, LENGTH_TARGETS, NARRATIVE_ARCHITECTURES } from "@/lib/types";
import type { EerieReaderProfile } from "@/lib/eerie-reader-profile";
import type { CanonicalReaderProfile, ReaderEnergyLevel, ReaderIntensityLevel, ReaderMoodDraft, ReaderMoodSnapshot, ReaderProfile, ReaderProfileEventInput, ReaderProfileEventSource, StoryFeedbackGenerationMode, StoryFeedbackRating, StoryFeedbackReason, StoryFeedbackSignal } from "@/lib/reader-profile";
import type { CharacterArc, EndingType, GenerateStoryResponse, GenrePreset, LengthTarget, NarrativeArchitecture, ReaderProfileGenerationSnapshot } from "@/lib/types";
import { createInputArtifactId, createSavedProjectId, createSavedStory, persistInputArtifacts, persistSavedProjects, persistSavedStories, readInputArtifacts, readSavedProjects, readSavedStories, savedStoryToResponse } from "@/lib/project-persistence";
import type { InputArtifact, InputArtifactType, SavedProject, SavedStory, UploadState } from "@/lib/project-persistence";

type AppView = "home" | "library" | "worlds" | "create" | "characters" | "mood-intake";
type Mood = "Mystery" | "Wonder" | "Emotional" | "Adventure" | "Strange" | "Hopeful" | "Dark" | "Reflective";
type CloudProjectSummary = Pick<SavedProject, "id" | "name" | "createdAt" | "updatedAt">;
type StoryStart = { title: string; premise: string; genre: GenrePreset; mood: Mood; heroName: string; heroRole: string; heroBio: string; worldName: string; world: string; seed: string; cast: string; rules: string };
type LibraryStory = SavedStory | { id: string; storyId?: string; seriesId?: string; sourceStoryId?: string | null; parentSeriesId?: string | null; generationMode?: GenerationMode; title: string; story: string; wordCount: number; createdAt: string; genrePreset: GenrePreset; charactersUsed: string[]; rulesReferenced: string[] };
type StoryBrief = { hook: string; recap: string; changed: string; tension: string; nextHook: string; heroName: string; heroRole: string; struggle: string };
type MoodIntakeMode = "story-start" | "generate" | null;
type MoodIntakeFormState = ReaderMoodDraft;
type GeneratedStoryPresentation = "first-episode" | "continuation" | "saved-episode" | null;
type GenerationSource = "new-story" | "continue-story" | null;
type LastGenerationIdentityDiagnostics = { identity: GenerationIdentity | null; continuationContextIncluded: boolean; newSeriesCreated: boolean; trigger: string; activeCommittedStoryId: string; activeCommittedSeriesId: string; pendingGenerationMode: GenerationMode | "none"; lastGenerationCancelledOrAborted: boolean };
type ProfileSourceUsed = "local" | "cloud" | "default" | "none";
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
type CloudReaderProfileStatus = "pending" | "synced" | "unavailable" | "error" | "not found";
type CloudReaderProfileSyncState = {
  profileId: string;
  status: CloudReaderProfileStatus;
  lastSaveOutcome: "none" | "saved" | "stale-write-ignored" | "unavailable" | "error";
  lastSyncAt: string;
  lastError: string;
  localUpdatedAt: string;
  cloudUpdatedAt: string;
  localProfileExists: boolean;
};
type ReaderProfileSaveResponse = {
  profile?: ReaderProfile | null;
  cloudProfileSaveStatus?: "saved" | "stale-write-ignored";
  error?: string;
};

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const INPUT_LABELS: Record<InputArtifactType, string> = { worldBible: "Storyworld", characterProfiles: "Cast", storySeed: "Story Spark", storyRules: "Craft Rules" };
const MOODS: Mood[] = ["Mystery", "Wonder", "Emotional", "Adventure", "Strange", "Hopeful", "Dark", "Reflective"];
const DEFAULT_STORY_RULES_NOTICE = "Default craft rules are used automatically when this is empty.";
const FIRST_PAGE_TEST_STORY_RULES = "First-page-test mode: Write a strong opening section of roughly 600-1000 words. Do not resolve the central story event. End at a compelling point of curiosity, pressure, or choice. The result should feel like the first pages of an episode, not a complete chapter.";
const DEMO_LATEST_STORY_STORAGE_KEY = "projectLantern.demoLatestStory.v1";
const DEMO_LATEST_STORY_ID = "demo-the-half-life-of-magic";
const EMPTY_MOOD_INTAKE_FORM: MoodIntakeFormState = {
  mood: "",
  desiredFeeling: "",
  energyLevel: "medium",
  intensityLevel: "moderate",
  avoidances: "",
  needRightNow: ""
};
const NAV_ITEMS: { label: string; view: AppView }[] = [
  { label: "Home", view: "home" },
  { label: "Story Library", view: "library" },
  { label: "Worlds", view: "worlds" },
  { label: "Create", view: "create" },
  { label: "Characters", view: "characters" }
];

const STORY_FEEDBACK_RATING_OPTIONS: { rating: StoryFeedbackRating; label: string }[] = [
  { rating: "missed", label: "Missed" },
  { rating: "not_quite", label: "Not quite" },
  { rating: "good", label: "Good" },
  { rating: "great", label: "Great" },
  { rating: "favorite", label: "Favorite" },
];
const STORY_FEEDBACK_REASON_OPTIONS: { reason: StoryFeedbackReason; label: string }[] = [
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
  "Someone else knows the talisman has awakened, and they are already looking for it."
].join("\n\n");
const DEMO_STORY_BRIEF: StoryBrief = {
  hook: "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  recap: "Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  changed: "The talisman has proven that dead magic is not dead at all, and Mara is now part of whatever has begun to wake.",
  tension: "Someone else knows the talisman has awakened, and they are already looking for it.",
  nextHook: "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  heroName: "Mara Vale",
  heroRole: "The Seeker",
  struggle: "Mara must decide whether to follow the talisman's signal before she understands what it is waking."
};
const EMPTY_CLOUD_READER_PROFILE_SYNC: CloudReaderProfileSyncState = {
  profileId: "",
  status: "pending",
  lastSaveOutcome: "none",
  lastSyncAt: "",
  lastError: "",
  localUpdatedAt: "",
  cloudUpdatedAt: "",
  localProfileExists: false
};

function storySparkCatalogItemToStoryStart(item: StorySparkCatalogItem): StoryStart {
  return {
    title: item.title,
    premise: item.premise,
    genre: item.genre,
    mood: item.mood as Mood,
    heroName: item.heroName,
    heroRole: item.heroRole,
    heroBio: item.heroBio,
    worldName: item.worldName,
    world: item.world,
    seed: item.seed,
    cast: item.cast,
    rules: item.rules
  };
}

const SUGGESTED_STORY_STARTS: StoryStart[] = STORY_SPARK_CATALOG.map(storySparkCatalogItemToStoryStart);

function createInitialReadyStoryQueue(): ReadyStoryQueueItem[] {
  return STORY_SPARK_CATALOG.slice(0, 3).map(storySparkCatalogItemToReadyStoryQueueItem);
}

function storySparkCatalogItemToReadyStoryQueueItem(item: StorySparkCatalogItem): ReadyStoryQueueItem {
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
    tags: item.tags
  });
}

const LEGACY_GENERIC_READY_QUEUE_TITLES = new Set([
  "The Lighthouse Under Main Street",
  "Orchard of Borrowed Moons",
  "The Quiet Engine",
  "Map of the Seventh Door"
]);

function shouldReplaceLegacyGenericReadyQueue(items: ReadyStoryQueueItem[]): boolean {
  return Boolean(
    items.length &&
      items.every((item) => LEGACY_GENERIC_READY_QUEUE_TITLES.has(item.title)) &&
      items.every((item) => !item.sourceStorySparkId)
  );
}

function fillReadyStoryQueueFromCatalog(
  currentQueue: ReadyStoryQueueItem[],
  savedForLaterQueue: ReadyStoryQueueItem[],
  profile: ReaderProfile
): ReadyStoryQueueItem[] {
  const blockedStorySparkIds = new Set<string>();

  for (const item of currentQueue) {
    if (item.sourceStorySparkId) blockedStorySparkIds.add(item.sourceStorySparkId);
  }

  for (const item of savedForLaterQueue) {
    if (item.sourceStorySparkId) blockedStorySparkIds.add(item.sourceStorySparkId);
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
  return MOODS.includes(value as Mood) ? value as Mood : "Mystery";
}

function formatLatestReadyStoryQueueSignal(signals: ReaderProfile["readyStoryQueueSignals"]): string {
  const latest = Array.isArray(signals) ? signals[0] : null;
  if (!latest) return "none";
  return `${latest.signal}: ${latest.storyTitle}`;
}

export default function Home() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<AppView>(readAppView(searchParams.get("view")) ?? "home");
  const [activeMood, setActiveMood] = useState<Mood>("Mystery");
  const [worldBible, setWorldBible] = useState<UploadState>(EMPTY_UPLOAD);
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>(EMPTY_UPLOAD);
  const [storySeed, setStorySeed] = useState<UploadState>(EMPTY_UPLOAD);
  const [storyRules, setStoryRules] = useState<UploadState>(EMPTY_UPLOAD);
  const [genrePreset, setGenrePreset] = useState<GenrePreset>("Speculative Mystery");
  const [narrativeArchitecture, setNarrativeArchitecture] = useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>("Positive Change Arc");
  const [endingType, setEndingType] = useState<EndingType>("Resolution with Residue");
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [storyResponse, setStoryResponse] = useState<GenerateStoryResponse | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState("");
  const [inputArtifacts, setInputArtifacts] = useState<InputArtifact[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [demoStory, setDemoStory] = useState<SavedStory | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCloudProjectId, setSelectedCloudProjectId] = useState("");
  const [cloudProjectMessage, setCloudProjectMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isCloudProjectsLoading, setIsCloudProjectsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [continueDirection, setContinueDirection] = useState("");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);
  const [readerProfile, setReaderProfile] = useState<ReaderProfile>(createEmptyReaderProfile());
  const [canonicalReaderProfile, setCanonicalReaderProfile] = useState<CanonicalReaderProfile | null>(null);
  const [cloudReaderProfileSync, setCloudReaderProfileSync] = useState<CloudReaderProfileSyncState>(EMPTY_CLOUD_READER_PROFILE_SYNC);
  const [eerieReaderProfile, setEerieReaderProfile] = useState<EerieReaderProfile>(createDefaultEerieReaderProfile());
  const [pendingStoryStart, setPendingStoryStart] = useState<StoryStart | null>(null);
  const [moodIntakeMode, setMoodIntakeMode] = useState<MoodIntakeMode>(null);
  const [generationApprovedMoodSnapshotId, setGenerationApprovedMoodSnapshotId] = useState<string | null>(null);
  const [generatedStoryPresentation, setGeneratedStoryPresentation] = useState<GeneratedStoryPresentation>(null);
  const [lastGenerationTrigger, setLastGenerationTrigger] = useState("none");
  const [generationSource, setGenerationSource] = useState<GenerationSource>(null);
  const [activeCommittedStoryId, setActiveCommittedStoryId] = useState("");
  const [activeCommittedSeriesId, setActiveCommittedSeriesId] = useState("");
  const [lastLibraryOpenedStoryId, setLastLibraryOpenedStoryId] = useState("");
  const [lastLibraryOpenedEpisodeNumber, setLastLibraryOpenedEpisodeNumber] = useState<number | null>(null);
  const [pendingGenerationMode, setPendingGenerationMode] = useState<GenerationMode | "none">("none");
  const [lastGenerationCancelledOrAborted, setLastGenerationCancelledOrAborted] = useState(false);
  const [lastRequestIncludedContinuationStoryId, setLastRequestIncludedContinuationStoryId] = useState(false);
  const [lastContinuationContextIncluded, setLastContinuationContextIncluded] = useState(false);
  const [lastContinuationBlockedBecauseContextMissing, setLastContinuationBlockedBecauseContextMissing] = useState(false);
  const [feedbackDraftHasUnsavedChanges, setFeedbackDraftHasUnsavedChanges] = useState(false);
  const [feedbackSaveBlockedBecauseRatingMissing, setFeedbackSaveBlockedBecauseRatingMissing] = useState(false);
  const [generationBlockedBecauseUnsavedFeedback, setGenerationBlockedBecauseUnsavedFeedback] = useState(false);
  const [lastNewStoryPersonalization, setLastNewStoryPersonalization] = useState<LastNewStoryPersonalization>(createEmptyLastNewStoryPersonalization());
  const [readyStoryQueue, setReadyStoryQueue] = useState<ReadyStoryQueueItem[]>([]);
  const [savedForLaterStoryQueue, setSavedForLaterStoryQueue] = useState<ReadyStoryQueueItem[]>([]);
  const [lastReadyStoryQueueAction, setLastReadyStoryQueueAction] = useState("none");
  const [readyStoryPreparationStatus, setReadyStoryPreparationStatus] = useState("idle");
  const [lastReadyStoryPreparationOutcome, setLastReadyStoryPreparationOutcome] = useState("none");
  const [isStoryStartSelectionOpen, setIsStoryStartSelectionOpen] = useState(false);
  const activeGenerationRequestId = useRef(0);
  const activeGenerationAbortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const requestedView = readAppView(searchParams.get("view")) ?? "home";
    setActiveView(requestedView);
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => setActiveView(readAppView(new URLSearchParams(window.location.search).get("view")) ?? "home");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const browserSavedStories = readSavedStories();
    setInputArtifacts(readInputArtifacts());
    setSavedStories(browserSavedStories);
    const latestSavedStory = browserSavedStories[0];
    if (latestSavedStory) {
      setActiveCommittedStoryId(latestSavedStory.id);
      setActiveCommittedSeriesId(latestSavedStory.seriesId ?? latestSavedStory.id);
    }
    setSavedProjects(readSavedProjects());
    setDemoStory(browserSavedStories.length === 0 ? readDemoLatestStory() : null);
    getOrCreateReaderId();
    const canonicalProfile = loadCanonicalReaderProfile();
    const profileId = readOrCreateReaderProfileId();
    const localProfile = readReaderProfile();
    const localEerieProfile = readEerieReaderProfile();
    const enrichedProfile = shouldMirrorEerieProfileToReaderTasteProfile(localProfile)
      ? normalizeReaderProfile({
          ...localProfile,
          tasteProfile: readerTasteProfileFromEerieProfile(localEerieProfile),
        })
      : localProfile;
    if (enrichedProfile !== localProfile) persistReaderProfile(enrichedProfile);
    const mirroredCanonicalProfile = mirrorCanonicalReaderProfilePreferences(canonicalProfile, enrichedProfile, localEerieProfile);
    setCanonicalReaderProfile(mirroredCanonicalProfile);
    setReaderProfile(enrichedProfile);
    const storedReadyQueue = readReadyStoryQueue();
    const shouldUseCatalogSeed = storedReadyQueue.length === 0 || shouldReplaceLegacyGenericReadyQueue(storedReadyQueue);
    const seededReadyQueue = shouldUseCatalogSeed ? createInitialReadyStoryQueue() : storedReadyQueue;
    const persistedReadyQueue = persistReadyStoryQueue(seededReadyQueue);
    setReadyStoryQueue(persistedReadyQueue);
    setSavedForLaterStoryQueue(readSavedForLaterStoryQueue());
    setCloudReaderProfileSync((current) => ({ ...current, profileId, localUpdatedAt: enrichedProfile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage(), status: "pending" }));
    void reconcileReaderProfileWithCloud(profileId, enrichedProfile);
    setEerieReaderProfile(localEerieProfile);
    void handleRefreshCloudProjects();
  }, []);

  const hasRealLatestStory = Boolean(storyResponse || savedStories.length);
  const latestStory = useMemo<LibraryStory | null>(() => {
    if (storyResponse) return responseToLibraryStory(storyResponse, currentStoryId || createStoryId(storyResponse.story));
    return savedStories[0] ?? demoStory;
  }, [currentStoryId, demoStory, savedStories, storyResponse]);
  const suggestedStarts = useMemo(() => sortStoryStartsByMood(activeMood), [activeMood]);
  const currentGeneratedStory = useMemo(() => storyResponse ? responseToLibraryStory(storyResponse, currentStoryId || createStoryId(storyResponse.story)) : null, [currentStoryId, storyResponse]);
  const currentSeriesEpisode = useMemo(() => findEpisodeInLibrarySeries(savedStories, currentStoryId), [currentStoryId, savedStories]);
  const canGenerate = Boolean(worldBible.content.trim() && characterProfiles.content.trim() && storySeed.content.trim() && !isGenerating);

  function cancelActiveGeneration() {
    activeGenerationRequestId.current += 1;
    const hadActiveGeneration = Boolean(activeGenerationAbortController.current) || isGenerating;
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
    if (typeof window !== "undefined") window.history.pushState(null, "", window.location.pathname);
  }

  function navigateToView(view: AppView, options?: { preserveGeneration?: boolean }) {
    if (view === "home") {
      navigateHome(options);
      return;
    }
    setActiveView(view);
    if (typeof window === "undefined") return;
    window.history.pushState(null, "", `${window.location.pathname}?view=${view}`);
  }

  async function handleGenerate(overrides: { generationMode: GenerationMode; worldBible?: string; characterProfiles?: string; storySeed?: string; storyRules?: string; genrePreset?: GenrePreset; narrativeArchitecture?: NarrativeArchitecture; characterArc?: CharacterArc; endingType?: EndingType; lengthTarget?: LengthTarget; readerMood?: ReaderMoodSnapshot | null; presentation?: Exclude<GeneratedStoryPresentation, null>; loadingMessage?: string; signalSource?: ReaderProfileEventSource; generationSource?: Exclude<GenerationSource, null>; continuationStoryId?: string; continuationContextIncluded?: boolean; selectedSeriesId?: string | null; sourceStoryId?: string | null }) {
    const nextGenerationSource = overrides.generationSource ?? (overrides.generationMode === "continue_series" ? "continue-story" : "new-story");
    const continuationStoryId = nextGenerationSource === "continue-story" ? overrides.continuationStoryId?.trim() ?? "" : "";

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
    const generationIdentity = createGenerationIdentity({ generationMode: overrides.generationMode, activeStoryId: activeCommittedStoryId || currentStoryId || null, activeSeriesId: activeCommittedSeriesId || (storyResponse?.metadata.diagnostics.seriesId ?? null), selectedSeriesId: overrides.selectedSeriesId ?? null, sourceStoryId: overrides.sourceStoryId ?? null });
    setError("");
    setStatusMessage(overrides.loadingMessage ?? "");
    setLastGenerationTrigger(overrides.signalSource ?? "create");
    setGenerationSource(nextGenerationSource);
    setPendingGenerationMode(overrides.generationMode);
    setLastGenerationCancelledOrAborted(false);
    setLastRequestIncludedContinuationStoryId(Boolean(continuationStoryId));
    setLastContinuationContextIncluded(Boolean(overrides.continuationContextIncluded));
    setLastContinuationBlockedBecauseContextMissing(false);
    const activeCanonicalProfile = mirrorCanonicalReaderProfilePreferences(loadCanonicalReaderProfile(), readReaderProfile(), eerieReaderProfile);
    setCanonicalReaderProfile(activeCanonicalProfile);
    const personalization = buildNewStoryPersonalization({
      eerieProfile: eerieReaderProfile,
      genre: overrides?.genrePreset ?? genrePreset,
      mode: nextGenerationSource,
      profile: readReaderProfile(),
      source: getReaderProfileSource(cloudReaderProfileSync),
      trigger: overrides.signalSource ?? "create",
      continuationStoryId,
      canonicalProfile: activeCanonicalProfile
    });
    setLastNewStoryPersonalization(personalization.diagnostics);
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          worldBible: overrides?.worldBible ?? worldBible.content,
          characterProfiles: overrides?.characterProfiles ?? characterProfiles.content,
          storySeed: overrides?.storySeed ?? storySeed.content,
          storyRules: overrides?.storyRules ?? storyRules.content,
          genrePreset: overrides?.genrePreset ?? genrePreset,
          narrativeArchitecture: overrides?.narrativeArchitecture ?? narrativeArchitecture,
          characterArc: overrides?.characterArc ?? characterArc,
          endingType: overrides?.endingType ?? endingType,
          lengthTarget: overrides?.lengthTarget ?? lengthTarget,
          generationMode: overrides.generationMode,
          generationIdentity,
          continuationContextIncluded: Boolean(overrides.continuationContextIncluded),
          generationTrigger: getGenerationTriggerLabel(overrides.generationMode, overrides.signalSource ?? "create"),
          readerMood: overrides?.readerMood ?? readerProfile.latestMood ?? null,
          ...(personalization.prompt ? { personalizationContext: personalization.prompt } : {}),
          readerProfileGenerationSnapshot: personalization.snapshot,
          readerProfileInput: buildGenerationReaderProfileInput(activeCanonicalProfile),
          ...(continuationStoryId ? { continuationStoryId } : {})
        })
      });
      const payload = await response.json();
      if (activeGenerationRequestId.current !== requestId) return;
      if (!response.ok) throw new Error(payload.error ?? "Story generation failed.");
      const normalizedResponse = normalizeGenerateStoryResponse(payload);
      setLastNewStoryPersonalization((current) => ({
        ...current,
        responseSnapshot: normalizedResponse.metadata.diagnostics.readerProfileSnapshot ?? normalizedResponse.metadata.diagnostics.readerProfileGenerationSnapshot,
        identityDiagnostics: {
          identity: {
            generationMode: normalizedResponse.metadata.diagnostics.generationMode,
            storyId: normalizedResponse.metadata.diagnostics.storyId,
            seriesId: normalizedResponse.metadata.diagnostics.seriesId,
            parentSeriesId: normalizedResponse.metadata.diagnostics.parentSeriesId ?? null,
            sourceStoryId: normalizedResponse.metadata.diagnostics.sourceStoryId ?? null,
            createdAt: generationIdentity.createdAt
          },
          continuationContextIncluded: normalizedResponse.metadata.diagnostics.continuationContextIncluded,
          newSeriesCreated: normalizedResponse.metadata.diagnostics.newSeriesCreated,
          trigger: normalizedResponse.metadata.diagnostics.generationTrigger,
          activeCommittedStoryId: normalizedResponse.metadata.diagnostics.storyId,
          activeCommittedSeriesId: normalizedResponse.metadata.diagnostics.seriesId,
          pendingGenerationMode: "none",
          lastGenerationCancelledOrAborted: false
        }
      }));
      const generatedStoryId = normalizedResponse.metadata.diagnostics.storyId || generationIdentity.storyId;
      const savedStory = createSavedStory(normalizedResponse, generatedStoryId);
      const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
      persistSavedStories(nextSavedStories);
      setSavedStories(nextSavedStories);
      setStoryResponse(normalizedResponse);
      setCurrentStoryId(generatedStoryId);
      setActiveCommittedStoryId(generatedStoryId);
      setActiveCommittedSeriesId(normalizedResponse.metadata.diagnostics.seriesId);
      setGeneratedStoryPresentation(overrides?.presentation ?? "first-episode");
      const generatedAt = new Date().toISOString();
      const canonicalAfterGeneration = saveCanonicalReaderProfile({ ...activeCanonicalProfile, updatedAt: generatedAt, signals: { ...activeCanonicalProfile.signals, lastStoryGeneratedAt: generatedAt, lastGenerationUsedCanonicalProfile: true } });
      setCanonicalReaderProfile(canonicalAfterGeneration);
      if (overrides.generationMode === "new_story") { recordReaderSignal({ eventType: "storyGenerated", source: "startSomethingNew", storyId: generatedStoryId, title: savedStory.title, genre: savedStory.genrePreset, wordCount: savedStory.wordCount }); }
      else { recordReaderSignal({ eventType: "storyGenerated", source: overrides.signalSource ?? "create", storyId: generatedStoryId, title: savedStory.title, genre: savedStory.genrePreset, wordCount: savedStory.wordCount }); }
      recordReaderSignal({ eventType: "storyOpened", source: overrides?.signalSource ?? "create", storyId: generatedStoryId, title: savedStory.title, genre: savedStory.genrePreset, wordCount: savedStory.wordCount });
      setIsStoryStartSelectionOpen(false);
      clearDemoLatestStory();
      setDemoStory(null);
      navigateHome({ preserveGeneration: true });
      setGenerationApprovedMoodSnapshotId(null);
      setStatusMessage("Story ready.");
    } catch (caughtError) {
      if (activeGenerationRequestId.current !== requestId) return;
      setError(caughtError instanceof Error ? caughtError.message : "Story generation failed.");
    } finally {
      if (activeGenerationRequestId.current === requestId) {
        activeGenerationAbortController.current = null;
        setIsGenerating(false);
        setGenerationSource(null);
        setPendingGenerationMode("none");
      }
    }
  }

  function applyStoryStart(story: StoryStart) {
    setWorldBible({ name: `${slugify(story.title)}-world.txt`, content: story.world });
    setCharacterProfiles({ name: `${slugify(story.title)}-cast.txt`, content: story.cast });
    setStorySeed({ name: `${slugify(story.title)}-spark.txt`, content: story.seed });
    setStoryRules({ name: `${slugify(story.title)}-rules.txt`, content: story.rules });
    setGenrePreset(story.genre);
    setActiveMood(story.mood);
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
      storyRules: [story.rules, FIRST_PAGE_TEST_STORY_RULES].filter(Boolean).join("\n\n"),
      genrePreset: story.genre,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "First Page Test",
      readerMood: readerProfile.latestMood ?? null,
      presentation: "first-episode",
      signalSource: "startSomethingNew",
      generationSource: "new-story"
    });
  }

  function handleStartRecommendation(story: StoryStart) {
    const approvedCurrentMood = Boolean(
      readerProfile.latestMood?.id && generationApprovedMoodSnapshotId === readerProfile.latestMood.id
    );

    if (isStoryStartSelectionOpen && approvedCurrentMood) {
      generateFirstPageTestFromStoryStart(story);
      return;
    }

    setPendingStoryStart(story);
    setMoodIntakeMode("story-start");
    setStatusMessage("Tell Lantyrn what you need from this story.");
    navigateToView("mood-intake");
  }


  function recordReadyStoryQueueSignal(item: ReadyStoryQueueItem, signal: ReadyStoryQueueSignal): ReaderProfile {
    const now = new Date().toISOString();
    const nextProfile = saveReadyStoryQueueSignal({
      storyCardId: item.sourceStorySparkId ?? item.id,
      storyTitle: item.title,
      signal,
      genre: item.genre,
      mood: item.mood,
      source: "desktop-ready-story-queue",
      createdAt: now,
      updatedAt: now
    });

    setReaderProfile(nextProfile);
    void syncReaderProfileToCloud(nextProfile);
    setLastReadyStoryQueueAction(`${signal}: ${item.title}`);
    return nextProfile;
  }

  function removeReadyQueueItemAndPersist(
    itemId: string,
    profileForBackfill = readerProfile,
    savedForLaterQueueForBackfill = savedForLaterStoryQueue
  ) {
    const queueWithOpenSlot = removeReadyStoryQueueItem(readyStoryQueue, itemId);
    const backfilledQueue = fillReadyStoryQueueFromCatalog(queueWithOpenSlot, savedForLaterQueueForBackfill, profileForBackfill);
    const nextQueue = persistReadyStoryQueue(backfilledQueue);
    setReadyStoryQueue(nextQueue);
    return nextQueue;
  }

  function removeSavedForLaterQueueItemAndPersist(itemId: string) {
    const nextSaved = persistSavedForLaterStoryQueue(removeReadyStoryQueueItem(savedForLaterStoryQueue, itemId));
    setSavedForLaterStoryQueue(nextSaved);
    return nextSaved;
  }

  function readyStoryQueueItemToStoryStart(item: ReadyStoryQueueItem): StoryStart {
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
      rules: item.rules
    };
  }

  function openReadyStoryQueueItem(item: ReadyStoryQueueItem, removeItem: (itemId: string, profileForBackfill?: ReaderProfile) => void) {
    if (isGenerating || item.generationStatus === "generating") return;

    const nextProfile = recordReadyStoryQueueSignal(item, "read");
    removeItem(item.id, nextProfile);

    if (item.generationStatus === "ready" && item.generatedStory) {
      const generatedStoryId = item.generatedStoryId || createStoryId(item.generatedStory.story);
      const savedStory = createSavedStory(item.generatedStory, generatedStoryId);
      const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
      persistSavedStories(nextSavedStories);
      setSavedStories(nextSavedStories);
      setStoryResponse(item.generatedStory);
      setCurrentStoryId(generatedStoryId);
      setActiveCommittedStoryId(generatedStoryId);
      setActiveCommittedSeriesId(item.generatedStory.metadata.diagnostics.seriesId);
      setGeneratedStoryPresentation("first-episode");
      setIsStoryStartSelectionOpen(false);
      setPendingStoryStart(null);
      setMoodIntakeMode(null);
      clearDemoLatestStory();
      setDemoStory(null);
      navigateHome({ preserveGeneration: true });
      setStatusMessage(`Opened ${item.title}.`);
      recordReaderSignal({ eventType: "storyOpened", source: "startSomethingNew", storyId: generatedStoryId, title: savedStory.title, genre: savedStory.genrePreset, wordCount: savedStory.wordCount });
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
      generationSource: "new-story"
    });
  }

  function handleReadReadyStory(item: ReadyStoryQueueItem) {
    openReadyStoryQueueItem(item, removeReadyQueueItemAndPersist);
  }

  function handleReadSavedForLaterStory(item: ReadyStoryQueueItem) {
    openReadyStoryQueueItem(item, removeSavedForLaterQueueItemAndPersist);
  }

  function handlePassReadyStory(item: ReadyStoryQueueItem) {
    const nextProfile = recordReadyStoryQueueSignal(item, "pass");
    removeReadyQueueItemAndPersist(item.id, nextProfile);
    setStatusMessage(`Passed ${item.title}.`);
  }

  function handleSaveReadyStoryForLater(item: ReadyStoryQueueItem) {
    const nextProfile = recordReadyStoryQueueSignal(item, "save_for_later");
    const nextSaved = persistSavedForLaterStoryQueue(upsertSavedForLaterStoryQueueItem(savedForLaterStoryQueue, item));
    setSavedForLaterStoryQueue(nextSaved);
    removeReadyQueueItemAndPersist(item.id, nextProfile, nextSaved);
    setStatusMessage(`Saved ${item.title} for later.`);
  }

  function handleMoveSavedForLaterStoryToWaitingQueue(item: ReadyStoryQueueItem) {
    const nextSaved = removeSavedForLaterQueueItemAndPersist(item.id);
    const queueWithMovedItem = [item, ...readyStoryQueue.filter((queueItem) => queueItem.id !== item.id)].slice(0, MAX_READY_STORY_QUEUE_ITEMS);
    const backfilledQueue = fillReadyStoryQueueFromCatalog(queueWithMovedItem, nextSaved, readerProfile);
    const nextQueue = persistReadyStoryQueue(backfilledQueue);
    setReadyStoryQueue(nextQueue);
    setStatusMessage(`Moved ${item.title} back to the waiting queue.`);
  }

  function handleRemoveSavedForLaterStory(item: ReadyStoryQueueItem) {
    removeSavedForLaterQueueItemAndPersist(item.id);
    setStatusMessage(`Removed ${item.title} from saved for later.`);
  }

  function handleStartSomethingNew() {
    if (isGenerating) return;

    const storyStart = suggestedStarts[0] ?? SUGGESTED_STORY_STARTS[0];
    applyStoryStart(storyStart);
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
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "Standard",
      readerMood: readerProfile.latestMood ?? null,
      presentation: "first-episode",
      loadingMessage: "Writing the perfect story for you…",
      signalSource: "startSomethingNew",
      generationSource: "new-story"
    });
  }


  function handleMoodSelect(mood: Mood) {
    setActiveMood(mood);
    recordReaderSignal({ eventType: "moodSelected", mood });
  }

  function handleCreateGenerateClick() {
    if (isGenerating) return;

    const approvedCurrentMood = Boolean(
      readerProfile.latestMood?.id && generationApprovedMoodSnapshotId === readerProfile.latestMood.id
    );

    if (approvedCurrentMood) {
      void handleGenerate({ generationMode: "new_story", readerMood: readerProfile.latestMood ?? null, signalSource: "create", generationSource: "new-story" });
      return;
    }

    setPendingStoryStart(null);
    setMoodIntakeMode("generate");
    setStatusMessage("Tell Lantyrn what you need before it writes.");
    navigateToView("mood-intake");
  }

  function handleMoodIntakeSubmit(draft: ReaderMoodDraft) {
    const nextProfile = saveReaderMoodSnapshot(draft);
    const latestMood = nextProfile.latestMood ?? null;
    const signaledProfile = recordReaderProfileEvent({ eventType: "moodSelected", mood: latestMood?.mood || draft.mood });
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
      setStatusMessage(`Generating ${storyStartToApply.title} from your reader pulse.`);
      void handleGenerate({
        generationMode: "new_story",
        worldBible: storyStartToApply.world,
        characterProfiles: storyStartToApply.cast,
        storySeed: storyStartToApply.seed,
        storyRules: [storyStartToApply.rules, FIRST_PAGE_TEST_STORY_RULES].filter(Boolean).join("\n\n"),
        genrePreset: storyStartToApply.genre,
        narrativeArchitecture,
        characterArc,
        endingType,
        lengthTarget: "First Page Test",
        readerMood: latestMood,
        presentation: "first-episode",
        signalSource: "startSomethingNew",
        generationSource: "new-story"
      });
      return;
    }

    if (modeToComplete === "story-start") {
      setIsStoryStartSelectionOpen(true);
      navigateHome({ preserveGeneration: true });
      setStatusMessage("Reader pulse saved. Choose a story based on your reader pulse.");
      return;
    }

    if (modeToComplete === "generate") {
      setStatusMessage("Reader pulse saved. Generating story.");
      void handleGenerate({ generationMode: "new_story", readerMood: latestMood, signalSource: "create", generationSource: "new-story" });
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
    const profileId = cloudReaderProfileSync.profileId || readOrCreateReaderProfileId();
    setCloudReaderProfileSync((current) => ({ ...current, profileId, status: "pending", localUpdatedAt: "", localProfileExists: false }));
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

  async function reconcileReaderProfileWithCloud(profileId: string, localProfile: ReaderProfile) {
    try {
      const response = await fetch(`/api/reader-profile?profileId=${encodeURIComponent(profileId)}`, { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 503) {
        updateCloudReaderProfileSync({ profileId, status: "unavailable", lastSaveOutcome: "unavailable", lastError: payload.error ?? "Reader profile cloud persistence is unavailable.", localUpdatedAt: localProfile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage() });
        return;
      }

      if (!response.ok) throw new Error(payload.error ?? "Reader profile cloud sync failed.");

      const cloudProfile = normalizeCloudReaderProfile(payload.profile);
      const cloudUpdatedAt = cloudProfile?.updatedAt ?? "";
      if (cloudProfile && cloudUpdatedAt > localProfile.updatedAt) {
        persistReaderProfile(cloudProfile);
        setReaderProfile(cloudProfile);
        updateCloudReaderProfileSync({ profileId, status: "synced", cloudUpdatedAt, localUpdatedAt: cloudProfile.updatedAt, localProfileExists: true, lastError: "" });
        return;
      }

      if (localProfile.profileExists) {
        await saveReaderProfileToCloud(profileId, localProfile);
        return;
      }

      updateCloudReaderProfileSync({ profileId, status: "not found", cloudUpdatedAt, localUpdatedAt: localProfile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage(), lastError: "" });
    } catch (caughtError) {
      updateCloudReaderProfileSync({ profileId, status: "error", lastSaveOutcome: "error", lastError: formatErrorMessage(caughtError), localUpdatedAt: localProfile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage() });
    }
  }

  async function syncReaderProfileToCloud(profile: ReaderProfile) {
    const profileId = cloudReaderProfileSync.profileId || readOrCreateReaderProfileId();
    updateCloudReaderProfileSync({ profileId, status: "pending", localUpdatedAt: profile.updatedAt, localProfileExists: true });

    try {
      await saveReaderProfileToCloud(profileId, profile);
    } catch (caughtError) {
      updateCloudReaderProfileSync({ profileId, status: "error", lastSaveOutcome: "error", lastError: formatErrorMessage(caughtError), localUpdatedAt: profile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage() });
    }
  }

  async function saveReaderProfileToCloud(profileId: string, profile: ReaderProfile) {
    const response = await fetch("/api/reader-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, profile })
    });
    const payload = (await response.json().catch(() => ({}))) as ReaderProfileSaveResponse;

    if (response.status === 503) {
      updateCloudReaderProfileSync({ profileId, status: "unavailable", lastSaveOutcome: "unavailable", lastError: payload.error ?? "Reader profile cloud persistence is unavailable.", localUpdatedAt: profile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage() });
      return;
    }

    if (!response.ok) throw new Error(payload.error ?? "Reader profile cloud save failed.");

    const savedProfile = normalizeCloudReaderProfile(payload.profile);
    if (payload.cloudProfileSaveStatus === "stale-write-ignored") {
      updateCloudReaderProfileSync({ profileId, status: "synced", lastSaveOutcome: "stale-write-ignored", lastSyncAt: new Date().toISOString(), lastError: "", localUpdatedAt: profile.updatedAt, ...(savedProfile ? { cloudUpdatedAt: savedProfile.updatedAt } : {}), localProfileExists: readerProfileExistsInLocalStorage() });
      return;
    }

    const cloudProfile = savedProfile ?? profile;
    updateCloudReaderProfileSync({ profileId, status: "synced", lastSaveOutcome: "saved", lastSyncAt: new Date().toISOString(), lastError: "", localUpdatedAt: cloudProfile.updatedAt, cloudUpdatedAt: cloudProfile.updatedAt, localProfileExists: readerProfileExistsInLocalStorage() });
  }

  async function deleteCloudReaderProfile(profileId: string) {
    try {
      const response = await fetch(`/api/reader-profile?profileId=${encodeURIComponent(profileId)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (response.status === 503) {
        updateCloudReaderProfileSync({ profileId, status: "unavailable", lastError: payload.error ?? "Reader profile cloud persistence is unavailable.", localUpdatedAt: "", cloudUpdatedAt: "", localProfileExists: false });
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Reader profile cloud delete failed.");
      updateCloudReaderProfileSync({ profileId, status: "not found", lastSyncAt: new Date().toISOString(), lastError: "", localUpdatedAt: "", cloudUpdatedAt: "", localProfileExists: false });
    } catch (caughtError) {
      updateCloudReaderProfileSync({ profileId, status: "error", lastError: formatErrorMessage(caughtError), localUpdatedAt: "", localProfileExists: false });
    }
  }

  function updateCloudReaderProfileSync(update: Partial<CloudReaderProfileSyncState>) {
    setCloudReaderProfileSync((current) => ({ ...current, ...update }));
  }

  function handleLoadDemoStory() {
    if (hasRealLatestStory) return;
    cancelActiveGeneration();
    setStoryResponse(null);
    setCurrentStoryId("");
    setGeneratedStoryPresentation(null);
    const nextDemoStory = createDemoLatestStory();
    persistDemoLatestStory(nextDemoStory);
    recordReaderSignal({ eventType: "demoStoryLoaded", source: "demo", storyId: nextDemoStory.id, title: nextDemoStory.title, genre: nextDemoStory.genrePreset, wordCount: nextDemoStory.wordCount });
    recordReaderSignal({ eventType: "storyOpened", source: "demo", storyId: nextDemoStory.id, title: nextDemoStory.title, genre: nextDemoStory.genrePreset, wordCount: nextDemoStory.wordCount });
    setDemoStory(nextDemoStory);
    navigateHome({ preserveGeneration: true });
    setStatusMessage("Demo story loaded for review. Your saved history was not changed.");
  }

  function handleClearDemoStory() {
    cancelActiveGeneration();
    clearDemoLatestStory();
    setDemoStory(null);
    setStatusMessage("Demo story cleared. Your saved history was not changed.");
  }

  function handleContinueLatest(direction?: string) {
    const storyToContinue = currentGeneratedStory ?? latestStory;
    const storyId = storyToContinue?.id?.trim() ?? "";
    const storyText = storyToContinue?.story?.trim() ?? "";

    if (!storyToContinue || !storyId || !storyText) {
      setLastGenerationTrigger("continueSeries");
      setLastRequestIncludedContinuationStoryId(Boolean(storyId));
      setLastContinuationContextIncluded(false);
      setLastContinuationBlockedBecauseContextMissing(true);
      setStatusMessage("Open a saved story before continuing it. Continuation was not started because story context is missing.");
      return;
    }

    recordReaderSignal({ eventType: "storyContinued", source: "continueSeries", storyId, title: storyToContinue.title, genre: storyToContinue.genrePreset, wordCount: storyToContinue.wordCount });
    const priorChapterContext = truncateText(storyText, 9000);
    const continuationSeed = [
      "Continue this story with the next chapter. Do not rewrite, restart, summarize, or retell the existing chapter. Begin after the events already shown.",
      `Active story id to continue: ${storyId}.`,
      `Existing chapter title: ${storyToContinue.title}.`,
      `Prior chapter context for continuity:\n${priorChapterContext}`,
      direction?.trim() ? `Reader direction for the next chapter: ${direction.trim()}` : "Continue directly from the strongest unresolved story pressure."
    ].join("\n\n");
    void handleGenerate({
      generationMode: "continue_series",
      selectedSeriesId: getContinuationSeriesId(storyToContinue, storyId, storyResponse, activeCommittedStoryId, activeCommittedSeriesId),
      sourceStoryId: storyId,
      worldBible: worldBible.content.trim() || `Existing story world inferred from ${storyToContinue.title}. Genre: ${storyToContinue.genrePreset}.`,
      characterProfiles: characterProfiles.content.trim() || `Top cast: ${storyToContinue.charactersUsed.length ? storyToContinue.charactersUsed.join(", ") : "use the established characters from the prior chapter"}.`,
      storySeed: continuationSeed,
      storyRules: [storyRules.content, "Continuation rule: write only the next chapter after the prior chapter context; do not rewrite, restart, summarize, or retell the prior chapter."].filter(Boolean).join("\n\n"),
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
      continuationContextIncluded: true
    });
  }

  function handleSaveStory() {
    if (!storyResponse) return;
    const savedStory = createSavedStory(storyResponse, currentStoryId || createStoryId(storyResponse.story));
    const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
    persistSavedStories(nextSavedStories);
    setSavedStories(nextSavedStories);
    setStatusMessage("Story saved locally in this browser.");
  }

  function handleRestoreStory(story: SavedStory) {
    cancelActiveGeneration();
    setStoryResponse(savedStoryToResponse(story));
    setCurrentStoryId(story.id);
    setActiveCommittedStoryId(story.id);
    setActiveCommittedSeriesId(story.seriesId ?? story.id);
    setGeneratedStoryPresentation("saved-episode");
    clearDemoLatestStory();
    setDemoStory(null);
    recordReaderSignal({ eventType: "storyOpened", storyId: story.id, title: story.title, genre: story.genrePreset, wordCount: story.wordCount });
    navigateHome({ preserveGeneration: true });
    setStatusMessage(`Restored ${story.title}.`);
  }


  function handleRestoreStoryById(storyId: string) {
    const story = findLibraryStoryBySavedId(savedStories, storyId);
    if (!story) {
      setStatusMessage("Could not open that saved episode because it was not found.");
      return;
    }

    const episode = findEpisodeInLibrarySeries(savedStories, story.id);
    setLastLibraryOpenedStoryId(story.id);
    setLastLibraryOpenedEpisodeNumber(episode?.episodeNumber ?? null);
    handleRestoreStory(story);
  }

  function handleDeleteStory(storyId: string) {
    const nextStories = savedStories.filter((story) => story.id !== storyId);
    persistSavedStories(nextStories);
    setSavedStories(nextStories);
    setStatusMessage("Saved story deleted.");
  }

  function handleOpenCurrentStory() {
    if (currentGeneratedStory) recordReaderSignal({ eventType: "storyOpened", storyId: currentGeneratedStory.id, title: currentGeneratedStory.title, genre: currentGeneratedStory.genrePreset, wordCount: currentGeneratedStory.wordCount });
    navigateHome({ preserveGeneration: true });
  }

  function handleExportLatestStory() {
    if (!latestStory) return;
    recordReaderSignal({ eventType: "storyExported", storyId: latestStory.id, title: latestStory.title, genre: latestStory.genrePreset, wordCount: latestStory.wordCount });
    downloadTextFile(`${slugify(latestStory.title)}.txt`, latestStory.story);
  }

  function handleSaveProject() {
    const trimmedName = projectName.trim();
    if (!trimmedName) return setError("Add a project name before saving this workspace.");
    const now = new Date().toISOString();
    const existing = savedProjects.find((project) => project.id === selectedProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget },
      latestStory: storyResponse,
      latestStoryFeedback: null
    };
    const nextProjects = [savedProject, ...savedProjects.filter((project) => project.id !== savedProject.id)];
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
    const nextProjects = savedProjects.filter((project) => project.id !== selectedProjectId);
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId("");
    setStatusMessage("Project deleted from this browser.");
  }

  async function handleRefreshCloudProjects() {
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ projects?: CloudProjectSummary[] }>("/api/projects");
      setCloudProjects(Array.isArray(payload.projects) ? payload.projects : []);
      setCloudProjectMessage("");
    } catch (caughtError) {
      setCloudProjects([]);
      setCloudProjectMessage(`Cloud projects unavailable: ${formatCaughtError(caughtError)}`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleSaveCloudProject() {
    const trimmedName = projectName.trim();
    if (!trimmedName) return setError("Add a project name before saving to cloud projects.");
    const now = new Date().toISOString();
    const existing = cloudProjects.find((project) => project.id === selectedCloudProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget },
      latestStory: storyResponse,
      latestStoryFeedback: null
    };
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: savedProject }) });
      const cloudProject = payload.project ?? savedProject;
      setSelectedCloudProjectId(cloudProject.id);
      setCloudProjects((currentProjects) => [cloudProject, ...currentProjects.filter((project) => project.id !== cloudProject.id)]);
      setCloudProjectMessage(`${cloudProject.name} saved to cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud save failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleLoadCloudProject(projectId: string) {
    setSelectedCloudProjectId(projectId);
    if (!projectId) return;
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!payload.project) throw new Error("Cloud project response was missing a project.");
      applyProject(payload.project);
      clearDemoLatestStory();
      setDemoStory(null);
      setCloudProjectMessage(`${payload.project.name} loaded from cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud load failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleDeleteCloudProject() {
    if (!selectedCloudProjectId) return;
    setIsCloudProjectsLoading(true);
    try {
      await fetchCloudJson(`/api/projects/${encodeURIComponent(selectedCloudProjectId)}`, { method: "DELETE" });
      setCloudProjects((currentProjects) => currentProjects.filter((project) => project.id !== selectedCloudProjectId));
      setSelectedCloudProjectId("");
      setCloudProjectMessage("Cloud project deleted.");
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud delete failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
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
    setCurrentStoryId(project.latestStory ? createStoryId(project.latestStory.story, project.updatedAt) : "");
  }

  function handleSaveInputArtifact(type: InputArtifactType, value: UploadState) {
    if (!value.content.trim()) return setError(`Add ${INPUT_LABELS[type]} content before saving it to the library.`);
    const now = new Date().toISOString();
    const name = value.name.trim() || `${INPUT_LABELS[type]} ${formatLibraryVersion(now)}`;
    const artifact: InputArtifact = { id: createInputArtifactId(type, name, now), type, name, content: value.content, createdAt: now, updatedAt: now, characterCount: value.content.length };
    const nextArtifacts = [artifact, ...inputArtifacts];
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setStatusMessage(`${artifact.name} saved to the local library.`);
  }

  function handleSelectInputArtifact(type: InputArtifactType, artifactId: string) {
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) return setUploadForType(type, { ...EMPTY_UPLOAD });
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
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

  const handleFeedbackDraftStateChange = useCallback((state: { hasUnsavedChanges: boolean; saveBlockedBecauseRatingMissing: boolean }) => {
    setFeedbackDraftHasUnsavedChanges(state.hasUnsavedChanges);
    setFeedbackSaveBlockedBecauseRatingMissing(state.saveBlockedBecauseRatingMissing);
    if (!state.hasUnsavedChanges) setGenerationBlockedBecauseUnsavedFeedback(false);
  }, []);

  function blockGenerationForUnsavedFeedback(): boolean {
    if (!feedbackDraftHasUnsavedChanges) return false;
    setGenerationBlockedBecauseUnsavedFeedback(true);
    setStatusMessage("Save feedback before starting another story.");
    return true;
  }

  function handleReaderContinue() {
    if (blockGenerationForUnsavedFeedback()) return;
    handleContinueLatest();
  }

  function handleSavedEpisodeNext() {
    const currentId = currentStoryId.trim();
    if (!currentId) {
      handleReaderContinue();
      return;
    }

    const nextSavedEpisode = findNextSavedEpisodeInSeries(savedStories, currentId);
    if (nextSavedEpisode) {
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

  function handleStoryFeedbackChange(story: LibraryStory, rating: StoryFeedbackRating, reasons: StoryFeedbackReason[]) {
    if (!story.id) return;
    const now = new Date().toISOString();
    const existingSignal = readerProfile.storyFeedbackSignals?.find((signal) => signal.storyId === story.id);
    const signal: StoryFeedbackSignal = {
      storyId: story.id,
      storyTitle: story.title,
      rating,
      score: STORY_FEEDBACK_SCORE_BY_RATING[rating],
      reasons,
      generationMode: readStoryFeedbackGenerationMode(generatedStoryPresentation),
      createdAt: existingSignal?.createdAt || now,
      updatedAt: now,
    };
    const nextProfile = saveStoryFeedbackSignal(signal);
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
        format: generatedStoryPresentation === "continuation" ? "episode" : "story",
        durationMinutes: Math.max(1, Math.round((story.wordCount || 0) / 180)),
      },
    };
    const currentCanonicalProfile = loadCanonicalReaderProfile();
    const savedForLaterCount = Math.max(currentCanonicalProfile.signals.savedForLaterCount ?? 0, nextProfile.readyStoryQueueSignals?.filter((item) => item.signal === "save_for_later").length ?? 0);
    const nextCanonicalProfile = saveCanonicalReaderProfile(applyFeedbackToReaderProfile({
      ...currentCanonicalProfile,
      signals: { ...currentCanonicalProfile.signals, savedForLaterCount },
    }, feedbackEvent));
    setCanonicalReaderProfile(nextCanonicalProfile);

    void syncReaderProfileToCloud(nextProfile);
    setGenerationBlockedBecauseUnsavedFeedback(false);
    setStatusMessage("Feedback saved to reader profile.");
  }

  function recordReaderSignal(event: ReaderProfileEventInput) {
    const nextProfile = recordReaderProfileEvent(event);
    setReaderProfile(nextProfile);
    void syncReaderProfileToCloud(nextProfile);
  }

  function handleStartSomethingDifferent() {
    if (currentGeneratedStory) {
      recordReaderSignal({ eventType: "startSomethingDifferentClicked", source: "startSomethingNew", storyId: currentGeneratedStory.id, title: currentGeneratedStory.title, genre: currentGeneratedStory.genrePreset, wordCount: currentGeneratedStory.wordCount });
    } else {
      recordReaderSignal({ eventType: "startSomethingDifferentClicked", source: "startSomethingNew" });
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
    setStatusMessage("Current inputs cleared. Saved library items were not changed.");
  }

  const currentStoryFeedback = currentStoryId ? readerProfile.storyFeedbackSignals?.find((signal) => signal.storyId === currentStoryId) ?? null : null;
  const isNewStoryGenerating = isGenerating && generationSource === "new-story";
  const isContinuationGenerating = isGenerating && generationSource === "continue-story";

  const diagnosticsPanels = (
    <>
      <AppStateDiagnostics activeView={activeView} activeCommittedSeriesId={activeCommittedSeriesId} activeCommittedStoryId={activeCommittedStoryId} currentEpisodeNumber={currentSeriesEpisode?.episodeNumber ?? null} currentStoryFeedback={currentStoryFeedback} currentStoryId={currentStoryId} feedbackDraftHasUnsavedChanges={feedbackDraftHasUnsavedChanges} feedbackSaveBlockedBecauseRatingMissing={feedbackSaveBlockedBecauseRatingMissing} generationBlockedBecauseUnsavedFeedback={generationBlockedBecauseUnsavedFeedback} generationSource={generationSource} isGenerating={isGenerating} lastContinuationBlockedBecauseContextMissing={lastContinuationBlockedBecauseContextMissing} lastContinuationContextIncluded={lastContinuationContextIncluded} lastGenerationCancelledOrAborted={lastGenerationCancelledOrAborted} lastGenerationTrigger={lastGenerationTrigger} lastLibraryOpenedEpisodeNumber={lastLibraryOpenedEpisodeNumber} lastLibraryOpenedStoryId={lastLibraryOpenedStoryId} lastNewStoryPersonalization={lastNewStoryPersonalization} lastReadyStoryPreparationOutcome={lastReadyStoryPreparationOutcome} lastReadyStoryPreparationStatus={readyStoryPreparationStatus} lastReadyStoryQueueAction={lastReadyStoryQueueAction} lastRequestIncludedContinuationStoryId={lastRequestIncludedContinuationStoryId} pendingGenerationMode={pendingGenerationMode} profile={readerProfile} readyStoryQueue={readyStoryQueue} savedForLaterStoryQueue={savedForLaterStoryQueue} />
      <ReaderProfileDiagnostics canonicalProfile={canonicalReaderProfile} cloudSync={cloudReaderProfileSync} lastGenerationUsedCanonicalProfile={Boolean(canonicalReaderProfile?.signals.lastGenerationUsedCanonicalProfile || lastNewStoryPersonalization.responseSnapshot?.canonicalReaderProfileUsed)} onClear={handleClearReaderProfile} profile={readerProfile} />
      <EerieReaderProfileDiagnostics profile={eerieReaderProfile} onClear={handleClearEerieReaderProfile} />
    </>
  );

  return (
    <main className="min-h-dvh w-full max-w-full overflow-x-hidden px-3 pb-[calc(env(safe-area-inset-bottom)+6.5rem)] pt-3 text-paper sm:px-4 md:px-8 md:pb-7 md:pt-7">
      <section className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 md:gap-6">
        <MobileTopHeader
          onGoHome={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("lantern:reset-mobile-home-gate"));
            }
            navigateHome();
          }}
        />
        <header className="hidden min-w-0 flex-col gap-5 border-b border-paper/10 pb-6 md:flex md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold sm:tracking-[0.22em]">Lantyrn</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-paper md:text-5xl">Living stories, ready when you are</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-paper/70">Open the latest episode, remember what mattered, and choose what kind of story should find you next.</p>
          </div>
          <NavTabs activeView={activeView} onChange={navigateToView} />
        </header>

        {statusMessage ? <Status tone="info">{statusMessage}</Status> : null}
        {isGenerating ? <StopGenerationControl onStop={handleStopGeneration} /> : null}
        {error ? <Status tone="error">{error}</Status> : null}

        <div className="hidden min-w-0 gap-5 md:grid">{diagnosticsPanels}</div>

        {activeView === "mood-intake" ? (
          <MoodIntakeView
            onCancel={handleMoodIntakeCancel}
            onSubmit={handleMoodIntakeSubmit}
            pendingStoryTitle={pendingStoryStart?.title ?? null}
          />
        ) : null}
        {activeView === "home" && currentGeneratedStory && generatedStoryPresentation ? <EpisodeReader feedback={currentStoryFeedback} generationBlockedBecauseUnsavedFeedback={generationBlockedBecauseUnsavedFeedback} isGenerating={isContinuationGenerating} onContinue={generatedStoryPresentation === "saved-episode" ? handleSavedEpisodeNext : handleReaderContinue} onExport={handleExportLatestStory} onFeedbackChange={handleStoryFeedbackChange} onFeedbackDraftStateChange={handleFeedbackDraftStateChange} onStartDifferent={handleReaderStartDifferent} eyebrow={generatedStoryPresentation === "first-episode" ? "New Story" : generatedStoryPresentation === "saved-episode" ? "Saved Episode" : "Next Episode"} continueLabel={generatedStoryPresentation === "saved-episode" ? "Next Episode" : "Continue this story"} episodeNumber={currentSeriesEpisode?.episodeNumber ?? null} generationProfileSnapshot={storyResponse?.metadata.diagnostics.readerProfileSnapshot ?? storyResponse?.metadata.diagnostics.readerProfileGenerationSnapshot} source={storyResponse?.metadata.source ?? "fallback"} story={currentGeneratedStory} /> : null}
        {activeView === "home" && !(currentGeneratedStory && generatedStoryPresentation) ? <HomeView activeMood={activeMood} canUseDemoStory={!hasRealLatestStory} continueDirection={continueDirection} hasDemoStory={Boolean(demoStory)} isDirectionOpen={isDirectionOpen} isGenerating={isGenerating} isContinuationGenerating={isContinuationGenerating} isNewStoryGenerating={isNewStoryGenerating} latestStory={latestStory} onClearDemoStory={handleClearDemoStory} onContinue={handleContinueLatest} onDirectionChange={setContinueDirection} onExportStory={handleExportLatestStory} onLoadDemoStory={handleLoadDemoStory} onMoodSelect={handleMoodSelect} onStartNewStory={handleStartSomethingNew} onStartRecommendation={handleStartRecommendation} onToggleDirection={() => setIsDirectionOpen((current) => !current)} showStoryStartOptions={isStoryStartSelectionOpen} readyStoryQueue={readyStoryQueue} savedForLaterStoryQueue={savedForLaterStoryQueue} onPassReadyStory={handlePassReadyStory} onReadReadyStory={handleReadReadyStory} onSaveReadyStoryForLater={handleSaveReadyStoryForLater} suggestedStarts={suggestedStarts} /> : null}
        {activeView === "library" ? <LibraryView cloudMessage={cloudProjectMessage} cloudProjects={cloudProjects} isCloudLoading={isCloudProjectsLoading} onDeleteCloudProject={handleDeleteCloudProject} onDeleteProject={handleDeleteProject} onDeleteStory={handleDeleteStory} onLoadCloudProject={handleLoadCloudProject} onLoadProject={handleLoadProject} onMoveSavedForLaterToWaitingQueue={handleMoveSavedForLaterStoryToWaitingQueue} onOpenSavedStoryById={handleRestoreStoryById} onProjectNameChange={setProjectName} onReadSavedForLater={handleReadSavedForLaterStory} onRefreshCloud={handleRefreshCloudProjects} onRemoveSavedForLater={handleRemoveSavedForLaterStory} onSaveCloudProject={handleSaveCloudProject} onSaveProject={handleSaveProject} onSaveStory={handleSaveStory} projectName={projectName} savedForLaterStoryQueue={savedForLaterStoryQueue} savedProjects={savedProjects} savedStories={savedStories} selectedCloudProjectId={selectedCloudProjectId} selectedProjectId={selectedProjectId} storyResponse={storyResponse} /> : null}
        {activeView === "worlds" ? <WorldsView onOpenStory={handleStartRecommendation} /> : null}
        {activeView === "create" ? <CreateView canGenerate={canGenerate} characterArc={characterArc} characterProfiles={characterProfiles} endingType={endingType} genrePreset={genrePreset} inputArtifacts={inputArtifacts} isGenerating={isGenerating} lengthTarget={lengthTarget} narrativeArchitecture={narrativeArchitecture} onChangeCharacterArc={setCharacterArc} onChangeCharacterProfiles={setCharacterProfiles} onChangeEndingType={setEndingType} onChangeGenre={setGenrePreset} onChangeLengthTarget={setLengthTarget} onChangeNarrative={setNarrativeArchitecture} onChangeStoryRules={setStoryRules} onChangeStorySeed={setStorySeed} onChangeWorld={setWorldBible} onClear={clearCurrentInputs} onGenerate={handleCreateGenerateClick} onSaveInputArtifact={handleSaveInputArtifact} onSelectInputArtifact={handleSelectInputArtifact} storyRules={storyRules} storySeed={storySeed} worldBible={worldBible} /> : null}
        {activeView === "characters" ? <CharactersView onOpenStory={handleStartRecommendation} /> : null}

        <details className="min-w-0 overflow-hidden rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65 md:hidden">
          <summary className="cursor-pointer font-semibold text-paper/75">Developer diagnostics</summary>
          <div className="mt-3 grid min-w-0 gap-3">{diagnosticsPanels}</div>
        </details>
      </section>
      <MobileBottomNav activeView={activeView} onChange={navigateToView} />
    </main>
  );
}

function StopGenerationControl({ onStop }: { onStop: () => void }) {
  return <div className="min-w-0 rounded-md border border-red-300/30 bg-red-950/30 px-4 py-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold text-paper">Story generation is running.</p><button className="min-h-11 w-full rounded-md border border-red-300/60 bg-red-300 px-4 py-2 text-sm font-semibold text-red-950 transition hover:bg-red-200 sm:w-fit" onClick={onStop} type="button">Stop generating</button></div></div>;
}

function EpisodeReader({ continueLabel = "Continue this story", episodeNumber, eyebrow, feedback, generationBlockedBecauseUnsavedFeedback, generationProfileSnapshot, isGenerating, onContinue, onExport, onFeedbackChange, onFeedbackDraftStateChange, onStartDifferent, source, story }: { continueLabel?: string; episodeNumber?: number | null; eyebrow: string; feedback: StoryFeedbackSignal | null; generationBlockedBecauseUnsavedFeedback: boolean; generationProfileSnapshot?: ReaderProfileGenerationSnapshot; isGenerating: boolean; onContinue: () => void; onExport: () => void; onFeedbackChange: (story: LibraryStory, rating: StoryFeedbackRating, reasons: StoryFeedbackReason[]) => void; onFeedbackDraftStateChange: (state: { hasUnsavedChanges: boolean; saveBlockedBecauseRatingMissing: boolean }) => void; onStartDifferent: () => void; source: GenerateStoryResponse["metadata"]["source"]; story: LibraryStory }) {
  return (
    <article className="grid min-w-0 gap-5 rounded-md border border-lantern-gold/25 bg-paper/10 p-4 shadow-soft sm:p-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">{episodeNumber ? `${eyebrow} · Episode ${episodeNumber}` : eyebrow}</p>
        <h2 className="mt-2 break-words text-3xl font-semibold leading-tight text-paper md:text-5xl">{story.title}</h2>
        <p className="mt-3 text-sm leading-6 text-paper/60">{story.wordCount.toLocaleString()} words | {story.genrePreset} | {source}</p>
      </div>
      <div className="min-w-0 max-w-full whitespace-pre-wrap break-words rounded-md border border-paper/10 bg-night-ink/70 p-4 text-base leading-8 text-paper/85 [overflow-wrap:anywhere] sm:p-5">{story.story}</div>
      {generationProfileSnapshot ? <GenerationProfileSnapshotPanel snapshot={generationProfileSnapshot} /> : null}
      {story.id ? <StoryFeedbackPanel feedback={feedback} generationBlockedBecauseUnsavedFeedback={generationBlockedBecauseUnsavedFeedback} onDraftStateChange={onFeedbackDraftStateChange} onSave={(rating, reasons) => onFeedbackChange(story, rating, reasons)} storyId={story.id} /> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={isGenerating} onClick={onContinue} type="button">{isGenerating ? <><span className="size-4 animate-spin rounded-full border-2 border-night-ink/30 border-t-night-ink" aria-hidden="true" />Writing the next chapter…</> : continueLabel}</button>
        <button className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-lantern-gold/50" onClick={onExport} type="button">Export</button>
        <button className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-lantern-gold/50" onClick={onStartDifferent} type="button">Start something different</button>
      </div>
    </article>
  );
}

function GenerationProfileSnapshotPanel({ snapshot }: { snapshot: ReaderProfileGenerationSnapshot }) {
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
    ["Default safety guardrails", snapshot.defaultSafetyGuardrailsSummary || "none"],
    ["Mood signal", snapshot.moodSignal || "none"],
    ["Genre signal", snapshot.genreSignal || "none"],
    ["Snapshot created", snapshot.generatedAt || "none"],
  ];

  return (
    <details className="rounded-md border border-paper/10 bg-night-ink/50 p-4 text-sm text-paper/70">
      <summary className="cursor-pointer font-semibold text-paper">Generation profile snapshot</summary>
      <dl className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">{label}</dt>
            <dd className="mt-1 break-words text-paper/80">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function StoryFeedbackPanel({ feedback, generationBlockedBecauseUnsavedFeedback, onDraftStateChange, onSave, storyId }: { feedback: StoryFeedbackSignal | null; generationBlockedBecauseUnsavedFeedback: boolean; onDraftStateChange: (state: { hasUnsavedChanges: boolean; saveBlockedBecauseRatingMissing: boolean }) => void; onSave: (rating: StoryFeedbackRating, reasons: StoryFeedbackReason[]) => void; storyId: string }) {
  const [draftRating, setDraftRating] = useState<StoryFeedbackRating | null>(feedback?.rating ?? null);
  const [draftReasons, setDraftReasons] = useState<StoryFeedbackReason[]>(feedback?.reasons ?? []);
  const [draftClearedAfterSave, setDraftClearedAfterSave] = useState(false);
  const [clearedFeedbackStoryId, setClearedFeedbackStoryId] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState<string>(feedback ? "Feedback saved to reader profile." : "");

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

  const hasUnsavedChanges = draftClearedAfterSave && !draftRating && draftReasons.length === 0 ? false : !areFeedbackDraftsEqual(draftRating, draftReasons, feedback);
  const saveBlockedBecauseRatingMissing = !draftRating;

  useEffect(() => {
    onDraftStateChange({ hasUnsavedChanges, saveBlockedBecauseRatingMissing });
  }, [hasUnsavedChanges, onDraftStateChange, saveBlockedBecauseRatingMissing]);

  function toggleReason(reason: StoryFeedbackReason) {
    setDraftClearedAfterSave(false);
    setClearedFeedbackStoryId(null);
    setDraftReasons((currentReasons) => {
      if (currentReasons.includes(reason)) return currentReasons.filter((selectedReason) => selectedReason !== reason);
      const mutuallyExclusiveReason = getMutuallyExclusiveFeedbackReason(reason);
      return [...currentReasons.filter((selectedReason) => selectedReason !== mutuallyExclusiveReason), reason];
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
    <section className="grid min-w-0 gap-3 rounded-md border border-paper/10 bg-night-ink/50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-paper">How was this story?</h3>
        <p className="mt-1 text-xs leading-5 text-paper/55">Your rating updates future recommendations and new-story personalization.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {STORY_FEEDBACK_RATING_OPTIONS.map((option) => (
          <button
            aria-pressed={draftRating === option.rating}
            className={`min-h-11 rounded-md border px-3 py-2 text-sm font-semibold transition ${draftRating === option.rating ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50"}`}
            key={option.rating}
            onClick={() => { setDraftClearedAfterSave(false); setClearedFeedbackStoryId(null); setDraftRating(option.rating); }}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/50">Optional reasons</p>
        <div className="flex flex-wrap gap-2">
          {STORY_FEEDBACK_REASON_OPTIONS.map((option) => {
            const isSelected = draftReasons.includes(option.reason);
            return (
              <button
                aria-pressed={isSelected}
                className={`min-h-11 rounded-full border px-3 py-2 text-xs font-semibold transition ${isSelected ? "border-lantern-gold bg-lantern-gold/90 text-night-ink" : "border-paper/15 bg-paper/10 text-paper/80 hover:border-lantern-gold/50"}`}
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
        <button className="min-h-11 w-full rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink sm:w-fit" onClick={saveFeedback} type="button">Save feedback</button>
        <p className={`text-sm font-semibold ${inlineMessage === "Choose a rating before saving feedback." ? "text-lantern-gold" : hasUnsavedChanges ? "text-lantern-gold" : feedback ? "text-paper/70" : "text-paper/50"}`}>{inlineMessage || (hasUnsavedChanges ? "Unsaved feedback" : feedback ? "Feedback saved" : "Select a rating to save feedback.")}</p>
      </div>
      {generationBlockedBecauseUnsavedFeedback && hasUnsavedChanges ? <p className="text-sm font-semibold text-lantern-gold">Save feedback before starting another story.</p> : null}
    </section>
  );
}

function HomeView(props: { activeMood: Mood; canUseDemoStory: boolean; continueDirection: string; hasDemoStory: boolean; isDirectionOpen: boolean; isGenerating: boolean; isContinuationGenerating: boolean; isNewStoryGenerating: boolean; latestStory: LibraryStory | null; onClearDemoStory: () => void; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onExportStory: () => void; onLoadDemoStory: () => void; onMoodSelect: (mood: Mood) => void; onPassReadyStory: (item: ReadyStoryQueueItem) => void; onReadReadyStory: (item: ReadyStoryQueueItem) => void; onSaveReadyStoryForLater: (item: ReadyStoryQueueItem) => void; onStartNewStory: () => void; onStartRecommendation: (story: StoryStart) => void; onToggleDirection: () => void; readyStoryQueue: ReadyStoryQueueItem[]; savedForLaterStoryQueue: ReadyStoryQueueItem[]; showStoryStartOptions: boolean; suggestedStarts: StoryStart[] }) {
  const { activeMood, canUseDemoStory, continueDirection, hasDemoStory, isDirectionOpen, isGenerating, isContinuationGenerating, isNewStoryGenerating, latestStory, onClearDemoStory, onContinue, onDirectionChange, onExportStory, onLoadDemoStory, onMoodSelect, onPassReadyStory, onReadReadyStory, onSaveReadyStoryForLater, onStartNewStory, onStartRecommendation, onToggleDirection, readyStoryQueue, savedForLaterStoryQueue, showStoryStartOptions, suggestedStarts } = props;
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const storyBrief = latestStory ? createStoryBrief(latestStory) : null;

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <div className="md:hidden">
        <MobileHomeView activeMood={activeMood} brief={storyBrief} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} isContinuationGenerating={isContinuationGenerating} isGenerating={isGenerating} isNewStoryGenerating={isNewStoryGenerating} isRecapOpen={isRecapOpen} latestStory={latestStory} onClearDemoStory={onClearDemoStory} onCloseRecap={() => setIsRecapOpen(false)} onContinue={onContinue} onLoadDemoStory={onLoadDemoStory} onMoodSelect={onMoodSelect} onOpenRecap={() => setIsRecapOpen(true)} onStartNewStory={onStartNewStory} onStartRecommendation={onStartRecommendation} showStoryStartOptions={showStoryStartOptions} suggestedStarts={suggestedStarts} />
      </div>
      <div className="hidden md:grid md:min-w-0 md:gap-8">
        {latestStory && storyBrief ? <CurrentStoryCard brief={storyBrief} direction={continueDirection} isDirectionOpen={isDirectionOpen} isGenerating={isContinuationGenerating} isRecapOpen={isRecapOpen} onCloseRecap={() => setIsRecapOpen(false)} onContinue={onContinue} onDirectionChange={onDirectionChange} onExportStory={onExportStory} onOpenRecap={() => setIsRecapOpen(true)} onToggleDirection={onToggleDirection} story={latestStory} /> : null}
        <ReadyStoryQueuePanel isGenerating={isGenerating} items={readyStoryQueue} onPass={onPassReadyStory} onRead={onReadReadyStory} onSaveForLater={onSaveReadyStoryForLater} savedForLaterCount={savedForLaterStoryQueue.length} />
        <MoodPicker activeMood={activeMood} hasCurrentStory={Boolean(latestStory)} onSelect={onMoodSelect} />
        {showStoryStartOptions ? <SuggestedStoryStarts activeMood={activeMood} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} stories={suggestedStarts} onStart={onStartRecommendation} /> : <StartSomethingNewPanel canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} isGenerating={isGenerating} isNewStoryGenerating={isNewStoryGenerating} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} onStartNewStory={onStartNewStory} />}
      </div>
    </div>
  );
}



function ReadyStoryQueuePanel({
  isGenerating,
  items,
  onPass,
  onRead,
  onSaveForLater,
  savedForLaterCount
}: {
  isGenerating: boolean;
  items: ReadyStoryQueueItem[];
  onPass: (item: ReadyStoryQueueItem) => void;
  onRead: (item: ReadyStoryQueueItem) => void;
  onSaveForLater: (item: ReadyStoryQueueItem) => void;
  savedForLaterCount: number;
}) {
  if (!items.length) {
    return (
      <section className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">Stories waiting for you</p>
        <h2 className="mt-2 text-2xl font-semibold text-paper">No waiting stories right now.</h2>
        <p className="mt-2 text-sm leading-6 text-paper/60">Use Start Something New to generate a story while the queue learns what to prepare next.</p>
        <p className="mt-3 text-xs text-paper/45">Saved for later: {savedForLaterCount}</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 rounded-md border border-lantern-gold/20 bg-paper/10 p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">Stories waiting for you</p>
          <h2 className="mt-2 text-2xl font-semibold text-paper">Pick what should find you next.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-paper/60">Read, pass, or save for later. Lantyrn learns from each story-level choice.</p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-paper/45">Saved for later: {savedForLaterCount}</p>
      </div>

      <div className="mt-4 grid gap-3">
        {items.map((item) => {
          const isPreparing = item.generationStatus === "generating";
          const isReady = item.generationStatus === "ready" && item.generatedStory;
          const preparationLabel = isReady
            ? "Ready to read"
            : isPreparing
              ? "Preparing story…"
              : item.generationStatus === "failed"
                ? "Preparation failed — Read can try again"
                : "Queued";

          return (
            <article key={item.id} className="grid min-w-0 grid-cols-[1fr_auto] overflow-hidden rounded-md border border-paper/10 bg-night-ink/70">
              <div className="min-w-0 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-lantern-gold">{item.mood} · {item.genre}</p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-paper">{item.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-paper/65">{item.premise}</p>
                <p className="mt-2 text-xs font-semibold text-lantern-gold/80">{formatReadyStoryCreatorCredit(item)}</p>
                <p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-paper/40">{item.provenance ?? "unknown provenance"} · {item.ipMarking ?? "unmarked"}</p>
                <p className="mt-3 text-xs font-semibold text-lantern-gold/75">{preparationLabel}</p>
                <p className="mt-2 text-xs text-paper/45">{item.heroName} · {item.heroRole} · {item.worldName}</p>
              </div>

              <div className="flex w-40 flex-col justify-center gap-2 border-l border-paper/10 bg-paper/5 p-3">
                <button className="rounded-md bg-lantern-gold px-3 py-2 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={isGenerating || isPreparing} onClick={() => onRead(item)} type="button">{isPreparing ? "Preparing…" : "Read"}</button>
                <button className="rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-sm font-semibold text-paper hover:border-lantern-gold/50 disabled:cursor-not-allowed disabled:opacity-50" disabled={isGenerating} onClick={() => onPass(item)} type="button">Pass</button>
                <button className="rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-sm font-semibold text-paper hover:border-lantern-gold/50 disabled:cursor-not-allowed disabled:opacity-50" disabled={isGenerating} onClick={() => onSaveForLater(item)} type="button">Save for later</button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MobileHomeView({ activeMood, brief, canUseDemoStory, hasDemoStory, isContinuationGenerating, isGenerating, isNewStoryGenerating, isRecapOpen, latestStory, onClearDemoStory, onCloseRecap, onContinue, onLoadDemoStory, onMoodSelect, onOpenRecap, onStartNewStory, onStartRecommendation, showStoryStartOptions, suggestedStarts }: { activeMood: Mood; brief: StoryBrief | null; canUseDemoStory: boolean; hasDemoStory: boolean; isContinuationGenerating: boolean; isGenerating: boolean; isNewStoryGenerating: boolean; isRecapOpen: boolean; latestStory: LibraryStory | null; onClearDemoStory: () => void; onCloseRecap: () => void; onContinue: (direction?: string) => void; onLoadDemoStory: () => void; onMoodSelect: (mood: Mood) => void; onOpenRecap: () => void; onStartNewStory: () => void; onStartRecommendation: (story: StoryStart) => void; showStoryStartOptions: boolean; suggestedStarts: StoryStart[] }) {
  return <div className="grid min-w-0 gap-5">{latestStory && brief ? <div className="grid min-w-0 gap-3" data-mobile-react-current-story="true"><MobileCurrentStoryCard brief={brief} isGenerating={isContinuationGenerating} isRecapOpen={isRecapOpen} onCloseRecap={onCloseRecap} onContinue={onContinue} onOpenRecap={onOpenRecap} story={latestStory} /></div> : null}<MobileMoodPicker activeMood={activeMood} onSelect={onMoodSelect} />{showStoryStartOptions ? <MobileSuggestedStoryStarts activeMood={activeMood} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} onStart={onStartRecommendation} stories={suggestedStarts} /> : <StartSomethingNewPanel canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} isGenerating={isGenerating} isNewStoryGenerating={isNewStoryGenerating} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} onStartNewStory={onStartNewStory} />}</div>;
}

function MobileCurrentStoryCard({ brief, isGenerating, isRecapOpen, onCloseRecap, onContinue, onOpenRecap, story }: { brief: StoryBrief; isGenerating: boolean; isRecapOpen: boolean; onCloseRecap: () => void; onContinue: (direction?: string) => void; onOpenRecap: () => void; story: LibraryStory }) {
  return <section className="relative min-w-0 overflow-hidden rounded-[1.35rem] border border-lantern-gold/25 bg-soft-card p-3 text-primary-dark shadow-soft"><div className="flex min-w-0 gap-3"><div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl"><CoverArt label={story.genrePreset} title={story.title} tone="warm" size="mobile" /></div><div className="min-w-0 flex-1 pr-1"><h3 className="line-clamp-2 text-lg font-semibold leading-tight text-primary-dark">{story.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-primary-dark/65">{brief.hook}</p><button className="mt-3 rounded-full bg-primary-dark px-4 py-2 text-xs font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue()} type="button">{isGenerating ? "⌛ Writing the next chapter…" : "Next Chapter"}</button></div></div><button aria-label="Open last chapter recap" className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-aged-brass/30 bg-white/85 text-base shadow-soft" onClick={onOpenRecap} type="button">↺</button>{isRecapOpen ? <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} /> : null}</section>;
}

function MobileMoodPicker({ activeMood, onSelect }: { activeMood: Mood; onSelect: (mood: Mood) => void }) {
  return <section className="min-w-0"><h2 className="text-xl font-semibold leading-tight text-paper">What are you in the mood to read?</h2><div className="-mx-3 mt-3 flex min-w-0 gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">{MOODS.map((mood) => <button className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeMood === mood ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper"}`} key={mood} onClick={() => onSelect(mood)} type="button">{mood}</button>)}</div></section>;
}

function StartSomethingNewPanel({ canUseDemoStory, hasDemoStory, isGenerating, isNewStoryGenerating, onClearDemoStory, onLoadDemoStory, onStartNewStory }: { canUseDemoStory: boolean; hasDemoStory: boolean; isGenerating: boolean; isNewStoryGenerating: boolean; onClearDemoStory: () => void; onLoadDemoStory: () => void; onStartNewStory: () => void }) {
  return <section className="min-w-0 rounded-md border border-lantern-gold/25 bg-paper/10 p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">Start Something New</p><h2 className="mt-2 text-2xl font-semibold text-paper md:text-3xl">Let Lantyrn find your next story.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">Tap once and Lantern will generate a new story for you automatically. Mood chips are optional context, not a required step.</p><div className="mt-4 flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" disabled={isGenerating} onClick={onStartNewStory} type="button">{isNewStoryGenerating ? <span className="size-4 animate-spin rounded-full border-2 border-night-ink/30 border-t-night-ink" aria-hidden="true" /> : null}{isNewStoryGenerating ? "Writing the perfect story for you…" : "Start Something New"}</button>{canUseDemoStory ? (hasDemoStory ? <SmallButton onClick={onClearDemoStory}>Clear demo story</SmallButton> : <SmallButton onClick={onLoadDemoStory}>Load demo story</SmallButton>) : null}</div>{isNewStoryGenerating ? <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-lantern-gold"><span aria-hidden="true">⌛</span>Writing the perfect story for you…</p> : null}</section>;
}

function MobileSuggestedStoryStarts({ activeMood, canUseDemoStory, hasDemoStory, onClearDemoStory, onLoadDemoStory, onStart, stories }: { activeMood: Mood; canUseDemoStory: boolean; hasDemoStory: boolean; onClearDemoStory: () => void; onLoadDemoStory: () => void; onStart: (story: StoryStart) => void; stories: StoryStart[] }) {
  return <section className="min-w-0"><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-paper">Based on your reader pulse</h2><p className="mt-1 text-xs leading-5 text-paper/55">{activeMood} picks for your next read.</p></div>{canUseDemoStory ? <div className="flex shrink-0 gap-2">{hasDemoStory ? <SmallButton onClick={onClearDemoStory}>Clear demo</SmallButton> : <SmallButton onClick={onLoadDemoStory}>Demo</SmallButton>}</div> : null}</div><div className="mt-3 grid min-w-0 gap-3">{stories.map((story) => <MobileStoryStartRow key={story.title} onStart={onStart} story={story} />)}</div></section>;
}

function MobileStoryStartRow({ onStart, story }: { onStart: (story: StoryStart) => void; story: StoryStart }) {
  return <button className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-paper/12 bg-paper/10 p-2.5 text-left" onClick={() => onStart(story)} type="button"><div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl"><CoverArt label={story.mood} title={story.title} tone="cool" size="mobile" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-paper">{story.title}</h3><p className="mt-1 line-clamp-1 text-xs leading-5 text-paper/60">{story.premise}</p><div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden"><span className="truncate rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-2 py-0.5 text-[0.65rem] font-semibold text-lantern-gold">{story.genre}</span><span className="shrink-0 rounded-full border border-paper/15 bg-paper/10 px-2 py-0.5 text-[0.65rem] font-semibold text-paper/70">{story.mood}</span></div></div><span className="shrink-0 text-xl text-paper/45">›</span></button>;
}

function CurrentStoryCard({ brief, direction, isDirectionOpen, isGenerating, isRecapOpen, onCloseRecap, onContinue, onDirectionChange, onExportStory, onOpenRecap, onToggleDirection, story }: { brief: StoryBrief; direction: string; isDirectionOpen: boolean; isGenerating: boolean; isRecapOpen: boolean; onCloseRecap: () => void; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onExportStory: () => void; onOpenRecap: () => void; onToggleDirection: () => void; story: LibraryStory }) {
  return <section className="min-w-0 overflow-hidden rounded-md border border-lantern-gold/35 bg-soft-card text-primary-dark shadow-soft"><div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(220px,340px)_1fr]"><div className="min-w-0 bg-primary-dark p-4 sm:p-6"><CoverArt label={story.genrePreset} title={story.title} tone="warm" size="feature" /></div><div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:p-8"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Current Story / Next Chapter</p><h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-dark md:text-5xl">{story.title}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-primary-dark/72">{brief.hook}</p></div><div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 rounded-md border border-aged-brass/20 bg-white/65 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Last time recap preview</p><p className="mt-2 text-sm leading-6 text-primary-dark/75">{brief.recap}</p></div><div className="min-w-0 rounded-md border border-primary-dark/10 bg-primary-dark p-4 text-primary-light"><div className="flex min-w-0 items-center gap-4"><HeroPortrait name={brief.heroName} size="large" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-lantern-gold/75">Hero / heroine</p><p className="mt-1 text-lg font-semibold text-primary-light">{brief.heroName}</p><p className="mt-1 text-xs leading-5 text-primary-light/55">{brief.heroRole}</p></div></div><p className="mt-4 text-sm leading-6 text-primary-light/75">{brief.struggle}</p></div></div><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap"><button className="rounded-md bg-primary-dark px-5 py-3 text-sm font-semibold text-primary-light transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue()} type="button">{isGenerating ? "⌛ Writing the next chapter…" : "Next Chapter"}</button><button className="rounded-md border border-aged-brass/50 bg-white/80 px-5 py-3 text-sm font-semibold text-aged-brass transition hover:border-aged-brass hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={onToggleDirection} type="button">Next Chapter with Input</button><button className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10" onClick={onOpenRecap} type="button">Last Chapter Recap</button><button className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10" onClick={onExportStory} type="button">Export</button></div>{isDirectionOpen ? <div className="min-w-0 rounded-md border border-aged-brass/25 bg-white/75 p-4"><label className="flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-primary-dark">Optional direction</span><textarea className="min-h-32 w-full min-w-0 rounded-md border border-primary-dark/15 bg-white px-3 py-2 text-sm leading-6 text-primary-dark outline-none focus:border-aged-brass focus:ring-2 focus:ring-aged-brass/20" onChange={(event) => onDirectionChange(event.target.value)} placeholder="A character to follow, a secret to press on, a feeling to deepen." value={direction} /></label><button className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue(direction)} type="button">{isGenerating ? <><span className="size-4 animate-spin rounded-full border-2 border-primary-light/30 border-t-primary-light" aria-hidden="true" />Writing the next chapter…</> : "Next Chapter with Input"}</button></div> : null}</div></div>{isRecapOpen ? <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} /> : null}</section>;
}

function RecapPanel({ brief, onClose, title }: { brief: StoryBrief; onClose: () => void; title: string }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-night-ink/75 p-3 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${title} recap`}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md border border-lantern-gold/30 bg-soft-card p-5 text-primary-dark shadow-soft sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Last Chapter Recap</p><h3 className="mt-2 text-2xl font-semibold leading-tight">{title}</h3></div><button className="shrink-0 rounded-md border border-primary-dark/15 px-3 py-2 text-sm font-semibold text-primary-dark" onClick={onClose} type="button">Close</button></div><div className="mt-5 grid gap-4"><RecapBlock title="What happened" body={brief.recap} /><RecapBlock title="What changed" body={brief.changed} /><RecapBlock title="What remains unresolved" body={brief.tension} /><RecapBlock title="Why the next chapter matters" body={brief.nextHook} /></div></div></div>;
}

function RecapBlock({ body, title }: { body: string; title: string }) { return <section className="rounded-md border border-aged-brass/20 bg-white/65 p-4"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-aged-brass">{title}</h4><p className="mt-2 text-sm leading-6 text-primary-dark/75">{body}</p></section>; }

function MoodPicker({ activeMood, hasCurrentStory, onSelect }: { activeMood: Mood; hasCurrentStory: boolean; onSelect: (mood: Mood) => void }) {
  return <section className={hasCurrentStory ? "min-w-0" : "min-w-0 pt-1"}><div className="max-w-3xl"><h2 className="text-2xl font-semibold text-paper md:text-3xl">What are you in the mood for?</h2><p className="mt-2 text-sm leading-6 text-paper/62">Choose the emotional weather for the stories waiting below.</p>{!hasCurrentStory ? <p className="mt-3 text-sm leading-6 text-paper/70">Start your first story. Once you have one in progress, your next chapter will appear here.</p> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{MOODS.map((mood) => <button className={`min-w-0 rounded-md border px-4 py-4 text-left transition ${activeMood === mood ? "border-lantern-gold bg-lantern-gold text-night-ink shadow-soft" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50 hover:bg-paper/15"}`} key={mood} onClick={() => onSelect(mood)} type="button"><span className="block text-base font-semibold">{mood}</span><span className="mt-2 block text-xs leading-5 opacity-70">{moodDescription(mood)}</span></button>)}</div></section>;
}

function SuggestedStoryStarts({ activeMood, canUseDemoStory, hasDemoStory, onClearDemoStory, onLoadDemoStory, onStart, stories }: { activeMood: Mood; canUseDemoStory: boolean; hasDemoStory: boolean; onClearDemoStory: () => void; onLoadDemoStory: () => void; onStart: (story: StoryStart) => void; stories: StoryStart[] }) {
  return <section className="min-w-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold text-paper md:text-3xl">Based on your reader pulse</h2><p className="mt-2 text-sm leading-6 text-paper/62">A small shelf of premieres, with {activeMood.toLowerCase()} closest to the front.</p></div>{canUseDemoStory ? <div className="flex flex-wrap gap-2"><SmallButton disabled={hasDemoStory} onClick={onLoadDemoStory}>Load demo story</SmallButton>{hasDemoStory ? <SmallButton onClick={onClearDemoStory}>Clear demo story</SmallButton> : null}</div> : null}</div><div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">{stories.map((story) => <StoryStartCard isFeatured={story.mood === activeMood} key={story.title} onStart={onStart} story={story} />)}</div></section>;
}

function StoryStartCard({ isFeatured, onStart, story }: { isFeatured: boolean; onStart: (story: StoryStart) => void; story: StoryStart }) { return <article className={`min-w-0 rounded-md border p-4 transition ${isFeatured ? "border-lantern-gold/65 bg-paper/15" : "border-paper/12 bg-paper/10"}`}><div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]"><CoverArt label={story.mood} title={story.title} tone={isFeatured ? "warm" : "cool"} /><div className="min-w-0"><div className="flex min-w-0 flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><h3 className="mt-3 text-xl font-semibold leading-tight text-paper">{story.title}</h3><p className="mt-2 text-sm leading-6 text-paper/70">{story.premise}</p><div className="mt-4 flex min-w-0 items-center gap-3 rounded-md border border-paper/10 bg-night-ink/35 p-3"><HeroPortrait name={story.heroName} /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Hero / heroine</p><p className="mt-1 text-sm font-semibold text-paper">{story.heroName}</p><p className="mt-1 text-xs leading-5 text-paper/55">{story.heroRole}</p></div></div><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink transition hover:bg-lantern-gold/90" onClick={() => onStart(story)} type="button">Start</button></div></div></article>; }

function CreateView(props: { canGenerate: boolean; characterArc: CharacterArc; characterProfiles: UploadState; endingType: EndingType; genrePreset: GenrePreset; inputArtifacts: InputArtifact[]; isGenerating: boolean; lengthTarget: LengthTarget; narrativeArchitecture: NarrativeArchitecture; onChangeCharacterArc: (value: CharacterArc) => void; onChangeCharacterProfiles: (value: UploadState) => void; onChangeEndingType: (value: EndingType) => void; onChangeGenre: (value: GenrePreset) => void; onChangeLengthTarget: (value: LengthTarget) => void; onChangeNarrative: (value: NarrativeArchitecture) => void; onChangeStoryRules: (value: UploadState) => void; onChangeStorySeed: (value: UploadState) => void; onChangeWorld: (value: UploadState) => void; onClear: () => void; onGenerate: () => void; onSaveInputArtifact: (type: InputArtifactType, value: UploadState) => void; onSelectInputArtifact: (type: InputArtifactType, artifactId: string) => void; storyRules: UploadState; storySeed: UploadState; worldBible: UploadState }) {
  const { canGenerate, characterArc, characterProfiles, endingType, genrePreset, inputArtifacts, isGenerating, lengthTarget, narrativeArchitecture, onChangeCharacterArc, onChangeCharacterProfiles, onChangeEndingType, onChangeGenre, onChangeLengthTarget, onChangeNarrative, onChangeStoryRules, onChangeStorySeed, onChangeWorld, onClear, onGenerate, onSaveInputArtifact, onSelectInputArtifact, storyRules, storySeed, worldBible } = props;
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Create" title="Create New Story" body="Build a story from a world, cast, spark, and craft rules in one dedicated workspace." /><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,460px)_1fr]"><section className="grid min-w-0 gap-4"><InputPanel artifactType="worldBible" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "worldBible")} onChange={onChangeWorld} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Storyworld" value={worldBible} /><InputPanel artifactType="characterProfiles" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "characterProfiles")} onChange={onChangeCharacterProfiles} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Cast" value={characterProfiles} /><InputPanel artifactType="storySeed" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storySeed")} onChange={onChangeStorySeed} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Story Spark" value={storySeed} /><InputPanel artifactType="storyRules" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storyRules")} onChange={onChangeStoryRules} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Craft Rules" value={storyRules} /><button className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper" onClick={onClear} type="button">Clear current inputs</button></section><section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Story Architecture</h2><div className="mt-4 grid gap-3"><SelectControl label="Genre Preset" onChange={(value) => onChangeGenre(value as GenrePreset)} options={GENRE_PRESETS} value={genrePreset} /><SelectControl label="Narrative Architecture" onChange={(value) => onChangeNarrative(value as NarrativeArchitecture)} options={NARRATIVE_ARCHITECTURES} value={narrativeArchitecture} /><SelectControl label="Character Arc" onChange={(value) => onChangeCharacterArc(value as CharacterArc)} options={CHARACTER_ARCS} value={characterArc} /><SelectControl label="Ending Type" onChange={(value) => onChangeEndingType(value as EndingType)} options={ENDING_TYPES} value={endingType} /><SelectControl label="Length Target" onChange={(value) => onChangeLengthTarget(value as LengthTarget)} options={LENGTH_TARGETS.filter((target) => target.value !== "First Page Test").map((target) => ({ value: target.value, label: target.label }))} value={lengthTarget} /></div><button className="mt-5 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!canGenerate} onClick={onGenerate} type="button">{isGenerating ? "Generating story..." : "Generate Story"}</button>{!storyRules.content.trim() ? <p className="mt-3 rounded-md bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/55">{DEFAULT_STORY_RULES_NOTICE}</p> : null}</section></div></section>;
}

function InputPanel({ artifactType, libraryArtifacts, onChange, onSave, onSelect, title, value }: { artifactType: InputArtifactType; libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onSave: (type: InputArtifactType, value: UploadState) => void; onSelect: (type: InputArtifactType, artifactId: string) => void; title: string; value: UploadState }) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return;
    onChange({ name: file.name, content: await file.text() });
  }
  return <section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-lg font-semibold text-paper">{title}</h2><select className="mt-3 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onSelect(artifactType, event.target.value)} value={value.libraryArtifactId ?? ""}><option value="">Choose saved item</option>{libraryArtifacts.map((artifact) => <option key={artifact.id} value={artifact.id}>{artifact.name}</option>)}</select><textarea className="mt-3 min-h-32 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold" onChange={(event) => onChange({ name: value.name || `${slugify(title)}.txt`, content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder={`Add ${title.toLowerCase()} text`} value={value.content} /><label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-lantern-gold/50 px-4 py-3 text-sm font-semibold text-lantern-gold"><span className="min-w-0 truncate">{value.name || "Upload .md or .txt"}</span><input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} /></label><button className="mt-3 rounded-md border border-lantern-gold/45 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={!value.content.trim()} onClick={() => onSave(artifactType, value)} type="button">Save to Library</button></section>;
}

function findEpisodeInLibrarySeries(stories: LibraryStory[], currentStoryId: string): SeriesEpisode<LibraryStory> | null {
  const trimmedCurrentStoryId = currentStoryId.trim();
  if (!trimmedCurrentStoryId) return null;

  for (const group of groupStoriesBySeries(stories)) {
    const currentEpisode = group.episodes.find((episode) => episode.storyId === trimmedCurrentStoryId || episode.story.id === trimmedCurrentStoryId);
    if (currentEpisode) return currentEpisode;
  }

  return null;
}

function LibraryView(props: { cloudMessage: string; cloudProjects: CloudProjectSummary[]; isCloudLoading: boolean; onDeleteCloudProject: () => void; onDeleteProject: () => void; onDeleteStory: (storyId: string) => void; onLoadCloudProject: (projectId: string) => void; onLoadProject: (projectId: string) => void; onMoveSavedForLaterToWaitingQueue: (item: ReadyStoryQueueItem) => void; onOpenSavedStoryById: (storyId: string) => void; onProjectNameChange: (name: string) => void; onReadSavedForLater: (item: ReadyStoryQueueItem) => void; onRefreshCloud: () => void; onRemoveSavedForLater: (item: ReadyStoryQueueItem) => void; onSaveCloudProject: () => void; onSaveProject: () => void; onSaveStory: () => void; projectName: string; savedForLaterStoryQueue: ReadyStoryQueueItem[]; savedProjects: SavedProject[]; savedStories: SavedStory[]; selectedCloudProjectId: string; selectedProjectId: string; storyResponse: GenerateStoryResponse | null }) {
  const { cloudMessage, cloudProjects, isCloudLoading, onDeleteCloudProject, onDeleteProject, onDeleteStory, onLoadCloudProject, onLoadProject, onMoveSavedForLaterToWaitingQueue, onOpenSavedStoryById, onProjectNameChange, onReadSavedForLater, onRefreshCloud, onRemoveSavedForLater, onSaveCloudProject, onSaveProject, onSaveStory, projectName, savedForLaterStoryQueue, savedProjects, savedStories, selectedCloudProjectId, selectedProjectId, storyResponse } = props;
  const libraryStoryRows = savedStories.map((story) => ({ story, kind: "saved" as const }));
  const seriesGroups = groupStoriesBySeries(libraryStoryRows.map((row) => row.story)).map((group) => ({ ...group, episodes: group.episodes.map((episode) => ({ ...episode, row: libraryStoryRows[episode.originalIndex] })) }));
  const hasGeneratedStoryRows = seriesGroups.length > 0;

  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Library" title="Story Library" body="Saved and recent stories live here as a separate destination." /><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,420px)_1fr]"><section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Library Tools</h2><p className="mt-1 text-sm leading-6 text-paper/65">Save stories and move project workspaces between local and cloud storage.</p><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!storyResponse} onClick={onSaveStory} type="button">Save Current Story</button><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-paper">Project Name</span><input className="min-h-11 w-full min-w-0 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onProjectNameChange(event.target.value)} placeholder="My story project" value={projectName} /></label><div className="mt-3 flex flex-wrap gap-2"><SmallButton onClick={onSaveProject}>Save Project</SmallButton><SmallButton disabled={!selectedProjectId} onClick={onDeleteProject}>Delete Project</SmallButton><SmallButton disabled={isCloudLoading} onClick={onRefreshCloud}>{isCloudLoading ? "Syncing..." : "Refresh Cloud"}</SmallButton><SmallButton disabled={isCloudLoading} onClick={onSaveCloudProject}>Save to Cloud</SmallButton><SmallButton disabled={isCloudLoading || !selectedCloudProjectId} onClick={onDeleteCloudProject}>Delete Cloud</SmallButton></div><SelectLibrary label="Load Project" onChange={onLoadProject} options={savedProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedProjectId} /><SelectLibrary label="Load Cloud Project" onChange={onLoadCloudProject} options={cloudProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedCloudProjectId} />{cloudMessage ? <p className="mt-3 rounded-md border border-lantern-gold/25 bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/65">{cloudMessage}</p> : null}</section><section className="grid min-w-0 gap-3"><section className="grid min-w-0 gap-3 rounded-md border border-lantern-gold/20 bg-lantern-gold/5 p-4"><div><h2 className="text-lg font-semibold text-paper">Saved for later</h2><p className="mt-1 text-sm leading-6 text-paper/60">Ready story choices you saved from the desktop queue.</p></div>{savedForLaterStoryQueue.length ? savedForLaterStoryQueue.map((item) => <SavedForLaterStoryCard item={item} key={item.id} onMoveToWaitingQueue={() => onMoveSavedForLaterToWaitingQueue(item)} onRead={() => onReadSavedForLater(item)} onRemove={() => onRemoveSavedForLater(item)} />) : <p className="rounded-md border border-paper/12 bg-paper/10 px-3 py-3 text-sm text-paper/60">No saved-for-later stories yet.</p>}</section>{!hasGeneratedStoryRows ? <EmptyPanel title="No saved or recent stories yet" body="Generate a story or save one locally and it will appear here." /> : null}{seriesGroups.map((group) => <SeriesLibraryGroup key={group.seriesId} group={group} onDeleteStory={onDeleteStory} onOpenSavedStoryById={onOpenSavedStoryById} />)}</section></div></section>;
}

type LibraryStoryRow = { story: SavedStory; kind: "saved" };
type LibrarySeriesGroupWithRows = Omit<LibrarySeriesGroup<LibraryStory>, "episodes"> & { episodes: Array<SeriesEpisode<LibraryStory> & { row: LibraryStoryRow }> };

function SeriesLibraryGroup({ group, onDeleteStory, onOpenSavedStoryById }: { group: LibrarySeriesGroupWithRows; onDeleteStory: (storyId: string) => void; onOpenSavedStoryById: (storyId: string) => void }) {
  return <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-paper [overflow-wrap:anywhere]">{group.title}</h3><p className="mt-1 text-sm leading-6 text-paper/60">{group.episodeCount} {group.episodeCount === 1 ? "Episode" : "Episodes"}{group.lastUpdatedAt ? ` | Last updated ${formatDateTime(group.lastUpdatedAt)}` : ""}</p></div><span className="w-fit rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold text-lantern-gold">Series</span></div><div className="mt-4 grid min-w-0 gap-3">{group.episodes.map((episode) => <StoryLibraryCard badge={`Episode ${episode.episodeNumber}`} key={episode.story.id} onDelete={() => onDeleteStory(episode.story.id)} onOpen={() => onOpenSavedStoryById(episode.story.id)} story={episode.story} />)}</div></article>;
}

function SavedForLaterStoryCard({ item, onMoveToWaitingQueue, onRead, onRemove }: { item: ReadyStoryQueueItem; onMoveToWaitingQueue: () => void; onRead: () => void; onRemove: () => void }) {
  return <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-lg font-semibold text-paper">{item.title}</h3><p className="mt-1 text-sm leading-6 text-paper/60">{item.genre} | {item.mood}</p></div><span className="w-fit rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold text-lantern-gold">Saved for later</span></div><p className="mt-3 text-sm leading-6 text-paper/70">{item.premise}</p><p className="mt-2 text-xs font-semibold text-lantern-gold/80">{formatReadyStoryCreatorCredit(item)}</p><p className="mt-1 text-[0.7rem] uppercase tracking-[0.12em] text-paper/40">{item.provenance ?? "unknown provenance"} · {item.ipMarking ?? "unmarked"}</p><dl className="mt-4 grid gap-2 text-sm text-paper/65 sm:grid-cols-3"><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">Hero</dt><dd className="mt-1 text-paper/75">{item.heroName}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">Role</dt><dd className="mt-1 text-paper/75">{item.heroRole}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/40">World</dt><dd className="mt-1 text-paper/75">{item.worldName}</dd></div></dl><div className="mt-4 flex flex-wrap gap-2"><SmallButton onClick={onRead}>Read</SmallButton><SmallButton onClick={onMoveToWaitingQueue}>Move back to waiting queue</SmallButton><SmallButton onClick={onRemove}>Remove</SmallButton></div></article>;
}

function StoryLibraryCard({ badge, onDelete, onOpen, story }: { badge?: string; onDelete?: () => void; onOpen: () => void; story: LibraryStory }) {
  return <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="break-words text-lg font-semibold text-paper [overflow-wrap:anywhere]">{story.title}</h3><p className="mt-1 text-sm leading-6 text-paper/60">{formatDateTime(story.createdAt)} | {story.wordCount.toLocaleString()} words | {story.genrePreset}</p></div>{badge ? <span className="w-fit rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold text-lantern-gold">{badge}</span> : null}</div><p className="mt-3 break-words text-sm leading-6 text-paper/70 [overflow-wrap:anywhere]">{truncateText(story.story, 220)}</p><div className="mt-4 flex flex-wrap gap-2"><SmallButton onClick={onOpen}>Open</SmallButton>{onDelete ? <SmallButton onClick={onDelete}>Delete</SmallButton> : null}</div></article>;
}

function CharactersView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  const characterStories = SUGGESTED_STORY_STARTS.filter((story) => story.heroName);
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Cast" title="Characters / Cast" body="Character cards now live outside Home and link back to their stories where possible." />{characterStories.length === 0 ? <EmptyPanel title="No character cards yet" body="Characters will appear here once story references are available." /> : <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{characterStories.map((story) => <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4" key={story.heroName}><div className="flex min-w-0 items-start gap-4"><HeroPortrait name={story.heroName} size="large" /><div className="min-w-0 flex-1"><h3 className="break-normal text-lg font-semibold leading-snug text-paper [overflow-wrap:normal]">{story.heroName}</h3><p className="mt-1 break-normal text-sm font-semibold leading-5 text-lantern-gold [overflow-wrap:normal]">{story.heroRole}</p></div></div><p className="mt-4 w-full text-sm leading-6 text-paper/70">{story.heroBio}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Appears in</p><button className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">{story.title}</button></article>)}</div>}</section>;
}

function WorldsView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  const worldStories = SUGGESTED_STORY_STARTS.filter((story) => story.worldName);
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Worlds" title="Worlds" body="Storyworld cards are reachable as their own app destination." />{worldStories.length === 0 ? <EmptyPanel title="No worlds yet" body="World cards will appear here once storyworld references are available." /> : <div className="grid min-w-0 gap-4 md:grid-cols-2">{worldStories.map((story) => <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4" key={story.worldName}><div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]"><CoverArt label={story.mood} title={story.worldName} tone="cool" /><div className="min-w-0"><h3 className="text-lg font-semibold text-paper">{story.worldName}</h3><div className="mt-2 flex min-w-0 flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><p className="mt-3 text-sm leading-6 text-paper/70">{story.world}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Appears in</p><button className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">{story.title}</button></div></div></article>)}</div>}</section>;
}

function MoodIntakeView({ onCancel, onSubmit, pendingStoryTitle }: { onCancel: () => void; onSubmit: (draft: ReaderMoodDraft) => void; pendingStoryTitle: string | null }) {
  const [form, setForm] = useState<MoodIntakeFormState>(EMPTY_MOOD_INTAKE_FORM);
  const canSubmit = Boolean(form.mood.trim() && form.desiredFeeling.trim());

  function updateField<K extends keyof MoodIntakeFormState>(field: K, value: MoodIntakeFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-5 rounded-md border border-lantern-gold/25 bg-paper/10 p-5 shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">Reader pulse</p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-paper">What do you need from this story?</h2>
        <p className="mt-2 text-sm leading-6 text-paper/65">
          {pendingStoryTitle ? `${pendingStoryTitle} is ready. First, tell Lantyrn what kind of reading moment this should become.` : "Before Lantyrn writes, give it the shape of your day and the kind of story you want right now."}
        </p>
      </div>

      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) onSubmit(form);
        }}
      >
        <IntakeTextArea label="What kind of day are you having?" onChange={(value) => updateField("mood", value)} placeholder="Tired but hopeful, restless, overloaded, curious, quiet..." required value={form.mood} />
        <IntakeTextArea label="What do you want this story to feel like?" onChange={(value) => updateField("desiredFeeling", value)} placeholder="Comforting but not cheesy, eerie but not bleak, adventurous, funny, meaningful..." required value={form.desiredFeeling} />
        <SegmentedChoice label="Energy level" onChange={(value) => updateField("energyLevel", value as ReaderEnergyLevel)} options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]} value={form.energyLevel} />
        <SegmentedChoice label="Preferred intensity" onChange={(value) => updateField("intensityLevel", value as ReaderIntensityLevel)} options={[{ label: "Gentle", value: "gentle" }, { label: "Moderate", value: "moderate" }, { label: "Intense", value: "intense" }]} value={form.intensityLevel} />
        <IntakeTextArea label="Anything to avoid?" onChange={(value) => updateField("avoidances", value)} placeholder="No gore, no ghosts, no dead pets, no bleak ending..." value={form.avoidances} />
        <IntakeTextArea label="What do you need right now?" onChange={(value) => updateField("needRightNow", value)} placeholder="A reason to keep going, a mystery to disappear into, something warm before bed..." value={form.needRightNow} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="min-h-11 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink transition disabled:cursor-not-allowed disabled:opacity-50" disabled={!canSubmit} type="submit">Save pulse</button>
          <button className="min-h-11 rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-lantern-gold/50" onClick={onCancel} type="button">Cancel</button>
        </div>
      </form>
    </section>
  );
}

function IntakeTextArea({ label, onChange, placeholder, required = false, value }: { label: string; onChange: (value: string) => void; placeholder: string; required?: boolean; value: string }) {
  return <label className="grid gap-2"><span className="text-sm font-semibold text-paper">{label}{required ? " *" : ""}</span><textarea className="min-h-24 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold focus:ring-2 focus:ring-lantern-gold/20" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}

function SegmentedChoice({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: { label: string; value: string }[]; value: string }) {
  return <div className="grid gap-2"><p className="text-sm font-semibold text-paper">{label}</p><div className="grid grid-cols-3 gap-2">{options.map((option) => <button className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${value === option.value ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper"}`} key={option.value} onClick={() => onChange(option.value)} type="button">{option.label}</button>)}</div></div>;
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
    defaultEerieSafetyGuardrailsSummary: DEFAULT_READER_SAFETY_GUARDRAILS.join(", "),
    eerieSignalsIncluded: false,
    continuationStoryIdIncludedInLastNewStoryRequest: false,
    feedbackIncluded: false,
    latestStoryFeedbackSummary: "No prior story feedback available.",
    summary: "No new-story generation personalization has been applied yet.",
    identityDiagnostics: { identity: null, continuationContextIncluded: false, newSeriesCreated: false, trigger: "none", activeCommittedStoryId: "none", activeCommittedSeriesId: "none", pendingGenerationMode: "none", lastGenerationCancelledOrAborted: false }
  };
}

function readerTasteProfileFromEerieProfile(eerieProfile: EerieReaderProfile) {
  const updatedAt = eerieProfile.updatedAt || new Date().toISOString();
  const convertPreference = (preference: EerieReaderProfile["fearIntensity"]) => ({
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
      ])
    ),
    source: "legacy-eerie-profile",
    updatedAt,
  });
}

function shouldMirrorEerieProfileToReaderTasteProfile(profile: ReaderProfile): boolean {
  return !profile.tasteProfile || profile.tasteProfile.source === "default";
}

function buildNewStoryPersonalization({ canonicalProfile, continuationStoryId, eerieProfile, genre, mode, profile, source, trigger }: { canonicalProfile: CanonicalReaderProfile; continuationStoryId: string; eerieProfile: EerieReaderProfile; genre: GenrePreset; mode: Exclude<GenerationSource, null>; profile: ReaderProfile; source: ProfileSourceUsed; trigger: ReaderProfileEventSource; }): { diagnostics: LastNewStoryPersonalization; prompt: string; snapshot: ReaderProfileGenerationSnapshot } {
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
      canonicalProfile
    });

    return {
      diagnostics: {
        ...createEmptyLastNewStoryPersonalization(),
        lastGenerationMode: "continue-story",
        lastGenerationTrigger: trigger,
        profileSourceUsed: "none",
        continuationStoryIdIncludedInLastNewStoryRequest: false,
        summary: "Continuation generation did not use new-story reader profile personalization."
      },
      prompt: "",
      snapshot
    };
  }

  const topMood = getTopCount(profile.moodCounts);
  const topGenre = getTopCount(profile.genreCounts);
  const confidence = getReaderProfileConfidence(profile);
  const tasteProfile = profile.tasteProfile ?? readerTasteProfileFromEerieProfile(eerieProfile);
  const userHardAvoidances = dedupe([
    ...splitAvoidances(profile.latestMood?.avoidances),
    ...(tasteProfile.userHardAvoidances ?? []),
  ]);
  const defaultEerieSafetyGuardrails = dedupe(
    tasteProfile.defaultSafetyGuardrails?.length
      ? tasteProfile.defaultSafetyGuardrails
      : DEFAULT_READER_SAFETY_GUARDRAILS
  );
  const profileUsed = profile.profileExists;
  const feedbackSummary = summarizeStoryFeedback(profile.storyFeedbackSignals);
  const feedbackIncluded = feedbackSummary !== "No prior story feedback available.";
  const profileSource = profileUsed && source === "none" ? "local" : source;
  const includeEerieSignals = shouldUseEerieSignalsForGenre(genre);
  const weakly = confidence === "low" ? "Treat these as weak preferences, not hard rules." : "Treat these as preferences, not hard rules.";
  const prompt = profileUsed ? [
    "Controlled reader-profile personalization for this brand-new story only:",
    `- Profile source: ${profileSource}. Profile confidence: ${confidence}. Taste profile source: ${tasteProfile.source}. ${weakly}`,
    `- Top mood signal: ${topMood ?? profile.latestMood?.mood ?? "none"}.`,
    `- Top genre signal: ${topGenre ?? "none"}. Current selected genre: ${genre}.`,
    `- Preferred format: ${tasteProfile.preferredFormat}. Preferred duration: ${tasteProfile.preferredDurationMinutes} minutes.`,
    `- Engagement totals: generated ${profile.counters.totalStoriesGenerated}, opened ${profile.counters.totalStoriesOpened}, continued ${profile.counters.totalContinues}.`,
    `- Mood selection counts: ${formatCounts(profile.moodCounts)}.`,
    `- Genre counts: ${formatCounts(profile.genreCounts)}.`,
    `- Recent story feedback, as weak preference guidance: ${feedbackSummary}`,
    userHardAvoidances.length ? `- User hard avoidances, as hard constraints: ${userHardAvoidances.join(", ")}.` : "- User hard avoidances: none recorded.",
    defaultEerieSafetyGuardrails.length ? `- Default/eerie safety guardrails, not user-entered avoidances: ${defaultEerieSafetyGuardrails.join(", ")}.` : "- Default/eerie safety guardrails: none recorded.",
    includeEerieSignals
      ? `- Taste profile guidance: fear intensity ${formatWeightedPreference(tasteProfile.fearIntensity)}, weirdness tolerance ${formatWeightedPreference(tasteProfile.weirdnessTolerance)}, supernatural affinity ${formatWeightedPreference(tasteProfile.supernaturalAffinity)}, ambiguity tolerance ${formatWeightedPreference(tasteProfile.ambiguityTolerance)}, gore tolerance ${formatWeightedPreference(tasteProfile.goreTolerance)} as a safety constraint, sleep-safe preference ${formatWeightedPreference(tasteProfile.sleepSafePreference)}.`
      : "- Eerie profile signals are present but should be used only lightly because the selected genre is not primarily eerie/horror/dark-adjacent. Do not let horror preferences dominate.",
    "Do not mention personalization or the reader profile in the story."
  ].join("\n") : "";

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
    canonicalProfile
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
      userHardAvoidancesSummary: userHardAvoidances.length ? userHardAvoidances.join(", ") : "none",
      defaultEerieSafetyGuardrailsSummary: defaultEerieSafetyGuardrails.length ? defaultEerieSafetyGuardrails.join(", ") : "none",
      eerieSignalsIncluded: profileUsed,
      continuationStoryIdIncludedInLastNewStoryRequest: Boolean(continuationStoryId),
      feedbackIncluded: profileUsed && feedbackIncluded,
      identityDiagnostics: createEmptyLastNewStoryPersonalization().identityDiagnostics,
      latestStoryFeedbackSummary: feedbackSummary,
      summary: profileUsed ? `Used ${confidence}-confidence reader profile ${confidence === "low" ? "lightly" : "as preference guidance"}: favored ${topGenre ?? genre} and ${topMood ?? profile.latestMood?.mood ?? "available mood"} mood; ${userHardAvoidances.length ? "included user hard avoidances" : "no user hard avoidances found"}; ${feedbackIncluded ? "included recent story feedback as weak guidance" : "no story feedback found"}; ${includeEerieSignals ? "included taste profile guidance without forcing horror." : "did not force eerie preferences."}` : "No persisted reader profile was available; generated with the existing new-story inputs only."
    },
    prompt,
    snapshot
  };
}

function createReaderProfileGenerationSnapshot({ canonicalProfile, defaultSafetyGuardrails, feedbackIncluded, genreSignal, mode, moodSignal, profile, profileSource, profileUsed, tasteProfile, userHardAvoidances }: { canonicalProfile: CanonicalReaderProfile; defaultSafetyGuardrails: string[]; feedbackIncluded: boolean; genreSignal: string; mode: Exclude<GenerationSource, null>; moodSignal: string; profile: ReaderProfile; profileSource: ProfileSourceUsed; profileUsed: boolean; tasteProfile: ReaderProfile["tasteProfile"] | null; userHardAvoidances: string[]; }): ReaderProfileGenerationSnapshot {
  const feedbackSignals = profile.storyFeedbackSignals ?? [];
  const latestFeedback = [...feedbackSignals].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

  return {
    mode,
    profileUsed,
    profileSourceUsed: profileSource,
    profileUpdatedAt: profileUsed ? profile.updatedAt : "none",
    profileConfidence: profileUsed ? getReaderProfileConfidence(profile) : "unavailable",
    tasteProfilePresent: Boolean(tasteProfile),
    tasteProfileSource: tasteProfile?.source ?? "none",
    tasteProfileUpdatedAt: tasteProfile?.updatedAt ?? "none",
    feedbackSignalCount: feedbackSignals.length,
    feedbackIncluded,
    latestFeedbackRating: latestFeedback?.rating ?? "none",
    userHardAvoidanceCount: userHardAvoidances.length,
    userHardAvoidancesSummary: userHardAvoidances.length ? userHardAvoidances.join(", ") : "none",
    defaultSafetyGuardrailCount: defaultSafetyGuardrails.length,
    defaultSafetyGuardrailsSummary: defaultSafetyGuardrails.length ? defaultSafetyGuardrails.join(", ") : "none",
    moodSignal,
    genreSignal,
    canonicalReaderProfileUsed: true,
    canonicalReaderProfileInput: buildGenerationReaderProfileInput(canonicalProfile),
    generatedAt: new Date().toISOString()
  };
}

function getContinuationSeriesId(story: LibraryStory, storyId: string, storyResponse: GenerateStoryResponse | null, activeCommittedStoryId: string, activeCommittedSeriesId: string): string {
  if (activeCommittedStoryId && activeCommittedSeriesId && storyId === activeCommittedStoryId) return activeCommittedSeriesId;
  if (storyResponse?.metadata.diagnostics.storyId === storyId) return storyResponse.metadata.diagnostics.seriesId;
  if ("seriesId" in story && typeof story.seriesId === "string" && story.seriesId.trim()) return story.seriesId;
  return storyId;
}

function getGenerationTriggerLabel(generationMode: GenerationMode, source: ReaderProfileEventSource): "Start Something New" | "Continue Series" | "Retry/Rewrite" | "Create" {
  if (generationMode === "new_story" && source === "startSomethingNew") return "Start Something New";
  if (generationMode === "continue_series") return "Continue Series";
  if (generationMode === "rewrite_retry") return "Retry/Rewrite";
  return "Create";
}

function AppStateDiagnostics({ activeView, activeCommittedSeriesId, activeCommittedStoryId, currentEpisodeNumber, currentStoryFeedback, currentStoryId, feedbackDraftHasUnsavedChanges, feedbackSaveBlockedBecauseRatingMissing, generationBlockedBecauseUnsavedFeedback, generationSource, isGenerating, lastContinuationBlockedBecauseContextMissing, lastContinuationContextIncluded, lastGenerationCancelledOrAborted, lastGenerationTrigger, lastLibraryOpenedEpisodeNumber, lastLibraryOpenedStoryId, lastNewStoryPersonalization, lastReadyStoryPreparationOutcome, lastReadyStoryPreparationStatus, lastReadyStoryQueueAction, lastRequestIncludedContinuationStoryId, pendingGenerationMode, profile, readyStoryQueue, savedForLaterStoryQueue }: { activeView: AppView; activeCommittedSeriesId: string; activeCommittedStoryId: string; currentEpisodeNumber: number | null; currentStoryFeedback: StoryFeedbackSignal | null; currentStoryId: string; feedbackDraftHasUnsavedChanges: boolean; feedbackSaveBlockedBecauseRatingMissing: boolean; generationBlockedBecauseUnsavedFeedback: boolean; generationSource: GenerationSource; isGenerating: boolean; lastContinuationBlockedBecauseContextMissing: boolean; lastContinuationContextIncluded: boolean; lastGenerationCancelledOrAborted: boolean; lastGenerationTrigger: string; lastLibraryOpenedEpisodeNumber: number | null; lastLibraryOpenedStoryId: string; lastNewStoryPersonalization: LastNewStoryPersonalization; lastReadyStoryPreparationOutcome: string; lastReadyStoryPreparationStatus: string; lastReadyStoryQueueAction: string; lastRequestIncludedContinuationStoryId: boolean; pendingGenerationMode: GenerationMode | "none"; profile: ReaderProfile; readyStoryQueue: ReadyStoryQueueItem[]; savedForLaterStoryQueue: ReadyStoryQueueItem[] }) {
  return (
    <details className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">App state diagnostics</summary>
      <div className="mt-3 grid min-w-0 gap-1 break-words sm:grid-cols-2">
        <p><span className="font-semibold text-paper/80">Active view:</span> {activeView}</p>
        <p><span className="font-semibold text-paper/80">Generation in progress:</span> {isGenerating ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Last generation trigger/source:</span> {lastGenerationTrigger}</p>
        <p><span className="font-semibold text-paper/80">Active generation source:</span> {generationSource ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Current story ID:</span> {currentStoryId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Active committed storyId:</span> {activeCommittedStoryId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Active committed seriesId:</span> {activeCommittedSeriesId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Reader current story id:</span> {currentStoryId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Reader current series id:</span> {activeCommittedSeriesId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Reader current episode number:</span> {currentEpisodeNumber ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Last library opened story id:</span> {lastLibraryOpenedStoryId || "none"}</p>
        <p><span className="font-semibold text-paper/80">Last library opened episode number:</span> {lastLibraryOpenedEpisodeNumber ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Pending generation mode:</span> {pendingGenerationMode}</p>
        <p><span className="font-semibold text-paper/80">Last generation cancelled/aborted:</span> {lastGenerationCancelledOrAborted ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Current story feedback available:</span> {currentStoryId ? "yes" : "no - current story id is missing"}</p>
        <p><span className="font-semibold text-paper/80">Current story feedback saved:</span> {currentStoryFeedback ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Current story feedback rating:</span> {currentStoryFeedback?.rating ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Current story feedback reasons:</span> {currentStoryFeedback?.reasons.length ? currentStoryFeedback.reasons.join(", ") : "none"}</p>
        <p><span className="font-semibold text-paper/80">Total story feedback signals:</span> {profile.storyFeedbackSignals?.length ?? 0}</p>
        <p><span className="font-semibold text-paper/80">Ready story queue count:</span> {readyStoryQueue.length}</p>
        <p><span className="font-semibold text-paper/80">StorySpark catalog count:</span> {STORY_SPARK_CATALOG.length}</p>
        <p><span className="font-semibold text-paper/80">Ready queue StorySpark source count:</span> {readyStoryQueue.filter((item) => item.sourceStorySparkId).length}</p>
        <p><span className="font-semibold text-paper/80">Ready story prepared count:</span> {countPreparedReadyStoryQueueItems(readyStoryQueue)}</p>
        <p><span className="font-semibold text-paper/80">Ready story preparation status:</span> {lastReadyStoryPreparationStatus}</p>
        <p><span className="font-semibold text-paper/80">Last ready story preparation outcome:</span> {lastReadyStoryPreparationOutcome}</p>
        <p><span className="font-semibold text-paper/80">Saved for later queue count:</span> {savedForLaterStoryQueue.length}</p>
        <p><span className="font-semibold text-paper/80">Last ready story queue action:</span> {lastReadyStoryQueueAction}</p>
        <p><span className="font-semibold text-paper/80">Feedback draft has unsaved changes:</span> {feedbackDraftHasUnsavedChanges ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Feedback save blocked because rating missing:</span> {feedbackSaveBlockedBecauseRatingMissing ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Generation blocked because unsaved feedback:</span> {generationBlockedBecauseUnsavedFeedback ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Last request included continuation story ID:</span> {lastRequestIncludedContinuationStoryId ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Continuation context included:</span> {lastContinuationContextIncluded ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Continuation blocked because context missing:</span> {lastContinuationBlockedBecauseContextMissing ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Profile used in last new-story generation:</span> {lastNewStoryPersonalization.profileUsed ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Profile source used:</span> {lastNewStoryPersonalization.profileSourceUsed}</p>
        <p><span className="font-semibold text-paper/80">Profile confidence:</span> {lastNewStoryPersonalization.profileConfidence}</p>
        <p><span className="font-semibold text-paper/80">Last generation mode:</span> {lastNewStoryPersonalization.identityDiagnostics.identity?.generationMode ?? lastNewStoryPersonalization.lastGenerationMode}</p>
        <p><span className="font-semibold text-paper/80">Last generation storyId:</span> {lastNewStoryPersonalization.identityDiagnostics.identity?.storyId ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Last generation seriesId:</span> {lastNewStoryPersonalization.identityDiagnostics.identity?.seriesId ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Last generation sourceStoryId:</span> {lastNewStoryPersonalization.identityDiagnostics.identity?.sourceStoryId ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Last generation parentSeriesId:</span> {lastNewStoryPersonalization.identityDiagnostics.identity?.parentSeriesId ?? "none"}</p>
        <p><span className="font-semibold text-paper/80">Last generation created new series:</span> {lastNewStoryPersonalization.identityDiagnostics.newSeriesCreated ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Last generation trigger:</span> {lastNewStoryPersonalization.identityDiagnostics.trigger}</p>
        <p><span className="font-semibold text-paper/80">Last generation mood signal:</span> {lastNewStoryPersonalization.moodSignal}</p>
        <p><span className="font-semibold text-paper/80">Last generation genre signal:</span> {lastNewStoryPersonalization.genreSignal}</p>
        <p><span className="font-semibold text-paper/80">User hard avoidances included:</span> {lastNewStoryPersonalization.hardAvoidancesIncluded ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">User hard avoidances:</span> {lastNewStoryPersonalization.userHardAvoidancesSummary}</p>
        <p><span className="font-semibold text-paper/80">Default/eerie safety guardrails:</span> {lastNewStoryPersonalization.defaultEerieSafetyGuardrailsSummary}</p>
        <p><span className="font-semibold text-paper/80">Eerie signals included:</span> {lastNewStoryPersonalization.eerieSignalsIncluded ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Feedback included in last new-story personalization:</span> {lastNewStoryPersonalization.feedbackIncluded ? "yes" : "no"}</p>
        <p><span className="font-semibold text-paper/80">Continuation story id included in last new-story request:</span> {lastNewStoryPersonalization.continuationStoryIdIncludedInLastNewStoryRequest ? "yes" : "no"}</p>
        <p className="sm:col-span-2"><span className="font-semibold text-paper/80">Latest story feedback summary:</span> {lastNewStoryPersonalization.latestStoryFeedbackSummary}</p>
        <p className="sm:col-span-2"><span className="font-semibold text-paper/80">Personalization summary:</span> {lastNewStoryPersonalization.summary}</p>
        <pre className="max-h-72 max-w-full overflow-auto rounded border border-paper/10 bg-night-ink/80 p-3 text-[0.68rem] leading-5 text-paper/70 sm:col-span-2">{JSON.stringify(lastNewStoryPersonalization.responseSnapshot ?? null, null, 2)}</pre>
      </div>
    </details>
  );
}

function ReaderProfileDiagnostics({ canonicalProfile, cloudSync, lastGenerationUsedCanonicalProfile, onClear, profile }: { canonicalProfile: CanonicalReaderProfile | null; cloudSync: CloudReaderProfileSyncState; lastGenerationUsedCanonicalProfile: boolean; onClear: () => void; profile: ReaderProfile }) {
  const topMood = getTopCount(profile.moodCounts);
  const topGenre = getTopCount(profile.genreCounts);
  const tasteProfile = profile.tasteProfile;

  return (
    <details className="min-w-0 rounded-md border border-paper/10 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">Reader profile diagnostics</summary>
      <div className="mt-3 grid gap-3">
        <div className="grid min-w-0 gap-1 break-words sm:grid-cols-2">
          <p><span className="font-semibold text-paper/80">Reader ID:</span> {canonicalProfile?.readerId ? "present" : "missing"}</p>
          <p><span className="font-semibold text-paper/80">Reader ID storage key:</span> {READER_ID_STORAGE_KEY}</p>
          <p><span className="font-semibold text-paper/80">Canonical profile key:</span> {CANONICAL_READER_PROFILE_STORAGE_KEY}</p>
          <p><span className="font-semibold text-paper/80">Canonical profile exists:</span> {canonicalProfile ? "yes" : "no"}</p>
          <p><span className="font-semibold text-paper/80">Profile source:</span> {canonicalProfile?.source ?? "default"}</p>
          <p><span className="font-semibold text-paper/80">Cloud sync:</span> {cloudSync.status === "synced" ? "success" : cloudSync.status === "unavailable" || cloudSync.status === "not found" ? "not configured" : cloudSync.status === "pending" ? "pending" : "failed"}</p>
          <p><span className="font-semibold text-paper/80">Last generation used canonical profile:</span> {lastGenerationUsedCanonicalProfile ? "yes" : "no"}</p>
          <p><span className="font-semibold text-paper/80">Profile updated:</span> {canonicalProfile?.updatedAt || "never"}</p>
          <p><span className="font-semibold text-paper/80">Onboarding mode:</span> {canonicalProfile?.onboarding?.mode ?? "unknown"}</p>
          <p><span className="font-semibold text-paper/80">Preferred format:</span> {canonicalProfile?.preferences.preferredFormat ?? canonicalProfile?.onboarding?.preferredFormat ?? "not available"}</p>
          <p><span className="font-semibold text-paper/80">Preferred duration:</span> {canonicalProfile?.preferences.preferredDuration ?? canonicalProfile?.onboarding?.preferredDuration ?? "not available"}</p>
          <p><span className="font-semibold text-paper/80">Fear intensity:</span> {formatOptionalPreference(canonicalProfile?.preferences.fearIntensity)}</p>
          <p><span className="font-semibold text-paper/80">Weirdness tolerance:</span> {formatOptionalPreference(canonicalProfile?.preferences.weirdnessTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Supernatural affinity:</span> {formatOptionalPreference(canonicalProfile?.preferences.supernaturalAffinity)}</p>
          <p><span className="font-semibold text-paper/80">Ambiguity tolerance:</span> {formatOptionalPreference(canonicalProfile?.preferences.ambiguityTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Gore tolerance:</span> {formatOptionalPreference(canonicalProfile?.preferences.goreTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Sleep-safe preference:</span> {formatOptionalPreference(canonicalProfile?.preferences.sleepSafePreference)}</p>
          <p><span className="font-semibold text-paper/80">Hard avoidances:</span> {canonicalProfile?.preferences.hardAvoidances.length ? canonicalProfile.preferences.hardAvoidances.join(", ") : "none"}</p>
          <p><span className="font-semibold text-paper/80">Story card signal count:</span> {canonicalProfile?.signals.storyCardSignalCount ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Feedback signal count:</span> {canonicalProfile?.signals.feedbackSignalCount ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Last feedback signal id:</span> {canonicalProfile?.signals.lastFeedbackSignalId ?? "none"}</p>
          <p><span className="font-semibold text-paper/80">Last feedback reason:</span> {canonicalProfile?.signals.lastFeedbackReason ?? "none"}</p>
          <p><span className="font-semibold text-paper/80">Learned confidence:</span> {formatOptionalPreference(canonicalProfile?.learned?.confidence)}</p>
          <p><span className="font-semibold text-paper/80">Continuation preference:</span> {formatOptionalPreference(canonicalProfile?.learned?.continuationPreference)}</p>
          <p><span className="font-semibold text-paper/80">Learned genres:</span> {formatLearnedScores(canonicalProfile?.learned?.genres)}</p>
          <p><span className="font-semibold text-paper/80">Learned tones:</span> {formatLearnedScores(canonicalProfile?.learned?.tones)}</p>
          <p><span className="font-semibold text-paper/80">Applied feedback signal ids:</span> {canonicalProfile?.appliedSignalIds?.length ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Favorite count:</span> {canonicalProfile?.signals.favoriteCount ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Saved for later count:</span> {canonicalProfile?.signals.savedForLaterCount ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Last feedback at:</span> {canonicalProfile?.signals.lastFeedbackAt || "never"}</p>
          <p><span className="font-semibold text-paper/80">Fallback/default status:</span> {canonicalProfile?.fallbackReason ?? (canonicalProfile?.source === "default" ? "default" : "none")}</p>
          <p><span className="font-semibold text-paper/80">Profile exists:</span> {profile.profileExists ? "yes" : "no"}</p>
          <p><span className="font-semibold text-paper/80">Profile ID:</span> {cloudSync.profileId || "pending"}</p>
          <p><span className="font-semibold text-paper/80">Local profile exists:</span> {cloudSync.localProfileExists ? "yes" : "no"}</p>
          <p><span className="font-semibold text-paper/80">Cloud profile status:</span> {cloudSync.status}</p>
          <p><span className="font-semibold text-paper/80">Last cloud save outcome:</span> {cloudSync.lastSaveOutcome}</p>
          <p><span className="font-semibold text-paper/80">Last profile save status for feedback:</span> {canonicalProfile?.signals.feedbackSignalCount ? `local success${cloudSync.lastSaveOutcome ? ` / cloud ${cloudSync.lastSaveOutcome}` : ""}` : "no feedback saved"}</p>
          <p><span className="font-semibold text-paper/80">Last cloud sync:</span> {cloudSync.lastSyncAt || "never"}</p>
          <p><span className="font-semibold text-paper/80">Last cloud error:</span> {cloudSync.lastError || "none"}</p>
          <p><span className="font-semibold text-paper/80">Local updated:</span> {cloudSync.localUpdatedAt || profile.updatedAt || "never"}</p>
          <p><span className="font-semibold text-paper/80">Cloud updated:</span> {cloudSync.cloudUpdatedAt || "unknown"}</p>
          <p><span className="font-semibold text-paper/80">Total generated:</span> {profile.counters.totalStoriesGenerated}</p>
          <p><span className="font-semibold text-paper/80">Total opened:</span> {profile.counters.totalStoriesOpened}</p>
          <p><span className="font-semibold text-paper/80">Total continued:</span> {profile.counters.totalContinues}</p>
          <p><span className="font-semibold text-paper/80">Total exported:</span> {profile.counters.totalExports}</p>
          <p><span className="font-semibold text-paper/80">Total demo loaded:</span> {profile.counters.totalDemoStoriesLoaded}</p>
          <p><span className="font-semibold text-paper/80">Total start something different:</span> {profile.counters.totalStartSomethingDifferent}</p>
          <p><span className="font-semibold text-paper/80">Total mood selections:</span> {profile.counters.totalMoodSelections}</p>
          <p><span className="font-semibold text-paper/80">Total story feedback signals:</span> {profile.storyFeedbackSignals?.length ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Ready story queue signal count:</span> {profile.readyStoryQueueSignals?.length ?? 0}</p>
          <p><span className="font-semibold text-paper/80">Latest ready story queue signal:</span> {formatLatestReadyStoryQueueSignal(profile.readyStoryQueueSignals)}</p>
          <p><span className="font-semibold text-paper/80">Top mood:</span> {topMood ?? "none"}</p>
          <p><span className="font-semibold text-paper/80">Top genre:</span> {topGenre ?? "none"}</p>
          <p><span className="font-semibold text-paper/80">Storage key:</span> {READER_PROFILE_STORAGE_KEY}</p>
          <p><span className="font-semibold text-paper/80">Profile ID key:</span> {READER_PROFILE_ID_STORAGE_KEY}</p>
          <p><span className="font-semibold text-paper/80">Updated:</span> {profile.updatedAt || "never"}</p>
        </div>

        <div className="rounded-md border border-lantern-gold/15 bg-night-ink/60 p-3">
          <p className="mb-2 font-semibold text-paper/80">Taste Profile</p>
          <div className="grid min-w-0 gap-1 break-words sm:grid-cols-2">
            <p><span className="font-semibold text-paper/80">Taste profile source:</span> {tasteProfile?.source ?? "not available"}</p>
            <p><span className="font-semibold text-paper/80">Taste profile confidence:</span> {tasteProfile?.profileConfidence ?? "not available"}</p>
            <p><span className="font-semibold text-paper/80">Preferred format:</span> {tasteProfile?.preferredFormat ?? "not available"}</p>
            <p><span className="font-semibold text-paper/80">Preferred duration:</span> {tasteProfile?.preferredDurationMinutes ? `${tasteProfile.preferredDurationMinutes} minutes` : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Fear intensity:</span> {tasteProfile?.fearIntensity ? formatPreferencePair(tasteProfile.fearIntensity) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Weirdness tolerance:</span> {tasteProfile?.weirdnessTolerance ? formatPreferencePair(tasteProfile.weirdnessTolerance) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Supernatural affinity:</span> {tasteProfile?.supernaturalAffinity ? formatPreferencePair(tasteProfile.supernaturalAffinity) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Ambiguity tolerance:</span> {tasteProfile?.ambiguityTolerance ? formatPreferencePair(tasteProfile.ambiguityTolerance) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Gore tolerance:</span> {tasteProfile?.goreTolerance ? formatPreferencePair(tasteProfile.goreTolerance) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Sleep-safe preference:</span> {tasteProfile?.sleepSafePreference ? formatPreferencePair(tasteProfile.sleepSafePreference) : "not available"}</p>
            <p><span className="font-semibold text-paper/80">User hard avoidances:</span> {tasteProfile?.userHardAvoidances?.length ? tasteProfile.userHardAvoidances.join(", ") : tasteProfile ? "none" : "not available"}</p>
            <p><span className="font-semibold text-paper/80">Default safety guardrails:</span> {tasteProfile?.defaultSafetyGuardrails?.length ? tasteProfile.defaultSafetyGuardrails.join(", ") : "not available"}</p>
          </div>
        </div>
        <details className="rounded-md border border-paper/10 bg-night-ink p-3">
          <summary className="cursor-pointer font-semibold text-paper/75">Raw JSON</summary>
          <pre className="mt-3 max-h-72 max-w-full overflow-auto text-[0.7rem] leading-5 text-paper/70">
            {JSON.stringify({ canonicalProfile, readerIdStorageKey: READER_ID_STORAGE_KEY, canonicalProfileStorageKey: CANONICAL_READER_PROFILE_STORAGE_KEY, storageKey: READER_PROFILE_STORAGE_KEY, profileIdStorageKey: READER_PROFILE_ID_STORAGE_KEY, cloudSync, ...profile }, null, 2)}
          </pre>
        </details>
        <button className="w-fit rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper hover:border-lantern-gold/50" onClick={onClear} type="button">Clear reader profile</button>
      </div>
    </details>
  );
}

function areFeedbackDraftsEqual(
  draftRating: StoryFeedbackRating | null,
  draftReasons: StoryFeedbackReason[],
  savedSignal: StoryFeedbackSignal | null | undefined
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
  const [topKey, topCount] = Object.entries(counts).sort(([, left], [, right]) => right - left)[0] ?? [];
  return topKey ? `${topKey} (${topCount})` : null;
}

function getReaderProfileSource(sync: CloudReaderProfileSyncState): ProfileSourceUsed {
  if (sync.status === "synced" && sync.cloudUpdatedAt && sync.cloudUpdatedAt >= sync.localUpdatedAt) return "cloud";
  if (sync.localProfileExists) return "local";
  return "none";
}

function getReaderProfileConfidence(profile: ReaderProfile): "low" | "medium" | "high" {
  const signalCount = profile.counters.totalStoriesGenerated + profile.counters.totalStoriesOpened + profile.counters.totalContinues + profile.counters.totalMoodSelections;
  if (signalCount >= 12) return "high";
  if (signalCount >= 4) return "medium";
  return "low";
}

function readStoryFeedbackGenerationMode(presentation: GeneratedStoryPresentation): StoryFeedbackGenerationMode {
  if (presentation === "first-episode") return "new-story";
  if (presentation === "continuation") return "continue-story";
  return "unknown";
}

function summarizeStoryFeedback(signals: StoryFeedbackSignal[] | undefined): string {
  const recentSignals = Array.isArray(signals) ? signals.slice(-10) : [];
  if (recentSignals.length === 0) return "No prior story feedback available.";

  const latestSignal = recentSignals[recentSignals.length - 1];
  const latestRatingLabel = formatStoryFeedbackRating(latestSignal.rating);
  const latestReasons = latestSignal.reasons.map(formatStoryFeedbackReason).filter(Boolean);
  const positiveReasons = recentSignals
    .filter((signal) => signal.score >= 4)
    .flatMap((signal) => signal.reasons.map(formatStoryFeedbackReason));
  const negativeReasons = recentSignals
    .filter((signal) => signal.score <= 2)
    .flatMap((signal) => signal.reasons.map(formatStoryFeedbackReason));

  return [
    `Recent feedback: reader rated the last story ${latestRatingLabel}${latestReasons.length ? ` and selected ${latestReasons.join(" and ")}` : ""}.`,
    positiveReasons.length ? `Lean toward ${dedupe(positiveReasons).slice(0, 4).join(", ")}.` : "",
    negativeReasons.length ? `Avoid or adjust around ${dedupe(negativeReasons).slice(0, 4).join(", ")}.` : "",
    "Use feedback as weak preference guidance, not hard constraints.",
  ].filter(Boolean).join(" ");
}

function formatStoryFeedbackRating(rating: StoryFeedbackRating): string {
  return STORY_FEEDBACK_RATING_OPTIONS.find((option) => option.rating === rating)?.label ?? rating;
}

function formatStoryFeedbackReason(reason: StoryFeedbackReason): string {
  return STORY_FEEDBACK_REASON_OPTIONS.find((option) => option.reason === reason)?.label ?? reason;
}

function formatCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort(([, left], [, right]) => right - left).slice(0, 6);
  return entries.length ? entries.map(([key, count]) => `${key}: ${count}`).join("; ") : "none";
}

function splitAvoidances(value: string | undefined): string[] {
  return (value ?? "").split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function formatWeightedPreference(preference: { value: number; confidence: number }): string {
  return `${preference.value.toFixed(2)} confidence ${preference.confidence.toFixed(2)}`;
}

function shouldUseEerieSignalsForGenre(genre: GenrePreset): boolean {
  return /eerie|horror|strange|mystery|dark|supernatural|speculative/i.test(genre);
}

function normalizeCloudReaderProfile(value: unknown): ReaderProfile | null {
  if (!value) return null;
  const profile = normalizeReaderProfile(value);
  return profile.profileExists ? profile : null;
}

function formatErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Reader profile cloud sync failed.";
}

function EerieReaderProfileDiagnostics({ onClear, profile }: { onClear: () => void; profile: EerieReaderProfile }) {
  const profileExists = typeof window !== "undefined" && window.localStorage.getItem(EERIE_READER_PROFILE_STORAGE_KEY) !== null;
  const diagnostics = formatEerieReaderProfileForDiagnostics(profile);
  const topAffinities = Object.entries(profile.affinities)
    .sort(([, left], [, right]) => right.value - left.value)
    .slice(0, 8);

  return (
    <details className="min-w-0 rounded-md border border-lantern-gold/15 bg-paper/5 p-3 text-xs text-paper/65">
      <summary className="cursor-pointer font-semibold text-paper/75">Legacy local eerie profile diagnostics</summary>
      <div className="mt-3 grid gap-3">
        <div className="grid min-w-0 gap-1 break-words sm:grid-cols-2">
          <p><span className="font-semibold text-paper/80">Persistence:</span> local-only legacy profile; mirrored into cloud-backed reader tasteProfile when needed</p>
          <p><span className="font-semibold text-paper/80">Profile exists in local storage:</span> {profileExists ? "yes" : "no"}</p>
          <p><span className="font-semibold text-paper/80">Storage key:</span> {EERIE_READER_PROFILE_STORAGE_KEY}</p>
          <p><span className="font-semibold text-paper/80">Onboarding mode:</span> {profile.onboardingMode}</p>
          <p><span className="font-semibold text-paper/80">Profile confidence:</span> {profile.profileConfidence}</p>
          <p><span className="font-semibold text-paper/80">Fear intensity:</span> {formatPreferencePair(profile.fearIntensity)}</p>
          <p><span className="font-semibold text-paper/80">Weirdness tolerance:</span> {formatPreferencePair(profile.weirdnessTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Supernatural affinity:</span> {formatPreferencePair(profile.supernaturalAffinity)}</p>
          <p><span className="font-semibold text-paper/80">Ambiguity tolerance:</span> {formatPreferencePair(profile.ambiguityTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Gore tolerance:</span> {formatPreferencePair(profile.goreTolerance)}</p>
          <p><span className="font-semibold text-paper/80">Sleep-safe preference:</span> {formatPreferencePair(profile.sleepSafePreference)}</p>
          <p><span className="font-semibold text-paper/80">Preferred format:</span> {profile.preferredFormat}</p>
          <p><span className="font-semibold text-paper/80">Preferred duration:</span> {profile.preferredDurationMinutes} minutes</p>
          <p><span className="font-semibold text-paper/80">Default/eerie safety guardrails:</span> {DEFAULT_EERIE_SAFETY_GUARDRAILS.join(", ") || "none"}</p>
          <p><span className="font-semibold text-paper/80">Story card signal count:</span> {profile.storyCardSignals.length}</p>
          <p><span className="font-semibold text-paper/80">Updated:</span> {profile.updatedAt}</p>
        </div>
        <div>
          <p className="font-semibold text-paper/80">Top affinities by value</p>
          <ul className="mt-1 grid gap-1 sm:grid-cols-2">
            {topAffinities.map(([key, preference]) => <li key={key}>{key}: {formatPreferencePair(preference)}</li>)}
          </ul>
        </div>
        <pre className="max-h-72 max-w-full overflow-auto rounded-md border border-paper/10 bg-night-ink p-3 text-[0.7rem] leading-5 text-paper/70">
          {JSON.stringify({ profileExists, ...diagnostics }, null, 2)}
        </pre>
        <button className="w-fit rounded-md border border-paper/15 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper hover:border-lantern-gold/50" onClick={onClear} type="button">Clear eerie reader profile</button>
      </div>
    </details>
  );
}

function getMutuallyExclusiveFeedbackReason(reason: StoryFeedbackReason): StoryFeedbackReason | null {
  if (reason === "too_dark") return "not_dark_enough";
  if (reason === "not_dark_enough") return "too_dark";
  if (reason === "too_weird") return "not_weird_enough";
  if (reason === "not_weird_enough") return "too_weird";
  return null;
}

function formatOptionalPreference(value: number | undefined): string {
  return typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "not available";
}

function formatLearnedScores(scores: Record<string, number> | undefined): string {
  const entries = Object.entries(scores ?? {}).slice(0, 5);
  return entries.length ? entries.map(([key, value]) => `${key} ${value.toFixed(2)}`).join(", ") : "none";
}

function formatPreferencePair(preference: { value: number; confidence: number }): string {
  return `${preference.value.toFixed(2)} / ${preference.confidence.toFixed(2)}`;
}

function MobileTopHeader({ onGoHome }: { onGoHome: () => void }) {
  return (
    <header className="relative h-12 w-full min-w-0 py-1 md:hidden">
      <button
        aria-label="Open menu"
        className="absolute left-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-xl text-paper"
        type="button"
      >
        <span aria-hidden="true">☰</span>
      </button>

      <a
        aria-label="Go home"
        className="absolute left-1/2 top-1/2 z-0 flex h-8 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 no-underline"
        href="/"
        onClick={(event) => {
          event.preventDefault();
          onGoHome();
        }}
      >
        <img
          alt="Lantyrn"
          className="block h-8 w-32 min-w-0 object-contain [filter:invert(96%)_sepia(9%)_saturate(363%)_hue-rotate(352deg)_brightness(102%)_contrast(93%)]"
          src="/artwork/lantyrn-wordmark.svg"
        />
      </a>

      <button
        aria-label="Open profile"
        className="absolute right-0 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-lg text-paper"
        type="button"
      >
        <span aria-hidden="true">♡</span>
      </button>
    </header>
  );
}

function MobileBottomNav({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return <nav aria-label="Mobile primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/10 bg-night-ink/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.55rem)] pt-2 backdrop-blur md:hidden"><div className="mx-auto grid max-w-md grid-cols-5 gap-1">{NAV_ITEMS.map((item) => <button aria-current={activeView === item.view ? "page" : undefined} className={`min-h-11 rounded-xl px-1 py-2 text-[0.66rem] font-semibold leading-tight ${activeView === item.view ? "bg-lantern-gold text-night-ink" : "text-paper/65"}`} key={item.view} onClick={() => onChange(item.view)} type="button">{item.label}</button>)}</div></nav>;
}

function NavTabs({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return <nav aria-label="Primary" className="w-full min-w-0 md:max-w-xl"><div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:justify-end">{NAV_ITEMS.map((tab) => <button aria-current={activeView === tab.view ? "page" : undefined} className={`min-w-0 rounded-md border px-2.5 py-2 text-center text-xs font-semibold leading-5 transition sm:px-3 ${activeView === tab.view ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50"}`} key={tab.view} onClick={() => onChange(tab.view)} type="button">{tab.label}</button>)}</div></nav>;
}

function PageHeading({ body, eyebrow, title }: { body: string; eyebrow: string; title: string }) { return <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold leading-tight text-paper md:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">{body}</p></div>; }
function CoverArt({ label, title, tone = "cool", size = "normal" }: { label?: string; title: string; tone?: "cool" | "warm"; size?: "normal" | "feature" | "mobile" }) { const palette = tone === "warm" ? "linear-gradient(145deg, #efe5cf 0%, #c9a46a 42%, #2f4f4f 100%)" : "linear-gradient(145deg, #d8ded5 0%, #6f7f72 45%, #26364d 100%)"; const sizeClass = size === "feature" ? "min-h-[20rem] sm:min-h-[23rem] max-w-none" : size === "mobile" ? "h-full min-h-0 max-w-none" : "min-h-52 max-w-none sm:min-h-40 sm:max-w-40"; return <div aria-label={`${title} artwork`} className={`relative flex aspect-[3/4] w-full ${sizeClass} overflow-hidden rounded-md border border-primary-dark/10 p-4 text-night-ink shadow-soft`} style={{ background: palette }}><div className="absolute inset-x-5 top-7 h-px bg-night-ink/30" /><div className="absolute inset-x-8 top-12 h-px bg-night-ink/20" /><div className="absolute left-6 top-20 h-24 w-12 border-l border-night-ink/25" /><div className="absolute bottom-8 right-6 h-28 w-20 rounded-t-full border border-night-ink/20 bg-white/10" /><div className="absolute bottom-0 left-0 h-24 w-full bg-night-ink/10" /><div className="relative z-10 flex h-full w-full flex-col justify-between"><span className="max-w-full text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label ?? "Story Artwork"}</span><span className="max-w-[13rem] text-2xl font-semibold leading-tight md:text-3xl">{title.split(" ").slice(0, 5).join(" ")}</span></div></div>; }
function HeroPortrait({ name, size = "normal" }: { name: string; size?: "normal" | "large" }) { const className = size === "large" ? "h-20 w-20 text-xl" : "h-16 w-16 text-lg"; return <div aria-label={`${name} portrait artwork`} className={`relative flex ${className} flex-none items-center justify-center overflow-hidden rounded-md border border-lantern-gold/35 bg-primary-dark font-semibold text-lantern-gold`}><span className="absolute top-2 h-8 w-10 rounded-full border border-lantern-gold/25 bg-lantern-gold/10" /><span className="absolute bottom-0 h-8 w-14 rounded-t-full border-x border-t border-paper/10 bg-paper/10" /><span className="relative z-10">{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span></div>; }
function Tag({ children }: { children: ReactNode }) { return <span className="inline-flex max-w-full items-center rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold leading-5 text-lantern-gold">{children}</span>; }
function SmallButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) { return <button className="min-h-11 rounded-md border border-lantern-gold/40 bg-paper/10 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function Status({ children, tone }: { children: ReactNode; tone: "info" | "error" }) { return <div className={`min-w-0 rounded-md border px-4 py-3 text-sm ${tone === "error" ? "border-ember/40 bg-ember/10 text-ember" : "border-lantern-gold/30 bg-paper/10 text-paper/75"}`}>{children}</div>; }
function EmptyPanel({ body, title }: { body: string; title: string }) { return <div className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-5"><h3 className="text-lg font-semibold text-paper">{title}</h3><p className="mt-2 text-sm leading-6 text-paper/65">{body}</p></div>; }
function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[] | readonly { value: string; label: string }[]; onChange: (value: string) => void }) { return <label className="flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="min-h-11 w-full min-w-0 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const optionLabel = typeof option === "string" ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select></label>; }
function SelectLibrary({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: { label: string; value: string }[]; value: string }) { return <label className="mt-4 flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="min-h-11 w-full min-w-0 rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Choose one</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

function responseToLibraryStory(response: GenerateStoryResponse, id: string): LibraryStory { return { id, storyId: response.metadata.diagnostics.storyId, seriesId: response.metadata.diagnostics.seriesId, sourceStoryId: response.metadata.diagnostics.sourceStoryId ?? null, parentSeriesId: response.metadata.diagnostics.parentSeriesId ?? null, generationMode: response.metadata.diagnostics.generationMode, title: createStoryTitle(response.story), story: response.story, wordCount: response.metadata.wordCount, createdAt: response.metadata.generationStartedAt ?? new Date().toISOString(), genrePreset: response.metadata.diagnostics.genrePreset, charactersUsed: response.metadata.charactersUsed, rulesReferenced: response.metadata.rulesReferenced }; }
function normalizeGenerateStoryResponse(payload: unknown): GenerateStoryResponse { const normalizedPayload = normalizeStoryPayload(payload) as Partial<GenerateStoryResponse>; const story = normalizeStoryText(normalizedPayload.story); if (!story || !normalizedPayload.metadata) throw new Error("Story generation returned an invalid response."); return { ...normalizedPayload, story, metadata: { ...normalizedPayload.metadata, wordCount: countWords(story) } } as GenerateStoryResponse; }
async function fetchCloudJson<T>(input: string, init?: RequestInit): Promise<T> { const response = await fetch(input, { ...init, cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Cloud project request failed."); return payload as T; }
function countWords(text: string): number { return text.trim().split(/\s+/).filter(Boolean).length; }
function createStoryId(story: string, createdAt = new Date().toISOString()): string { return `${createdAt}-${story.length}`.replace(/[^a-zA-Z0-9_-]/g, "-"); }
function createStoryTitle(story: string): string { const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story"; const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine; return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story"; }
function createDemoLatestStory(): SavedStory { return { id: DEMO_LATEST_STORY_ID, title: "The Half-Life of Magic", createdAt: new Date().toISOString(), story: DEMO_STORY_TEXT, wordCount: countWords(DEMO_STORY_TEXT), generatorSource: "fallback", charactersUsed: ["Mara Vale"], rulesReferenced: [], genrePreset: "Contemporary Fantastical / Magical Realist", narrativeArchitecture: "Revelation Story", characterArc: "Positive Change Arc", endingType: "Resolution with Residue", lengthTarget: "Standard", diagnosticsNotice: null }; }
function readDemoLatestStory(): SavedStory | null { if (typeof window === "undefined") return null; try { const raw = window.localStorage.getItem(DEMO_LATEST_STORY_STORAGE_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as SavedStory; return parsed?.id === DEMO_LATEST_STORY_ID && typeof parsed.story === "string" ? parsed : null; } catch { return null; } }
function persistDemoLatestStory(story: SavedStory) { if (typeof window === "undefined") return; window.localStorage.setItem(DEMO_LATEST_STORY_STORAGE_KEY, JSON.stringify(story)); }
function clearDemoLatestStory() { if (typeof window === "undefined") return; window.localStorage.removeItem(DEMO_LATEST_STORY_STORAGE_KEY); }
function createStoryBrief(story: LibraryStory): StoryBrief { if (story.id === DEMO_LATEST_STORY_ID) return DEMO_STORY_BRIEF; const sentences = extractSentences(story.story); const recapSentences = sentences.slice(0, 4); const heroName = story.charactersUsed[0] || "The lead"; const secondCharacter = story.charactersUsed[1]; const hook = sentences[0] ? truncateText(sentences[0], 190) : `${story.title} is waiting at the edge of its next turning point.`; const recap = recapSentences.length ? recapSentences.join(" ") : truncateText(story.story, 420); return { hook, recap, changed: sentences[4] || `${heroName} has crossed a threshold that makes the old version of the story impossible to return to.`, tension: secondCharacter ? `${heroName} and ${secondCharacter} are still caught in the pressure the last chapter exposed.` : `${heroName} is still carrying the central unanswered pressure of the last chapter.`, nextHook: sentences[5] || `The next chapter should press on the choice ${heroName} can no longer avoid.`, heroName, heroRole: story.genrePreset, struggle: `${heroName} is trying to move forward while the last chapter's consequences narrow the path ahead.` }; }
function extractSentences(text: string): string[] { return (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((sentence) => sentence.trim()).filter(Boolean); }
function sortStoryStartsByMood(activeMood: Mood): StoryStart[] { return [...SUGGESTED_STORY_STARTS].sort((a, b) => Number(b.mood === activeMood) - Number(a.mood === activeMood)); }
function moodDescription(mood: Mood): string { const descriptions: Record<Mood, string> = { Mystery: "Secrets, clues, and a door left open.", Wonder: "Luminous worlds with a human ache.", Emotional: "Intimate choices and unfinished goodbyes.", Adventure: "Momentum, thresholds, and daring turns.", Strange: "Uncanny turns and beautiful wrongness.", Hopeful: "Warm light after difficult choices.", Dark: "Danger, dread, and costly secrets.", Reflective: "Quiet consequences and inner change." }; return descriptions[mood]; }
function readAppView(value: string | null): AppView | null { return value === "library" || value === "worlds" || value === "create" || value === "characters" || value === "home" || value === "mood-intake" ? value : null; }
function truncateText(text: string, maxLength: number): string { const compact = text.replace(/\s+/g, " ").trim(); return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story-world-engine-story"; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatLibraryVersion(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, ""); }
function formatCaughtError(caughtError: unknown): string { return caughtError instanceof Error ? caughtError.message : "Cloud project request failed."; }
function downloadTextFile(filename: string, contents: string) { if (typeof window === "undefined") return; const blob = new Blob([contents], { type: "text/plain;charset=utf-8" }); const url = window.URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url); }
