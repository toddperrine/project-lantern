import { STORY_TYPE_CHIPS, getStoryTypeStartCopy } from "@/lib/story-types";

export function FearMoodGrid(props: {
  options: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  selectedId: string;
  onSelect: (id: string) => void;
  onStart: () => void;
  isGenerating?: boolean;
  canUseDemoStory?: boolean;
  hasDemoStory?: boolean;
  onClearDemoStory?: () => void;
  onLoadDemoStory?: () => void;
}) {
  const {
    canUseDemoStory = false,
    hasDemoStory = false,
    isGenerating = false,
    onClearDemoStory,
    onLoadDemoStory,
    onSelect,
    onStart,
    options,
    selectedId,
  } = props;
  const selected =
    options.find((option) => option.id === selectedId) ?? options[0];
  const startCopy = getStoryTypeStartCopy(selected?.title);

  return (
    <section className="min-w-0 rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/70 p-5 shadow-bloodwick-soft sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloodwick-copper">
          Start Something New
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-bloodwick-white">
          What kind of fear are you in the mood for?
        </h2>
        <p className="mt-2 text-sm leading-6 text-bloodwick-white/64">
          Choose the flavor of dread for your next story.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const isSelected = option.id === selectedId;
          return (
            <button
              aria-pressed={isSelected}
              className={`min-w-0 rounded-bloodwick-sm border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white ${isSelected ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white shadow-bloodwick-red" : "border-bloodwick-white/12 bg-bloodwick-white/[0.06] text-bloodwick-white hover:border-bloodwick-copper hover:bg-bloodwick-white/10"}`}
              key={option.id}
              onClick={() => onSelect(option.id)}
              type="button"
            >
              <span className="block text-base font-semibold">
                {option.title}
              </span>
              <span
                className={`mt-2 block text-xs leading-5 ${isSelected ? "text-bloodwick-white/82" : "text-bloodwick-white/56"}`}
              >
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-bloodwick-sm border border-bloodwick-copper/25 bg-bloodwick-white/[0.05] p-4">
        <h3 className="text-2xl font-semibold text-bloodwick-white">
          Let Bloodwick find your next story.
        </h3>
        <p className="mt-2 text-sm leading-6 text-bloodwick-white/64">
          Bloodwick will use this to shape the next story.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            className="rounded-xl bg-bloodwick-red px-5 py-3 text-sm font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isGenerating}
            onClick={onStart}
            type="button"
          >
            {isGenerating ? startCopy.loading : startCopy.button}
          </button>
          {canUseDemoStory && onClearDemoStory && onLoadDemoStory ? (
            hasDemoStory ? (
              <button
                className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-4 py-3 text-sm font-semibold text-bloodwick-white"
                onClick={onClearDemoStory}
                type="button"
              >
                Clear demo story
              </button>
            ) : (
              <button
                className="rounded-xl border border-bloodwick-white/15 bg-bloodwick-white/10 px-4 py-3 text-sm font-semibold text-bloodwick-white"
                onClick={onLoadDemoStory}
                type="button"
              >
                Load demo story
              </button>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function storyTypeChipOptions(): Array<{
  id: string;
  title: string;
  description: string;
}> {
  return STORY_TYPE_CHIPS.map((chip) => ({
    id: chip.id,
    title: chip.label,
    description: chip.guidance,
  }));
}
