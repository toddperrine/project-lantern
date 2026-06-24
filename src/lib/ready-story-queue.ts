import type { StorySparkCreatorKind, StorySparkProvenance } from "@/lib/story-spark-catalog";
import type { GenerateStoryResponse, GenrePreset } from "@/lib/types";

export const READY_STORY_QUEUE_STORAGE_KEY = "projectLantern.readyStoryQueue.v1";
export const SAVED_FOR_LATER_STORY_QUEUE_STORAGE_KEY = "projectLantern.savedForLaterStoryQueue.v1";
export const MAX_READY_STORY_QUEUE_ITEMS = 3;
export const MAX_SAVED_FOR_LATER_STORY_ITEMS = 25;

export type ReadyStoryQueueSignal = "read" | "pass" | "save_for_later";

export interface ReadyStoryQueueItem {
  id: string;
  title: string;
  premise: string;
  genre: GenrePreset;
  mood: string;
  heroName: string;
  heroRole: string;
  heroBio: string;
  worldName: string;
  world: string;
  seed: string;
  cast: string;
  rules: string;
  createdAt: string;
  updatedAt: string;
  generationStatus?: "not_started" | "generating" | "ready" | "failed";
  generatedStory?: GenerateStoryResponse | null;
  generatedStoryId?: string;
  generatedAt?: string;
  generationError?: string;
  sourceStorySparkId?: string;
  sourceStorySparkTitle?: string;
  creatorId?: string;
  creatorDisplayName?: string;
  creatorHandle?: string;
  creatorCreditLine?: string;
  creatorKind?: StorySparkCreatorKind;
  provenance?: StorySparkProvenance;
  ipMarking?: string;
  sourceArchivePath?: string;
  sourceArchiveTitle?: string;
  tags?: string[];
}

export function createReadyStoryQueueItem(input: Omit<ReadyStoryQueueItem, "id" | "createdAt" | "updatedAt">, createdAt = new Date().toISOString()): ReadyStoryQueueItem {
  return normalizeReadyStoryQueueItem({
    ...input,
    id: createReadyStoryQueueItemId(input.title, createdAt),
    createdAt,
    updatedAt: createdAt
  });
}

export function readReadyStoryQueue(): ReadyStoryQueueItem[] {
  return readQueueItems(READY_STORY_QUEUE_STORAGE_KEY).slice(0, MAX_READY_STORY_QUEUE_ITEMS);
}

export function persistReadyStoryQueue(items: ReadyStoryQueueItem[]): ReadyStoryQueueItem[] {
  const normalized = items.map((item) => normalizeReadyStoryQueueItem(item)).filter(isReadyStoryQueueItem).slice(0, MAX_READY_STORY_QUEUE_ITEMS);
  writeQueueItems(READY_STORY_QUEUE_STORAGE_KEY, normalized);
  return normalized;
}

export function readSavedForLaterStoryQueue(): ReadyStoryQueueItem[] {
  return readQueueItems(SAVED_FOR_LATER_STORY_QUEUE_STORAGE_KEY).slice(0, MAX_SAVED_FOR_LATER_STORY_ITEMS);
}

export function persistSavedForLaterStoryQueue(items: ReadyStoryQueueItem[]): ReadyStoryQueueItem[] {
  const normalized = items.map((item) => normalizeReadyStoryQueueItem(item)).filter(isReadyStoryQueueItem).slice(0, MAX_SAVED_FOR_LATER_STORY_ITEMS);
  writeQueueItems(SAVED_FOR_LATER_STORY_QUEUE_STORAGE_KEY, normalized);
  return normalized;
}

export function removeReadyStoryQueueItem(items: ReadyStoryQueueItem[], itemId: string): ReadyStoryQueueItem[] {
  return items.filter((item) => item.id !== itemId);
}

export function formatReadyStoryCreatorCredit(item: ReadyStoryQueueItem): string {
  return item.creatorCreditLine || (item.creatorDisplayName ? `StorySpark by ${item.creatorDisplayName}` : "StorySpark creator unknown");
}

export function countPreparedReadyStoryQueueItems(items: ReadyStoryQueueItem[]): number {
  return items.filter((item) => item.generationStatus === "ready" && item.generatedStory).length;
}

export function updateReadyStoryQueueItem(
  items: ReadyStoryQueueItem[],
  itemId: string,
  update: Partial<ReadyStoryQueueItem>
): ReadyStoryQueueItem[] {
  return items.map((item) =>
    item.id === itemId
      ? normalizeReadyStoryQueueItem({ ...item, ...update, updatedAt: update.updatedAt ?? new Date().toISOString() })
      : item
  );
}

export function upsertSavedForLaterStoryQueueItem(items: ReadyStoryQueueItem[], item: ReadyStoryQueueItem): ReadyStoryQueueItem[] {
  return [item, ...items.filter((savedItem) => savedItem.id !== item.id)].slice(0, MAX_SAVED_FOR_LATER_STORY_ITEMS);
}

function readQueueItems(storageKey: string): ReadyStoryQueueItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeReadyStoryQueueItem(item, { resetGenerating: true })).filter(isReadyStoryQueueItem);
  } catch {
    return [];
  }
}

function writeQueueItems(storageKey: string, items: ReadyStoryQueueItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Ignore storage quota/privacy errors; queue state remains in memory for this session.
  }
}

function normalizeReadyStoryQueueItem(value: unknown, options?: { resetGenerating?: boolean }): ReadyStoryQueueItem {
  const candidate = value as Partial<ReadyStoryQueueItem>;
  const generatedStory = normalizeGeneratedStory(candidate?.generatedStory);
  const candidateStatus = candidate?.generationStatus;
  const generationStatus = generatedStory && candidateStatus === "ready"
    ? "ready"
    : candidateStatus === "failed"
      ? "failed"
      : candidateStatus === "generating" && !options?.resetGenerating
        ? "generating"
        : "not_started";

  return {
    id: normalizeQueueText(candidate?.id, 180),
    title: normalizeQueueText(candidate?.title, 180),
    premise: normalizeQueueText(candidate?.premise, 1200),
    genre: normalizeQueueText(candidate?.genre, 120) as GenrePreset,
    mood: normalizeQueueText(candidate?.mood, 80),
    heroName: normalizeQueueText(candidate?.heroName, 120),
    heroRole: normalizeQueueText(candidate?.heroRole, 120),
    heroBio: normalizeQueueText(candidate?.heroBio, 800),
    worldName: normalizeQueueText(candidate?.worldName, 160),
    world: normalizeQueueText(candidate?.world, 2500),
    seed: normalizeQueueText(candidate?.seed, 1200),
    cast: normalizeQueueText(candidate?.cast, 2000),
    rules: normalizeQueueText(candidate?.rules, 1600),
    createdAt: normalizeQueueText(candidate?.createdAt, 80),
    updatedAt: normalizeQueueText(candidate?.updatedAt, 80),
    generationStatus,
    generatedStory,
    generatedStoryId: normalizeQueueText(candidate?.generatedStoryId, 180),
    generatedAt: normalizeQueueText(candidate?.generatedAt, 80),
    generationError: normalizeQueueText(candidate?.generationError, 500),
    sourceStorySparkId: normalizeQueueText(candidate?.sourceStorySparkId, 180),
    sourceStorySparkTitle: normalizeQueueText(candidate?.sourceStorySparkTitle, 180),
    creatorId: normalizeQueueText(candidate?.creatorId, 180),
    creatorDisplayName: normalizeQueueText(candidate?.creatorDisplayName, 120),
    creatorHandle: normalizeQueueText(candidate?.creatorHandle, 80),
    creatorCreditLine: normalizeQueueText(candidate?.creatorCreditLine, 180),
    creatorKind: normalizeCreatorKind(candidate?.creatorKind),
    provenance: normalizeProvenance(candidate?.provenance),
    ipMarking: normalizeQueueText(candidate?.ipMarking, 180),
    sourceArchivePath: normalizeQueueText(candidate?.sourceArchivePath, 300),
    sourceArchiveTitle: normalizeQueueText(candidate?.sourceArchiveTitle, 180),
    tags: normalizeQueueTags(candidate?.tags)
  };
}

function normalizeGeneratedStory(value: unknown): GenerateStoryResponse | null {
  const candidate = value as Partial<GenerateStoryResponse> | null | undefined;
  return typeof candidate?.story === "string" && Boolean(candidate.metadata) ? candidate as GenerateStoryResponse : null;
}

function isReadyStoryQueueItem(item: ReadyStoryQueueItem): item is ReadyStoryQueueItem {
  return Boolean(
    item.id &&
      item.title &&
      item.premise &&
      item.world &&
      item.seed &&
      item.cast &&
      item.rules
  );
}

function createReadyStoryQueueItemId(title: string, createdAt: string): string {
  const slug = normalizeQueueText(title, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "story";
  const timestamp = normalizeQueueText(createdAt, 80).replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `ready-story-${slug}-${timestamp}`.slice(0, 180);
}

function normalizeQueueText(value: unknown, maxLength = 600): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}


function normalizeCreatorKind(value: unknown): StorySparkCreatorKind | undefined {
  return value === "founder" || value === "community" || value === "staff" || value === "system" ? value : undefined;
}

function normalizeProvenance(value: unknown): StorySparkProvenance | undefined {
  return value === "human-created" || value === "community-created" || value === "system-seeded" ? value : undefined;
}

function normalizeQueueTags(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const tags = value.map((tag) => normalizeQueueText(tag, 80)).filter(Boolean).slice(0, 20);
  return tags.length ? tags : undefined;
}
