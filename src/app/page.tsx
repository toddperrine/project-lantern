"use client";

import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { CHARACTER_ARCHETYPE_PRESETS } from "@/lib/character-archetypes";
import type { CharacterArchetypePreset } from "@/lib/character-archetypes";
import { recommendStoryArchitecture } from "@/lib/story-architecture-recommendations";
import type { StoryArchitectureRecommendation } from "@/lib/story-architecture-recommendations";
import { normalizeStoryPayload, normalizeStoryText } from "@/lib/story-output";
import { CHARACTER_ARCS, ENDING_TYPES, GENRE_PRESETS, LENGTH_TARGETS, NARRATIVE_ARCHITECTURES } from "@/lib/types";
import type { CharacterArc, EndingType, GenerateStoryResponse, GenrePreset, LengthTarget, NarrativeArchitecture } from "@/lib/types";
import { createInputArtifactId, createSavedProjectId, createSavedStory, persistInputArtifacts, persistSavedProjects, persistSavedStories, persistStoryFeedback, readInputArtifacts, readSavedProjects, readSavedStories, readStoryFeedback, savedStoryToResponse } from "@/lib/project-persistence";
import type { InputArtifact, InputArtifactType, SavedProject, SavedStory, StoryFeedback, StoryFeedbackScore, UploadState } from "@/lib/project-persistence";
import { WORLD_TEMPLATES } from "@/lib/world-templates";
import type { WorldTemplate } from "@/lib/world-templates";

type SelectOption = { value: string; label: string };
type BuildInfo = { appVersion: string; buildEnvironment: string; gitBranch: string; commitSha: string; shortCommitSha: string; buildTimestamp: string; vercelUrl: string };
type CloudProjectSummary = Pick<SavedProject, "id" | "name" | "createdAt" | "updatedAt">;
type CloudSavedStorySummary = { sequenceNumber?: number };
type FeedbackChoice = { score: StoryFeedbackScore; label: string };

const ACCEPTED_EXTENSIONS = [".md", ".txt"];
const EMPTY_UPLOAD: UploadState = { name: "", content: "" };
const DEFAULT_BUILD_INFO: BuildInfo = { appVersion: "0.7.26", buildEnvironment: "metadata unavailable", gitBranch: "metadata unavailable", commitSha: "metadata unavailable", shortCommitSha: "metadata unavailable", buildTimestamp: "unknown", vercelUrl: "metadata unavailable" };
const INPUT_LABELS: Record<InputArtifactType, string> = { worldBible: "Storyworld", characterProfiles: "Cast", storySeed: "Story Spark", storyRules: "Craft Rules" };
const DEFAULT_STORY_RULES_NOTICE = "Default craft rules are used automatically when this is empty.";
const FEEDBACK_CHOICES: FeedbackChoice[] = [
  { score: 1, label: "Missed" },
  { score: 2, label: "Not quite" },
  { score: 3, label: "Good" },
  { score: 4, label: "Great" },
  { score: 5, label: "Favorite" }
];
const POSITIVE_FEEDBACK_OPTIONS = ["Character", "World / setting", "Plot", "Ending", "Voice / style", "Emotion", "Wonder / surprise", "Pacing", "Age fit", "Length", "Other"];
const IMPROVEMENT_FEEDBACK_OPTIONS = ["Stronger character", "More interesting world", "Clearer plot", "Better ending", "More emotion", "More wonder / surprise", "Better pacing", "Less confusing", "Better age fit", "Shorter", "Longer", "Different style", "Other"];

export default function Home() {
  const [worldBible, setWorldBible] = useState<UploadState>(EMPTY_UPLOAD);
  const [characterProfiles, setCharacterProfiles] = useState<UploadState>(EMPTY_UPLOAD);
  const [storySeed, setStorySeed] = useState<UploadState>(EMPTY_UPLOAD);
  const [storyRules, setStoryRules] = useState<UploadState>(EMPTY_UPLOAD);
  const [genrePreset, setGenrePreset] = useState<GenrePreset>("Speculative Mystery");
  const [narrativeArchitecture, setNarrativeArchitecture] = useState<NarrativeArchitecture>("Revelation Story");
  const [characterArc, setCharacterArc] = useState<CharacterArc>("Positive Change Arc");
  const [endingType, setEndingType] = useState<EndingType>("Resolution with Residue");
  const [lengthTarget, setLengthTarget] = useState<LengthTarget>("Standard");
  const [recommendation, setRecommendation] = useState<StoryArchitectureRecommendation | null>(null);
  const [storyResponse, setStoryResponse] = useState<GenerateStoryResponse | null>(null);
  const [currentStoryId, setCurrentStoryId] = useState("");
  const [storyFeedback, setStoryFeedback] = useState<StoryFeedback[]>([]);
  const [isFeedbackDismissed, setIsFeedbackDismissed] = useState(false);
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
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [error, setError] = useState("");
  const [isCloudProjectsLoading, setIsCloudProjectsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<string | null>(null);
  const [generationElapsedSeconds, setGenerationElapsedSeconds] = useState(0);

  useEffect(() => {
    setInputArtifacts(readInputArtifacts());
    setSavedStories(readSavedStories());
    setSavedProjects(readSavedProjects());
    setStoryFeedback(readStoryFeedback());
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    void handleRefreshCloudProjects();
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/build-info", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: BuildInfo | null) => {
        if (isMounted && payload) setBuildInfo({ ...DEFAULT_BUILD_INFO, ...payload });
      })
      .catch(() => {
        if (isMounted) setBuildInfo(DEFAULT_BUILD_INFO);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!isGenerating || !generationStartedAt) return;
    const startedAtMs = new Date(generationStartedAt).getTime();
    const intervalId = window.setInterval(() => setGenerationElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000))), 1000);
    return () => window.clearInterval(intervalId);
  }, [generationStartedAt, isGenerating]);

  const canGenerate = useMemo(() => Boolean(worldBible.content.trim() && characterProfiles.content.trim() && storySeed.content.trim() && !isGenerating), [worldBible.content, characterProfiles.content, storySeed.content, isGenerating]);

  async function handleGenerate() {
    const startedAt = new Date();
    setError("");
    setStatusMessage("");
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setGenerationStartedAt(startedAt.toISOString());
    setGenerationElapsedSeconds(0);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldBible: worldBible.content, characterProfiles: characterProfiles.content, storySeed: storySeed.content, storyRules: storyRules.content, genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Story generation failed.");
      const finishedAt = new Date();
      const generationDurationSeconds = Math.max(0, Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000));
      const normalizedResponse = normalizeGenerateStoryResponse(payload);
      setStoryResponse({ ...normalizedResponse, metadata: { ...normalizedResponse.metadata, generationStartedAt: startedAt.toISOString(), generationFinishedAt: finishedAt.toISOString(), generationDurationSeconds } });
      setCurrentStoryId(createStoryId(normalizedResponse.story, finishedAt.toISOString()));
      setGenerationElapsedSeconds(generationDurationSeconds);
    } catch (caughtError) {
      const seconds = Math.max(0, Math.round((Date.now() - startedAt.getTime()) / 1000));
      setGenerationElapsedSeconds(seconds);
      setError(`Story generation failed after ${formatDuration(seconds)}. ${caughtError instanceof Error ? caughtError.message : "Story generation failed."}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleLoadSampleWorld() {
    setError("");
    setStatusMessage("");
    setRecommendation(null);
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setIsLoadingSample(true);
    try {
      const [world, characters, seed, generationRules] = await Promise.all([fetchSampleFile("world.md"), fetchSampleFile("characters.md"), fetchSampleFile("story_seed.md"), fetchSampleFile("story_generation_rules.md")]);
      setWorldBible({ name: "world.md", content: world });
      setCharacterProfiles({ name: "characters.md", content: characters });
      setStorySeed({ name: "story_seed.md", content: seed });
      setStoryRules({ name: "story_generation_rules.md", content: generationRules });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load the sample world.");
    } finally {
      setIsLoadingSample(false);
    }
  }

  function handleRecommendSettings() {
    setRecommendation(recommendStoryArchitecture({ worldBible: worldBible.content, characterProfiles: characterProfiles.content, storySeed: storySeed.content, storyRules: storyRules.content, currentSelections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget } }));
  }

  function handleApplyRecommendation() {
    if (!recommendation) return;
    setGenrePreset(recommendation.genrePreset);
    setNarrativeArchitecture(recommendation.narrativeArchitecture);
    setCharacterArc(recommendation.characterArc);
    setEndingType(recommendation.endingType);
    setLengthTarget(recommendation.lengthTarget);
  }

  function handleApplyWorldTemplate(template: WorldTemplate, mode: "add" | "replace") {
    const text = formatWorldTemplateBible(template);
    const currentWorld = worldBible.content.trim();
    setWorldBible({ name: worldBible.name || "storyworld.md", content: mode === "replace" || !currentWorld ? text : `${currentWorld}\n\n${text}` });
    setRecommendation(null);
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setStatusMessage(mode === "replace" ? `${template.title} is now the Storyworld.` : `${template.title} added to Storyworld.`);
  }

  function handleApplyCharacterArchetype(preset: CharacterArchetypePreset, mode: "add" | "replace") {
    const card = formatCharacterArchetypeCard(preset);
    const currentProfiles = characterProfiles.content.trim();
    setCharacterProfiles({ name: characterProfiles.name || "cast.md", content: mode === "replace" || !currentProfiles ? card : `${currentProfiles}\n\n${card}` });
    setRecommendation(null);
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setStatusMessage(mode === "replace" ? `${preset.name} replaced the current Cast.` : `${preset.name} added to Cast.`);
  }

  function handleClearCurrentInputs() {
    setWorldBible({ ...EMPTY_UPLOAD });
    setCharacterProfiles({ ...EMPTY_UPLOAD });
    setStorySeed({ ...EMPTY_UPLOAD });
    setStoryRules({ ...EMPTY_UPLOAD });
    setRecommendation(null);
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setStatusMessage("Current inputs cleared. Saved library items were not changed.");
  }

  function handleSaveProject() {
    const savedProject = createCurrentProjectSnapshot();
    if (!savedProject) return;
    const nextProjects = [savedProject, ...savedProjects.filter((project) => project.id !== savedProject.id)];
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId(savedProject.id);
    setStatusMessage(`${savedProject.name} saved locally in this browser.`);
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
    const savedProject = createCurrentProjectSnapshot(cloudProjects.find((project) => project.id === selectedCloudProjectId));
    if (!savedProject) return;
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: savedProject })
      });
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

  function handleLoadProject(projectId: string) {
    setSelectedProjectId(projectId);
    if (!projectId) return;
    const project = savedProjects.find((item) => item.id === projectId);
    if (!project) return;
    applyProjectSnapshot(project);
    setStatusMessage(`${project.name} loaded from this browser.`);
  }

  async function handleLoadCloudProject(projectId: string) {
    setSelectedCloudProjectId(projectId);
    if (!projectId) return;
    setIsCloudProjectsLoading(true);
    try {
      const payload = await fetchCloudJson<{ project?: SavedProject }>(`/api/projects/${encodeURIComponent(projectId)}`);
      if (!payload.project) throw new Error("Cloud project response was missing a project.");
      applyProjectSnapshot(payload.project);
      setCloudProjectMessage(`${payload.project.name} loaded from cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud load failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  function applyProjectSnapshot(project: SavedProject) {
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
    setRecommendation(null);
    setStoryResponse(project.latestStory);
    setCurrentStoryId(project.latestStoryFeedback?.storyId ?? (project.latestStory ? createStoryId(project.latestStory.story, project.updatedAt) : ""));
    setIsFeedbackDismissed(false);
  }

  function handleDeleteProject() {
    if (!selectedProjectId) return setError("Choose a saved project before deleting.");
    const project = savedProjects.find((item) => item.id === selectedProjectId);
    if (!project) return;
    const nextProjects = savedProjects.filter((item) => item.id !== selectedProjectId);
    persistSavedProjects(nextProjects);
    setSavedProjects(nextProjects);
    setSelectedProjectId("");
    setProjectName("");
    setStatusMessage(`${project.name} deleted from this browser.`);
  }

  async function handleDeleteCloudProject() {
    if (!selectedCloudProjectId) {
      setCloudProjectMessage("Choose a cloud project before deleting.");
      return;
    }
    const project = cloudProjects.find((item) => item.id === selectedCloudProjectId);
    setIsCloudProjectsLoading(true);
    try {
      await fetchCloudJson(`/api/projects/${encodeURIComponent(selectedCloudProjectId)}`, { method: "DELETE" });
      setCloudProjects((currentProjects) => currentProjects.filter((item) => item.id !== selectedCloudProjectId));
      setSelectedCloudProjectId("");
      setCloudProjectMessage(`${project?.name ?? "Cloud project"} deleted from cloud projects.`);
    } catch (caughtError) {
      setCloudProjectMessage(`Cloud delete failed: ${formatCaughtError(caughtError)} Local project save/load still works.`);
    } finally {
      setIsCloudProjectsLoading(false);
    }
  }

  function createCurrentProjectSnapshot(existingProject?: Pick<SavedProject, "id" | "name" | "createdAt">): SavedProject | null {
    const trimmedName = projectName.trim();
    if (!trimmedName) {
      setError("Add a project name before saving this workspace.");
      return null;
    }
    setError("");
    const now = new Date().toISOString();
    const matchingLocalProject = savedProjects.find((project) => project.id === selectedProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const matchingCloudProject = cloudProjects.find((project) => project.id === selectedCloudProjectId || project.name.toLowerCase() === trimmedName.toLowerCase());
    const matchedProject = existingProject ?? matchingLocalProject ?? matchingCloudProject;
    return {
      id: matchedProject?.id ?? createSavedProjectId(trimmedName, now),
      name: trimmedName,
      createdAt: matchedProject?.createdAt ?? now,
      updatedAt: now,
      inputs: { worldBible, characterProfiles, storySeed, storyRules },
      selections: { genrePreset, narrativeArchitecture, characterArc, endingType, lengthTarget },
      latestStory: storyResponse,
      latestStoryFeedback: getCurrentFeedback()
    };
  }

  function handleSelectInputArtifact(type: InputArtifactType, artifactId: string) {
    if (!artifactId) return setUploadForType(type, { ...EMPTY_UPLOAD });
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) return;
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setRecommendation(null);
    setStoryResponse(null);
    setCurrentStoryId("");
    setIsFeedbackDismissed(false);
    setStatusMessage(`Loaded ${artifact.name} from the local library.`);
  }

  function handleSaveInputArtifact(type: InputArtifactType, value: UploadState) {
    if (!value.content.trim()) return setError(`Add ${INPUT_LABELS[type]} content before saving it to the library.`);
    setError("");
    const now = new Date().toISOString();
    const baseName = value.name.trim() || `${INPUT_LABELS[type]} ${formatLibraryVersion(now)}`;
    let name = baseName;
    if (inputArtifacts.some((artifact) => artifact.type === type && artifact.name === baseName)) {
      if (!window.confirm(`${baseName} already exists in ${INPUT_LABELS[type]}. Save a new timestamped version instead?`)) return;
      name = `${baseName} (${formatLibraryVersion(now)})`;
    }
    const artifact: InputArtifact = { id: createInputArtifactId(type, name, now), type, name, content: value.content, createdAt: now, updatedAt: now, characterCount: value.content.length };
    const nextArtifacts = [artifact, ...inputArtifacts];
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    setUploadForType(type, { name: artifact.name, content: artifact.content, libraryArtifactId: artifact.id });
    setStatusMessage(`${artifact.name} saved to the local library.`);
  }

  function handleRemoveInputArtifact(type: InputArtifactType, artifactId?: string) {
    if (!artifactId) return;
    const artifact = inputArtifacts.find((item) => item.id === artifactId && item.type === type);
    if (!artifact) return;
    const nextArtifacts = inputArtifacts.filter((item) => item.id !== artifactId);
    persistInputArtifacts(nextArtifacts);
    setInputArtifacts(nextArtifacts);
    clearSelectedArtifactId(type, artifactId);
    setStatusMessage(`${artifact.name} removed from the local library.`);
  }

  async function handleSaveStory() {
    if (!storyResponse) return;
    const savedStory = createSavedStory(storyResponse, currentStoryId || createStoryId(storyResponse.story), storyFeedback.filter((feedback) => feedback.storyId === currentStoryId));
    const nextSavedStories = [savedStory, ...savedStories.filter((story) => story.id !== savedStory.id)].slice(0, 25);
    persistSavedStories(nextSavedStories);
    setSavedStories(nextSavedStories);
    if (!selectedCloudProjectId) {
      setStatusMessage("Story saved locally in this browser.");
      return;
    }

    setStatusMessage("Story saved locally in this browser. Saving to cloud stories...");
    try {
      await saveStoryToCloudProject(selectedCloudProjectId, savedStory, storyResponse);
      setStatusMessage("Story saved locally and to cloud stories.");
      setCloudProjectMessage("Story saved to the active cloud project.");
    } catch (caughtError) {
      setStatusMessage("Story saved locally in this browser. Cloud story save failed.");
      setCloudProjectMessage(`Cloud story save failed: ${formatCaughtError(caughtError)} Local story save still works.`);
    }
  }

  function handleSubmitStoryFeedback(feedback: StoryFeedback) {
    const nextFeedback = [feedback, ...storyFeedback.filter((item) => item.storyId !== feedback.storyId)];
    persistStoryFeedback(nextFeedback);
    setStoryFeedback(nextFeedback);
    setIsFeedbackDismissed(false);
    setStatusMessage("Story feedback saved locally.");
  }

  function getCurrentFeedback(): StoryFeedback | null {
    if (!currentStoryId) return null;
    return storyFeedback.find((feedback) => feedback.storyId === currentStoryId) ?? null;
  }

  function setUploadForType(type: InputArtifactType, value: UploadState) {
    if (type === "worldBible") setWorldBible(value);
    else if (type === "characterProfiles") setCharacterProfiles(value);
    else if (type === "storySeed") setStorySeed(value);
    else setStoryRules(value);
  }

  function clearSelectedArtifactId(type: InputArtifactType, artifactId: string) {
    const clearIfSelected = (value: UploadState): UploadState => value.libraryArtifactId === artifactId ? { name: value.name, content: value.content } : value;
    if (type === "worldBible") setWorldBible(clearIfSelected);
    else if (type === "characterProfiles") setCharacterProfiles(clearIfSelected);
    else if (type === "storySeed") setStorySeed(clearIfSelected);
    else setStoryRules(clearIfSelected);
  }

  return (
    <main className="min-h-screen px-5 py-6 md:px-8">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 border-b border-ink/10 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brass">Local creator tool</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink md:text-5xl">Story World Engine</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/70">Choose a Storyworld, gather a Cast, add a Story Spark, and generate a literary short story that respects your world and characters.</p>
          </div>
          <div className="flex flex-col gap-2 md:items-end"><BuildBadge buildInfo={buildInfo} /><div className="rounded-md border border-ink/10 bg-white/60 px-4 py-3 text-sm text-ink/70">No authentication, payments, voice, memory, or subscriptions.</div></div>
        </header>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
          <section className="flex flex-col gap-4">
            <button className="rounded-md border border-brass/40 bg-white/75 px-5 py-3 text-sm font-semibold text-brass shadow-soft transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60" disabled={isLoadingSample || isGenerating} onClick={handleLoadSampleWorld} type="button">{isLoadingSample ? "Loading sample world..." : "Load Sample World"}</button>
            <ProjectPanel cloudMessage={cloudProjectMessage} cloudProjects={cloudProjects} isCloudLoading={isCloudProjectsLoading} onDelete={handleDeleteProject} onDeleteCloud={handleDeleteCloudProject} onLoad={handleLoadProject} onLoadCloud={handleLoadCloudProject} onNameChange={setProjectName} onRefreshCloud={handleRefreshCloudProjects} onSave={handleSaveProject} onSaveCloud={handleSaveCloudProject} projectName={projectName} savedProjects={savedProjects} selectedCloudProjectId={selectedCloudProjectId} selectedProjectId={selectedProjectId} />
            <StoryworldSection disabled={isGenerating} libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "worldBible")} onApplyTemplate={handleApplyWorldTemplate} onChange={setWorldBible} onRemoveFromLibrary={handleRemoveInputArtifact} onSaveToLibrary={handleSaveInputArtifact} onSelectFromLibrary={handleSelectInputArtifact} value={worldBible} />
            <CastSection disabled={isGenerating} libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "characterProfiles")} onApplyArchetype={handleApplyCharacterArchetype} onChange={setCharacterProfiles} onRemoveFromLibrary={handleRemoveInputArtifact} onSaveToLibrary={handleSaveInputArtifact} onSelectFromLibrary={handleSelectInputArtifact} value={characterProfiles} />
            <StorySparkSection libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storySeed")} onChange={setStorySeed} onRemoveFromLibrary={handleRemoveInputArtifact} onSaveToLibrary={handleSaveInputArtifact} onSelectFromLibrary={handleSelectInputArtifact} value={storySeed} />
            <CraftRulesSection libraryArtifacts={inputArtifacts.filter((artifact) => artifact.type === "storyRules")} onChange={setStoryRules} onRemoveFromLibrary={handleRemoveInputArtifact} onSaveToLibrary={handleSaveInputArtifact} onSelectFromLibrary={handleSelectInputArtifact} value={storyRules} />
            <button className="rounded-md border border-ink/15 bg-white/75 px-5 py-3 text-sm font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60" disabled={isGenerating} onClick={handleClearCurrentInputs} type="button">Clear current inputs</button>
            <StoryArchitecturePanel characterArc={characterArc} endingType={endingType} genrePreset={genrePreset} isGenerating={isGenerating} lengthTarget={lengthTarget} narrativeArchitecture={narrativeArchitecture} onApplyRecommendation={handleApplyRecommendation} onRecommend={handleRecommendSettings} recommendation={recommendation} setCharacterArc={setCharacterArc} setEndingType={setEndingType} setGenrePreset={setGenrePreset} setLengthTarget={setLengthTarget} setNarrativeArchitecture={setNarrativeArchitecture} />
            <SavedStoriesPanel savedStories={savedStories} onDelete={(storyId) => { const next = savedStories.filter((story) => story.id !== storyId); persistSavedStories(next); setSavedStories(next); setStatusMessage("Saved story deleted."); }} onRestore={(story) => { setStoryResponse(savedStoryToResponse(story)); setCurrentStoryId(story.id); setIsFeedbackDismissed(false); setStatusMessage(`Restored ${story.title}.`); }} />
            {statusMessage ? <div className="rounded-md border border-brass/25 bg-paper/80 p-3 text-sm text-ink/70">{statusMessage}</div> : null}
            {error ? <div className="rounded-md border border-ember/30 bg-ember/10 p-3 text-sm text-ember">{error}</div> : null}
            <button className="rounded-md bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/35" disabled={!canGenerate} onClick={handleGenerate} type="button">{isGenerating ? "Generating story..." : "Generate Story"}</button>
            {!storyRules.content.trim() ? <p className="rounded-md bg-paper/80 px-3 py-2 text-xs leading-5 text-ink/55">{DEFAULT_STORY_RULES_NOTICE}</p> : null}
          </section>
          <StoryOutput canNativeShare={canNativeShare} feedback={getCurrentFeedback()} generationElapsedSeconds={generationElapsedSeconds} isFeedbackDismissed={isFeedbackDismissed} isGenerating={isGenerating} onCopySocialTeaser={() => storyResponse && copyText(buildSocialTeaser(createSavedStory(storyResponse))).then(() => setStatusMessage("Social teaser copied."))} onCopyStory={() => storyResponse && copyText(storyResponse.story).then(() => setStatusMessage("Story copied."))} onDismissFeedback={() => setIsFeedbackDismissed(true)} onDownloadMarkdown={() => storyResponse && downloadTextFile(`${slugify(createSavedStory(storyResponse).title)}.md`, buildMarkdownExport(createSavedStory(storyResponse)))} onDownloadTxt={() => storyResponse && downloadTextFile(`${slugify(createSavedStory(storyResponse).title)}.txt`, storyResponse.story)} onSaveStory={handleSaveStory} onShareStory={() => storyResponse && navigator.share?.({ title: createSavedStory(storyResponse).title, text: buildSocialTeaser(createSavedStory(storyResponse)) })} onSubmitFeedback={handleSubmitStoryFeedback} response={storyResponse} storyId={currentStoryId} />
        </div>
      </section>
    </main>
  );
}

function ProjectPanel({ cloudMessage, cloudProjects, isCloudLoading, onDelete, onDeleteCloud, onLoad, onLoadCloud, onNameChange, onRefreshCloud, onSave, onSaveCloud, projectName, savedProjects, selectedCloudProjectId, selectedProjectId }: { cloudMessage: string; cloudProjects: CloudProjectSummary[]; isCloudLoading: boolean; onDelete: () => void; onDeleteCloud: () => void; onLoad: (projectId: string) => void; onLoadCloud: (projectId: string) => void; onNameChange: (name: string) => void; onRefreshCloud: () => void; onSave: () => void; onSaveCloud: () => void; projectName: string; savedProjects: SavedProject[]; selectedCloudProjectId: string; selectedProjectId: string }) {
  return <section className="rounded-md border border-brass/20 bg-white/75 p-4 shadow-soft"><SectionHeader title="Project" subtitle="Save or restore this story workspace." /><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Project Name</span><input className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onNameChange(event.target.value)} placeholder="My story project" type="text" value={projectName} /></label><div className="mt-3 flex flex-wrap gap-2"><ActionButton onClick={onSave}>Save Project</ActionButton><SecondaryButton disabled={!selectedProjectId} onClick={onDelete}>Delete Project</SecondaryButton></div><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Load Project</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onLoad(event.target.value)} value={selectedProjectId}><option value="">Choose a saved project</option>{savedProjects.map((project) => <option key={project.id} value={project.id}>{project.name} - {formatDateTime(project.updatedAt)}</option>)}</select></label><p className="mt-3 text-xs leading-5 text-ink/55">Local projects stay in this browser and include the current inputs, selections, and latest generated story.</p><div className="mt-4 border-t border-ink/10 pt-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-sm font-semibold text-ink">Cloud Projects</h3><TertiaryButton disabled={isCloudLoading} onClick={onRefreshCloud}>{isCloudLoading ? "Syncing..." : "Refresh"}</TertiaryButton></div><div className="mt-3 flex flex-wrap gap-2"><ActionButton disabled={isCloudLoading} onClick={onSaveCloud}>Save to Cloud</ActionButton><SecondaryButton disabled={isCloudLoading || !selectedCloudProjectId} onClick={onDeleteCloud}>Delete Cloud Project</SecondaryButton></div><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Load Cloud Project</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" disabled={isCloudLoading} onChange={(event) => onLoadCloud(event.target.value)} value={selectedCloudProjectId}><option value="">Choose a cloud project</option>{cloudProjects.map((project) => <option key={project.id} value={project.id}>{project.name} - {formatDateTime(project.updatedAt)}</option>)}</select></label>{cloudMessage ? <p className="mt-3 rounded-md border border-brass/25 bg-paper/80 px-3 py-2 text-xs leading-5 text-ink/65">{cloudMessage}</p> : null}<p className="mt-3 text-xs leading-5 text-ink/55">Cloud uses the server project API. If it is unavailable, local project save/load still works.</p></div></section>;
}

function StoryworldSection(props: { disabled: boolean; libraryArtifacts: InputArtifact[]; onApplyTemplate: (template: WorldTemplate, mode: "add" | "replace") => void; onChange: (value: UploadState) => void; onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void; onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void; onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void; value: UploadState }) {
  const { disabled, libraryArtifacts, onApplyTemplate, onChange, onRemoveFromLibrary, onSaveToLibrary, onSelectFromLibrary, value } = props;
  const [selectedId, setSelectedId] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const selectedTemplate = useMemo(() => WORLD_TEMPLATES.find((template) => template.id === selectedId) ?? null, [selectedId]);
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><SectionHeader title="Storyworld" subtitle="Choose a world, add your own, or combine both." /><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Choose a world template</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => { setSelectedId(event.target.value); setShowDetails(false); }} value={selectedId}><option value="">Select a world template</option>{WORLD_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></label>{selectedTemplate ? <SelectedWorldPanel disabled={disabled} onApply={onApplyTemplate} onToggleDetails={() => setShowDetails((current) => !current)} showDetails={showDetails} template={selectedTemplate} /> : <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">Select a world template to preview it.</p>}<UploadControls artifactType="worldBible" libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} title="Upload your own Storyworld" value={value} /></section>;
}

function SelectedWorldPanel({ disabled, onApply, onToggleDetails, showDetails, template }: { disabled: boolean; onApply: (template: WorldTemplate, mode: "add" | "replace") => void; onToggleDetails: () => void; showDetails: boolean; template: WorldTemplate }) {
  return <article className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"><h3 className="text-base font-semibold leading-6 text-ink">{template.title}</h3><p className="mt-2 text-sm leading-6 text-ink/70">{template.shortDescription}</p><p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75"><span className="font-semibold text-ink">Core rule:</span> {template.coreRule}</p><div className="mt-3 flex flex-wrap gap-2"><ActionButton disabled={disabled} onClick={() => onApply(template, "add")}>Add to Storyworld</ActionButton><SecondaryButton disabled={disabled} onClick={() => onApply(template, "replace")}>Use this Storyworld</SecondaryButton><TertiaryButton onClick={onToggleDetails}>{showDetails ? "Hide Details" : "View Details"}</TertiaryButton></div>{showDetails ? <dl className="mt-4 grid gap-2 text-sm text-ink/75"><DetailItem label="Full World Bible" value={template.fullWorldBibleText} /><DetailItem label="Best Characters" value={template.bestCharacters} /><DetailItem label="Story Pressure" value={template.storyPressure} /><DetailItem label="Sensory Palette" value={template.sensoryPalette} /></dl> : null}</article>;
}

function CastSection(props: { disabled: boolean; libraryArtifacts: InputArtifact[]; onApplyArchetype: (preset: CharacterArchetypePreset, mode: "add" | "replace") => void; onChange: (value: UploadState) => void; onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void; onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void; onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void; value: UploadState }) {
  const { disabled, libraryArtifacts, onApplyArchetype, onChange, onRemoveFromLibrary, onSaveToLibrary, onSelectFromLibrary, value } = props;
  const [selectedName, setSelectedName] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const selectedPreset = useMemo(() => CHARACTER_ARCHETYPE_PRESETS.find((preset) => preset.name === selectedName) ?? null, [selectedName]);
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><SectionHeader title="Cast" subtitle="Choose a character, antihero, witness, keeper, singer, repairer, or upload your own." /><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Choose a character archetype</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => { setSelectedName(event.target.value); setShowDetails(false); }} value={selectedName}><option value="">Select an archetype</option>{CHARACTER_ARCHETYPE_PRESETS.map((preset) => <option key={preset.name} value={preset.name}>{formatArchetypeOption(preset)}</option>)}</select></label>{selectedPreset ? <SelectedCharacterPanel disabled={disabled} onApply={onApplyArchetype} onToggleDetails={() => setShowDetails((current) => !current)} preset={selectedPreset} showDetails={showDetails} /> : <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">Select a character to preview the compact card.</p>}<CurrentCastPanel content={value.content} /><UploadControls artifactType="characterProfiles" libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} title="Upload your own Cast" value={value} /></section>;
}

function SelectedCharacterPanel({ disabled, onApply, onToggleDetails, preset, showDetails }: { disabled: boolean; onApply: (preset: CharacterArchetypePreset, mode: "add" | "replace") => void; onToggleDetails: () => void; preset: CharacterArchetypePreset; showDetails: boolean }) {
  return <article className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"><div className="grid gap-3 sm:grid-cols-[84px_1fr]"><PencilPortrait name={preset.name} /><div className="min-w-0"><h3 className="text-base font-semibold leading-6 text-ink">{preset.name}</h3><p className="mt-1 text-sm font-semibold text-brass">{preset.archetype}</p><p className="mt-2 text-sm leading-6 text-ink/70">{preset.function}</p></div></div><div className="mt-3 flex flex-wrap gap-2"><ActionButton disabled={disabled} onClick={() => onApply(preset, "add")}>Add to Cast</ActionButton><SecondaryButton disabled={disabled} onClick={() => onApply(preset, "replace")}>Replace Cast</SecondaryButton><TertiaryButton onClick={onToggleDetails}>{showDetails ? "Hide Details" : "View Details"}</TertiaryButton></div><p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-xs leading-5 text-ink/60">Use Add to Cast for multiple characters. Use Replace Cast for one-character tests.</p>{showDetails ? <dl className="mt-4 grid gap-2 text-sm text-ink/75"><DetailItem label="Enneagram" value={preset.enneagram} /><DetailItem label="Core Desire" value={preset.coreDesire} /><DetailItem label="Core Fear" value={preset.coreFear} /><DetailItem label="Backstory" value={preset.backstory} /><DetailItem label="Conflict Engine" value={preset.conflictEngine} /></dl> : null}</article>;
}

function CurrentCastPanel({ content }: { content: string }) {
  const entries = getCurrentCastEntries(content);
  const hasCustomCast = Boolean(content.trim() && entries.length === 0);
  return <section className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"><h3 className="text-sm font-semibold text-ink">Current Cast</h3>{entries.length > 0 ? <ul className="mt-3 grid gap-2">{entries.map((entry) => <li className="rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75" key={`${entry.name}-${entry.archetype}`}><span className="font-semibold text-ink">{entry.name}</span> — {entry.archetype}</li>)}</ul> : <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/60">{hasCustomCast ? "Custom cast content loaded. This cast text will be sent to generation." : "No cast members added yet."}</p>}</section>;
}

function StorySparkSection(props: { libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void; onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void; onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void; value: UploadState }) {
  const { libraryArtifacts, onChange, onRemoveFromLibrary, onSaveToLibrary, onSelectFromLibrary, value } = props;
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><SectionHeader title="Story Spark" subtitle="The image, event, conflict, or question that starts the story." /><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Write your Story Spark</span><span className="text-xs leading-5 text-ink/55">The image, event, conflict, or question that starts the story.</span><textarea className="min-h-36 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onChange({ name: value.name || "story-spark.txt", content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder="A vanished road opens behind the diner after the same song plays three nights in a row." value={value.content} /></label><UploadControls artifactType="storySeed" libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} title="Upload or save Story Spark" value={value} /></section>;
}

function CraftRulesSection(props: { libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void; onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void; onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void; value: UploadState }) {
  const { libraryArtifacts, onChange, onRemoveFromLibrary, onSaveToLibrary, onSelectFromLibrary, value } = props;
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><SectionHeader title="Craft Rules" subtitle="Default craft rules are used automatically. Advanced users can customize them." /><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Customize Craft Rules</span><span className="text-xs leading-5 text-ink/55">Optional. Leave empty to use the built-in defaults.</span><textarea className="min-h-28 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onChange({ name: value.name || "craft-rules.txt", content: event.target.value, libraryArtifactId: value.libraryArtifactId })} placeholder="Optional custom constraints, priorities, or ending guidance." value={value.content} /></label><UploadControls artifactType="storyRules" libraryArtifacts={libraryArtifacts} onChange={onChange} onRemoveFromLibrary={onRemoveFromLibrary} onSaveToLibrary={onSaveToLibrary} onSelectFromLibrary={onSelectFromLibrary} title="Upload your own Craft Rules" value={value} /></section>;
}

function UploadControls({ artifactType, libraryArtifacts, onChange, onRemoveFromLibrary, onSaveToLibrary, onSelectFromLibrary, title, value }: { artifactType: InputArtifactType; libraryArtifacts: InputArtifact[]; onChange: (value: UploadState) => void; onRemoveFromLibrary: (type: InputArtifactType, artifactId?: string) => void; onSaveToLibrary: (type: InputArtifactType, value: UploadState) => void; onSelectFromLibrary: (type: InputArtifactType, artifactId: string) => void; title: string; value: UploadState }) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) { event.target.value = ""; onChange({ ...EMPTY_UPLOAD }); return; }
    onChange({ name: file.name, content: await file.text() });
  }
  const selectedArtifact = libraryArtifacts.find((artifact) => artifact.id === value.libraryArtifactId);
  return <div className="mt-4 rounded-md bg-paper/70 p-3"><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="mt-1 text-xs leading-5 text-ink/55">Upload a .md or .txt file, or choose a saved local item.</p><label className="mt-3 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Choose from local library</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => onSelectFromLibrary(artifactType, event.target.value)} value={value.libraryArtifactId ?? ""}><option value="">Upload new or choose saved</option>{libraryArtifacts.map((artifact) => <option key={artifact.id} value={artifact.id}>{artifact.name} ({artifact.characterCount.toLocaleString()} chars)</option>)}</select></label><label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-brass/55 bg-white/60 px-4 py-5 text-center transition hover:border-brass hover:bg-paper"><span className="text-sm font-semibold text-brass">{value.name || "Choose .md or .txt file"}</span><span className="mt-1 text-xs text-ink/55">{value.content ? `${value.content.length.toLocaleString()} characters loaded` : "Files stay local until generation"}</span><input className="sr-only" type="file" accept=".md,.txt,text/markdown,text/plain" onChange={handleFileChange} /></label>{selectedArtifact ? <p className="mt-3 rounded-md bg-white/65 px-3 py-2 text-xs leading-5 text-ink/60">Loaded from library: {selectedArtifact.name} | {selectedArtifact.characterCount.toLocaleString()} characters</p> : null}<div className="mt-3 flex flex-wrap gap-2"><ActionButton disabled={!value.content.trim()} onClick={() => onSaveToLibrary(artifactType, value)}>Save to Library</ActionButton><button className="rounded-md border border-ember/30 bg-white/70 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-50" disabled={!value.libraryArtifactId} onClick={() => onRemoveFromLibrary(artifactType, value.libraryArtifactId)} type="button">Remove from Library</button></div></div>;
}

function SectionHeader({ subtitle, title }: { subtitle: string; title: string }) { return <div className="flex flex-col gap-1"><h2 className="text-lg font-semibold text-ink">{title}</h2><p className="text-sm leading-6 text-ink/65">{subtitle}</p></div>; }
function ActionButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick: () => void }) { return <button className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function SecondaryButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick: () => void }) { return <button className="rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-xs font-semibold text-brass transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function TertiaryButton({ children, disabled, onClick }: { children: string; disabled?: boolean; onClick: () => void }) { return <button className="rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">{children}</button>; }
function DetailItem({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-white/65 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt><dd className="mt-1 leading-6 text-ink/75">{value}</dd></div>; }

function PencilPortrait({ name }: { name: string }) {
  const index = Math.max(0, CHARACTER_ARCHETYPE_PRESETS.findIndex((preset) => preset.name === name));
  const portrait = PORTRAIT_STYLES[index % PORTRAIT_STYLES.length];
  return <svg aria-label={`${name} portrait`} className="h-24 w-20 rounded-md border border-ink/10 bg-white/60" role="img" viewBox="0 0 80 96"><g fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round"><path d={portrait.contour} strokeWidth="2" /><path d={portrait.hair} strokeWidth="1.9" /><path d={portrait.face} strokeWidth="1.45" /><path d={portrait.shoulders} strokeWidth="1.8" /><path d={portrait.detail} strokeWidth="1.15" /></g></svg>;
}

function StoryArchitecturePanel(props: { characterArc: CharacterArc; endingType: EndingType; genrePreset: GenrePreset; isGenerating: boolean; lengthTarget: LengthTarget; narrativeArchitecture: NarrativeArchitecture; onApplyRecommendation: () => void; onRecommend: () => void; recommendation: StoryArchitectureRecommendation | null; setCharacterArc: (value: CharacterArc) => void; setEndingType: (value: EndingType) => void; setGenrePreset: (value: GenrePreset) => void; setLengthTarget: (value: LengthTarget) => void; setNarrativeArchitecture: (value: NarrativeArchitecture) => void }) {
  const { characterArc, endingType, genrePreset, isGenerating, lengthTarget, narrativeArchitecture, onApplyRecommendation, onRecommend, recommendation, setCharacterArc, setEndingType, setGenrePreset, setLengthTarget, setNarrativeArchitecture } = props;
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-lg font-semibold text-ink">Story Architecture</h2><p className="text-sm leading-6 text-ink/65">Compact controls for genre, shape, arc, ending, and length.</p></div><button className="rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-sm font-semibold text-brass transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-60" disabled={isGenerating} onClick={onRecommend} type="button">Recommend Settings</button></div>{recommendation ? <div className="mt-4 rounded-md border border-brass/25 bg-paper/80 p-3 text-sm text-ink/75"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold text-ink">Recommended settings</p><p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Confidence {Math.round(recommendation.confidence * 100)}%</p></div><button className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90" onClick={onApplyRecommendation} type="button">Apply Recommendation</button></div><p className="mt-3 leading-6">{recommendation.explanation}</p></div> : null}<div className="mt-4 grid gap-3"><SelectControl label="Genre Preset" onChange={(value) => setGenrePreset(value as GenrePreset)} options={GENRE_PRESETS} value={genrePreset} /><SelectControl label="Narrative Architecture" onChange={(value) => setNarrativeArchitecture(value as NarrativeArchitecture)} options={NARRATIVE_ARCHITECTURES} value={narrativeArchitecture} /><SelectControl label="Character Arc" onChange={(value) => setCharacterArc(value as CharacterArc)} options={CHARACTER_ARCS} value={characterArc} /><SelectControl label="Ending Type" onChange={(value) => setEndingType(value as EndingType)} options={ENDING_TYPES} value={endingType} /><SelectControl label="Length Target" onChange={(value) => setLengthTarget(value as LengthTarget)} options={LENGTH_TARGETS.map((target) => ({ value: target.value, label: target.label }))} value={lengthTarget} /><div className="rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/70">POV is locked to third-person limited.</div></div></section>;
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[] | readonly SelectOption[]; onChange: (value: string) => void }) {
  return <label className="flex flex-col gap-2"><span className="text-sm font-semibold text-ink">{label}</span><select className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const optionValue = typeof option === "string" ? option : option.value; const optionLabel = typeof option === "string" ? option : option.label; return <option key={optionValue} value={optionValue}>{optionLabel}</option>; })}</select></label>;
}

function SavedStoriesPanel({ savedStories, onDelete, onRestore }: { savedStories: SavedStory[]; onDelete: (storyId: string) => void; onRestore: (story: SavedStory) => void }) {
  return <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft"><h2 className="text-lg font-semibold text-ink">Saved Stories</h2><p className="text-sm leading-6 text-ink/65">Stored locally in this browser.</p>{savedStories.length === 0 ? <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">No saved stories yet.</p> : <div className="mt-4 grid gap-3">{savedStories.map((story) => <article key={story.id} className="rounded-md border border-ink/10 bg-paper/80 p-3"><h3 className="text-sm font-semibold text-ink">{story.title}</h3><p className="mt-1 text-xs leading-5 text-ink/60">{formatDateTime(story.createdAt)} | {story.wordCount.toLocaleString()} words</p><p className="mt-1 text-xs leading-5 text-ink/60">{story.genrePreset} | {story.narrativeArchitecture}</p><div className="mt-3 flex flex-wrap gap-2"><button className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90" onClick={() => onRestore(story)} type="button">Open</button><button className="rounded-md border border-ember/30 bg-white/70 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/10" onClick={() => onDelete(story.id)} type="button">Delete</button></div></article>)}</div>}</section>;
}

function BuildBadge({ buildInfo }: { buildInfo: BuildInfo }) {
  return <div className="rounded-md border border-brass/25 bg-white/75 px-3 py-2 text-xs font-semibold text-ink/65 shadow-soft">Version {buildInfo.appVersion} | {buildInfo.buildEnvironment} | {buildInfo.gitBranch} | {buildInfo.shortCommitSha}{buildInfo.buildTimestamp !== "unknown" ? ` | ${formatBuildTimestamp(buildInfo.buildTimestamp)}` : ""}</div>;
}

function StoryOutput({ canNativeShare, feedback, generationElapsedSeconds, response, isFeedbackDismissed, isGenerating, onCopySocialTeaser, onCopyStory, onDismissFeedback, onDownloadMarkdown, onDownloadTxt, onSaveStory, onShareStory, onSubmitFeedback, storyId }: { canNativeShare: boolean; feedback: StoryFeedback | null; generationElapsedSeconds: number; response: GenerateStoryResponse | null; isFeedbackDismissed: boolean; isGenerating: boolean; onCopySocialTeaser: () => void; onCopyStory: () => void; onDismissFeedback: () => void; onDownloadMarkdown: () => void; onDownloadTxt: () => void; onSaveStory: () => void; onShareStory: () => void; onSubmitFeedback: (feedback: StoryFeedback) => void; storyId: string }) {
  if (isGenerating) return <section className="min-h-[640px] rounded-md border border-ink/10 bg-white/75 p-6 shadow-soft"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">Generating story...</p><div className="mt-6 rounded-md border border-brass/25 bg-paper/80 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-semibold text-ink">{formatDuration(generationElapsedSeconds)}</h2><p className="mt-2 text-sm leading-6 text-ink/70">{getGenerationStatusMessage(generationElapsedSeconds)}</p></div><div className="size-12 animate-spin rounded-full border-4 border-brass/20 border-t-brass" aria-hidden="true" /></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-ink/10"><div className="h-full rounded-full bg-brass transition-all duration-500" style={{ width: `${getGenerationProgressPercent(generationElapsedSeconds)}%` }} /></div><p className="mt-3 text-xs leading-5 text-ink/55">The request is still running. Blueprint, repair, and expansion passes can take longer for Standard and Long stories.</p>{generationElapsedSeconds > 180 ? <p className="mt-4 rounded-md border border-ember/30 bg-ember/10 p-3 text-sm leading-6 text-ember">This is taking longer than expected. The request may still finish, but if it does not, check Vercel logs or retry with Compact or Standard length.</p> : null}</div></section>;
  if (!response) return <section className="flex min-h-[640px] items-center justify-center rounded-md border border-ink/10 bg-white/60 p-6 text-center shadow-soft"><div><h2 className="text-2xl font-semibold text-ink">Your story will appear here</h2><p className="mt-3 max-w-md text-sm leading-6 text-ink/65">The API uses OpenAI when OPENAI_API_KEY is set, and the local deterministic engine when it is not.</p></div></section>;
  const diagnostics = response.metadata.diagnostics;
  const metadata = [["Word count", response.metadata.wordCount.toLocaleString()], ["Generator source", response.metadata.source], ["Generation duration", response.metadata.generationDurationSeconds !== undefined ? formatDuration(response.metadata.generationDurationSeconds) : "None"], ["Server duration", response.metadata.serverGenerationDurationSeconds !== undefined ? formatDuration(response.metadata.serverGenerationDurationSeconds) : "None"], ["Feedback saved", feedback ? `${feedback.score} / 5` : "Not yet"], ["Characters", formatList(response.metadata.charactersUsed)], ["Rules", formatList(response.metadata.rulesReferenced)], ["App version", response.metadata.appVersion ?? diagnostics.appVersion ?? "unknown"], ["Build environment", response.metadata.buildEnvironment ?? diagnostics.buildEnvironment ?? "development"], ["Git branch", response.metadata.gitBranch ?? diagnostics.gitBranch ?? "local"], ["Commit SHA", shortenCommitSha(response.metadata.commitSha ?? diagnostics.commitSha ?? "unknown")], ["Build timestamp", formatBuildTimestamp(response.metadata.buildTimestamp ?? diagnostics.buildTimestamp ?? "unknown")], ["Genre preset", diagnostics.genrePreset], ["Narrative architecture", diagnostics.narrativeArchitecture], ["Character arc", diagnostics.characterArc], ["Ending type", diagnostics.endingType], ["Length target", diagnostics.lengthTarget], ["Final word count", diagnostics.finalWordCount.toLocaleString()], ["Expansion attempted", formatBoolean(diagnostics.expansionAttempted)], ["Expansion succeeded", formatBoolean(diagnostics.expansionSucceeded)], ["Timed out early", formatBoolean(Boolean(diagnostics.timedOutEarly))], ["Stopped reason", diagnostics.stoppedReason ?? "complete"], ["Remaining forbidden terms", formatList(diagnostics.remainingForbiddenTerms ?? [])], ["Under target notice", diagnostics.underTargetNotice ?? "None"], ["Blueprint generated", formatBoolean(diagnostics.blueprintGenerated)], ["Blueprint scene count", diagnostics.blueprintSceneCount.toLocaleString()], ["Blueprint failed reason", diagnostics.blueprintFailedReason ?? "None"], ["OpenAI Enabled", formatBoolean(diagnostics.openAIEnabled)], ["OPENAI_API_KEY detected", formatBoolean(diagnostics.apiKeyDetected)], ["Model requested", diagnostics.modelRequested], ["OpenAI Attempted", formatBoolean(diagnostics.openAIRequestAttempted)], ["OpenAI Succeeded", formatBoolean(diagnostics.openAIRequestSucceeded)], ["Fallback Reason", diagnostics.fallbackReason ?? "None"], ["Notice", diagnostics.notice ?? "None"]] as const;
  return <section className="rounded-md border border-ink/10 bg-white/80 p-5 shadow-soft md:p-7"><div className="flex flex-col gap-4 border-b border-ink/10 pb-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">Generated Story</p><h2 className="mt-2 text-2xl font-semibold text-ink">{response.metadata.source === "openai" ? "OpenAI-powered draft" : "Fallback local draft"}</h2></div><div className="flex flex-wrap gap-2"><OutputButton onClick={onSaveStory}>Save Story</OutputButton><OutputButton onClick={onCopyStory}>Copy story</OutputButton><OutputButton onClick={onDownloadTxt}>Download .txt</OutputButton><OutputButton onClick={onDownloadMarkdown}>Download .md</OutputButton><OutputButton onClick={onCopySocialTeaser}>Copy social teaser</OutputButton>{canNativeShare ? <OutputButton onClick={onShareStory}>Share</OutputButton> : null}</div></div><dl className="grid gap-2 text-sm text-ink/70 sm:grid-cols-2 lg:grid-cols-3">{metadata.map(([label, value]) => <MetadataItem key={label} label={label} value={value} />)}</dl></div><article className="mt-6 max-w-none whitespace-pre-wrap text-base leading-8 text-ink">{response.story}</article>{!isFeedbackDismissed ? <StoryFeedbackCard feedback={feedback} response={response} storyId={storyId || createStoryId(response.story)} onDismiss={onDismissFeedback} onSubmit={onSubmitFeedback} /> : null}</section>;
}

function OutputButton({ children, onClick }: { children: string; onClick: () => void }) { return <button className="rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-paper" onClick={onClick} type="button">{children}</button>; }
function MetadataItem({ label, value }: { label: string; value: string }) { return <div className="rounded-md bg-paper/80 px-3 py-2"><dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt><dd className="mt-1 break-words text-sm text-ink">{value}</dd></div>; }

function StoryFeedbackCard({ feedback, response, storyId, onDismiss, onSubmit }: { feedback: StoryFeedback | null; response: GenerateStoryResponse; storyId: string; onDismiss: () => void; onSubmit: (feedback: StoryFeedback) => void }) {
  const [score, setScore] = useState<StoryFeedbackScore | null>(feedback?.score ?? null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(feedback?.selectedOptions ?? []);
  const [comment, setComment] = useState(feedback?.comment ?? "");
  const options = score && score >= 4 ? POSITIVE_FEEDBACK_OPTIONS : IMPROVEMENT_FEEDBACK_OPTIONS;
  const prompt = score && score >= 4 ? "What worked best? Pick up to 2." : "What could the story have done better? Pick up to 2.";

  useEffect(() => {
    setScore(feedback?.score ?? null);
    setSelectedOptions(feedback?.selectedOptions ?? []);
    setComment(feedback?.comment ?? "");
  }, [feedback, storyId]);

  function handleScoreChange(nextScore: StoryFeedbackScore) {
    setScore(nextScore);
    setSelectedOptions([]);
  }

  function handleOptionToggle(option: string) {
    setSelectedOptions((currentOptions) => {
      if (currentOptions.includes(option)) return currentOptions.filter((item) => item !== option);
      if (currentOptions.length >= 2) return currentOptions;
      return [...currentOptions, option];
    });
  }

  function handleSubmit() {
    if (!score) return;
    const diagnostics = response.metadata.diagnostics;
    onSubmit({
      storyId,
      score,
      selectedOptions,
      ...(comment.trim() ? { comment: comment.trim() } : {}),
      createdAt: new Date().toISOString(),
      storyMetadata: {
        title: createStoryTitle(response.story),
        wordCount: response.metadata.wordCount,
        generatorSource: response.metadata.source,
        genrePreset: diagnostics.genrePreset,
        narrativeArchitecture: diagnostics.narrativeArchitecture,
        characterArc: diagnostics.characterArc,
        endingType: diagnostics.endingType,
        lengthTarget: diagnostics.lengthTarget
      }
    });
  }

  return <section className="mt-6 rounded-md border border-brass/25 bg-paper/85 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="text-lg font-semibold text-ink">Did this story land?</h3><p className="mt-1 text-sm leading-6 text-ink/65">Optional feedback, saved locally with this story.</p></div><button className="self-start rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-paper" onClick={onDismiss} type="button">Dismiss</button></div><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">{FEEDBACK_CHOICES.map((choice) => <button className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${score === choice.score ? "border-brass bg-brass text-white" : "border-ink/15 bg-white/75 text-ink hover:bg-white"}`} key={choice.score} onClick={() => handleScoreChange(choice.score)} type="button"><span className="block text-xs opacity-75">{choice.score}</span>{choice.label}</button>)}</div>{score ? <div className="mt-4"><p className="text-sm font-semibold text-ink">{prompt}</p><div className="mt-3 flex flex-wrap gap-2">{options.map((option) => <button className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selectedOptions.includes(option) ? "border-brass bg-white text-brass" : "border-ink/15 bg-white/65 text-ink hover:bg-white"} disabled:cursor-not-allowed disabled:opacity-45`} disabled={!selectedOptions.includes(option) && selectedOptions.length >= 2} key={option} onClick={() => handleOptionToggle(option)} type="button">{option}</button>)}</div><label className="mt-4 flex flex-col gap-2"><span className="text-sm font-semibold text-ink">Anything else?</span><textarea className="min-h-24 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm leading-6 text-ink outline-none transition placeholder:text-ink/35 focus:border-brass focus:ring-2 focus:ring-brass/20" onChange={(event) => setComment(event.target.value)} placeholder="Optional note" value={comment} /></label><button className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90" onClick={handleSubmit} type="button">{feedback ? "Update Feedback" : "Save Feedback"}</button>{feedback ? <p className="mt-3 text-xs leading-5 text-ink/55">Saved {formatDateTime(feedback.createdAt)}</p> : null}</div> : null}</section>;
}

async function fetchSampleFile(fileName: string): Promise<string> { const response = await fetch(`/sample-content/${fileName}`); if (!response.ok) throw new Error(`Unable to load sample file: ${fileName}`); return response.text(); }
async function fetchCloudJson<T>(input: string, init?: RequestInit): Promise<T> { const response = await fetch(input, { ...init, cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) { const message = typeof payload?.error === "string" ? payload.error : "Cloud project request failed."; throw new Error(message); } return payload as T; }
async function saveStoryToCloudProject(projectId: string, savedStory: SavedStory, response: GenerateStoryResponse): Promise<void> { const sequenceNumber = await getNextCloudStorySequenceNumber(projectId); await fetchCloudJson(`/api/projects/${encodeURIComponent(projectId)}/stories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ story: { storyId: savedStory.id, title: savedStory.title, story: savedStory.story, metadata: buildCloudStoryMetadata(savedStory, response), sequenceNumber, sequenceLabel: `Part ${sequenceNumber}`, storyRole: "origin", canonStatus: "draft", isFavorite: false, favoriteAt: null } }) }); }
async function getNextCloudStorySequenceNumber(projectId: string): Promise<number> { const payload = await fetchCloudJson<{ stories?: CloudSavedStorySummary[] }>(`/api/projects/${encodeURIComponent(projectId)}/stories`); const stories = Array.isArray(payload.stories) ? payload.stories : []; return stories.reduce((highest, story) => Math.max(highest, typeof story.sequenceNumber === "number" ? story.sequenceNumber : 0), 0) + 1; }
function buildCloudStoryMetadata(savedStory: SavedStory, response: GenerateStoryResponse): Record<string, unknown> { return { localStoryId: savedStory.id, localCreatedAt: savedStory.createdAt, wordCount: savedStory.wordCount, generatorSource: savedStory.generatorSource, charactersUsed: savedStory.charactersUsed, rulesReferenced: savedStory.rulesReferenced, genrePreset: savedStory.genrePreset, narrativeArchitecture: savedStory.narrativeArchitecture, characterArc: savedStory.characterArc, endingType: savedStory.endingType, lengthTarget: savedStory.lengthTarget, diagnosticsNotice: savedStory.diagnosticsNotice, feedback: savedStory.feedback ?? [], generationMetadata: response.metadata }; }
function normalizeGenerateStoryResponse(payload: unknown): GenerateStoryResponse { const normalizedPayload = normalizeStoryPayload(payload) as Partial<GenerateStoryResponse>; const story = normalizeStoryText(normalizedPayload.story); if (!story || !normalizedPayload.metadata) throw new Error("Story generation returned an invalid response."); return { ...normalizedPayload, story, metadata: { ...normalizedPayload.metadata, wordCount: countWords(story) } } as GenerateStoryResponse; }
async function copyText(text: string) { await navigator.clipboard.writeText(text); }
function buildMarkdownExport(savedStory: SavedStory): string { return `# ${savedStory.title}\n\nGenerated date: ${formatDateTime(savedStory.createdAt)}\nWord count: ${savedStory.wordCount.toLocaleString()}\nGenre Preset: ${savedStory.genrePreset}\nNarrative Architecture: ${savedStory.narrativeArchitecture}\nCharacter Arc: ${savedStory.characterArc}\nEnding Type: ${savedStory.endingType}\nLength Target: ${savedStory.lengthTarget}\n\n${savedStory.story}`; }
function buildSocialTeaser(savedStory: SavedStory): string { return `${savedStory.title}\n\n${truncateText(savedStory.story, 280)}\n\n${savedStory.wordCount.toLocaleString()} words\nGenerated with Story World Engine`; }
function downloadTextFile(fileName: string, contents: string) { const blob = new Blob([contents], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
function countWords(text: string): number { return text.trim().split(/\s+/).filter(Boolean).length; }
function createStoryId(story: string, createdAt = new Date().toISOString()): string { return `${createdAt}-${story.length}`.replace(/[^a-zA-Z0-9_-]/g, "-"); }
function createStoryTitle(story: string): string { const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story"; const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine; return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story"; }
function formatWorldTemplateBible(template: WorldTemplate): string { return `# ${template.title}\n\nShort Description: ${template.shortDescription}\n\nCore Rule: ${template.coreRule}\n\nStoryworld:\n${template.fullWorldBibleText}\n\nBest Characters: ${template.bestCharacters}\n\nStory Pressure: ${template.storyPressure}\n\nSensory Palette: ${template.sensoryPalette}`; }
function formatCharacterArchetypeCard(preset: CharacterArchetypePreset): string { return `## ${preset.name} — ${preset.archetype}\n\nEnneagram: ${preset.enneagram}\nFunction: ${preset.function}\nCore Desire: ${preset.coreDesire}\nCore Fear: ${preset.coreFear}\nBackstory: ${preset.backstory}\nConflict Engine: ${preset.conflictEngine}`; }
function getCurrentCastEntries(content: string): { name: string; archetype: string }[] { return CHARACTER_ARCHETYPE_PRESETS.filter((preset) => content.includes(`${preset.name} — ${preset.archetype}`)).map((preset) => ({ name: preset.name, archetype: preset.archetype })); }
function formatArchetypeOption(preset: CharacterArchetypePreset): string { return `${preset.name} — ${preset.archetype.replace(/^The\s+/i, "")}`; }
function truncateText(text: string, maxLength: number): string { const compact = text.replace(/\s+/g, " ").trim(); return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`; }
function slugify(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "story-world-engine-story"; }
function formatDateTime(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function formatLibraryVersion(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)).replace(/[^a-zA-Z0-9]+/g, "-").replace(/-+$/g, ""); }
function formatList(values: string[]): string { return values.length > 0 ? values.join(", ") : "None detected"; }
function formatCaughtError(caughtError: unknown): string { return caughtError instanceof Error ? caughtError.message : "Cloud project request failed."; }
function formatDuration(totalSeconds: number): string { const safeSeconds = Math.max(0, Math.floor(totalSeconds)); const minutes = Math.floor(safeSeconds / 60); const seconds = safeSeconds % 60; return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`; }
function getGenerationStatusMessage(elapsedSeconds: number): string { if (elapsedSeconds >= 120) return "Still working. Longer stories and repair passes may take several minutes."; if (elapsedSeconds >= 60) return "Expanding and checking constraints..."; if (elapsedSeconds >= 30) return "Drafting story..."; if (elapsedSeconds >= 10) return "Building story blueprint..."; return "Preparing story materials..."; }
function getGenerationProgressPercent(elapsedSeconds: number): number { return Math.min(96, Math.max(8, Math.round((elapsedSeconds / 180) * 100))); }
function shortenCommitSha(commitSha: string): string { return commitSha === "unknown" ? commitSha : commitSha.slice(0, 7); }
function formatBuildTimestamp(value: string): string { if (value === "unknown") return value; const timestamp = new Date(value); return Number.isNaN(timestamp.getTime()) ? value : formatDateTime(timestamp.toISOString()); }
function formatBoolean(value: boolean): string { return value ? "Yes" : "No"; }

const PORTRAIT_STYLES = [
  { contour: "M38 19 Q27 21 25 34 Q24 48 32 56 Q39 63 49 58 Q58 52 57 37 Q56 24 45 20 Q41 18 38 19", hair: "M26 34 Q33 20 45 22 Q55 25 56 39 M27 31 Q39 27 53 32", face: "M32 39 Q34 37 36 39 M44 39 Q47 37 49 39 M41 40 Q39 45 40 48 M36 53 Q41 56 47 52", shoulders: "M22 87 Q28 70 40 68 Q52 70 60 87", detail: "M26 58 Q21 65 18 73 M54 58 Q60 65 63 73" },
  { contour: "M41 18 Q29 19 26 31 Q23 45 29 55 Q35 65 47 61 Q58 57 59 42 Q60 27 50 21 Q46 18 41 18", hair: "M27 33 Q31 22 43 20 Q53 21 58 33 M30 25 Q40 16 54 27", face: "M33 38 Q36 36 38 38 M45 38 Q48 36 50 38 M42 40 Q43 45 40 49 M35 54 Q42 52 50 55", shoulders: "M19 88 Q27 72 40 70 Q54 71 63 88", detail: "M31 60 Q27 65 25 72 M51 60 Q55 66 56 73" },
  { contour: "M39 17 Q28 19 25 35 Q23 51 34 59 Q44 66 54 56 Q61 49 58 34 Q55 19 43 17 Q41 16 39 17", hair: "M24 38 Q26 22 39 18 Q53 17 58 38 M25 39 Q41 29 58 38", face: "M32 40 Q35 38 37 40 M45 40 Q48 38 50 40 M41 41 Q39 46 42 49 M35 54 Q43 58 50 53", shoulders: "M17 87 Q29 72 40 70 Q52 72 64 87", detail: "M39 13 L42 9 L46 14 M56 55 Q60 60 61 67" },
  { contour: "M40 20 Q30 20 27 33 Q24 47 30 55 Q37 64 49 60 Q59 56 58 41 Q57 27 48 22 Q44 20 40 20", hair: "M27 34 Q31 23 42 22 Q52 22 57 34 M29 29 Q40 35 54 29", face: "M33 40 Q35 39 37 40 M44 40 Q47 39 49 40 M40 42 Q42 46 39 50 M35 55 Q41 53 47 55", shoulders: "M16 88 Q25 72 40 70 Q55 72 65 88", detail: "M20 34 Q24 31 27 34 M51 58 Q56 62 59 68" },
  { contour: "M40 18 Q29 20 25 35 Q23 47 30 57 Q37 66 49 61 Q59 57 59 42 Q58 27 48 20 Q44 18 40 18", hair: "M25 36 Q27 20 40 19 Q55 20 58 36 M31 22 Q35 29 31 35 M51 23 Q47 30 52 36", face: "M32 39 Q35 38 37 39 M44 39 Q48 38 50 39 M41 41 Q38 46 40 49 M34 55 L50 55", shoulders: "M19 88 Q27 71 40 70 Q54 71 61 88", detail: "M18 46 Q22 43 25 46 M56 46 Q60 43 63 47" },
  { contour: "M41 19 Q30 20 27 33 Q25 49 33 57 Q41 64 52 58 Q60 52 57 36 Q54 22 45 20 Q43 19 41 19", hair: "M27 34 Q32 20 43 21 Q55 23 56 38 M28 34 Q39 21 56 31", face: "M33 39 Q36 38 38 39 M45 39 Q48 38 50 39 M42 41 Q41 46 43 49 M36 55 Q42 58 49 54", shoulders: "M18 87 Q28 71 40 70 Q53 71 62 87", detail: "M61 45 Q66 49 62 54 M30 60 Q26 66 24 73" },
  { contour: "M39 17 Q27 18 24 33 Q22 48 31 57 Q39 65 51 59 Q60 54 59 39 Q57 22 44 18 Q42 17 39 17", hair: "M23 37 Q26 19 40 17 Q56 18 59 37 M25 28 Q41 36 58 28", face: "M31 39 Q34 37 37 39 M45 39 Q49 37 52 39 M41 40 Q40 46 43 49 M35 54 Q42 52 49 54", shoulders: "M15 88 Q25 69 40 69 Q55 69 65 88", detail: "M31 15 Q40 9 50 16 M21 53 Q27 49 35 53" },
  { contour: "M40 18 Q29 19 25 34 Q22 49 32 58 Q41 66 51 58 Q60 50 57 35 Q54 20 43 18 Q41 17 40 18", hair: "M25 39 Q27 20 39 18 Q54 18 57 39 M25 39 Q32 46 39 38 M57 39 Q50 46 43 38", face: "M32 41 Q35 39 37 41 M44 41 Q47 39 50 41 M41 43 Q39 48 42 51 M36 56 Q42 59 48 55", shoulders: "M16 88 Q26 70 40 69 Q54 70 64 88", detail: "M18 72 Q25 68 32 72 M52 59 Q57 65 58 72" },
  { contour: "M40 17 Q29 18 25 33 Q22 48 31 58 Q40 67 52 59 Q61 52 58 36 Q55 20 43 18 Q41 17 40 17", hair: "M24 35 Q29 17 41 17 Q56 20 58 37 M26 34 Q36 28 52 33", face: "M32 39 Q35 37 37 39 M45 39 Q48 37 50 39 M41 40 Q38 46 41 50 M34 56 Q42 52 50 57", shoulders: "M16 88 Q25 71 40 70 Q55 71 64 88", detail: "M20 21 Q24 17 29 19 M24 60 Q21 66 20 73" },
  { contour: "M41 19 Q30 20 27 34 Q25 48 32 57 Q39 65 51 60 Q60 56 58 40 Q56 25 47 21 Q44 19 41 19", hair: "M26 34 Q32 20 42 20 Q53 21 56 34 M30 24 L27 37 M50 24 L56 37", face: "M33 39 Q36 38 38 39 M45 39 Q48 38 50 39 M42 41 Q44 46 41 50 M34 54 Q42 60 51 54", shoulders: "M15 88 Q25 70 40 69 Q55 70 65 88", detail: "M58 66 Q63 70 65 76 M30 58 Q26 63 24 70" }
] as const;
