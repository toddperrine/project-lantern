export function ContinueEpisodeCard(props: {
  title: string;
  summary?: string;
  protagonistName?: string;
  genreLabel?: string;
  recapPreview?: string;
  protagonistRole?: string;
  protagonistStruggle?: string;
  direction: string;
  isDirectionOpen: boolean;
  isGenerating?: boolean;
  onDirectionChange: (value: string) => void;
  onNextChapter: () => void;
  onNextChapterWithInput: () => void;
  onLastChapterRecap: () => void;
  onExport: () => void;
  onSubmitDirection: () => void;
}) {
  const {
    direction,
    genreLabel,
    isDirectionOpen,
    isGenerating = false,
    onDirectionChange,
    onExport,
    onLastChapterRecap,
    onNextChapter,
    onNextChapterWithInput,
    onSubmitDirection,
    protagonistName,
    protagonistRole,
    protagonistStruggle,
    recapPreview,
    summary,
    title,
  } = props;
  const directionId = "continue-episode-direction";

  return (
    <section className="min-w-0 overflow-hidden rounded-bloodwick-lg border border-bloodwick-red/25 bg-bloodwick-obsidian/75 shadow-bloodwick-soft">
      <div className="grid min-w-0 gap-5 p-5 sm:p-6 lg:p-7">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloodwick-copper">
              Current Story / Next Chapter
            </p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-bloodwick-white md:text-5xl">
              {title}
            </h2>
            {summary ? (
              <p className="mt-4 max-w-3xl text-base leading-7 text-bloodwick-white/68">
                {summary}
              </p>
            ) : null}
          </div>
          {genreLabel ? (
            <span className="w-fit rounded-full border border-bloodwick-white/15 bg-bloodwick-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-bloodwick-white/70">
              {genreLabel}
            </span>
          ) : null}
        </div>

        <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 rounded-bloodwick-sm border border-bloodwick-white/10 bg-bloodwick-white/[0.06] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-bloodwick-copper">
              Last time recap preview
            </p>
            <p className="mt-2 text-sm leading-6 text-bloodwick-white/68">
              {recapPreview || summary}
            </p>
          </div>
          <div className="min-w-0 rounded-bloodwick-sm border border-bloodwick-red/20 bg-bloodwick-plum/55 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex size-12 shrink-0 items-center justify-center rounded-full border border-bloodwick-red/35 bg-bloodwick-red/10 text-sm font-semibold text-bloodwick-white"
                aria-hidden="true"
              >
                {getInitials(protagonistName || title)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-bloodwick-copper">
                  Hero / heroine
                </p>
                <p className="mt-1 text-lg font-semibold text-bloodwick-white">
                  {protagonistName || "Unknown"}
                </p>
                {protagonistRole ? (
                  <p className="mt-1 text-xs leading-5 text-bloodwick-white/55">
                    {protagonistRole}
                  </p>
                ) : null}
              </div>
            </div>
            {protagonistStruggle ? (
              <p className="mt-4 text-sm leading-6 text-bloodwick-white/70">
                {protagonistStruggle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            className="rounded-xl bg-bloodwick-red px-5 py-3 text-sm font-semibold text-bloodwick-white transition hover:bg-bloodwick-red/90 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            onClick={onNextChapter}
            type="button"
          >
            {isGenerating ? "Writing the next chapter…" : "Next Chapter"}
          </button>
          <button
            aria-controls={directionId}
            aria-expanded={isDirectionOpen}
            className="rounded-xl border border-bloodwick-copper/50 bg-bloodwick-copper/10 px-5 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper disabled:cursor-not-allowed disabled:opacity-55"
            disabled={isGenerating}
            onClick={onNextChapterWithInput}
            type="button"
          >
            Next Chapter with Input
          </button>
          <button
            className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-5 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper"
            onClick={onLastChapterRecap}
            type="button"
          >
            Last Chapter Recap
          </button>
          <button
            className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-5 py-3 text-sm font-semibold text-bloodwick-white transition hover:border-bloodwick-copper"
            onClick={onExport}
            type="button"
          >
            Export
          </button>
        </div>

        {isDirectionOpen ? (
          <div
            className="min-w-0 rounded-bloodwick-sm border border-bloodwick-copper/25 bg-bloodwick-white/[0.06] p-4"
            id={directionId}
          >
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-bloodwick-white">
                Optional direction
              </span>
              <textarea
                className="min-h-32 w-full rounded-xl border border-bloodwick-white/15 bg-bloodwick-obsidian px-3 py-2 text-sm leading-6 text-bloodwick-white outline-none focus:border-bloodwick-copper focus:ring-2 focus:ring-bloodwick-copper/20"
                onChange={(event) => onDirectionChange(event.target.value)}
                placeholder="A character to follow, a secret to press on, a feeling to deepen."
                value={direction}
              />
            </label>
            <button
              className="mt-3 rounded-xl bg-bloodwick-red px-4 py-2 text-sm font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isGenerating}
              onClick={onSubmitDirection}
              type="button"
            >
              Next Chapter with Input
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function getInitials(value: string): string {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "BW"
  );
}
