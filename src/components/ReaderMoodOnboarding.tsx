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

type StoryPitch = {
  title: string;
  premise: string;
  storyType: string;
  direction: string;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
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
  storyType: string;
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

const STORY_PITCHES: Record<string, StoryPitch[]> = {
  Scary: [
    {
      title: "The Porch Light That Blinked Back",
      premise: "A nervous teen housesits on the quietest street in town, then notices one porch light answering every question they whisper. By dawn, the pattern is leading them toward a locked room their family never talks about.",
      storyType: "Atmospheric dread mystery",
      direction: "Make the fear intimate and atmospheric, with the porch-light signal turning the reader's notes into the central emotional clue.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Positive Change Arc",
      endingType: "Revelation with Cost"
    },
    {
      title: "The Last Room at Blackwater Motel",
      premise: "A storm strands the hero at a nearly empty roadside motel where every guest insists they checked out years ago. The only way to leave is to solve what the room remembers about them.",
      storyType: "Contained supernatural suspense",
      direction: "Keep the suspense focused on place, memory, and avoidances from the reader notes without using gore or cheap shock.",
      narrativeArchitecture: "Event Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Goodnight House",
      premise: "Each night, a perfect version of the hero's childhood home appears at the end of the block. Inside, someone who sounds like family keeps inviting them to stay forever.",
      storyType: "Emotional haunted-home thriller",
      direction: "Blend fear with longing so the scary turn grows out of what the hero wants to believe is safe.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Disillusionment Arc",
      endingType: "Transformation without Victory"
    }
  ],
  Mysterious: [
    {
      title: "The Archive of Missing Tuesdays",
      premise: "A community library contains one shelf of records for Tuesdays that never happened. When the hero finds their own name in the newest folder, they have one day to discover who is editing the town's memory.",
      storyType: "Puzzle-box memory mystery",
      direction: "Build a solvable mystery around one hidden record that turns the reader's preferred details into evidence.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Revelation with Cost"
    },
    {
      title: "The Map in the Wrong Handwriting",
      premise: "A hand-drawn map appears in the hero's bag, labeled with places only they should know. Every stop reveals a secret someone else has been carrying on their behalf.",
      storyType: "Personal clue trail",
      direction: "Use the reader notes as landmarks, clues, or emotional constraints in a mystery that stays personal instead of procedural.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Neighbor Who Never Was",
      premise: "Everyone remembers the kindly neighbor at number nine except the hero, and the neighbor's house has never existed on any city record. The search for proof uncovers a bargain the whole block once agreed to forget.",
      storyType: "Neighborhood secret mystery",
      direction: "Make the mystery strange, emotional, and non-murderous, with each answer changing the question.",
      narrativeArchitecture: "Event Story",
      characterArc: "Disillusionment Arc",
      endingType: "Transformation without Victory"
    }
  ],
  Adventurous: [
    {
      title: "The Door Beneath Platform Seven",
      premise: "A delayed train reveals a hidden platform that only opens for people who are running from the wrong future. The hero joins a tiny crew racing through impossible stations before the timetable erases them.",
      storyType: "Portal adventure",
      direction: "Make the journey fast, wondrous, and choice-driven, with the reader's notes shaping what future the hero refuses.",
      narrativeArchitecture: "Event Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Skyship Built from Borrowed Things",
      premise: "When the town's gravity fails, the hero helps launch a patched-together skyship made from stolen doors, old promises, and one dangerous secret. Every mile upward asks who they trust enough to bring home.",
      storyType: "Found-crew quest",
      direction: "Lean into found crew, daring movement, and a big choice where courage matters more than strength.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Transformation without Victory"
    },
    {
      title: "The Island That Moves at Sunrise",
      premise: "A message in a tidepool points the hero toward an island that appears in a different sea every morning. To rescue someone stranded there, they must learn the island's rule before sunrise chooses for them.",
      storyType: "Wonder-and-danger expedition",
      direction: "Use a vivid route, a ticking clock, and sensory adventure grounded by the reader's desired feeling.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Revelation with Cost"
    }
  ],
  Funny: [
    {
      title: "The Day the Rules Got Embarrassed",
      premise: "A normal morning goes sideways when every rule the hero has ever followed starts apologizing out loud. Getting through lunch becomes a ridiculous negotiation with gravity, manners, and one very needy stop sign.",
      storyType: "Low-stakes magical comedy",
      direction: "Keep the humor warm and absurd, with one tiny problem spiraling through normal life in increasingly personal ways.",
      narrativeArchitecture: "Event Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Substitute Familiar",
      premise: "The hero accidentally receives a temporary magical assistant who is extremely powerful and terrible at basic chores. Their simple errand becomes a public-relations crisis for every broom, kettle, and houseplant nearby.",
      storyType: "Awkward magic romp",
      direction: "Make the comedy come from mismatched magical help, social awkwardness, and a warm ending rather than mean jokes.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Extremely Serious Quest for Soup",
      premise: "A craving for soup sends the hero into a citywide chain of mistaken identities, dramatic prophecies, and one chef who may be a minor deity. The fate of dinner has never seemed more overqualified.",
      storyType: "Cozy absurd quest",
      direction: "Treat tiny stakes with epic seriousness while letting the reader notes personalize the setting and comfort food of the story.",
      narrativeArchitecture: "Event Story",
      characterArc: "Disillusionment Arc",
      endingType: "Transformation without Victory"
    }
  ],
  Thoughtful: [
    {
      title: "The Museum of Almosts",
      premise: "The hero discovers a quiet museum where every exhibit shows a life they nearly lived. One room keeps changing, asking them to choose what they are finally ready to stop carrying.",
      storyType: "Reflective magical realism",
      direction: "Center the story on a quiet choice, using the reader notes to define what the hero has avoided and what they might release.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Street That Waited",
      premise: "An old street returns exactly as it was on the day the hero left something unsaid. Walking its length lets them revisit small moments, but only one can be changed before the street disappears.",
      storyType: "Memory-place character story",
      direction: "Make setting and memory do the emotional work, with small details carrying the weight of the reader's preferences.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Revelation with Cost"
    },
    {
      title: "The Machine for Gentle Questions",
      premise: "A retired inventor leaves behind a machine that answers only questions asked kindly. The hero thinks they need information, but each answer points toward the conversation they have been avoiding.",
      storyType: "Soft speculative introspection",
      direction: "Use a subtle speculative idea to make an ordinary feeling easier to see without turning the story into an essay.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Disillusionment Arc",
      endingType: "Transformation without Victory"
    }
  ],
  Emotional: [
    {
      title: "The Letter That Waited Ten Years",
      premise: "A letter arrives with tomorrow's postmark and the handwriting of someone the hero thought they had lost. It offers one impossible meeting, but only if they tell the truth they avoided the first time.",
      storyType: "Second-chance emotional fantasy",
      direction: "Give the hero a second chance to say something honest, shaped by the reader's notes and protected from easy sentimentality.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Room Where Goodbyes Stay Warm",
      premise: "Behind a laundromat dryer, the hero finds a room where unfinished goodbyes wait as living sparks. To leave with one, they must help someone else make peace first.",
      storyType: "Tender healing story",
      direction: "Make healing earned, tender, and specific, with catharsis growing through an act of care.",
      narrativeArchitecture: "Event Story",
      characterArc: "Positive Change Arc",
      endingType: "Transformation without Victory"
    },
    {
      title: "When the Lake Gave Back Names",
      premise: "Once a year, the lake returns a name someone tried to forget. This year it returns the hero's, tied to a promise they are not sure they deserve to keep.",
      storyType: "Bittersweet memory fable",
      direction: "Let the story be emotional and bittersweet but not hopeless, with the reader's notes shaping the promise at the center.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Disillusionment Arc",
      endingType: "Revelation with Cost"
    }
  ],
  Relaxing: [
    {
      title: "The Midnight Tea Garden",
      premise: "A hidden garden opens after midnight for people who cannot sleep. The hero tends one glowing plant, and each small act of care makes tomorrow feel a little less heavy.",
      storyType: "Cozy low-conflict wonder",
      direction: "Keep the conflict soft, sensory, and manageable, using the reader notes to personalize what steadiness feels like.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "The Bookshop That Shelves Tomorrow",
      premise: "A tiny bookshop files tomorrow's worries on the wrong shelf, giving the hero one peaceful afternoon to rearrange them. Each book they move changes a small piece of the coming day.",
      storyType: "Gentle magical realist comfort",
      direction: "Use one small magical rule to turn an ordinary day into a soothing, meaningful episode.",
      narrativeArchitecture: "Event Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Resolution with Residue"
    },
    {
      title: "A Harbor for Tired Stars",
      premise: "Every evening, fallen stars drift into a quiet harbor to rest. The hero becomes the temporary keeper of one dim star and learns how to let light return slowly.",
      storyType: "Restorative sensory fable",
      direction: "Favor calm pacing, kindness, and wonder, with the reader's notes guiding the place that feels most restorative.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Positive Change Arc",
      endingType: "Transformation without Victory"
    }
  ],
  "Surprise Me": [
    {
      title: "The Invitation with No Sender",
      premise: "An invitation appears for an event that already happened tomorrow, addressed to the hero by a name they have never used. Attending means accepting one rule nobody can explain until it is too late to leave unchanged.",
      storyType: "Genre-blending speculative mystery",
      direction: "Start with a strange invitation and take the story somewhere vivid, surprising, and emotionally grounded.",
      narrativeArchitecture: "Revelation Story",
      characterArc: "Disillusionment Arc",
      endingType: "Revelation with Cost"
    },
    {
      title: "The Weather Inside the Elevator",
      premise: "A broken elevator begins opening onto tiny rooms of impossible weather: rain for apologies, snow for secrets, heat lightning for choices. The hero has twelve floors to discover why it chose them.",
      storyType: "Surreal emotional adventure",
      direction: "Blend genres around one wild rule, letting each impossible floor reveal an emotional cost or gift.",
      narrativeArchitecture: "Event Story",
      characterArc: "Positive Change Arc",
      endingType: "Transformation without Victory"
    },
    {
      title: "The Town That Changed Genres",
      premise: "At sunrise, the hero's town becomes a new kind of story: mystery by breakfast, romance by noon, space opera by dinner. To get one person home, they must find the feeling that stays true across every version.",
      storyType: "Playful genre-shift adventure",
      direction: "Make the surprise vivid and genre-blending while keeping the hero's personal need clear.",
      narrativeArchitecture: "Character Transformation Story",
      characterArc: "Flat / Testing Arc",
      endingType: "Resolution with Residue"
    }
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
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  const activeMood = MOOD_OPTIONS.find((mood) => mood.label === selectedMood);
  const directions = activeMood ? buildStoryDirections(activeMood, readerPrompt) : [];
  const activeDirection = directions[suggestionIndex % Math.max(directions.length, 1)];

  function handleMoodSelection(mood: MoodOption) {
    setSelectedMood(mood.label);
    setReaderPrompt("");
    setSuggestionIndex(0);
  }

  function handleReaderPromptChange(value: string) {
    setReaderPrompt(value);
  }

  function handleAnotherIdea() {
    if (!directions.length) return;
    setSuggestionIndex((currentIndex) => (currentIndex + 1) % directions.length);
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
          <p className="max-w-3xl text-base leading-7 text-muted-dark">Pick a mood and Project Lantern will tee up one story you can start immediately. Add details only if you want the idea shaped closer to you.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          {MOOD_OPTIONS.map((mood) => (
            <button aria-pressed={selectedMood === mood.label} className={`min-h-11 flex-1 basis-[calc(50%-0.3125rem)] rounded-md border px-4 py-3 text-base font-semibold shadow-sm transition sm:flex-none sm:text-sm ${selectedMood === mood.label ? "border-lantern-gold bg-lantern-gold text-primary-dark shadow-[0_10px_28px_rgba(217,164,65,0.22)]" : "border-warm-paper/15 bg-deep-navy/80 text-muted-dark hover:border-aged-brass hover:bg-deep-navy hover:text-primary-light"}`} key={mood.label} onClick={() => handleMoodSelection(mood)} type="button">
              {mood.label}
            </button>
          ))}
        </div>
      </div>
      {activeMood && activeDirection ? (
        <div className="px-5 py-5 md:px-7 md:py-6">
          <article className="rounded-md border border-lantern-gold/25 bg-deep-navy/85 p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lantern-gold">Recommended Story</p>
                <h3 className="mt-2 text-2xl font-semibold leading-8 text-primary-light">{activeDirection.title}</h3>
              </div>
              <p className="w-fit rounded-md border border-sea-glass/35 bg-sea-glass/10 px-3 py-2 text-xs font-semibold leading-5 text-sea-glass">{activeDirection.storyType}</p>
            </div>
            <p className="mt-4 text-base leading-7 text-muted-dark">{activeDirection.premise}</p>
            <p className="mt-4 rounded-md border border-aged-brass/25 bg-night-ink/70 px-3 py-2.5 text-sm leading-6 text-muted-dark"><span className="font-semibold text-lantern-gold">Tone:</span> {activeDirection.tone}</p>
            {activeDirection.libraryTouchstones.length > 0 ? (
              <div className="mt-4 rounded-md border border-sea-glass/25 bg-sea-glass/10 px-3 py-3 text-sm leading-6 text-muted-dark">
                <p className="font-semibold text-sea-glass">Library touchstones</p>
                <ul className="mt-2 space-y-1.5">
                  {activeDirection.libraryTouchstones.map((asset) => (
                    <li key={`${asset.assetType}-${asset.title}`}><span className="font-semibold text-primary-light">{ASSET_TYPE_LABELS[asset.assetType]}:</span> {asset.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="mt-4 text-sm leading-6 text-muted-dark">{activeDirection.detail}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="min-h-12 rounded-md bg-lantern-gold px-5 py-3.5 text-base font-semibold text-primary-dark shadow-[0_12px_32px_rgba(217,164,65,0.22)] transition hover:bg-aged-brass hover:text-primary-light sm:text-sm" onClick={() => handleGenerateDirection(activeDirection)} type="button">Start this story</button>
              <button className="min-h-12 rounded-md border border-aged-brass/70 bg-night-ink/70 px-5 py-3.5 text-base font-semibold text-lantern-gold transition hover:border-lantern-gold hover:bg-deep-navy hover:text-primary-light sm:text-sm" onClick={handleAnotherIdea} type="button">Another idea</button>
            </div>
          </article>
          <label className="mt-4 flex flex-col gap-2.5 rounded-md border border-warm-paper/10 bg-deep-navy/70 px-4 py-4">
            <span className="text-base font-semibold text-warm-paper md:text-sm">Optional details <span className="font-normal text-muted-dark">shape this suggestion and the story it starts</span></span>
            <textarea className="min-h-24 rounded-md border border-aged-brass/35 bg-warm-paper px-4 py-3 text-base leading-7 text-primary-dark shadow-inner outline-none transition placeholder:text-muted-light focus:border-lantern-gold focus:ring-2 focus:ring-lantern-gold/30 md:text-sm md:leading-6" onChange={(event) => handleReaderPromptChange(event.target.value)} placeholder={PLACEHOLDER_PROMPT} value={readerPrompt} />
          </label>
        </div>
      ) : null}
    </section>
  );
}

function buildStoryDirections(mood: MoodOption, readerPrompt: string): StoryDirection[] {
  const preference = readerPrompt.trim();
  const readerContext = preference || "No extra reader notes yet; keep the direction easy to personalize.";
  const touchstoneSets = [
    compact([
      findLibraryAsset(FIRST_PARTY_LIBRARY.characters, mood, ["memory", "healing", "friendship"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.themes, mood, ["growth", "connection", "courage"])
    ]),
    compact([
      findLibraryAsset(FIRST_PARTY_LIBRARY.worlds, mood, ["home", "coastal", "journey"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.locations, mood, ["threshold", "cozy", "choice"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.storySparks, mood, ["clue", "memory", "choice"])
    ]),
    compact([
      findLibraryAsset(FIRST_PARTY_LIBRARY.characters, mood, ["chaos", "wonder", "clues"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.worlds, mood, ["secrets", "science fiction", "magical realist"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.storySparks, mood, ["transformation", "revelation", "healing"]),
      findLibraryAsset(FIRST_PARTY_LIBRARY.themes, mood, ["change", "belonging", "courage"])
    ])
  ];

  const pitches = STORY_PITCHES[mood.label] ?? STORY_PITCHES[DEFAULT_MOOD.label];
  return pitches.map((pitch, index) => createStoryDirection({
    mood,
    readerContext,
    pitch,
    libraryTouchstones: touchstoneSets[index % touchstoneSets.length]
  }));
}

function createStoryDirection({ libraryTouchstones, mood, pitch, readerContext }: { libraryTouchstones: LibraryTouchstone[]; mood: MoodOption; pitch: StoryPitch; readerContext: string }): StoryDirection {
  const librarySummary = formatLibraryTouchstones(libraryTouchstones);
  const libraryGuidance = formatLibraryGuidance(libraryTouchstones);
  const storySeed = `${mood.seed}\n\nReader mood: ${mood.label}.\nReader notes: ${readerContext}\nStory pitch: ${pitch.title}. ${pitch.premise}${libraryGuidance ? `\n\nFirst-party touchstones:\n${libraryGuidance}` : ""}`;
  return {
    title: pitch.title,
    premise: pitch.premise,
    storyType: pitch.storyType,
    tone: mood.tone,
    detail: librarySummary ? `Blends ${librarySummary} with the selected mood and optional reader notes.` : `Uses: ${readerContext}`,
    libraryTouchstones,
    inputs: {
      worldBible: `# ${pitch.title} Storyworld\n\nMood: ${mood.label}\nStory type: ${pitch.storyType}\nTone: ${mood.tone}\n\nReader preference:\n${readerContext}${libraryGuidance ? `\n\nFirst-party touchstones:\n${libraryGuidance}` : ""}\n\nWorld guidance:\nBuild a personalized entertainment setting around this specific story pitch. Treat concrete places, avoidances, or desired feelings from the reader notes as canon for this episode. If the reader did not add details, keep the setting vivid, accessible, and aligned to the selected mood.`,
      characterProfiles: `## Reader-Shaped Lead\n\nFunction: A protagonist whose desire, fear, or ordinary routine reflects the reader preference.\nCore Desire: To move through ${pitch.title} without losing what matters personally.\nCore Fear: That the story pressure will expose something they are not ready to face.\nConflict Engine: The selected pitch tests the lead through choices, relationships, and discoveries instead of authorial plot chores.${libraryGuidance ? `\n\nUse these first-party touchstones as inspiration, adapting them around the reader:\n${libraryGuidance}` : ""}`,
      storySeed,
      storyRules: `Prioritize the reader mood onboarding pitch.\nTitle: ${pitch.title}.\nPremise: ${pitch.premise}\nStory type: ${pitch.storyType}.\nTone: ${mood.tone}.\nDirection: ${pitch.direction}${libraryGuidance ? `\nFirst-party touchstones: ${formatLibraryTouchstones(libraryTouchstones)}.` : ""}\nRespect reader avoidances and preferences from the free-form notes. Keep the result reader-first and episode-shaped, not a writing exercise.`,
      genrePreset: mood.genrePreset,
      narrativeArchitecture: pitch.narrativeArchitecture,
      characterArc: pitch.characterArc,
      endingType: pitch.endingType,
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
