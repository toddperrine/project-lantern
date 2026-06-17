"use client";

import { useState } from "react";
import type { GenrePreset } from "@/lib/types";

type MoodOption = {
  label: string;
  genrePreset: GenrePreset;
  seed: string;
  tone: string;
};

type StoryDirection = {
  title: string;
  summary: string;
  detail: string;
};

const MOOD_OPTIONS: MoodOption[] = [
  { label: "Scary", genrePreset: "Speculative Mystery", seed: "A quiet place becomes frightening when one ordinary detail starts changing after sunset.", tone: "tense, eerie, and intimate" },
  { label: "Mysterious", genrePreset: "Speculative Mystery", seed: "A missing clue draws the hero into a layered mystery where every answer changes the question.", tone: "curious, atmospheric, and clue-driven" },
  { label: "Adventurous", genrePreset: "Portal Fantasy", seed: "A hidden route opens into a dangerous journey that asks the hero to be braver than expected.", tone: "fast-moving, wondrous, and daring" },
  { label: "Funny", genrePreset: "Cozy Magical Realism", seed: "A small problem spirals into absurd consequences while the hero tries to keep life normal.", tone: "warm, playful, and lightly chaotic" },
  { label: "Thoughtful", genrePreset: "Literary Coming-of-Age", seed: "A quiet choice forces the hero to understand something they have avoided for a long time.", tone: "reflective, precise, and emotionally observant" },
  { label: "Emotional", genrePreset: "Family Drama with Wonder", seed: "An old hurt resurfaces through a strange event that gives the hero one chance to say what matters.", tone: "heart-forward, tender, and cathartic" },
  { label: "Relaxing", genrePreset: "Cozy Magical Realism", seed: "A gentle discovery in a familiar place helps the hero find steadiness and small enchantment.", tone: "soothing, sensory, and low-conflict" },
  { label: "Surprise Me", genrePreset: "Mythic Quest", seed: "A strange invitation arrives with a rule nobody understands and a reward nobody fully trusts.", tone: "unexpected, vivid, and genre-blending" }
];

const DEFAULT_MOOD = MOOD_OPTIONS[1];
const PLACEHOLDER_PROMPT = "I want a scary story, but not a slasher and no ghosts. Make the hero feel like me, and set it in the town where I used to live.";

export function ReaderMoodOnboarding() {
  const [selectedMood, setSelectedMood] = useState(DEFAULT_MOOD.label);
  const [readerPrompt, setReaderPrompt] = useState("");
  const [directions, setDirections] = useState<StoryDirection[]>([]);

  const activeMood = MOOD_OPTIONS.find((mood) => mood.label === selectedMood) ?? DEFAULT_MOOD;

  function handleSuggestMatches() {
    setDirections(buildStoryDirections(activeMood, readerPrompt));
  }

  return (
    <section className="rounded-md border border-lantern-gold/25 bg-warm-paper p-5 text-primary-dark shadow-soft md:p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aged-brass">Start with the reader</p>
        <h2 className="text-2xl font-semibold text-primary-dark md:text-3xl">What are you in the mood for?</h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-light">Pick a mood or describe what you want and what to avoid. You will get three story directions before generation, with detailed controls still available below.</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        {MOOD_OPTIONS.map((mood) => (
          <button className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${selectedMood === mood.label ? "border-primary-dark bg-primary-dark text-primary-light" : "border-primary-dark/15 bg-white/75 text-primary-dark hover:border-aged-brass hover:bg-soft-card"}`} key={mood.label} onClick={() => setSelectedMood(mood.label)} type="button">
            {mood.label}
          </button>
        ))}
      </div>
      <label className="mt-5 flex flex-col gap-2">
        <span className="text-sm font-semibold text-primary-dark">Describe the story you want</span>
        <textarea className="min-h-32 rounded-md border border-primary-dark/15 bg-white px-3 py-2 text-sm leading-6 text-primary-dark outline-none transition placeholder:text-primary-dark/35 focus:border-aged-brass focus:ring-2 focus:ring-aged-brass/20" onChange={(event) => setReaderPrompt(event.target.value)} placeholder={PLACEHOLDER_PROMPT} value={readerPrompt} />
      </label>
      <button className="mt-4 rounded-md bg-primary-dark px-5 py-3 text-sm font-semibold text-primary-light transition hover:bg-primary-dark/90" onClick={handleSuggestMatches} type="button">Suggest story matches</button>
      {directions.length > 0 ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {directions.map((direction) => (
            <article className="rounded-md border border-primary-dark/10 bg-soft-card p-4" key={direction.title}>
              <h3 className="text-base font-semibold leading-6 text-primary-dark">{direction.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-light">{direction.summary}</p>
              <p className="mt-3 rounded-md bg-white/75 px-3 py-2 text-xs leading-5 text-muted-light">{direction.detail}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildStoryDirections(mood: MoodOption, readerPrompt: string): StoryDirection[] {
  const preference = readerPrompt.trim() || "an open-ended reader mood with no extra constraints";
  return [
    {
      title: `${mood.label} Personal Mirror`,
      summary: `A ${mood.tone} story that makes the hero's emotional situation echo the reader request.`,
      detail: `Uses: ${preference}`
    },
    {
      title: `${mood.label} Place With a Secret`,
      summary: "A familiar location becomes the story engine, with the mood shaping what the hero notices first.",
      detail: "Best when setting, memory, or real-life texture should guide the story."
    },
    {
      title: `${mood.label} Turnabout`,
      summary: "Starts exactly where the reader expects, then pivots into a gentler, stranger, or sharper version of that mood.",
      detail: "Good for readers who want the mood honored but not predicted beat by beat."
    }
  ];
}
