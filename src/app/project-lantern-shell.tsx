import type { ReactNode } from "react";
import { ReaderMoodOnboarding } from "@/components/ReaderMoodOnboarding";
import { getBuildInfo } from "@/lib/build-info";

const NAV_ITEMS = [
  { label: "Story Library", href: "#stories" },
  { label: "Characters", href: "#characters" },
  { label: "Worlds", href: "#worlds" }
];

const PREVIEW_MODES = ["Phone", "Tablet", "Full"] as const;
const NAV_SELECTED_CLASS = "whitespace-nowrap rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-sm font-semibold text-primary-dark transition";
const NAV_DEFAULT_CLASS = "whitespace-nowrap rounded-md border border-warm-paper/10 bg-deep-navy px-3 py-2 text-sm font-semibold text-muted-dark transition hover:border-aged-brass hover:text-primary-light";

const SUGGESTED_STORY_STARTS = [
  { title: "The Saltwind Door", detail: "A coastal mystery seed with room for a first chapter", tone: "Cinematic mystery" },
  { title: "Lanterns Under Mercy Street", detail: "A warm suspense premise with a found-family cast", tone: "Warm suspense" },
  { title: "The Orchard That Remembers", detail: "A mythic quiet story start about memory and repair", tone: "Mythic quiet" }
];

const MORE_SUGGESTED_STARTS = [
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

const CHARACTER_CARDS = [
  { rank: 1, name: "The Keeper", bio: "Protects fragile rules and remembers what everyone else edits away.", appearedIn: "The Saltwind Door", signal: "Most used starter cast" },
  { rank: 2, name: "The Witness", bio: "Notices the one impossible detail and refuses to look away.", appearedIn: "Lanterns Under Mercy Street", signal: "Frequent mystery lead" },
  { rank: 3, name: "The Repairer", bio: "Fixes broken places, broken promises, and sometimes the wrong thing first.", appearedIn: "The Orchard That Remembers", signal: "High continuation fit" },
  { rank: 4, name: "The Singer", bio: "Carries memory through voice, rhythm, and dangerous old songs.", appearedIn: "A Storm Remembers Your Name", signal: "Starter favorite" }
];

const WORLD_CARDS = [
  { rank: 1, title: "Saltwind Coast", description: "A foggy coastal world where tide-clocks, vanished roads, and family promises keep changing the map.", appearedIn: "The Saltwind Door", signal: "Most used world" },
  { rank: 2, title: "Mercy Street", description: "A warm, strange neighborhood where houses remember debts and porch lights answer back.", appearedIn: "Lanterns Under Mercy Street", signal: "Frequent setting" },
  { rank: 3, title: "The Remembering Orchard", description: "A mythic orchard that stores names, grief, and bargains in its fruit.", appearedIn: "The Orchard That Remembers", signal: "High favorite potential" },
  { rank: 4, title: "Platform Seven", description: "A hidden transit world for people running from the wrong future.", appearedIn: "The Door Beneath Platform Seven", signal: "Adventure-ready" }
];

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
              <a aria-current={index === 0 ? "page" : undefined} className={index === 0 ? NAV_SELECTED_CLASS : NAV_DEFAULT_CLASS} data-lantern-nav-link="true" href={item.href} key={item.label}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div data-device-preview-stage className="mx-auto w-full transition-[max-width,padding,margin] duration-200">
        <div id="home" data-device-preview-content className="mx-auto flex w-full max-w-7xl flex-col gap-8 overflow-x-hidden px-5 py-6 transition-[max-width,padding] duration-200 md:px-8 md:py-8">
          <section className="device-preview-stack device-preview-tablet-stack grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
            <ContinueSeriesSpotlight />
            <ReaderMoodOnboarding />
          </section>

          <section id="stories" className="scroll-mt-32 overflow-hidden rounded-md border border-warm-paper/10 bg-deep-navy shadow-soft">
            <div className="device-preview-stack device-preview-tablet-stack grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
              <div className="p-6 md:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Story Library</p>
                <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary-light md:text-5xl">Saved and recent stories are the continuity source.</h2>
                <p className="mt-5 max-w-2xl text-base leading-7 text-muted-dark">Next chapters look first for your latest saved story, then for the current generated story on the page. Suggested starts below are recommendations, not saved history.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" data-open-create-story-controls="true" type="button">Start a new story</button>
                  <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#characters">Browse characters</a>
                  <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#worlds">Browse worlds</a>
                </div>
              </div>
              <aside className="border-t border-warm-paper/10 bg-night-ink/70 p-6 md:border-l md:border-t-0 md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Recent saved stories</p>
                <div data-saved-story-library className="mt-4 grid gap-3">
                  <article className="rounded-md border border-warm-paper/10 bg-deep-navy/70 p-4">
                    <h3 className="text-base font-semibold text-primary-light">No saved story detected yet</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-dark">Save a generated story and it will become the first source for Next chapter.</p>
                  </article>
                </div>
              </aside>
            </div>
          </section>

          <details id="advanced-story-controls" className="group scroll-mt-32 rounded-md border border-sea-glass/25 bg-deep-navy/95 text-primary-light shadow-soft ring-1 ring-lantern-gold/10">
            <summary className="flex cursor-pointer list-none flex-col gap-4 border-b border-warm-paper/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7 [&::-webkit-details-marker]:hidden">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea-glass">Create Story</p>
                <h2 className="mt-2 text-3xl font-semibold text-primary-light">Start a new story</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">Open these controls when you want a new story from fresh world, cast, spark, and craft-rule choices.</p>
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

          <StreamingRow title="Suggested Story Starts" subtitle="Recommendations to start something new, not saved user history." items={SUGGESTED_STORY_STARTS} />
          <StreamingRow title="More Suggested Story Starts" subtitle="Additional recommendations for discovery." items={MORE_SUGGESTED_STARTS} accent="teal" />
          <CharacterLibrarySection />
          <WorldLibrarySection />
        </div>
      </div>
      <DevicePreviewModeScript />
      <ProjectLanternActionScript />
      <SavedStoryLibraryScript />
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
          <button aria-pressed={isFull ? "true" : "false"} className={isFull ? "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition" : "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light"} data-device-preview-mode={value} key={mode} type="button">
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
[data-device-preview-content="phone"] span,
[data-device-preview-content="phone"] textarea {
  overflow-wrap: anywhere;
}

[data-device-preview-content="phone"] a,
[data-device-preview-content="phone"] button,
[data-device-preview-content="phone"] textarea {
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
  const savedStoriesKey = "story-world-engine:saved-stories:v1";
  const savedProjectsKey = "story-world-engine:saved-projects:v1";

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

  function readStoredArray(key) {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function truncate(value, length) {
    const text = normalizeText(value);
    return text.length <= length ? text : text.slice(0, length).replace(/[\s,.;:]+$/, "") + "...";
  }

  function getLatestSavedStory() {
    const localStories = readStoredArray(savedStoriesKey).filter((story) => story && typeof story.story === "string");
    const projectStories = readStoredArray(savedProjectsKey).map((project) => project?.latestStory ? {
      title: project.name || "Project story",
      createdAt: project.updatedAt || project.createdAt,
      story: project.latestStory.story,
      charactersUsed: project.latestStory.metadata?.charactersUsed || [],
      rulesReferenced: project.latestStory.metadata?.rulesReferenced || []
    } : null).filter(Boolean);
    const stories = [...localStories, ...projectStories].sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    return stories[0] || null;
  }

  function getCurrentGeneratedStory() {
    const generatedHeading = Array.from(document.querySelectorAll("p")).find((item) => item.textContent?.trim() === "Generated Story");
    const section = generatedHeading?.closest("section");
    if (!section) return null;
    const article = section.querySelector("article");
    const story = normalizeText(article?.textContent || "");
    if (!story) return null;
    return { title: "Current generated story", story, createdAt: new Date().toISOString(), charactersUsed: [], rulesReferenced: [] };
  }

  function getLatestStoryContext() {
    const story = getLatestSavedStory() || getCurrentGeneratedStory();
    if (!story) {
      return {
        title: "No saved story yet",
        story: "No saved or generated story was found. Start a new Project Lantern story if this should become chapter one.",
        characters: "None detected yet",
        rules: "None detected yet"
      };
    }
    return {
      title: story.title || "Latest story",
      story: truncate(story.story, 3600),
      characters: Array.isArray(story.charactersUsed) && story.charactersUsed.length ? story.charactersUsed.join(", ") : "Use characters from the latest story text.",
      rules: Array.isArray(story.rulesReferenced) && story.rulesReferenced.length ? story.rulesReferenced.join(", ") : "Preserve rules and changed state from the latest story text."
    };
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

  function buildContinuationInputs(direction, readerDirection) {
    const latest = getLatestStoryContext();
    const addedDirection = normalizeText(readerDirection);
    const directionLine = addedDirection ? "\\nReader direction for this installment: " + addedDirection : "";
    const continuityBlock = "Latest story title: " + latest.title + "\\n\\nLatest story context:\\n" + latest.story + "\\n\\nCharacters to preserve: " + latest.characters + "\\nRules and continuity to preserve: " + latest.rules;
    return {
      worldBible: "# Continuing Project Lantern World\\n\\n" + continuityBlock + "\\n\\nContinue from the changed world state. Do not reset the premise or ask the reader to create a new story." + directionLine,
      characterProfiles: "## Continuing Cast\\n\\nUse the characters, relationships, wounds, and choices from the latest story context. Keep motivations legible and preserve emotional continuity.\\n\\n" + continuityBlock + directionLine,
      storySeed: direction.seed + "\\n\\n" + continuityBlock + directionLine,
      storyRules: "Write the next chapter or installment from the latest saved/generated story context. Continue the story, do not restart it, do not overwrite it, and do not summarize it as the whole output. Use this continuation pressure: " + direction.detail + directionLine,
      genrePreset: "Speculative Mystery",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue",
      lengthTarget: "Standard"
    };
  }

  function clickGenerateButton(workspace, successMessage) {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const generateButton = Array.from(workspace.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Generate Story");
        if (generateButton instanceof HTMLButtonElement && !generateButton.disabled) {
          generateButton.click();
          setStatus(successMessage);
        } else {
          setStatus("Continuation context is ready, but Generate Story is unavailable. Open Start a new story to review the materials.");
        }
      });
    });
  }

  function generateContinuation(index, readerDirection) {
    const direction = directions[index] || directions[0];
    const workspace = document.getElementById("create-episode");
    if (!direction || !workspace) {
      setStatus("Story Controls are unavailable right now.");
      return;
    }

    const inputs = buildContinuationInputs(direction, readerDirection || "");
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
    clickGenerateButton(workspace, readerDirection ? "Generating the next installment with your direction." : "Generating the next chapter from latest story context.");
  }

  function wire() {
    Array.from(document.querySelectorAll("[data-lantern-nav-link]")).forEach((link) => {
      if (!(link instanceof HTMLAnchorElement) || link.dataset.lanternNavWired === "true") return;
      link.dataset.lanternNavWired = "true";
      link.addEventListener("click", () => setNavState(link.hash));
    });

    Array.from(document.querySelectorAll("[data-open-create-story-controls]")).forEach((button) => {
      if (!(button instanceof HTMLElement) || button.dataset.wired === "true") return;
      button.dataset.wired = "true";
      button.addEventListener("click", () => {
        openStoryControls();
        setStatus("Start a new story is open below.");
      });
    });

    const nextChapterButton = document.querySelector("[data-next-chapter]");
    if (nextChapterButton instanceof HTMLButtonElement && nextChapterButton.dataset.wired !== "true") {
      nextChapterButton.dataset.wired = "true";
      nextChapterButton.addEventListener("click", () => generateContinuation(0, ""));
    }

    const directedButton = document.querySelector("[data-generate-directed-continuation]");
    if (directedButton instanceof HTMLButtonElement && directedButton.dataset.wired !== "true") {
      directedButton.dataset.wired = "true";
      directedButton.addEventListener("click", () => {
        const input = document.querySelector("[data-continuation-direction-input]");
        generateContinuation(0, input instanceof HTMLTextAreaElement ? input.value : "");
      });
    }

    Array.from(document.querySelectorAll("[data-continuation-suggestion]")).forEach((button) => {
      if (!(button instanceof HTMLButtonElement) || button.dataset.wired === "true") return;
      button.dataset.wired = "true";
      button.addEventListener("click", () => {
        const input = document.querySelector("[data-continuation-direction-input]");
        const direction = directions[Number(button.dataset.continuationSuggestion || 0)] || directions[0];
        if (input instanceof HTMLTextAreaElement && direction) setNativeValue(input, direction.detail);
        setStatus("Direction added. Press Continue with this direction when ready.");
      });
    });

    setNavState(window.location.hash);
  }

  wire();
  window.addEventListener("hashchange", () => setNavState(window.location.hash));
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function SavedStoryLibraryScript() {
  const script = `
(() => {
  const savedStoriesKey = "story-world-engine:saved-stories:v1";

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[character] || character));
  }

  function readSavedStories() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(savedStoriesKey) || "[]");
      return Array.isArray(parsed) ? parsed.filter((story) => story && story.title && story.story) : [];
    } catch {
      return [];
    }
  }

  function render() {
    const container = document.querySelector("[data-saved-story-library]");
    if (!container) return;
    const stories = readSavedStories().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 3);
    if (!stories.length) return;
    container.innerHTML = stories.map((story, index) => "<article class=\"rounded-md border border-warm-paper/10 bg-deep-navy/70 p-4\"><p class=\"text-xs font-semibold uppercase tracking-[0.14em] text-sea-glass\">Recent #" + (index + 1) + "</p><h3 class=\"mt-2 text-base font-semibold text-primary-light\">" + escapeHtml(story.title) + "</h3><p class=\"mt-2 text-sm leading-6 text-muted-dark\">" + escapeHtml(story.wordCount ? story.wordCount.toLocaleString() + " words" : "Saved story") + "</p></article>").join("");
  }

  render();
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ContinueSeriesSpotlight() {
  return (
    <section id="continue-series" className="scroll-mt-32 rounded-md border border-lantern-gold/25 bg-deep-navy/95 p-5 text-primary-light shadow-soft ring-1 ring-lantern-gold/10 md:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Continue Reading</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-light md:text-4xl">Continue the latest story.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-dark">Use your latest saved story, or the currently generated story, as continuity context for the next chapter.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button className="min-h-12 rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" data-next-chapter="true" type="button">Next chapter</button>
          <details className="rounded-md border border-aged-brass/60 bg-night-ink/70 text-lantern-gold">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">Continue with direction</summary>
            <div className="border-t border-warm-paper/10 p-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-primary-light">Direction for the next installment</span>
                <textarea className="min-h-28 rounded-md border border-aged-brass/35 bg-warm-paper px-3 py-2 text-sm leading-6 text-primary-dark outline-none transition placeholder:text-muted-light focus:border-lantern-gold focus:ring-2 focus:ring-lantern-gold/30" data-continuation-direction-input="true" placeholder="Make the consequence stranger, shift focus to the changed character, or add a new secret cost." />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {CONTINUE_DIRECTIONS.map((direction, index) => <button className="rounded-md border border-sea-glass/35 bg-sea-glass/10 px-3 py-2 text-xs font-semibold text-sea-glass transition hover:border-sea-glass" data-continuation-suggestion={index} key={direction.title} type="button">{direction.title}</button>)}
              </div>
              <button className="mt-4 rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" data-generate-directed-continuation="true" type="button">Continue with this direction</button>
            </div>
          </details>
          <button className="min-h-12 rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" data-open-create-story-controls="true" type="button">Start a new story</button>
          <a className="min-h-12 rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-center text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#stories">Browse library</a>
          <a className="min-h-12 rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-center text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#characters">Characters</a>
          <a className="min-h-12 rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-center text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#worlds">Worlds</a>
        </div>
        <p data-continuation-status className="mt-4 rounded-md border border-warm-paper/10 bg-night-ink/60 px-3 py-2 text-xs font-semibold leading-5 text-muted-dark">Next chapter continues from saved or current story context. Direction is optional.</p>
      </div>
    </section>
  );
}

function StreamingRow({ accent = "gold", items, subtitle, title }: { accent?: "gold" | "teal"; items: { title: string; detail: string; tone?: string }[]; subtitle: string; title: string }) {
  const badgeClass = accent === "teal" ? "bg-tide-teal text-primary-light" : "bg-lantern-gold text-primary-dark";
  return (
    <section className="scroll-mt-32">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-primary-light">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted-dark">{subtitle}</p>
        </div>
        <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${badgeClass}`}>Recommendations</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article className="min-h-40 rounded-md border border-warm-paper/10 bg-deep-navy/80 p-4 shadow-soft" key={item.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">Suggested start</p>
            <h3 className="mt-3 text-lg font-semibold leading-6 text-primary-light">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{item.detail}</p>
            {item.tone ? <p className="mt-4 inline-flex rounded-md border border-sea-glass/35 bg-sea-glass/10 px-2 py-1 text-xs font-semibold text-sea-glass">{item.tone}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function CharacterLibrarySection() {
  return (
    <section id="characters" className="scroll-mt-32 rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea-glass">Characters</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary-light">Character Library</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">Ranked starter cards are ordered by placeholder usage/favorite signals until real user library data is connected.</p>
        </div>
        <span className="w-fit rounded-md bg-sea-glass px-2 py-1 text-xs font-semibold text-primary-dark">Destination</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CHARACTER_CARDS.map((character) => <LibraryCharacterCard character={character} key={character.name} />)}
      </div>
    </section>
  );
}

function LibraryCharacterCard({ character }: { character: { rank: number; name: string; bio: string; appearedIn: string; signal: string } }) {
  return (
    <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-16 shrink-0 items-center justify-center rounded-md border border-sea-glass/30 bg-sea-glass/10 text-lg font-semibold text-sea-glass">#{character.rank}</div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-primary-light">{character.name}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">{character.signal}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-dark">{character.bio}</p>
      <p className="mt-4 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-3 py-2 text-xs leading-5 text-muted-dark"><span className="font-semibold text-primary-light">Appeared in:</span> {character.appearedIn}</p>
    </article>
  );
}

function WorldLibrarySection() {
  return (
    <section id="worlds" className="scroll-mt-32 rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Worlds</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary-light">World Library</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">World cards are structured for future saved library data, with placeholder image blocks, descriptions, story references, and simple ranking.</p>
        </div>
        <span className="w-fit rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark">Destination</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WORLD_CARDS.map((world) => <LibraryWorldCard key={world.title} world={world} />)}
      </div>
    </section>
  );
}

function LibraryWorldCard({ world }: { world: { rank: number; title: string; description: string; appearedIn: string; signal: string } }) {
  return (
    <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4">
      <div className="flex h-28 items-end rounded-md border border-lantern-gold/25 bg-[linear-gradient(135deg,rgba(217,164,65,0.22),rgba(61,122,124,0.18),rgba(246,239,226,0.06))] p-3">
        <span className="rounded-md bg-night-ink/75 px-2 py-1 text-xs font-semibold text-lantern-gold">Rank #{world.rank}</span>
      </div>
      <h3 className="mt-4 text-base font-semibold leading-6 text-primary-light">{world.title}</h3>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">{world.signal}</p>
      <p className="mt-3 text-sm leading-6 text-muted-dark">{world.description}</p>
      <p className="mt-4 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-3 py-2 text-xs leading-5 text-muted-dark"><span className="font-semibold text-primary-light">Appeared in:</span> {world.appearedIn}</p>
    </article>
  );
}
