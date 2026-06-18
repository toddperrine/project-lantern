const WORLD_CARDS = [
  { rank: 1, title: "Saltwind Coast", description: "A foggy coastal world where tide-clocks, vanished roads, and family promises keep changing the map.", appearsIn: "The Saltwind Door", signal: "Most used world" },
  { rank: 2, title: "Mercy Street", description: "A warm, strange neighborhood where houses remember debts and porch lights answer back.", appearsIn: "Lanterns Under Mercy Street", signal: "Frequent setting" },
  { rank: 3, title: "The Remembering Orchard", description: "A mythic orchard that stores names, grief, and bargains in its fruit.", appearsIn: "The Orchard That Remembers", signal: "High favorite potential" },
  { rank: 4, title: "Platform Seven", description: "A hidden transit world for people running from the wrong future.", appearsIn: "The Door Beneath Platform Seven", signal: "Adventure-ready" }
];

export default function WorldsPage() {
  return (
    <section className="rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Worlds</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary-light">World Library</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">World cards are structured for future saved library data, with quiet cover-style placeholders, descriptions, story references, and simple ranking.</p>
        </div>
        <a className="w-fit rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark" href="/?view=worlds">Open app view</a>
      </div>
      {WORLD_CARDS.length === 0 ? <div className="mt-5 rounded-md border border-warm-paper/10 bg-night-ink/65 p-5"><h3 className="text-lg font-semibold text-primary-light">No worlds yet</h3><p className="mt-2 text-sm leading-6 text-muted-dark">World cards will appear here once storyworld references are available.</p></div> : <div className="device-preview-stack device-preview-tablet-cards mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WORLD_CARDS.map((world) => (
          <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4" key={world.title}>
            <div className="relative flex aspect-[3/4] min-h-48 overflow-hidden rounded-md border border-warm-paper/10 bg-[linear-gradient(145deg,#d9d0bf_0%,#8c785f_48%,#21313a_100%)] p-4 text-primary-dark shadow-soft">
              <div className="absolute inset-x-5 top-7 h-px bg-primary-dark/30" />
              <div className="absolute inset-x-8 top-12 h-px bg-primary-dark/20" />
              <div className="absolute left-6 top-20 h-20 w-10 border-l border-primary-dark/20" />
              <div className="absolute bottom-0 left-0 h-20 w-full bg-primary-dark/10" />
              <div className="relative z-10 flex h-full w-full flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark/65">World #{world.rank}</span>
                <span className="max-w-full text-2xl font-semibold leading-tight">{world.title}</span>
              </div>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-primary-light">{world.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">{world.signal}</p>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{world.description}</p>
            <p className="mt-4 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-3 py-2 text-xs leading-5 text-muted-dark"><span className="font-semibold text-primary-light">Appears in:</span> <a className="font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" href="/?view=create">{world.appearsIn}</a></p>
          </article>
        ))}
      </div>}
    </section>
  );
}
