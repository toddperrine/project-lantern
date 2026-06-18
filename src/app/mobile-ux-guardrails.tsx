"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const NAV_ICONS: Record<string, string> = { Home: "H", "Story Library": "S", Characters: "C", Worlds: "W", Create: "+" };
const START_ART_BY_TITLE: Record<string, string> = {
  "The Lighthouse Under Main Street": "lighthouse",
  "Orchard of Borrowed Moons": "moons",
  "The Quiet Engine": "engine",
  "Map of the Seventh Door": "door"
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function canonicalLabel(label: string) {
  if (label === "Cast" || label === "Characters/Cast") return "Characters";
  return label;
}

function getNavLabel(item: HTMLElement) {
  return canonicalLabel(item.dataset.mobileNavItem || cleanText(item.querySelector(".mobile-nav-label")?.textContent ?? item.textContent ?? ""));
}

function normalizeNav(nav: HTMLElement) {
  const row = nav.firstElementChild;
  if (!row) return;
  nav.dataset.mobileUx = "ready";

  const items = Array.from(row.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a, button"));
  const byLabel = new Map<string, HTMLAnchorElement | HTMLButtonElement>();

  items.forEach((item) => {
    const nextLabel = getNavLabel(item);
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

  NAV_ORDER.map((label) => byLabel.get(label)).filter((item): item is HTMLAnchorElement | HTMLButtonElement => Boolean(item)).forEach((item) => row.appendChild(item));
}

function normalizePrimaryNavs() {
  Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Project Lantern"]')).forEach(normalizeNav);
}

function clickButton(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => cleanText(item.textContent ?? "") === label);
  button?.click();
}

function ensureDemoHomeStory() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "home";
  if (view !== "home" || document.querySelector('[data-mobile-continue-reading="true"]')) return;
  clickButton("Demo");
  clickButton("Load demo story");
}

function markMobileHomeSections() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "home";
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return;

  if (view !== "home") {
    delete main.dataset.mobileReferenceHome;
    return;
  }

  main.dataset.mobileReferenceHome = "true";

  const sections = Array.from(main.querySelectorAll<HTMLElement>("section"));
  const current = sections.find((candidate) => candidate.textContent?.includes("Continue Reading") && candidate.textContent?.includes("Next Chapter"));
  if (current) current.dataset.mobileContinueReading = "true";

  const mood = sections.find((candidate) => candidate.textContent?.includes("What are you in the mood"));
  if (mood) {
    mood.dataset.mobileMoodRail = "true";
    const track = mood.querySelector<HTMLElement>(":scope > div");
    if (track) track.dataset.mobileMoodRailTrack = "true";
  }

  const starts = sections.find((candidate) => cleanText(candidate.querySelector("h2")?.textContent ?? "") === "Start Something New");
  if (!starts) return;
  starts.dataset.mobileStoryRows = "true";
  starts.querySelector<HTMLElement>(":scope > div:last-child")?.setAttribute("data-mobile-story-list", "true");
  Array.from(starts.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    const title = cleanText(button.querySelector("h3")?.textContent ?? "");
    if (!title) return;
    button.dataset.mobileStoryRow = "true";
    button.dataset.mobileStartArt = START_ART_BY_TITLE[title] ?? "lighthouse";
  });
}

function applyMobileReference(mobileQuery: MediaQueryList) {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!mobileQuery.matches) {
    if (main) delete main.dataset.mobileReferenceHome;
    return;
  }

  ensureDemoHomeStory();
  normalizePrimaryNavs();
  markMobileHomeSections();
}

export function MobileUxGuardrails() {
  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    let animationFrameId = 0;
    const apply = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => applyMobileReference(mobileQuery));
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });

    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", apply);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(apply);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
      if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", apply);
      else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(apply);
    };
  }, []);

  return null;
}
