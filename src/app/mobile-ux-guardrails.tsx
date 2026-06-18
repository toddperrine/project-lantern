"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];

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
    const nextLabel = getNavLabel(item) === "Cast" ? "Characters" : getNavLabel(item);
    item.dataset.mobileNavItem = nextLabel;
    byLabel.set(nextLabel, item);

    if (item.dataset.mobileRenderedLabel !== nextLabel) {
      item.textContent = nextLabel;
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

function markMoodRail() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("What are you in the mood"));
  if (!section) return;

  section.dataset.mobileMoodRail = "true";
  const rail = Array.from(section.querySelectorAll<HTMLElement>("div")).find((candidate) => candidate.querySelectorAll("button").length >= 4);
  if (rail) rail.dataset.mobileMoodRailTrack = "true";
}

function markStoryRows() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => cleanText(candidate.querySelector("h2")?.textContent ?? "") === "Start Something New");
  if (!section) return;

  section.dataset.mobileStoryRows = "true";
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
        normalizePrimaryNavs();
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
