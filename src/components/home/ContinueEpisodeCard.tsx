export type ContinueEpisodeCardProps = {
  seriesTitle: string;
  hook: string;
  recap: string;
  storyTypeLabel: string;
  direction: string;
  isDirectionOpen: boolean;
  isGenerating: boolean;
  isRecapOpen: boolean;
  onToggleDirection: () => void;
  onDirectionChange: (value: string) => void;
  onContinue: (direction?: string) => void;
  onOpenRecap: () => void;
  onCloseRecap: () => void;
  onExport: () => void;
};

export function ContinueEpisodeCard(props: ContinueEpisodeCardProps) {
  const {
    direction,
    hook,
    seriesTitle,
    isDirectionOpen,
    isGenerating,
    isRecapOpen,
    onCloseRecap,
    onContinue,
    onDirectionChange,
    onExport,
    onOpenRecap,
    onToggleDirection,
    recap,
    storyTypeLabel,
  } = props;
  const directionId = "continue-episode-direction-dialog";
  const recapId = "last-time-recap-dialog";
  const teaser = truncateWords(hook, 30);

  return (
    <article className="bloodwick-action-card">
      <div className="flex h-full min-w-0 flex-col gap-3">
        <div className="min-w-0">
          <p className="bloodwick-action-card__eyebrow">Return to the Dread</p>
          <p className="bloodwick-action-card__description">
            Pick up where the last episode left its mark.
          </p>
          <p className="mt-3 text-sm font-semibold text-bloodwick-white/72">
            {seriesTitle}
          </p>
          <span className="mt-3 inline-flex rounded-full border border-bloodwick-red/30 bg-bloodwick-red/10 px-3 py-1 text-xs font-semibold text-bloodwick-white">
            {storyTypeLabel}
          </span>
          <p className="mt-3 max-h-24 overflow-hidden text-sm leading-6 text-bloodwick-white/72">
            {teaser}
          </p>
        </div>

        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <button
            className="rounded-xl bg-bloodwick-red px-4 py-3 text-sm font-semibold text-bloodwick-white transition hover:bg-bloodwick-red/90 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            onClick={() => onContinue()}
            type="button"
          >
            {isGenerating ? "Writing the next chapter…" : "Read"}
          </button>
          <button
            aria-controls={recapId}
            aria-expanded={isRecapOpen}
            className="rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-4 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper"
            onClick={onOpenRecap}
            type="button"
          >
            Recap
          </button>
          <button
            aria-controls={directionId}
            aria-expanded={isDirectionOpen}
            className="rounded-xl border border-bloodwick-copper/50 bg-bloodwick-obsidian/60 px-4 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            onClick={onToggleDirection}
            type="button"
          >
            Next Chapter with Input
          </button>
          <button
            className="rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-4 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper"
            onClick={onExport}
            type="button"
          >
            Export
          </button>
        </div>

        {isDirectionOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[rgb(var(--bloodwick-obsidian-rgb)/0.82)] p-4">
            <div
              aria-modal="true"
              className="max-h-[82vh] w-full max-w-xl overflow-auto rounded-bloodwick-lg border border-bloodwick-white/15 bg-bloodwick-obsidian p-5 shadow-bloodwick-soft"
              id={directionId}
              role="dialog"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold text-bloodwick-white">
                  Guide the next chapter
                </h3>
                <button
                  className="rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-3 py-2 text-sm font-semibold text-bloodwick-white"
                  onClick={onToggleDirection}
                  type="button"
                >
                  Cancel
                </button>
              </div>
              <label className="mt-4 flex flex-col gap-2">
                <span className="text-sm font-semibold text-bloodwick-white">
                  Direction/input
                </span>
                <textarea
                  className="min-h-36 w-full rounded-xl border border-bloodwick-white/15 bg-bloodwick-obsidian px-3 py-2 text-sm leading-6 text-bloodwick-white outline-none focus:border-bloodwick-copper focus:ring-2 focus:ring-bloodwick-copper/20"
                  onChange={(event) => onDirectionChange(event.target.value)}
                  placeholder="A character to follow, a secret to press on, a feeling to deepen."
                  value={direction}
                />
              </label>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  className="rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-4 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper"
                  onClick={onToggleDirection}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-bloodwick-red px-4 py-3 text-sm font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={isGenerating}
                  onClick={() => {
                    onToggleDirection();
                    onContinue(direction);
                  }}
                  type="button"
                >
                  Continue with input
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {isRecapOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[rgb(var(--bloodwick-obsidian-rgb)/0.82)] p-4">
            <div
              aria-modal="true"
              className="max-h-[82vh] w-full max-w-xl overflow-auto rounded-bloodwick-lg border border-bloodwick-white/15 bg-bloodwick-obsidian p-5 shadow-bloodwick-soft"
              id={recapId}
              role="dialog"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold text-bloodwick-white">
                  Last time
                </h3>
                <button
                  className="rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/60 px-3 py-2 text-sm font-semibold text-bloodwick-white"
                  onClick={onCloseRecap}
                  type="button"
                >
                  Close
                </button>
              </div>
              <p className="mt-4 text-sm leading-6 text-bloodwick-white/72">
                {recap}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function truncateWords(
  value: string | undefined | null,
  maxWords: number,
): string {
  if (!value) return "";
  const words = value.trim().split(/\s+/);
  if (words.length <= maxWords) return value.trim();
  return `${words.slice(0, maxWords).join(" ")}…`;
}
