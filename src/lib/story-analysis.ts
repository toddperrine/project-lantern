const NAME_PATTERN = /(?:^|\n)\s*(?:#+\s*)?(?:character\s*:\s*)?([A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){0,2})\s*(?:[-:]\s*|\n)/g;
const RULE_PATTERN = /(?:^|\n)\s*(?:[-*]\s*)?(?:rule|law|canon|principle|truth|constraint)\s*[:\-]\s*(.+)/gi;
const SETTING_PATTERN = /(?:^|\n)\s*(?:[-*]\s*)?(?:setting|location|place|region|city|realm)\s*[:\-]\s*(.+)/gi;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function extractCharacterNames(characterProfiles: string): string[] {
  const names = new Set<string>();
  for (const match of characterProfiles.matchAll(NAME_PATTERN)) {
    const name = match[1]?.trim();
    if (name && !isCommonHeading(name)) {
      names.add(name);
    }
  }

  if (names.size === 0) {
    for (const line of characterProfiles.split(/\r?\n/)) {
      const trimmed = line.replace(/^#+\s*/, "").trim();
      if (/^[A-Z][A-Za-z'-]+(?:\s+[A-Z][A-Za-z'-]+){0,2}$/.test(trimmed)) {
        names.add(trimmed);
      }
    }
  }

  return [...names].slice(0, 8);
}

export function extractWorldRules(worldBible: string): string[] {
  const rules = new Set<string>();
  for (const match of worldBible.matchAll(RULE_PATTERN)) {
    const rule = cleanSnippet(match[1]);
    if (rule) {
      rules.add(rule);
    }
  }

  if (rules.size === 0) {
    for (const line of worldBible.split(/\r?\n/)) {
      const trimmed = cleanSnippet(line.replace(/^[-*]\s*/, ""));
      if (trimmed.length > 28 && /must|never|only|cannot|always|forbidden|requires/i.test(trimmed)) {
        rules.add(trimmed);
      }
    }
  }

  return [...rules].slice(0, 8);
}

export function extractSettings(worldBible: string): string[] {
  const settings = new Set<string>();
  for (const match of worldBible.matchAll(SETTING_PATTERN)) {
    const setting = cleanSnippet(match[1]);
    if (setting) {
      settings.add(setting);
    }
  }

  return [...settings].slice(0, 5);
}

export function inferCharactersUsed(story: string, characterProfiles: string): string[] {
  const names = extractCharacterNames(characterProfiles);
  return names.filter((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, "i").test(story));
}

export function inferRulesReferenced(story: string, worldBible: string): string[] {
  const rules = extractWorldRules(worldBible);
  return rules.filter((rule) => {
    const keywords = rule
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .slice(0, 4);

    return keywords.some((word) => story.toLowerCase().includes(word));
  });
}

export function cleanSnippet(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").replace(/^["']|["']$/g, "").trim().slice(0, 220);
}

function isCommonHeading(value: string): boolean {
  return /^(world|characters|profiles|rules|locations|timeline|magic|technology|history)$/i.test(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
