import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ContinueSeriesEntry } from "./continue-series-entry";
import { MobileShellRuntime } from "./mobile-shell-runtime";
import { AuthProvider } from "@/lib/auth";
import { ProjectLanternShell } from "./project-lantern-shell";
import "./globals.css";
import "./mobile-shell.css";
import "./mobile-shell-overrides.css";
import "./mobile-shell-blockers.css";
import "./mobile-shell-interactions.css";
import "./reader-destinations.css";
import "./characters-card-layout.css";

export const metadata: Metadata = {
  title: "Bloodwick",
  description: "A premium horror storytelling platform for living stories and serialized dread."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider><ProjectLanternShell><Suspense>{children}</Suspense></ProjectLanternShell></AuthProvider>
        <MobileShellRuntime />
        <ContinueSeriesEntry />
      </body>
    </html>
  );
}
