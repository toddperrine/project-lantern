import type { ReactNode } from "react";

export type BloodwickHomeActionRailProps = {
  children: ReactNode;
};

export function BloodwickHomeActionRail({
  children,
}: BloodwickHomeActionRailProps) {
  return (
    <section
      className="bloodwick-action-rail"
      aria-label="Bloodwick home actions"
    >
      {children}
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
