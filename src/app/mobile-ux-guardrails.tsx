"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const MOODS = [
  ["Mystery", "⌕"],
  ["Wonder", "✶"],
  ["Emotional", "♡"],
  ["Adventure", "△"],
  ["Strange", "◎"],
  ["Hopeful", "♧"],
  ["Dark", "◐"],
  ["Reflective", "≋"]
];
const STARTS = [
  ["A Whisper in the Static", "A small town radio picks up a voice that shouldn't exist.", "Mysterious", "Sci-fi", "/artwork/lighthouse-main-street.svg"],
  ["Under Lantern Light", "A traveling lantern maker keeps more than secrets.", "Literary", "Quiet fantasy", "/artwork/borrowed-moons.svg"],
  ["When the Stars Remember", "Constellations shift and so do the fates of those below.", "Epic", "Mythic", "/artwork/seventh-door.svg"]
];
const NAV_ICONS: Record<string, string> = { Home: "⌂", "Story Library": "▥", Characters: "♙", Worlds: "◌", Create: "✎" };

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

  const orderedItems = NAV_ORDER.map((label) => byLabel.get(label)).filter((item): item is HTMLAnchorElement | HTMLButtonElement => Boolean(item));
  if (orderedItems.length) orderedItems.forEach((item) => row.appendChild(item));
}

function normalizePrimaryNavs() {
  Array.from(document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"], nav[aria-label="Project Lantern"]')).forEach(normalizeNav);
}

function clickNav(label: string) {
  const target = Array.from(document.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>('nav a, nav button')).find((item) => getNavLabel(item) === label);
  target?.click();
}

function clickButton(label: string) {
  const button = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => cleanText(item.textContent ?? "") === label);
  button?.click();
}

function ensureDemoHomeStory() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "home";
  if (view !== "home" || document.querySelector('[data-mobile-continue-reading="true"]')) return;
  clickButton("Load demo story");
}

function markSourceSections() {
  const current = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("Current Story / Next Chapter"));
  if (current) current.dataset.mobileContinueReading = "true";
  const mood = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => candidate.textContent?.includes("What are you in the mood"));
  if (mood) mood.dataset.mobileMoodRail = "true";
  const starts = Array.from(document.querySelectorAll<HTMLElement>("section")).find((candidate) => cleanText(candidate.querySelector("h2")?.textContent ?? "") === "Start Something New");
  if (starts) starts.dataset.mobileStoryRows = "true";
}

function ensureReferenceStyles() {
  if (document.getElementById("project-lantern-mobile-reference-styles")) return;
  const style = document.createElement("style");
  style.id = "project-lantern-mobile-reference-styles";
  style.textContent = `
@media (max-width: 767px) {
  :root { color-scheme: light; }
  body, .project-lantern-shell, .project-lantern-shell [data-device-preview-content], .project-lantern-shell main { background: #fbf7ef !important; color: #171510 !important; }
  .project-lantern-shell > header { position: sticky !important; top: 0 !important; z-index: 90 !important; border-bottom: 1px solid rgba(25,22,17,.08) !important; background: rgba(255,252,246,.94) !important; backdrop-filter: blur(18px) !important; }
  .project-lantern-shell > header [data-device-preview-header-inner] { display: grid !important; grid-template-columns: 2.4rem minmax(0,1fr) 2.4rem !important; align-items: center !important; padding: .74rem 1rem !important; }
  .project-lantern-shell > header [data-device-preview-header-inner]::before { content: "☰" !important; display: block !important; border: 0 !important; background: transparent !important; box-shadow: none !important; font-size: 1.35rem !important; }
  .project-lantern-shell > header [data-device-preview-header-inner]::after { content: "◎" !important; display: block !important; justify-self: end !important; border: 0 !important; background: transparent !important; box-shadow: none !important; font-size: 1.35rem !important; }
  .project-lantern-shell > header h1 { color: #171510 !important; font-family: Georgia, 'Times New Roman', serif !important; font-size: 1rem !important; font-weight: 500 !important; text-align: center !important; }
  .project-lantern-shell > header [data-device-preview-toggle] { display: none !important; }
  .project-lantern-shell > header nav[aria-label="Project Lantern"] { position: fixed !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 100 !important; padding: .44rem max(.7rem, env(safe-area-inset-left)) calc(.58rem + env(safe-area-inset-bottom)) max(.7rem, env(safe-area-inset-right)) !important; border-top: 1px solid rgba(23,21,16,.1) !important; background: rgba(255,252,246,.98) !important; box-shadow: 0 -10px 28px rgba(27,23,16,.08) !important; }
  .project-lantern-shell > header nav[aria-label="Project Lantern"] > div { display: grid !important; grid-template-columns: repeat(5, minmax(0,1fr)) !important; gap: .04rem !important; }
  .project-lantern-shell > header nav[aria-label="Project Lantern"] a { display: flex !important; flex-direction: column !important; align-items: center !important; gap: .18rem !important; border: 0 !important; background: transparent !important; box-shadow: none !important; color: #756d61 !important; font-size: .58rem !important; font-weight: 650 !important; line-height: 1.05 !important; padding: .22rem 0 !important; }
  .project-lantern-shell > header nav[aria-label="Project Lantern"] a[aria-current="page"] { color: #b2873e !important; }
  .mobile-nav-icon { width: 1.35rem !important; height: 1.35rem !important; border-radius: 0 !important; background: transparent !important; color: currentColor !important; font-size: 1rem !important; font-weight: 800 !important; }
  .mobile-nav-label { white-space: nowrap !important; }
  .project-lantern-shell [data-device-preview-content] { padding: .95rem 1rem calc(5.75rem + env(safe-area-inset-bottom)) !important; }
  .project-lantern-shell main[data-mobile-reference-home="true"] > section { display: none !important; }
  .mobile-reference-home { display: grid; gap: 1.42rem; color: #171510; }
  .mobile-reference-home h2 { margin: 0; color: #171510; font-family: Georgia, 'Times New Roman', serif; font-size: 1.2rem; font-weight: 500; letter-spacing: -.01em; }
  .mobile-reference-continue, .mobile-reference-moods, .mobile-reference-starts { display: grid; gap: .72rem; }
  .mobile-reference-hero { position: relative; min-height: 12.35rem; overflow: hidden; border-radius: 1rem; background: linear-gradient(180deg, rgba(7,10,15,.04), rgba(7,10,15,.88)), url('/artwork/half-life-magic.svg'); background-position: center; background-size: cover; box-shadow: 0 14px 34px rgba(29,25,18,.18); }
  .mobile-reference-hero-copy { position: absolute; left: 1rem; right: 4.15rem; bottom: 1rem; z-index: 2; color: #fffaf2; }
  .mobile-reference-hero-copy strong { display: block; font-family: Georgia, 'Times New Roman', serif; font-size: 1.35rem; font-weight: 600; line-height: 1.05; letter-spacing: -.02em; }
  .mobile-reference-hero-copy span, .mobile-reference-hero-copy small { display: block; margin-top: .35rem; color: rgba(255,250,242,.88); font-size: .76rem; font-weight: 650; }
  .mobile-reference-recap { position: absolute; right: .9rem; bottom: .9rem; z-index: 3; display: grid; width: 2.8rem; height: 2.8rem; place-items: center; border: 1px solid rgba(255,250,242,.45); border-radius: 999px; background: rgba(0,0,0,.22); color: #fffaf2; font-size: 1rem; backdrop-filter: blur(8px); }
  .mobile-reference-mood-rail { display: flex; width: calc(100% + 2rem); margin-left: -1rem; gap: .55rem; overflow-x: auto; padding: 0 1rem .25rem; scrollbar-width: none; }
  .mobile-reference-mood-rail::-webkit-scrollbar { display: none; }
  .mobile-reference-mood { display: grid; min-width: 4.9rem; min-height: 4.9rem; place-items: center; gap: .22rem; border: 1px solid rgba(27,23,16,.09); border-radius: .72rem; background: #fffdf8; color: #28241d; box-shadow: 0 8px 18px rgba(41,35,24,.04); }
  .mobile-reference-mood-icon { color: #b2873e; font-size: 1.15rem; }
  .mobile-reference-mood-label { font-size: .68rem; font-weight: 600; }
  .mobile-reference-starts-title { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
  .mobile-reference-see-all { border: 0; background: transparent; color: #b2873e; font-size: .78rem; font-weight: 700; }
  .mobile-reference-list { display: grid; gap: .55rem; }
  .mobile-reference-row { display: grid; grid-template-columns: 5.5rem minmax(0,1fr) 1.25rem; align-items: center; gap: .7rem; border: 1px solid rgba(27,23,16,.08); border-radius: .9rem; background: #fffdf8; padding: .55rem; box-shadow: 0 10px 24px rgba(40,34,24,.06); text-align: left; }
  .mobile-reference-thumb { aspect-ratio: 1.35 / 1; border-radius: .7rem; background-position: center; background-size: cover; }
  .mobile-reference-thumb.static { background-image: url('/artwork/lighthouse-main-street.svg'); }
  .mobile-reference-thumb.lantern { background-image: url('/artwork/borrowed-moons.svg'); }
  .mobile-reference-thumb.stars { background-image: url('/artwork/seventh-door.svg'); }
  .mobile-reference-row h3 { margin: 0; color: #171510; font-family: Georgia, 'Times New Roman', serif; font-size: 1rem; font-weight: 500; line-height: 1.12; }
  .mobile-reference-row p { display: -webkit-box; margin: .22rem 0 0; overflow: hidden; color: #6d665d; font-size: .72rem; line-height: 1.2; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
  .mobile-reference-tags { display: flex; flex-wrap: wrap; gap: .28rem; margin-top: .36rem; }
  .mobile-reference-tags span { border-radius: 999px; background: #ede9df; padding: .14rem .45rem; color: #5a554d; font-size: .62rem; font-weight: 650; }
  .mobile-reference-row-arrow { color: #b2873e; font-size: 1.2rem; font-weight: 700; }
  .project-lantern-shell [data-device-preview-content] > footer { margin-top: 1rem !important; color: #9b9388 !important; }
}`;
  document.head.appendChild(style);
}

function ensureReferenceHome() {
  const view = new URLSearchParams(window.location.search).get("view") ?? "home";
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return;
  if (view !== "home") {
    main.querySelector(".mobile-reference-home")?.remove();
    delete main.dataset.mobileReferenceHome;
    return;
  }

  main.dataset.mobileReferenceHome = "true";
  let shell = main.querySelector<HTMLDivElement>(".mobile-reference-home");
  if (!shell) {
    shell = document.createElement("div");
    shell.className = "mobile-reference-home";
    main.prepend(shell);
  }

  shell.innerHTML = `
    <section class="mobile-reference-continue">
      <h2>Continue Reading</h2>
      <button class="mobile-reference-hero" type="button" aria-label="Continue The Half-Life of Magic">
        <span class="mobile-reference-hero-copy"><strong>The Half-Life of Magic</strong><span>Chapter 7 · The Drowned Clock</span><small>7 min read</small></span>
        <span class="mobile-reference-recap" role="button" aria-label="Open recap">▧</span>
      </button>
    </section>
    <section class="mobile-reference-moods">
      <h2>What are you in the mood to read?</h2>
      <div class="mobile-reference-mood-rail">${MOODS.map(([label, icon]) => `<button class="mobile-reference-mood" type="button" data-mood="${label}"><span class="mobile-reference-mood-icon">${icon}</span><span class="mobile-reference-mood-label">${label}</span></button>`).join("")}</div>
    </section>
    <section class="mobile-reference-starts">
      <div class="mobile-reference-starts-title"><h2>Start Something New</h2><button class="mobile-reference-see-all" type="button">See all ›</button></div>
      <div class="mobile-reference-list">${STARTS.map(([title, premise, tagA, tagB], index) => `<button class="mobile-reference-row" type="button" data-start-index="${index}"><span class="mobile-reference-thumb ${index === 0 ? "static" : index === 1 ? "lantern" : "stars"}"></span><span><h3>${title}</h3><p>${premise}</p><span class="mobile-reference-tags"><span>${tagA}</span><span>${tagB}</span></span></span><span class="mobile-reference-row-arrow">›</span></button>`).join("")}</div>
    </section>`;

  shell.querySelector<HTMLButtonElement>(".mobile-reference-hero")?.addEventListener("click", () => clickButton("Next Chapter"));
  shell.querySelector<HTMLSpanElement>(".mobile-reference-recap")?.addEventListener("click", (event) => { event.stopPropagation(); clickButton("Last Chapter Recap"); });
  shell.querySelector<HTMLButtonElement>(".mobile-reference-see-all")?.addEventListener("click", () => clickNav("Story Library"));
  shell.querySelectorAll<HTMLButtonElement>("[data-mood]").forEach((button) => button.addEventListener("click", () => {
    const label = button.dataset.mood;
    const source = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => cleanText(item.textContent ?? "").startsWith(label ?? ""));
    source?.click();
  }));
  shell.querySelectorAll<HTMLButtonElement>("[data-start-index]").forEach((button) => button.addEventListener("click", () => {
    const title = STARTS[Number(button.dataset.startIndex ?? 0)]?.[0];
    const source = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((item) => cleanText(item.textContent ?? "") === "Start" && item.closest("article")?.textContent?.includes(title));
    source?.click();
  }));
}

function applyMobileReference(mobileQuery: MediaQueryList) {
  if (!mobileQuery.matches) {
    document.querySelector(".mobile-reference-home")?.remove();
    const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
    if (main) delete main.dataset.mobileReferenceHome;
    return;
  }
  ensureReferenceStyles();
  ensureDemoHomeStory();
  normalizePrimaryNavs();
  markSourceSections();
  ensureReferenceHome();
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
