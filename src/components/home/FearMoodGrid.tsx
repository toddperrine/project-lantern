import { STORY_TYPE_CHIPS, type StoryTypeChipId } from "@/lib/story-types";

export type FearMoodGridProps = {
  activeMood: StoryTypeChipId;
  onSelect: (mood: StoryTypeChipId) => void;
  heading?: string;
  helperText?: string;
};

export function FearMoodGrid({
  heading = "What kind of fear are you in the mood for?",
  helperText = "Choose the flavor of dread for your next story.",
  ...props
}: FearMoodGridProps) {
  const { activeMood, onSelect } = props;

  return (
    <section className="min-w-0 rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/70 p-5 shadow-bloodwick-soft sm:p-6">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloodwick-copper">
          Start Something New
        </p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-bloodwick-white">
          {heading}
        </h2>
        <p className="mt-2 text-sm leading-6 text-bloodwick-white/64">
          {helperText}
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STORY_TYPE_CHIPS.map((chip) => {
          const isSelected = chip.id === activeMood;
          return (
            <button
              aria-pressed={isSelected}
              className={`min-w-0 rounded-bloodwick-sm border px-4 py-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white ${isSelected ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white shadow-bloodwick-red" : "border-bloodwick-white/12 bg-bloodwick-white/[0.06] text-bloodwick-white hover:border-bloodwick-copper hover:bg-bloodwick-white/10"}`}
              key={chip.id}
              onClick={() => onSelect(chip.id)}
              type="button"
            >
              <span className="block text-base font-semibold">
                {chip.label}
              </span>
              <span
                className={`mt-2 block text-xs leading-5 ${isSelected ? "text-bloodwick-white/82" : "text-bloodwick-white/56"}`}
              >
                {chip.guidance}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
