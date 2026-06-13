"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { WORLD_TEMPLATES } from "@/lib/world-templates";
import type { WorldTemplate } from "@/lib/world-templates";

const INPUT_ARTIFACTS_STORAGE_KEY = "story-world-engine:input-artifacts:v1";
const WORLD_BIBLE_SECTION_TITLE = "World Bible";

type ApplyMode = "add" | "replace";

type InputArtifact = {
  id: string;
  type: string;
  content: string;
};

export function WorldTemplateLibrary() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [worldBibleSection, setWorldBibleSection] = useState<HTMLElement | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [actionsDisabled, setActionsDisabled] = useState(false);
  const selectedTemplate = useMemo(
    () => WORLD_TEMPLATES.find((template) => template.id === selectedId) ?? null,
    [selectedId]
  );

  useEffect(() => {
    const findWorldBibleSection = () => {
      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find((item) => item.textContent?.trim() === WORLD_BIBLE_SECTION_TITLE);
      const section = heading?.closest("section") as HTMLElement | null;
      if (!section) {
        return;
      }

      let target = document.getElementById("world-template-library");
      if (!target) {
        target = document.createElement("section");
        target.id = "world-template-library";
        section.insertAdjacentElement("afterend", target);
      }

      setWorldBibleSection(section);
      setPortalTarget(target);
      setActionsDisabled(Boolean(section.querySelector("input[type='file']")?.hasAttribute("disabled")));
    };

    findWorldBibleSection();
    const observer = new MutationObserver(findWorldBibleSection);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!portalTarget || !worldBibleSection) {
    return null;
  }

  return createPortal(
    <section className="rounded-md border border-ink/10 bg-white/70 p-4 shadow-soft">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-ink">World Templates</h2>
        <p className="text-sm leading-6 text-ink/65">
          Choose one static world bible template. Only applied templates become generation input.
        </p>
      </div>

      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Choose a world template</span>
        <select
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20"
          onChange={(event) => {
            setSelectedId(event.target.value);
            setShowDetails(false);
          }}
          value={selectedId}
        >
          <option value="">Select a world template</option>
          {WORLD_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.title}
            </option>
          ))}
        </select>
      </label>

      {selectedTemplate ? (
        <SelectedWorldPanel
          actionsDisabled={actionsDisabled}
          onApply={(mode) => applyWorldTemplate(worldBibleSection, selectedTemplate, mode)}
          onToggleDetails={() => setShowDetails((value) => !value)}
          showDetails={showDetails}
          template={selectedTemplate}
        />
      ) : (
        <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">
          Select a world to preview its core rule.
        </p>
      )}
    </section>,
    portalTarget
  );
}

function SelectedWorldPanel({
  actionsDisabled,
  onApply,
  onToggleDetails,
  showDetails,
  template
}: {
  actionsDisabled: boolean;
  onApply: (mode: ApplyMode) => void;
  onToggleDetails: () => void;
  showDetails: boolean;
  template: WorldTemplate;
}) {
  return (
    <article className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3">
      <h3 className="text-base font-semibold leading-6 text-ink">{template.title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/70">{template.shortDescription}</p>
      <dl className="mt-3 rounded-md bg-white/65 px-3 py-2">
        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Core Rule</dt>
        <dd className="mt-1 text-sm leading-6 text-ink/75">{template.coreRule}</dd>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onApply("add")}
          type="button"
        >
          Add to World Bible
        </button>
        <button
          className="rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-xs font-semibold text-brass transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onApply("replace")}
          type="button"
        >
          Replace World Bible
        </button>
        <button
          className="rounded-md border border-ink/15 bg-white/75 px-3 py-2 text-xs font-semibold text-ink transition hover:bg-paper"
          onClick={onToggleDetails}
          type="button"
        >
          {showDetails ? "Hide Details" : "View Details"}
        </button>
      </div>

      {showDetails ? (
        <dl className="mt-4 grid gap-2 text-sm text-ink/75">
          <DetailItem label="Full Text" value={template.fullWorldBibleText} />
          <DetailItem label="Best Characters" value={template.bestCharacters} />
          <DetailItem label="Story Pressure" value={template.storyPressure} />
          <DetailItem label="Sensory Palette" value={template.sensoryPalette} />
        </dl>
      ) : null}
    </article>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/65 px-3 py-2">
      <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{label}</dt>
      <dd className="mt-1 leading-6 text-ink/75">{value}</dd>
    </div>
  );
}

async function applyWorldTemplate(section: HTMLElement, template: WorldTemplate, mode: ApplyMode) {
  const templateText = formatWorldTemplateBible(template);
  const existingText = mode === "replace" ? "" : await readCurrentWorldBible(section);
  const nextText = existingText.trim() ? `${existingText.trim()}\n\n${templateText}` : templateText;
  const fileName = mode === "replace" ? `${template.id}.md` : `world-bible-with-${template.id}.md`;
  const input = section.querySelector("input[type='file']") as HTMLInputElement | null;

  if (!input) {
    return;
  }

  const file = new File([nextText], fileName, { type: "text/markdown" });
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  input.files = dataTransfer.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function readCurrentWorldBible(section: HTMLElement): Promise<string> {
  const selectedLibraryId = (section.querySelector("select") as HTMLSelectElement | null)?.value;
  const libraryContent = selectedLibraryId ? readSavedWorldBible(selectedLibraryId) : "";
  if (libraryContent) {
    return libraryContent;
  }

  const file = (section.querySelector("input[type='file']") as HTMLInputElement | null)?.files?.[0];
  if (file) {
    return file.text();
  }

  const fileLabel = section.querySelector("label span")?.textContent?.trim();
  if (fileLabel === "world.md") {
    try {
      const response = await fetch("/sample-content/world.md");
      return response.ok ? response.text() : "";
    } catch {
      return "";
    }
  }

  return "";
}

function readSavedWorldBible(artifactId: string): string {
  try {
    const raw = window.localStorage.getItem(INPUT_ARTIFACTS_STORAGE_KEY);
    const artifacts = raw ? (JSON.parse(raw) as InputArtifact[]) : [];
    const artifact = Array.isArray(artifacts)
      ? artifacts.find((item) => item.id === artifactId && item.type === "worldBible")
      : null;
    return artifact?.content ?? "";
  } catch {
    return "";
  }
}

function formatWorldTemplateBible(template: WorldTemplate): string {
  return `# ${template.title}

Short Description: ${template.shortDescription}

Core Rule: ${template.coreRule}

World Bible:
${template.fullWorldBibleText}

Best Characters: ${template.bestCharacters}

Story Pressure: ${template.storyPressure}

Sensory Palette: ${template.sensoryPalette}`;
}
