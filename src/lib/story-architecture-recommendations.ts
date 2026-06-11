import type {
  CharacterArc,
  EndingType,
  GenrePreset,
  LengthTarget,
  NarrativeArchitecture
} from "./types";

export type StoryArchitectureSelections = {
  genrePreset: GenrePreset;
  narrativeArchitecture: NarrativeArchitecture;
  characterArc: CharacterArc;
  endingType: EndingType;
  lengthTarget: LengthTarget;
};

export type StoryArchitectureRecommendation = StoryArchitectureSelections & {
  explanation: string;
  confidence: number;
};

type RecommendationInput = {
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
  storyRules: string;
  currentSelections: StoryArchitectureSelections;
};

type GenreScore = {
  genrePreset: GenrePreset;
  score: number;
  matches: string[];
};

const DEFAULT_RECOMMENDATION: StoryArchitectureSelections = {
  genrePreset: "Speculative Mystery",
  narrativeArchitecture: "Revelation Story",
  characterArc: "Positive Change Arc",
  endingType: "Resolution with Residue",
  lengthTarget: "Standard"
};

const GENRE_KEYWORDS: Record<GenrePreset, string[]> = {
  "Speculative Mystery": [
    "anomaly",
    "mystery",
    "missing",
    "forbidden",
    "impossible",
    "signal",
    "file",
    "song",
    "unknown",
    "hidden",
    "discovered",
    "clue",
    "should not exist",
    "secret",
    "corruption",
    "evidence"
  ],
  "Literary Science Fiction": [
    "system",
    "technology",
    "machine",
    "memory",
    "simulation",
    "data",
    "future",
    "civilization",
    "network",
    "identity",
    "consciousness",
    "ecological",
    "post-human",
    "algorithm",
    "archive"
  ],
  "Contemporary Fantastical / Magical Realist": [
    "ordinary setting",
    "impossible event",
    "grief",
    "memory",
    "family",
    "home",
    "place",
    "ghost",
    "dream",
    "ritual",
    "myth",
    "strange but accepted"
  ]
};

const DISILLUSIONMENT_KEYWORDS = [
  "discovery",
  "discovered",
  "hidden truth",
  "painful revelation",
  "failed belief",
  "loss of innocence",
  "forbidden knowledge",
  "secret",
  "should not exist",
  "evidence"
];

const FLAT_ARC_KEYWORDS = [
  "already knows",
  "clear truth",
  "code",
  "vow",
  "principle",
  "creed",
  "conviction",
  "unchanged belief"
];

const TRANSFORMATION_WITHOUT_VICTORY_KEYWORDS = [
  "sacrifice",
  "grief",
  "change",
  "unresolved moral cost",
  "moral cost",
  "loss",
  "cost"
];

const LONG_LENGTH_KEYWORDS = [
  "complex",
  "multiple",
  "major characters",
  "mythic",
  "literary ambition",
  "history",
  "civilization",
  "ecological",
  "cosmology",
  "rules"
];

const COMPACT_LENGTH_KEYWORDS = ["simple", "single conflict", "one conflict", "small", "brief"];
const STRONG_SIGNAL_SCORE = 2;

export function recommendStoryArchitecture(input: RecommendationInput): StoryArchitectureRecommendation {
  const text = normalizeText(
    `${input.worldBible}\n\n${input.characterProfiles}\n\n${input.storySeed}\n\n${input.storyRules}`
  );

  if (!text) {
    return {
      ...DEFAULT_RECOMMENDATION,
      explanation: "No uploaded text was available, so the default settings are recommended.",
      confidence: 0.25
    };
  }

  const genreScores = scoreGenres(text);
  const strongestGenre = genreScores[0];

  if (!strongestGenre || strongestGenre.score < STRONG_SIGNAL_SCORE) {
    return {
      ...DEFAULT_RECOMMENDATION,
      explanation: "No strong genre signal was detected, so the default story architecture settings are recommended.",
      confidence: 0.35
    };
  }

  const genrePreset = strongestGenre.genrePreset;
  const narrativeArchitecture = recommendNarrativeArchitecture(genrePreset, text);
  const characterArc = recommendCharacterArc(genrePreset, text, input.currentSelections.characterArc);
  const endingType = recommendEndingType(genrePreset, text);
  const lengthTarget = recommendLengthTarget(genrePreset, text, input.characterProfiles);
  const confidence = calculateConfidence(strongestGenre, genreScores);
  const explanation = buildExplanation(strongestGenre, genreScores, {
    genrePreset,
    narrativeArchitecture,
    characterArc,
    endingType,
    lengthTarget
  });

  return {
    genrePreset,
    narrativeArchitecture,
    characterArc,
    endingType,
    lengthTarget,
    explanation,
    confidence
  };
}

function scoreGenres(text: string): GenreScore[] {
  return Object.entries(GENRE_KEYWORDS)
    .map(([genrePreset, keywords]) => {
      const matches: string[] = [];
      const score = keywords.reduce((total, keyword) => {
        const count = countKeywordMatches(text, keyword);
        if (count > 0) {
          matches.push(keyword);
        }

        return total + count * keywordWeight(keyword);
      }, 0);

      return {
        genrePreset: genrePreset as GenrePreset,
        score,
        matches
      };
    })
    .sort((left, right) => right.score - left.score);
}

function recommendNarrativeArchitecture(genrePreset: GenrePreset, text: string): NarrativeArchitecture {
  if (genrePreset === "Speculative Mystery") {
    return "Revelation Story";
  }

  if (genrePreset === "Literary Science Fiction") {
    return hasAnyKeyword(text, ["identity", "consciousness", "memory", "failed belief", "transformation"])
      ? "Character Transformation Story"
      : "Event Story";
  }

  return "Character Transformation Story";
}

function recommendCharacterArc(
  genrePreset: GenrePreset,
  text: string,
  currentCharacterArc: CharacterArc
): CharacterArc {
  if (hasAnyKeyword(text, DISILLUSIONMENT_KEYWORDS)) {
    return "Disillusionment Arc";
  }

  if (hasAnyKeyword(text, FLAT_ARC_KEYWORDS)) {
    return "Flat / Testing Arc";
  }

  if (genrePreset === "Contemporary Fantastical / Magical Realist" && currentCharacterArc === "Disillusionment Arc") {
    return "Disillusionment Arc";
  }

  return "Positive Change Arc";
}

function recommendEndingType(genrePreset: GenrePreset, text: string): EndingType {
  if (
    genrePreset === "Speculative Mystery" ||
    hasAnyKeyword(text, ["mystery", "anomaly", "forbidden", "hidden truth", "discovery", "discovered", "should not exist"])
  ) {
    return "Revelation with Cost";
  }

  if (hasAnyKeyword(text, TRANSFORMATION_WITHOUT_VICTORY_KEYWORDS)) {
    return "Transformation without Victory";
  }

  return "Resolution with Residue";
}

function recommendLengthTarget(genrePreset: GenrePreset, text: string, characterProfiles: string): LengthTarget {
  const characterCount = countLikelyCharacters(characterProfiles);
  const hasLongSignal =
    hasAnyKeyword(text, LONG_LENGTH_KEYWORDS) ||
    characterCount >= 4 ||
    (genrePreset === "Literary Science Fiction" && hasAnyKeyword(text, ["civilization", "ecological", "network", "archive"]));

  if (hasLongSignal) {
    return "Long";
  }

  if (hasAnyKeyword(text, COMPACT_LENGTH_KEYWORDS) && characterCount <= 2) {
    return "Compact";
  }

  return "Standard";
}

function buildExplanation(
  strongestGenre: GenreScore,
  genreScores: GenreScore[],
  recommendation: StoryArchitectureSelections
): string {
  const matchedKeywords = strongestGenre.matches.slice(0, 5).join(", ");
  const runnerUp = genreScores[1];
  const comparison = runnerUp?.score
    ? ` The next closest genre signal was ${runnerUp.genrePreset}.`
    : "";

  return `Recommended ${recommendation.genrePreset} because the strongest local keyword signal matched ${matchedKeywords || "the uploaded text"}.${comparison} The selected architecture favors ${recommendation.narrativeArchitecture}, ${recommendation.characterArc}, ${recommendation.endingType}, and a ${recommendation.lengthTarget.toLowerCase()} length target.`;
}

function calculateConfidence(strongestGenre: GenreScore, genreScores: GenreScore[]): number {
  const runnerUpScore = genreScores[1]?.score ?? 0;
  const margin = strongestGenre.score - runnerUpScore;
  const base = Math.min(0.85, 0.35 + strongestGenre.score * 0.08);
  const marginBoost = Math.min(0.15, margin * 0.03);

  return roundConfidence(Math.min(0.95, base + marginBoost));
}

function countKeywordMatches(text: string, keyword: string): number {
  const normalizedKeyword = normalizeText(keyword);
  if (!normalizedKeyword) {
    return 0;
  }

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = normalizedKeyword.includes(" ")
    ? new RegExp(escaped, "g")
    : new RegExp(`\\b${escaped}\\b`, "g");

  return text.match(pattern)?.length ?? 0;
}

function countLikelyCharacters(characterProfiles: string): number {
  const headings = characterProfiles.match(/^##\s+.+$/gm)?.length ?? 0;
  const explicitNames = characterProfiles.match(/(?:^|\n)\s*(?:character|name)\s*[:\-]/gi)?.length ?? 0;

  return Math.max(headings, explicitNames);
}

function hasAnyKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => countKeywordMatches(text, keyword) > 0);
}

function keywordWeight(keyword: string): number {
  return keyword.includes(" ") ? 2 : 1;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}
