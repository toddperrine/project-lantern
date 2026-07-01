export function BloodwickHomeHero(props: {
  onStartNew: () => void;
  onContinueLatest?: () => void;
  hasLatestEpisode: boolean;
  isGenerating?: boolean;
  isNewStoryGenerating?: boolean;
}) {
  const {
    hasLatestEpisode,
    isGenerating = false,
    isNewStoryGenerating = false,
    onContinueLatest,
    onStartNew,
  } = props;

  return (
    <section className="relative isolate min-w-0 overflow-hidden rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/80 p-5 shadow-bloodwick-soft sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgba(229,9,20,0.18),transparent_34%),linear-gradient(135deg,rgba(36,18,31,0.95),rgba(11,11,13,0.92)_46%,rgba(11,11,13,1))]"
        aria-hidden="true"
      />
      <div
        className="absolute right-5 top-5 -z-10 size-28 rounded-full border border-bloodwick-red/20 bg-bloodwick-red/5 blur-sm"
        aria-hidden="true"
      />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bloodwick-red">
          Bloodwick
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-bloodwick-white sm:text-5xl lg:text-6xl">
          Living stories, ready when you are
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-bloodwick-white/72">
          Open the latest episode, remember what mattered, and choose what kind
          of story should find you next.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          className="min-h-12 rounded-xl bg-bloodwick-red px-5 py-3 text-base font-semibold text-bloodwick-white shadow-bloodwick-red transition hover:bg-bloodwick-red/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isGenerating}
          onClick={onStartNew}
          type="button"
        >
          {isNewStoryGenerating ? "Writing…" : "Start Something New"}
        </button>
        <button
          className="min-h-12 rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-5 py-3 text-base font-semibold text-bloodwick-white transition hover:border-bloodwick-copper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasLatestEpisode || isGenerating || !onContinueLatest}
          onClick={onContinueLatest}
          type="button"
        >
          Continue Latest Episode
        </button>
      </div>
    </section>
  );
}
