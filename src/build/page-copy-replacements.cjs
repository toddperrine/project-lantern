const PAGE_REPLACEMENTS = [
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

const UPLOAD_PANEL_HEADER_MARKER = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div><label className="mt-4 flex flex-col gap-2">';
const UPLOAD_PANEL_HEADER_WITH_FOCUSED_INPUTS = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div>{artifactType === "characterProfiles" ? <CurrentCastPanel content={value.content} /> : null}{artifactType === "storySeed" ? <label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Write your Story Spark</span><span className="text-xs leading-5 text-ink/55">The image, event, conflict, or question that starts the story.</span><textarea className="min-h-36 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onChange({ name: value.name || "story-spark.txt", content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder="A vanished road opens behind the diner after the same song plays three nights in a row." value={value.content} /></label> : null}<label className="mt-4 flex flex-col gap-2">';

const CURRENT_CAST_HELPER_MARKER = 'function BuildBadge({ buildInfo }: { buildInfo: BuildInfo }) {';
const CURRENT_CAST_HELPER = 'function CurrentCastPanel({ content }: { content: string }) { const entries = getCurrentCastEntries(content); const hasCustomCast = Boolean(content.trim() && entries.length === 0); return <section className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"><h3 className="text-sm font-semibold text-ink">Current Cast</h3>{entries.length > 0 ? <ul className="mt-3 grid gap-2">{entries.map((entry) => <li className="rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75" key={`${entry.name}-${entry.archetype}`}><span className="font-semibold text-ink">{entry.name}</span> — {entry.archetype}</li>)}</ul> : <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/60">{hasCustomCast ? "Custom cast content loaded. This cast text will be sent to generation." : "No cast members added yet."}</p>}</section>; }\nfunction getCurrentCastEntries(content: string): { name: string; archetype: string }[] { return CHARACTER_ARCHETYPE_PRESETS.filter((preset) => content.includes(`${preset.name} — ${preset.archetype}`)).map((preset) => ({ name: preset.name, archetype: preset.archetype })); }\n\n' + CURRENT_CAST_HELPER_MARKER;

const CAST_NOTE_MARKER = '      </div>\n\n      {showDetails ? (';
const CAST_NOTE = '      </div>\n\n      <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-xs leading-5 text-ink/60">Use Add to Cast for multiple characters. Use Replace Cast for one-character tests.</p>\n\n      {showDetails ? (';

module.exports = function replaceFocusedCopy(source) {
  const resourcePath = this.resourcePath || "";

  if (resourcePath.endsWith("page.tsx")) {
    return replacePageCopy(source);
  }

  if (resourcePath.endsWith("CharacterArchetypeCompactor.tsx")) {
    return applyReplacement(source, CAST_NOTE_MARKER, CAST_NOTE);
  }

  return source;
};

function replacePageCopy(source) {
  let nextSource = source;

  for (const [from, to] of PAGE_REPLACEMENTS) {
    nextSource = applyReplacement(nextSource, from, to);
  }

  nextSource = applyReplacement(nextSource, UPLOAD_PANEL_HEADER_MARKER, UPLOAD_PANEL_HEADER_WITH_FOCUSED_INPUTS);
  return applyReplacement(nextSource, CURRENT_CAST_HELPER_MARKER, CURRENT_CAST_HELPER);
}

function applyReplacement(source, from, to) {
  if (!source.includes(from)) {
    throw new Error(`Expected page copy was not found: ${from}`);
  }

  return source.replace(from, to);
}
