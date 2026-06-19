"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const MOOD_ICON_PATHS: Record<string, string> = {
  Mystery: "/artwork/icons/moods/mystery.svg",
  Wonder: "/artwork/icons/moods/wonder.svg",
  Emotional: "/artwork/icons/moods/emotional.svg",
  Adventure: "/artwork/icons/moods/adventure.svg",
  Strange: "/artwork/icons/moods/strange.svg",
  Hopeful: "/artwork/icons/moods/hopeful.svg",
  Dark: "/artwork/icons/moods/dark.svg",
  Reflective: "/artwork/icons/moods/reflective.svg"
};
const NAV_ICON_PATHS: Record<string, string> = {
  Home: "/artwork/icons/nav/home.svg",
  "Story Library": "/artwork/icons/nav/story-library.svg",
  Characters: "/artwork/icons/nav/characters.svg",
  Worlds: "/artwork/icons/nav/worlds.svg",
  Create: "/artwork/icons/nav/create.svg"
};

export function HomeIconSystem() {
  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    let frame = 0;

    const scheduleApply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyHomeIconSystem(mobileQuery));
    };

    scheduleApply();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", scheduleApply);
    window.addEventListener("storage", scheduleApply);
    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", scheduleApply);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(scheduleApply);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", scheduleApply);
      window.removeEventListener("storage", scheduleApply);
      if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", scheduleApply);
      else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(scheduleApply);
    };
  }, []);

  return null;
}

function applyHomeIconSystem(mobileQuery: MediaQueryList) {
  if (!mobileQuery.matches) return;
  decorateMobileNav();
  decorateMoodCards();
  normalizeContinueCards();
}

function decorateMobileNav() {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.project-lantern-shell nav[aria-label="Mobile primary"] button'));
  buttons.forEach((button) => {
    const label = cleanText(button.textContent ?? "");
    const iconPath = NAV_ICON_PATHS[label];
    if (!iconPath || button.dataset.lanternIconReady === "true") return;
    button.dataset.lanternIconReady = "true";
    button.innerHTML = `<img src="${iconPath}" alt="" aria-hidden="true" data-lantern-nav-icon="true" /><span>${label}</span>`;
  });
}

function decorateMoodCards() {
  const moodButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".project-lantern-shell [data-mobile-fallback-mood]"));
  moodButtons.forEach((button) => {
    const mood = button.dataset.mobileFallbackMood || cleanText(button.textContent ?? "");
    const iconPath = MOOD_ICON_PATHS[mood];
    const iconSlot = button.querySelector<HTMLElement>("[data-mobile-mood-icon='true']");
    if (!iconPath || !iconSlot || iconSlot.dataset.lanternIconReady === "true") return;
    iconSlot.dataset.lanternIconReady = "true";
    iconSlot.innerHTML = `<img src="${iconPath}" alt="" aria-hidden="true" />`;
  });
}

function normalizeContinueCards() {
  const main = document.querySelector<HTMLElement>('.project-lantern-shell main[data-mobile-active-view="home"]');
  if (!main) return;
  const fallback = main.querySelector<HTMLElement>('[data-mobile-home-fallback="true"]');
  const header = main.querySelector<HTMLElement>(":scope > section > header:first-child");
  if (fallback && header && fallback.previousElementSibling !== header) header.insertAdjacentElement("afterend", fallback);

  Array.from(main.querySelectorAll<HTMLElement>('[data-mobile-continue-card="true"]')).forEach((card) => {
    if (card.dataset.mobileFallbackContinue === "true" || card.closest('[data-mobile-home-fallback="true"]')) return;
    card.remove();
  });
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}
