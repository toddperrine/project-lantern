import type { ReactNode } from "react";
import { getBuildInfo } from "@/lib/build-info";
import { ReaderMoodOnboarding } from "@/components/ReaderMoodOnboarding";

const NAV_ITEMS = [
  { label: "Stories", href: "#stories" },
  { label: "Characters", href: "#characters" },
  { label: "Worlds", href: "#worlds" }
];

const PREVIEW_MODES = ["Phone", "Tablet", "Full"] as const;
const NAV_SELECTED_CLASS = "whitespace-nowrap rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-sm font-semibold text-primary-dark transition";
const NAV_DEFAULT_CLASS = "whitespace-nowrap rounded-md border border-warm-paper/10 bg-deep-navy px-3 py-2 text-sm font-semibold text-muted-dark transition hover:border-aged-brass hover:text-primary-light";

const FEATURED_LIVING_SERIES = [
  { title: "The Saltwind Door", detail: "A coastal mystery with room for your next favorite chapter", tone: "Cinematic mystery" },
  { title: "Lanterns Under Mercy Street", detail: "A warm suspense story with characters ready to follow", tone: "Warm suspense" },
  { title: "The Orchard That Remembers", detail: "A changed world with another story waiting inside it", tone: "Mythic quiet" }
];

const NEW_EPISODES = [
  { title: "A Storm Remembers Your Name", detail: "A tide-clock, a lost sibling, and one impossible harbor" },
  { title: "The House With Two Midnights", detail: "A family archive opens into a second version of home" },
  { title: "After the Fireflies Leave", detail: "A village bargains with the dark to keep one promise" }
];

const CONTINUE_DIRECTIONS = [
  {
    title: "Follow the Consequence",
    detail: "Follow the biggest consequence into a fresh problem the characters cannot ignore.",
    seed: "Continue the latest Project Lantern story by following the biggest consequence of the ending into a fresh problem the characters cannot ignore. Keep continuity with the current world and character state."
  },
  {
    title: "Follow the Changed Character",
    detail: "Shift focus to the character most changed by the ending.",
    seed: "Continue the latest Project Lantern story by shifting focus to the character most changed by the ending. Let their new need, wound, or choice create the next episode."
  },
  {
    title: "Reveal the New Rule",
    detail: "Reveal a new rule, cost, or secret that turns the ending into a beginning.",
    seed: "Continue the latest Project Lantern story by revealing a new rule, cost, or secret that turns the ending into a beginning. Preserve the original story while opening the next chapter."
  }
];

const FAVORITE_CAST = ["The Keeper", "The Witness", "The Repairer", "The Singer"];
const STORY_SPARKS = ["A map changes only when no one looks", "An old radio speaks in tomorrow's weather", "A train arrives carrying letters from the missing"];
const FOLLOWED_WORLDS = STORY_SPARKS.map((detail, index) => ({
  title: ["Saltwind Coast", "Mercy Street", "The Remembering Orchard"][index] || "A World You Follow",
  detail
}));

export function ProjectLanternShell({ children }: { children: ReactNode }) {
  const buildInfo = getBuildInfo();
  const versionLabel = `Version ${buildInfo.appVersion} | ${buildInfo.buildEnvironment} | ${buildInfo.gitBranch} | ${buildInfo.shortCommitSha}`;

  return (
    <div className="project-lantern-shell min-h-screen bg-night-ink text-primary-light md:bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.10),transparent_34%),linear-gradient(180deg,#0B1020_0%,#111827_46%,#0B1020_100%)]">
      <DevicePreviewModeStyles />
      <header className="sticky top-0 z-20 border-b border-lantern-gold/15 bg-night-ink/92 backdrop-blur">
        <div data-device-preview-header-inner className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 transition-[max-width,padding] duration-200 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-primary-light">Project Lantern</h1>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p aria-label="Project Lantern build information" className="inline-flex max-w-full rounded-md border border-aged-brass/40 bg-deep-navy/80 px-2.5 py-1 text-xs font-semibold leading-5 text-sea-glass shadow-soft">
                {versionLabel}
              </p>
              <PreviewModeToggle />
            </div>
          </div>
          <nav aria-label="Project Lantern" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {NAV_ITEMS.map((item, index) => (
              <a
                aria-current={index === 0 ? "page" : undefined}
                className={index === 0 ? NAV_SELECTED_CLASS : NAV_DEFAULT_CLASS}
                data-lantern-nav-link="true"
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div data-device-preview-stage className="mx-auto w-full transition-[max-width,padding,margin] duration-200">
        <div id="home" data-device-preview-content className="mx-auto flex w-full max-w-7xl flex-col gap-8 overflow-x-hidden px-5 py-6 transition-[max-width,padding] duration-200 md:px-8 md:py-8">
          <div className="device-preview-stack device-preview-tablet-stack grid gap-5 lg:grid-cols-2 lg:items-start">
            <ContinueSeriesSpotlight />
            <ReaderMoodOnboarding />
          </div>

          <section id="stories" className="device-preview-stack device-preview-tablet-stack scroll-mt-32 grid gap-5 overflow-hidden rounded-md border border-warm-paper/10 bg-deep-navy shadow-soft md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
            <div className="p-6 md:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Stories</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary-light md:text-6xl">Start a story that remembers the world you made.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-dark">Create a new story from a world, characters you follow, and the kind of reading mood you want. Saved stories can become the foundation for future chapters as Project Lantern grows.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" href="#advanced-story-controls">Start a Story</a>
                <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#continue-series">Continue Reading</a>
                <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#characters">Characters</a>
              </div>
            </div>
            <aside className="border-t border-warm-paper/10 bg-night-ink/70 p-6 md:border-l md:border-t-0 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Worlds</p>
              <h3 className="mt-3 text-2xl font-semibold text-primary-light">Personal story worlds, ready to continue.</h3>
              <div className="mt-5 grid gap-3 text-sm text-muted-dark">
                <p className="rounded-md border border-tide-teal/35 bg-tide-teal/10 px-3 py-2">Stories are built from your saved worlds, characters, and reading history.</p>
                <p className="rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-3 py-2">Next chapters can use the latest story context while the original story stays untouched.</p>
              </div>
            </aside>
          </section>

          <details id="advanced-story-controls" className="group scroll-mt-32 rounded-md border border-sea-glass/25 bg-deep-navy/95 text-primary-light shadow-soft ring-1 ring-lantern-gold/10">
            <summary className="flex cursor-pointer list-none flex-col gap-4 border-b border-warm-paper/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea-glass">Story Controls</p>
                <h2 className="mt-2 text-3xl font-semibold text-primary-light">Create a Story</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">Fine-tune the world, characters, and shape of the next story.</p>
              </div>
              <span className="inline-flex w-fit rounded-md border border-aged-brass/60 bg-night-ink/70 px-3 py-2 text-sm font-semibold text-lantern-gold transition group-open:bg-lantern-gold group-open:text-primary-dark">
                <span className="group-open:hidden">Open controls</span>
                <span className="hidden group-open:inline">Hide controls</span>
              </span>
            </summary>
            <div id="create-episode" className="project-lantern-workspace">
              {children}
            </div>
          </details>
          <ReaderFeedbackEnhancer />
          <ReaderProfileAndFavorites />

          <StreamingRow title="Story Library" items={FEATURED_LIVING_SERIES} />
          <StreamingRow title="More Stories for You" items={NEW_EPISODES} accent="teal" />

          <section className="device-preview-stack device-preview-tablet-stack grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div id="characters" className="scroll-mt-32 rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-primary-light">Characters You Follow</h2>
                <span className="rounded-md bg-sea-glass px-2 py-1 text-xs font-semibold text-primary-dark">Characters</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-dark">These starter cast touchstones can shape new stories. Add or upload a cast in Story Controls to use your own characters.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {FAVORITE_CAST.map((name) => <span className="rounded-md border border-sea-glass/35 bg-sea-glass/10 px-3 py-2 text-sm font-semibold text-sea-glass" key={name}>{name}</span>)}
              </div>
            </div>
            <div id="worlds" className="scroll-mt-32 rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-primary-light">Worlds</h2>
                <span className="rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark">Worlds</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-dark">Followed places are available as story inspiration. Save or load a full world in Story Controls when you want generation to use a specific world bible.</p>
              <div className="mt-4 grid gap-2">
                {FOLLOWED_WORLDS.map((world) => (
                  <article className="rounded-md border border-aged-brass/25 bg-night-ink/65 px-3 py-2" key={world.title}>
                    <h3 className="text-sm font-semibold text-primary-light">{world.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-dark">{world.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
      <DevicePreviewModeScript />
      <ProjectLanternActionScript />
    </div>
  );
}

function PreviewModeToggle() {
  return (
    <div aria-label="Preview mode" className="inline-flex w-fit rounded-md border border-warm-paper/10 bg-deep-navy/80 p-1 shadow-soft" data-device-preview-toggle role="group">
      {PREVIEW_MODES.map((mode) => {
        const value = mode.toLowerCase();
        const isFull = mode === "Full";

        return (
          <button
            aria-pressed={isFull ? "true" : "false"}
            className={isFull ? "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition" : "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light"}
            data-device-preview-mode={value}
            key={mode}
            type="button"
          >
            {mode}
          </button>
        );
      })}
    </div>
  );
}

function DevicePreviewModeStyles() {
  const css = `
[data-device-preview-content="phone"] {
  overflow-x: hidden;
}

[data-device-preview-content="phone"] .device-preview-stack {
  grid-template-columns: minmax(0, 1fr) !important;
}

[data-device-preview-content="phone"] .device-preview-stack > *,
[data-device-preview-content="phone"] .project-lantern-workspace,
[data-device-preview-content="phone"] .project-lantern-workspace * {
  min-width: 0;
}

[data-device-preview-content="phone"] h1,
[data-device-preview-content="phone"] h2,
[data-device-preview-content="phone"] h3,
[data-device-preview-content="phone"] p,
[data-device-preview-content="phone"] a,
[data-device-preview-content="phone"] button,
[data-device-preview-content="phone"] span {
  overflow-wrap: anywhere;
}

[data-device-preview-content="phone"] a,
[data-device-preview-content="phone"] button {
  max-width: 100%;
}

[data-device-preview-content="tablet"] .device-preview-tablet-stack {
  grid-template-columns: minmax(0, 1fr) !important;
}

[data-device-preview-content="tablet"] .device-preview-tablet-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

@media (min-width: 768px) {
  [data-device-preview-header-inner="phone"] {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  [data-device-preview-stage="phone"] {
    margin: 1.5rem auto 2.5rem;
    padding: 0.85rem;
    border: 1px solid rgba(246, 239, 226, 0.14);
    border-radius: 2rem;
    background: linear-gradient(180deg, rgba(246, 239, 226, 0.13), rgba(11, 16, 32, 0.86));
    box-shadow: 0 32px 90px rgba(0, 0, 0, 0.34);
  }

  [data-device-preview-stage="tablet"] {
    margin: 1.5rem auto 2.5rem;
    padding: 1rem;
    border: 1px solid rgba(246, 239, 226, 0.12);
    border-radius: 1.6rem;
    background: linear-gradient(180deg, rgba(167, 199, 186, 0.12), rgba(11, 16, 32, 0.78));
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  }

  [data-device-preview-content="phone"],
  [data-device-preview-content="tablet"] {
    border: 1px solid rgba(246, 239, 226, 0.12);
    background: #0B1020;
    box-shadow: inset 0 0 0 1px rgba(11, 16, 32, 0.45);
    scrollbar-gutter: stable;
  }

  [data-device-preview-content="phone"] {
    max-height: calc(100vh - 7rem);
    border-radius: 1.45rem;
    padding: 1rem;
    overflow-y: auto;
  }

  [data-device-preview-content="tablet"] {
    border-radius: 1.1rem;
    padding: 1.25rem;
  }
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function DevicePreviewModeScript() {
  const script = `
(() => {
  const storageKey = "projectLantern.devicePreviewMode.v1";
  const modes = {
    phone: { contentMaxWidth: "430px", stageMaxWidth: "486px", headerMaxWidth: "486px" },
    tablet: { contentMaxWidth: "820px", stageMaxWidth: "884px", headerMaxWidth: "884px" },
    full: { contentMaxWidth: "", stageMaxWidth: "", headerMaxWidth: "" }
  };
  const selectedClass = "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition";
  const defaultClass = "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light";

  function readMode() {
    try {
      const storedMode = window.localStorage.getItem(storageKey);
      return storedMode && modes[storedMode] ? storedMode : "full";
    } catch {
      return "full";
    }
  }

  function persistMode(mode) {
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch {
    }
  }

  function applyMode(mode) {
    const selectedMode = modes[mode] ? mode : "full";
    const content = document.querySelector("[data-device-preview-content]");
    const stage = document.querySelector("[data-device-preview-stage]");
    const headerInner = document.querySelector("[data-device-preview-header-inner]");
    const buttons = Array.from(document.querySelectorAll("[data-device-preview-mode]"));
    const modeSettings = modes[selectedMode];

    if (content instanceof HTMLElement) {
      content.dataset.devicePreviewContent = selectedMode;
      content.style.maxWidth = modeSettings.contentMaxWidth;
      content.style.overflowX = selectedMode === "full" ? "" : "hidden";
    }

    if (stage instanceof HTMLElement) {
      stage.dataset.devicePreviewStage = selectedMode;
      stage.style.maxWidth = modeSettings.stageMaxWidth;
    }

    if (headerInner instanceof HTMLElement) {
      headerInner.dataset.devicePreviewHeaderInner = selectedMode;
      headerInner.style.maxWidth = modeSettings.headerMaxWidth;
    }

    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const isSelected = button.dataset.devicePreviewMode === selectedMode;
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      button.className = isSelected ? selectedClass : defaultClass;
    });

    persistMode(selectedMode);
  }

  Array.from(document.querySelectorAll("[data-device-preview-mode]")).forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener("click", () => applyMode(button.dataset.devicePreviewMode || "full"));
  });

  applyMode(readMode());
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ProjectLanternActionScript() {
  const continueDirections = JSON.stringify(CONTINUE_DIRECTIONS);
  const script = `
(() => {
  const directions = ${continueDirections};
  const navSelectedClass = ${JSON.stringify(NAV_SELECTED_CLASS)};
  const navDefaultClass = ${JSON.stringify(NAV_DEFAULT_CLASS)};

  function normalizeHash(hash) {
    return hash && hash !== "#" ? hash : "#stories";
  }

  function setNavState(hash) {
    const selectedHash = normalizeHash(hash);
    Array.from(document.querySelectorAll("[data-lantern-nav-link]")).forEach((link) => {
      if (!(link instanceof HTMLAnchorElement)) return;
      const isSelected = link.hash === selectedHash;
      link.className = isSelected ? navSelectedClass : navDefaultClass;
      if (isSelected) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  function openStoryControls() {
    const controls = document.getElementById("advanced-story-controls");
    if (controls instanceof HTMLDetailsElement) controls.open = true;
    controls?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setStatus(message) {
    const status = document.querySelector("[data-continuation-status]");
    if (status) status.textContent = message;
  }

  function setNativeValue(element, value) {
    if (!element) return;
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
    if (descriptor && descriptor.set) descriptor.set.call(element, value);
    else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function setSelectValue(workspace, value) {
    const select = Array.from(workspace.querySelectorAll("select")).find((candidate) => Array.from(candidate.options).some((option) => option.value === value));
    if (select) setNativeValue(select, value);
  }

  function buildContinuationInputs(direction) {
    return {
      worldBible: "# Continuing Project Lantern World\\n\\nUse the latest generated story as continuity context when it is present. Preserve established places, rules, promises, and changed world state. If no generated story is available yet, create an accessible Lantern story world around this continuation direction.\\n\\nContinuation direction: " + direction.detail,
      characterProfiles: "## Continuing Cast\\n\\nUse the latest story characters when present. Focus on the character pressure implied by this direction and keep motivations emotionally legible.\\n\\nContinuation direction: " + direction.detail,
      storySeed: direction.seed,
      storyRules: "Write the next Project Lantern story from the selected continuation direction. Keep this as a continuation or next episode, not a reset. Do not overwrite or summarize the previous story. Use the direction as the main story pressure: " + direction.detail,
      genrePreset: "Speculative Mystery",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue",
      lengthTarget: "Standard"
    };
  }

  function clickGenerateButton(workspace) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const generateButton = Array.from(workspace.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Generate Story");
        if (generateButton instanceof HTMLButtonElement && !generateButton.disabled) {
          generateButton.click();
          setStatus("Generating from the selected next-story direction.");
        } else {
          setStatus("Add story materials in Story Controls, then Generate Story will become available.");
        }
      });
    });
  }

  function generateContinuation(index) {
    const direction = directions[index] || directions[0];
    const workspace = document.getElementById("create-episode");
    if (!direction || !workspace) {
      setStatus("Story Controls are unavailable right now.");
      return;
    }

    const inputs = buildContinuationInputs(direction);
    const textareas = Array.from(workspace.querySelectorAll("textarea"));
    setNativeValue(textareas[0], inputs.worldBible);
    setNativeValue(textareas[1], inputs.characterProfiles);
    setNativeValue(textareas[2], inputs.storySeed);
    setNativeValue(textareas[3], inputs.storyRules);
    setSelectValue(workspace, inputs.genrePreset);
    setSelectValue(workspace, inputs.narrativeArchitecture);
    setSelectValue(workspace, inputs.characterArc);
    setSelectValue(workspace, inputs.endingType);
    setSelectValue(workspace, inputs.lengthTarget);
    openStoryControls();
    setStatus("Selected: " + direction.detail);
    clickGenerateButton(workspace);
  }

  function wire() {
    Array.from(document.querySelectorAll("[data-lantern-nav-link]")).forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.dataset.lanternNavWired === "true") return;
      link.dataset.lanternNavWired = "true";
      link.addEventListener("click", () => setNavState(link.hash));
    });

    const continueButton = document.querySelector("[data-open-continuation-controls]");
    if (continueButton instanceof HTMLAnchorElement && continueButton.dataset.wired !== "true") {
      continueButton.dataset.wired = "true";
      continueButton.addEventListener("click", () => {
        openStoryControls();
        setStatus("Story Controls are open. Use Generate Story or choose a Next Story card.");
      });
    }

    const generateButton = document.querySelector("[data-generate-next-story]");
    if (generateButton instanceof HTMLButtonElement && generateButton.dataset.wired !== "true") {
      generateButton.dataset.wired = "true";
      generateButton.addEventListener("click", () => generateContinuation(0));
    }

    Array.from(document.querySelectorAll("[data-continuation-index]")).forEach((button) => {
      if (!(button instanceof HTMLButtonElement) || button.dataset.wired === "true") return;
      button.dataset.wired = "true";
      button.addEventListener("click", () => generateContinuation(Number(button.dataset.continuationIndex || 0)));
    });

    setNavState(window.location.hash);
  }

  wire();
  window.addEventListener("hashchange", () => setNavState(window.location.hash));
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ReaderProfileAndFavorites() {
  return (
    <section data-reader-profile-section className="hidden rounded-md border border-lantern-gold/25 bg-deep-navy/95 p-5 shadow-soft ring-1 ring-lantern-gold/10 md:p-6">
      <div className="device-preview-stack device-preview-tablet-stack grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Reader Profile</p>
          <h2 className="mt-2 text-2xl font-semibold text-primary-light">Your story taste</h2>
          <p data-reader-profile-summary className="mt-3 text-sm leading-6 text-muted-dark">Feedback history will shape this summary.</p>
          <div data-reader-profile-preferences className="mt-4 flex flex-wrap gap-2" />
        </article>
        <article data-reader-favorites-card className="hidden rounded-md border border-lantern-gold/25 bg-night-ink/65 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lantern-gold">Favorites</p>
              <h2 className="mt-2 text-2xl font-semibold text-primary-light">Stories you marked Favorite</h2>
            </div>
            <span data-reader-favorites-count className="rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark">0</span>
          </div>
          <div data-reader-favorites-list className="device-preview-stack device-preview-tablet-cards mt-4 grid gap-3 md:grid-cols-2" />
        </article>
      </div>
    </section>
  );
}

function ReaderFeedbackEnhancer() {
  const script = `
(() => {
  const choices = ["Missed", "Not quite", "Good", "Great", "Favorite"];
  const reasons = ["Too slow", "Too generic", "Loved the character", "Loved the world", "Want more like this", "Not my taste"];
  const feedbackKey = "projectLantern.readerFeedbackHistory.v1";
  const favoritesKey = "projectLantern.favoriteStories.v1";

  function readStoredList(key) {
    try {
      const value = window.localStorage.getItem(key);
      const parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeStoredList(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function slugify(value) {
    return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "story";
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character] || character));
  }

  function findFeedbackCard() {
    const headings = Array.from(document.querySelectorAll("h3"));
    const heading = headings.find((item) => item.textContent?.trim() === "Did this story land?");
    return heading?.closest("section") || null;
  }

  function findGeneratedStoryRoot(card) {
    return document.querySelector("#story-world-engine-generated-continuation-panel") || card.closest("main") || card.parentElement || document.body;
  }

  function getStorySnapshot(card) {
    const root = findGeneratedStoryRoot(card);
    const headings = Array.from(root.querySelectorAll("h1, h2, h3")).filter((heading) => {
      const text = normalizeText(heading.textContent);
      return text && text !== "Did this story land?" && !text.includes("Reader Profile") && !text.includes("Stories you marked Favorite");
    });
    const title = normalizeText(headings[headings.length - 1]?.textContent) || "Saved story";
    const paragraphs = Array.from(root.querySelectorAll("p")).map((item) => normalizeText(item.textContent)).filter(Boolean);
    const detail = paragraphs.find((text) => !text.includes("Optional reader feedback") && !text.includes("Feedback saved locally") && text !== "Optional reason") || "Saved from your latest generated story.";
    const excerpt = normalizeText(root.textContent).slice(0, 220);
    return {
      id: slugify(title + " " + detail),
      title,
      detail,
      excerpt
    };
  }

  function getSelectedReason(card) {
    return normalizeText(card.getAttribute("data-reader-reason"));
  }

  function getSelectedScore(card) {
    const score = Number(card.getAttribute("data-reader-score") || 0);
    if (score) return score;
    const selectedButton = Array.from(card.querySelectorAll("button[data-reader-score]")).find((button) => button.getAttribute("aria-pressed") === "true");
    return Number(selectedButton?.getAttribute("data-reader-score") || 0);
  }

  function saveReaderFeedback(card) {
    const score = getSelectedScore(card);
    if (!score) return { savedFavorite: false };
    const story = getStorySnapshot(card);
    const feedback = {
      id: String(Date.now()),
      savedAt: new Date().toISOString(),
      score,
      scoreLabel: choices[score - 1] || String(score),
      reason: getSelectedReason(card),
      story
    };
    const history = [feedback, ...readStoredList(feedbackKey)].slice(0, 50);
    writeStoredList(feedbackKey, history);

    let savedFavorite = false;
    if (score === 5) {
      const favorites = readStoredList(favoritesKey).filter((favorite) => favorite?.id !== story.id);
      writeStoredList(favoritesKey, [{ ...story, savedAt: feedback.savedAt, reason: feedback.reason }, ...favorites].slice(0, 12));
      savedFavorite = true;
    }

    renderReaderProfile();
    return { savedFavorite };
  }

  function addPreferenceScore(preferences, name, points) {
    preferences[name] = (preferences[name] || 0) + points;
  }

  function getPreferenceScores(history) {
    return history.reduce((preferences, item) => {
      const score = Number(item?.score || 0);
      if (score < 3) return preferences;
      const points = score === 5 ? 3 : score === 4 ? 2 : 1;
      const text = normalizeText([item?.story?.title, item?.story?.detail, item?.story?.excerpt, item?.reason].join(" ")).toLowerCase();
      if (/mystery|mysterious|secret|suspense|archive|impossible|missing|map/.test(text)) addPreferenceScore(preferences, "Likes mystery", points);
      if (/emotional|family|sibling|promise|remembers|mercy|heart|home|lost/.test(text)) addPreferenceScore(preferences, "Likes emotional stories", points);
      if (/adventure|adventurous|storm|train|harbor|quest|journey|world|door|path/.test(text)) addPreferenceScore(preferences, "Likes adventurous stories", points);
      return preferences;
    }, {});
  }

  function renderReaderProfile() {
    const section = document.querySelector("[data-reader-profile-section]");
    if (!(section instanceof HTMLElement)) return;
    const history = readStoredList(feedbackKey);
    const favorites = readStoredList(favoritesKey);
    if (!history.length && !favorites.length) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove("hidden");
    const summary = section.querySelector("[data-reader-profile-summary]");
    const preferencesContainer = section.querySelector("[data-reader-profile-preferences]");
    const favoritesCard = section.querySelector("[data-reader-favorites-card]");
    const favoritesCount = section.querySelector("[data-reader-favorites-count]");
    const favoritesList = section.querySelector("[data-reader-favorites-list]");

    const preferenceScores = getPreferenceScores(history);
    const preferences = Object.entries(preferenceScores).filter((entry) => entry[1] > 0).sort((a, b) => b[1] - a[1]).map((entry) => entry[0]);
    if (summary) {
      summary.textContent = history.length === 1
        ? "Built from 1 saved feedback note."
        : "Built from " + history.length + " saved feedback notes.";
    }
    if (preferencesContainer) {
      preferencesContainer.innerHTML = preferences.length
        ? preferences.map((label) => "<span class=\"rounded-md border border-sea-glass/35 bg-sea-glass/10 px-3 py-2 text-sm font-semibold text-sea-glass\">" + escapeHtml(label) + "</span>").join("")
        : "<span class=\"rounded-md border border-warm-paper/15 bg-warm-paper/5 px-3 py-2 text-sm font-semibold text-muted-dark\">Still learning your taste</span>";
    }

    if (favoritesCard instanceof HTMLElement) favoritesCard.classList.toggle("hidden", favorites.length === 0);
    if (favoritesCount) favoritesCount.textContent = String(favorites.length);
    if (favoritesList) {
      favoritesList.innerHTML = favorites.map((favorite) => "<article class=\"rounded-md border border-lantern-gold/20 bg-night-ink/70 p-4\"><h3 class=\"text-base font-semibold leading-6 text-primary-light\">" + escapeHtml(favorite?.title || "Favorite story") + "</h3><p class=\"mt-2 text-sm leading-6 text-muted-dark\">" + escapeHtml(favorite?.detail || "Saved from reader feedback.") + "</p></article>").join("");
    }
  }

  function styleSelectedButtons(card) {
    const scoreButtons = Array.from(card.querySelectorAll("button[data-reader-score]"));
    const selectedScore = card.getAttribute("data-reader-score");
    scoreButtons.forEach((button) => {
      const isSelected = button.getAttribute("data-reader-score") === selectedScore;
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      button.className = isSelected
        ? "rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-sm font-semibold text-primary-dark transition"
        : "rounded-md border border-warm-paper/15 bg-night-ink/70 px-3 py-2 text-sm font-semibold text-muted-dark transition hover:border-aged-brass hover:text-primary-light";
    });
  }

  function addConfirmation(card, savedFavorite) {
    let confirmation = card.querySelector("[data-reader-feedback-confirmation]");
    if (!confirmation) {
      confirmation = document.createElement("p");
      confirmation.setAttribute("data-reader-feedback-confirmation", "true");
      confirmation.className = "mt-3 rounded-md border border-lantern-gold/25 bg-night-ink/70 px-3 py-2 text-xs font-semibold leading-5 text-muted-dark";
      const saveButton = Array.from(card.querySelectorAll("button")).find((button) => ["Save Feedback", "Update Feedback"].includes(button.textContent?.trim() || ""));
      saveButton?.insertAdjacentElement("afterend", confirmation);
    }
    confirmation.textContent = savedFavorite ? "Feedback saved locally. Added to Favorites." : "Feedback saved locally. Thanks.";
  }

  function rewriteReasonButtons(container, card) {
    const buttons = Array.from(container.querySelectorAll("button"));
    buttons.forEach((button, index) => {
      if (!reasons[index]) button.remove();
    });
    reasons.forEach((reason, index) => {
      let button = buttons[index];
      if (!button || !button.isConnected) {
        button = document.createElement("button");
        button.type = "button";
        container.appendChild(button);
      }
      button.textContent = reason;
      button.disabled = false;
      button.onclick = () => {
        card.setAttribute("data-reader-reason", reason);
      };
    });
  }

  function refreshCard(card) {
    const description = Array.from(card.querySelectorAll("p")).find((item) => item.textContent?.includes("Optional feedback"));
    if (description) description.textContent = "Optional reader feedback, saved locally with this story.";

    const scoreGrid = card.querySelector(".sm\\:grid-cols-5");
    if (scoreGrid) {
      Array.from(scoreGrid.querySelectorAll("button")).forEach((button, index) => {
        if (!choices[index]) return;
        button.textContent = choices[index];
        button.setAttribute("data-reader-score", String(index + 1));
        button.onclick = () => {
          card.setAttribute("data-reader-score", String(index + 1));
          styleSelectedButtons(card);
        };
      });
      styleSelectedButtons(card);
    }

    const label = Array.from(card.querySelectorAll("p")).find((item) => item.textContent?.includes("What worked") || item.textContent?.includes("What could") || item.textContent?.trim() === "Optional reason");
    if (label) label.textContent = "Optional reason";
    const reasonContainer = label?.nextElementSibling;
    if (reasonContainer instanceof HTMLElement) rewriteReasonButtons(reasonContainer, card);
  }

  function enhanceCard(card) {
    refreshCard(card);
    if (card.getAttribute("data-reader-feedback-enhanced") === "true") return;
    card.setAttribute("data-reader-feedback-enhanced", "true");
    card.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLButtonElement && ["Save Feedback", "Update Feedback"].includes(target.textContent?.trim() || "")) {
        const result = saveReaderFeedback(card);
        window.setTimeout(() => addConfirmation(card, result.savedFavorite), 0);
      }
    });
  }

  function enhance() {
    const card = findFeedbackCard();
    if (card instanceof HTMLElement) enhanceCard(card);
    renderReaderProfile();
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ContinueSeriesSpotlight() {
  return (
    <section id="continue-series" className="scroll-mt-32 rounded-md border border-lantern-gold/25 bg-deep-navy/95 p-5 text-primary-light shadow-soft ring-1 ring-lantern-gold/10 md:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Continue Reading</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-light md:text-4xl">Pick up where you left off.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-dark">Current story context, changed world state, and suggested next directions stay close to your latest story.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" data-generate-next-story="true" type="button">Generate next story</button>
          <a className="rounded-md border border-aged-brass/60 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" data-open-continuation-controls="true" href="#advanced-story-controls">Continue this story</a>
        </div>
        <p data-continuation-status className="mt-4 rounded-md border border-warm-paper/10 bg-night-ink/60 px-3 py-2 text-xs font-semibold leading-5 text-muted-dark">Choose a Next Story direction, or open Story Controls to continue manually.</p>
      </div>
      <div className="device-preview-stack mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {CONTINUE_DIRECTIONS.map((direction, index) => (
          <button className="rounded-md border border-warm-paper/10 bg-night-ink/70 p-4 text-left transition hover:border-lantern-gold/60 focus:outline-none focus:ring-2 focus:ring-lantern-gold/50" data-continuation-index={index} key={direction.detail} type="button">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Next Story</span>
            <span className="mt-2 block text-sm font-semibold leading-6 text-primary-light">{direction.title}</span>
            <span className="mt-3 block text-sm leading-6 text-muted-dark">{direction.detail}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function StreamingRow({ accent = "gold", id, items, title }: { accent?: "gold" | "teal"; id?: string; items: { title: string; detail: string; tone?: string }[]; title: string }) {
  const badgeClass = accent === "teal" ? "bg-tide-teal text-primary-light" : "bg-lantern-gold text-primary-dark";
  return (
    <section className="scroll-mt-32" id={id}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary-light">{title}</h2>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${badgeClass}`}>Coming soon</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article aria-disabled="true" className="min-h-40 rounded-md border border-warm-paper/10 bg-deep-navy/80 p-4 opacity-85 shadow-soft" key={item.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">Story</p>
            <h3 className="mt-3 text-lg font-semibold leading-6 text-primary-light">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{item.detail}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {item.tone ? <p className="inline-flex rounded-md border border-sea-glass/35 bg-sea-glass/10 px-2 py-1 text-xs font-semibold text-sea-glass">{item.tone}</p> : null}
              <p className="inline-flex rounded-md border border-warm-paper/15 bg-warm-paper/5 px-2 py-1 text-xs font-semibold text-muted-dark">Coming soon</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
