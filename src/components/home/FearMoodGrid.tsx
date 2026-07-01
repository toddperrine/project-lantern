import { useState } from "react";
import { STORY_TYPE_CHIPS, type StoryTypeChipId } from "@/lib/story-types";

export type FearMoodGridProps = {
  activeMood: StoryTypeChipId;
  onSelect: (mood: StoryTypeChipId) => void;
  heading?: string;
};

export function FearMoodGrid({
  heading = "What kind of fear are you in the mood for right now?",
  ...props
}: FearMoodGridProps) {
  const { activeMood, onSelect } = props;
  const [focusedMood, setFocusedMood] = useState<StoryTypeChipId | null>(null);
  const selectedChip = STORY_TYPE_CHIPS.find((chip) => chip.id === activeMood) ?? STORY_TYPE_CHIPS[0];

  return (
    <section className="min-w-0 rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/70 p-4 shadow-bloodwick-soft sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloodwick-copper">
          Start something new
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-bloodwick-white">
          {heading}
        </h2>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {STORY_TYPE_CHIPS.map((chip) => {
          const isSelected = chip.id === activeMood;
          const tooltipId = `fear-help-${chip.id}`;
          return (
            <div className="relative min-w-0" key={chip.id}>
              <button
                aria-describedby={tooltipId}
                aria-pressed={isSelected}
                className={`min-h-12 w-full min-w-0 rounded-xl border px-3 py-2 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white ${isSelected ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white shadow-bloodwick-red" : "border-bloodwick-white/12 bg-bloodwick-white/[0.06] text-bloodwick-white hover:border-bloodwick-copper hover:bg-bloodwick-white/10"}`}
                onBlur={() => setFocusedMood(null)}
                onClick={() => onSelect(chip.id)}
                onFocus={() => setFocusedMood(chip.id)}
                onMouseEnter={() => setFocusedMood(chip.id)}
                onMouseLeave={() => setFocusedMood(null)}
                type="button"
              >
                <span className="block text-sm font-semibold leading-5">
                  {chip.label}
                </span>
              </button>
              <div
                className={`pointer-events-none absolute left-0 top-[calc(100%+0.5rem)] z-20 hidden w-64 rounded-xl border border-bloodwick-copper/30 bg-bloodwick-obsidian p-3 text-xs leading-5 text-bloodwick-white/72 shadow-bloodwick-soft md:block ${focusedMood === chip.id ? "opacity-100" : "opacity-0"}`}
                id={tooltipId}
                role="tooltip"
              >
                {chip.guidance}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 rounded-xl border border-bloodwick-white/10 bg-bloodwick-white/[0.06] p-3 text-sm leading-6 text-bloodwick-white/68 md:hidden">
        {selectedChip.guidance}
      </p>
    </section>
  );
}
