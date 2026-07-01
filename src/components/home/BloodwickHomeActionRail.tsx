"use client";

import {
  Children,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";

export type BloodwickHomeActionRailProps = {
  children: ReactNode;
};

const ACTION_PANEL_LABELS = [
  "Return to the Dread",
  "Light a New Wick",
  "Waiting in the Dark",
] as const;

export function BloodwickHomeActionRail({
  children,
}: BloodwickHomeActionRailProps) {
  const panels = Children.toArray(children).slice(0, ACTION_PANEL_LABELS.length);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToPanel = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    track.scrollTo({
      left: track.clientWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }, []);

  const handleScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const nextIndex = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    setActiveIndex(Math.min(Math.max(nextIndex, 0), panels.length - 1));
  }, [panels.length]);

  return (
    <section className="bloodwick-action-carousel" aria-label="Bloodwick home actions">
      <div
        className="bloodwick-action-carousel__track"
        onScroll={handleScroll}
        ref={trackRef}
      >
        {panels.map((panel, index) => (
          <div className="bloodwick-action-carousel__panel" key={ACTION_PANEL_LABELS[index]}>
            {panel}
          </div>
        ))}
      </div>
      <div className="bloodwick-action-carousel__dots" aria-label="Bloodwick home action panels">
        {panels.map((_, index) => (
          <button
            aria-current={activeIndex === index ? "true" : undefined}
            aria-label={`Show ${ACTION_PANEL_LABELS[index]}`}
            className="bloodwick-action-carousel__dot"
            key={ACTION_PANEL_LABELS[index]}
            onClick={() => scrollToPanel(index)}
            type="button"
          />
        ))}
      </div>
    </section>
  );
}

export type BloodwickHomeActionCardProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function BloodwickHomeActionCard({
  title,
  description,
  children,
}: BloodwickHomeActionCardProps) {
  return (
    <article className="bloodwick-action-card">
      <p className="bloodwick-action-card__eyebrow">{title}</p>
      <p className="bloodwick-action-card__description">{description}</p>
      {children}
    </article>
  );
}
