const CAST_SECTION_MARKER = '<CharacterArchetypePicker disabled={disabled} onApply={onApplyArchetype} /><UploadControls {...uploadProps} uploadTitle="Upload your own Cast" />';
const CAST_SECTION_WITH_PANEL = '<CharacterArchetypePicker disabled={disabled} onApply={onApplyArchetype} /><CurrentCastPanel content={uploadProps.value.content} /><UploadControls {...uploadProps} uploadTitle="Upload your own Cast" />';

const CAST_NOTE_MARKER = '</select></label>{selectedPreset ? <SelectedCharacterPanel';
const CAST_NOTE_WITH_TEXT = '</select></label><p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-xs leading-5 text-ink/60">Use Add to Cast for multiple characters. Use Replace Cast for one-character tests.</p>{selectedPreset ? <SelectedCharacterPanel';

const CURRENT_CAST_FUNCTION_MARKER = 'function SelectedCharacterPanel({ disabled, onApply, onToggleDetails, preset, showDetails }: { disabled: boolean; onApply: (preset: CharacterArchetypePreset, mode: "add" | "replace") => void; onToggleDetails: () => void; preset: CharacterArchetypePreset; showDetails: boolean }) {';
const CURRENT_CAST_FUNCTION = 'function CurrentCastPanel({ content }: { content: string }) {\n  const entries = getCurrentCastEntries(content);\n  const hasCustomCast = Boolean(content.trim() && entries.length === 0);\n  return <section className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"><h3 className="text-sm font-semibold text-ink">Current Cast</h3>{entries.length > 0 ? <ul className="mt-3 grid gap-2">{entries.map((entry) => <li className="rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75" key={`${entry.name}-${entry.archetype}`}><span className="font-semibold text-ink">{entry.name}</span> — {entry.archetype}</li>)}</ul> : <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/60">{hasCustomCast ? "Custom cast content loaded. This cast text will be sent to generation." : "No cast members added yet."}</p>}</section>;\n}\n\n' + CURRENT_CAST_FUNCTION_MARKER;

const STORY_SPARK_MARKER = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div><UploadControls artifactType={artifactType} libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} uploadTitle={uploadTitle} value={value} />';
const STORY_SPARK_WITH_TEXTAREA = '<div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{description}</p></div>{artifactType === "storySeed" ? <label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Write your Story Spark</span><span className="text-xs leading-5 text-ink/55">The image, event, conflict, or question that starts the story.</span><textarea className="min-h-36 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onChange({ name: value.name || "story-spark.txt", content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder="A vanished road opens behind the diner after the same song plays three nights in a row." value={value.content} /></label> : null}<UploadControls artifactType={artifactType} libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} uploadTitle={uploadTitle} value={value} />';

const CAST_ENTRIES_MARKER = 'function formatArchetypeOption(preset: CharacterArchetypePreset): string { return `${preset.name} — ${preset.archetype.replace(/^The\\s+/i, "")}`; }';
const CAST_ENTRIES_HELPER =
  CAST_ENTRIES_MARKER +
  '\nfunction getCurrentCastEntries(content: string): { name: string; archetype: string }[] {\n' +
  '  return CHARACTER_ARCHETYPE_PRESETS.filter((preset) => content.includes(`${preset.name} — ${preset.archetype}`)).map((preset) => ({ name: preset.name, archetype: preset.archetype }));\n' +
  '}';

module.exports = function replacePr27Ui(source) {
  let nextSource = source;
  nextSource = applyReplacement(nextSource, CAST_SECTION_MARKER, CAST_SECTION_WITH_PANEL);
  nextSource = applyReplacement(nextSource, CAST_NOTE_MARKER, CAST_NOTE_WITH_TEXT);
  nextSource = applyReplacement(nextSource, CURRENT_CAST_FUNCTION_MARKER, CURRENT_CAST_FUNCTION);
  nextSource = applyReplacement(nextSource, STORY_SPARK_MARKER, STORY_SPARK_WITH_TEXTAREA);
  nextSource = applyReplacement(nextSource, CAST_ENTRIES_MARKER, CAST_ENTRIES_HELPER);
  return nextSource;
};

function applyReplacement(source, from, to) {
  if (!source.includes(from)) {
    throw new Error(`Expected PR #27 UI source was not found: ${from}`);
  }

  return source.replace(from, to);
}
