"use client";

import { useEffect } from "react";

type SavedStorySnapshot = {
  id?: string;
  title?: string;
  story?: string;
  wordCount?: number;
  genrePreset?: string;
  narrativeArchitecture?: string;
  diagnosticsNotice?: string | null;
};

const SAVED_STORIES_STORAGE_KEY = "story-world-engine:saved-stories:v1";
const CONTINUE_BUTTON_ATTRIBUTE = "data-story-world-engine-continue-series";
const CONTINUATION_NOTICE_ID = "story-world-engine-continuation-notice";
const GENERATED_STORY_PANEL_ID = "story-world-engine-generated-continuation-panel";

export function ContinueSeriesEntry() {
  useEffect(() => {
    let animationFrameId = 0;

    const scheduleRefresh = () => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(refreshContinueSeriesActions);
    };

    scheduleRefresh();
    window.addEventListener("storage", scheduleRefresh);
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("storage", scheduleRefresh);
      observer.disconnect();
    };
  }, []);

  return null;
}

function refreshContinueSeriesActions() {
  const savedStories = readSavedStories();
  attachSavedStoryActions(savedStories);
  attachGeneratedStoryAction(savedStories);
}

function attachSavedStoryActions(savedStories: SavedStorySnapshot[]) {
  const savedStoriesSection = findSectionByHeading("Saved Stories");
  if (!savedStoriesSection || savedStories.length === 0) return;

  const articles = Array.from(savedStoriesSection.querySelectorAll("article"));
  articles.forEach((article) => {
    if (article.querySelector(`[${CONTINUE_BUTTON_ATTRIBUTE}]`)) return;
    const title = article.querySelector("h3")?.textContent?.trim();
    const savedStory = savedStories.find((story) => story.title === title);
    if (!savedStory?.story) return;
    const actionRow = article.querySelector("div.mt-3.flex.flex-wrap.gap-2");
    if (!actionRow) return;
    actionRow.appendChild(createContinueButton(savedStory));
  });
}

function attachGeneratedStoryAction(savedStories: SavedStorySnapshot[]) {
  const generatedStorySection = findSectionByEyebrow("Generated Story");
  if (!generatedStorySection) return;

  const storyText = generatedStorySection.querySelector("article")?.textContent?.trim();
  if (!storyText) return;

  const title = createStoryTitle(storyText);
  const matchingSavedStory = savedStories.find((story) => story.story === storyText || story.title === title);
  const story = matchingSavedStory ?? { title, story: storyText };
  const actionRow = generatedStorySection.querySelector("div.flex.flex-wrap.gap-2");
  if (actionRow && !actionRow.querySelector(`[${CONTINUE_BUTTON_ATTRIBUTE}]`)) {
    actionRow.insertBefore(createContinueButton(story), actionRow.firstChild?.nextSibling ?? null);
  }

  attachGeneratedStoryPanel(generatedStorySection, story);
}

function attachGeneratedStoryPanel(generatedStorySection: HTMLElement, story: SavedStorySnapshot) {
  if (generatedStorySection.querySelector(`#${GENERATED_STORY_PANEL_ID}`) || !story.story) return;

  const storyArticle = generatedStorySection.querySelector("article");
  if (!storyArticle) return;

  const panel = document.createElement("section");
  panel.id = GENERATED_STORY_PANEL_ID;
  panel.className = "mt-6 rounded-md border border-brass/30 bg-paper/90 p-4 shadow-soft";

  const header = document.createElement("div");
  header.className = "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between";

  const copy = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "text-xs font-semibold uppercase tracking-[0.18em] text-brass";
  eyebrow.textContent = "Continue Series";
  const heading = document.createElement("h3");
  heading.className = "mt-2 text-xl font-semibold text-ink";
  heading.textContent = "Ready for the next episode?";
  const context = document.createElement("p");
  context.className = "mt-2 max-w-3xl text-sm leading-6 text-ink/70";
  context.textContent = `Last story context: ${summarizeStoryContext(story, 220)}`;
  copy.append(eyebrow, heading, context);

  const primaryButton = createContinueButton(story, "Generate next episode");
  primaryButton.className = "rounded-md bg-ink px-4 py-3 text-sm font-semibold text-paper transition hover:bg-ink/90";
  header.append(copy, primaryButton);

  const suggestionLabel = document.createElement("p");
  suggestionLabel.className = "mt-4 text-sm font-semibold text-ink";
  suggestionLabel.textContent = "Suggested next-episode directions";

  const suggestions = document.createElement("div");
  suggestions.className = "mt-3 grid gap-2 md:grid-cols-3";
  buildNextEpisodeDirections(story).forEach((direction) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "rounded-md border border-ink/10 bg-white/75 px-3 py-3 text-left text-sm leading-6 text-ink transition hover:border-brass hover:bg-white";
    button.textContent = direction;
    button.addEventListener("click", () => prepareContinuation(story, direction));
    suggestions.appendChild(button);
  });

  panel.append(header, suggestionLabel, suggestions);
  storyArticle.insertAdjacentElement("afterend", panel);
}

function createContinueButton(story: SavedStorySnapshot, label = "Continue this series"): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.setAttribute(CONTINUE_BUTTON_ATTRIBUTE, "true");
  button.className = "rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-xs font-semibold text-brass transition hover:border-brass hover:bg-paper";
  button.addEventListener("click", () => prepareContinuation(story));
  return button;
}

function prepareContinuation(story: SavedStorySnapshot, direction?: string) {
  openAdvancedStoryControls();
  const textarea = findStorySparkTextarea();
  if (!textarea || !story.story) return;

  setTextareaValue(textarea, buildContinuationSpark(story, direction));
  textarea.focus();
  textarea.scrollIntoView({ behavior: "smooth", block: "center" });
  showContinuationNotice(story.title ?? "this story");
}

function buildContinuationSpark(story: SavedStorySnapshot, direction?: string): string {
  const title = story.title?.trim() || "the saved story";
  const context = summarizeStoryContext(story, 900);
  const nextDirection = direction ?? "continue from the consequences, unresolved emotional pressure, or changed world state left by the prior story. Introduce a fresh concrete event and make this episode stand on its own while preserving continuity.";
  return [
    `Follow-up episode: continue the series after "${title}".`,
    "Create a new episode that uses the saved story as continuity context. Do not rewrite or overwrite the existing story.",
    "Keep the user in control: treat this as a prepared Story Spark for review before generation.",
    `Prior story context: ${context}`,
    `Next episode instruction: ${nextDirection}`
  ].join("\n\n");
}

function buildNextEpisodeDirections(story: SavedStorySnapshot): string[] {
  const title = story.title?.trim() || "the last episode";
  const titleReference = title === "Generated Story" ? "the prior episode" : `"${title}"`;
  return [
    `Follow the biggest consequence from ${titleReference} into a fresh problem the cast cannot ignore.`,
    "Shift focus to the character most changed by the ending and test what they now believe.",
    "Reveal a new rule, cost, or secret in the world that turns the last ending into a new beginning."
  ];
}

function summarizeStoryContext(story: SavedStorySnapshot, maxLength: number): string {
  const metadata = [story.genrePreset, story.narrativeArchitecture, story.wordCount ? `${story.wordCount.toLocaleString()} words` : null, story.diagnosticsNotice]
    .filter(Boolean)
    .join("; ");
  const excerpt = truncateText(story.story ?? "", maxLength);
  return metadata ? `${metadata}. ${excerpt}` : excerpt;
}

function openAdvancedStoryControls() {
  const advancedControls = document.getElementById("advanced-story-controls");
  if (advancedControls instanceof HTMLDetailsElement) advancedControls.open = true;
}

function findStorySparkTextarea(): HTMLTextAreaElement | null {
  const labels = Array.from(document.querySelectorAll("label"));
  const label = labels.find((candidate) => candidate.textContent?.includes("Write your Story Spark"));
  return label?.querySelector("textarea") ?? null;
}

function showContinuationNotice(title: string) {
  document.getElementById(CONTINUATION_NOTICE_ID)?.remove();
  const textarea = findStorySparkTextarea();
  const section = textarea?.closest("section");
  if (!section) return;

  const notice = document.createElement("p");
  notice.id = CONTINUATION_NOTICE_ID;
  notice.className = "mt-3 rounded-md border border-brass/25 bg-paper/80 px-3 py-2 text-xs leading-5 text-ink/65";
  notice.textContent = `Story Spark prepared for a follow-up episode after ${title}. Review it, adjust anything you want, then generate when ready. The original saved story is unchanged.`;
  section.appendChild(notice);
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(textarea, value);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
}

function findSectionByHeading(headingText: string): HTMLElement | null {
  return Array.from(document.querySelectorAll("section")).find((section) => section.querySelector("h2")?.textContent?.trim() === headingText) as HTMLElement | undefined ?? null;
}

function findSectionByEyebrow(eyebrowText: string): HTMLElement | null {
  return Array.from(document.querySelectorAll("section")).find((section) => section.querySelector("p")?.textContent?.trim() === eyebrowText) as HTMLElement | undefined ?? null;
}

function readSavedStories(): SavedStorySnapshot[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_STORIES_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((story) => story && typeof story === "object" && typeof story.story === "string") : [];
  } catch {
    return [];
  }
}

function createStoryTitle(story: string): string {
  const firstLine = story.split(/\n+/).find((line) => line.trim())?.trim() ?? "Generated Story";
  const firstSentence = firstLine.split(/[.!?]/)[0]?.trim() || firstLine;
  return truncateText(firstSentence.replace(/^#+\s*/, ""), 72) || "Generated Story";
}

function truncateText(text: string, maxLength: number): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length <= maxLength ? compact : `${compact.slice(0, maxLength).replace(/[\s,.;:]+$/, "")}...`;
}
