import { Suspense, type ReactNode } from "react";
import { getBuildInfo } from "@/lib/build-info";
import { ProjectLanternNav } from "./project-lantern-nav";

const PREVIEW_MODES = ["Tablet", "Full"] as const;

export function ProjectLanternShell({ children }: { children: ReactNode }) {
  const buildInfo = getBuildInfo();

  return (
    <div className="project-lantern-shell min-h-screen overflow-x-hidden bg-[#fbf7ef] text-primary-dark md:bg-[radial-gradient(circle_at_top,rgba(217,164,65,0.10),transparent_34%),linear-gradient(180deg,#0B1020_0%,#111827_46%,#0B1020_100%)] md:text-primary-light">
      <DevicePreviewModeStyles />
      <header className="sticky top-0 z-20 hidden border-b border-lantern-gold/15 bg-night-ink/92 backdrop-blur md:block">
        <div data-device-preview-header-inner className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-4 px-4 py-5 transition-[max-width,padding] duration-200 sm:px-5 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:block">
            <h1 className="text-2xl font-semibold tracking-tight text-primary-light">Project Lantern</h1>
            <PreviewModeToggle />
          </div>
          <Suspense>
            <ProjectLanternNav />
          </Suspense>
        </div>
      </header>

      <div data-device-preview-stage className="mx-auto w-full transition-[max-width,padding,margin] duration-200">
        <div data-device-preview-content className="mx-auto w-full max-w-7xl overflow-x-hidden transition-[max-width,padding] duration-200 md:px-8 md:py-8">
          {children}
          <footer className="border-t border-warm-paper/10 px-4 py-5 text-center text-xs font-semibold text-muted-light md:mt-8 md:px-0 md:text-muted-dark">
            Version {buildInfo.appVersion}
          </footer>
        </div>
      </div>
      <DevicePreviewModeScript />
    </div>
  );
}

function PreviewModeToggle() {
  return (
    <div aria-label="Preview mode" className="hidden w-fit rounded-md border border-warm-paper/10 bg-deep-navy/80 p-1 shadow-soft md:inline-flex" data-device-preview-toggle role="group">
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
[data-device-preview-content="tablet"] .device-preview-tablet-stack {
  grid-template-columns: minmax(0, 1fr) !important;
}

[data-device-preview-content="tablet"] .device-preview-tablet-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr) !important;
}

@media (max-width: 767px) {
  [data-device-preview-toggle] {
    display: none !important;
  }
}

@media (min-width: 768px) {
  [data-device-preview-stage="tablet"] {
    margin: 1.5rem auto 2.5rem;
    padding: 1rem;
    border: 1px solid rgba(246, 239, 226, 0.12);
    border-radius: 1.6rem;
    background: linear-gradient(180deg, rgba(167, 199, 186, 0.12), rgba(11, 16, 32, 0.78));
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);
  }

  [data-device-preview-content="tablet"] {
    border: 1px solid rgba(246, 239, 226, 0.12);
    border-radius: 1.1rem;
    background: #0B1020;
    padding: 1.25rem;
    box-shadow: inset 0 0 0 1px rgba(11, 16, 32, 0.45);
    scrollbar-gutter: stable;
  }
}
`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

function DevicePreviewModeScript() {
  const script = `
(() => {
  const storageKey = "projectLantern.devicePreviewMode.v1";
  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const modes = {
    tablet: { contentMaxWidth: "820px", stageMaxWidth: "884px", headerMaxWidth: "884px" },
    full: { contentMaxWidth: "", stageMaxWidth: "", headerMaxWidth: "" }
  };
  const selectedClass = "rounded-sm bg-lantern-gold px-2.5 py-1 text-xs font-semibold text-primary-dark transition";
  const defaultClass = "rounded-sm px-2.5 py-1 text-xs font-semibold text-muted-dark transition hover:text-primary-light";

  function readMode() {
    if (mobileQuery.matches) return "full";

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
    const selectedMode = mobileQuery.matches || !modes[mode] ? "full" : mode;
    const content = document.querySelector("[data-device-preview-content]");
    const stage = document.querySelector("[data-device-preview-stage]");
    const headerInner = document.querySelector("[data-device-preview-header-inner]");
    const buttons = Array.from(document.querySelectorAll("[data-device-preview-mode]"));
    const modeSettings = modes[selectedMode];

    if (content instanceof HTMLElement) {
      content.dataset.devicePreviewContent = selectedMode;
      content.style.maxWidth = modeSettings.contentMaxWidth;
      content.style.overflowX = "hidden";
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

    if (!mobileQuery.matches) persistMode(selectedMode);
  }

  Array.from(document.querySelectorAll("[data-device-preview-mode]")).forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.addEventListener("click", () => applyMode(button.dataset.devicePreviewMode || "full"));
  });

  const refreshPreviewMode = () => applyMode(readMode());
  if (typeof mobileQuery.addEventListener === "function") {
    mobileQuery.addEventListener("change", refreshPreviewMode);
  } else if (typeof mobileQuery.addListener === "function") {
    mobileQuery.addListener(refreshPreviewMode);
  }
  applyMode(readMode());
})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
