import { useState } from "react";
import { getBloodwickFearArt } from "@/lib/bloodwick-fear-art";
import { STORY_TYPE_CHIPS, type StoryTypeChipId } from "@/lib/story-types";

export type FearMoodGridProps = {
  activeMood: StoryTypeChipId | null;
  isGenerating?: boolean;
  isNewStoryGenerating?: boolean;
  onRead?: () => void;
  onSelect: (mood: StoryTypeChipId) => void;
  heading?: string;
};

export function FearMoodGrid({
  heading = "What kind of fear are you in the mood for right now?",
  ...props
}: FearMoodGridProps) {
  const { activeMood, isGenerating = false, onRead, onSelect } = props;
  const [focusedMood, setFocusedMood] = useState<StoryTypeChipId | null>(null);
  const selectedChip = activeMood
    ? STORY_TYPE_CHIPS.find((chip) => chip.id === activeMood) ?? null
    : null;

  return (
    <section className="bloodwick-home-card min-w-0 rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-panel/70 p-4 shadow-bloodwick-soft sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-bloodwick-copper">
          Start something new
        </p>
        <h2 className="mt-2 text-2xl font-semibold leading-tight text-bloodwick-white">
          {heading}
        </h2>
      </div>
      <div className="bloodwick-home-fear-grid mt-4 sm:grid-cols-2 xl:grid-cols-3">
        {STORY_TYPE_CHIPS.map((chip) => {
          const isSelected = chip.id === activeMood;
          const tooltipId = `fear-help-${chip.id}`;
          const fearArt = getBloodwickFearArt(chip.label);
          return (
            <div className="relative min-w-0" key={chip.id}>
              <button
                aria-describedby={tooltipId}
                aria-pressed={isSelected}
                className="bloodwick-home-fear-button transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bloodwick-white"
                onBlur={() => setFocusedMood(null)}
                onClick={() => onSelect(chip.id)}
                onFocus={() => setFocusedMood(chip.id)}
                onMouseEnter={() => setFocusedMood(chip.id)}
                onMouseLeave={() => setFocusedMood(null)}
                type="button"
              >
                {fearArt.src ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className="bloodwick-home-fear-button-image"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={fearArt.src}
                  />
                ) : null}
                <span className="bloodwick-home-fear-button-overlay" aria-hidden="true" />
                <span className="bloodwick-home-fear-button-label">{chip.label}</span>
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
      {selectedChip ? (
        <div className="bloodwick-home-read-action">
          <button disabled={isGenerating} onClick={onRead} type="button">
            <svg
              aria-hidden="true"
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <path d="M12 7v14" />
              <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 1 3 18.5z" />
              <path d="M21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 0 21 18.5z" />
            </svg>
            <span>Read</span>
          </button>
        </div>
      ) : null}
      {selectedChip ? (
        <p className="mt-4 rounded-xl border border-bloodwick-white/10 bg-bloodwick-white/[0.06] p-3 text-sm leading-6 text-bloodwick-white/68 md:hidden">
          {selectedChip.guidance}
        </p>
      ) : null}
    </section>
  );
}
