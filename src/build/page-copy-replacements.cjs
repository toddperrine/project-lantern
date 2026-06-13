const REPLACEMENTS = [
  ['appVersion: "0.6.0"', 'appVersion: "0.7.1"'],
  ['worldBible: "World Bible"', 'worldBible: "Storyworld"'],
  ['characterProfiles: "Character Profiles"', 'characterProfiles: "Cast"'],
  ['storySeed: "Story Seed"', 'storySeed: "Story Spark"'],
  ['storyRules: "Story Rules"', 'storyRules: "Craft Rules"'],
  ['title="World Bible"', 'title="Storyworld"'],
  ['title="Character Profiles"', 'title="Cast"'],
  ['title="Story Seed"', 'title="Story Spark"'],
  ['title="Story Generation Rules / Narrative Constraints"', 'title="Craft Rules"']
];

module.exports = function replacePageCopy(source) {
  let nextSource = source;

  for (const [from, to] of REPLACEMENTS) {
    if (!nextSource.includes(from)) {
      throw new Error(`Expected page copy was not found: ${from}`);
    }

    nextSource = nextSource.replace(from, to);
  }

  return nextSource;
};
