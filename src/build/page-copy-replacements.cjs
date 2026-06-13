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

const STORY_SPARK_UPLOAD_PANEL_MARKER = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div><label className="mt-4 flex flex-col gap-2">';
const STORY_SPARK_TEXTAREA = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div>{artifactType === "storySeed" ? <label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Write your Story Spark</span><span className="text-xs leading-5 text-ink/55">The image, event, conflict, or question that starts the story.</span><textarea className="min-h-36 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onChange({ name: value.name || "story-spark.txt", content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder="A vanished road opens behind the diner after the same song plays three nights in a row." value={value.content} /></label> : null}<label className="mt-4 flex flex-col gap-2">';

module.exports = function replacePageCopy(source) {
  let nextSource = source;

  for (const [from, to] of REPLACEMENTS) {
    nextSource = applyReplacement(nextSource, from, to);
  }

  nextSource = applyReplacement(nextSource, STORY_SPARK_UPLOAD_PANEL_MARKER, STORY_SPARK_TEXTAREA);

  return nextSource;
};

function applyReplacement(source, from, to) {
  if (!source.includes(from)) {
    throw new Error(`Expected page copy was not found: ${from}`);
  }

  return source.replace(from, to);
}
