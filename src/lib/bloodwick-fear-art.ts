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

export const BLOODWICK_FEAR_ART: Partial<
  Record<BloodwickFearCategory, string>
> = {
  Uncanny: "/artwork/Bloodwick%20Image%20-%20Uncanny.png",
};

export function normalizeBloodwickFearCategory(
  value: string | null | undefined,
): BloodwickFearCategory | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "small-town dread" || normalized === "small town dread") {
    return "Small-Town Dread";
  }

  const categories: BloodwickFearCategory[] = [
    "Small-Town Dread",
    "Uncanny",
    "Weird Nature",
    "Creature Unease",
    "Psychological Dread",
    "Gothic Shadows",
    "Cosmic Horror",
    "Haunted Past",
    "Dark Fairy Tale",
  ];

  const match = categories.find(
    (category) => category.toLowerCase() === normalized,
  );

  return match ?? null;
}

export function getBloodwickFearArt(
  fearCategory: string | null | undefined,
): BloodwickFearArtResult {
  const normalized = normalizeBloodwickFearCategory(fearCategory);

  if (!normalized || !BLOODWICK_FEAR_ART[normalized]) {
    return { src: null, mode: "fallback" };
  }

  return {
    src: BLOODWICK_FEAR_ART[normalized] ?? null,
    mode: "image",
  };
}
