const SAVED_STORY_PLACEHOLDERS = [
  { title: "No saved story detected yet", detail: "Save a generated story and it will become the first source for Next chapter.", meta: "Local library" },
  { title: "Suggested starts stay separate", detail: "Recommendations remain on Home so saved history can grow here without turning Home into a long library scroll.", meta: "Route library" }
];

export default function StoryLibraryPage() {
  return (
    <section className="overflow-hidden rounded-md border border-warm-paper/10 bg-deep-navy shadow-soft">
      <div className="device-preview-stack device-preview-tablet-stack grid gap-5 md:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.9fr)]">
        <div className="p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Story Library</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-primary-light md:text-5xl">Saved and recent stories are the continuity source.</h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-dark">Next chapters look first for your latest saved story, then for the current generated story. Suggested starts remain on Home as recommendations, not saved history.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a className="rounded-md bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" href="/">Find a story start</a>
            <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="/characters">Browse characters</a>
            <a className="rounded-md border border-aged-brass/70 bg-night-ink/70 px-4 py-3 text-sm font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy" href="/worlds">Browse worlds</a>
          </div>
        </div>
        <aside className="border-t border-warm-paper/10 bg-night-ink/70 p-6 md:border-l md:border-t-0 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sea-glass">Recent saved stories</p>
          <div className="mt-4 grid gap-3">
            {SAVED_STORY_PLACEHOLDERS.map((story) => (
              <article className="rounded-md border border-warm-paper/10 bg-deep-navy/70 p-4" key={story.title}>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sea-glass">{story.meta}</p>
                <h3 className="mt-2 text-base font-semibold text-primary-light">{story.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-dark">{story.detail}</p>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
