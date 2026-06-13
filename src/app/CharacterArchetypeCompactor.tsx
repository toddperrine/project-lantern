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
  const styles = PORTRAIT_STYLES[index % PORTRAIT_STYLES.length];

  return (
    <svg
      aria-label={`${name} portrait`}
      className="h-24 w-20 rounded-md border border-ink/10 bg-white/65"
      role="img"
      viewBox="0 0 80 96"
    >
      <rect fill="#f6f0e4" height="96" width="80" />
      <path d={styles.shoulders} fill="none" stroke="#3a3936" strokeLinecap="round" strokeWidth="2" />
      <path d={styles.neck} fill="none" stroke="#57534d" strokeLinecap="round" strokeWidth="1.6" />
      <ellipse cx="40" cy="38" fill="#f7f3eb" rx="15" ry="19" stroke="#33312e" strokeWidth="1.8" />
      <path d={styles.hair} fill="none" stroke="#2f2e2b" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      <path d={styles.feature} fill="none" stroke="#5f5b55" strokeLinecap="round" strokeWidth="1.4" />
      <path d="M32 39 Q35 37 38 39 M43 39 Q46 37 49 39" fill="none" stroke="#33312e" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M37 49 Q40 51 44 49" fill="none" stroke="#33312e" strokeLinecap="round" strokeWidth="1.2" />
      <path d={styles.mark} fill="none" stroke="#77716a" strokeLinecap="round" strokeWidth="1" />
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
  { hair: "M26 34 Q29 16 43 18 Q58 21 55 42 M27 32 Q36 25 53 28", feature: "M30 55 Q24 58 21 65 M51 55 Q57 58 60 65", mark: "M24 18 Q28 14 33 15", neck: "M35 56 L34 66 M45 56 L46 66", shoulders: "M18 88 Q26 68 40 68 Q54 68 62 88" },
  { hair: "M25 36 Q31 18 43 19 Q53 21 57 35 M29 25 Q39 16 54 28", feature: "M25 62 Q40 58 56 62", mark: "M58 18 Q62 20 64 24", neck: "M34 57 L32 67 M46 57 L48 67", shoulders: "M17 88 Q25 70 40 69 Q55 70 63 88" },
  { hair: "M24 39 Q26 20 39 18 Q56 17 58 39 M24 39 Q41 30 58 39", feature: "M22 58 Q29 52 35 57 M46 57 Q53 52 59 58", mark: "M37 13 L42 9 L47 13", neck: "M35 57 L35 68 M45 57 L45 68", shoulders: "M16 88 Q28 71 40 70 Q52 71 64 88" },
  { hair: "M25 35 Q30 22 41 21 Q53 22 56 35 M28 28 Q40 34 54 28", feature: "M21 64 Q31 60 39 64 M41 64 Q50 60 59 64", mark: "M18 31 Q22 28 25 31", neck: "M34 56 L33 68 M46 56 L47 68", shoulders: "M15 88 Q24 72 40 70 Q56 72 65 88" },
  { hair: "M24 36 Q27 19 40 19 Q55 20 57 36 M29 22 Q35 27 31 34 M51 23 Q46 29 51 35", feature: "M23 61 L57 61 M31 56 Q40 59 49 56", mark: "M15 45 Q20 42 24 45", neck: "M35 57 L34 68 M45 57 L46 68", shoulders: "M18 88 Q26 70 40 70 Q54 70 62 88" },
  { hair: "M26 34 Q31 19 42 20 Q55 22 56 38 M27 34 Q38 20 56 31", feature: "M27 58 Q40 54 53 58 M35 64 Q40 66 46 64", mark: "M60 45 Q65 48 62 53", neck: "M35 56 L35 67 M45 56 L45 67", shoulders: "M17 88 Q27 71 40 70 Q53 71 63 88" },
  { hair: "M23 37 Q26 18 40 17 Q56 18 59 37 M25 28 Q40 35 57 28", feature: "M20 52 Q30 48 37 53 M43 53 Q50 48 60 52", mark: "M31 16 Q40 9 49 16", neck: "M35 57 L33 68 M45 57 L47 68", shoulders: "M15 88 Q25 69 40 69 Q55 69 65 88" },
  { hair: "M25 39 Q27 20 39 18 Q54 18 57 39 M25 39 Q32 46 39 38 M57 39 Q50 46 43 38", feature: "M21 60 Q31 55 39 59 M41 59 Q50 55 59 60", mark: "M17 72 Q25 68 32 72", neck: "M35 57 L34 69 M45 57 L46 69", shoulders: "M16 88 Q26 70 40 69 Q54 70 64 88" },
  { hair: "M24 35 Q29 17 41 17 Q56 20 58 37 M26 34 Q36 28 52 33", feature: "M23 64 Q31 58 38 62 M42 62 Q50 58 57 64", mark: "M20 21 Q24 17 29 19", neck: "M34 56 L32 68 M46 56 L48 68", shoulders: "M16 88 Q25 71 40 70 Q55 71 64 88" },
  { hair: "M26 34 Q32 20 42 20 Q53 21 56 34 M30 24 L27 37 M50 24 L56 37", feature: "M24 57 Q39 62 56 57 M35 51 Q40 53 45 51", mark: "M58 66 Q63 70 65 76", neck: "M35 56 L35 68 M45 56 L45 68", shoulders: "M15 88 Q25 70 40 69 Q55 70 65 88" }
] as const;
