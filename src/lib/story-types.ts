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
  { id: "psychological-dread", label: "Psychological Dread", guidance: "Paranoia, obsession, identity fracture, unreliable perception, guilt, or emotional collapse.", keywords: ["psychological dread", "paranoia", "unsettling", "dark"] }
] as const satisfies readonly StoryTypeChip[];

export type StoryTypeChipId = (typeof STORY_TYPE_CHIPS)[number]["id"];

export function getStoryTypeChipById(id: string): StoryTypeChip | null {
  return STORY_TYPE_CHIPS.find((chip) => chip.id === id) ?? null;
}

export function getStoryTypePrimaryCategory(input: { selectedStoryTypeChipLabel?: string | null; storyTypeChipLabel?: string | null; genrePreset?: string | null }): string {
  return input.selectedStoryTypeChipLabel?.trim() || input.storyTypeChipLabel?.trim() || input.genrePreset?.trim() || "Story";
}


export function getStoryTypeStartCopy(storyTypeLabel?: string | null): { confirmation: string; detail: string; button: string; loading: string } {
  const label = storyTypeLabel?.trim();
  if (!label) {
    return {
      confirmation: "No story type selected. Lantyrn will surprise you.",
      detail: "",
      button: "Start Something New",
      loading: "Writing the perfect story for you…"
    };
  }

  return {
    confirmation: `Selected story type: ${label}`,
    detail: "Lantyrn will use this to shape the next story.",
    button: `Start ${label} Story`,
    loading: `Writing a ${label} story for you…`
  };
}
