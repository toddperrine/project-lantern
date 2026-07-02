export type StoryTypeChip = {
  id: string;
  label: string;
  guidance: string;
  keywords: string[];
};

export const STORY_TYPE_CHIPS = [
  { id: "small-town-dread", label: "Small-Town Dread", guidance: "Ordinary towns, neighborhoods, schools, roads, or families hiding something rotten beneath the surface.", keywords: ["dread", "eerie", "small town", "secrets", "horror"] },
  { id: "gothic-shadows", label: "Gothic Shadows", guidance: "Old houses, old guilt, decay, obsession, inheritance, locked rooms, portraits, letters, and old sins.", keywords: ["gothic", "eerie", "dark", "horror"] },
  { id: "uncanny", label: "Uncanny", guidance: "Familiar people, rooms, objects, routines, or animals made subtly wrong.", keywords: ["uncanny", "unsettling", "eerie", "creepy"] },
  { id: "cosmic-horror", label: "Cosmic Horror", guidance: "Human life brushing against something vast, ancient, indifferent, or impossible to understand.", keywords: ["cosmic horror", "impossible", "ancient", "reality", "dread"] },
  { id: "weird-nature", label: "Weird Nature", guidance: "Forests, trails, animals, weather, water, fungus, or landscapes behaving with alien intention.", keywords: ["weird", "nature", "eerie", "unsettling", "ecological horror"] },
  { id: "haunted-past", label: "Haunted Past", guidance: "Memory, grief, guilt, family history, old violence, or buried truth returning.", keywords: ["haunted", "dark", "memory", "guilt", "eerie"] },
  { id: "creature-unease", label: "Creature Unease", guidance: "Something living is watching, changing, imitating, nesting, hunting, or learning.", keywords: ["creature", "creepy", "unsettling", "horror"] },
  { id: "dark-fairy-tale", label: "Dark Fairy Tale", guidance: "Folklore rules, bargains, woods, thresholds, transformations, beautiful cruelty, and storybook logic turned dangerous.", keywords: ["dark fairy tale", "folklore", "eerie", "unsettling"] },
  { id: "psychological-dread", label: "Psychological Dread", guidance: "Paranoia, obsession, identity fracture, unreliable perception, guilt, or emotional collapse.", keywords: ["psychological dread", "paranoia", "unsettling", "dark"] },
  { id: "no-exit-dread", label: "No-Exit Dread", guidance: "Trapped systems and sealed places where escape is impossible or the environment itself turns hostile: spaceships, submarines, underwater labs, bunkers, mines, research stations, sealed apartment towers, storm-locked hospitals.", keywords: ["no-exit dread", "no exit dread", "trapped", "sealed", "escape", "spaceship", "submarine", "bunker", "mine", "research station", "hostile environment", "survival confinement"] }
] as const satisfies readonly StoryTypeChip[];

export type StoryTypeChipId = (typeof STORY_TYPE_CHIPS)[number]["id"];

export function getStoryTypeChipById(id: string): StoryTypeChip | null {
  return STORY_TYPE_CHIPS.find((chip) => chip.id === id) ?? null;
}

const GENERIC_STORY_TYPE_MATCH_TERMS = new Set(["dark", "dread", "eerie", "horror", "unsettling", "creepy"]);

export function getStoryTypeTextCompatibility(chip: StoryTypeChip, text: string): { compatible: boolean; result: string } {
  const haystack = text.toLowerCase();
  const labelMatched = haystack.includes(chip.label.toLowerCase()) || haystack.includes(chip.id.replace(/-/g, " "));
  const matchedKeywords = chip.keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
  const specificMatches = matchedKeywords.filter((keyword) => !GENERIC_STORY_TYPE_MATCH_TERMS.has(keyword.toLowerCase()));

  if (labelMatched) return { compatible: true, result: `compatible: matched selected chip label/id (${chip.id})` };
  if (specificMatches.length) return { compatible: true, result: `compatible: matched selected chip keyword(s): ${specificMatches.join(", ")}` };
  if (matchedKeywords.length) return { compatible: false, result: `not compatible: only generic overlap (${matchedKeywords.join(", ")})` };
  return { compatible: false, result: "not compatible: no selected chip label/id/keyword match" };
}

export function getStoryTypeSeedSource(chip: StoryTypeChip, candidateTexts: string[]): "compatible-storyspark" | "direct-chip-guidance" {
  return candidateTexts.some((text) => getStoryTypeTextCompatibility(chip, text).compatible) ? "compatible-storyspark" : "direct-chip-guidance";
}

export function getStoryTypePromptRequirements(chip: StoryTypeChip): string {
  if (chip.id !== "dark-fairy-tale") return "";
  return [
    "Private dark fairy-tale planning constraints (do not quote or label in prose):",
    "- Use folklore or fairy-tale logic.",
    "- Center rules, bargains, thresholds, curses, transformations, or beautiful cruelty.",
    "- Turn a storybook or mythic pattern dangerous.",
    "- Make dread come from violating or discovering a hidden rule.",
    "- Avoid mayor/town archive/town scandal, municipal mystery, old mill/founding-family crime, or generic small-town conspiracy defaults."
  ].join("\n");
}

export function getStoryTypePrimaryCategory(input: { selectedStoryTypeChipLabel?: string | null; storyTypeChipLabel?: string | null; genrePreset?: string | null }): string {
  return input.selectedStoryTypeChipLabel?.trim() || input.storyTypeChipLabel?.trim() || input.genrePreset?.trim() || "Story";
}


export function getStoryTypeStartCopy(storyTypeLabel?: string | null): { confirmation: string; detail: string; button: string; loading: string } {
  const label = storyTypeLabel?.trim();
  if (!label) {
    return {
      confirmation: "No story type selected. Bloodwick will surprise you.",
      detail: "",
      button: "Start Something New",
      loading: "Writing the perfect story for you…"
    };
  }

  return {
    confirmation: "",
    detail: "",
    button: `Start ${label} Story`,
    loading: `Writing a ${label} story for you…`
  };
}


export function getStoryTypeChipLabel(value?: string | null): string | null {
  if (!value) return null;

  const normalized = value.toLowerCase().trim();
  const normalizedLoose = normalized.replace(/-/g, " ");

  const match = STORY_TYPE_CHIPS.find((chip) => {
    const chipId = chip.id.toLowerCase();
    const chipLabel = chip.label.toLowerCase();
    return (
      chipId === normalized ||
      chipLabel === normalized ||
      chipLabel.replace(/-/g, " ") === normalizedLoose ||
      normalized.includes(chipId) ||
      normalized.includes(chipLabel) ||
      normalizedLoose.includes(chipId.replace(/-/g, " ")) ||
      normalizedLoose.includes(chipLabel.replace(/-/g, " "))
    );
  });

  return match?.label ?? null;
}


export const APPROVED_HOME_FEAR_LABELS = [
  "Small-Town Dread",
  "Uncanny",
  "Weird Nature",
  "Creature Unease",
  "Psychological Dread",
  "Gothic Shadows",
  "Cosmic Horror",
  "Haunted Past",
  "Dark Fairy Tale",
  "No-Exit Dread",
] as const;

export type ApprovedHomeFearLabel = (typeof APPROVED_HOME_FEAR_LABELS)[number];

const FALLBACK_HOME_FEAR_LABEL: ApprovedHomeFearLabel = "Small-Town Dread";

export function getHomeFearLabel(value?: string | null): ApprovedHomeFearLabel {
  if (!value) return FALLBACK_HOME_FEAR_LABEL;

  const normalized = value.toLowerCase().trim();
  const normalizedLoose = normalized.replace(/-/g, " ");

  const directMatch = STORY_TYPE_CHIPS.find((chip) => {
    const chipId = chip.id.toLowerCase();
    const chipLabel = chip.label.toLowerCase();
    return (
      chipId === normalized ||
      chipLabel === normalized ||
      chipLabel.replace(/-/g, " ") === normalizedLoose ||
      normalized.includes(chipId) ||
      normalized.includes(chipLabel) ||
      normalizedLoose.includes(chipId.replace(/-/g, " ")) ||
      normalizedLoose.includes(chipLabel.replace(/-/g, " "))
    );
  });

  if (directMatch && isApprovedHomeFearLabel(directMatch.label)) {
    return directMatch.label;
  }

  if (
    normalized.includes("gothic") ||
    normalized.includes("house") ||
    normalized.includes("portrait") ||
    normalized.includes("inheritance")
  ) {
    return "Gothic Shadows";
  }

  if (
    normalized.includes("dog") ||
    normalized.includes("animal") ||
    normalized.includes("fur") ||
    normalized.includes("creature")
  ) {
    return "Creature Unease";
  }

  if (
    normalized.includes("woods") ||
    normalized.includes("trail") ||
    normalized.includes("forest") ||
    normalized.includes("nature")
  ) {
    return "Weird Nature";
  }

  if (
    normalized.includes("memory") ||
    normalized.includes("guilt") ||
    normalized.includes("past") ||
    normalized.includes("left behind")
  ) {
    return "Haunted Past";
  }

  if (
    normalized.includes("cosmic") ||
    normalized.includes("ancient") ||
    normalized.includes("impossible") ||
    normalized.includes("vast")
  ) {
    return "Cosmic Horror";
  }

  if (
    normalized.includes("uncanny") ||
    normalized.includes("wrong") ||
    normalized.includes("imitating") ||
    normalized.includes("familiar")
  ) {
    return "Uncanny";
  }

  if (
    normalized.includes("psychological") ||
    normalized.includes("paranoia") ||
    normalized.includes("identity") ||
    normalized.includes("obsession")
  ) {
    return "Psychological Dread";
  }

  if (
    normalized.includes("no-exit dread") ||
    normalized.includes("no exit dread") ||
    normalized.includes("sealed") ||
    normalized.includes("trapped") ||
    normalized.includes("bunker") ||
    normalized.includes("submarine") ||
    normalized.includes("spaceship") ||
    normalized.includes("research station")
  ) {
    return "No-Exit Dread";
  }

  if (
    normalized.includes("fairy") ||
    normalized.includes("folklore") ||
    normalized.includes("bargain") ||
    normalized.includes("threshold")
  ) {
    return "Dark Fairy Tale";
  }

  return FALLBACK_HOME_FEAR_LABEL;
}

function isApprovedHomeFearLabel(value: string): value is ApprovedHomeFearLabel {
  return APPROVED_HOME_FEAR_LABELS.some((label) => label === value);
}
