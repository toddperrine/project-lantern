export type BloodwickFearCategory =
  | "Small-Town Dread"
  | "Uncanny"
  | "Weird Nature"
  | "Creature Unease"
  | "Psychological Dread"
  | "Gothic Shadows"
  | "Cosmic Horror"
  | "Haunted Past"
  | "Dark Fairy Tale";

export type BloodwickFearArtResult = {
  src: string | null;
  mode: "image" | "fallback";
};

export const BLOODWICK_FEAR_ART: Record<BloodwickFearCategory, string> = {
  "Small-Town Dread": "/artwork/Bloodwick Image - Small Town Dread.png",
  "Uncanny": "/artwork/Bloodwick Image - Uncanny.png",
  "Weird Nature": "/artwork/Bloodwick Image - Weird Nature.png",
  "Creature Unease": "/artwork/Bloodwick Image - Creature Unease.png",
  "Psychological Dread": "/artwork/Bloodwick Image - Psychological Dread.png",
  "Gothic Shadows": "/artwork/Bloodwick Image - Gothic Shadows.png",
  "Cosmic Horror": "/artwork/Bloodwick Image - Cosmic Horror.png",
  "Haunted Past": "/artwork/Bloodwick Image - Haunted Past.png",
  "Dark Fairy Tale": "/artwork/Bloodwick Image - Dark Fairy Tale.png",
};

export function normalizeBloodwickFearCategory(
  value: string | null | undefined,
): BloodwickFearCategory | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "small-town dread" || normalized === "small town dread") {
    return "Small-Town Dread";
  }

  const match = (Object.keys(BLOODWICK_FEAR_ART) as BloodwickFearCategory[]).find(
    (category) => category.toLowerCase() === normalized,
  );

  return match ?? null;
}

export function getBloodwickFearArt(
  fearCategory: string | null | undefined,
): BloodwickFearArtResult {
  const normalized = normalizeBloodwickFearCategory(fearCategory);

  if (!normalized) {
    return { src: null, mode: "fallback" };
  }

  return {
    src: BLOODWICK_FEAR_ART[normalized],
    mode: "image",
  };
}
