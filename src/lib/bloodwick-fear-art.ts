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
  "Small-Town Dread": "/artwork/Bloodwick%20Image%20-%20Small%20Town%20Dread.png",
  "Uncanny": "/artwork/Bloodwick%20Image%20-%20Uncanny.png",
  "Weird Nature": "/artwork/Bloodwick%20Image%20-%20Weird%20Nature.png",
  "Creature Unease": "/artwork/Bloodwick%20Image%20-%20Creature%20Unease.png",
  "Psychological Dread": "/artwork/Bloodwick%20Image%20-%20Psychological%20Dread.png",
  "Gothic Shadows": "/artwork/Bloodwick%20Image%20-%20Gothic%20Shadows.png",
  "Cosmic Horror": "/artwork/Bloodwick%20Image%20-%20Cosmic%20Horror.png",
  "Haunted Past": "/artwork/Bloodwick%20Image%20-%20Haunted%20Past.png",
  "Dark Fairy Tale": "/artwork/Bloodwick%20Image%20-%20Dark%20Fairy%20Tale.png",
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
