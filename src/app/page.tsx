import { StoryWorkspace } from '@/components/StoryWorkspace';

const steps = [
  'Upload a world bible as Markdown or plain text.',
  'Upload character profiles with motivations, relationships, and boundaries.',
  'Add a story seed and generate a canon-aware short story in the browser.',
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto max-w-7xl px-6 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
              Story World Engine MVP
            </p>
            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              Generate canon-aware short stories from your world files.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A focused local-development app for creators: no authentication, no payments, no database, and no cloud storage. Upload your canon, seed a conflict, and produce a structured 1500–2000 word draft.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-700 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-950/20">
            <h2 className="text-xl font-bold text-white">MVP Flow</h2>
            <ol className="mt-5 space-y-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-300 font-bold text-slate-950">{index + 1}</span>
                  <span className="text-sm leading-6 text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <StoryWorkspace />
    </main>
  );
}
