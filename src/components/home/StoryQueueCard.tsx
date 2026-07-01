import { getStoryTypeChipLabel } from "@/lib/story-types";
import type { ReadyStoryQueueItem } from "@/lib/ready-story-queue";

export type StoryQueueCardProps = {
  item: ReadyStoryQueueItem;
  onRead: (item: ReadyStoryQueueItem) => void;
  onPass: (item: ReadyStoryQueueItem) => void;
  onSaveForLater: (item: ReadyStoryQueueItem) => void;
};

export function StoryQueueCard(props: StoryQueueCardProps) {
  const { item, onPass, onRead, onSaveForLater } = props;
  const isPreparing = item.generationStatus === "generating";
  const sourceLabel = getBloodwickSourceLabel(item);
  const storyTypeLabel =
    getStoryTypeChipLabel(item.mood) ?? getStoryTypeChipLabel(item.genre);
  const blurb = truncateWords(item.premise, 20);

  return (
    <article className="grid min-w-0 gap-4 overflow-hidden rounded-bloodwick border border-bloodwick-white/10 bg-bloodwick-obsidian/70 p-4 shadow-bloodwick-soft md:grid-cols-[minmax(0,1fr)_220px] sm:p-5">
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          {storyTypeLabel ? (
            <span className="rounded-full border border-bloodwick-red/30 bg-bloodwick-red/10 px-3 py-1 text-xs font-semibold text-bloodwick-white/78">
              {storyTypeLabel}
            </span>
          ) : null}
          {sourceLabel ? (
            <span className="rounded-full border border-bloodwick-copper/30 bg-bloodwick-copper/10 px-3 py-1 text-xs font-semibold text-bloodwick-copper">
              {sourceLabel}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-bloodwick-white">
          {item.title}
        </h3>
        {blurb ? (
          <p className="mt-2 text-sm leading-6 text-bloodwick-white/66">
            {blurb}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-2">
        <button
          className="rounded-xl bg-bloodwick-red px-3 py-2 text-sm font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPreparing}
          onClick={() => onRead(item)}
          type="button"
        >
          {isPreparing ? "Preparing…" : "Read"}
        </button>
        <button
          className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-3 py-2 text-sm font-semibold text-bloodwick-white hover:border-bloodwick-copper"
          onClick={() => onPass(item)}
          type="button"
        >
          Pass
        </button>
        <button
          className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-3 py-2 text-sm font-semibold text-bloodwick-white hover:border-bloodwick-copper"
          onClick={() => onSaveForLater(item)}
          type="button"
        >
          Save for later
        </button>
      </div>
    </article>
  );
}

function truncateWords(value: string | undefined | null, maxWords = 20): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function getBloodwickSourceLabel(item: ReadyStoryQueueItem): string {
  const ownedKind =
    item.creatorKind === "founder" ||
    item.creatorKind === "staff" ||
    item.creatorKind === "system";
  const ownedProvenance =
    item.provenance === "system-seeded" || item.provenance === "human-created";
  const explicitBloodwick = /bloodwick/i.test(
    [
      item.creatorCreditLine,
      item.creatorDisplayName,
      item.sourceArchiveTitle,
      item.sourceStorySparkTitle,
      item.ipMarking,
    ]
      .filter(Boolean)
      .join(" "),
  );
  return ownedKind || ownedProvenance || explicitBloodwick
    ? "BLOODWICK ORIGINAL"
    : "";
}
