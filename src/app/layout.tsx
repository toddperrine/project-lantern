import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ContinueSeriesEntry } from "./continue-series-entry";
import { MobileUxGuardrails } from "./mobile-ux-guardrails";
import { ProjectLanternShell } from "./project-lantern-shell";
import "./globals.css";
import "./mobile-ux.css";

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
        <MobileUxGuardrails />
        <ContinueSeriesEntry />
      </body>
    </html>
  );
}
