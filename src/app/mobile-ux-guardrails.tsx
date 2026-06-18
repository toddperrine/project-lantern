"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const EXTRA_MOODS = ["Strange", "Hopeful", "Dark", "Reflective"];
const NAV_ICONS: Record<string, string> = {
  Home: "H",
  "Story Library": "L",
  Characters: "C",
  Worlds: "W",
  Create: "+"
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getNavLabel(item: HTMLElement) {
  return item.dataset.mobileNavItem || cleanText(item.querySelector(".mobile-nav-label")?.textContent ?? item.textContent ?? "");
}

function normalizeNav(nav: HTMLElement) {
  const row = nav.firstElementChild;
  if (!row) return;

  nav.dataset.mobileUx = "ready";
  const items = Array.from(row.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a, button"));
  const byLabel = new Map<string, HTMLAnchorElement | HTMLButtonElement>();

  items.forEach((item) => {
    const rawLabel = getNavLabel(item);
    const nextLabel = rawLabel === "Cast" ? "Characters" : rawLabel;
    item.dataset.mobileNavItem = nextLabel;
    byLabel.set(nextLabel, item);

    if (item.dataset.mobileRenderedLabel !== nextLabel) {
      item.textContent = "";
      const icon = document.createElement("span");
      icon.className = "mobile-nav-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = NAV_ICONS[nextLabel] ?? nextLabel.slice(0, 1);

      const label = document.createElement("span");
      label.className = "mobile-nav-label";
      label.textContent = nextLabel;
      item.append(icon, label);
      item.dataset.mobileRenderedLabel = nextLabel;
    }
  });

  const orderedItems = NAV_ORDER.map((label) => byLabel.get(label)).filter((item): item is HTMLAnchorElement | HTMLButtonElement => Boolean(item));
  const currentOrder = items.map((item) => item.dataset.mobileNavItem).join("|");
  const nextOrder = orderedItems.map((item) => item.dataset.mobileNavItem).join("|");

  if (orderedItems.length && currentOrder !== nextOrder) {
    orderedItems.forEach((item) => row.appendChild(item));
  }
}

function normalizePrimaryNavs() {
  Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"], nav[aria-label="Project Lantern"]')).forEach(normalizeNav);
}

function ensureDemoHomeStory() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "home";
  if (view !== "home" || document.querySelector('[data-mobile-continue-reading="true"]')) return;

  const demoButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => cleanText(button.textContent ?? "") === "Load demo story");
  if (demoButton && !demoButton.disabled) demoButton.click();
}

function markContinueReading() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("Current Story / Next Chapter"));
  if (!section) return;

  section.dataset.mobileContinueReading = "true";
  const title = cleanText(section.querySelector("h2:not(.mobile-continue-heading)")?.textContent ?? "The Half-Life of Magic");

  let heading = section.querySelector<HTMLHeadingElement>(".mobile-continue-heading");
  if (!heading) {
    heading = document.createElement("h2");
    heading.className = "mobile-continue-heading";
    section.prepend(heading);
  }
  heading.textContent = "Continue Reading";

  let card = section.querySelector<HTMLDivElement>(".mobile-continue-card");
  if (!card) {
    card = document.createElement("div");
    card.className = "mobile-continue-card";
    section.appendChild(card);
  }

  let copy = card.querySelector<HTMLDivElement>(".mobile-continue-copy");
  if (!copy) {
    copy = document.createElement("div");
    copy.className = "mobile-continue-copy";
    card.appendChild(copy);
  }
  copy.innerHTML = "";

  const titleElement = document.createElement("strong");
  titleElement.textContent = title;
  const chapter = document.createElement("span");
  chapter.textContent = "Chapter 1";
  const time = document.createElement("small");
  time.textContent = "8 min read";
  copy.append(titleElement, chapter, time);

  let recapChip = card.querySelector<HTMLButtonElement>(".mobile-recap-chip");
  if (!recapChip) {
    recapChip = document.createElement("button");
    recapChip.className = "mobile-recap-chip";
    recapChip.type = "button";
    recapChip.setAttribute("aria-label", "Open last chapter recap");
    recapChip.textContent = "i";
    card.appendChild(recapChip);
  }

  const originalRecapButton = Array.from(section.querySelectorAll<HTMLButtonElement>("button")).find((button) => cleanText(button.textContent ?? "") === "Last Chapter Recap");
  recapChip.onclick = () => originalRecapButton?.click();
}

function markMoodRail() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("What are you in the mood"));
  if (!section) return;

  section.dataset.mobileMoodRail = "true";
  const heading = section.querySelector("h2");
  if (heading) heading.textContent = "What are you in the mood to read?";

  const rail = Array.from(section.querySelectorAll<HTMLElement>("div")).find((candidate) => candidate.querySelectorAll("button").length >= 4);
  if (!rail) return;

  rail.dataset.mobileMoodRailTrack = "true";
  const existingLabels = new Set(Array.from(rail.querySelectorAll("button")).map((button) => cleanText(button.textContent ?? "")));

  EXTRA_MOODS.forEach((mood) => {
    if (existingLabels.has(mood)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.extraMood = "true";
    button.setAttribute("aria-disabled", "true");
    const label = document.createElement("span");
    label.textContent = mood;
    button.appendChild(label);
    rail.appendChild(button);
  });
}

function markStoryRows() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => cleanText(candidate.querySelector("h2")?.textContent ?? "") === "Start Something New");
  if (!section) return;

  section.dataset.mobileStoryRows = "true";
  const action = section.querySelector<HTMLElement>("div:first-child > div + div");
  if (action) action.dataset.mobileDemoActions = "true";

  Array.from(section.querySelectorAll<HTMLElement>("article")).forEach((article) => {
    article.dataset.mobileStoryRow = "true";
  });
}

export function MobileUxGuardrails() {
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let animationFrameId = 0;

    const apply = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => {
        if (!mobileQuery.matches) return;
        ensureDemoHomeStory();
        normalizePrimaryNavs();
        markContinueReading();
        markMoodRail();
        markStoryRows();
      });
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    if (typeof mobileQuery.addEventListener === "function") {
      mobileQuery.addEventListener("change", apply);
    } else if (typeof mobileQuery.addListener === "function") {
      mobileQuery.addListener(apply);
    }

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      if (typeof mobileQuery.removeEventListener === "function") {
        mobileQuery.removeEventListener("change", apply);
      } else if (typeof mobileQuery.removeListener === "function") {
        mobileQuery.removeListener(apply);
      }
    };
  }, []);

  return null;
}
