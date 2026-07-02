export type StoryTypeChip = {
  id: string;
  label: string;
  guidance: string;
  keywords: string[];
};

export const STORY_TYPE_CHIPS = [
  { id: "small-town", label: "Small-Town", guidance: "Ordinary towns, neighborhoods, schools, roads, and families hiding something rotten beneath the surface.", keywords: ["small-town", "small town", "small-town dread", "small town dread", "dread", "eerie", "secrets", "horror"] },
  { id: "gothic", label: "Gothic", guidance: "Decaying houses, old bloodlines, secrets, romance, inheritance, and dread-soaked atmosphere.", keywords: ["gothic", "gothic shadows", "old house", "bloodline", "inheritance", "atmosphere"] },
  { id: "weird", label: "Weird", guidance: "Reality bends in ways that feel impossible, uncanny, or wrong, often without clear rules or explanation.", keywords: ["weird", "uncanny", "impossible", "wrong", "reality", "unsettling"] },
  { id: "cosmic", label: "Cosmic", guidance: "Vast unknowable forces make human lives, beliefs, and sanity feel small and fragile.", keywords: ["cosmic", "cosmic horror", "vast", "unknowable", "ancient", "sanity"] },
  { id: "folk", label: "Folk", guidance: "Old land, old rituals, rural isolation, village belief, and inherited customs turn threatening.", keywords: ["folk", "weird nature", "old land", "ritual", "rural", "village", "customs"] },
  { id: "supernatural", label: "Supernatural", guidance: "Ghosts, curses, spirits, hauntings, and impossible forces break into the ordinary world.", keywords: ["supernatural", "haunted past", "ghost", "curse", "spirit", "haunting"] },
  { id: "monster", label: "Monster", guidance: "Something living, hungry, changed, or inhuman stalks the edge of the story.", keywords: ["monster", "creature unease", "creature", "hungry", "inhuman", "stalks"] },
  { id: "dark-fantasy", label: "Dark Fantasy", guidance: "Fairy-tale, mythic, or magical elements turn dangerous, beautiful, and morally unsafe.", keywords: ["dark fantasy", "dark fairy tale", "fairy-tale", "mythic", "magical", "folklore"] },
  { id: "psychological", label: "Psychological", guidance: "Fear comes from obsession, guilt, paranoia, memory, identity, and the instability of the mind.", keywords: ["psychological", "psychological dread", "obsession", "guilt", "paranoia", "identity"] },
  { id: "isolation", label: "Isolation", guidance: "Trapped people face sealed spaces, hostile systems, or environments where escape may be impossible.", keywords: ["isolation", "no-exit dread", "no exit dread", "trapped", "sealed", "escape", "hostile system", "hostile environment"] }
] as const satisfies readonly StoryTypeChip[];

export type StoryTypeChipId = (typeof STORY_TYPE_CHIPS)[number]["id"];

export function getStoryTypeChipById(id: string): StoryTypeChip | null {
  const normalized = normalizeStoryTypeLookup(id);
  const directMatch = STORY_TYPE_CHIPS.find((chip) => normalizeStoryTypeLookup(chip.id) === normalized);
  if (directMatch) return directMatch;

  const label = getStoryTypeChipLabel(id);
  return label ? STORY_TYPE_CHIPS.find((chip) => chip.label === label) ?? null : null;
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
  if (chip.id !== "dark-fantasy") return "";
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
  const selected = input.selectedStoryTypeChipLabel?.trim() || input.storyTypeChipLabel?.trim();
  if (selected) return getStoryTypeChipLabel(selected) ?? selected;
  return input.genrePreset?.trim() || "Story";
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

const STORY_TYPE_LABEL_ALIASES: Record<string, ApprovedHomeFearLabel> = {
  "small-town": "Small-Town",
  "small town": "Small-Town",
  "small-town dread": "Small-Town",
  "small town dread": "Small-Town",
  "smalltown dread": "Small-Town",
  gothic: "Gothic",
  "gothic shadows": "Gothic",
  weird: "Weird",
  uncanny: "Weird",
  cosmic: "Cosmic",
  "cosmic horror": "Cosmic",
  folk: "Folk",
  "weird nature": "Folk",
  supernatural: "Supernatural",
  "haunted past": "Supernatural",
  monster: "Monster",
  "creature unease": "Monster",
  "dark fantasy": "Dark Fantasy",
  "dark fairy tale": "Dark Fantasy",
  psychological: "Psychological",
  "psychological dread": "Psychological",
  isolation: "Isolation",
  "no-exit dread": "Isolation",
  "no exit dread": "Isolation",
};

export function getStoryTypeChipLabel(value?: string | null): string | null {
  if (!value) return null;

  const normalized = normalizeStoryTypeLookup(value);
  const aliasMatch = STORY_TYPE_LABEL_ALIASES[normalized];
  if (aliasMatch) return aliasMatch;

  const match = STORY_TYPE_CHIPS.find((chip) => {
    const chipId = normalizeStoryTypeLookup(chip.id);
    const chipLabel = normalizeStoryTypeLookup(chip.label);
    return (
      chipId === normalized ||
      chipLabel === normalized ||
      normalized.includes(chipId) ||
      normalized.includes(chipLabel)
    );
  });

  return match?.label ?? null;
}


export const APPROVED_HOME_FEAR_LABELS = [
  "Small-Town",
  "Gothic",
  "Weird",
  "Cosmic",
  "Folk",
  "Supernatural",
  "Monster",
  "Dark Fantasy",
  "Psychological",
  "Isolation",
] as const;

export type ApprovedHomeFearLabel = (typeof APPROVED_HOME_FEAR_LABELS)[number];

const FALLBACK_HOME_FEAR_LABEL: ApprovedHomeFearLabel = "Small-Town";

export function getHomeFearLabel(value?: string | null): ApprovedHomeFearLabel {
  if (!value) return FALLBACK_HOME_FEAR_LABEL;

  const normalized = normalizeStoryTypeLookup(value);
  const directMatch = STORY_TYPE_LABEL_ALIASES[normalized];
  if (directMatch) return directMatch;

  const chipMatch = getStoryTypeChipLabel(value);
  if (chipMatch && isApprovedHomeFearLabel(chipMatch)) return chipMatch;

  if (
    normalized.includes("gothic") ||
    normalized.includes("house") ||
    normalized.includes("portrait") ||
    normalized.includes("inheritance")
  ) {
    return "Gothic";
  }

  if (
    normalized.includes("dog") ||
    normalized.includes("animal") ||
    normalized.includes("fur") ||
    normalized.includes("creature")
  ) {
    return "Monster";
  }

  if (
    normalized.includes("woods") ||
    normalized.includes("trail") ||
    normalized.includes("forest") ||
    normalized.includes("nature") ||
    normalized.includes("ritual") ||
    normalized.includes("village")
  ) {
    return "Folk";
  }

  if (
    normalized.includes("memory") ||
    normalized.includes("guilt") ||
    normalized.includes("past") ||
    normalized.includes("haunt") ||
    normalized.includes("ghost") ||
    normalized.includes("curse") ||
    normalized.includes("spirit")
  ) {
    return "Supernatural";
  }

  if (
    normalized.includes("cosmic") ||
    normalized.includes("ancient") ||
    normalized.includes("impossible") ||
    normalized.includes("vast") ||
    normalized.includes("unknowable")
  ) {
    return "Cosmic";
  }

  if (
    normalized.includes("uncanny") ||
    normalized.includes("wrong") ||
    normalized.includes("imitating") ||
    normalized.includes("familiar") ||
    normalized.includes("reality")
  ) {
    return "Weird";
  }

  if (
    normalized.includes("psychological") ||
    normalized.includes("paranoia") ||
    normalized.includes("identity") ||
    normalized.includes("obsession")
  ) {
    return "Psychological";
  }

  if (
    normalized.includes("no exit") ||
    normalized.includes("sealed") ||
    normalized.includes("trapped") ||
    normalized.includes("bunker") ||
    normalized.includes("submarine") ||
    normalized.includes("spaceship") ||
    normalized.includes("research station") ||
    normalized.includes("isolation")
  ) {
    return "Isolation";
  }

  if (
    normalized.includes("fairy") ||
    normalized.includes("fantasy") ||
    normalized.includes("folklore") ||
    normalized.includes("bargain") ||
    normalized.includes("threshold")
  ) {
    return "Dark Fantasy";
  }

  return FALLBACK_HOME_FEAR_LABEL;
}

function isApprovedHomeFearLabel(value: string): value is ApprovedHomeFearLabel {
  return APPROVED_HOME_FEAR_LABELS.some((label) => label === value);
}

function normalizeStoryTypeLookup(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
}
