"use client";

import { type ChangeEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";
import { CHARACTER_ARCS, ENDING_TYPES, GENRE_PRESETS, LENGTH_TARGETS, NARRATIVE_ARCHITECTURES } from "@/lib/types";
import type { CharacterArc, EndingType, GenerateStoryResponse, GenrePreset, LengthTarget, NarrativeArchitecture } from "@/lib/types";
import { createInputArtifactId, createSavedProjectId, createSavedStory, persistInputArtifacts, persistSavedProjects, persistSavedStories, readInputArtifacts, readSavedProjects, readSavedStories, savedStoryToResponse } from "@/lib/project-persistence";
import type { InputArtifact, InputArtifactType, SavedProject, SavedStory, UploadState } from "@/lib/project-persistence";

type AppView = "home" | "library" | "worlds" | "create" | "characters";
type Mood = "Mystery" | "Wonder" | "Emotional" | "Adventure" | "Strange" | "Hopeful" | "Dark" | "Reflective";
type CloudProjectSummary = Pick<SavedProject, "id" | "name" | "createdAt" | "updatedAt">;
type StoryStart = { title: string; premise: string; genre: GenrePreset; mood: Mood; heroName: string; heroRole: string; heroBio: string; worldName: string; world: string; seed: string; cast: string; rules: string };
type LibraryStory = SavedStory | { id: string; title: string; story: string; wordCount: number; createdAt: string; genrePreset: GenrePreset; charactersUsed: string[]; rulesReferenced: string[] };
type StoryBrief = { hook: string; recap: string; changed: string; tension: string; nextHook: string; heroName: string; heroRole: string; struggle: string };

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const INPUT_LABELS: Record<InputArtifactType, string> = { worldBible: "Storyworld", characterProfiles: "Cast", storySeed: "Story Spark", storyRules: "Craft Rules" };
const MOODS: Mood[] = ["Mystery", "Wonder", "Emotional", "Adventure", "Strange", "Hopeful", "Dark", "Reflective"];
const DEFAULT_STORY_RULES_NOTICE = "Default craft rules are used automatically when this is empty.";
const DEMO_LATEST_STORY_STORAGE_KEY = "projectLantern.demoLatestStory.v1";
const DEMO_LATEST_STORY_ID = "demo-the-half-life-of-magic";
const NAV_ITEMS: { label: string; view: AppView }[] = [
  { label: "Home", view: "home" },
  { label: "Story Library", view: "library" },
  { label: "Worlds", view: "worlds" },
  { label: "Create", view: "create" },
  { label: "Characters", view: "characters" }
];
const DEMO_STORY_TEXT = [
  "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  "Mara Vale found the first talisman inside a box of ordinary estate-sale objects.",
  "When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  "Someone else knows the talisman has awakened, and they are already looking for it."
].join("\n\n");
const DEMO_STORY_BRIEF: StoryBrief = {
  hook: "A forgotten talisman from an estate sale begins to hum with a magic that should have died years ago.",
  recap: "Mara found the first talisman inside a box of ordinary estate-sale objects. When she touched it, the room shifted, a hidden mark appeared on an old receipt, and somewhere far away an ancient wanderer felt the signal return.",
  changed: "The talisman has proven that dead magic is not dead at all, and Mara is now part of whatever has begun to wake.",
  tension: "Someone else knows the talisman has awakened, and they are already looking for it.",
  nextHook: "Mara must decide whether to follow the talisman's signal before she understands what it is waking.",
  heroName: "Mara Vale",
  heroRole: "The Seeker",
  struggle: "Mara must decide whether to follow the talisman's signal before she understands what it is waking."
};

const SUGGESTED_STORY_STARTS: StoryStart[] = [
  { title: "The Lighthouse Under Main Street", premise: "A night-shift archivist finds a working lighthouse buried beneath a landlocked town.", genre: "Speculative Mystery", mood: "Mystery", heroName: "Mara Venn", heroRole: "Archivist investigator", heroBio: "A careful town archivist who notices when public records change after midnight and cannot leave an impossible civic mystery alone.", worldName: "Bellwether Courthouse Archive", world: "A rain-polished mill town where civic records sometimes rewrite themselves after midnight.", seed: "Mara Venn discovers a salt-stained lighthouse staircase below the courthouse archive and hears a foghorn answering from the town square.", cast: "Mara Venn - careful town archivist with a talent for noticing altered records. Jules Ardent - former surveyor who remembers streets no map admits.", rules: "Keep the mystery concrete, civic, and emotional. Let the lighthouse reveal one cost before it offers any answer." },
  { title: "Orchard of Borrowed Moons", premise: "A botanist tends trees that grow small moons, each carrying someone else's unfinished wish.", genre: "Contemporary Fantastical / Magical Realist", mood: "Wonder", heroName: "Iris Calder", heroRole: "Botanist caretaker", heroBio: "A patient botanist who trusts field notes and folklore in equal measure, especially when the orchard begins speaking in borrowed wishes.", worldName: "Calder Moon Orchard", world: "A hillside orchard outside a modern city where lunar fruit ripens only during power outages.", seed: "Iris Calder harvests a moon no larger than an apple and hears her missing brother's laugh inside its pale skin.", cast: "Iris Calder - patient botanist who trusts evidence and folklore in equal measure. Niko Vale - repair electrician who knows which outages are deliberate.", rules: "Favor luminous sensory detail, grounded relationships, and wonder with consequences." },
  { title: "The Quiet Engine", premise: "A grieving mechanic repairs a machine that turns silence into messages from possible futures.", genre: "Literary Science Fiction", mood: "Emotional", heroName: "Samir Holt", heroRole: "Memory mechanic", heroBio: "A gifted mechanic avoiding a family loss until a banned listening engine makes every unsaid goodbye dangerously audible.", worldName: "North Pier Repair Yard", world: "A coastal repair yard where obsolete machines are preserved for the memories trapped in their parts.", seed: "Samir Holt restarts a banned listening engine and receives a message from a future in which he never says goodbye.", cast: "Samir Holt - gifted mechanic avoiding a family loss. Lena Quill - safety inspector who once helped shut the engine down.", rules: "Keep the science intimate. Every future message should force a present-tense choice." },
  { title: "Map of the Seventh Door", premise: "A courier must cross seven impossible thresholds before sunrise to return a stolen city map.", genre: "Speculative Mystery", mood: "Adventure", heroName: "Talia Reed", heroRole: "Threshold courier", heroBio: "A quick courier with an old civic debt, fast enough for impossible routes and honest enough to fear what the seventh door knows.", worldName: "The Seven-Door City", world: "A layered city where doors can open into old decisions, lost districts, and rooms that remember names.", seed: "Talia Reed steals back a living map and learns the seventh door will only open for someone who has betrayed the city once.", cast: "Talia Reed - quick courier with an old civic debt. Rowan Saye - mapmaker whose loyalties change with every door.", rules: "Make each threshold active, surprising, and tied to Talia's choices rather than puzzle mechanics alone." }
];

export default function Home() {
  const searchParams = useSearchParams();
  const [activeView, setActiveView] = useState<AppView>(readAppView(searchParams.get("view")) ?? "home");
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
  const [demoStory, setDemoStory] = useState<SavedStory | null>(null);
  const [cloudProjects, setCloudProjects] = useState<CloudProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedCloudProjectId, setSelectedCloudProjectId] = useState("");
  const [cloudProjectMessage, setCloudProjectMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isCloudProjectsLoading, setIsCloudProjectsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [continueDirection, setContinueDirection] = useState("");
  const [isDirectionOpen, setIsDirectionOpen] = useState(false);

  useEffect(() => {
    const requestedView = readAppView(searchParams.get("view")) ?? "home";
    setActiveView(requestedView);
  }, [searchParams]);

  useEffect(() => {
    const handlePopState = () => setActiveView(readAppView(new URLSearchParams(window.location.search).get("view")) ?? "home");
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const browserSavedStories = readSavedStories();
    setInputArtifacts(readInputArtifacts());
    setSavedStories(browserSavedStories);
    setSavedProjects(readSavedProjects());
    setDemoStory(browserSavedStories.length === 0 ? readDemoLatestStory() : null);
    void handleRefreshCloudProjects();
  }, []);

  const hasRealLatestStory = Boolean(storyResponse || savedStories.length);
  const latestStory = useMemo<LibraryStory | null>(() => {
    if (storyResponse) return responseToLibraryStory(storyResponse, currentStoryId || createStoryId(storyResponse.story));
    return savedStories[0] ?? demoStory;
  }, [currentStoryId, demoStory, savedStories, storyResponse]);
  const suggestedStarts = useMemo(() => sortStoryStartsByMood(activeMood), [activeMood]);
  const currentGeneratedStory = useMemo(() => storyResponse ? responseToLibraryStory(storyResponse, currentStoryId || createStoryId(storyResponse.story)) : null, [currentStoryId, storyResponse]);
  const canGenerate = Boolean(worldBible.content.trim() && characterProfiles.content.trim() && storySeed.content.trim() && !isGenerating);

  function navigateToView(view: AppView) {
    setActiveView(view);
    if (typeof window === "undefined") return;
    const nextUrl = view === "home" ? window.location.pathname : `${window.location.pathname}?view=${view}`;
    window.history.pushState(null, "", nextUrl);
  }

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
      clearDemoLatestStory();
      setDemoStory(null);
      navigateToView("home");
      setStatusMessage("Story ready.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Story generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStartRecommendation(story: StoryStart) {
    setWorldBible({ name: `${slugify(story.title)}-world.txt`, content: story.world });
    setCharacterProfiles({ name: `${slugify(story.title)}-cast.txt`, content: story.cast });
    setStorySeed({ name: `${slugify(story.title)}-spark.txt`, content: story.seed });
    setStoryRules({ name: `${slugify(story.title)}-rules.txt`, content: story.rules });
    setGenrePreset(story.genre);
    setActiveMood(story.mood);
    navigateToView("create");
    setStatusMessage(`${story.title} is ready to begin.`);
  }

  function handleLoadDemoStory() {
    if (hasRealLatestStory) return;
    const nextDemoStory = createDemoLatestStory();
    persistDemoLatestStory(nextDemoStory);
    setDemoStory(nextDemoStory);
    navigateToView("home");
    setStatusMessage("Demo story loaded for review. Your saved history was not changed.");
  }

  function handleClearDemoStory() {
    clearDemoLatestStory();
    setDemoStory(null);
    setStatusMessage("Demo story cleared. Your saved history was not changed.");
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
    clearDemoLatestStory();
    setDemoStory(null);
    navigateToView("home");
    setStatusMessage(`Restored ${story.title}.`);
  }

  function handleDeleteStory(storyId: string) {
    const nextStories = savedStories.filter((story) => story.id !== storyId);
    persistSavedStories(nextStories);
    setSavedStories(nextStories);
    setStatusMessage("Saved story deleted.");
  }

  function handleOpenCurrentStory() {
    navigateToView("home");
  }

  function handleExportLatestStory() {
    if (!latestStory) return;
    downloadTextFile(`${slugify(latestStory.title)}.txt`, latestStory.story);
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
    clearDemoLatestStory();
    setDemoStory(null);
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
      clearDemoLatestStory();
      setDemoStory(null);
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
    <main className="min-h-screen overflow-x-hidden px-3 pb-24 pt-3 text-paper sm:px-4 md:px-8 md:py-7">
      <section className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 md:gap-6">
        <MobileTopHeader />
        <header className="hidden min-w-0 flex-col gap-5 border-b border-paper/10 pb-6 md:flex md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-lantern-gold sm:tracking-[0.22em]">Project Lantern</p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-paper md:text-5xl">Living stories, ready when you are</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-paper/70">Open the latest episode, remember what mattered, and choose what kind of story should find you next.</p>
          </div>
          <NavTabs activeView={activeView} onChange={navigateToView} />
        </header>

        {statusMessage ? <Status tone="info">{statusMessage}</Status> : null}
        {error ? <Status tone="error">{error}</Status> : null}

        {activeView === "home" ? <HomeView activeMood={activeMood} canUseDemoStory={!hasRealLatestStory} continueDirection={continueDirection} hasDemoStory={Boolean(demoStory)} isDirectionOpen={isDirectionOpen} isGenerating={isGenerating} latestStory={latestStory} onClearDemoStory={handleClearDemoStory} onContinue={handleContinueLatest} onDirectionChange={setContinueDirection} onExportStory={handleExportLatestStory} onLoadDemoStory={handleLoadDemoStory} onMoodSelect={setActiveMood} onStartRecommendation={handleStartRecommendation} onToggleDirection={() => setIsDirectionOpen((current) => !current)} suggestedStarts={suggestedStarts} /> : null}
        {activeView === "library" ? <LibraryView cloudMessage={cloudProjectMessage} cloudProjects={cloudProjects} currentStory={currentGeneratedStory} isCloudLoading={isCloudProjectsLoading} onDeleteCloudProject={handleDeleteCloudProject} onDeleteProject={handleDeleteProject} onDeleteStory={handleDeleteStory} onLoadCloudProject={handleLoadCloudProject} onLoadProject={handleLoadProject} onOpenCurrentStory={handleOpenCurrentStory} onProjectNameChange={setProjectName} onRefreshCloud={handleRefreshCloudProjects} onRestoreStory={handleRestoreStory} onSaveCloudProject={handleSaveCloudProject} onSaveProject={handleSaveProject} onSaveStory={handleSaveStory} projectName={projectName} savedProjects={savedProjects} savedStories={savedStories} selectedCloudProjectId={selectedCloudProjectId} selectedProjectId={selectedProjectId} storyResponse={storyResponse} /> : null}
        {activeView === "worlds" ? <WorldsView onOpenStory={handleStartRecommendation} /> : null}
        {activeView === "create" ? <CreateView canGenerate={canGenerate} characterArc={characterArc} characterProfiles={characterProfiles} endingType={endingType} genrePreset={genrePreset} inputArtifacts={inputArtifacts} isGenerating={isGenerating} lengthTarget={lengthTarget} narrativeArchitecture={narrativeArchitecture} onChangeCharacterArc={setCharacterArc} onChangeCharacterProfiles={setCharacterProfiles} onChangeEndingType={setEndingType} onChangeGenre={setGenrePreset} onChangeLengthTarget={setLengthTarget} onChangeNarrative={setNarrativeArchitecture} onChangeStoryRules={setStoryRules} onChangeStorySeed={setStorySeed} onChangeWorld={setWorldBible} onClear={clearCurrentInputs} onGenerate={() => void handleGenerate()} onSaveInputArtifact={handleSaveInputArtifact} onSelectInputArtifact={handleSelectInputArtifact} storyRules={storyRules} storySeed={storySeed} worldBible={worldBible} /> : null}
        {activeView === "characters" ? <CharactersView onOpenStory={handleStartRecommendation} /> : null}
      </section>
      <MobileBottomNav activeView={activeView} onChange={navigateToView} />
    </main>
  );
}

function HomeView(props: { activeMood: Mood; canUseDemoStory: boolean; continueDirection: string; hasDemoStory: boolean; isDirectionOpen: boolean; isGenerating: boolean; latestStory: LibraryStory | null; onClearDemoStory: () => void; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onExportStory: () => void; onLoadDemoStory: () => void; onMoodSelect: (mood: Mood) => void; onStartRecommendation: (story: StoryStart) => void; onToggleDirection: () => void; suggestedStarts: StoryStart[] }) {
  const { activeMood, canUseDemoStory, continueDirection, hasDemoStory, isDirectionOpen, isGenerating, latestStory, onClearDemoStory, onContinue, onDirectionChange, onExportStory, onLoadDemoStory, onMoodSelect, onStartRecommendation, onToggleDirection, suggestedStarts } = props;
  const [isRecapOpen, setIsRecapOpen] = useState(false);
  const storyBrief = latestStory ? createStoryBrief(latestStory) : null;

  return <div className="grid min-w-0 gap-6 md:gap-8"><div className="md:hidden"><MobileHomeView activeMood={activeMood} brief={storyBrief} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} isGenerating={isGenerating} isRecapOpen={isRecapOpen} latestStory={latestStory} onClearDemoStory={onClearDemoStory} onCloseRecap={() => setIsRecapOpen(false)} onContinue={onContinue} onLoadDemoStory={onLoadDemoStory} onMoodSelect={onMoodSelect} onOpenRecap={() => setIsRecapOpen(true)} onStartRecommendation={onStartRecommendation} suggestedStarts={suggestedStarts} /></div><div className="hidden md:grid md:min-w-0 md:gap-8">{latestStory && storyBrief ? <CurrentStoryCard brief={storyBrief} direction={continueDirection} isDirectionOpen={isDirectionOpen} isGenerating={isGenerating} isRecapOpen={isRecapOpen} onCloseRecap={() => setIsRecapOpen(false)} onContinue={onContinue} onDirectionChange={onDirectionChange} onExportStory={onExportStory} onOpenRecap={() => setIsRecapOpen(true)} onToggleDirection={onToggleDirection} story={latestStory} /> : null}<MoodPicker activeMood={activeMood} hasCurrentStory={Boolean(latestStory)} onSelect={onMoodSelect} /><SuggestedStoryStarts activeMood={activeMood} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} stories={suggestedStarts} onStart={onStartRecommendation} /></div></div>;
}

function MobileHomeView({ activeMood, brief, canUseDemoStory, hasDemoStory, isGenerating, isRecapOpen, latestStory, onClearDemoStory, onCloseRecap, onContinue, onLoadDemoStory, onMoodSelect, onOpenRecap, onStartRecommendation, suggestedStarts }: { activeMood: Mood; brief: StoryBrief | null; canUseDemoStory: boolean; hasDemoStory: boolean; isGenerating: boolean; isRecapOpen: boolean; latestStory: LibraryStory | null; onClearDemoStory: () => void; onCloseRecap: () => void; onContinue: (direction?: string) => void; onLoadDemoStory: () => void; onMoodSelect: (mood: Mood) => void; onOpenRecap: () => void; onStartRecommendation: (story: StoryStart) => void; suggestedStarts: StoryStart[] }) {
  return <div className="grid min-w-0 gap-5">{latestStory && brief ? <section className="grid min-w-0 gap-3" aria-labelledby="mobile-continue-reading-heading"><h2 id="mobile-continue-reading-heading" className="text-xl font-semibold leading-tight text-paper">Continue Reading</h2><MobileCurrentStoryCard brief={brief} isGenerating={isGenerating} isRecapOpen={isRecapOpen} onCloseRecap={onCloseRecap} onContinue={onContinue} onOpenRecap={onOpenRecap} story={latestStory} /></section> : null}<MobileMoodPicker activeMood={activeMood} onSelect={onMoodSelect} /><MobileSuggestedStoryStarts activeMood={activeMood} canUseDemoStory={canUseDemoStory} hasDemoStory={hasDemoStory} onClearDemoStory={onClearDemoStory} onLoadDemoStory={onLoadDemoStory} onStart={onStartRecommendation} stories={suggestedStarts} /></div>;
}

function MobileCurrentStoryCard({ brief, isGenerating, isRecapOpen, onCloseRecap, onContinue, onOpenRecap, story }: { brief: StoryBrief; isGenerating: boolean; isRecapOpen: boolean; onCloseRecap: () => void; onContinue: (direction?: string) => void; onOpenRecap: () => void; story: LibraryStory }) {
  return <section className="relative min-w-0 overflow-hidden rounded-[1.35rem] border border-lantern-gold/25 bg-soft-card p-3 text-primary-dark shadow-soft"><div className="flex min-w-0 gap-3"><div className="h-28 w-20 shrink-0 overflow-hidden rounded-2xl"><CoverArt label={story.genrePreset} title={story.title} tone="warm" size="mobile" /></div><div className="min-w-0 flex-1 pr-1"><h3 className="line-clamp-2 text-lg font-semibold leading-tight text-primary-dark">{story.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-primary-dark/65">{brief.hook}</p><button className="mt-3 rounded-full bg-primary-dark px-4 py-2 text-xs font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue()} type="button">{isGenerating ? "Working..." : "Next Chapter"}</button></div></div><button aria-label="Open last chapter recap" className="absolute bottom-3 right-3 flex size-10 items-center justify-center rounded-full border border-aged-brass/30 bg-white/85 text-base shadow-soft" onClick={onOpenRecap} type="button">↺</button>{isRecapOpen ? <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} /> : null}</section>;
}

function MobileMoodPicker({ activeMood, onSelect }: { activeMood: Mood; onSelect: (mood: Mood) => void }) {
  return <section className="min-w-0"><h2 className="text-xl font-semibold leading-tight text-paper">What are you in the mood to read?</h2><div className="-mx-3 mt-3 flex min-w-0 gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">{MOODS.map((mood) => <button className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${activeMood === mood ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper"}`} key={mood} onClick={() => onSelect(mood)} type="button">{mood}</button>)}</div></section>;
}

function MobileSuggestedStoryStarts({ activeMood, canUseDemoStory, hasDemoStory, onClearDemoStory, onLoadDemoStory, onStart, stories }: { activeMood: Mood; canUseDemoStory: boolean; hasDemoStory: boolean; onClearDemoStory: () => void; onLoadDemoStory: () => void; onStart: (story: StoryStart) => void; stories: StoryStart[] }) {
  return <section className="min-w-0"><div className="flex items-end justify-between gap-3"><div><h2 className="text-xl font-semibold text-paper">Start Something New</h2><p className="mt-1 text-xs leading-5 text-paper/55">{activeMood} picks for your next read.</p></div>{canUseDemoStory ? <div className="flex shrink-0 gap-2">{hasDemoStory ? <SmallButton onClick={onClearDemoStory}>Clear demo</SmallButton> : <SmallButton onClick={onLoadDemoStory}>Demo</SmallButton>}</div> : null}</div><div className="mt-3 grid min-w-0 gap-3">{stories.map((story) => <MobileStoryStartRow key={story.title} onStart={onStart} story={story} />)}</div></section>;
}

function MobileStoryStartRow({ onStart, story }: { onStart: (story: StoryStart) => void; story: StoryStart }) {
  return <button className="flex min-w-0 items-center gap-3 rounded-[1.1rem] border border-paper/12 bg-paper/10 p-2.5 text-left" onClick={() => onStart(story)} type="button"><div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl"><CoverArt label={story.mood} title={story.title} tone="cool" size="mobile" /></div><div className="min-w-0 flex-1"><h3 className="truncate text-sm font-semibold text-paper">{story.title}</h3><p className="mt-1 line-clamp-1 text-xs leading-5 text-paper/60">{story.premise}</p><div className="mt-2 flex min-w-0 gap-1.5 overflow-hidden"><span className="truncate rounded-full border border-lantern-gold/25 bg-lantern-gold/10 px-2 py-0.5 text-[0.65rem] font-semibold text-lantern-gold">{story.genre}</span><span className="shrink-0 rounded-full border border-paper/15 bg-paper/10 px-2 py-0.5 text-[0.65rem] font-semibold text-paper/70">{story.mood}</span></div></div><span className="shrink-0 text-xl text-paper/45">›</span></button>;
}

function CurrentStoryCard({ brief, direction, isDirectionOpen, isGenerating, isRecapOpen, onCloseRecap, onContinue, onDirectionChange, onExportStory, onOpenRecap, onToggleDirection, story }: { brief: StoryBrief; direction: string; isDirectionOpen: boolean; isGenerating: boolean; isRecapOpen: boolean; onCloseRecap: () => void; onContinue: (direction?: string) => void; onDirectionChange: (value: string) => void; onExportStory: () => void; onOpenRecap: () => void; onToggleDirection: () => void; story: LibraryStory }) {
  return <section className="min-w-0 overflow-hidden rounded-md border border-lantern-gold/35 bg-soft-card text-primary-dark shadow-soft"><div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(220px,340px)_1fr]"><div className="min-w-0 bg-primary-dark p-4 sm:p-6"><CoverArt label={story.genrePreset} title={story.title} tone="warm" size="feature" /></div><div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:p-8"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Current Story / Next Chapter</p><h2 className="mt-2 text-3xl font-semibold leading-tight text-primary-dark md:text-5xl">{story.title}</h2><p className="mt-4 max-w-3xl text-base leading-7 text-primary-dark/72">{brief.hook}</p></div><div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]"><div className="min-w-0 rounded-md border border-aged-brass/20 bg-white/65 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Last time recap preview</p><p className="mt-2 text-sm leading-6 text-primary-dark/75">{brief.recap}</p></div><div className="min-w-0 rounded-md border border-primary-dark/10 bg-primary-dark p-4 text-primary-light"><div className="flex min-w-0 items-center gap-4"><HeroPortrait name={brief.heroName} size="large" /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-lantern-gold/75">Hero / heroine</p><p className="mt-1 text-lg font-semibold text-primary-light">{brief.heroName}</p><p className="mt-1 text-xs leading-5 text-primary-light/55">{brief.heroRole}</p></div></div><p className="mt-4 text-sm leading-6 text-primary-light/75">{brief.struggle}</p></div></div><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap"><button className="rounded-md bg-primary-dark px-5 py-3 text-sm font-semibold text-primary-light transition hover:bg-primary-dark/90 disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue()} type="button">{isGenerating ? "Working..." : "Next Chapter"}</button><button className="rounded-md border border-aged-brass/50 bg-white/80 px-5 py-3 text-sm font-semibold text-aged-brass transition hover:border-aged-brass hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={onToggleDirection} type="button">Next Chapter with Input</button><button className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10" onClick={onOpenRecap} type="button">Last Chapter Recap</button><button className="rounded-md border border-primary-dark/20 bg-primary-dark/5 px-5 py-3 text-sm font-semibold text-primary-dark transition hover:bg-primary-dark/10" onClick={onExportStory} type="button">Export</button></div>{isDirectionOpen ? <div className="min-w-0 rounded-md border border-aged-brass/25 bg-white/75 p-4"><label className="flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-primary-dark">Optional direction</span><textarea className="min-h-32 w-full rounded-md border border-primary-dark/15 bg-white px-3 py-2 text-sm leading-6 text-primary-dark outline-none focus:border-aged-brass focus:ring-2 focus:ring-aged-brass/20" onChange={(event) => onDirectionChange(event.target.value)} placeholder="A character to follow, a secret to press on, a feeling to deepen." value={direction} /></label><button className="mt-3 rounded-md bg-primary-dark px-4 py-2 text-sm font-semibold text-primary-light disabled:cursor-not-allowed disabled:opacity-55" disabled={isGenerating} onClick={() => onContinue(direction)} type="button">Next Chapter with Input</button></div> : null}</div></div>{isRecapOpen ? <RecapPanel brief={brief} onClose={onCloseRecap} title={story.title} /> : null}</section>;
}

function RecapPanel({ brief, onClose, title }: { brief: StoryBrief; onClose: () => void; title: string }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-night-ink/75 p-3 sm:items-center sm:justify-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${title} recap`}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-md border border-lantern-gold/30 bg-soft-card p-5 text-primary-dark shadow-soft sm:p-6"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-aged-brass">Last Chapter Recap</p><h3 className="mt-2 text-2xl font-semibold leading-tight">{title}</h3></div><button className="shrink-0 rounded-md border border-primary-dark/15 px-3 py-2 text-sm font-semibold text-primary-dark" onClick={onClose} type="button">Close</button></div><div className="mt-5 grid gap-4"><RecapBlock title="What happened" body={brief.recap} /><RecapBlock title="What changed" body={brief.changed} /><RecapBlock title="What remains unresolved" body={brief.tension} /><RecapBlock title="Why the next chapter matters" body={brief.nextHook} /></div></div></div>;
}

function RecapBlock({ body, title }: { body: string; title: string }) { return <section className="rounded-md border border-aged-brass/20 bg-white/65 p-4"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-aged-brass">{title}</h4><p className="mt-2 text-sm leading-6 text-primary-dark/75">{body}</p></section>; }

function MoodPicker({ activeMood, hasCurrentStory, onSelect }: { activeMood: Mood; hasCurrentStory: boolean; onSelect: (mood: Mood) => void }) {
  return <section className={hasCurrentStory ? "min-w-0" : "min-w-0 pt-1"}><div className="max-w-3xl"><h2 className="text-2xl font-semibold text-paper md:text-3xl">What are you in the mood for?</h2><p className="mt-2 text-sm leading-6 text-paper/62">Choose the emotional weather for the stories waiting below.</p>{!hasCurrentStory ? <p className="mt-3 text-sm leading-6 text-paper/70">Start your first story. Once you have one in progress, your next chapter will appear here.</p> : null}</div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{MOODS.map((mood) => <button className={`min-w-0 rounded-md border px-4 py-4 text-left transition ${activeMood === mood ? "border-lantern-gold bg-lantern-gold text-night-ink shadow-soft" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50 hover:bg-paper/15"}`} key={mood} onClick={() => onSelect(mood)} type="button"><span className="block text-base font-semibold">{mood}</span><span className="mt-2 block text-xs leading-5 opacity-70">{moodDescription(mood)}</span></button>)}</div></section>;
}

function SuggestedStoryStarts({ activeMood, canUseDemoStory, hasDemoStory, onClearDemoStory, onLoadDemoStory, onStart, stories }: { activeMood: Mood; canUseDemoStory: boolean; hasDemoStory: boolean; onClearDemoStory: () => void; onLoadDemoStory: () => void; onStart: (story: StoryStart) => void; stories: StoryStart[] }) {
  return <section className="min-w-0"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-semibold text-paper md:text-3xl">Start Something New</h2><p className="mt-2 text-sm leading-6 text-paper/62">A small shelf of premieres, with {activeMood.toLowerCase()} closest to the front.</p></div>{canUseDemoStory ? <div className="flex flex-wrap gap-2"><SmallButton disabled={hasDemoStory} onClick={onLoadDemoStory}>Load demo story</SmallButton>{hasDemoStory ? <SmallButton onClick={onClearDemoStory}>Clear demo story</SmallButton> : null}</div> : null}</div><div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">{stories.map((story) => <StoryStartCard isFeatured={story.mood === activeMood} key={story.title} onStart={onStart} story={story} />)}</div></section>;
}

function StoryStartCard({ isFeatured, onStart, story }: { isFeatured: boolean; onStart: (story: StoryStart) => void; story: StoryStart }) { return <article className={`min-w-0 rounded-md border p-4 transition ${isFeatured ? "border-lantern-gold/65 bg-paper/15" : "border-paper/12 bg-paper/10"}`}><div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]"><CoverArt label={story.mood} title={story.title} tone={isFeatured ? "warm" : "cool"} /><div className="min-w-0"><div className="flex min-w-0 flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><h3 className="mt-3 text-xl font-semibold leading-tight text-paper">{story.title}</h3><p className="mt-2 text-sm leading-6 text-paper/70">{story.premise}</p><div className="mt-4 flex min-w-0 items-center gap-3 rounded-md border border-paper/10 bg-night-ink/35 p-3"><HeroPortrait name={story.heroName} /><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Hero / heroine</p><p className="mt-1 text-sm font-semibold text-paper">{story.heroName}</p><p className="mt-1 text-xs leading-5 text-paper/55">{story.heroRole}</p></div></div><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink transition hover:bg-lantern-gold/90" onClick={() => onStart(story)} type="button">Start</button></div></div></article>; }

function CreateView(props: { canGenerate: boolean; characterArc: CharacterArc; characterProfiles: UploadState; endingType: EndingType; genrePreset: GenrePreset; inputArtifacts: InputArtifact[]; isGenerating: boolean; lengthTarget: LengthTarget; narrativeArchitecture: NarrativeArchitecture; onChangeCharacterArc: (value: CharacterArc) => void; onChangeCharacterProfiles: (value: UploadState) => void; onChangeEndingType: (value: EndingType) => void; onChangeGenre: (value: GenrePreset) => void; onChangeLengthTarget: (value: LengthTarget) => void; onChangeNarrative: (value: NarrativeArchitecture) => void; onChangeStoryRules: (value: UploadState) => void; onChangeStorySeed: (value: UploadState) => void; onChangeWorld: (value: UploadState) => void; onClear: () => void; onGenerate: () => void; onSaveInputArtifact: (type: InputArtifactType, value: UploadState) => void; onSelectInputArtifact: (type: InputArtifactType, artifactId: string) => void; storyRules: UploadState; storySeed: UploadState; worldBible: UploadState }) {
  const { canGenerate, characterArc, characterProfiles, endingType, genrePreset, inputArtifacts, isGenerating, lengthTarget, narrativeArchitecture, onChangeCharacterArc, onChangeCharacterProfiles, onChangeEndingType, onChangeGenre, onChangeLengthTarget, onChangeNarrative, onChangeStoryRules, onChangeStorySeed, onChangeWorld, onClear, onGenerate, onSaveInputArtifact, onSelectInputArtifact, storyRules, storySeed, worldBible } = props;
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Create" title="Create New Story" body="Build a story from a world, cast, spark, and craft rules in one dedicated workspace." /><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,460px)_1fr]"><section className="grid min-w-0 gap-4"><InputPanel artifactType="worldBible" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "worldBible")} onChange={onChangeWorld} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Storyworld" value={worldBible} /><InputPanel artifactType="characterProfiles" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "characterProfiles")} onChange={onChangeCharacterProfiles} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Cast" value={characterProfiles} /><InputPanel artifactType="storySeed" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storySeed")} onChange={onChangeStorySeed} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Story Spark" value={storySeed} /><InputPanel artifactType="storyRules" libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storyRules")} onChange={onChangeStoryRules} onSave={onSaveInputArtifact} onSelect={onSelectInputArtifact} title="Craft Rules" value={storyRules} /><button className="rounded-md border border-paper/15 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper" onClick={onClear} type="button">Clear current inputs</button></section><section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Story Architecture</h2><div className="mt-4 grid gap-3"><SelectControl label="Genre Preset" onChange={(value) => onChangeGenre(value as GenrePreset)} options={GENRE_PRESETS} value={genrePreset} /><SelectControl label="Narrative Architecture" onChange={(value) => onChangeNarrative(value as NarrativeArchitecture)} options={NARRATIVE_ARCHITECTURES} value={narrativeArchitecture} /><SelectControl label="Character Arc" onChange={(value) => onChangeCharacterArc(value as CharacterArc)} options={CHARACTER_ARCS} value={characterArc} /><SelectControl label="Ending Type" onChange={(value) => onChangeEndingType(value as EndingType)} options={ENDING_TYPES} value={endingType} /><SelectControl label="Length Target" onChange={(value) => onChangeLengthTarget(value as LengthTarget)} options={LENGTH_TARGETS.map((target) => ({ value: target.value, label: target.label }))} value={lengthTarget} /></div><button className="mt-5 rounded-md bg-lantern-gold px-5 py-3 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!canGenerate} onClick={onGenerate} type="button">{isGenerating ? "Generating story..." : "Generate Story"}</button>{!storyRules.content.trim() ? <p className="mt-3 rounded-md bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/55">{DEFAULT_STORY_RULES_NOTICE}</p> : null}</section></div></section>;
}

function InputPanel({ artifactType, libraryArtifacts, onChange, onSave, onSelect, title, value }: { artifactType: InputArtifactType; libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onSave: (type: InputArtifactType, value: UploadState) => void; onSelect: (type: InputArtifactType, artifactId: string) => void; title: string; value: UploadState }) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) return;
    onChange({ name: file.name, content: await file.text() });
  }
  return <section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-lg font-semibold text-paper">{title}</h2><select className="mt-3 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onSelect(artifactType, event.target.value)} value={value.libraryArtifactId ?? ""}><option value="">Choose saved item</option>{libraryArtifacts.map((artifact) => <option key={artifact.id} value={artifact.id}>{artifact.name}</option>)}</select><textarea className="mt-3 min-h-32 w-full rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm leading-6 text-paper outline-none focus:border-lantern-gold" onChange={(event) => onChange({ name: value.name || `${slugify(title)}.txt`, content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder={`Add ${title.toLowerCase()} text`} value={value.content} /><label className="mt-3 flex cursor-pointer items-center justify-center rounded-md border border-dashed border-lantern-gold/50 px-4 py-3 text-sm font-semibold text-lantern-gold"><span className="min-w-0 truncate">{value.name || "Upload .md or .txt"}</span><input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} /></label><button className="mt-3 rounded-md border border-lantern-gold/45 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={!value.content.trim()} onClick={() => onSave(artifactType, value)} type="button">Save to Library</button></section>;
}

function LibraryView(props: { cloudMessage: string; cloudProjects: CloudProjectSummary[]; currentStory: LibraryStory | null; isCloudLoading: boolean; onDeleteCloudProject: () => void; onDeleteProject: () => void; onDeleteStory: (storyId: string) => void; onLoadCloudProject: (projectId: string) => void; onLoadProject: (projectId: string) => void; onOpenCurrentStory: () => void; onProjectNameChange: (name: string) => void; onRefreshCloud: () => void; onRestoreStory: (story: SavedStory) => void; onSaveCloudProject: () => void; onSaveProject: () => void; onSaveStory: () => void; projectName: string; savedProjects: SavedProject[]; savedStories: SavedStory[]; selectedCloudProjectId: string; selectedProjectId: string; storyResponse: GenerateStoryResponse | null }) {
  const { cloudMessage, cloudProjects, currentStory, isCloudLoading, onDeleteCloudProject, onDeleteProject, onDeleteStory, onLoadCloudProject, onLoadProject, onOpenCurrentStory, onProjectNameChange, onRefreshCloud, onRestoreStory, onSaveCloudProject, onSaveProject, onSaveStory, projectName, savedProjects, savedStories, selectedCloudProjectId, selectedProjectId, storyResponse } = props;
  const hasStoryRows = Boolean(currentStory || savedStories.length);
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Library" title="Story Library" body="Saved and recent stories live here as a separate destination." /><div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,420px)_1fr]"><section className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><h2 className="text-xl font-semibold text-paper">Library Tools</h2><p className="mt-1 text-sm leading-6 text-paper/65">Save stories and move project workspaces between local and cloud storage.</p><button className="mt-4 rounded-md bg-lantern-gold px-4 py-2 text-sm font-semibold text-night-ink disabled:cursor-not-allowed disabled:opacity-50" disabled={!storyResponse} onClick={onSaveStory} type="button">Save Current Story</button><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-paper">Project Name</span><input className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onProjectNameChange(event.target.value)} placeholder="My story project" value={projectName} /></label><div className="mt-3 flex flex-wrap gap-2"><SmallButton onClick={onSaveProject}>Save Project</SmallButton><SmallButton disabled={!selectedProjectId} onClick={onDeleteProject}>Delete Project</SmallButton><SmallButton disabled={isCloudLoading} onClick={onRefreshCloud}>{isCloudLoading ? "Syncing..." : "Refresh Cloud"}</SmallButton><SmallButton disabled={isCloudLoading} onClick={onSaveCloudProject}>Save to Cloud</SmallButton><SmallButton disabled={isCloudLoading || !selectedCloudProjectId} onClick={onDeleteCloudProject}>Delete Cloud</SmallButton></div><SelectLibrary label="Load Project" onChange={onLoadProject} options={savedProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedProjectId} /><SelectLibrary label="Load Cloud Project" onChange={onLoadCloudProject} options={cloudProjects.map((project) => ({ label: `${project.name} - ${formatDateTime(project.updatedAt)}`, value: project.id }))} value={selectedCloudProjectId} />{cloudMessage ? <p className="mt-3 rounded-md border border-lantern-gold/25 bg-paper/10 px-3 py-2 text-xs leading-5 text-paper/65">{cloudMessage}</p> : null}</section><section className="grid min-w-0 gap-3">{!hasStoryRows ? <EmptyPanel title="No saved or recent stories yet" body="Generate a story or save one locally and it will appear here." /> : null}{currentStory ? <StoryLibraryCard badge="Recent Story" onOpen={onOpenCurrentStory} story={currentStory} /> : null}{savedStories.map((story) => <StoryLibraryCard key={story.id} onDelete={() => onDeleteStory(story.id)} onOpen={() => onRestoreStory(story)} story={story} />)}</section></div></section>;
}

function StoryLibraryCard({ badge, onDelete, onOpen, story }: { badge?: string; onDelete?: () => void; onOpen: () => void; story: LibraryStory }) {
  return <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h3 className="text-lg font-semibold text-paper">{story.title}</h3><p className="mt-1 text-sm leading-6 text-paper/60">{formatDateTime(story.createdAt)} | {story.wordCount.toLocaleString()} words | {story.genrePreset}</p></div>{badge ? <span className="w-fit rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold text-lantern-gold">{badge}</span> : null}</div><p className="mt-3 text-sm leading-6 text-paper/70">{truncateText(story.story, 220)}</p><div className="mt-4 flex flex-wrap gap-2"><SmallButton onClick={onOpen}>Open</SmallButton>{onDelete ? <SmallButton onClick={onDelete}>Delete</SmallButton> : null}</div></article>;
}

function CharactersView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  const characterStories = SUGGESTED_STORY_STARTS.filter((story) => story.heroName);
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Cast" title="Characters / Cast" body="Character cards now live outside Home and link back to their stories where possible." />{characterStories.length === 0 ? <EmptyPanel title="No character cards yet" body="Characters will appear here once story references are available." /> : <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">{characterStories.map((story) => <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4" key={story.heroName}><div className="flex min-w-0 items-start gap-4"><HeroPortrait name={story.heroName} size="large" /><div className="min-w-0 flex-1"><h3 className="break-normal text-lg font-semibold leading-snug text-paper [overflow-wrap:normal]">{story.heroName}</h3><p className="mt-1 break-normal text-sm font-semibold leading-5 text-lantern-gold [overflow-wrap:normal]">{story.heroRole}</p></div></div><p className="mt-4 w-full text-sm leading-6 text-paper/70">{story.heroBio}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Appears in</p><button className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">{story.title}</button></article>)}</div>}</section>;
}

function WorldsView({ onOpenStory }: { onOpenStory: (story: StoryStart) => void }) {
  const worldStories = SUGGESTED_STORY_STARTS.filter((story) => story.worldName);
  return <section className="grid min-w-0 gap-5"><PageHeading eyebrow="Worlds" title="Worlds" body="Storyworld cards are reachable as their own app destination." />{worldStories.length === 0 ? <EmptyPanel title="No worlds yet" body="World cards will appear here once storyworld references are available." /> : <div className="grid min-w-0 gap-4 md:grid-cols-2">{worldStories.map((story) => <article className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-4" key={story.worldName}><div className="grid min-w-0 gap-4 sm:grid-cols-[132px_minmax(0,1fr)]"><CoverArt label={story.mood} title={story.worldName} tone="cool" /><div className="min-w-0"><h3 className="text-lg font-semibold text-paper">{story.worldName}</h3><div className="mt-2 flex min-w-0 flex-wrap gap-2"><Tag>{story.genre}</Tag><Tag>{story.mood}</Tag></div><p className="mt-3 text-sm leading-6 text-paper/70">{story.world}</p><p className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-paper/45">Appears in</p><button className="mt-1 text-left text-sm font-semibold text-lantern-gold underline decoration-lantern-gold/40 underline-offset-4" onClick={() => onOpenStory(story)} type="button">{story.title}</button></div></div></article>)}</div>}</section>;
}

function MobileTopHeader() {
  return <header className="flex min-w-0 items-center justify-between py-1 md:hidden"><button aria-label="Open menu" className="flex size-10 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-xl text-paper" type="button">☰</button><p className="min-w-0 truncate text-center text-base font-semibold text-paper">Project Lantern</p><button aria-label="Open profile" className="flex size-10 items-center justify-center rounded-full border border-paper/10 bg-paper/10 text-lg text-paper" type="button">♡</button></header>;
}

function MobileBottomNav({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return <nav aria-label="Mobile primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-paper/10 bg-night-ink/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 backdrop-blur md:hidden"><div className="mx-auto grid max-w-md grid-cols-5 gap-1">{NAV_ITEMS.map((item) => <button aria-current={activeView === item.view ? "page" : undefined} className={`rounded-xl px-1 py-2 text-[0.66rem] font-semibold leading-tight ${activeView === item.view ? "bg-lantern-gold text-night-ink" : "text-paper/65"}`} key={item.view} onClick={() => onChange(item.view)} type="button">{item.label}</button>)}</div></nav>;
}

function NavTabs({ activeView, onChange }: { activeView: AppView; onChange: (view: AppView) => void }) {
  return <nav aria-label="Primary" className="w-full min-w-0 md:max-w-xl"><div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:justify-end">{NAV_ITEMS.map((tab) => <button aria-current={activeView === tab.view ? "page" : undefined} className={`min-w-0 rounded-md border px-2.5 py-2 text-center text-xs font-semibold leading-5 transition sm:px-3 ${activeView === tab.view ? "border-lantern-gold bg-lantern-gold text-night-ink" : "border-paper/15 bg-paper/10 text-paper hover:border-lantern-gold/50"}`} key={tab.view} onClick={() => onChange(tab.view)} type="button">{tab.label}</button>)}</div></nav>;
}

function PageHeading({ body, eyebrow, title }: { body: string; eyebrow: string; title: string }) { return <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-lantern-gold">{eyebrow}</p><h2 className="mt-2 text-2xl font-semibold leading-tight text-paper md:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">{body}</p></div>; }
function CoverArt({ label, title, tone = "cool", size = "normal" }: { label?: string; title: string; tone?: "cool" | "warm"; size?: "normal" | "feature" | "mobile" }) { const palette = tone === "warm" ? "linear-gradient(145deg, #efe5cf 0%, #c9a46a 42%, #2f4f4f 100%)" : "linear-gradient(145deg, #d8ded5 0%, #6f7f72 45%, #26364d 100%)"; const sizeClass = size === "feature" ? "min-h-[20rem] sm:min-h-[23rem] max-w-none" : size === "mobile" ? "h-full min-h-0 max-w-none" : "min-h-52 max-w-none sm:min-h-40 sm:max-w-40"; return <div aria-label={`${title} artwork`} className={`relative flex aspect-[3/4] w-full ${sizeClass} overflow-hidden rounded-md border border-primary-dark/10 p-4 text-night-ink shadow-soft`} style={{ background: palette }}><div className="absolute inset-x-5 top-7 h-px bg-night-ink/30" /><div className="absolute inset-x-8 top-12 h-px bg-night-ink/20" /><div className="absolute left-6 top-20 h-24 w-12 border-l border-night-ink/25" /><div className="absolute bottom-8 right-6 h-28 w-20 rounded-t-full border border-night-ink/20 bg-white/10" /><div className="absolute bottom-0 left-0 h-24 w-full bg-night-ink/10" /><div className="relative z-10 flex h-full w-full flex-col justify-between"><span className="max-w-full text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label ?? "Story Artwork"}</span><span className="max-w-[13rem] text-2xl font-semibold leading-tight md:text-3xl">{title.split(" ").slice(0, 5).join(" ")}</span></div></div>; }
function HeroPortrait({ name, size = "normal" }: { name: string; size?: "normal" | "large" }) { const className = size === "large" ? "h-20 w-20 text-xl" : "h-16 w-16 text-lg"; return <div aria-label={`${name} portrait artwork`} className={`relative flex ${className} flex-none items-center justify-center overflow-hidden rounded-md border border-lantern-gold/35 bg-primary-dark font-semibold text-lantern-gold`}><span className="absolute top-2 h-8 w-10 rounded-full border border-lantern-gold/25 bg-lantern-gold/10" /><span className="absolute bottom-0 h-8 w-14 rounded-t-full border-x border-t border-paper/10 bg-paper/10" /><span className="relative z-10">{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span></div>; }
function Tag({ children }: { children: ReactNode }) { return <span className="inline-flex max-w-full items-center rounded-md border border-lantern-gold/35 bg-lantern-gold/10 px-2 py-1 text-xs font-semibold leading-5 text-lantern-gold">{children}</span>; }
function SmallButton({ children, disabled, onClick }: { children: ReactNode; disabled?: boolean; onClick: () => void }) { return <button className="rounded-md border border-lantern-gold/40 bg-paper/10 px-3 py-2 text-xs font-semibold text-lantern-gold disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function Status({ children, tone }: { children: ReactNode; tone: "info" | "error" }) { return <div className={`min-w-0 rounded-md border px-4 py-3 text-sm ${tone === "error" ? "border-ember/40 bg-ember/10 text-ember" : "border-lantern-gold/30 bg-paper/10 text-paper/75"}`}>{children}</div>; }
function EmptyPanel({ body, title }: { body: string; title: string }) { return <div className="min-w-0 rounded-md border border-paper/12 bg-paper/10 p-5"><h3 className="text-lg font-semibold text-paper">{title}</h3><p className="mt-2 text-sm leading-6 text-paper/65">{body}</p></div>; }
function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[] | readonly { value: string; label: string }[]; onChange: (value: string) => void }) { return <label className="flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const optionLabel = typeof option === "string" ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select></label>; }
function SelectLibrary({ label, onChange, options, value }: { label: string; onChange: (value: string) => void; options: { label: string; value: string }[]; value: string }) { return <label className="mt-4 flex min-w-0 flex-col gap-2"><span className="text-sm font-semibold text-paper">{label}</span><select className="rounded-md border border-paper/15 bg-night-ink px-3 py-2 text-sm text-paper" onChange={(event) => onChange(event.target.value)} value={value}><option value="">Choose one</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }

function responseToLibraryStory(response: GenerateStoryResponse, id: string): LibraryStory { return { id, title: createStoryTitle(response.story), story: response.story, wordCount: response.metadata.wordCount, createdAt: new Date().toISOString(), genrePreset: response.metadata.diagnostics.genrePreset, charactersUsed: response.metadata.charactersUsed, rulesReferenced: response.metadata.rulesReferenced }; }
function normalizeGenerateStoryResponse(payload: unknown): GenerateStoryResponse { const normalizedPayload = normalizeStoryPayload(payload) as Partial<GenerateStoryResponse>; const story = normalizeStoryText(normalizedPayload.story); if (!story || !normalizedPayload.metadata) throw new Error("Story generation returned an invalid response."); return { ...normalizedPayload, story, metadata: { ...normalizedPayload.metadata, wordCount: countWords(story) } } as GenerateStoryResponse; }
async function fetchCloudJson<T>(input: string, init?: RequestInit): Promise<T> { const response = await fetch(input, { ...init, cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "Cloud project request failed."); return payload as T; }
function countWords(text: string): number { return text.trim().split(/\s+/).filter(Boolean).length; }
function createStoryId(story: string, createdAt = new Date().toISOString()): string { return `${createdAt}-${story.length}`.replace(/[^a-zA-Z0-9_-]/g, "-"); }
function createStoryTitle(story: string): string { const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story"; const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine; return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story"; }
function createDemoLatestStory(): SavedStory { return { id: DEMO_LATEST_STORY_ID, title: "The Half-Life of Magic", createdAt: new Date().toISOString(), story: DEMO_STORY_TEXT, wordCount: countWords(DEMO_STORY_TEXT), generatorSource: "fallback", charactersUsed: ["Mara Vale"], rulesReferenced: [], genrePreset: "Contemporary Fantastical / Magical Realist", narrativeArchitecture: "Revelation Story", characterArc: "Positive Change Arc", endingType: "Resolution with Residue", lengthTarget: "Standard", diagnosticsNotice: null }; }
function readDemoLatestStory(): SavedStory | null { if (typeof window === "undefined") return null; try { const raw = window.localStorage.getItem(DEMO_LATEST_STORY_STORAGE_KEY); if (!raw) return null; const parsed = JSON.parse(raw) as SavedStory; return parsed?.id === DEMO_LATEST_STORY_ID && typeof parsed.story === "string" ? parsed : null; } catch { return null; } }
function persistDemoLatestStory(story: SavedStory) { if (typeof window === "undefined") return; window.localStorage.setItem(DEMO_LATEST_STORY_STORAGE_KEY, JSON.stringify(story)); }
function clearDemoLatestStory() { if (typeof window === "undefined") return; window.localStorage.removeItem(DEMO_LATEST_STORY_STORAGE_KEY); }
function createStoryBrief(story: LibraryStory): StoryBrief { if (story.id === DEMO_LATEST_STORY_ID) return DEMO_STORY_BRIEF; const sentences = extractSentences(story.story); const recapSentences = sentences.slice(0, 4); const heroName = story.charactersUsed[0] || "The lead"; const secondCharacter = story.charactersUsed[1]; const hook = sentences[0] ? truncateText(sentences[0], 190) : `${story.title} is waiting at the edge of its next turning point.`; const recap = recapSentences.length ? recapSentences.join(" ") : truncateText(story.story, 420); return { hook, recap, changed: sentences[4] || `${heroName} has crossed a threshold that makes the old version of the story impossible to return to.`, tension: secondCharacter ? `${heroName} and ${secondCharacter} are still caught in the pressure the last chapter exposed.` : `${heroName} is still carrying the central unanswered pressure of the last chapter.`, nextHook: sentences[5] || `The next chapter should press on the choice ${heroName} can no longer avoid.`, heroName, heroRole: story.genrePreset, struggle: `${heroName} is trying to move forward while the last chapter's consequences narrow the path ahead.` }; }
function extractSentences(text: string): string[] { return (text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? []).map((sentence) => sentence.trim()).filter(Boolean); }
function sortStoryStartsByMood(activeMood: Mood): StoryStart[] { return [...SUGGESTED_STORY_STARTS].sort((a, b) => Number(b.mood === activeMood) - Number(a.mood === activeMood)); }
function moodDescription(mood: Mood): string { const descriptions: Record<Mood, string> = { Mystery: "Secrets, clues, and a door left open.", Wonder: "Luminous worlds with a human ache.", Emotional: "Intimate choices and unfinished goodbyes.", Adventure: "Momentum, thresholds, and daring turns.", Strange: "Uncanny turns and beautiful wrongness.", Hopeful: "Warm light after difficult choices.", Dark: "Danger, dread, and costly secrets.", Reflective: "Quiet consequences and inner change." }; return descriptions[mood]; }
function readAppView(value: string | null): AppView | null { return value === "library" || value === "worlds" || value === "create" || value === "characters" || value === "home" ? value : null; }
function truncateText(text: string, maxLength: number): string { const compact = text.replace(/\s+/g, " ").trim(); return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story-world-engine-story"; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatLibraryVersion(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, ""); }
function formatCaughtError(caughtError: unknown): string { return caughtError instanceof Error ? caughtError.message : "Cloud project request failed."; }
function downloadTextFile(filename: string, contents: string) { if (typeof window === "undefined") return; const blob = new Blob([contents], { type: "text/plain;charset=utf-8" }); const url = window.URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url); }
