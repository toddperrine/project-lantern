import { compactWhitespace, truncateWords } from './text';

export type StoryContext = {
  premise: string;
  characters: string[];
  characterNotes: string[];
  worldRules: string[];
  sensoryDetails: string[];
};

const fallbackCharacters = ['Mara Vale', 'Tovan Reed', 'Ilyra Stone'];

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function extractHeadingNames(text: string): string[] {
  return [...text.matchAll(/^#{1,3}\s+(.+)$/gm)]
    .map((match) => match[1].replace(/[:#*_`]/g, '').trim())
    .filter((heading) => heading.length > 2 && heading.length < 60)
    .slice(0, 8);
}

function extractColonNames(text: string): string[] {
  return [...text.matchAll(/(?:^|\n)(?:name|character)\s*:\s*([^\n]+)/gim)]
    .map((match) => match[1].replace(/[*_`]/g, '').trim())
    .filter((name) => name.length > 2 && name.length < 60)
    .slice(0, 8);
}

function extractRules(text: string): string[] {
  const candidates = text
    .split(/\n|\./)
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((line) => /\b(must|never|cannot|can only|law|rule|forbidden|always|requires|cost|limit|bound|oath|magic|technology)\b/i.test(line));

  return unique(candidates).slice(0, 6);
}

function extractCharacterNotes(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((block) => truncateWords(compactWhitespace(block), 38))
    .filter((block) => block.length > 20)
    .slice(0, 6);
}

function extractSensoryDetails(text: string): string[] {
  const details = text
    .split(/\n|\./)
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((line) => /\b(city|forest|sea|market|temple|station|kingdom|empire|moon|river|gate|tower|district|ship|school|desert|mountain|archive|citadel|harbor)\b/i.test(line));

  return unique(details).slice(0, 6);
}

export function buildStoryContext(worldBible: string, characterProfiles: string, storySeed: string): StoryContext {
  const cleanWorld = compactWhitespace(worldBible);
  const cleanCharacters = compactWhitespace(characterProfiles);
  const characters = unique([...extractColonNames(cleanCharacters), ...extractHeadingNames(cleanCharacters)]).slice(0, 5);

  return {
    premise: storySeed.trim() || 'A small choice exposes a hidden fracture in the world.',
    characters: characters.length ? characters : fallbackCharacters,
    characterNotes: extractCharacterNotes(cleanCharacters),
    worldRules: extractRules(cleanWorld),
    sensoryDetails: extractSensoryDetails(cleanWorld),
  };
}
