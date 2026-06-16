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
const CONTINUE_BUTTON_MARKER = "story-world-engine-continue-series";
const CONTINUATION_NOTICE_ID = "story-world-engine-continuation-notice";

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
    if (article.querySelector(`[data-${CONTINUE_BUTTON_MARKER}]`)) return;
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
  if (!generatedStorySection || generatedStorySection.querySelector(`[data-${CONTINUE_BUTTON_MARKER}]`)) return;

  const storyText = generatedStorySection.querySelector("article")?.textContent?.trim();
  if (!storyText) return;

  const title = createStoryTitle(storyText);
  const matchingSavedStory = savedStories.find((story) => story.story === storyText || story.title === title);
  const actionRow = generatedStorySection.querySelector("div.flex.flex-wrap.gap-2");
  if (!actionRow) return;

  actionRow.insertBefore(createContinueButton(matchingSavedStory ?? { title, story: storyText }), actionRow.firstChild?.nextSibling ?? null);
}

function createContinueButton(story: SavedStorySnapshot): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Continue Series";
  button.dataset[CONTINUE_BUTTON_MARKER] = "true";
  button.className = "rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-xs font-semibold text-brass transition hover:border-brass hover:bg-paper";
  button.addEventListener("click", () => prepareContinuation(story));
  return button;
}

function prepareContinuation(story: SavedStorySnapshot) {
  const textarea = findStorySparkTextarea();
  if (!textarea || !story.story) return;

  setTextareaValue(textarea, buildContinuationSpark(story));
  textarea.focus();
  textarea.scrollIntoView({ behavior: "smooth", block: "center" });
  showContinuationNotice(story.title ?? "this story");
}

function buildContinuationSpark(story: SavedStorySnapshot): string {
  const title = story.title?.trim() || "the saved story";
  const context = summarizeStoryContext(story);
  return [
    `Follow-up episode: continue the series after "${title}".`,
    "Create a new episode that uses the saved story as continuity context. Do not rewrite or overwrite the existing story.",
    "Keep the user in control: treat this as a prepared Story Spark for review before generation.",
    `Prior story context: ${context}`,
    "Next episode instruction: continue from the consequences, unresolved emotional pressure, or changed world state left by the prior story. Introduce a fresh concrete event and make this episode stand on its own while preserving continuity."
  ].join("\n\n");
}

function summarizeStoryContext(story: SavedStorySnapshot): string {
  const metadata = [story.genrePreset, story.narrativeArchitecture, story.wordCount ? `${story.wordCount.toLocaleString()} words` : null, story.diagnosticsNotice]
    .filter(Boolean)
    .join("; ");
  const excerpt = truncateText(story.story ?? "", 900);
  return metadata ? `${metadata}. ${excerpt}` : excerpt;
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
