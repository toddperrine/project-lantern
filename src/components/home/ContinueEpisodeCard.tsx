export type ContinueEpisodeCardProps = {
  title: string;
  seriesTitle: string;
  hook: string;
  recap: string;
  storyTypeLabel: string;
  isGenerating: boolean;
  isRecapOpen: boolean;
  onContinue: (direction?: string) => void;
  onOpenRecap: () => void;
  onCloseRecap: () => void;
  onExport: () => void;
};

export function ContinueEpisodeCard(props: ContinueEpisodeCardProps) {
  const {
    hook,
    seriesTitle,
    isGenerating,
    isRecapOpen,
    onCloseRecap,
    onContinue,
    onExport,
    onOpenRecap,
    recap,
    storyTypeLabel,
    title,
  } = props;
  const recapId = "last-time-recap-dialog";
  const shouldShowTitle = !isSameDisplayText(title, seriesTitle);
  const excerpt = buildContinueExcerpt(hook, recap);

  return (
    <section className="bloodwick-home-card bloodwick-continue-card flex h-full min-w-0 flex-col overflow-hidden rounded-bloodwick-lg border border-bloodwick-red/25 bg-bloodwick-obsidian/75 shadow-bloodwick-soft">
      <div className="flex h-full min-w-0 flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold leading-tight text-bloodwick-white">
            <span className="text-bloodwick-copper">Continue:</span>{" "}
            <span>{seriesTitle}</span>
          </h2>
          <span className="mt-3 inline-flex rounded-full border border-bloodwick-red/30 bg-bloodwick-red/10 px-3 py-1 text-xs font-semibold text-bloodwick-white/78">
            {storyTypeLabel}
          </span>
          {shouldShowTitle ? (
            <p className="mt-3 text-sm font-semibold text-bloodwick-white/78">
              {title}
            </p>
          ) : null}
          <p className="mt-3 line-clamp-[8] text-sm leading-6 text-bloodwick-white/72 md:line-clamp-[10]">
            {excerpt}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            className="inline-flex min-h-11 items-center justify-center gap-[0.45rem] rounded-xl bg-bloodwick-red px-2.5 py-2.5 text-sm font-semibold text-bloodwick-white transition hover:bg-bloodwick-red/90 disabled:cursor-not-allowed disabled:opacity-55 sm:px-3"
            disabled={isGenerating}
            onClick={() => onContinue()}
            type="button"
          >
            <ReadIcon />
            <span>{isGenerating ? "Writing…" : "Read"}</span>
          </button>
          <button
            aria-controls={recapId}
            aria-expanded={isRecapOpen}
            className="inline-flex min-h-11 items-center justify-center gap-[0.45rem] rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-2.5 py-2.5 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper sm:px-3"
            onClick={onOpenRecap}
            type="button"
          >
            <RecapIcon />
            <span>Recap</span>
          </button>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-[0.45rem] rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-2.5 py-2.5 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper sm:px-3"
            onClick={onExport}
            type="button"
          >
            <ExportIcon />
            <span>Export</span>
          </button>
        </div>

        {isRecapOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
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
                  className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-3 py-2 text-sm font-semibold text-bloodwick-white"
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
    </section>
  );
}

function buildContinueExcerpt(hook: string, recap: string): string {
  if (!recap.trim()) return hook;
  if (!hook.trim()) return recap;
  if (isSameDisplayText(hook, recap) || normalizeDisplayText(recap).startsWith(normalizeDisplayText(hook))) {
    return recap;
  }

  return `${hook} ${recap}`;
}

function isSameDisplayText(left: string, right: string): boolean {
  return normalizeDisplayText(left) === normalizeDisplayText(right);
}

function normalizeDisplayText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function ReadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 7v14" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 1 3 18.5z" />
      <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 0 21 18.5z" />
    </svg>
  );
}

function RecapIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 15v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}
