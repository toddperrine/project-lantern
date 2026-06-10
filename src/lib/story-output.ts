export type StoryPayloadLike = {
  story?: unknown;
  charactersUsed?: unknown;
  rulesReferenced?: unknown;
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

  return story
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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
