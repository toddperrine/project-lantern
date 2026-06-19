import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ContinueSeriesEntry } from "./continue-series-entry";
import { HomeIconSystem } from "./home-icon-system";
import { MobileShellRuntime } from "./mobile-shell-runtime";
import { ProjectLanternShell } from "./project-lantern-shell";
import "./globals.css";
import "./mobile-shell.css";
import "./mobile-shell-overrides.css";
import "./mobile-shell-blockers.css";
import "./mobile-shell-interactions.css";
import "./reader-destinations.css";
import "./home-icon-system.css";

export const metadata: Metadata = {
  title: "Project Lantern",
  description: "A personalized streaming home for Living Series, Episodes, and story worlds."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ProjectLanternShell><Suspense>{children}</Suspense></ProjectLanternShell>
        <MobileShellRuntime />
        <HomeIconSystem />
        <ContinueSeriesEntry />
      </body>
    </html>
  );
}
