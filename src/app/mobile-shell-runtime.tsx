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
const CHECK_IN_GATE_KEY = "projectLantern.mobileCheckInGate";
const CHECK_IN_STEP_KEY = "projectLantern.mobileCheckInStep";
const CHECK_IN_ANSWERS_KEY = "projectLantern.mobileCheckInAnswers";
const RESET_MOBILE_HOME_GATE_EVENT = "lantern:reset-mobile-home-gate";
const FALLBACK_MOOD_ICONS: Record<string, string> = {
  Mystery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="10.5" cy="10.5" r="5.5" stroke-width="1.8"/><path d="m15 15 4.5 4.5" stroke-linecap="round" stroke-width="1.8"/></svg>`,
  Wonder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" stroke-linecap="round" stroke-width="1.8"/><path d="m12 8.5 1.05 2.15 2.35.35-1.7 1.65.4 2.35-2.1-1.1-2.1 1.1.4-2.35L8.6 11l2.35-.35L12 8.5Z" stroke-linejoin="round" stroke-width="1.5"/></svg>`,
  Emotional: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 20.2s-7-4.1-8.6-8.6C2.3 8.4 4.2 5.5 7.3 5.5c1.8 0 3.1 1 4.7 2.8 1.6-1.8 2.9-2.8 4.7-2.8 3.1 0 5 2.9 3.9 6.1C19 16.1 12 20.2 12 20.2Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>`,
  Adventure: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="m3 18 6.2-10 4.3 6.7 2-3.1L21 18H3Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/><path d="m8.7 11.4 1.7 1.2 1.2-1.7" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>`,
  Strange: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3.2 12s3.2-5.2 8.8-5.2 8.8 5.2 8.8 5.2-3.2 5.2-8.8 5.2S3.2 12 3.2 12Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" stroke-width="1.8"/></svg>`,
  Hopeful: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 20V9" stroke-linecap="round" stroke-width="1.8"/><path d="M12 12.2C9.1 12 6.8 10 6.2 6.2 10 6.5 12 8.6 12 12.2Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/><path d="M12 14.2c2.9-.2 5.2-2.2 5.8-6-3.8.3-5.8 2.4-5.8 6Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>`,
  Dark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M18.5 16.8A7.4 7.4 0 0 1 10.1 5a7.6 7.6 0 1 0 8.4 11.8Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>`,
  Reflective: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="12" rx="3" ry="1.45" stroke-width="1.8"/><ellipse cx="12" cy="12" rx="6.4" ry="3.15" stroke-width="1.8"/><path d="M3 12c1.8-3.2 5.1-5.1 9-5.1s7.2 1.9 9 5.1c-1.8 3.2-5.1 5.1-9 5.1S4.8 15.2 3 12Z" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8"/></svg>`
};
const DEMO_STORY_TEXT = [
  "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  "Mara Vale found the first talisman inside a box of ordinary estate-sale objects.",
  "When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  "Someone else knows the talisman has awakened, and they are already looking for it."
].join("\n\n");
const DEMO_RECAP = "Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.";
const MENU_ICON = `<svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-linecap="round" stroke-width="1.9"/></svg>`;
const PROFILE_ICON = `<svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="3.25" stroke="currentColor" stroke-width="1.8"/><path d="M5.75 19.25c.85-3.15 3.15-5 6.25-5s5.4 1.85 6.25 5" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/></svg>`;

function currentView() {
  return new URLSearchParams(window.location.search).get("view") ?? "home";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function replaceText(value: string) {
  return TEXT_REPLACEMENTS.reduce((nextValue, [pattern, replacement]) => nextValue.replace(pattern, replacement), value);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character] ?? character);
}

function selectedMood() {
  return window.sessionStorage.getItem("projectLantern.mobileMood") || "Mystery";
}

function setSelectedMood(mood: string) {
  window.sessionStorage.setItem("projectLantern.mobileMood", mood);
}

function resetMobileHomeGateState() {
  window.sessionStorage.removeItem(CHECK_IN_GATE_KEY);
  window.sessionStorage.removeItem(CHECK_IN_STEP_KEY);
  window.sessionStorage.removeItem(CHECK_IN_ANSWERS_KEY);
  window.sessionStorage.removeItem("projectLantern.mobileCheckInChoice");
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
    if (node.parentElement?.closest(TEXT_SKIP_SELECTOR)) return;
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
  const byLabel = new Map<string, HTMLButtonElement>();
  Array.from(row.querySelectorAll<HTMLButtonElement>("button")).forEach((button) => {
    const label = replaceText(cleanText(button.textContent ?? ""));
    button.textContent = label;
    byLabel.set(label, button);
  });
  NAV_ORDER.map((label) => byLabel.get(label)).filter((button): button is HTMLButtonElement => Boolean(button)).forEach((button) => row.appendChild(button));
}

function markActiveMobileView() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (main) main.dataset.mobileActiveView = currentView();
}

function hideDemoMessages() {
  Array.from(document.querySelectorAll<HTMLElement>(".project-lantern-shell main > section > div")).forEach((element) => {
    const text = cleanText(element.textContent ?? "");
    if (/Demo story|Demo Story|demo story/.test(text)) element.dataset.mobileHiddenStatus = "true";
    else delete element.dataset.mobileHiddenStatus;
  });
}

function sourceTextOutsideMobileFallback(main: HTMLElement) {
  const clone = main.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-mobile-home-fallback='true'], [data-mobile-menu='true'], [data-mobile-account-modal='true'], [data-mobile-recap-modal='true']").forEach((element) => element.remove());
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
    if (excludeMobileFallback && candidate.closest("[data-mobile-home-fallback='true'], [data-mobile-menu='true'], [data-mobile-account-modal='true'], [data-mobile-recap-modal='true']")) return false;
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

function closeRecapModal() {
  document.querySelector("[data-mobile-recap-modal='true']")?.remove();
}

function closeAccountModal() {
  document.querySelector("[data-mobile-account-modal='true']")?.remove();
}

function closeMobileMenu() {
  document.querySelector("[data-mobile-menu='true']")?.remove();
}

function openRecapModal() {
  closeMobileMenu();
  closeAccountModal();
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

function openAccountModal() {
  closeMobileMenu();
  closeRecapModal();
  closeAccountModal();
  const modal = document.createElement("div");
  modal.dataset.mobileAccountModal = "true";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Profile settings");
  modal.innerHTML = `
    <div data-mobile-account-sheet="true">
      <div data-mobile-account-header="true">
        <p>Profile</p>
        <button data-mobile-account-close="true" type="button" aria-label="Close profile settings">×</button>
      </div>
      <p>Profile settings coming soon</p>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target === modal || target?.closest("[data-mobile-account-close='true']")) closeAccountModal();
  });
}

function openMobileMenu() {
  closeAccountModal();
  closeRecapModal();
  let menu = document.querySelector<HTMLElement>("[data-mobile-menu='true']");
  if (!menu) {
    menu = document.createElement("div");
    menu.dataset.mobileMenu = "true";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-label", "Lantyrn menu");
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
        <p>Lantyrn</p>
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

function buildFallbackContinue() {
  return `
    <section data-mobile-fallback-continue="true" data-mobile-continue-card="true">
      <h2 data-mobile-continue-heading="true">Continue Reading</h2>
      <div data-mobile-continue-image="true" data-mobile-continue-action="true" role="button" tabindex="0" aria-label="Continue The Half-Life of Magic">
        <div data-mobile-continue-copy="true">
          <p>Chapter 1 • 8 min read</p>
          <h2>The Half-Life of Magic</h2>
        </div>
        <span data-mobile-continue-cta="true">Continue</span>
        <button aria-label="Open last chapter recap" type="button">↺</button>
      </div>
    </section>
  `;
}

function sortedStartsForMood(mood: string) {
  return [...FALLBACK_STARTS].sort((a, b) => Number(b.mood === mood || b.tags.includes(mood)) - Number(a.mood === mood || a.tags.includes(mood)));
}

function moodIcon(mood: string) {
  return FALLBACK_MOOD_ICONS[mood] ?? "";
}

function latestStoryTitle(main?: HTMLElement) {
  try {
    const raw = window.localStorage.getItem(DEMO_LATEST_STORY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { id?: string; title?: string };
      if (parsed?.id === DEMO_LATEST_STORY_ID && typeof parsed.title === "string" && cleanText(parsed.title)) return cleanText(parsed.title);
    }
  } catch {
    // Ignore malformed demo-story storage and fall back to visible story signals.
  }
  const sourceText = main ? sourceTextOutsideMobileFallback(main) : "";
  const knownTitle = Object.keys(ART_BY_TITLE).find((title) => sourceText.includes(title));
  return knownTitle || "The Half-Life of Magic";
}

function buildFallbackHome(hasStory = false, storyTitle = "The Half-Life of Magic") {
  return `    <section data-mobile-home-surface="true" aria-label="Lantyrn home">       <section data-mobile-home-gate="true">         <p data-mobile-gate-welcome="true">Welcome back, Todd.</p>         <h1 data-mobile-gate-question="true"><span>What would you like</span><span>to read?</span></h1>         <div data-mobile-gate-actions="true">
          ${hasStory ?`<button data-mobile-continue-action="true" type="button">Continue ${escapeHtml(storyTitle)}</button>`: ""}           <button data-mobile-check-in-start="true" type="button">Start something new</button>         </div>       </section>     </section>
 `;
}

function keepSelectedMoodVisible(fallback: HTMLElement, mood = selectedMood()) {
  const selectedButton = Array.from(fallback.querySelectorAll<HTMLButtonElement>("[data-mobile-fallback-mood]")).find((button) => button.dataset.mobileFallbackMood === mood);
  const track = selectedButton?.parentElement;
  if (!selectedButton || !track) return;
  window.requestAnimationFrame(() => {
    const buttonRect = selectedButton.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const isVisible = buttonRect.left >= trackRect.left + 12 && buttonRect.right <= trackRect.right - 12;
    if (!isVisible) selectedButton.scrollIntoView({ block: "nearest", inline: "center" });
  });
}

function renderFallbackHome(fallback: HTMLElement, hasStory: boolean, storyTitle = "The Half-Life of Magic") {
  fallback.innerHTML = buildFallbackHome(hasStory, storyTitle);
  fallback.dataset.mobileFallbackHasStory = String(hasStory);
  fallback.dataset.mobileFallbackMood = "gate";
}

function bindFallbackHome(fallback: HTMLElement) {
  if (fallback.dataset.mobileFallbackBound === "true") return;
  fallback.dataset.mobileFallbackBound = "true";

  fallback.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;

    if (target?.closest("[aria-label='Open last chapter recap']")) {
      event.preventDefault();
      event.stopPropagation();
      openRecapModal();
      return;
    }

    if (target?.closest("[data-mobile-continue-action='true']")) {
      continueLatestStory();
      return;
    }

    if (target?.closest("[data-mobile-check-in-start='true']")) {
      event.preventDefault();
      resetMobileHomeGateState();
      clickMobileNav("Create");
      return;
    }
  });

  fallback.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target?.closest("[data-mobile-continue-action='true']")) return;
    event.preventDefault();
    continueLatestStory();
  });
}

function findHomeRoot(main: HTMLElement) {
  return main.querySelector<HTMLElement>(":scope > section") ?? main;
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
  }
  const firstHeader = root.querySelector(":scope > header");
  if (firstHeader) {
    root.insertBefore(nextFallback, firstHeader.nextSibling);
  } else {
    root.insertBefore(nextFallback, root.firstChild);
  }
  const hasStory = getHomeStorySignal(main);
  const storyTitle = latestStoryTitle(main);
  const fallbackState = "gate";
  if (nextFallback.dataset.mobileFallbackHasStory !== String(hasStory) || nextFallback.dataset.mobileFallbackStoryTitle !== storyTitle || nextFallback.dataset.mobileFallbackMood !== fallbackState || cleanText(nextFallback.innerHTML) === "") renderFallbackHome(nextFallback, hasStory, storyTitle);
  nextFallback.dataset.mobileFallbackStoryTitle = storyTitle;
  bindFallbackHome(nextFallback);
  Array.from(root.children).forEach((child) => {
    const element = child as HTMLElement;
    if (element === nextFallback || element.tagName === "HEADER") delete element.dataset.mobileOriginalHomeContent;
    else element.dataset.mobileOriginalHomeContent = "true";
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
    image?.setAttribute("role", "button");
    image?.setAttribute("tabindex", "0");
    image?.setAttribute("aria-label", "Continue The Half-Life of Magic");
    applyContinueArtwork(image);
    const chapterLine = image?.querySelector("p");
    if (chapterLine) chapterLine.textContent = "Chapter 1 • 8 min read";
    if (image && !image.querySelector("[data-mobile-continue-cta='true']")) {
      const cta = document.createElement("span");
      cta.dataset.mobileContinueCta = "true";
      cta.textContent = "Continue";
      image.appendChild(cta);
    }
  }
  Array.from(main.querySelectorAll<HTMLButtonElement>("button")).filter((button) => !button.closest("[data-mobile-home-fallback='true']") && button.querySelector("h3") && button.closest("section")?.textContent?.includes("Start Something New")).forEach((row) => {
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

function bindHeaderActions() {
  const mobileHeader = document.querySelector<HTMLElement>(".project-lantern-shell main > section > header:first-child");
  const headerButtons = mobileHeader ? Array.from(mobileHeader.querySelectorAll<HTMLButtonElement>("button")) : [];
  const menuButton = document.querySelector<HTMLButtonElement>('.project-lantern-shell button[aria-label="Open menu"]') ?? headerButtons[0];
  if (menuButton) {
    menuButton.setAttribute("aria-label", "Open menu");
    if (menuButton.dataset.mobileMenuIcon !== "true") {
      menuButton.dataset.mobileMenuIcon = "true";
      menuButton.innerHTML = MENU_ICON;
    }
    if (menuButton.dataset.mobileMenuBound !== "true") {
      menuButton.dataset.mobileMenuBound = "true";
      menuButton.addEventListener("click", (event) => {
        event.preventDefault();
        openMobileMenu();
      });
    }
  }
  const profileButton = document.querySelector<HTMLButtonElement>('.project-lantern-shell button[aria-label="Open profile"]') ?? headerButtons[headerButtons.length - 1];
  if (profileButton && profileButton !== menuButton) {
    profileButton.setAttribute("aria-label", "Open profile");
    if (profileButton.dataset.mobileProfileIcon !== "true") {
      profileButton.dataset.mobileProfileIcon = "true";
      profileButton.innerHTML = PROFILE_ICON;
    }
    if (profileButton.dataset.mobileProfileBound !== "true") {
      profileButton.dataset.mobileProfileBound = "true";
      profileButton.addEventListener("click", (event) => {
        event.preventDefault();
        openAccountModal();
      });
    }
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
    const closeSheets = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeMobileMenu();
      closeAccountModal();
      closeRecapModal();
    };
    const resetHomeGate = () => {
      resetMobileHomeGateState();
      closeMobileMenu();
      closeAccountModal();
      closeRecapModal();
      clickMobileNav("Home");
      apply();
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    window.addEventListener("popstate", apply);
    window.addEventListener("keydown", closeSheets);
    window.addEventListener(RESET_MOBILE_HOME_GATE_EVENT, resetHomeGate);
    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", apply);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(apply);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", apply);
      window.removeEventListener("keydown", closeSheets);
      window.removeEventListener(RESET_MOBILE_HOME_GATE_EVENT, resetHomeGate);
      if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", apply);
      else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(apply);
    };
  }, []);
  return null;
}
