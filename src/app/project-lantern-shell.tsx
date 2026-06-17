import type { ReactNode } from "react";
import { getBuildInfo } from "@/lib/build-info";
import { ProjectLanternNav } from "./project-lantern-nav";

const PREVIEW_MODES = ["Phone", "Tablet", "Full"] as const;

export function ProjectLanternShell({ children }: { children: ReactNode }) {
  const buildInfo = getBuildInfo();
  const versionLabel = `Version ${buildInfo.appVersion} | ${buildInfo.buildEnvironment} | ${buildInfo.gitBranch} | ${buildInfo.shortCommitSha}`;

  return (
    <div className="project-lantern-shell min-h-screen bg-night-ink text-primary-light md:bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.10),transparent_34%),linear-gradient(180deg,#0B1020_0%,#111827_46%,#0B1020_100%)]">
      <DevicePreviewModeStyles />
      <header className="sticky top-0 z-20 border-b border-lantern-gold/15 bg-night-ink/92 backdrop-blur">
        <div data-device-preview-header-inner className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-4 transition-[max-width,padding] duration-200 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-primary-light">Project Lantern</h1>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <p aria-label="Project Lantern build information" className="inline-flex max-w-full rounded-md border border-aged-brass/40 bg-deep-navy/80 px-2.5 py-1 text-xs font-semibold leading-5 text-sea-glass shadow-soft">
                {versionLabel}
              </p>
              <PreviewModeToggle />
            </div>
          </div>
          <ProjectLanternNav />
        </div>
      </header>

      <div data-device-preview-stage className="mx-auto w-full transition-[max-width,padding,margin] duration-200">
        <div data-device-preview-content className="mx-auto w-full max-w-7xl overflow-x-hidden px-5 py-6 transition-[max-width,padding] duration-200 md:px-8 md:py-8">
          {children}
        </div>
      </div>
      <DevicePreviewModeScript />
    </div>
  );
}

function PreviewModeToggle() {
  return (
    <div aria-label="Preview mode" className="inline-flex w-fit rounded-md border border-warm-paper/10 bg-deep-navy/80 p-1 shadow-soft" data-device-preview-toggle role="group">
      {PREVIEW_MODES.map((mode) => {
        const value = mode.toLowerCase();
        const isFull = mode === "Full";
        return (
          <button aria-pressed={isFull ? "true" : "false"} className={isFull ? "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition" : "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light"} data-device-preview-mode={value} key={mode} type="button">
            {mode}
          </button>
        );
      })}
    </div>
  );
}

function DevicePreviewModeStyles() {
  const css = `
[data-device-preview-content="phone"] {
  overflow-x: hidden;
}

[data-device-preview-content="phone"] .device-preview-stack {
  grid-template-columns: minmax(0, 1fr) !important;
}

[data-device-preview-content="phone"] .device-preview-stack > *,
[data-device-preview-content="phone"] .project-lantern-workspace,
[data-device-preview-content="phone"] .project-lantern-workspace * {
  min-width: 0;
}

[data-device-preview-content="phone"] h1,
[data-device-preview-content="phone"] h2,
[data-device-preview-content="phone"] h3,
[data-device-preview-content="phone"] p,
[data-device-preview-content="phone"] a,
[data-device-preview-content="phone"] button,
[data-device-preview-content="phone"] span,
[data-device-preview-content="phone"] textarea {
  overflow-wrap: anywhere;
}

[data-device-preview-content="phone"] a,
[data-device-preview-content="phone"] button,
[data-device-preview-content="phone"] textarea {
  max-width: 100%;
}

[data-device-preview-content="tablet"] .device-preview-tablet-stack {
  grid-template-columns: minmax(0, 1fr) !important;
}

[data-device-preview-content="tablet"] .device-preview-tablet-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
}

@media (min-width: 768px) {
  [data-device-preview-header-inner="phone"] {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  [data-device-preview-stage="phone"] {
    margin: 1.5rem auto 2.5rem;
    padding: 0.85rem;
    border: 1px solid rgba(246, 239, 226, 0.14);
    border-radius: 2rem;
    background: linear-gradient(180deg, rgba(246, 239, 226, 0.13), rgba(11, 16, 32, 0.86));
    box-shadow: 0 32px 90px rgba(0, 0, 0, 0.34);
  }

  [data-device-preview-stage="tablet"] {
    margin: 1.5rem auto 2.5rem;
    padding: 1rem;
    border: 1px solid rgba(246, 239, 226, 0.12);
    border-radius: 1.6rem;
    background: linear-gradient(180deg, rgba(167, 199, 186, 0.12), rgba(11, 16, 32, 0.78));
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  }

  [data-device-preview-content="phone"],
  [data-device-preview-content="tablet"] {
    border: 1px solid rgba(246, 239, 226, 0.12);
    background: #0B1020;
    box-shadow: inset 0 0 0 1px rgba(11, 16, 32, 0.45);
    scrollbar-gutter: stable;
  }

  [data-device-preview-content="phone"] {
    max-height: calc(100vh - 7rem);
    border-radius: 1.45rem;
    padding: 1rem;
    overflow-y: auto;
  }

  [data-device-preview-content="tablet"] {
    border-radius: 1.1rem;
    padding: 1.25rem;
  }
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function DevicePreviewModeScript() {
  const script = `
(() => {
  const storageKey = "projectLantern.devicePreviewMode.v1";
  const modes = {
    phone: { contentMaxWidth: "430px", stageMaxWidth: "486px", headerMaxWidth: "486px" },
    tablet: { contentMaxWidth: "820px", stageMaxWidth: "884px", headerMaxWidth: "884px" },
    full: { contentMaxWidth: "", stageMaxWidth: "", headerMaxWidth: "" }
  };
  const selectedClass = "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition";
  const defaultClass = "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light";

  function readMode() {
    try {
      const storedMode = window.localStorage.getItem(storageKey);
      return storedMode && modes[storedMode] ? storedMode : "full";
    } catch {
      return "full";
    }
  }

  function persistMode(mode) {
    try {
      window.localStorage.setItem(storageKey, mode);
    } catch {
    }
  }

  function applyMode(mode) {
    const selectedMode = modes[mode] ? mode : "full";
    const content = document.querySelector("[data-device-preview-content]");
    const stage = document.querySelector("[data-device-preview-stage]");
    const headerInner = document.querySelector("[data-device-preview-header-inner]");
    const buttons = Array.from(document.querySelectorAll("[data-device-preview-mode]"));
    const modeSettings = modes[selectedMode];

    if (content instanceof HTMLElement) {
      content.dataset.devicePreviewContent = selectedMode;
      content.style.maxWidth = modeSettings.contentMaxWidth;
      content.style.overflowX = selectedMode === "full" ? "" : "hidden";
    }

    if (stage instanceof HTMLElement) {
      stage.dataset.devicePreviewStage = selectedMode;
      stage.style.maxWidth = modeSettings.stageMaxWidth;
    }

    if (headerInner instanceof HTMLElement) {
      headerInner.dataset.devicePreviewHeaderInner = selectedMode;
      headerInner.style.maxWidth = modeSettings.headerMaxWidth;
    }

    buttons.forEach((button) => {
      if (!(button instanceof HTMLButtonElement)) return;
      const isSelected = button.dataset.devicePreviewMode === selectedMode;
      button.setAttribute("aria-pressed", isSelected ? "true" : "false");
      button.className = isSelected ? selectedClass : defaultClass;
    });

    persistMode(selectedMode);
  }

  Array.from(document.querySelectorAll("[data-device-preview-mode]")).forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener("click", () => applyMode(button.dataset.devicePreviewMode || "full"));
  });

  applyMode(readMode());
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
