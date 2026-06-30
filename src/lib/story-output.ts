export type StoryPayloadLike = {
  story?: unknown;
  charactersUsed?: unknown;
  rulesReferenced?: unknown;
};

export type StoryMetadataSanitizationResult = {
  text: string;
  detected: boolean;
  sanitized: boolean;
  removedPatterns: string[];
};

export function normalizeStoryText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  let story = stripMarkdownFence(value).trim();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const nested = parseJsonObject(story);
    if (!nested || typeof nested.story !== "string") {
      break;
    }

    story = stripMarkdownFence(nested.story).trim();
  }

  const extractedStory = extractStoryField(story);
  if (extractedStory) {
    story = extractedStory;
  }

  return sanitizeStoryMetadataLeaks(story).text
    .replace(/\r\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const STORY_METADATA_LEAK_LINE_PATTERN = /^[\s"']*(story type id|story type label|story type guidance|story type keywords|selected lantyrn story fit|selected story fit|story fit direction|private story-fit planning context|useful story fit ingredients|useful motifs|story request|use these as private planning guidance only|story seed|use this selected story type as the seed|use the selected|private planning guidance|consider these ingredients|overcoming the monster|rags to riches|the quest|voyage and return|comedy|tragedy|rebirth|preferredStoryTypes|storyIngredients|preferredMoods|preferredGenres|storyIntensity|endingPreference|heroPreference|contentLane|narrativePressure|episodeEndingShape|protagonistLens|explicitReaderPreferences|canonicalReaderProfileInput|readerProfileGenerationSnapshot|profileSource|moodSignal|genreSignal)\s*[:=]/i;
const STORY_METADATA_LEAK_PHRASE_PATTERN = /(?:use these as private planning guidance only|^\s*use the selected\b|private planning guidance|consider these ingredients|story type ids?|story type guidance labels?|keyword lists?|prompt rules|craft metadata)/i;
const STORY_METADATA_INLINE_BOUNDARY_PATTERN = /(\s+)(story type id|story type label|story type guidance|story type keywords|selected lantyrn story fit|selected story fit|story fit direction|private story-fit planning context|useful story fit ingredients|useful motifs|story request|use these as private planning guidance only|story seed|use this selected story type as the seed|use the selected|private planning guidance|consider these ingredients|overcoming the monster|rags to riches|the quest|voyage and return|comedy|tragedy|rebirth)\s*[:=]/gi;

export function findStoryMetadataLeakPatterns(value: string): string[] {
  return collectStoryMetadataLeakPatterns(value);
}

export function sanitizeStoryMetadataLeaks(rawText: string): StoryMetadataSanitizationResult {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
  const withInlineScaffoldSplit = normalized.replace(STORY_METADATA_INLINE_BOUNDARY_PATTERN, "\n$2:");
  const removedPatterns = new Set<string>();
  const keptLines = withInlineScaffoldSplit.split("\n").filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;
    const match = trimmed.match(STORY_METADATA_LEAK_LINE_PATTERN);
    if (match?.[1]) {
      removedPatterns.add(match[1]);
      return false;
    }
    if (STORY_METADATA_LEAK_PHRASE_PATTERN.test(trimmed)) {
      removedPatterns.add("prompt-instruction metadata");
      return false;
    }
    return true;
  });

  const text = keptLines
    .join("\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .join("\n\n");
  const postSanitizePatterns = collectStoryMetadataLeakPatterns(text);
  for (const pattern of postSanitizePatterns) removedPatterns.add(pattern);

  return {
    text,
    detected: removedPatterns.size > 0,
    sanitized: text !== normalized,
    removedPatterns: Array.from(removedPatterns)
  };
}

export function removeStoryMetadataLeaks(value: string): string {
  return sanitizeStoryMetadataLeaks(value).text;
}

function collectStoryMetadataLeakPatterns(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\\n/g, "\n");
  const scanText = normalized.replace(STORY_METADATA_INLINE_BOUNDARY_PATTERN, "\n$2:");
  const patterns = new Set<string>();
  for (const line of scanText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(STORY_METADATA_LEAK_LINE_PATTERN);
    if (match?.[1]) patterns.add(match[1]);
    if (STORY_METADATA_LEAK_PHRASE_PATTERN.test(trimmed)) patterns.add("prompt-instruction metadata");
  }
  return Array.from(patterns);
}

export function normalizeStoryPayload(payload: unknown): StoryPayloadLike {
  if (typeof payload === "string") {
    const parsed = parseJsonObject(payload);
    return parsed ?? { story: payload };
  }

  if (payload && typeof payload === "object") {
    return payload as StoryPayloadLike;
  }

  return { story: "" };
}

export function normalizeStringList(values: unknown): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }

  const normalized = values.filter((value): value is string => typeof value === "string").map((value) => value.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
}

function stripMarkdownFence(value: string): string {
  return value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
}

function parseJsonObject(value: string): StoryPayloadLike | null {
  const cleaned = stripMarkdownFence(value);

  if (!cleaned.startsWith("{") || !cleaned.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(cleaned) as unknown;
    if (parsed && typeof parsed === "object") {
      return parsed as StoryPayloadLike;
    }
  } catch {
    return null;
  }

  return null;
}

function extractStoryField(value: string): string | null {
  const cleaned = stripMarkdownFence(value);
  if (!cleaned.startsWith("{") || !/"story"\s*:/.test(cleaned)) {
    return null;
  }

  const match = cleaned.match(/"story"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"(?:charactersUsed|rulesReferenced|metadata)"|}\s*$)/);
  return match?.[1]?.trim() ?? null;
}
