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

type PromptSuggestion = {
  label: string;
  prompt: string;
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

const PROMPT_SUGGESTIONS: Record<string, PromptSuggestion[]> = {
  Scary: [
    { label: "No gore", prompt: "Make it scary through atmosphere and dread, but avoid gore, slashers, and ghosts." },
    { label: "Small town", prompt: "Set the scary story in a familiar small town where one ordinary place feels wrong after dark." },
    { label: "Brave hero", prompt: "Give me a scared but brave hero who has to protect someone they care about." }
  ],
  Mysterious: [
    { label: "Hidden clue", prompt: "Build the mystery around one hidden clue that changes what everyone thought happened." },
    { label: "Family secret", prompt: "Make the mystery personal, with a family secret and a discovery in an old place." },
    { label: "No murder", prompt: "Keep it mysterious without murder; make the central question strange, emotional, and solvable." }
  ],
  Adventurous: [
    { label: "Secret route", prompt: "Send the hero through a secret route that opens into a dangerous, wondrous place." },
    { label: "Found crew", prompt: "Make it an adventure about a small found crew learning to trust each other." },
    { label: "Big choice", prompt: "Give the adventure one thrilling choice where courage matters more than strength." }
  ],
  Funny: [
    { label: "Low stakes", prompt: "Keep it funny and low-stakes, with a tiny problem spiraling into ridiculous consequences." },
    { label: "Awkward magic", prompt: "Make the humor come from awkward magical rules interrupting normal life." },
    { label: "Warm ending", prompt: "Make it playful and weird, but let the ending feel warm instead of mean." }
  ],
  Thoughtful: [
    { label: "Quiet choice", prompt: "Center the story on a quiet choice that helps the hero understand what they have been avoiding." },
    { label: "Memory place", prompt: "Set it in a place full of memory, where small details carry emotional weight." },
    { label: "Soft sci-fi", prompt: "Use a subtle speculative idea to make an ordinary feeling easier to see." }
  ],
  Emotional: [
    { label: "Second chance", prompt: "Give the hero a second chance to say something honest to someone who matters." },
    { label: "Healing", prompt: "Make it tender and cathartic, with healing that feels earned rather than easy." },
    { label: "Bittersweet", prompt: "Let the story be emotional and bittersweet, but not hopeless." }
  ],
  Relaxing: [
    { label: "Cozy place", prompt: "Set it in a cozy, sensory place where a gentle discovery helps the hero feel steady." },
    { label: "Low conflict", prompt: "Keep conflict soft and manageable, with wonder, kindness, and a calm ending." },
    { label: "Small magic", prompt: "Use one small magical detail to make an ordinary day feel meaningful." }
  ],
  "Surprise Me": [
    { label: "Strange invite", prompt: "Start with a strange invitation and take the story somewhere vivid and unexpected." },
    { label: "Genre twist", prompt: "Blend genres in a surprising way while keeping the hero emotionally grounded." },
    { label: "Wild rule", prompt: "Give the world one wild rule nobody understands at first, then reveal its cost." }
  ]
};

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
  const [selectedMood, setSelectedMood] = useState("");
  const [readerPrompt, setReaderPrompt] = useState("");
  const [directions, setDirections] = useState<StoryDirection[]>([]);

  const activeMood = MOOD_OPTIONS.find((mood) => mood.label === selectedMood);
  const promptSuggestions = activeMood ? PROMPT_SUGGESTIONS[activeMood.label] ?? [] : [];

  function handleMoodSelection(mood: MoodOption) {
    setSelectedMood(mood.label);
    setReaderPrompt("");
    setDirections(mood.label === "Surprise Me" ? buildStoryDirections(mood, "") : []);
  }

  function handlePromptSuggestion(prompt: string) {
    setReaderPrompt(prompt);
    setDirections([]);
  }

  function handleSuggestMatches() {
    if (!activeMood) return;
    setDirections(buildStoryDirections(activeMood, readerPrompt));
  }

  function handleGenerateDirection(direction: StoryDirection) {
    generateDirectionStory(direction.inputs);
  }

  return (
    <section className="overflow-hidden rounded-md border border-lantern-gold/30 bg-night-ink text-primary-light shadow-soft ring-1 ring-lantern-gold/15 md:bg-[radial-gradient(circle_at_top_left,rgba(217,164,65,0.18),transparent_36%),linear-gradient(135deg,#0B1020_0%,#111827_52%,#21170f_100%)]">
      <div className="border-b border-warm-paper/10 px-5 py-6 md:px-7 md:py-7">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold">Start with the reader</p>
          <h2 className="text-3xl font-semibold leading-tight text-primary-light md:text-4xl">What are you in the mood for?</h2>
          <p className="max-w-3xl text-base leading-7 text-muted-dark">Pick a mood first. Then use a quick suggestion or add optional details only if you want a more specific story.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {MOOD_OPTIONS.map((mood) => (
            <button aria-pressed={selectedMood === mood.label} className={`min-h-11 flex-1 basis-[calc(50%-0.3125rem)] rounded-md border px-4 py-3 text-base font-semibold shadow-sm transition sm:flex-none sm:text-sm ${selectedMood === mood.label ? "border-lantern-gold bg-lantern-gold text-primary-dark shadow-[0_10px_28px_rgba(217,164,65,0.22)]" : "border-warm-paper/15 bg-deep-navy/80 text-muted-dark hover:border-aged-brass hover:bg-deep-navy hover:text-primary-light"}`} key={mood.label} onClick={() => handleMoodSelection(mood)} type="button">
              {mood.label}
            </button>
          ))}
        </div>
      </div>
      {activeMood ? (
        <div className="px-5 py-5 md:px-7 md:py-6">
          <div className="rounded-md border border-warm-paper/10 bg-deep-navy/70 px-4 py-4">
            <p className="text-base font-semibold text-warm-paper md:text-sm">Try one of these</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {promptSuggestions.map((suggestion) => (
                <button aria-label={`Use prompt: ${suggestion.prompt}`} className="rounded-md border border-aged-brass/45 bg-night-ink/70 px-3 py-2 text-sm font-semibold leading-5 text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy hover:text-primary-light" key={suggestion.label} onClick={() => handlePromptSuggestion(suggestion.prompt)} type="button">
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
          <label className="mt-4 flex flex-col gap-2.5">
            <span className="text-base font-semibold text-warm-paper md:text-sm">Describe exactly what you want <span className="font-normal text-muted-dark">optional</span></span>
            <textarea className="min-h-24 rounded-md border border-aged-brass/35 bg-warm-paper px-4 py-3 text-base leading-7 text-primary-dark shadow-inner outline-none transition placeholder:text-muted-light focus:border-lantern-gold focus:ring-2 focus:ring-lantern-gold/30 md:text-sm md:leading-6" onChange={(event) => setReaderPrompt(event.target.value)} placeholder={PLACEHOLDER_PROMPT} value={readerPrompt} />
          </label>
          <button className="mt-5 min-h-12 w-full rounded-md bg-lantern-gold px-5 py-3.5 text-base font-semibold text-primary-dark shadow-[0_12px_32px_rgba(217,164,65,0.22)] transition hover:bg-aged-brass hover:text-primary-light sm:w-auto sm:text-sm" onClick={handleSuggestMatches} type="button">Suggest story matches</button>
          {directions.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {directions.map((direction) => (
                <article className="flex min-h-full flex-col rounded-md border border-lantern-gold/20 bg-deep-navy/85 p-5 shadow-soft" key={direction.title}>
                  <h3 className="text-lg font-semibold leading-7 text-primary-light">{direction.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-dark">{direction.premise}</p>
                  <p className="mt-4 rounded-md border border-aged-brass/25 bg-night-ink/70 px-3 py-2.5 text-sm leading-6 text-muted-dark"><span className="font-semibold text-lantern-gold">Tone:</span> {direction.tone}</p>
                  {direction.libraryTouchstones.length > 0 ? (
                    <div className="mt-4 rounded-md border border-sea-glass/25 bg-sea-glass/10 px-3 py-3 text-sm leading-6 text-muted-dark">
                      <p className="font-semibold text-sea-glass">Library touchstones</p>
                      <ul className="mt-2 space-y-1.5">
                        {direction.libraryTouchstones.map((asset) => (
                          <li key={`${asset.assetType}-${asset.title}`}><span className="font-semibold text-primary-light">{ASSET_TYPE_LABELS[asset.assetType]}:</span> {asset.title}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <p className="mt-4 text-sm leading-6 text-muted-dark">{direction.detail}</p>
                  <button className="mt-5 min-h-11 w-full rounded-md border border-lantern-gold/65 bg-lantern-gold px-4 py-3 text-sm font-semibold text-primary-dark transition hover:bg-aged-brass hover:text-primary-light" onClick={() => handleGenerateDirection(direction)} type="button">Generate this story</button>
                </article>
              ))}
            </div>
          ) : null}
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

function generateDirectionStory(inputs: DirectionInputs) {
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
  clickGenerateButton(workspace);
}

function clickGenerateButton(workspace: HTMLElement) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const generateButton = Array.from(workspace.querySelectorAll("button")).find((button) => button.textContent?.trim() === "Generate Story");
      if (generateButton instanceof HTMLButtonElement && !generateButton.disabled) generateButton.click();
    });
  });
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
