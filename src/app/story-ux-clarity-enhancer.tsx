"use client";

import { useEffect, type ReactNode } from "react";
import { WORLD_TEMPLATES } from "@/lib/world-templates";

type CurrentStoryworldEntry = { title: string; coreRule: string };

const CURRENT_STORYWORLD_PANEL = "data-current-storyworld-panel";
const GENERATION_DETAILS_ENHANCED = "data-generation-details-enhanced";
const SUMMARY_LABELS = new Set(["Word count", "Generator source", "Generation duration", "App version", "Build environment"]);

export function StoryUxClarityEnhancer({ children }: { children: ReactNode }) {
  useEffect(() => {
    let currentStoryworld: CurrentStoryworldEntry[] = [];

    function setCurrentStoryworld(entries: CurrentStoryworldEntry[]) {
      currentStoryworld = entries;
      syncCurrentStoryworldPanel(currentStoryworld);
    }

    function handleClick(event: MouseEvent) {
      const button = (event.target as HTMLElement | null)?.closest("button");
      if (!button) return;

      const label = button.textContent?.trim();
      if (label === "Clear current inputs") {
        window.setTimeout(() => setCurrentStoryworld([]), 0);
        return;
      }

      if (label === "Load Sample World") {
        window.setTimeout(() => setCurrentStoryworld([{ title: "Sample Storyworld", coreRule: "Sample Storyworld content loaded. This Storyworld text will be sent to generation." }]), 800);
        return;
      }

      if (label !== "Use this Storyworld" && label !== "Add to Storyworld") return;

      const section = findSectionByTitle("Storyworld");
      if (!section?.contains(button)) return;

      const article = button.closest("article");
      const selectedTemplate = WORLD_TEMPLATES.find((template) => article?.textContent?.includes(template.title));
      if (!selectedTemplate) return;

      const entry = { title: selectedTemplate.title, coreRule: selectedTemplate.coreRule };
      if (label === "Use this Storyworld") {
        setCurrentStoryworld([entry]);
        return;
      }

      setCurrentStoryworld([...currentStoryworld.filter((item) => item.title !== entry.title), entry]);
    }

    function handleChange(event: Event) {
      const target = event.target as HTMLInputElement | HTMLSelectElement | null;
      const section = findSectionByTitle("Storyworld");
      if (!target || !section?.contains(target)) return;

      if (target instanceof HTMLInputElement && target.type === "file" && target.files?.[0]) {
        const fileName = target.files[0].name;
        window.setTimeout(() => setCurrentStoryworld([{ title: fileName, coreRule: "Custom Storyworld content loaded. This Storyworld text will be sent to generation." }]), 0);
      }

      if (target instanceof HTMLSelectElement && target.closest("label")?.textContent?.includes("Choose from local library")) {
        if (!target.value) {
          window.setTimeout(() => setCurrentStoryworld([]), 0);
          return;
        }
        const selectedName = target.selectedOptions[0]?.textContent?.replace(/\s+\([\d,]+\s+chars\)$/, "") ?? "Local library Storyworld";
        window.setTimeout(() => setCurrentStoryworld([{ title: selectedName, coreRule: "Library Storyworld content loaded. This Storyworld text will be sent to generation." }]), 0);
      }
    }

    function syncAll() {
      syncCurrentStoryworldPanel(currentStoryworld);
      enhanceGenerationDetails();
    }

    document.addEventListener("click", handleClick, true);
    document.addEventListener("change", handleChange, true);
    const observer = new MutationObserver(syncAll);
    observer.observe(document.body, { childList: true, subtree: true });
    syncAll();

    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("change", handleChange, true);
      observer.disconnect();
    };
  }, []);

  return <>{children}</>;
}

function syncCurrentStoryworldPanel(entries: CurrentStoryworldEntry[]) {
  const storyworldSection = findSectionByTitle("Storyworld");
  if (!storyworldSection) return;

  let panel = storyworldSection.querySelector(`[${CURRENT_STORYWORLD_PANEL}]`) as HTMLElement | null;
  if (!panel) {
    panel = document.createElement("section");
    panel.setAttribute(CURRENT_STORYWORLD_PANEL, "true");
    panel.className = "mt-4 rounded-md border border-ink/10 bg-paper/80 p-3";
    const uploadBlock = findDescendantByText(storyworldSection, "h3", "Upload your own Storyworld")?.closest("div");
    storyworldSection.insertBefore(panel, uploadBlock ?? null);
  }

  panel.replaceChildren();
  const heading = document.createElement("h3");
  heading.className = "text-sm font-semibold text-ink";
  heading.textContent = "Current Storyworld";
  panel.append(heading);

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "mt-3 rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/60";
    empty.textContent = "No Storyworld added yet.";
    panel.append(empty);
    return;
  }

  const list = document.createElement("ul");
  list.className = "mt-3 grid gap-2";
  for (const entry of entries) {
    const item = document.createElement("li");
    item.className = "rounded-md bg-white/65 px-3 py-2 text-sm leading-6 text-ink/75";
    const title = document.createElement("span");
    title.className = "font-semibold text-ink";
    title.textContent = entry.title;
    const rule = document.createElement("span");
    rule.className = "block text-xs leading-5 text-ink/55";
    rule.textContent = entry.coreRule;
    item.append(title, rule);
    list.append(item);
  }
  panel.append(list);
}

function enhanceGenerationDetails() {
  const outputSection = findGeneratedStorySection();
  if (!outputSection || outputSection.hasAttribute(GENERATION_DETAILS_ENHANCED)) return;

  const metadataList = Array.from(outputSection.querySelectorAll("dl")).find((list) => getMetadataItems(list).some((item) => item.label === "Word count"));
  if (!metadataList) return;

  const items = getMetadataItems(metadataList);
  const wordCount = items.find((item) => item.label === "Word count")?.value ?? "Unknown";
  const source = items.find((item) => item.label === "Generator source")?.value ?? "Unknown";
  const duration = items.find((item) => item.label === "Generation duration")?.value ?? "None";
  const version = items.find((item) => item.label === "App version")?.value ?? "unknown";
  const environment = items.find((item) => item.label === "Build environment")?.value ?? "development";
  const underTarget = items.find((item) => item.label === "Under target notice")?.value;

  const summary = document.createElement("dl");
  summary.className = "grid gap-2 text-sm text-ink/70 sm:grid-cols-2 lg:grid-cols-4";
  appendMetadataItem(summary, "Word count", wordCount);
  appendMetadataItem(summary, "Generator source", source);
  appendMetadataItem(summary, "Generation duration", duration);
  appendMetadataItem(summary, "App version / environment", `${version} / ${environment}`);

  const details = document.createElement("details");
  details.className = "rounded-md border border-ink/10 bg-paper/70 p-3";
  const detailsSummary = document.createElement("summary");
  detailsSummary.className = "cursor-pointer text-sm font-semibold text-ink";
  detailsSummary.textContent = "Generation Details";
  const detailList = document.createElement("dl");
  detailList.className = "mt-3 grid gap-2 text-sm text-ink/70 sm:grid-cols-2 lg:grid-cols-3";
  for (const item of items.filter((candidate) => !SUMMARY_LABELS.has(candidate.label))) {
    appendMetadataItem(detailList, item.label, item.value);
  }
  details.append(detailsSummary, detailList);

  metadataList.replaceWith(summary);
  if (underTarget && underTarget !== "None") {
    const warning = document.createElement("p");
    warning.className = "rounded-md border border-ember/30 bg-ember/10 p-3 text-sm leading-6 text-ember";
    warning.textContent = `Under-target warning: ${underTarget}`;
    summary.insertAdjacentElement("afterend", warning);
    warning.insertAdjacentElement("afterend", details);
  } else {
    summary.insertAdjacentElement("afterend", details);
  }

  outputSection.setAttribute(GENERATION_DETAILS_ENHANCED, "true");
}

function getMetadataItems(list: Element): { label: string; value: string }[] {
  return Array.from(list.children).map((item) => ({
    label: item.querySelector("dt")?.textContent?.trim() ?? "",
    value: item.querySelector("dd")?.textContent?.trim() ?? ""
  })).filter((item) => item.label);
}

function appendMetadataItem(list: HTMLElement, label: string, value: string) {
  const item = document.createElement("div");
  item.className = "rounded-md bg-paper/80 px-3 py-2";
  const term = document.createElement("dt");
  term.className = "text-xs font-semibold uppercase tracking-[0.14em] text-ink/45";
  term.textContent = label;
  const description = document.createElement("dd");
  description.className = "mt-1 break-words text-sm text-ink";
  description.textContent = value;
  item.append(term, description);
  list.append(item);
}

function findGeneratedStorySection(): HTMLElement | null {
  return Array.from(document.querySelectorAll("section")).find((section) => section.textContent?.includes("Generated Story") && section.textContent?.includes("Generator source")) as HTMLElement | null;
}

function findSectionByTitle(title: string): HTMLElement | null {
  const heading = Array.from(document.querySelectorAll("h2")).find((item) => item.textContent?.trim() === title);
  return heading?.closest("section") as HTMLElement | null;
}

function findDescendantByText(root: Element, selector: string, text: string): Element | null {
  return Array.from(root.querySelectorAll(selector)).find((item) => item.textContent?.trim() === text) ?? null;
}
