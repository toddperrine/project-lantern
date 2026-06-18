"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const DEMO_LATEST_STORY_STORAGE_KEY = "projectLantern.demoLatestStory.v1";
const DEMO_LATEST_STORY_ID = "demo-the-half-life-of-magic";
const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const VIEW_BY_LABEL: Record<string, string> = {
  Home: "home",
  "Story Library": "library",
  Characters: "characters",
  Worlds: "worlds",
  Create: "create"
};
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
  "A Whisper in the Static": "whisper-in-the-static",
  "Whisper in the Static": "whisper-in-the-static",
  "Under Lantern Light": "under-lantern-light",
  "When the Stars Remember": "stars-remember",
  "Stars Remember": "stars-remember",
  "Orchard of Borrowed Moons": "orchard-of-borrowed-moons",
  "The Quiet Engine": "quiet-engine"
};
const FALLBACK_STARTS = [
  { title: "A Whisper in the Static", premise: "A signal hidden in old recordings starts answering back.", tags: ["Mystery", "Strange"], mood: "Mystery" },
  { title: "Under Lantern Light", premise: "A town's lanterns reveal the paths people tried to forget.", tags: ["Wonder", "Magic"], mood: "Wonder" },
  { title: "When the Stars Remember", premise: "A stargazer learns the sky has been keeping human memories.", tags: ["Reflective", "Hopeful"], mood: "Reflective" },
  { title: "Orchard of Borrowed Moons", premise: "Small moons ripen with unfinished wishes inside.", tags: ["Wonder", "Magic"], mood: "Wonder" },
  { title: "The Quiet Engine", premise: "A machine turns silence into possible futures.", tags: ["Emotional", "Sci-fi"], mood: "Emotional" }
];
const FALLBACK_MOODS = ["Mystery", "Wonder", "Emotional", "Adventure", "Strange", "Hopeful", "Dark", "Reflective"];
const DEMO_STORY_TEXT = [
  "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  "Mara Vale found the first talisman inside a box of ordinary estate-sale objects.",
  "When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  "Someone else knows the talisman has awakened, and they are already looking for it."
].join("\n\n");
const DEMO_RECAP = "Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.";

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

function selectedMood() {
  return window.sessionStorage.getItem("projectLantern.mobileMood") || "Mystery";
}

function setSelectedMood(mood: string) {
  window.sessionStorage.setItem("projectLantern.mobileMood", mood);
}

function mappedArtKeyForTitle(title: string) {
  const normalizedTitle = cleanText(title).replace(/[.!?]$/, "");
  return ART_BY_TITLE[normalizedTitle] ?? null;
}

function artKeyForTitle(title: string) {
  return mappedArtKeyForTitle(title) ?? "neutral";
}

function artUrl(key: string) {
  return `/artwork/${key}.png`;
}

function applyThumbnailArtwork(element: HTMLElement | null | undefined, key: string) {
  if (!element) return;
  if (key === "neutral") {
    element.style.removeProperty("background-image");
    element.style.setProperty("background-color", "#e7e1d6", "important");
    return;
  }
  element.style.setProperty("background-image", `url("${artUrl(key)}")`, "important");
  element.style.setProperty("background-position", "center", "important");
  element.style.setProperty("background-repeat", "no-repeat", "important");
  element.style.setProperty("background-size", "contain", "important");
}

function applyContinueArtwork(element: HTMLElement | null | undefined) {
  if (!element) return;
  element.style.setProperty("background-image", "linear-gradient(180deg, rgba(8, 10, 12, 0.04), rgba(8, 10, 12, 0.86)), url(\"/artwork/half-life-of-magic.png\")", "important");
  element.style.setProperty("background-position", "center", "important");
  element.style.setProperty("background-repeat", "no-repeat", "important");
  element.style.setProperty("background-size", "cover", "important");
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

function sourceTextOutsideMobileFallback(main: HTMLElement) {
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-mobile-home-fallback='true'], [data-mobile-menu='true'], [data-mobile-recap-modal='true']").forEach((element) => element.remove());
  return cleanText(clone.textContent ?? "");
}

function isDemoStoryActive() {
  try {
    const raw = window.localStorage.getItem(DEMO_LATEST_STORY_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { id?: string; story?: string };
    return parsed?.id === DEMO_LATEST_STORY_ID && typeof parsed.story === "string";
  } catch {
    return false;
  }
}

function getHomeStorySignal(main: HTMLElement) {
  if (isDemoStoryActive()) return true;
  return /Continue Reading|Next Chapter|The Half-Life of Magic|Recent Story|Generated Story/.test(sourceTextOutsideMobileFallback(main));
}

function hasRealStorySignal() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return false;
  return /Continue Reading|Next Chapter|Recent Story|Generated Story/.test(sourceTextOutsideMobileFallback(main));
}

function createDemoLatestStory() {
  return {
    id: DEMO_LATEST_STORY_ID,
    title: "The Half-Life of Magic",
    createdAt: new Date().toISOString(),
    story: DEMO_STORY_TEXT,
    wordCount: DEMO_STORY_TEXT.trim().split(/\s+/).length,
    generatorSource: "fallback",
    charactersUsed: ["Mara Vale"],
    rulesReferenced: [],
    genrePreset: "Contemporary Fantastical / Magical Realist",
    narrativeArchitecture: "Revelation Story",
    characterArc: "Positive Change Arc",
    endingType: "Resolution with Residue",
    lengthTarget: "Standard",
    diagnosticsNotice: null
  };
}

function findButtonByText(pattern: RegExp, excludeMobileFallback = true) {
  return Array.from(document.querySelectorAll<HTMLButtonElement>(".project-lantern-shell button")).find((candidate) => {
    if (excludeMobileFallback && candidate.closest("[data-mobile-home-fallback='true'], [data-mobile-menu='true'], [data-mobile-recap-modal='true']")) return false;
    return pattern.test(cleanText(candidate.textContent ?? ""));
  });
}

function clickOriginalButtonByText(text: string) {
  findButtonByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))?.click();
}

function clickMobileNav(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>('nav[aria-label="Mobile primary"] button')).find((candidate) => cleanText(candidate.textContent ?? "") === label);
  if (button) {
    button.click();
    return;
  }

  const view = VIEW_BY_LABEL[label];
  if (!view) return;
  const nextUrl = view === "home" ? window.location.pathname : `${window.location.pathname}?view=${view}`;
  window.history.pushState(null, "", nextUrl);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function loadDemoStory() {
  const existing = findButtonByText(/load demo story|load demo/i);
  if (existing) {
    existing.click();
    return;
  }
  window.localStorage.setItem(DEMO_LATEST_STORY_STORAGE_KEY, JSON.stringify(createDemoLatestStory()));
  clickMobileNav("Home");
  window.location.reload();
}

function clearDemoStory() {
  const existing = findButtonByText(/clear demo story|clear demo/i);
  if (existing) {
    existing.click();
    return;
  }
  window.localStorage.removeItem(DEMO_LATEST_STORY_STORAGE_KEY);
  clickMobileNav("Home");
  window.location.reload();
}

function continueLatestStory() {
  const nextButton = findButtonByText(/next chapter|continue reading|continue/i);
  if (nextButton) {
    nextButton.click();
    return;
  }
  clickMobileNav("Create");
}

function openRecapModal() {
  closeMobileMenu();
  closeRecapModal();
  const modal = document.createElement("div");
  modal.dataset.mobileRecapModal = "true";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Last Chapter Recap");
  modal.innerHTML = `
    <div data-mobile-recap-panel="true">
      <div data-mobile-recap-header="true">
        <p>Last Chapter Recap</p>
        <button type="button" aria-label="Close recap">×</button>
      </div>
      <h2>The Half-Life of Magic</h2>
      <p>${DEMO_RECAP}</p>
      <button data-mobile-recap-continue="true" type="button">Next Chapter</button>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target === modal || target?.closest("[aria-label='Close recap']")) closeRecapModal();
    if (target?.closest("[data-mobile-recap-continue='true']")) {
      closeRecapModal();
      continueLatestStory();
    }
  });
}

function closeRecapModal() {
  document.querySelector("[data-mobile-recap-modal='true']")?.remove();
}

function ensureReferenceContinueCard() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='home']");
  if (!main || !getHomeStorySignal(main)) return;
  if (main.querySelector("[data-mobile-continue-card='true']")) return;

  const homeContent = main.querySelector<HTMLElement>(":scope > section > div > .md\\:hidden > div, :scope > section > div > div > div");
  const moodSection = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => section.textContent?.includes("What are you in the mood"));
  const parent = homeContent ?? moodSection?.parentElement;
  if (!parent) return;

  const section = document.createElement("section");
  section.dataset.mobileContinueCard = "true";
  section.innerHTML = buildFallbackContinue();
  parent.insertBefore(section, parent.firstElementChild);
  applyContinueArtwork(section.querySelector<HTMLElement>("[data-mobile-continue-image='true']"));
}

function findHomeRoot(main: HTMLElement) {
  return main.querySelector<HTMLElement>(":scope > section") ?? main;
}

function sortedStartsForMood(mood: string) {
  return [...FALLBACK_STARTS].sort((a, b) => Number(b.mood === mood || b.tags.includes(mood)) - Number(a.mood === mood || a.tags.includes(mood)));
}

function buildFallbackContinue() {
  return `
    <section data-mobile-fallback-continue="true" data-mobile-continue-card="true">
      <div data-mobile-continue-image="true" data-mobile-continue-action="true">
        <div data-mobile-continue-copy="true">
          <p>Chapter 1 • 8 min read</p>
          <h2>The Half-Life of Magic</h2>
        </div>
        <button aria-label="Open last chapter recap" type="button">↺</button>
      </div>
    </section>
  `;
}

function buildFallbackHome(hasStory: boolean) {
  const mood = selectedMood();
  const starts = sortedStartsForMood(mood);
  return `
    ${hasStory ? buildFallbackContinue() : ""}
    <section data-mobile-fallback-moods="true">
      <h2>What are you in the mood to read?</h2>
      <p data-mobile-mood-subtext="true">${mood} picks for your next read.</p>
      <div>${FALLBACK_MOODS.map((item) => `<button data-mobile-fallback-mood="${item}" aria-pressed="${String(item === mood)}" type="button">${item}</button>`).join("")}</div>
    </section>
    <section data-mobile-fallback-starts="true">
      <div data-mobile-fallback-start-heading="true"><h2>Start Something New</h2></div>
      <div data-mobile-fallback-start-list="true">
        ${starts.map((story) => {
          const artKey = artKeyForTitle(story.title);
          return `<button data-mobile-story-row="true" data-mobile-fallback-start="${story.title}" data-mobile-art="${artKey}" type="button">
            <span data-mobile-thumbnail="true" style="background-image:url('${artUrl(artKey)}');background-size:contain;background-repeat:no-repeat;background-position:center"></span>
            <span data-mobile-row-copy="true">
              <strong>${story.title}</strong>
              <em>${story.premise}</em>
              <span data-mobile-row-tags="true">${story.tags.slice(0, 2).map((tag) => `<span>${tag}</span>`).join("")}</span>
            </span>
            <span data-mobile-row-chevron="true">›</span>
          </button>`;
        }).join("")}
      </div>
    </section>
  `;
}

function renderFallbackHome(fallback: HTMLElement, hasStory: boolean) {
  fallback.innerHTML = buildFallbackHome(hasStory);
  fallback.dataset.mobileFallbackHasStory = String(hasStory);
  fallback.dataset.mobileFallbackMood = selectedMood();
  applyContinueArtwork(fallback.querySelector<HTMLElement>("[data-mobile-continue-image='true']"));
}

function bindFallbackHome(fallback: HTMLElement) {
  if (fallback.dataset.mobileFallbackBound === "true") return;
  fallback.dataset.mobileFallbackBound = "true";
  fallback.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const recap = target?.closest("[aria-label='Open last chapter recap']");
    if (recap) {
      event.preventDefault();
      event.stopPropagation();
      openRecapModal();
      return;
    }

    if (target?.closest("[data-mobile-continue-action='true']")) {
      continueLatestStory();
      return;
    }

    const mood = target?.closest<HTMLElement>("[data-mobile-fallback-mood]")?.dataset.mobileFallbackMood;
    if (mood) {
      setSelectedMood(mood);
      clickOriginalButtonByText(mood);
      const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
      renderFallbackHome(fallback, main ? getHomeStorySignal(main) : false);
      return;
    }

    const start = target?.closest<HTMLElement>("[data-mobile-fallback-start]")?.dataset.mobileFallbackStart;
    if (start) {
      clickOriginalButtonByText(start);
      clickMobileNav("Create");
    }
  });
}

function ensureMobileHomeFallback() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return;
  const fallback = main.querySelector<HTMLElement>("[data-mobile-home-fallback='true']");
  const root = findHomeRoot(main);

  if (currentView() !== "home") {
    fallback?.remove();
    Array.from(root.children).forEach((child) => delete (child as HTMLElement).dataset.mobileOriginalHomeContent);
    return;
  }

  let nextFallback = fallback;
  if (!nextFallback) {
    nextFallback = document.createElement("section");
    nextFallback.dataset.mobileHomeFallback = "true";
    const firstHeader = root.querySelector(":scope > header");
    if (firstHeader?.nextSibling) root.insertBefore(nextFallback, firstHeader.nextSibling);
    else root.insertBefore(nextFallback, root.firstChild);
  }

  const hasStory = getHomeStorySignal(main);
  if (nextFallback.dataset.mobileFallbackHasStory !== String(hasStory) || nextFallback.dataset.mobileFallbackMood !== selectedMood() || cleanText(nextFallback.innerHTML) === "") {
    renderFallbackHome(nextFallback, hasStory);
  }
  bindFallbackHome(nextFallback);

  Array.from(root.children).forEach((child) => {
    const element = child as HTMLElement;
    if (element === nextFallback || element.tagName === "HEADER") {
      delete element.dataset.mobileOriginalHomeContent;
      return;
    }
    element.dataset.mobileOriginalHomeContent = "true";
  });
}

function markHomeCards() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='home']");
  if (!main) return;

  const continueSection = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => !section.closest("[data-mobile-home-fallback='true']") && section.textContent?.includes("Next Chapter") && section.textContent?.includes("Continue Reading"));
  if (continueSection) {
    continueSection.dataset.mobileContinueCard = "true";
    const image = continueSection.querySelector<HTMLElement>(":scope > div:first-child");
    image?.setAttribute("data-mobile-continue-image", "true");
    image?.setAttribute("data-mobile-continue-action", "true");
    applyContinueArtwork(image);
    const chapterLine = image?.querySelector("p");
    if (chapterLine) chapterLine.textContent = "Chapter 1 • 8 min read";
  }

  const rows = Array.from(main.querySelectorAll<HTMLButtonElement>("button")).filter((button) => !button.closest("[data-mobile-home-fallback='true']") && button.querySelector("h3") && button.closest("section")?.textContent?.includes("Start Something New"));
  rows.forEach((row) => {
    const title = row.querySelector("h3")?.textContent ?? "";
    const artKey = artKeyForTitle(title);
    const thumbnail = row.querySelector<HTMLElement>(":scope > div:first-child");
    row.dataset.mobileStoryRow = "true";
    row.dataset.mobileArt = artKey;
    thumbnail?.setAttribute("data-mobile-thumbnail", "true");
    applyThumbnailArtwork(thumbnail, artKey);
  });
}

function markLibraryPage() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main[data-mobile-active-view='library']");
  if (!main) return;

  const tools = Array.from(main.querySelectorAll<HTMLElement>("section")).find((section) => section.querySelector("h2")?.textContent?.trim() === "Library Tools");
  if (tools) tools.dataset.mobileLibraryTools = "true";

  const storyCards = Array.from(main.querySelectorAll<HTMLElement>("article")).filter((article) => article.querySelector("h3"));
  storyCards.forEach((article) => {
    const title = article.querySelector("h3")?.textContent ?? "";
    article.dataset.mobileCompactCard = "true";
    article.dataset.mobileArt = artKeyForTitle(title);
    article.dataset.mobileDestination = "library";
  });
  storyCards[0]?.parentElement?.setAttribute("data-mobile-library-story-list", "true");
}

function markCompactDestinationCards() {
  const view = currentView();
  if (view !== "characters" && view !== "worlds") return;
  const main = document.querySelector<HTMLElement>(`.project-lantern-shell main[data-mobile-active-view='${view}']`);
  if (!main) return;

  Array.from(main.querySelectorAll<HTMLElement>("article")).forEach((article) => {
    const title = article.querySelector("h3")?.textContent ?? article.textContent ?? "";
    article.dataset.mobileCompactCard = "true";
    article.dataset.mobileDestination = view;
    article.dataset.mobileArt = artKeyForTitle(title);
  });
}

function openMobileMenu() {
  closeRecapModal();
  let menu = document.querySelector<HTMLElement>("[data-mobile-menu='true']");
  if (!menu) {
    menu = document.createElement("div");
    menu.dataset.mobileMenu = "true";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Project Lantern menu");
    document.body.appendChild(menu);
    menu.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target === menu || target?.closest("[data-mobile-menu-close='true']")) {
        closeMobileMenu();
        return;
      }

      const navLabel = target?.closest<HTMLElement>("[data-mobile-menu-nav]")?.dataset.mobileMenuNav;
      if (navLabel) {
        clickMobileNav(navLabel);
        closeMobileMenu();
        return;
      }

      if (target?.closest("[data-mobile-menu-load-demo='true']")) {
        closeMobileMenu();
        loadDemoStory();
        return;
      }

      if (target?.closest("[data-mobile-menu-clear-demo='true']")) {
        closeMobileMenu();
        clearDemoStory();
      }
    });
  }

  const demoActive = isDemoStoryActive();
  const anyStory = demoActive || hasRealStorySignal();
  menu.innerHTML = `
    <div data-mobile-menu-sheet="true">
      <div data-mobile-menu-header="true">
        <p>Project Lantern</p>
        <button data-mobile-menu-close="true" type="button" aria-label="Close menu">×</button>
      </div>
      <div data-mobile-menu-list="true">
        ${NAV_ORDER.map((label) => `<button data-mobile-menu-nav="${label}" type="button">${label}</button>`).join("")}
        ${!anyStory ? `<button data-mobile-menu-load-demo="true" type="button">Load demo story</button>` : ""}
        ${demoActive ? `<button data-mobile-menu-clear-demo="true" type="button">Clear demo story</button>` : ""}
      </div>
    </div>
  `;
}

function closeMobileMenu() {
  document.querySelector("[data-mobile-menu='true']")?.remove();
}

function bindHeaderActions() {
  const menuButton = document.querySelector<HTMLButtonElement>('.project-lantern-shell button[aria-label="Open menu"]');
  if (menuButton && menuButton.dataset.mobileMenuBound !== "true") {
    menuButton.dataset.mobileMenuBound = "true";
    menuButton.addEventListener("click", (event) => {
      event.preventDefault();
      openMobileMenu();
    });
  }

  const profileButton = document.querySelector<HTMLButtonElement>('.project-lantern-shell button[aria-label="Open profile"]');
  if (profileButton && profileButton.dataset.mobileProfileBound !== "true") {
    profileButton.dataset.mobileProfileBound = "true";
    profileButton.addEventListener("click", () => openMobileMenu());
  }
}

function bindVisibleRecapButtons() {
  Array.from(document.querySelectorAll<HTMLButtonElement>('.project-lantern-shell button[aria-label*="recap" i], .project-lantern-shell button[aria-label*="last chapter" i]')).forEach((button) => {
    if (button.dataset.mobileRecapBound === "true") return;
    button.dataset.mobileRecapBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openRecapModal();
    });
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
  ensureMobileHomeFallback();
  markLibraryPage();
  markCompactDestinationCards();
  bindHeaderActions();
  bindVisibleRecapButtons();
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
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        closeRecapModal();
      }
    });

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
