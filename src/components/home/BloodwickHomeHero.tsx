export type BloodwickHomeHeroProps = {
  title: string;
  body: string;
};

export function BloodwickHomeHero(props: BloodwickHomeHeroProps) {
  const { body, title } = props;

  return (
    <section className="relative isolate min-w-0 overflow-hidden rounded-bloodwick-lg border border-bloodwick-white/10 bg-bloodwick-obsidian/80 p-5 shadow-bloodwick-soft sm:p-6 lg:p-8">
      <div
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_0%,rgb(var(--bloodwick-blood-red-rgb)/0.18),transparent_34%),linear-gradient(135deg,rgb(var(--bloodwick-blood-red-rgb)/0.16),rgb(var(--bloodwick-obsidian-rgb)/0.92)_46%,rgb(var(--bloodwick-obsidian-rgb)/1))]"
        aria-hidden="true"
      />
      <div
        className="absolute right-5 top-5 -z-10 size-28 rounded-full border border-bloodwick-red/20 bg-bloodwick-red/5 blur-sm"
        aria-hidden="true"
      />
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-bloodwick-red">
          Bloodwick
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-tight text-bloodwick-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-bloodwick-white/72">
          {body}
        </p>
      </div>
    </section>
  );
}
