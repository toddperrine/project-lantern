import type { ReactNode } from "react";

const NAV_ITEMS = ["Home", "Your Series", "Create", "Discover", "Library"];

const CONTINUE_SERIES = [
  { title: "The Saltwind Door", detail: "Episode 3 ready from your last Story Spark", tone: "Cinematic mystery" },
  { title: "Lanterns Under Mercy Street", detail: "A saved cast is waiting for the next turn", tone: "Warm suspense" },
  { title: "The Orchard That Remembers", detail: "Continue from the changed world state", tone: "Mythic quiet" }
];

const NEW_EPISODES = [
  { title: "A Storm Remembers Your Name", detail: "A tide-clock, a lost sibling, and one impossible harbor" },
  { title: "The House With Two Midnights", detail: "A family archive opens into a second version of home" },
  { title: "After the Fireflies Leave", detail: "A village bargains with the dark to keep one promise" }
];

const FAVORITE_CAST = ["The Keeper", "The Witness", "The Repairer", "The Singer"];
const STORY_SPARKS = ["A map changes only when no one looks", "An old radio speaks in tomorrow's weather", "A train arrives carrying letters from the missing"];

export function ProjectLanternShell({ children }: { children: ReactNode }) {
  return (
    <div className="project-lantern-shell min-h-screen bg-night-ink text-primary-light">
      <header className="sticky top-0 z-20 border-b border-warm-paper/10 bg-night-ink/92 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-lantern-gold">Project Lantern</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-primary-light">Living Series</h1>
          </div>
          <nav aria-label="Project Lantern" className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            {NAV_ITEMS.map((item, index) => (
              <a
                aria-current={index === 0 ? "page" : undefined}
                className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold transition ${index === 0 ? "border-lantern-gold bg-lantern-gold text-primary-dark" : "border-warm-paper/10 bg-deep-navy text-muted-dark hover:border-aged-brass hover:text-primary-light"}`}
                href={item === "Create" ? "#create-episode" : "#home"}
                key={item}
              >
                {item}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <div id="home" className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 md:px-8 md:py-8">
        <section className="grid gap-5 overflow-hidden rounded-md border border-warm-paper/10 bg-deep-navy shadow-soft md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
          <div className="p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Now Playing</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary-light md:text-6xl">Start a Living Series that remembers the world you made.</h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-dark">Create an Episode from a Storyworld, favorite cast, and Story Spark. Continue Series when a saved episode is ready for its next chapter.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" href="#create-episode">Start a Living Series</a>
              <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="#create-episode">Create an Episode</a>
            </div>
          </div>
          <aside className="border-t border-warm-paper/10 bg-night-ink/70 p-6 md:border-l md:border-t-0 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Make This Mine</p>
            <h3 className="mt-3 text-2xl font-semibold text-primary-light">Personal story worlds, ready to stream.</h3>
            <div className="mt-5 grid gap-3 text-sm text-muted-dark">
              <p className="rounded-md border border-tide-teal/35 bg-tide-teal/10 px-3 py-2">Living Series are built from your saved Storyworlds and Episodes.</p>
              <p className="rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-3 py-2">Use Continue Series to prepare Story Spark context without overwriting the original.</p>
            </div>
          </aside>
        </section>

        <StreamingRow title="Continue Your Series" items={CONTINUE_SERIES} />
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

        <section id="create-episode" className="project-lantern-workspace rounded-md border border-lantern-gold/20 bg-warm-paper text-primary-dark shadow-soft">
          <div className="border-b border-primary-dark/10 px-5 py-5 md:px-7">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aged-brass">Create</p>
            <h2 className="mt-2 text-3xl font-semibold text-primary-dark">Create an Episode</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-light">The existing generation controls are here: choose a Storyworld, Cast, Story Spark, craft settings, saved stories, persistence, exports, diagnostics, and Continue Series.</p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

function StreamingRow({ accent = "gold", items, title }: { accent?: "gold" | "teal"; items: { title: string; detail: string; tone?: string }[]; title: string }) {
  const badgeClass = accent === "teal" ? "bg-tide-teal text-primary-light" : "bg-lantern-gold text-primary-dark";
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-primary-light">{title}</h2>
        <span className={`rounded-md px-2 py-1 text-xs font-semibold ${badgeClass}`}>Episode row</span>
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
