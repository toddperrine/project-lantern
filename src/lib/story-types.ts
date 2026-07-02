import { normalizeBloodwickFearCategory } from "@/lib/bloodwick-fear-art";

export type StoryTypeChip = {
  id: string;
  label: string;
  guidance: string;
  keywords: string[];
};

export const STORY_TYPE_CHIPS = [
  { id: "small-town", label: "Small-Town", guidance: "Ordinary towns, neighborhoods, schools, roads, and families hiding something rotten beneath the surface.", keywords: ["small-town", "small town", "small-town dread", "small town dread", "dread", "eerie", "secrets", "horror"] },
  { id: "gothic", label: "Gothic", guidance: "Decaying houses, old bloodlines, secrets, romance, inheritance, and dread-soaked atmosphere.", keywords: ["gothic", "gothic shadows", "house", "inheritance", "romance", "horror"] },
  { id: "weird", label: "Weird", guidance: "Reality bends in ways that feel impossible, uncanny, or wrong, often without clear rules or explanation.", keywords: ["weird", "uncanny", "impossible", "wrong", "unsettling", "creepy"] },
  { id: "cosmic", label: "Cosmic", guidance: "Vast unknowable forces make human lives, beliefs, and sanity feel small and fragile.", keywords: ["cosmic", "cosmic horror", "unknowable", "vast", "sanity", "dread"] },
  { id: "folk", label: "Folk", guidance: "Old land, old rituals, rural isolation, village belief, and inherited customs turn threatening.", keywords: ["folk", "weird nature", "ritual", "rural", "village", "customs"] },
  { id: "supernatural", label: "Supernatural", guidance: "Ghosts, curses, spirits, hauntings, and impossible forces break into the ordinary world.", keywords: ["supernatural", "haunted past", "ghosts", "curses", "spirits", "hauntings"] },
  { id: "monster", label: "Monster", guidance: "Something living, hungry, changed, or inhuman stalks the edge of the story.", keywords: ["monster", "creature unease", "creature", "hungry", "inhuman", "stalks"] },
  { id: "dark-fantasy", label: "Dark Fantasy", guidance: "Fairy-tale, mythic, or magical elements turn dangerous, beautiful, and morally unsafe.", keywords: ["dark fantasy", "dark fairy tale", "fairy-tale", "mythic", "magical", "folklore"] },
  { id: "psychological", label: "Psychological", guidance: "Fear comes from obsession, guilt, paranoia, memory, identity, and the instability of the mind.", keywords: ["psychological", "psychological dread", "obsession", "guilt", "paranoia", "identity"] },
  { id: "isolation", label: "Isolation", guidance: "Trapped people face sealed spaces, hostile systems, or environments where escape may be impossible.", keywords: ["isolation", "no-exit dread", "no exit dread", "trapped", "sealed", "escape"] }
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

  const normalizedCategory = normalizeBloodwickFearCategory(value);
  if (normalizedCategory) return normalizedCategory;

  const normalized = value.toLowerCase().trim();

  const match = STORY_TYPE_CHIPS.find((chip) => {
    return (
      chip.id.toLowerCase() === normalized ||
      chip.label.toLowerCase() === normalized ||
      normalized.includes(chip.id.toLowerCase()) ||
      normalized.includes(chip.label.toLowerCase())
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

  const normalizedCategory = normalizeBloodwickFearCategory(value);
  if (normalizedCategory && isApprovedHomeFearLabel(normalizedCategory)) {
    return normalizedCategory;
  }

  const normalized = value.toLowerCase().trim();

  const directMatch = STORY_TYPE_CHIPS.find((chip) => {
    return (
      chip.id.toLowerCase() === normalized ||
      chip.label.toLowerCase() === normalized ||
      normalized.includes(chip.id.toLowerCase()) ||
      normalized.includes(chip.label.toLowerCase())
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
    return "Gothic";
  }

  if (
    normalized.includes("dog") ||
    normalized.includes("animal") ||
    normalized.includes("fur") ||
    normalized.includes("creature") ||
    normalized.includes("monster")
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
    normalized.includes("left behind") ||
    normalized.includes("ghost") ||
    normalized.includes("haunt") ||
    normalized.includes("curse") ||
    normalized.includes("spirit")
  ) {
    return "Supernatural";
  }

  if (
    normalized.includes("cosmic") ||
    normalized.includes("ancient") ||
    normalized.includes("impossible") ||
    normalized.includes("vast")
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
    normalized.includes("fairy") ||
    normalized.includes("folklore") ||
    normalized.includes("bargain") ||
    normalized.includes("threshold") ||
    normalized.includes("fantasy") ||
    normalized.includes("myth")
  ) {
    return "Dark Fantasy";
  }

  if (
    normalized.includes("isolation") ||
    normalized.includes("no-exit") ||
    normalized.includes("no exit") ||
    normalized.includes("trapped") ||
    normalized.includes("sealed")
  ) {
    return "Isolation";
  }

  return FALLBACK_HOME_FEAR_LABEL;
}

function isApprovedHomeFearLabel(value: string): value is ApprovedHomeFearLabel {
  return APPROVED_HOME_FEAR_LABELS.some((label) => label === value);
}
