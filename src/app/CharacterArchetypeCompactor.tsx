"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CHARACTER_ARCHETYPE_PRESETS } from "@/lib/character-archetypes";
import type { CharacterArchetypePreset } from "@/lib/character-archetypes";

type ApplyMode = "add" | "replace";

const ORIGINAL_SECTION_TITLE = "Character Archetypes";
const CAST_SECTION_TITLE = "Cast";
const LEGACY_CAST_SECTION_TITLE = "Character Profiles";

export function CharacterArchetypeCompactor() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [originalSection, setOriginalSection] = useState<HTMLElement | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [actionsDisabled, setActionsDisabled] = useState(false);
  const originalSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const syncActionDisabled = (section: HTMLElement) => {
      const firstAction = section.querySelector("button") as HTMLButtonElement | null;
      const nextDisabled = Boolean(firstAction?.disabled);
      setActionsDisabled((current) => (current === nextDisabled ? current : nextDisabled));
    };

    const findOriginalSection = (): HTMLElement | null => {
      const headings = Array.from(document.querySelectorAll("h2"));
      const heading = headings.find((item) => item.textContent?.trim() === ORIGINAL_SECTION_TITLE);
      const section = heading?.closest("section") as HTMLElement | null;
      if (!section || section.dataset.compactedCharacterArchetypes === "true") {
        return null;
      }

      section.dataset.originalCharacterArchetypes = "true";
      if (section.style.display !== "none") {
        section.style.display = "none";
      }
      if (section.getAttribute("aria-hidden") !== "true") {
        section.setAttribute("aria-hidden", "true");
      }

      const castSection = findSectionByTitle(CAST_SECTION_TITLE) ?? findSectionByTitle(LEGACY_CAST_SECTION_TITLE);
      let target = document.getElementById("compact-character-archetype-library");
      if (!target) {
        target = document.createElement("div");
        target.id = "compact-character-archetype-library";
        const targetParent = castSection ?? section;
        targetParent.firstElementChild?.insertAdjacentElement("afterend", target);
      }

      if (originalSectionRef.current !== section) {
        originalSectionRef.current = section;
        setOriginalSection(section);
      }
      setPortalTarget((current) => (current === target ? current : target));
      syncActionDisabled(section);
      return section;
    };

    let sectionObserver: MutationObserver | null = null;
    const observeSection = (section: HTMLElement) => {
      sectionObserver?.disconnect();
      sectionObserver = new MutationObserver(() => syncActionDisabled(section));
      sectionObserver.observe(section, { attributes: true, attributeFilter: ["disabled"], subtree: true });
    };

    const initialSection = findOriginalSection();
    if (initialSection) {
      observeSection(initialSection);
      return () => sectionObserver?.disconnect();
    }

    const bodyObserver = new MutationObserver(() => {
      const section = findOriginalSection();
      if (section) {
        observeSection(section);
        bodyObserver.disconnect();
      }
    });

    bodyObserver.observe(document.body, { childList: true, subtree: true });
    return () => {
      bodyObserver.disconnect();
      sectionObserver?.disconnect();
    };
  }, []);

  const selectedPreset = useMemo(
    () => CHARACTER_ARCHETYPE_PRESETS.find((preset) => preset.name === selectedName) ?? null,
    [selectedName]
  );

  if (!portalTarget || !originalSection) {
    return null;
  }

  return createPortal(
    <div
      className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3"
      data-compacted-character-archetypes="true"
    >
      <label className="mt-4 flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink">Choose a character archetype</span>
        <select
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-brass focus:ring-2 focus:ring-brass/20"
          onChange={(event) => {
            setSelectedName(event.target.value);
            setShowDetails(false);
          }}
          value={selectedName}
        >
          <option value="">Select an archetype</option>
          {CHARACTER_ARCHETYPE_PRESETS.map((preset) => (
            <option key={preset.name} value={preset.name}>
              {formatArchetypeOption(preset)}
            </option>
          ))}
        </select>
      </label>

      {selectedPreset ? (
        <SelectedCharacterPanel
          actionsDisabled={actionsDisabled}
          onApply={(mode) => applyOriginalPresetAction(originalSection, selectedPreset, mode)}
          onToggleDetails={() => setShowDetails((value) => !value)}
          preset={selectedPreset}
          showDetails={showDetails}
        />
      ) : (
        <p className="mt-4 rounded-md bg-paper/80 px-3 py-2 text-sm text-ink/60">
          Select a character to preview the compact card.
        </p>
      )}
    </div>,
    portalTarget
  );
}

function SelectedCharacterPanel({
  actionsDisabled,
  onApply,
  onToggleDetails,
  preset,
  showDetails
}: {
  actionsDisabled: boolean;
  onApply: (mode: ApplyMode) => void;
  onToggleDetails: () => void;
  preset: CharacterArchetypePreset;
  showDetails: boolean;
}) {
  return (
    <article className="mt-4 rounded-md border border-ink/10 bg-paper/80 p-3">
      <div className="grid gap-3 sm:grid-cols-[84px_1fr]">
        <PencilPortrait name={preset.name} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-6 text-ink">{preset.name}</h3>
          <p className="mt-1 text-sm font-semibold text-brass">{preset.archetype}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">{preset.function}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-md bg-ink px-3 py-2 text-xs font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onApply("add")}
          type="button"
        >
          Add to Cast
        </button>
        <button
          className="rounded-md border border-brass/40 bg-white/75 px-3 py-2 text-xs font-semibold text-brass transition hover:border-brass hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          disabled={actionsDisabled}
          onClick={() => onApply("replace")}
          type="button"
        >
          Replace Cast
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
          <DetailItem label="Enneagram" value={preset.enneagram} />
          <DetailItem label="Core Desire" value={preset.coreDesire} />
          <DetailItem label="Core Fear" value={preset.coreFear} />
          <DetailItem label="Backstory" value={preset.backstory} />
          <DetailItem label="Conflict Engine" value={preset.conflictEngine} />
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

function findSectionByTitle(title: string): HTMLElement | null {
  const headings = Array.from(document.querySelectorAll("h2"));
  const heading = headings.find((item) => item.textContent?.trim() === title);
  return heading?.closest("section") as HTMLElement | null;
}

function PencilPortrait({ name }: { name: string }) {
  const index = Math.max(0, CHARACTER_ARCHETYPE_PRESETS.findIndex((preset) => preset.name === name));
  const portrait = PORTRAIT_STYLES[index % PORTRAIT_STYLES.length];

  return (
    <svg
      aria-label={`${name} portrait`}
      className="h-24 w-20 rounded-md border border-ink/10 bg-white/60"
      role="img"
      viewBox="0 0 80 96"
    >
      <g fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round">
        <path d={portrait.contour} strokeWidth="2" />
        <path d={portrait.hair} strokeWidth="1.9" />
        <path d={portrait.face} strokeWidth="1.45" />
        <path d={portrait.shoulders} strokeWidth="1.8" />
        <path d={portrait.detail} strokeWidth="1.15" />
      </g>
    </svg>
  );
}

function applyOriginalPresetAction(section: HTMLElement, preset: CharacterArchetypePreset, mode: ApplyMode) {
  const article = Array.from(section.querySelectorAll("article")).find((candidate) =>
    candidate.textContent?.includes(preset.name)
  );
  const buttonText = mode === "add" ? "Add to Character Profiles" : "Replace Character Profiles";
  const button = Array.from(article?.querySelectorAll("button") ?? []).find(
    (candidate) => candidate.textContent?.trim() === buttonText
  ) as HTMLButtonElement | undefined;

  button?.click();
}

function formatArchetypeOption(preset: CharacterArchetypePreset): string {
  return `${preset.name} — ${preset.archetype.replace(/^The\s+/i, "")}`;
}

const PORTRAIT_STYLES = [
  {
    contour: "M38 19 Q27 21 25 34 Q24 48 32 56 Q39 63 49 58 Q58 52 57 37 Q56 24 45 20 Q41 18 38 19",
    hair: "M26 34 Q33 20 45 22 Q55 25 56 39 M27 31 Q39 27 53 32",
    face: "M32 39 Q34 37 36 39 M44 39 Q47 37 49 39 M41 40 Q39 45 40 48 M36 53 Q41 56 47 52",
    shoulders: "M22 87 Q28 70 40 68 Q52 70 60 87",
    detail: "M26 58 Q21 65 18 73 M54 58 Q60 65 63 73"
  },
  {
    contour: "M41 18 Q29 19 26 31 Q23 45 29 55 Q35 65 47 61 Q58 57 59 42 Q60 27 50 21 Q46 18 41 18",
    hair: "M27 33 Q31 22 43 20 Q53 21 58 33 M30 25 Q40 16 54 27",
    face: "M33 38 Q36 36 38 38 M45 38 Q48 36 50 38 M42 40 Q43 45 40 49 M35 54 Q42 52 50 55",
    shoulders: "M19 88 Q27 72 40 70 Q54 71 63 88",
    detail: "M31 60 Q27 65 25 72 M51 60 Q55 66 56 73"
  },
  {
    contour: "M39 17 Q28 19 25 35 Q23 51 34 59 Q44 66 54 56 Q61 49 58 34 Q55 19 43 17 Q41 16 39 17",
    hair: "M24 38 Q26 22 39 18 Q53 17 58 38 M25 39 Q41 29 58 38",
    face: "M32 40 Q35 38 37 40 M45 40 Q48 38 50 40 M41 41 Q39 46 42 49 M35 54 Q43 58 50 53",
    shoulders: "M17 87 Q29 72 40 70 Q52 72 64 87",
    detail: "M39 13 L42 9 L46 14 M56 55 Q60 60 61 67"
  },
  {
    contour: "M40 20 Q30 20 27 33 Q24 47 30 55 Q37 64 49 60 Q59 56 58 41 Q57 27 48 22 Q44 20 40 20",
    hair: "M27 34 Q31 23 42 22 Q52 22 57 34 M29 29 Q40 35 54 29",
    face: "M33 40 Q35 39 37 40 M44 40 Q47 39 49 40 M40 42 Q42 46 39 50 M35 55 Q41 53 47 55",
    shoulders: "M16 88 Q25 72 40 70 Q55 72 65 88",
    detail: "M20 34 Q24 31 27 34 M51 58 Q56 62 59 68"
  },
  {
    contour: "M40 18 Q29 20 25 35 Q23 47 30 57 Q37 66 49 61 Q59 57 59 42 Q58 27 48 20 Q44 18 40 18",
    hair: "M25 36 Q27 20 40 19 Q55 20 58 36 M31 22 Q35 29 31 35 M51 23 Q47 30 52 36",
    face: "M32 39 Q35 38 37 39 M44 39 Q48 38 50 39 M41 41 Q38 46 40 49 M34 55 L50 55",
    shoulders: "M19 88 Q27 71 40 70 Q54 71 61 88",
    detail: "M18 46 Q22 43 25 46 M56 46 Q60 43 63 47"
  },
  {
    contour: "M41 19 Q30 20 27 33 Q25 49 33 57 Q41 64 52 58 Q60 52 57 36 Q54 22 45 20 Q43 19 41 19",
    hair: "M27 34 Q32 20 43 21 Q55 23 56 38 M28 34 Q39 21 56 31",
    face: "M33 39 Q36 38 38 39 M45 39 Q48 38 50 39 M42 41 Q41 46 43 49 M36 55 Q42 58 49 54",
    shoulders: "M18 87 Q28 71 40 70 Q53 71 62 87",
    detail: "M61 45 Q66 49 62 54 M30 60 Q26 66 24 73"
  },
  {
    contour: "M39 17 Q27 18 24 33 Q22 48 31 57 Q39 65 51 59 Q60 54 59 39 Q57 22 44 18 Q42 17 39 17",
    hair: "M23 37 Q26 19 40 17 Q56 18 59 37 M25 28 Q41 36 58 28",
    face: "M31 39 Q34 37 37 39 M45 39 Q49 37 52 39 M41 40 Q40 46 43 49 M35 54 Q42 52 49 54",
    shoulders: "M15 88 Q25 69 40 69 Q55 69 65 88",
    detail: "M31 15 Q40 9 50 16 M21 53 Q27 49 35 53"
  },
  {
    contour: "M40 18 Q29 19 25 34 Q22 49 32 58 Q41 66 51 58 Q60 50 57 35 Q54 20 43 18 Q41 17 40 18",
    hair: "M25 39 Q27 20 39 18 Q54 18 57 39 M25 39 Q32 46 39 38 M57 39 Q50 46 43 38",
    face: "M32 41 Q35 39 37 41 M44 41 Q47 39 50 41 M41 43 Q39 48 42 51 M36 56 Q42 59 48 55",
    shoulders: "M16 88 Q26 70 40 69 Q54 70 64 88",
    detail: "M18 72 Q25 68 32 72 M52 59 Q57 65 58 72"
  },
  {
    contour: "M40 17 Q29 18 25 33 Q22 48 31 58 Q40 67 52 59 Q61 52 58 36 Q55 20 43 18 Q41 17 40 17",
    hair: "M24 35 Q29 17 41 17 Q56 20 58 37 M26 34 Q36 28 52 33",
    face: "M32 39 Q35 37 37 39 M45 39 Q48 37 50 39 M41 40 Q38 46 41 50 M34 56 Q42 52 50 57",
    shoulders: "M16 88 Q25 71 40 70 Q55 71 64 88",
    detail: "M20 21 Q24 17 29 19 M24 60 Q21 66 20 73"
  },
  {
    contour: "M41 19 Q30 20 27 34 Q25 48 32 57 Q39 65 51 60 Q60 56 58 40 Q56 25 47 21 Q44 19 41 19",
    hair: "M26 34 Q32 20 42 20 Q53 21 56 34 M30 24 L27 37 M50 24 L56 37",
    face: "M33 39 Q36 38 38 39 M45 39 Q48 38 50 39 M42 41 Q44 46 41 50 M34 54 Q42 60 51 54",
    shoulders: "M15 88 Q25 70 40 69 Q55 70 65 88",
    detail: "M58 66 Q63 70 65 76 M30 58 Q26 63 24 70"
  }
] as const;
