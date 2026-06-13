import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CharacterArchetypeCompactor } from "./CharacterArchetypeCompactor";
import { InputUiConsolidator } from "./InputUiConsolidator";
import { WorldTemplateLibrary } from "./WorldTemplateLibrary";
import "./globals.css";

export const metadata: Metadata = {
  title: "Story World Engine",
  description: "Generate canon-aware short stories from a local world bible and character profiles."
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
        <InputUiConsolidator />
        <WorldTemplateLibrary />
        <CharacterArchetypeCompactor />
      </body>
    </html>
  );
}
