import {
  formatReadyStoryCreatorCredit,
  type ReadyStoryQueueItem,
} from "@/lib/ready-story-queue";

export type StoryQueueCardProps = {
  item: ReadyStoryQueueItem;
  onRead: (item: ReadyStoryQueueItem) => void;
  onPass: (item: ReadyStoryQueueItem) => void;
  onSaveForLater: (item: ReadyStoryQueueItem) => void;
};

export function StoryQueueCard(props: StoryQueueCardProps) {
  const { item, onPass, onRead, onSaveForLater } = props;
  const isPreparing = item.generationStatus === "generating";
  const isReady = item.generationStatus === "ready" && item.generatedStory;
  const statusLabel = isReady
    ? "Ready to read"
    : isPreparing
      ? "Preparing story…"
      : item.generationStatus === "failed"
        ? "Preparation failed — Read can try again"
        : "Queued";
  const sourceLabel = getBloodwickSourceLabel(item);

  return (
    <article className="grid min-w-0 overflow-hidden rounded-bloodwick border border-bloodwick-white/10 bg-bloodwick-obsidian/70 shadow-bloodwick-soft md:grid-cols-[minmax(0,1fr)_180px]">
      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-bloodwick-red/30 bg-bloodwick-red/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-bloodwick-white/78">
            {item.mood || item.genre}
          </span>
          <span className="rounded-full border border-bloodwick-white/12 bg-bloodwick-white/[0.06] px-3 py-1 text-xs font-semibold text-bloodwick-white/60">
            {statusLabel}
          </span>
          {sourceLabel ? (
            <span className="rounded-full border border-bloodwick-copper/30 bg-bloodwick-copper/10 px-3 py-1 text-xs font-semibold text-bloodwick-copper">
              {sourceLabel}
            </span>
          ) : null}
        </div>
        <h3 className="mt-3 text-2xl font-semibold leading-tight text-bloodwick-white">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-bloodwick-white/66">
          {item.premise}
        </p>
        <p className="mt-3 text-xs font-semibold text-bloodwick-copper/90">
          {formatReadyStoryCreatorCredit(item)}
        </p>
        <p className="mt-2 text-xs text-bloodwick-white/45">
          {[item.heroName, item.heroRole, item.worldName]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <div className="flex flex-col justify-center gap-2 border-t border-bloodwick-white/10 bg-bloodwick-white/[0.04] p-4 md:border-l md:border-t-0">
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
