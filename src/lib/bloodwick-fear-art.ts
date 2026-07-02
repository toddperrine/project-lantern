export type BloodwickFearCategory =
  | "Small-Town"
  | "Gothic"
  | "Weird"
  | "Cosmic"
  | "Folk"
  | "Supernatural"
  | "Monster"
  | "Dark Fantasy"
  | "Psychological"
  | "Isolation";

export type BloodwickFearArtResult = {
  src: string | null;
  mode: "image" | "fallback";
};

const ISOLATION_ART_SRC = "/artwork/Bloodwick%20Image%20-%20Isolation.png";
const ISOLATION_ART_EXISTS = false;

export const BLOODWICK_FEAR_ART: Record<BloodwickFearCategory, string | null> = {
  "Small-Town": "/artwork/Bloodwick%20Image%20-%20Small%20Town%20Dread.png",
  Gothic: "/artwork/Bloodwick%20Image%20-%20Gothic%20Shadows.png",
  Weird: "/artwork/Bloodwick%20Image%20-%20Uncanny.png",
  Cosmic: "/artwork/Bloodwick%20Image%20-%20Cosmic%20Horror.png",
  Folk: "/artwork/Bloodwick%20Image%20-%20Weird%20Nature.png",
  Supernatural: "/artwork/Bloodwick%20Image%20-%20Haunted%20Past.png",
  Monster: "/artwork/Bloodwick%20Image%20-%20Creature%20Unease.png",
  "Dark Fantasy": "/artwork/Bloodwick%20Image%20-%20Dark%20Fairy%20Tale.png",
  Psychological: "/artwork/Bloodwick%20Image%20-%20Psychological%20Dread.png",
  Isolation: ISOLATION_ART_EXISTS ? ISOLATION_ART_SRC : null,
};

const BLOODWICK_FEAR_CATEGORY_ALIASES: Record<string, BloodwickFearCategory> = {
  "small town": "Small-Town",
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
  "no exit dread": "Isolation",
};

export function normalizeBloodwickFearCategory(
  value: string | null | undefined
): BloodwickFearCategory | null {
  if (!value) return null;

  const normalized = normalizeBloodwickFearLookup(value);
  const alias = BLOODWICK_FEAR_CATEGORY_ALIASES[normalized];
  if (alias) return alias;

  const match = (Object.keys(BLOODWICK_FEAR_ART) as BloodwickFearCategory[]).find(
    (category) => normalizeBloodwickFearLookup(category) === normalized
  );

  return match ?? null;
}

export function getBloodwickFearArt(
  fearCategory: string | null | undefined
): BloodwickFearArtResult {
  const normalized = normalizeBloodwickFearCategory(fearCategory);

  if (!normalized) {
    return { src: null, mode: "fallback" };
  }

  const src = BLOODWICK_FEAR_ART[normalized];

  if (!src) {
    return { src: null, mode: "fallback" };
  }

  return {
    src,
    mode: "image",
  };
}

function normalizeBloodwickFearLookup(value: string): string {
  return value.trim().toLowerCase().replace(/-/g, " ").replace(/\s+/g, " ");
}
