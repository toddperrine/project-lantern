export type BasicPlotPattern = {
  id: string;
  label: string;
  guidance: string;
};

export type TransformationArcStage = {
  id: string;
  label: string;
  guidance: string;
};

export type WonderCraftDimension = {
  id: string;
  label: string;
  guidance: string;
};

export type SeriesContinuitySignal = {
  id: string;
  label: string;
  guidance: string;
};

export const BASIC_PLOT_PATTERNS: BasicPlotPattern[] = [
  {
    id: "overcoming-the-monster",
    label: "Overcoming the monster",
    guidance: "A visible or hidden force threatens the character or world; the story should reveal the cost of confronting it rather than simply defeating it."
  },
  {
    id: "rags-to-riches",
    label: "Rags to riches",
    guidance: "A character gains access, power, belonging, or recognition; the story should test whether the gain changes the character or exposes a deeper lack."
  },
  {
    id: "quest",
    label: "Quest",
    guidance: "A character pursues a concrete object, person, place, answer, or repair; the path should transform the goal and the seeker."
  },
  {
    id: "voyage-and-return",
    label: "Voyage and return",
    guidance: "A character crosses into an unfamiliar order and comes back altered; the return should make the original world feel changed."
  },
  {
    id: "comedy",
    label: "Comedy",
    guidance: "Misalignment, disguise, confusion, or social pressure escalates until a new arrangement becomes possible."
  },
  {
    id: "tragedy",
    label: "Tragedy",
    guidance: "A desire, flaw, bargain, or refusal narrows the character's choices until the cost becomes irreversible."
  },
  {
    id: "rebirth",
    label: "Rebirth",
    guidance: "A character or place is trapped in a dead pattern; the story should force a painful awakening, release, or reconstitution."
  },
  {
    id: "mixed-other",
    label: "Mixed / other",
    guidance: "Use a hybrid shape when the material resists a single pattern; make the dominant emotional movement clear."
  }
];

export const TRANSFORMATION_ARC_STAGES: TransformationArcStage[] = [
  {
    id: "departure",
    label: "Departure",
    guidance: "Open with pressure that makes the familiar world unstable or insufficient."
  },
  {
    id: "threshold",
    label: "Threshold",
    guidance: "Force the character across a boundary into a place, rule, relationship, or choice they cannot fully control."
  },
  {
    id: "ordeal",
    label: "Ordeal",
    guidance: "Make the middle test the character's desire, fear, blind spot, and loyalty through concrete action."
  },
  {
    id: "return-transformation",
    label: "Return / transformation",
    guidance: "End with a visible change in the character and world; the ending should carry residue, not simple victory."
  }
];

export const WONDER_CRAFT_DIMENSIONS: WonderCraftDimension[] = [
  {
    id: "strangeness",
    label: "Strangeness",
    guidance: "Let the impossible arrive through image, behavior, artifact, place, or consequence before explanation."
  },
  {
    id: "world-texture",
    label: "World texture",
    guidance: "Use concrete local details, objects, rituals, weather, work, sound, food, rooms, tools, and surfaces."
  },
  {
    id: "emotional-resonance",
    label: "Emotional resonance",
    guidance: "Anchor the speculative pressure in a want, wound, relationship, memory, or private fear."
  },
  {
    id: "ecology-of-setting",
    label: "Ecology of setting",
    guidance: "Make the setting behave like an interdependent system where changes have material consequences."
  },
  {
    id: "image-logic",
    label: "Image logic",
    guidance: "Let recurring images mutate across the story so the ending feels earned rather than explained."
  },
  {
    id: "surprise-awe",
    label: "Surprise / awe",
    guidance: "Use surprise to deepen meaning, not merely twist events; the revelation should widen the world and sharpen the cost."
  }
];

export const SERIES_CONTINUITY_SIGNALS: SeriesContinuitySignal[] = [
  {
    id: "character",
    label: "Character",
    guidance: "Leave at least one character with a changed desire, unanswered pressure, or new role that could sustain another story."
  },
  {
    id: "place",
    label: "Place",
    guidance: "Make the setting retain memory of what happened so a future story can return to an altered location."
  },
  {
    id: "unresolved-desire",
    label: "Unresolved desire",
    guidance: "Resolve the central event while leaving a specific desire, question, debt, or promise alive."
  },
  {
    id: "recurring-motif",
    label: "Recurring motif",
    guidance: "Preserve one concrete motif, object, phrase, sound, image, or ritual that can recur with new meaning."
  },
  {
    id: "build-on-this-story-readiness",
    label: "Build-on-this-story readiness",
    guidance: "End in a way that supports continuation around a character, place, object, rule, or consequence without requiring a cliffhanger."
  }
];

export function formatStoryCraftGuidance(): string {
  return `Foundational story craft guidance:

Plot architecture:
${formatGuidanceList(BASIC_PLOT_PATTERNS)}

Transformation arc:
${formatGuidanceList(TRANSFORMATION_ARC_STAGES)}

Wonder and speculative craft:
${formatGuidanceList(WONDER_CRAFT_DIMENSIONS)}

Series continuity:
${formatGuidanceList(SERIES_CONTINUITY_SIGNALS)}

Use this as an additive craft layer. Do not force every story into one formula. Choose the dominant pattern that best serves the uploaded world, characters, seed, selected architecture, character arc, ending type, and age/length fit. The final story should resolve its central event while preserving a living thread for future continuation.`;
}

function formatGuidanceList<T extends { label: string; guidance: string }>(items: T[]): string {
  return items.map((item) => `- ${item.label}: ${item.guidance}`).join("\n");
}
