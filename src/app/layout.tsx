import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ContinueSeriesEntry } from "./continue-series-entry";
import { ProjectLanternShell } from "./project-lantern-shell";
import "./globals.css";

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
        <ProjectLanternShell>{children}</ProjectLanternShell>
        <ContinueSeriesEntry />
      </body>
    </html>
  );
}
