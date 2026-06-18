"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Characters\s*\/\s*Cast/g, "Characters"],
  [/\bCAST\b/g, "CHARACTERS"],
  [/\bCast\b/g, "Characters"],
  [/\bcast\b/g, "characters"],
  [/world, characters, spark/g, "world, characters, story idea"],
  [/Story Spark/g, "Story Idea"],
  [/-cast\.txt/g, "-characters.txt"]
];
const TEXT_SKIP_SELECTOR = "script, style, textarea, input";
const ART_BY_TITLE: Record<string, string> = {
  "The Half-Life of Magic": "half-life-of-magic",
  "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago": "half-life-of-magic",
  "The Lighthouse Under Main Street": "under-lantern-light",
  "Orchard of Borrowed Moons": "orchard-of-borrowed-moons",
  "The Quiet Engine": "quiet-engine",
  "Map of the Seventh Door": "stars-remember",
  "Whisper in the Static": "whisper-in-the-static",
  "Under Lantern Light": "under-lantern-light",
  "Stars Remember": "stars-remember"
};
const FALLBACK_ART_SEQUENCE = ["whisper-in-the-static", "under-lantern-light", "stars-remember", "orchard-of-borrowed-moons", "quiet-engine"];

function currentView() {
  return new URLSearchParams(window.location.search).get("view") ?? "home";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function replaceText(value: string) {
  return TEXT_REPLACEMENTS.reduce((nextValue, [pattern, replacement]) => nextValue.replace(pattern, replacement), value);
}

function shouldSkipTextNode(node: Text) {
  return Boolean(node.parentElement?.closest(TEXT_SKIP_SELECTOR));
}

function artKeyForTitle(title: string, index = 0) {
  const normalizedTitle = cleanText(title).replace(/[.!?]$/, "");
  return ART_BY_TITLE[normalizedTitle] ?? FALLBACK_ART_SEQUENCE[index % FALLBACK_ART_SEQUENCE.length];
}

function normalizeTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    if (shouldSkipTextNode(node)) return;
    const nextValue = replaceText(node.nodeValue ?? "");
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  });
}

function normalizeAttributes(root: ParentNode) {
  Array.from(root.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]")).forEach((element) => {
    ["aria-label", "placeholder", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const nextValue = replaceText(value);
      if (nextValue !== value) element.setAttribute(attribute, nextValue);
    });
  });
}

function normalizeMobileNav() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Mobile primary"]');
  const row = nav?.firstElementChild;
  if (!nav || !row) return;

  nav.dataset.mobileShellReady = "true";
  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button"));
  const byLabel = new Map<string, HTMLButtonElement>();

  buttons.forEach((button) => {
    const label = replaceText(cleanText(button.textContent ?? ""));
    button.textContent = label;
    byLabel.set(label, button);
  });

  NAV_ORDER.map((label) => byLabel.get(label)).filter((button): button is HTMLButtonElement => Boolean(button)).forEach((button) => row.appendChild(button));
}

function markActiveMobileView() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return;
  main.dataset.mobileActiveView = currentView();
}

function hideDemoMessages() {
  Array.from(document.querySelectorAll<HTMLElement>(".project-lantern-shell main > section > div")).forEach((element) => {
    const text = cleanText(element.textContent ?? "");
    const isDemoStatus = /Demo story|Demo Story|demo story/.test(text);
    if (isDemoStatus) element.dataset.mobileHiddenStatus = "true";
    else delete element.dataset.mobileHiddenStatus;
  });
}

function ensureReferenceContinueCard() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='home']");
  if (!main) return;
  if (main.querySelector("[data-mobile-continue-card='true']")) return;

  const homeContent = main.querySelector<HTMLElement>(":scope > section > div > .md\\:hidden > div, :scope > section > div > div > div");
  const moodSection = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => section.textContent?.includes("What are you in the mood"));
  const parent = homeContent ?? moodSection?.parentElement;
  if (!parent) return;

  const section = document.createElement("section");
  section.dataset.mobileContinueCard = "true";
  section.innerHTML = `
    <div data-mobile-continue-image="true">
      <div data-mobile-continue-copy="true">
        <p>Chapter 1 • 8 min read</p>
        <h2>The Half-Life of Magic</h2>
      </div>
      <button aria-label="Open last chapter recap" type="button">↺</button>
    </div>
  `;
  parent.insertBefore(section, parent.firstElementChild);
}

function markHomeCards() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='home']");
  if (!main) return;

  const continueSection = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => section.textContent?.includes("Next Chapter") && section.textContent?.includes("Continue Reading"));
  if (continueSection) {
    continueSection.dataset.mobileContinueCard = "true";
    const image = continueSection.querySelector<HTMLElement>(":scope > div:first-child");
    image?.setAttribute("data-mobile-continue-image", "true");
    const chapterLine = image?.querySelector("p");
    if (chapterLine) chapterLine.textContent = "Chapter 1 • 8 min read";
  }

  const rows = Array.from(main.querySelectorAll<HTMLButtonElement>("button")).filter((button) => button.querySelector("h3") && button.closest("section")?.textContent?.includes("Start Something New"));
  rows.forEach((row, index) => {
    const title = row.querySelector("h3")?.textContent ?? "";
    row.dataset.mobileStoryRow = "true";
    row.dataset.mobileArt = artKeyForTitle(title, index);
    row.querySelector<HTMLElement>(":scope > div:first-child")?.setAttribute("data-mobile-thumbnail", "true");
  });
}

function markLibraryPage() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='library']");
  if (!main) return;

  const tools = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Library Tools");
  if (tools) tools.dataset.mobileLibraryTools = "true";

  const storyCards = Array.from(main.querySelectorAll<HTMLElement>("article")).filter((article) => article.querySelector("h3"));
  storyCards.forEach((article, index) => {
    const title = article.querySelector("h3")?.textContent ?? "";
    article.dataset.mobileCompactCard = "true";
    article.dataset.mobileArt = artKeyForTitle(title, index);
  });
}

function markCompactDestinationCards() {
  const view = currentView();
  if (view !== "characters" && view !== "worlds") return;
  const main = document.querySelector<HTMLElement>(`.project-lantern-shell main[data-mobile-active-view='${view}']`);
  if (!main) return;

  Array.from(main.querySelectorAll<HTMLElement>("article")).forEach((article, index) => {
    const title = article.querySelector("h3")?.textContent ?? article.textContent ?? "";
    article.dataset.mobileCompactCard = "true";
    article.dataset.mobileArt = artKeyForTitle(title, index);
  });
}

function applyMobileShell(mobileQuery: MediaQueryList) {
  if (!mobileQuery.matches) return;
  const root = document.querySelector(".project-lantern-shell");
  if (!root) return;

  normalizeTextNodes(root);
  normalizeAttributes(root);
  normalizeMobileNav();
  markActiveMobileView();
  hideDemoMessages();
  ensureReferenceContinueCard();
  markHomeCards();
  markLibraryPage();
  markCompactDestinationCards();
}

export function MobileShellRuntime() {
  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    let frame = 0;
    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyMobileShell(mobileQuery));
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    window.addEventListener("popstate", apply);

    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", apply);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(apply);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", apply);
      if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", apply);
      else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(apply);
    };
  }, []);

  return null;
}
