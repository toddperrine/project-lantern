const CHARACTER_CARDS = [
  { rank: 1, name: "The Keeper", bio: "Protects fragile rules and remembers what everyone else edits away.", appearedIn: "The Saltwind Door", signal: "Most used starter cast" },
  { rank: 2, name: "The Witness", bio: "Notices the one impossible detail and refuses to look away.", appearedIn: "Lanterns Under Mercy Street", signal: "Frequent mystery lead" },
  { rank: 3, name: "The Repairer", bio: "Fixes broken places, broken promises, and sometimes the wrong thing first.", appearedIn: "The Orchard That Remembers", signal: "High continuation fit" },
  { rank: 4, name: "The Singer", bio: "Carries memory through voice, rhythm, and dangerous old songs.", appearedIn: "A Storm Remembers Your Name", signal: "Starter favorite" }
];

export default function CharactersPage() {
  return (
    <section className="rounded-md border border-lantern-gold/20 bg-deep-navy p-5 shadow-soft md:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sea-glass">Characters</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary-light">Character Library</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-dark">Ranked starter cards are ordered by placeholder usage/favorite signals until real user library data is connected.</p>
        </div>
        <span className="w-fit rounded-md bg-sea-glass px-2 py-1 text-xs font-semibold text-primary-dark">Destination</span>
      </div>
      <div className="device-preview-stack device-preview-tablet-cards mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {CHARACTER_CARDS.map((character) => (
          <article className="rounded-md border border-warm-paper/10 bg-night-ink/65 p-4" key={character.name}>
            <div className="relative flex aspect-[3/4] min-h-48 overflow-hidden rounded-md border border-sea-glass/20 bg-[linear-gradient(145deg,#d8ded5_0%,#738176_48%,#1f2d3b_100%)] p-4 text-primary-dark shadow-soft">
              <div className="absolute inset-x-5 top-7 h-px bg-primary-dark/30" />
              <div className="absolute inset-x-8 top-12 h-px bg-primary-dark/20" />
              <div className="absolute right-6 top-20 h-24 w-12 border-r border-primary-dark/20" />
              <div className="absolute bottom-0 left-0 h-20 w-full bg-primary-dark/10" />
              <div className="relative z-10 flex h-full w-full flex-col justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-dark/65">Cast #{character.rank}</span>
                <span className="max-w-full text-2xl font-semibold leading-tight">{character.name}</span>
              </div>
            </div>
            <h3 className="mt-4 text-base font-semibold leading-6 text-primary-light">{character.name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">{character.signal}</p>
            <p className="mt-3 text-sm leading-6 text-muted-dark">{character.bio}</p>
            <p className="mt-4 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-3 py-2 text-xs leading-5 text-muted-dark"><span className="font-semibold text-primary-light">Appeared in:</span> {character.appearedIn}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
