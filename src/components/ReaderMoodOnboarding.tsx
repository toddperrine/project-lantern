"use client";

import { useState } from "react";
import { FIRST_PARTY_LIBRARY, type FirstPartyAsset } from "@/lib/first-party-library";
import type { CharacterArc, EndingType, GenrePreset, LengthTarget, NarrativeArchitecture } from "@/lib/types";

type MoodOption = {
  label: string;
  genrePreset: GenrePreset;
  seed: string;
  tone: string;
};

type DirectionInputs = {
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
  storyRules: string;
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: LengthTarget;
};

type LibraryTouchstone = Pick<FirstPartyAsset, "assetType" | "title" | "description" | "tags">;

type StoryDirection = {
  title: string;
  premise: string;
  tone: string;
  detail: string;
  libraryTouchstones: LibraryTouchstone[];
  inputs: DirectionInputs;
};

const MOOD_OPTIONS: MoodOption[] = [
  { label: "Scary", genrePreset: "Speculative Mystery", seed: "A quiet place becomes frightening when one ordinary detail starts changing after sunset.", tone: "tense, eerie, and intimate" },
  { label: "Mysterious", genrePreset: "Speculative Mystery", seed: "A missing clue draws the hero into a layered mystery where every answer changes the question.", tone: "curious, atmospheric, and clue-driven" },
  { label: "Adventurous", genrePreset: "Literary Science Fiction", seed: "A hidden route opens into a dangerous journey that asks the hero to be braver than expected.", tone: "fast-moving, wondrous, and daring" },
  { label: "Funny", genrePreset: "Contemporary Fantastical / Magical Realist", seed: "A small problem spirals into absurd consequences while the hero tries to keep life normal.", tone: "warm, playful, and lightly chaotic" },
  { label: "Thoughtful", genrePreset: "Contemporary Fantastical / Magical Realist", seed: "A quiet choice forces the hero to understand something they have avoided for a long time.", tone: "reflective, precise, and emotionally observant" },
  { label: "Emotional", genrePreset: "Contemporary Fantastical / Magical Realist", seed: "An old hurt resurfaces through a strange event that gives the hero one chance to say what matters.", tone: "heart-forward, tender, and cathartic" },
  { label: "Relaxing", genrePreset: "Contemporary Fantastical / Magical Realist", seed: "A gentle discovery in a familiar place helps the hero find steadiness and small enchantment.", tone: "soothing, sensory, and low-conflict" },
  { label: "Surprise Me", genrePreset: "Literary Science Fiction", seed: "A strange invitation arrives with a rule nobody understands and a reward nobody fully trusts.", tone: "unexpected, vivid, and genre-blending" }
];

const DEFAULT_MOOD = MOOD_OPTIONS[1];
const PLACEHOLDER_PROMPT = "I want a scary story, but not a slasher and no ghosts. Make the hero feel like me, and set it in the town where I used to live.";
const ASSET_TYPE_LABELS: Record<FirstPartyAsset["assetType"], string> = {
  character: "Character",
  world: "World",
  location: "Location",
  "story-spark": "Story spark",
  theme: "Theme",
  "series-seed": "Series seed",
  "craft-rule": "Craft rule"
};

export function ReaderMoodOnboarding() {
  const [selectedMood, setSelectedMood] = useState(DEFAULT_MOOD.label);
  const [readerPrompt, setReaderPrompt] = useState("");
  const [directions, setDirections] = useState<StoryDirection[]>([]);
  const [appliedDirectionTitle, setAppliedDirectionTitle] = useState("");

  const activeMood = MOOD_OPTIONS.find((mood) => mood.label === selectedMood) ?? DEFAULT_MOOD;

  function handleSuggestMatches() {
    setDirections(buildStoryDirections(activeMood, readerPrompt));
    setAppliedDirectionTitle("");
  }

  function handleUseDirection(direction: StoryDirection) {
    applyDirectionToGenerator(direction.inputs);
    setAppliedDirectionTitle(direction.title);
  }

  return (
    <section className="rounded-md border border-lantern-gold/35 bg-warm-paper p-5 text-primary-dark shadow-soft ring-1 ring-lantern-gold/10 md:p-7">
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aged-brass">Start with the reader</p>
        <h2 className="text-3xl font-semibold leading-tight text-primary-dark md:text-4xl">What are you in the mood for?</h2>
        <p className="max-w-3xl text-base leading-7 text-muted-light">Pick a mood or describe what you want and what to avoid. You will get three story directions before generation, with detailed controls still available below.</p>
      </div>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {MOOD_OPTIONS.map((mood) => (
          <button aria-pressed={selectedMood === mood.label} className={`min-h-11 flex-1 basis-[calc(50%-0.3125rem)] rounded-md border px-4 py-3 text-base font-semibold transition sm:flex-none sm:text-sm ${selectedMood === mood.label ? "border-primary-dark bg-primary-dark text-primary-light" : "border-primary-dark/15 bg-white/75 text-primary-dark hover:border-aged-brass hover:bg-soft-card"}`} key={mood.label} onClick={() => setSelectedMood(mood.label)} type="button">
            {mood.label}
          </button>
        ))}
      </div>
      <label className="mt-6 flex flex-col gap-2.5">
        <span className="text-base font-semibold text-primary-dark md:text-sm">Describe the story you want</span>
        <textarea className="min-h-36 rounded-md border border-primary-dark/15 bg-white px-4 py-3 text-base leading-7 text-primary-dark outline-none transition placeholder:text-primary-dark/35 focus:border-aged-brass focus:ring-2 focus:ring-aged-brass/20 md:text-sm md:leading-6" onChange={(event) => setReaderPrompt(event.target.value)} placeholder={PLACEHOLDER_PROMPT} value={readerPrompt} />
      </label>
      <button className="mt-5 min-h-12 w-full rounded-md bg-primary-dark px-5 py-3.5 text-base font-semibold text-primary-light transition hover:bg-primary-dark/90 sm:w-auto sm:text-sm" onClick={handleSuggestMatches} type="button">Suggest story matches</button>
      {appliedDirectionTitle ? <p className="mt-5 rounded-md border border-tide-teal/30 bg-tide-teal/10 px-4 py-3 text-sm font-semibold leading-6 text-tide-teal">Loaded "{appliedDirectionTitle}" into Create an Episode.</p> : null}
      {directions.length > 0 ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {directions.map((direction) => (
            <article className="flex min-h-full flex-col rounded-md border border-primary-dark/10 bg-soft-card p-5" key={direction.title}>
              <h3 className="text-lg font-semibold leading-7 text-primary-dark">{direction.title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted-light">{direction.premise}</p>
              <p className="mt-4 rounded-md bg-white/75 px-3 py-2.5 text-sm leading-6 text-muted-light"><span className="font-semibold text-primary-dark">Tone:</span> {direction.tone}</p>
              {direction.libraryTouchstones.length > 0 ? (
                <div className="mt-4 rounded-md border border-lantern-gold/25 bg-white/65 px-3 py-3 text-sm leading-6 text-muted-light">
                  <p className="font-semibold text-primary-dark">Library touchstones</p>
                  <ul className="mt-2 space-y-1.5">
                    {direction.libraryTouchstones.map((asset) => (
                      <li key={`${asset.assetType}-${asset.title}`}><span className="font-semibold text-primary-dark">{ASSET_TYPE_LABELS[asset.assetType]}:</span> {asset.title}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-4 text-sm leading-6 text-muted-light">{direction.detail}</p>
              <button className="mt-5 min-h-11 w-full rounded-md border border-aged-brass bg-white/80 px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-lantern-gold" onClick={() => handleUseDirection(direction)} type="button">Use this direction</button>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function buildStoryDirections(mood: MoodOption, readerPrompt: string): StoryDirection[] {
  const preference = readerPrompt.trim();
  const readerContext = preference || "No extra reader notes yet; keep the direction easy to personalize.";
  const personalTouchstones = compact([
    findLibraryAsset(FIRST_PARTY_LIBRARY.characters, mood, ["memory", "healing", "friendship"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.themes, mood, ["growth", "connection", "courage"])
  ]);
  const placeTouchstones = compact([
    findLibraryAsset(FIRST_PARTY_LIBRARY.worlds, mood, ["home", "coastal", "journey"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.locations, mood, ["threshold", "cozy", "choice"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.storySparks, mood, ["clue", "memory", "choice"])
  ]);
  const turnaboutTouchstones = compact([
    findLibraryAsset(FIRST_PARTY_LIBRARY.characters, mood, ["chaos", "wonder", "clues"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.worlds, mood, ["secrets", "science fiction", "magical realist"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.storySparks, mood, ["transformation", "revelation", "healing"]),
    findLibraryAsset(FIRST_PARTY_LIBRARY.themes, mood, ["change", "belonging", "courage"])
  ]);

  return [
    createStoryDirection({
      mood,
      readerContext,
      title: `${mood.label} Personal Mirror`,
      premise: `A ${mood.tone} episode where the hero's private worry becomes the key to the story's central turn.`,
      direction: "Make the hero's emotional situation echo the reader notes without requiring the reader to write the plot.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue",
      libraryTouchstones: personalTouchstones
    }),
    createStoryDirection({
      mood,
      readerContext,
      title: `${mood.label} Place With a Secret`,
      premise: "A familiar location becomes the story engine, with one hidden rule that changes what the hero notices first.",
      direction: "Use setting, memory, and specific avoidances from the reader notes as the strongest personalization signal.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Revelation with Cost",
      libraryTouchstones: placeTouchstones
    }),
    createStoryDirection({
      mood,
      readerContext,
      title: `${mood.label} Turnabout`,
      premise: "The episode starts where the reader expects, then pivots into a stranger or warmer version of that mood.",
      direction: "Honor the chosen mood while making the final movement surprising rather than predictable.",
      narrativeArchitecture: "Event Story",
      characterArc: "Disillusionment Arc",
      endingType: "Transformation without Victory",
      libraryTouchstones: turnaboutTouchstones
    })
  ];
}

function createStoryDirection({ characterArc, direction, endingType, libraryTouchstones, mood, narrativeArchitecture, premise, readerContext, title }: { characterArc: CharacterArc; direction: string; endingType: EndingType; libraryTouchstones: LibraryTouchstone[]; mood: MoodOption; narrativeArchitecture: NarrativeArchitecture; premise: string; readerContext: string; title: string }): StoryDirection {
  const librarySummary = formatLibraryTouchstones(libraryTouchstones);
  const libraryGuidance = formatLibraryGuidance(libraryTouchstones);
  const storySeed = `${mood.seed}\n\nReader mood: ${mood.label}.\nReader notes: ${readerContext}\nStory direction: ${premise}${libraryGuidance ? `\n\nFirst-party touchstones:\n${libraryGuidance}` : ""}`;
  return {
    title,
    premise,
    tone: mood.tone,
    detail: librarySummary ? `Blends ${librarySummary} with the reader's mood and notes.` : `Uses: ${readerContext}`,
    libraryTouchstones,
    inputs: {
      worldBible: `# ${title} Storyworld\n\nMood: ${mood.label}\nTone: ${mood.tone}\n\nReader preference:\n${readerContext}${libraryGuidance ? `\n\nFirst-party touchstones:\n${libraryGuidance}` : ""}\n\nWorld guidance:\nBuild a personalized entertainment setting around the reader notes. Treat concrete places, avoidances, or desired feelings as canon for this episode. If the reader did not name a place, use an intimate, easy-to-enter setting that supports the mood.`,
      characterProfiles: `## Reader-Shaped Lead\n\nFunction: A protagonist whose desire, fear, or ordinary routine reflects the reader preference.\nCore Desire: To move through a ${mood.label.toLowerCase()} situation without losing what matters personally.\nCore Fear: That the story pressure will expose something they are not ready to face.\nConflict Engine: The chosen mood tests the lead through choices, relationships, and discoveries instead of authorial plot chores.${libraryGuidance ? `\n\nUse these first-party touchstones as inspiration, adapting them around the reader:\n${libraryGuidance}` : ""}`,
      storySeed,
      storyRules: `Prioritize the reader mood onboarding direction.\nTone: ${mood.tone}.\nDirection: ${direction}${libraryGuidance ? `\nFirst-party touchstones: ${formatLibraryTouchstones(libraryTouchstones)}.` : ""}\nRespect reader avoidances and preferences from the free-form notes. Keep the result reader-first and episode-shaped, not a writing exercise.`,
      genrePreset: mood.genrePreset,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget: "Standard"
    }
  };
}

function findLibraryAsset<Asset extends LibraryTouchstone>(assets: Asset[], mood: MoodOption, preferredTags: string[]): Asset | undefined {
  const moodTag = normalizeTag(mood.label);
  return assets.find((asset) => asset.tags.some((tag) => normalizeTag(tag) === moodTag)) ?? assets.find((asset) => asset.tags.some((tag) => preferredTags.includes(normalizeTag(tag)))) ?? assets[0];
}

function normalizeTag(tag: string) {
  return tag.trim().toLowerCase();
}

function compact<T>(values: Array<T | undefined>): T[] {
  return values.filter((value): value is T => Boolean(value));
}

function formatLibraryTouchstones(assets: LibraryTouchstone[]) {
  return assets.map((asset) => `${ASSET_TYPE_LABELS[asset.assetType].toLowerCase()} ${asset.title}`).join(", ");
}

function formatLibraryGuidance(assets: LibraryTouchstone[]) {
  return assets.map((asset) => `- ${ASSET_TYPE_LABELS[asset.assetType]}: ${asset.title}. ${asset.description}`).join("\n");
}

function applyDirectionToGenerator(inputs: DirectionInputs) {
  const advancedControls = document.getElementById("advanced-story-controls");
  if (advancedControls instanceof HTMLDetailsElement) advancedControls.open = true;

  const workspace = document.getElementById("create-episode");
  if (!workspace) return;

  const textareas = Array.from(workspace.querySelectorAll("textarea"));
  setTextAreaValue(textareas[0], inputs.worldBible);
  setTextAreaValue(textareas[1], inputs.characterProfiles);
  setTextAreaValue(textareas[2], inputs.storySeed);
  setTextAreaValue(textareas[3], inputs.storyRules);
  setSelectValue(workspace, inputs.genrePreset);
  setSelectValue(workspace, inputs.narrativeArchitecture);
  setSelectValue(workspace, inputs.characterArc);
  setSelectValue(workspace, inputs.endingType);
  setSelectValue(workspace, inputs.lengthTarget);
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setTextAreaValue(textarea: HTMLTextAreaElement | undefined, value: string) {
  if (!textarea) return;
  setNativeValue(textarea, value);
}

function setSelectValue(workspace: HTMLElement, value: string) {
  const select = Array.from(workspace.querySelectorAll("select")).find((candidate) => Array.from(candidate.options).some((option) => option.value === value));
  if (!select) return;
  setNativeValue(select, value);
}

function setNativeValue(element: HTMLTextAreaElement | HTMLSelectElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(element), "value");
  if (descriptor?.set) descriptor.set.call(element, value);
  else element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}
