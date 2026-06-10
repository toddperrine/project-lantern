'use client';

import { useMemo, useState } from 'react';
import { FileDrop } from './FileDrop';
import type { StoryGenerationResponse } from '@/types/story';

type GenerationState = 'idle' | 'loading' | 'success' | 'error';

export function StoryWorkspace() {
  const [worldBible, setWorldBible] = useState('');
  const [worldBibleFile, setWorldBibleFile] = useState('');
  const [characterProfiles, setCharacterProfiles] = useState('');
  const [characterFile, setCharacterFile] = useState('');
  const [storySeed, setStorySeed] = useState('A courier discovers that a forbidden map is changing to protect someone who should not exist.');
  const [result, setResult] = useState<StoryGenerationResponse | null>(null);
  const [state, setState] = useState<GenerationState>('idle');
  const [error, setError] = useState('');

  const canGenerate = useMemo(
    () => Boolean(worldBible.trim() && characterProfiles.trim() && storySeed.trim() && state !== 'loading'),
    [characterProfiles, state, storySeed, worldBible],
  );

  async function generateStory() {
    setState('loading');
    setError('');
    setResult(null);

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worldBible, characterProfiles, storySeed }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setState('error');
      setError(payload.error ?? 'Unable to generate a story.');
      return;
    }

    setResult(payload);
    setState('success');
  }

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 pb-16 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/30">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Creator Console</p>
          <h2 className="mt-3 text-3xl font-bold text-white">Upload canon, seed a premise, generate a draft.</h2>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            This MVP uses a local deterministic generation pipeline: parse uploaded world rules and character notes, structure a three-act short story, and return a 1500–2000 word browser-visible draft.
          </p>
        </div>

        <FileDrop
          id="world-bible"
          label="Upload World Bible"
          description="Add setting rules, magic or technology constraints, cultures, locations, and continuity notes."
          fileName={worldBibleFile}
          onTextLoaded={(text, fileName) => {
            setWorldBible(text);
            setWorldBibleFile(fileName);
          }}
        />

        <FileDrop
          id="characters"
          label="Upload Character Profiles"
          description="Add character names, motivations, boundaries, relationships, voice, and continuity details."
          fileName={characterFile}
          onTextLoaded={(text, fileName) => {
            setCharacterProfiles(text);
            setCharacterFile(fileName);
          }}
        />

        <div className="rounded-3xl border border-slate-700/70 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/20">
          <label htmlFor="story-seed" className="text-base font-semibold text-white">
            Story Seed
          </label>
          <p className="mt-1 text-sm leading-6 text-slate-400">Describe the inciting incident, desired theme, or conflict you want the story to explore.</p>
          <textarea
            id="story-seed"
            value={storySeed}
            onChange={(event) => setStorySeed(event.target.value)}
            rows={6}
            className="mt-4 w-full resize-y rounded-2xl border border-slate-700 bg-slate-950/80 p-4 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/10"
            placeholder="Example: A reluctant archivist must reveal a secret law before the city votes to exile its last dragon."
          />
        </div>

        <button
          type="button"
          disabled={!canGenerate}
          onClick={generateStory}
          className="w-full rounded-2xl bg-cyan-300 px-6 py-4 text-base font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
        >
          {state === 'loading' ? 'Generating story…' : 'Generate Story'}
        </button>

        {error ? <p className="rounded-2xl border border-red-400/30 bg-red-950/50 p-4 text-sm text-red-100">{error}</p> : null}
      </div>

      <div className="rounded-[2rem] border border-slate-700 bg-slate-950/80 p-5 shadow-2xl shadow-slate-950/50 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">Generated Output</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Short Story Draft</h2>
          </div>
          {result ? <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-200">{result.metadata.wordCount} words</span> : null}
        </div>

        {result ? (
          <article className="max-w-none space-y-5">
            {result.story.split('\n').map((block, index) => {
              if (!block.trim()) {
                return null;
              }

              if (block.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-black tracking-tight text-white">{block.replace('# ', '')}</h1>;
              }

              if (block.startsWith('## ')) {
                return <h2 key={index} className="pt-4 text-2xl font-bold text-cyan-100">{block.replace('## ', '')}</h2>;
              }

              return <p key={index} className="text-base leading-8 text-slate-300">{block}</p>;
            })}
          </article>
        ) : (
          <div className="flex min-h-[520px] items-center justify-center rounded-3xl border border-dashed border-slate-700 bg-slate-900/40 p-8 text-center">
            <div>
              <p className="text-lg font-semibold text-slate-200">Your story will appear here.</p>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
                Upload canon files, enter a seed, and generate a structured short story that references character notes and world rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
