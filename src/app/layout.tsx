import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ContinueSeriesEntry } from "./continue-series-entry";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story World Engine",
  description: "Generate canon-aware short stories from a local storyworld, cast, and story spark."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ContinueSeriesEntry />
      </body>
    </html>
  );
}
