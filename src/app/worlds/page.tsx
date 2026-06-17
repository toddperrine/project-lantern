const WORLD_CARDS = [
  { rank: 1, title: "Saltwind Coast", description: "A foggy coastal world where tide-clocks, vanished roads, and family promises keep changing the map.", appearedIn: "The Saltwind Door", signal: "Most used world" },
  { rank: 2, title: "Mercy Street", description: "A warm, strange neighborhood where houses remember debts and porch lights answer back.", appearedIn: "Lanterns Under Mercy Street", signal: "Frequent setting" },
  { rank: 3, title: "The Remembering Orchard", description: "A mythic orchard that stores names, grief, and bargains in its fruit.", appearedIn: "The Orchard That Remembers", signal: "High favorite potential" },
  { rank: 4, title: "Platform Seven", description: "A hidden transit world for people running from the wrong future.", appearedIn: "The Door Beneath Platform Seven", signal: "Adventure-ready" }
];

export default function WorldsPage() {
  return (
    <section className="rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Worlds</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary-light">World Library</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">World cards are structured for future saved library data, with placeholder image blocks, descriptions, story references, and simple ranking.</p>
        </div>
        <span className="w-fit rounded-md bg-lantern-gold px-2 py-1 text-xs font-semibold text-primary-dark">Destination</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {WORLD_CARDS.map((world) => (
          <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4" key={world.title}>
            <div className="flex h-28 items-end rounded-md border border-lantern-gold/25 bg-[linear-gradient(135deg,rgba(217,164,65,0.22),rgba(61,122,124,0.18),rgba(246,239,226,0.06))] p-3">
              <span className="rounded-md bg-night-ink/75 px-2 py-1 text-xs font-semibold text-lantern-gold">Rank #{world.rank}</span>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-primary-light">{world.title}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">{world.signal}</p>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{world.description}</p>
            <p className="mt-4 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-3 py-2 text-xs leading-5 text-muted-dark"><span className="font-semibold text-primary-light">Appeared in:</span> {world.appearedIn}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
