"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { CHARACTER_ARCHETYPE_PRESETS } from "@/lib/character-archetypes";
import type { CharacterArchetypePreset } from "@/lib/character-archetypes";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";
import { CHARACTER_ARCS, ENDING_TYPES, GENRE_PRESETS, LENGTH_TARGETS, NARRATIVE_ARCHITECTURES } from "@/lib/types";
import type { CharacterArc, EndingType, GenerateStoryResponse, GenrePreset, LengthTarget, NarrativeArchitecture } from "@/lib/types";
import { createInputArtifactId, createSavedProjectId, createSavedStory, persistInputArtifacts, persistSavedProjects, persistSavedStories, readInputArtifacts, readSavedProjects, readSavedStories, savedStoryToResponse } from "@/lib/project-persistence";
import type { InputArtifact, InputArtifactType, SavedProject, SavedStory, UploadState } from "@/lib/project-persistence";
import { WORLD_TEMPLATES } from "@/lib/world-templates";
import type { WorldTemplate } from "@/lib/world-templates";

type AppView = "home" | "create" | "library" | "characters" | "worlds";
type Mood = "Mystery" | "Wonder" | "Emotional" | "Adventure";
type BuildInfo = { appVersion: string; buildEnvironment: string; gitBranch: string; commitSha: string; shortCommitSha: string; buildTimestamp: string; vercelUrl: string };
type CloudProjectSummary = Pick<SavedProject, "id" | "name" | "createdAt" | "updatedAt">;
type CloudSavedStorySummary = { sequenceNumber?: number };
type StoryStart = { title: string; premise: string; genre: GenrePreset; mood: Mood; heroName: string; world: string; seed: string; cast: string; rules: string };
type LibraryStory = SavedStory | { id: string; title: string; story: string; wordCount: number; createdAt: string; genrePreset: GenrePreset; charactersUsed: string[]; rulesReferenced: string[] };

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const DEFAULT_BUILD_INFO: BuildInfo = { appVersion: "0.7.27", buildEnvironment: "metadata unavailable", gitBranch: "metadata unavailable", commitSha: "metadata unavailable", shortCommitSha: "metadata unavailable", buildTimestamp: "unknown", vercelUrl: "metadata unavailable" };
const INPUT_LABELS: Record<InputArtifactType, string> = { worldBible: "Storyworld", characterProfiles: "Cast", storySeed: "Story Spark", storyRules: "Craft Rules" };
const MOODS: Mood[] = ["Mystery", "Wonder", "Emotional", "Adventure"];
const DEFAULT_STORY_RULES_NOTICE = "Default craft rules are used automatically when this is empty.";

const SUGGESTED_STORY_STARTS: StoryStart[] = [
  { title: "The Lighthouse Under Main Street", premise: "A night-shift archivist finds a working lighthouse buried beneath a landlocked town.", genre: "Speculative Mystery", mood: "Mystery", heroName: "Mara Venn", world: "A rain-polished mill town where civic records sometimes rewrite themselves after midnight.", seed: "Mara Venn discovers a salt-stained lighthouse staircase below the courthouse archive and hears a foghorn answering from the town square.", cast: "Mara Venn - careful town archivist with a talent for noticing altered records. Jules Ardent - former surveyor who remembers streets no map admits.", rules: "Keep the mystery concrete, civic, and emotional. Let the lighthouse reveal one cost before it offers any answer." },
  { title: "Orchard of Borrowed Moons", premise: "A botanist tends trees that grow small moons, each carrying someone else's unfinished wish.", genre: "Contemporary Fantastical / Magical Realist", mood: "Wonder", heroName: "Iris Calder", world: "A hillside orchard outside a modern city where lunar fruit ripens only during power outages.", seed: "Iris Calder harvests a moon no larger than an apple and hears her missing brother's laugh inside its pale skin.", cast: "Iris Calder - patient botanist who trusts evidence and folklore in equal measure. Niko Vale - repair electrician who knows which outages are deliberate.", rules: "Favor luminous sensory detail, grounded relationships, and wonder with consequences." },
  { title: "The Quiet Engine", premise: "A grieving mechanic repairs a machine that turns silence into messages from possible futures.", genre: "Literary Science Fiction", mood: "Emotional", heroName: "Samir Holt", world: "A coastal repair yard where obsolete machines are preserved for the memories trapped in their parts.", seed: "Samir Holt restarts a banned listening engine and receives a message from a future in which he never says goodbye.", cast: "Samir Holt - gifted mechanic avoiding a family loss. Lena Quill - safety inspector who once helped shut the engine down.", rules: "Keep the science intimate. Every future message should force a present-tense choice." },
  { title: "Map of the Seventh Door", premise: "A courier must cross seven impossible thresholds before sunrise to return a stolen city map.", genre: "Speculative Mystery", mood: "Adventure", heroName: "Talia Reed", world: "A layered city where doors can open into old decisions, lost districts, and rooms that remember names.", seed: "Talia Reed steals back a living map and learns the seventh door will only open for someone who has betrayed the city once.", cast: "Talia Reed - quick courier with an old civic debt. Rowan Saye - mapmaker whose loyalties change with every door.", rules: "Make each threshold active, surprising, and tied to Talia's choices rather than puzzle mechanics alone." }
];

export default function Home() {
  const [activeView, setActiveView] = useState<AppView>("home");
  const [activeMood, setActiveMood] = useState<Mood>("Mystery");
  const [worldBible, setWorldBible] = useState<UploadState>(EMPTY_UPLOAD);
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>(EMPTY_UPLOAD);
  const [storySeed, setStorySeed] = useState<UploadState>(EMPTY_UPLOAD);
  const [storyRules, setStoryRules] = useState<UploadState>(EMPTY_UPLOAD);
  const [genrePreset, setGenrePreset] = useState<GenrePreset>("Speculative Mystery");
  const [narrativeArchitecture, setNarrativeArchitecture] = useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>("Positive Change Arc");
  const [endingType, setEndingType] = useState<EndingType>("Resolution with Residue");
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [storyResponse, setStoryResponse] = useState<GenerateStoryResponse | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState("");
  const [inputArtifacts, setInputArtifacts] = useState<InputArtifact[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCloudProjectId, setSelectedCloudProjectId] = useState("");
  const [cloudProjectMessage, setCloudProjectMessage] = useState("");
  const [buildInfo, setBuildInfo] = useState<BuildInfo>(DEFAULT_BUILD_INFO);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isCloudProjectsLoading, setIsCloudProjectsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [continueDirection, setContinueDirection] = useState("");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);

  useEffect(() => {
    setInputArtifacts(readInputArtifacts());
    setSavedStories(readSavedStories());
    setSavedProjects(readSavedProjects());
    void handleRefreshCloudProjects();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/build-info", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: BuildInfo | null) => { if (isMounted && payload) setBuildInfo({ ...DEFAULT_BUILD_INFO, ...payload }); })
      .catch(() => { if (isMounted) setBuildInfo(DEFAULT_BUILD_INFO); });
    return () => { isMounted = false; };
  }, []);

  const latestStory = useMemo<LibraryStory | null>(() => {
    if (storyResponse) return responseToLibraryStory(storyResponse, currentStoryId || createStoryId(storyResponse.story));
    return savedStories[0] ?? null;
  }, [currentStoryId, savedStories, storyResponse]);
  const suggestedStarts = useMemo(() => SUGGESTED_STORY_STARTS.filter((story) => story.mood === activeMood), [activeMood]);
  const canGenerate = Boolean(worldBible.content.trim() && characterProfiles.content.trim() && storySeed.content.trim() && !isGenerating);

  async function handleGenerate(overrides?: Partial<{ worldBible: string; characterProfiles: string; storySeed: string; storyRules: string; genrePreset: GenrePreset; narrativeArchitecture: NarrativeArchitecture; characterArc: CharacterArc; endingType: EndingType; lengthTarget: LengthTarget }>) {
    setError("");
    setStatusMessage("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worldBible: overrides?.worldBible ?? worldBible.content,
          characterProfiles: overrides?.characterProfiles ?? characterProfiles.content,
          storySeed: overrides?.storySeed ?? storySeed.content,
          storyRules: overrides?.storyRules ?? storyRules.content,
          genrePreset: overrides?.genrePreset ?? genrePreset,
          narrativeArchitecture: overrides?.narrativeArchitecture ?? narrativeArchitecture,
          characterArc: overrides?.characterArc ?? characterArc,
          endingType: overrides?.endingType ?? endingType,
          lengthTarget: overrides?.lengthTarget ?? lengthTarget
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Story generation failed.");
      const normalizedResponse = normalizeGenerateStoryResponse(payload);
      setStoryResponse(normalizedResponse);
      setCurrentStoryId(createStoryId(normalizedResponse.story));
      setActiveView("home");
      setStatusMessage("Story ready.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Story generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleMoodSelect(mood: Mood) {
    setActiveMood(mood);
  }

  function handleStartRecommendation(story: StoryStart) {
    setWorldBible({ name: `${slugify(story.title)}-world.txt`, content: story.world });
    setCharacterProfiles({ name: `${slugify(story.title)}-cast.txt`, content: story.cast });
    setStorySeed({ name: `${slugify(story.title)}-spark.txt`, content: story.seed });
    setStoryRules({ name: `${slugify(story.title)}-rules.txt`, content: story.rules });
    setGenrePreset(story.genre);
    setActiveMood(story.mood);
    setActiveView("create");
    setStatusMessage(`${story.title} loaded as a new story start.`);
  }

  function handleContinueLatest(direction?: string) {
    if (!latestStory) return;
    const continuationSeed = [
      `Continue the latest story as the next chapter. Keep continuity with this prior chapter: ${truncateText(latestStory.story, 7000)}`,
      direction?.trim() ? `Reader direction for the next chapter: ${direction.trim()}` : "Continue directly from the strongest unresolved story pressure."
    ].join("\n\n");
    void handleGenerate({
      worldBible: worldBible.content.trim() || `Existing story world inferred from ${latestStory.title}. Genre: ${latestStory.genrePreset}.`,
      characterProfiles: characterProfiles.content.trim() || `Top cast: ${latestStory.charactersUsed.length ? latestStory.charactersUsed.join(", ") : "use the established characters from the prior chapter"}.`,
      storySeed: continuationSeed,
      storyRules: storyRules.content,
      genrePreset: latestStory.genrePreset,
      narrativeArchitecture,
      characterArc,
      endingType,
      lengthTarget
    });
  }

  function handleSaveStory() {
    if (!storyResponse) return;
    const savedStory = createSavedStory(storyResponse, currentStoryId || createStoryId(storyResponse.story));
    const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
    persistSavedStories(nextSavedStories);
    setSavedStories(nextSavedStories);
    setStatusMessage("Story saved locally in this browser.");
  }

  function handleRestoreStory(story: SavedStory) {
    setStoryResponse(savedStoryToResponse(story));
    setCurrentStoryId(story.id);
    setActiveView("home");
    setStatusMessage(`Restored ${story.title}.`);
  }

  function handleDeleteStory(storyId: string) {
    const nextStories = savedStories.filter((story) => story.id !== storyId);
    persistSavedStories(nextStories);
    setSavedStories(nextStories);
    setStatusMessage("Saved story deleted.");
  }

  function handleSaveProject() {
    const trimmedName = projectName.trim();
    if (!trimmedName) return setError("Add a project name before saving this workspace.");
    const now = new Date().toISOString();
    const existing = savedProjects.find((project) => project.id === selectedProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget },
      latestStory: storyResponse,
      latestStoryFeedback: null
    };
    const nextProjects = [savedProject, ...savedProjects.filter((project) => project.id !== savedProject.id)];
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId(savedProject.id);
    setStatusMessage(`${savedProject.name} saved locally in this browser.`);
  }

  function handleLoadProject(projectId: string) {
    setSelectedProjectId(projectId);
    const project = savedProjects.find((item) => item.id === projectId);
    if (!project) return;
    applyProject(project);
    setStatusMessage(`${project.name} loaded from this browser.`);
  }

  function handleDeleteProject() {
    if (!selectedProjectId) return;
    const nextProjects = savedProjects.filter((project) => project.id !== selectedProjectId);
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId("");
    setStatusMessage("Project deleted from this browser.");
  }

  async function handleRefreshCloudProjects() {
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ projects?: CloudProjectSummary[] }>("/api/projects");
      setCloudProjects(Array.isArray(payload.projects) ? payload.projects : []);
      setCloudProjectMessage("");
    } catch (caughtError) {
      setCloudProjects([]);
      setCloudProjectMessage(`Cloud projects unavailable: ${formatCaughtError(caughtError)}`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleSaveCloudProject() {
    const trimmedName = projectName.trim();
    if (!trimmedName) return setError("Add a project name before saving to cloud projects.");
    const now = new Date().toISOString();
    const existing = cloudProjects.find((project) => project.id === selectedCloudProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const savedProject: SavedProject = {
      id: existing?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget },
      latestStory: storyResponse,
      latestStoryFeedback: null
    };
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ project: savedProject }) });
      const cloudProject = payload.project ?? savedProject;
      setSelectedCloudProjectId(cloudProject.id);
      setCloudProjects((currentProjects) => [cloudProject, ...currentProjects.filter((project) => project.id !== cloudProject.id)]);
      setCloudProjectMessage(`${cloudProject.name} saved to cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud save failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleLoadCloudProject(projectId: string) {
    setSelectedCloudProjectId(projectId);
    if (!projectId) return;
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!payload.project) throw new Error("Cloud project response was missing a project.");
      applyProject(payload.project);
      setCloudProjectMessage(`${payload.project.name} loaded from cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud load failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  async function handleDeleteCloudProject() {
    if (!selectedCloudProjectId) return;
    setIsCloudProjectsLoading(true);
    try {
      await fetchCloudJson(`/api/projects/${encodeURIComponent(selectedCloudProjectId)}`, { method: "DELETE" });
      setCloudProjects((currentProjects) => currentProjects.filter((project) => project.id !== selectedCloudProjectId));
      setSelectedCloudProjectId("");
      setCloudProjectMessage("Cloud project deleted.");
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud delete failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  function applyProject(project: SavedProject) {
    setProjectName(project.name);
    setWorldBible(project.inputs.worldBible);
    setCharacterProfiles(project.inputs.characterProfiles);
    setStorySeed(project.inputs.storySeed);
    setStoryRules(project.inputs.storyRules);
    setGenrePreset(project.selections.genrePreset);
    setNarrativeArchitecture(project.selections.narrativeArchitecture);
    setCharacterArc(project.selections.characterArc);
    setEndingType(project.selections.endingType);
    setLengthTarget(project.selections.lengthTarget);
    setStoryResponse(project.latestStory);
    setCurrentStoryId(project.latestStory ? createStoryId(project.latestStory.story, project.updatedAt) : "");
  }

  function handleSaveInputArtifact(type: InputArtifactType, value: UploadState) {
    if (!value.content.trim()) return setError(`Add ${INPUT_LABELS[type]} content before saving it to the library.`);
    const now = new Date().toISOString();
    const name = value.name.trim() || `${INPUT_LABELS[type]} ${formatLibraryVersion(now)}`;
    const artifact: InputArtifact = { id: createInputArtifactId(type, name, now), type, name, content: value.content, createdAt: now, updatedAt: now, characterCount: value.content.length };
    const nextArtifacts = [artifact, ...inputArtifacts];
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setStatusMessage(`${artifact.name} saved to the local library.`);
  }

  function handleSelectInputArtifact(type: InputArtifactType, artifactId: string) {
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) return setUploadForType(type, { ...EMPTY_UPLOAD });
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setStatusMessage(`Loaded ${artifact.name} from the local library.`);
  }

  function setUploadForType(type: InputArtifactType, value: UploadState) {
    if (type === "worldBible") setWorldBible(value);
    else if (type === "characterProfiles") setCharacterProfiles(value);
    else if (type === "storySeed") setStorySeed(value);
    else setStoryRules(value);
  }

  function clearCurrentInputs() {
    setWorldBible({ ...EMPTY_UPLOAD });
    setCharacterProfiles({ ...EMPTY_UPLOAD });
    setStorySeed({ ...EMPTY_UPLOAD });
    setStoryRules({ ...EMPTY_UPLOAD });
    setStoryResponse(null);
    setCurrentStoryId("");
    setStatusMessage("Current inputs cleared. Saved library items were not changed.");
  }

  return (
    <main className="min-h-screen px-4 py-5 text-paper md:px-8 md:py-7">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-paper/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-lantern-gold">Project Lantern</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-paper md:text-5xl">Story World Engine</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-paper/70">Continue your latest chapter, pick a mood, or start from a focused recommendation.</p>
          </div>
          <div className="flex flex-col gap-2 md:items-end"><BuildBadge buildInfo={buildInfo} /><NavTabs activeView={activeView} onChange={setActiveView} /></div>
        </header>

        {statusMessage ? <Status tone="info">{statusMessage}</Status> : null}
        {error ? <Status tone="error">{error}</Status> : null}

        {activeView === "home" ? <HomeView activeMood={activeMood} continueDirection={continueDirection} isDirectionOpen={isDirectionOpen} isGenerating={isGenerating} latestStory={latestStory} onContinue={handleContinueLatest} onDirectionChange={setContinueDirection} onMoodSelect={handleMoodSelect} onOpenDestination={setActiveView} onStartRecommendation={handleStartRecommendation} onToggleDirection={() => setIsDirectionOpen((current) => !current)} suggestedStarts={suggestedStarts} /> : null}
        {activeView === "create" ? <CreateView canGenerate={canGenerate} characterArc={characterArc} characterProfiles={characterProfiles} endingType={endingType} genrePreset={genrePreset} inputArtifacts={inputArtifacts} isGenerating={isGenerating} lengthTarget={lengthTarget} narrativeArchitecture={narrativeArchitecture} onChangeCharacterArc={setCharacterArc} onChangeEndingType={setEndingType} onChangeGenre={setGenrePreset} onChangeLengthTarget={setLengthTarget} onChangeNarrative={setNarrativeArchitecture} onChangeStoryRules={setStoryRules} onChangeStorySeed={setStorySeed} onChangeWorld={setWorldBible} onClear={clearCurrentInputs} onGenerate={() => void handleGenerate()} onSaveInputArtifact={handleSaveInputArtifact} onSelectInputArtifact={handleSelectInputArtifact} storyRules={storyRules} storySeed={storySeed} worldBible={worldBible} /> : null}
        {activeView === "library" ? <LibraryView cloudMessage={cloudProjectMessage} cloudProjects={cloudProjects} isCloudLoading={isCloudProjectsLoading} onDeleteCloudProject={handleDeleteCloudProject} onDeleteProject={handleDeleteProject} onDeleteStory={handleDeleteStory} onLoadCloudProject={handleLoadCloudProject} onLoadProject={handleLoadProject} onProjectNameChange={setProjectName} onRefreshCloud={handleRefreshCloudProjects} onRestoreStory={handleRestoreStory} onSaveCloudProject={handleSaveCloudProject} onSaveProject={handleSaveProject} onSaveStory={handleSaveStory} projectName={projectName} savedProjects={savedProjects} savedStories={savedStories} selectedCloudProjectId={selectedCloudProjectId} selectedProjectId={selectedProjectId} storyResponse={storyResponse} /> : null}
        {activeView === "characters" ? <CharactersView onOpenStory={handleStartRecommendation} /> : null}
        {activeView === "worlds" ? <WorldsView onOpenStory={handleStartRecommendation} /> : null}
      </section>
    </main>
  );
}

function HomeView(props: { activeMood: Mood; continueDirection: string; isDirectionOpen: boolean; isGenerating: boolean; latestStory: LibraryStory | null; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onMoodSelect: (mood: Mood) => void; onOpenDestination: (view: AppView) => void; onStartRecommendation: (story: StoryStart) => void; onToggleDirection: () => void; suggestedStarts: StoryStart[] }) {
  const { activeMood, continueDirection, isDirectionOpen, isGenerating, latestStory, onContinue, onDirectionChange, onMoodSelect, onOpenDestination, onStartRecommendation, onToggleDirection, suggestedStarts } = props;
  return <div className="grid gap-6">{latestStory ? <ContinueReadingCard direction={continueDirection} isDirectionOpen={isDirectionOpen} isGenerating={isGenerating} onContinue={onContinue} onDirectionChange={onDirectionChange} onToggleDirection={onToggleDirection} story={latestStory} /> : null}<DestinationRail onOpen={onOpenDestination} /><MoodPicker activeMood={activeMood} onSelect={onMoodSelect} /><SuggestedStoryStarts stories={suggestedStarts} onStart={onStartRecommendation} /></div>;
}

function ContinueReadingCard({ direction, isDirectionOpen, isGenerating, onContinue, onDirectionChange, onToggleDirection, story }: { direction: string; isDirectionOpen: boolean; isGenerating: boolean; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onToggleDirection: () => void; story: LibraryStory }) {
  const cast = story.charactersUsed.slice(0, 3);
  return <section className="rounded-md border border-lantern-gold/25 bg-soft-card/95 p-4 text-primary-dark shadow-soft md:p-5"><div className="grid gap-4 md:grid-cols-[132px_1fr]"><CoverArt title={story.title} /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-aged-brass">Continue Reading</p><h2 className="mt-2 text-2xl font-semibold leading-tight text-primary-dark md:text-3xl">{story.title}</h2><p className="mt-2 text-sm leading-6 text-muted-light">Top cast: {cast.length ? cast.join(", ") : "Cast will be inferred from the latest chapter."}</p><div className="mt-4 rounded-md bg-white/65 p-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-light">What happened last chapter</p><p className="mt-2 text-sm leading-6 text-primary-dark/75">{truncateText(story.story, 280)}</p></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><button className="rounded-md bg-primary-dark px-5 py-3 text-sm font-semibold text-primary-light transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue()} type="button">{isGenerating ? "Continuing..." : "Next Chapter"}</button><button className="min-w-fit rounded-md border border-aged-brass/50 bg-white/80 px-5 py-3 text-sm font-semibold leading-5 text-aged-brass transition hover:border-aged-brass hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={onToggleDirection} type="button">Next Chapter with Input</button></div>{isDirectionOpen ? <div className="mt-4 rounded-md border border-aged-brass/25 bg-white/70 p-3"><label className="flex flex-col gap-2"><span className="text-sm font-semibold text-primary-dark">Add direction before continuing</span><textarea className="min-h-24 rounded-md border border-primary-dark/15 bg-white px-3 py-2 text-sm leading-6 text-primary-dark outline-none focus:border-aged-brass focus:ring-2 focus:ring-aged-brass/20" onChange={(event) => onDirectionChange(event.target.value)} placeholder="Ask for a tone, reveal, character focus, or unresolved thread." value={direction} /></label><button className="mt-3 rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue(direction)} type="button">Continue with Input</button></div> : null}</div></div></section>;
}

function DestinationRail({ onOpen }: { onOpen: (view: AppView) => void }) {
  return <nav className="grid gap-3 sm:grid-cols-3" aria-label="Story destinations"><DestinationButton label="Story Library" detail="Saved stories and projects" onClick={() => onOpen("library")} /><DestinationButton label="Characters" detail="Named cast references" onClick={() => onOpen("characters")} /><DestinationButton label="Worlds" detail="Places and settings" onClick={() => onOpen("worlds")} /></nav>;
}

function DestinationButton({ detail, label, onClick }: { detail: string; label: string; onClick: () => void }) { return <button className="rounded-md border border-paper/12 bg-paper/10 p-4 text-left transition hover:border-lantern-gold/50 hover:bg-paper/15" onClick={onClick} type="button"><span className="block text-base font-semibold text-paper">{label}</span><span className="mt-1 block text-sm leading-6 text-paper/60">{detail}</span></button>; }
function MoodPicker({ activeMood, onSelect }: { activeMood: Mood; onSelect: (mood: Mood) => void }) { return <section><h2 className="text-2xl font-semibold text-paper">What are you in the mood for?</h2><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{MOODS.map((mood) => <button className={`rounded-md border px-4 py-4 text-left text-sm font-semibold transition ${activeMood === mood ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50"}`} key={mood} onClick={() => onSelect(mood)} type="button">{mood}</button>)}</div></section>; }
function SuggestedStoryStarts({ onStart, stories }: { onStart: (story: StoryStart) => void; stories: StoryStart[] }) { return <section><h2 className="text-2xl font-semibold text-paper">Suggested Story Starts</h2><div className="mt-4 grid gap-4 lg:grid-cols-2">{stories.map((story) => <StoryStartCard key={story.title} onStart={onStart} story={story} />)}</div></section>; }
function StoryStartCard({ onStart, story }: { onStart: (story: StoryStart) => void; story: StoryStart }) { return <article className="rounded-md border border-paper/12 bg-paper/10 p-4"><div className="grid gap-4 sm:grid-cols-[112px_1fr]"><CoverArt title={story.title} /><div className="min-w-0"><div className="flex flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><h3 className="mt-3 text-xl font-semibold leading-tight text-paper">{story.title}</h3><p className="mt-2 text-sm leading-6 text-paper/70">{story.premise}</p><div className="mt-4 flex items-center gap-3"><HeroPortrait name={story.heroName} /><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-paper/45">Hero / heroine</p><p className="mt-1 text-sm font-semibold text-paper">{story.heroName}</p></div></div><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink transition hover:bg-lantern-gold/90" onClick={() => onStart(story)} type="button">Start This Story</button></div></div></article>; }

function CreateView(props: { canGenerate: boolean; characterArc: CharacterArc; characterProfiles: UploadState; endingType: EndingType; genrePreset: GenrePreset; inputArtifacts: InputArtifact[]; isGenerating: boolean; lengthTarget: LengthTarget; narrativeArchitecture: NarrativeArchitecture; onChangeCharacterArc: (value: CharacterArc) => void; onChangeEndingType: (value: EndingType) => void; onChangeGenre: (value: GenrePreset) => void; onChangeLengthTarget: (value: LengthTarget) => void; onChangeNarrative: (value: NarrativeArchitecture) => void; onChangeStoryRules: (value: UploadState) => void; onChangeStorySeed: (value: UploadState) => void; onChangeWorld: (value: UploadState) => void; onClear: () => void; onGenerate: () => void; onSaveInputArtifact: (type: InputArtifactType, value: UploadState) => void; onSelectInputArtifact: (type: InputArtifactType, artifactId: string) => void; storyRules: UploadState; storySeed: UploadState; worldBible: UploadState }) {
  const { canGenerate, characterArc, characterProfiles, endingType, genrePreset, inputArtifacts, isGenerating, lengthTarget, narrativeArchitecture, onChangeCharacterArc, onChangeEndingType, onChangeGenre, onChangeLengthTarget, onChangeNarrative, onChangeStoryRules, onChangeStorySeed, onChangeWorld, onClear, onGenerate, onSaveInputArtifact, onSelectInputArtifact, storyRules, storySeed, worldBible } = props;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,460px)_1fr]"><section className="grid gap-4"><InputPanel artifactType="worldBible" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "worldBible")} onChange={onChangeWorld} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Storyworld" value={worldBible} /><InputPanel artifactType="characterProfiles" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "characterProfiles")} onChange={(value) => onChangeCharacterProfilesCompat(value, props)} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Cast" value={characterProfiles} /><InputPanel artifactType="storySeed" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storySeed")} onChange={onChangeStorySeed} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Story Spark" value={storySeed} /><InputPanel artifactType="storyRules" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storyRules")} onChange={onChangeStoryRules} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Craft Rules" value={storyRules} /><button className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper" onClick={onClear} type="button">Clear current inputs</button></section><section className="rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Story Architecture</h2><div className="mt-4 grid gap-3"><SelectControl label="Genre Preset" onChange={(value) => onChangeGenre(value as GenrePreset)} options={GENRE_PRESETS} value={genrePreset} /><SelectControl label="Narrative Architecture" onChange={(value) => onChangeNarrative(value as NarrativeArchitecture)} options={NARRATIVE_ARCHITECTURES} value={narrativeArchitecture} /><SelectControl label="Character Arc" onChange={(value) => onChangeCharacterArc(value as CharacterArc)} options={CHARACTER_ARCS} value={characterArc} /><SelectControl label="Ending Type" onChange={(value) => onChangeEndingType(value as EndingType)} options={ENDING_TYPES} value={endingType} /><SelectControl label="Length Target" onChange={(value) => onChangeLengthTarget(value as LengthTarget)} options={LENGTH_TARGETS.map((target) => ({ value: target.value, label: target.label }))} value={lengthTarget} /></div><button className="mt-5 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!canGenerate} onClick={onGenerate} type="button">{isGenerating ? "Generating story..." : "Generate Story"}</button>{!storyRules.content.trim() ? <p className="mt-3 rounded-md bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/55">{DEFAULT_STORY_RULES_NOTICE}</p> : null}</section></div>;
}

function onChangeCharacterProfilesCompat(value: UploadState, props: { onChangeStoryRules: (value: UploadState) => void; characterProfiles: UploadState }) { props.characterProfiles.name = value.name; props.characterProfiles.content = value.content; props.characterProfiles.libraryArtifactId = value.libraryArtifactId; }

function InputPanel({ artifactType, libraryArtifacts, onChange, onSave, onSelect, title, value }: { artifactType: InputArtifactType; libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onSave: (type: InputArtifactType, value: UploadState) => void; onSelect: (type: InputArtifactType, artifactId: string) => void; title: string; value: UploadState }) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return;
    onChange({ name: file.name, content: await file.text() });
  }
  return <section className="rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-lg font-semibold text-paper">{title}</h2><select className="mt-3 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onSelect(artifactType, event.target.value)} value={value.libraryArtifactId ?? ""}><option value="">Choose saved item</option>{libraryArtifacts.map((artifact) => <option key={artifact.id} value={artifact.id}>{artifact.name}</option>)}</select><textarea className="mt-3 min-h-32 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold" onChange={(event) => onChange({ name: value.name || `${slugify(title)}.txt`, content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder={`Add ${title.toLowerCase()} text`} value={value.content} /><label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-lantern-gold/50 px-4 py-3 text-sm font-semibold text-lantern-gold"><span>{value.name || "Upload .md or .txt"}</span><input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} /></label><button className="mt-3 rounded-md border border-lantern-gold/45 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={!value.content.trim()} onClick={() => onSave(artifactType, value)} type="button">Save to Library</button></section>;
}

function LibraryView(props: { cloudMessage: string; cloudProjects: CloudProjectSummary[]; isCloudLoading: boolean; onDeleteCloudProject: () => void; onDeleteProject: () => void; onDeleteStory: (storyId: string) => void; onLoadCloudProject: (projectId: string) => void; onLoadProject: (projectId: string) => void; onProjectNameChange: (name: string) => void; onRefreshCloud: () => void; onRestoreStory: (story: SavedStory) => void; onSaveCloudProject: () => void; onSaveProject: () => void; onSaveStory: () => void; projectName: string; savedProjects: SavedProject[]; savedStories: SavedStory[]; selectedCloudProjectId: string; selectedProjectId: string; storyResponse: GenerateStoryResponse | null }) {
  const { cloudMessage, cloudProjects, isCloudLoading, onDeleteCloudProject, onDeleteProject, onDeleteStory, onLoadCloudProject, onLoadProject, onProjectNameChange, onRefreshCloud, onRestoreStory, onSaveCloudProject, onSaveProject, onSaveStory, projectName, savedProjects, savedStories, selectedCloudProjectId, selectedProjectId, storyResponse } = props;
  return <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]"><section className="rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Story Library</h2><p className="mt-1 text-sm leading-6 text-paper/65">Saved stories and project workspaces live here, away from the home page.</p><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!storyResponse} onClick={onSaveStory} type="button">Save Current Story</button><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-paper">Project Name</span><input className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onProjectNameChange(event.target.value)} placeholder="My story project" value={projectName} /></label><div className="mt-3 flex flex-wrap gap-2"><SmallButton onClick={onSaveProject}>Save Project</SmallButton><SmallButton disabled={!selectedProjectId} onClick={onDeleteProject}>Delete Project</SmallButton><SmallButton disabled={isCloudLoading} onClick={onRefreshCloud}>{isCloudLoading ? "Syncing..." : "Refresh Cloud"}</SmallButton><SmallButton disabled={isCloudLoading} onClick={onSaveCloudProject}>Save to Cloud</SmallButton><SmallButton disabled={isCloudLoading || !selectedCloudProjectId} onClick={onDeleteCloudProject}>Delete Cloud</SmallButton></div><SelectLibrary label="Load Project" onChange={onLoadProject} options={savedProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedProjectId} /><SelectLibrary label="Load Cloud Project" onChange={onLoadCloudProject} options={cloudProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedCloudProjectId} />{cloudMessage ? <p className="mt-3 rounded-md border border-lantern-gold/25 bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/65">{cloudMessage}</p> : null}</section><section className="grid gap-3">{savedStories.length === 0 ? <EmptyPanel title="No saved stories yet" body="Save a generated story and it will appear in this library." /> : savedStories.map((story) => <article className="rounded-md border border-paper/12 bg-paper/10 p-4" key={story.id}><h3 className="text-lg font-semibold text-paper">{story.title}</h3><p className="mt-1 text-sm leading-6 text-paper/60">{formatDateTime(story.createdAt)} | {story.wordCount.toLocaleString()} words | {story.genrePreset}</p><p className="mt-3 text-sm leading-6 text-paper/70">{truncateText(story.story, 220)}</p><div className="mt-4 flex flex-wrap gap-2"><SmallButton onClick={() => onRestoreStory(story)}>Open</SmallButton><SmallButton onClick={() => onDeleteStory(story.id)}>Delete</SmallButton></div></article>)}</section></div>;
}

function CharactersView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  return <section><h2 className="text-2xl font-semibold text-paper">Characters</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">Named character references are separated from the home page and structured for future favorites or usage sorting.</p><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{SUGGESTED_STORY_STARTS.map((story) => <article className="rounded-md border border-paper/12 bg-paper/10 p-4" key={story.heroName}><HeroPortrait name={story.heroName} /><h3 className="mt-3 text-lg font-semibold text-paper">{story.heroName}</h3><p className="mt-1 text-sm font-semibold text-lantern-gold">Lead character</p><p className="mt-2 text-sm leading-6 text-paper/70">{characterBio(story.heroName)}</p><button className="mt-3 text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">Appears in {story.title}</button></article>)}</div></section>;
}

function WorldsView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  return <section><h2 className="text-2xl font-semibold text-paper">Worlds</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">World and place references are now their own destination, ready for future ranking without building that system yet.</p><div className="mt-5 grid gap-4 md:grid-cols-2">{SUGGESTED_STORY_STARTS.map((story) => <article className="rounded-md border border-paper/12 bg-paper/10 p-4" key={story.world}><CoverArt title={story.title} /><h3 className="mt-4 text-lg font-semibold text-paper">{worldNameForStory(story)}</h3><div className="mt-2 flex flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><p className="mt-3 text-sm leading-6 text-paper/70">{story.world}</p><button className="mt-3 text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">Appears in {story.title}</button></article>)}</div></section>;
}

function NavTabs({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) { const tabs: { label: string; view: AppView }[] = [{ label: "Home", view: "home" }, { label: "Create", view: "create" }, { label: "Library", view: "library" }, { label: "Characters", view: "characters" }, { label: "Worlds", view: "worlds" }]; return <nav className="flex flex-wrap gap-2">{tabs.map((tab) => <button className={`rounded-md border px-3 py-2 text-xs font-semibold ${activeView === tab.view ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper"}`} key={tab.view} onClick={() => onChange(tab.view)} type="button">{tab.label}</button>)}</nav>; }
function BuildBadge({ buildInfo }: { buildInfo: BuildInfo }) { return <div className="rounded-md border border-lantern-gold/25 bg-paper/10 px-3 py-2 text-xs font-semibold text-paper/65">Version {buildInfo.appVersion} | {buildInfo.buildEnvironment} | {buildInfo.gitBranch} | {buildInfo.shortCommitSha}</div>; }
function CoverArt({ title }: { title: string }) { return <div aria-label={`${title} cover art`} className="flex aspect-[3/4] min-h-36 w-full max-w-36 flex-col justify-between rounded-md border border-primary-dark/10 bg-gradient-to-br from-lantern-gold via-sea-glass to-twilight-blue p-3 text-night-ink"><span className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Story Start</span><span className="text-lg font-semibold leading-tight">{title.split(" ").slice(0, 3).join(" ")}</span></div>; }
function HeroPortrait({ name }: { name: string }) { return <div aria-label={`${name} artwork`} className="flex size-16 shrink-0 items-center justify-center rounded-md border border-paper/15 bg-paper/10 text-lg font-semibold text-lantern-gold">{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>; }
function Tag({ children }: { children: ReactNode }) { return <span className="rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold text-lantern-gold">{children}</span>; }
function SmallButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) { return <button className="rounded-md border border-lantern-gold/40 bg-paper/10 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function Status({ children, tone }: { children: ReactNode; tone: "info" | "error" }) { return <div className={`rounded-md border px-4 py-3 text-sm ${tone === "error" ? "border-ember/40 bg-ember/10 text-ember" : "border-lantern-gold/30 bg-paper/10 text-paper/75"}`}>{children}</div>; }
function EmptyPanel({ body, title }: { body: string; title: string }) { return <div className="rounded-md border border-paper/12 bg-paper/10 p-5"><h3 className="text-lg font-semibold text-paper">{title}</h3><p className="mt-2 text-sm leading-6 text-paper/65">{body}</p></div>; }
function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[] | readonly { value: string; label: string }[]; onChange: (value: string) => void }) { return <label className="flex flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const optionLabel = typeof option === "string" ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select></label>; }
function SelectLibrary({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: { label: string; value: string }[]; value: string }) { return <label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Choose one</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

function responseToLibraryStory(response: GenerateStoryResponse, id: string): LibraryStory { return { id, title: createStoryTitle(response.story), story: response.story, wordCount: response.metadata.wordCount, createdAt: new Date().toISOString(), genrePreset: response.metadata.diagnostics.genrePreset, charactersUsed: response.metadata.charactersUsed, rulesReferenced: response.metadata.rulesReferenced }; }
function normalizeGenerateStoryResponse(payload: unknown): GenerateStoryResponse { const normalizedPayload = normalizeStoryPayload(payload) as Partial<GenerateStoryResponse>; const story = normalizeStoryText(normalizedPayload.story); if (!story || !normalizedPayload.metadata) throw new Error("Story generation returned an invalid response."); return { ...normalizedPayload, story, metadata: { ...normalizedPayload.metadata, wordCount: countWords(story) } } as GenerateStoryResponse; }
async function fetchCloudJson<T>(input: string, init?: RequestInit): Promise<T> { const response = await fetch(input, { ...init, cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Cloud project request failed."); return payload as T; }
async function getNextCloudStorySequenceNumber(projectId: string): Promise<number> { const payload = await fetchCloudJson<{ stories?: CloudSavedStorySummary[] }>(`/api/projects/${encodeURIComponent(projectId)}/stories`); const stories = Array.isArray(payload.stories) ? payload.stories : []; return stories.reduce((highest, story) => Math.max(highest, typeof story.sequenceNumber === "number" ? story.sequenceNumber : 0), 0) + 1; }
function countWords(text: string): number { return text.trim().split(/\s+/).filter(Boolean).length; }
function createStoryId(story: string, createdAt = new Date().toISOString()): string { return `${createdAt}-${story.length}`.replace(/[^a-zA-Z0-9_-]/g, "-"); }
function createStoryTitle(story: string): string { const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story"; const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine; return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story"; }
function truncateText(text: string, maxLength: number): string { const compact = text.replace(/\s+/g, " ").trim(); return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story-world-engine-story"; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatLibraryVersion(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, ""); }
function formatCaughtError(caughtError: unknown): string { return caughtError instanceof Error ? caughtError.message : "Cloud project request failed."; }
function characterBio(name: string): string { const match = SUGGESTED_STORY_STARTS.find((story) => story.heroName === name); return match ? `${name} anchors ${match.title.toLowerCase()} with a clear want, a pressure point, and a world-specific problem to solve.` : `${name} is ready to anchor a future story.`; }
function worldNameForStory(story: StoryStart): string { if (story.title.includes("Lighthouse")) return "The Buried Lighthouse"; if (story.title.includes("Orchard")) return "The Moon Orchard"; if (story.title.includes("Engine")) return "Harbor Repair Yard"; return "The Seven-Door City"; }
