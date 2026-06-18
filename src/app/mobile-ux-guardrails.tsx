"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const EXTRA_MOODS = ["Strange", "Hopeful", "Dark", "Reflective"];
const MOOD_ALIASES: Record<string, string> = {
  Strange: "Mystery",
  Hopeful: "Wonder",
  Dark: "Mystery",
  Reflective: "Emotional"
};
const STORY_ROW_COPY = [
  {
    title: "A Whisper in the Static",
    premise: "A radio host hears tomorrow's emergency broadcast in the silence between songs.",
    tags: ["Mystery", "Strange"]
  },
  {
    title: "Under Lantern Light",
    premise: "A keeper follows a warm signal through streets that only appear after rain.",
    tags: ["Wonder", "Hopeful"]
  },
  {
    title: "When the Stars Remember",
    premise: "A cartographer maps constellations that are slowly recovering lost names.",
    tags: ["Adventure", "Reflective"]
  }
];
const NAV_ICONS: Record<string, string> = {
  Home: "⌂",
  "Story Library": "▤",
  Characters: "◉",
  Worlds: "◎",
  Create: "+"
};

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function replaceCastLabels(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.textContent?.includes("Cast") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    node.textContent = node.textContent?.replace(/Characters\s*\/\s*Cast/g, "Characters").replace(/\bCast\b/g, "Characters") ?? "";
  });
}

function normalizeNav(nav: HTMLElement) {
  const row = nav.firstElementChild;
  if (!row) return;

  nav.dataset.mobileUx = "ready";
  const items = Array.from(row.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a, button"));
  const byLabel = new Map<string, HTMLAnchorElement | HTMLButtonElement>();

  items.forEach((item) => {
    const currentLabel = cleanText(item.textContent ?? "");
    const nextLabel = currentLabel === "Cast" ? "Characters" : currentLabel;
    byLabel.set(nextLabel, item);
    item.dataset.mobileNavItem = nextLabel;
    item.innerHTML = `<span aria-hidden="true" class="mobile-nav-icon">${NAV_ICONS[nextLabel] ?? "•"}</span><span class="mobile-nav-label">${nextLabel}</span>`;
  });

  const orderedItems = NAV_ORDER.map((label) => byLabel.get(label)).filter((item): item is HTMLAnchorElement | HTMLButtonElement => Boolean(item));
  const currentOrder = items.map((item) => item.dataset.mobileNavItem).join("|");
  const nextOrder = orderedItems.map((item) => item.dataset.mobileNavItem).join("|");

  if (currentOrder !== nextOrder || items.length !== orderedItems.length) {
    orderedItems.forEach((item) => row.appendChild(item));
  }
}

function normalizePrimaryNavs() {
  Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"], nav[aria-label="Project Lantern"]')).forEach(normalizeNav);
}

function findSectionByHeadingText(text: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>("section")).find((section) => cleanText(section.querySelector("h2")?.textContent ?? "") === text) ?? null;
}

function findHomeContentRoot(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[data-device-preview-content] main > section > div, main > section > div');
}

function ensureContinueReadingHero() {
  const root = findHomeContentRoot();
  if (!root || root.querySelector('[data-mobile-continue-reading="true"]')) return;
  const moodSection = Array.from(root.querySelectorAll<HTMLElement>("section")).find((section) => section.textContent?.includes("What are you in the mood"));
  if (!moodSection) return;

  const section = document.createElement("section");
  section.dataset.mobileContinueReading = "true";
  section.innerHTML = `
    <h2>Continue Reading</h2>
    <button type="button" class="mobile-continue-card" aria-label="Open recap for The Half-Life of Magic">
      <span class="mobile-continue-shade"></span>
      <span class="mobile-continue-copy">
        <strong>The Half-Life of Magic</strong>
        <span>Chapter 7 · The Drowned Clock</span>
        <small>7 min read</small>
      </span>
      <span class="mobile-recap-chip" aria-hidden="true">↻</span>
    </button>
  `;
  section.querySelector("button")?.addEventListener("click", openBestRecap);
  root.insertBefore(section, moodSection);
}

function openBestRecap() {
  const existingRecap = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => cleanText(button.textContent ?? "") === "Last Chapter Recap");
  if (existingRecap) {
    existingRecap.click();
    return;
  }

  document.getElementById("mobile-static-recap")?.remove();
  const panel = document.createElement("div");
  panel.id = "mobile-static-recap";
  panel.className = "mobile-static-recap";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.innerHTML = `
    <div class="mobile-static-recap-card">
      <div>
        <p>Last Chapter Recap</p>
        <h3>The Half-Life of Magic</h3>
      </div>
      <p>Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared, and old magic began waking again.</p>
      <button type="button">Close</button>
    </div>
  `;
  panel.querySelector("button")?.addEventListener("click", () => panel.remove());
  panel.addEventListener("click", (event) => {
    if (event.target === panel) panel.remove();
  });
  document.body.appendChild(panel);
}

function enhanceMoodRail() {
  const section = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("What are you in the mood"));
  if (!section) return;
  section.dataset.mobileMoodRail = "true";
  const heading = section.querySelector("h2");
  if (heading) heading.textContent = "What are you in the mood to read?";
  const rail = Array.from(section.querySelectorAll<HTMLElement>("div")).find((candidate) => candidate.querySelectorAll("button").length >= 4);
  if (!rail) return;
  rail.dataset.mobileMoodRailTrack = "true";
  const existingLabels = new Set(Array.from(rail.querySelectorAll("button")).map((button) => cleanText(button.textContent ?? "").split(" ")[0]));

  EXTRA_MOODS.forEach((mood) => {
    if (existingLabels.has(mood)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.extraMood = mood;
    button.innerHTML = `<span>${mood}</span>`;
    button.addEventListener("click", () => {
      const alias = MOOD_ALIASES[mood];
      const aliasButton = Array.from(rail.querySelectorAll<HTMLButtonElement>("button")).find((candidate) => cleanText(candidate.textContent ?? "").startsWith(alias));
      aliasButton?.click();
      rail.dataset.activeExtraMood = mood;
    });
    rail.appendChild(button);
  });
}

function normalizeStoryRows() {
  const section = findSectionByHeadingText("Start Something New");
  if (!section) return;
  section.dataset.mobileStoryRows = "true";
  const intro = section.querySelector("h2")?.parentElement?.querySelector("p");
  if (intro) intro.textContent = "";
  if (!section.querySelector('[data-mobile-see-all="true"]')) {
    const header = section.firstElementChild;
    const link = document.createElement("button");
    link.type = "button";
    link.dataset.mobileSeeAll = "true";
    link.textContent = "See all";
    link.addEventListener("click", () => document.querySelector<HTMLElement>('a[href="/?view=library"], button[data-mobile-nav-item="Story Library"]')?.click());
    header?.appendChild(link);
  }

  const articles = Array.from(section.querySelectorAll<HTMLElement>("article"));
  articles.slice(0, 3).forEach((article, index) => {
    const copy = STORY_ROW_COPY[index];
    article.dataset.mobileStoryRow = "true";
    const title = article.querySelector("h3");
    const premise = title?.nextElementSibling;
    if (title) title.textContent = copy.title;
    if (premise) premise.textContent = copy.premise;
    const tagRow = article.querySelector("div.flex");
    if (tagRow) tagRow.innerHTML = copy.tags.map((tag) => `<span>${tag}</span>`).join("");
  });
}

export function MobileUxGuardrails() {
  useEffect(() => {
    const apply = () => {
      normalizePrimaryNavs();
      replaceCastLabels(document.body);
      ensureContinueReadingHero();
      enhanceMoodRail();
      normalizeStoryRows();
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
