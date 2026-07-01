import { useState } from "react";
import { STORY_TYPE_CHIPS, type StoryTypeChipId } from "@/lib/story-types";

export type FearMoodGridProps = {
  activeMood: StoryTypeChipId;
  onSelect: (mood: StoryTypeChipId) => void;
  heading?: string;
  isGenerating?: boolean;
  isNewStoryGenerating?: boolean;
  onStartNewStory: () => void;
};

export function FearMoodGrid({
  heading = "What kind of fear are you in the mood for right now?",
  ...props
}: FearMoodGridProps) {
  const {
    activeMood,
    isGenerating = false,
    isNewStoryGenerating = false,
    onSelect,
    onStartNewStory,
  } = props;
  const [focusedMood, setFocusedMood] = useState<StoryTypeChipId | null>(null);
  const selectedChip =
    STORY_TYPE_CHIPS.find((chip) => chip.id === activeMood) ??
    STORY_TYPE_CHIPS[0];

  return (
    <article className="bloodwick-action-card">
      <div>
        <p className="bloodwick-action-card__eyebrow">Light a New Wick</p>
        <p className="bloodwick-action-card__description">
          Choose a fear and start a new series.
        </p>
        <h2 className="mt-3 text-sm font-semibold leading-5 text-bloodwick-white">
          {heading}
        </h2>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {STORY_TYPE_CHIPS.map((chip) => {
          const isSelected = chip.id === activeMood;
          const tooltipId = `fear-help-${chip.id}`;
          return (
            <div className="relative min-w-0" key={chip.id}>
              <button
                aria-describedby={tooltipId}
                aria-pressed={isSelected}
                className={`min-h-9 w-full min-w-0 rounded-lg border px-2 py-1.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white ${isSelected ? "border-bloodwick-red bg-bloodwick-red text-bloodwick-white shadow-bloodwick-red" : "border-bloodwick-steel/40 bg-bloodwick-obsidian/60 text-bloodwick-white hover:border-bloodwick-copper hover:bg-bloodwick-obsidian/80"}`}
                onBlur={() => setFocusedMood(null)}
                onClick={() => onSelect(chip.id)}
                onFocus={() => setFocusedMood(chip.id)}
                onMouseEnter={() => setFocusedMood(chip.id)}
                onMouseLeave={() => setFocusedMood(null)}
                type="button"
              >
                <span className="block text-xs font-semibold leading-4">
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
      <p className="mt-3 max-h-16 overflow-hidden rounded-xl border border-bloodwick-steel/40 bg-bloodwick-obsidian/70 p-2 text-xs leading-5 text-bloodwick-white/68 md:hidden">
        {selectedChip.guidance}
      </p>
      <button
        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-bloodwick-red px-4 py-3 text-sm font-semibold text-bloodwick-white disabled:cursor-not-allowed disabled:opacity-55"
        disabled={isGenerating}
        onClick={onStartNewStory}
        type="button"
      >
        {isNewStoryGenerating ? (
          <span
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-bloodwick-obsidian/30 border-t-bloodwick-obsidian"
            aria-hidden="true"
          />
        ) : null}
        {isNewStoryGenerating
          ? `Writing a ${selectedChip.label} story for you…`
          : `Start ${selectedChip.label} Story`}
      </button>
    </article>
  );
}
