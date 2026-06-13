"use client";

import { useEffect } from "react";

const SECTION_COPY = [
  {
    currentTitle: "World Bible",
    nextTitle: "Storyworld",
    subtitle: "Choose a world, add your own, or combine both.",
    uploadTitle: "Upload your own Storyworld"
  },
  {
    currentTitle: "Character Profiles",
    nextTitle: "Cast",
    subtitle: "Choose a character, antihero, witness, keeper, singer, repairer, or upload your own.",
    uploadTitle: "Upload your own Cast"
  },
  {
    currentTitle: "Story Seed",
    nextTitle: "Story Spark",
    subtitle: "The image, event, conflict, or question that starts the story.",
    uploadTitle: "Upload your own Story Spark"
  },
  {
    currentTitle: "Story Generation Rules / Narrative Constraints",
    nextTitle: "Craft Rules",
    subtitle: "Default craft rules are used automatically. Advanced users can customize them.",
    uploadTitle: "Upload your own Craft Rules"
  }
] as const;

const REQUIRED_GENERATION_SECTIONS = ["Storyworld", "Cast", "Story Spark"];

export function InputUiConsolidator() {
  useEffect(() => {
    const syncInputUi = () => {
      for (const sectionCopy of SECTION_COPY) {
        const section = findSection(sectionCopy.nextTitle) ?? findSection(sectionCopy.currentTitle);
        if (!section) continue;

        const heading = section.querySelector("h2");
        if (heading) heading.textContent = sectionCopy.nextTitle;

        const subtitle = section.querySelector("h2 + p");
        if (subtitle) subtitle.textContent = sectionCopy.subtitle;

        upsertUploadPrompt(section, sectionCopy.uploadTitle);
        renameLibraryLabel(section);
      }

      syncGenerateButton();
    };

    syncInputUi();

    const observer = new MutationObserver(syncInputUi);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["disabled"],
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

function upsertUploadPrompt(section: HTMLElement, uploadTitle: string) {
  let prompt = section.querySelector("[data-upload-prompt='true']") as HTMLElement | null;
  if (!prompt) {
    prompt = document.createElement("div");
    prompt.dataset.uploadPrompt = "true";
    prompt.className = "mt-4 rounded-md bg-paper/70 px-3 py-2";
    section.firstElementChild?.insertAdjacentElement("afterend", prompt);
  }

  prompt.innerHTML = "";

  const title = document.createElement("h3");
  title.className = "text-sm font-semibold text-ink";
  title.textContent = uploadTitle;

  const help = document.createElement("p");
  help.className = "mt-1 text-xs leading-5 text-ink/55";
  help.textContent = "Upload a .md or .txt file, or choose a saved local item.";

  prompt.append(title, help);
}

function renameLibraryLabel(section: HTMLElement) {
  const labels = Array.from(section.querySelectorAll("label"));
  const libraryLabel = labels.find((label) => label.textContent?.includes("Choose from library"));
  const labelText = libraryLabel?.querySelector("span");
  if (labelText) labelText.textContent = "Choose from local library";
}

function syncGenerateButton() {
  const generateButton = Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === "Generate Story"
  ) as HTMLButtonElement | undefined;

  if (!generateButton || !hasRequiredInputs()) {
    return;
  }

  generateButton.disabled = false;
  generateButton.removeAttribute("disabled");
}

function hasRequiredInputs(): boolean {
  return REQUIRED_GENERATION_SECTIONS.every((title) => {
    const section = findSection(title);
    return Boolean(section?.textContent?.includes("characters loaded"));
  });
}

function findSection(title: string): HTMLElement | null {
  const headings = Array.from(document.querySelectorAll("h2"));
  const heading = headings.find((item) => item.textContent?.trim() === title);
  return heading?.closest("section") as HTMLElement | null;
}
