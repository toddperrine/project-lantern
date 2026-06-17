import type { ReactNode } from "react";
import { getBuildInfo } from "@/lib/build-info";
import { ReaderMoodOnboarding } from "@/components/ReaderMoodOnboarding";

const NAV_ITEMS = ["Home", "Your Series", "Continue Series", "Create", "Discover", "Library"];

const FEATURED_LIVING_SERIES = [
  { title: "The Saltwind Door", detail: "Episode ideas shaped by a coastal mystery Story Spark", tone: "Cinematic mystery" },
  { title: "Lanterns Under Mercy Street", detail: "A saved cast and warm suspense premise to explore", tone: "Warm suspense" },
  { title: "The Orchard That Remembers", detail: "A changed world state with room for another Episode", tone: "Mythic quiet" }
];

const NEW_EPISODES = [
  { title: "A Storm Remembers Your Name", detail: "A tide-clock, a lost sibling, and one impossible harbor" },
  { title: "The House With Two Midnights", detail: "A family archive opens into a second version of home" },
  { title: "After the Fireflies Leave", detail: "A village bargains with the dark to keep one promise" }
];

const CONTINUE_DIRECTIONS = [
  "Follow the biggest consequence into a fresh problem the cast cannot ignore.",
  "Shift focus to the character most changed by the ending.",
  "Reveal a new rule, cost, or secret that turns the ending into a beginning."
];

const FAVORITE_CAST = ["The Keeper", "The Witness", "The Repairer", "The Singer"];
const STORY_SPARKS = ["A map changes only when no one looks", "An old radio speaks in tomorrow's weather", "A train arrives carrying letters from the missing"];

export function ProjectLanternShell({ children }: { children: ReactNode }) {
  const buildInfo = getBuildInfo();
  const versionLabel = `Version ${buildInfo.appVersion} | ${buildInfo.buildEnvironment} | ${buildInfo.gitBranch} | ${buildInfo.shortCommitSha}`;

  return (
    <div className="project-lantern-shell min-h-screen bg-night-ink text-primary-light">
      <header className="sticky top-0 z-20 border-b border-warm-paper/10 bg-night-ink/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lantern-gold">Project Lantern</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary-light">Living Series</h1>
            <p aria-label="Project Lantern build information" className="mt-2 inline-flex w-fit rounded-md border border-aged-brass/40 bg-deep-navy/80 px-2.5 py-1 text-xs font-semibold leading-5 text-sea-glass shadow-soft">
              {versionLabel}
            </p>
          </div>
          <nav aria-label="Project Lantern" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {NAV_ITEMS.map((item, index) => (
              <a
                aria-current={index === 0 ? "page" : undefined}
                className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold transition ${index === 0 ? "border-lantern-gold bg-lantern-gold text-primary-dark" : "border-warm-paper/10 bg-deep-navy text-muted-dark hover:border-aged-brass hover:text-primary-light"}`}
                href={getNavHref(item)}
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="home" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
        <ReaderMoodOnboarding />

        <details id="advanced-story-controls" className="group rounded-md border border-lantern-gold/20 bg-warm-paper text-primary-dark shadow-soft">
          <summary className="flex cursor-pointer list-none flex-col gap-4 border-b border-primary-dark/10 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-7 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aged-brass">Advanced Story Controls</p>
              <h2 className="mt-2 text-3xl font-semibold text-primary-dark">Create an Episode</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-light">Fine-tune the world, cast, spark, and structure for the next installment.</p>
            </div>
            <span className="inline-flex w-fit rounded-md border border-aged-brass/60 bg-white/75 px-3 py-2 text-sm font-semibold text-primary-dark transition group-open:bg-lantern-gold">
              <span className="group-open:hidden">Open controls</span>
              <span className="hidden group-open:inline">Hide controls</span>
            </span>
          </summary>
          <div id="create-episode" className="project-lantern-workspace">
            {children}
          </div>
        </details>
        <ReaderFeedbackEnhancer />

        <section className="grid gap-5 overflow-hidden rounded-md border border-warm-paper/10 bg-deep-navy shadow-soft md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Now Playing</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary-light md:text-6xl">Start a Living Series that remembers the world you made.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-dark">Create an Episode from a Storyworld, favorite cast, and Story Spark. Saved Episodes can become the foundation for future series tools as Project Lantern grows.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" href="#advanced-story-controls">Start a Living Series</a>
              <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#story-world-engine-generated-continuation-panel">Generate next episode</a>
              <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#advanced-story-controls">Create an Episode</a>
            </div>
          </div>
          <aside className="border-t border-warm-paper/10 bg-night-ink/70 p-6 md:border-l md:border-t-0 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Make This Mine</p>
            <h3 className="mt-3 text-2xl font-semibold text-primary-light">Personal story worlds, ready to stream.</h3>
            <div className="mt-5 grid gap-3 text-sm text-muted-dark">
              <p className="rounded-md border border-tide-teal/35 bg-tide-teal/10 px-3 py-2">Living Series are built from your saved Storyworlds and Episodes.</p>
              <p className="rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-3 py-2">Next Episodes can use the latest story context while the original Episode stays untouched.</p>
            </div>
          </aside>
        </section>

        <ContinueSeriesSpotlight />
        <StreamingRow title="Featured Living Series" items={FEATURED_LIVING_SERIES} />
        <StreamingRow title="New Episodes for You" items={NEW_EPISODES} accent="teal" />

        <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-md border border-warm-paper/10 bg-deep-navy p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-primary-light">Your Favorite Cast</h2>
              <span className="rounded-md bg-sea-glass px-2 py-1 text-xs font-semibold text-primary-dark">Cast</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {FAVORITE_CAST.map((name) => <span className="rounded-md border border-sea-glass/35 bg-sea-glass/10 px-3 py-2 text-sm font-semibold text-sea-glass" key={name}>{name}</span>)}
            </div>
          </div>
          <div className="rounded-md border border-warm-paper/10 bg-deep-navy p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-primary-light">Story Sparks</h2>
              <span className="rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark">Episode seeds</span>
            </div>
            <div className="mt-4 grid gap-2">
              {STORY_SPARKS.map((spark) => <p className="rounded-md border border-aged-brass/25 bg-night-ink/65 px-3 py-2 text-sm leading-6 text-muted-dark" key={spark}>{spark}</p>)}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function getNavHref(item: string): string {
  if (item === "Create") return "#advanced-story-controls";
  if (item === "Continue Series") return "#continue-series";
  return "#home";
}

function ReaderFeedbackEnhancer() {
  const script = `
(() => {
  const choices = ["Missed", "Not quite", "Good", "Great", "Favorite"];
  const reasons = ["Too slow", "Too generic", "Loved the character", "Loved the world", "Want more like this", "Not my taste"];

  function findFeedbackCard() {
    const headings = Array.from(document.querySelectorAll("h3"));
    const heading = headings.find((item) => item.textContent?.trim() === "Did this story land?");
    return heading?.closest("section") || null;
  }

  function styleSelectedButtons(card) {
    const scoreButtons = Array.from(card.querySelectorAll("button[data-reader-score]"));
    const selectedScore = card.getAttribute("data-reader-score");
    scoreButtons.forEach((button) => {
      const isSelected = button.getAttribute("data-reader-score") === selectedScore;
      button.className = isSelected
        ? "rounded-md border border-brass bg-brass px-3 py-2 text-sm font-semibold text-white transition"
        : "rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-sm font-semibold text-ink transition hover:bg-white";
    });
  }

  function addConfirmation(card) {
    let confirmation = card.querySelector("[data-reader-feedback-confirmation]");
    if (!confirmation) {
      confirmation = document.createElement("p");
      confirmation.setAttribute("data-reader-feedback-confirmation", "true");
      confirmation.className = "mt-3 rounded-md border border-brass/25 bg-white/70 px-3 py-2 text-xs font-semibold leading-5 text-ink/65";
      const saveButton = Array.from(card.querySelectorAll("button")).find((button) => ["Save Feedback", "Update Feedback"].includes(button.textContent?.trim() || ""));
      saveButton?.insertAdjacentElement("afterend", confirmation);
    }
    confirmation.textContent = "Feedback saved locally. Thanks.";
  }

  function rewriteReasonButtons(container) {
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
    });
  }

  function enhanceCard(card) {
    if (card.getAttribute("data-reader-feedback-enhanced") === "true") return;
    card.setAttribute("data-reader-feedback-enhanced", "true");
    const description = Array.from(card.querySelectorAll("p")).find((item) => item.textContent?.includes("Optional feedback"));
    if (description) description.textContent = "Optional reader feedback, saved locally with this story.";

    const scoreGrid = card.querySelector(".sm\\:grid-cols-5");
    if (scoreGrid) {
      Array.from(scoreGrid.querySelectorAll("button")).forEach((button, index) => {
        if (!choices[index]) return;
        button.textContent = choices[index];
        button.setAttribute("data-reader-score", String(index + 1));
        button.addEventListener("click", () => {
          card.setAttribute("data-reader-score", String(index + 1));
          styleSelectedButtons(card);
        });
      });
    }

    const label = Array.from(card.querySelectorAll("p")).find((item) => item.textContent?.includes("What worked") || item.textContent?.includes("What could"));
    if (label) label.textContent = "Optional reason";
    const reasonContainer = label?.nextElementSibling;
    if (reasonContainer instanceof HTMLElement) rewriteReasonButtons(reasonContainer);

    card.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLButtonElement && ["Save Feedback", "Update Feedback"].includes(target.textContent?.trim() || "")) {
        window.setTimeout(() => addConfirmation(card), 0);
      }
    });
  }

  function enhance() {
    const card = findFeedbackCard();
    if (card instanceof HTMLElement) enhanceCard(card);
  }

  enhance();
  const observer = new MutationObserver(enhance);
  observer.observe(document.body, { childList: true, subtree: true });
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

function ContinueSeriesSpotlight() {
  return (
    <section id="continue-series" className="grid gap-5 rounded-md border border-lantern-gold/25 bg-warm-paper p-5 text-primary-dark shadow-soft md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aged-brass">Continue Series</p>
        <h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-dark">Pick up where the last Episode left off.</h2>
        <p className="mt-3 text-sm leading-6 text-muted-light">Current story context, changed world state, and suggested next directions stay close to the post-story path.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="rounded-md bg-primary-dark px-4 py-3 text-sm font-semibold text-warm-paper transition hover:bg-deep-navy" href="#story-world-engine-generated-continuation-panel">Generate next episode</a>
          <a className="rounded-md border border-aged-brass/60 bg-white/75 px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-lantern-gold" href="#advanced-story-controls">Continue this series</a>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {CONTINUE_DIRECTIONS.map((direction) => (
          <article className="rounded-md border border-primary-dark/10 bg-white/70 p-4" key={direction}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Next Episode</p>
            <p className="mt-3 text-sm leading-6 text-muted-light">{direction}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StreamingRow({ accent = "gold", items, title }: { accent?: "gold" | "teal"; items: { title: string; detail: string; tone?: string }[]; title: string }) {
  const badgeClass = accent === "teal" ? "bg-tide-teal text-primary-light" : "bg-lantern-gold text-primary-dark";
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary-light">{title}</h2>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${badgeClass}`}>For you</span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article className="min-h-40 rounded-md border border-warm-paper/10 bg-deep-navy p-4 transition hover:border-lantern-gold/60" key={item.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-lantern-gold">Living Series</p>
            <h3 className="mt-3 text-lg font-semibold leading-6 text-primary-light">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{item.detail}</p>
            {item.tone ? <p className="mt-4 inline-flex rounded-md border border-sea-glass/35 bg-sea-glass/10 px-2 py-1 text-xs font-semibold text-sea-glass">{item.tone}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
