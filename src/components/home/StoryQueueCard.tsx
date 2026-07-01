import { getHomeFearLabel } from "@/lib/story-types";
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
  const storyTypeLabel = getHomeFearLabel(
    [
      item.mood,
      item.genre,
      item.title,
      item.premise,
      item.seed,
      item.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
  const blurb = truncateWords(item.premise, 12);

  return (
    <article className="grid min-w-0 gap-2 overflow-hidden rounded-bloodwick-sm border border-bloodwick-steel/30 bg-bloodwick-obsidian/80 p-2.5">
      <div className="min-w-0">
        <span className="inline-flex rounded-full border border-bloodwick-red/30 bg-bloodwick-red/10 px-3 py-1 text-xs font-semibold text-bloodwick-white">
          {storyTypeLabel}
        </span>
        <h3 className="mt-2 text-sm font-semibold leading-5 text-bloodwick-white">
          {item.title}
        </h3>
        {blurb ? (
          <p className="mt-1 text-xs leading-5 text-bloodwick-white/72">
            {blurb}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          className="rounded-lg bg-bloodwick-red px-2 py-1.5 text-xs font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isPreparing}
          onClick={() => onRead(item)}
          type="button"
        >
          {isPreparing ? "Preparing…" : "Read"}
        </button>
        <button
          className="rounded-lg border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-2 py-1.5 text-xs font-semibold text-bloodwick-white hover:border-bloodwick-copper"
          onClick={() => onPass(item)}
          type="button"
        >
          Pass
        </button>
        <button
          className="rounded-lg border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-2 py-1.5 text-xs font-semibold text-bloodwick-white hover:border-bloodwick-copper"
          onClick={() => onSaveForLater(item)}
          type="button"
        >
          Save for later
        </button>
      </div>
    </article>
  );
}

function truncateWords(
  value: string | undefined | null,
  maxWords = 20,
): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}
