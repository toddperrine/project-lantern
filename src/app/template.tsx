"use client";

import type { ReactNode } from "react";
import { StoryUxClarityEnhancer } from "./story-ux-clarity-enhancer";

export default function Template({ children }: { children: ReactNode }) {
  return <StoryUxClarityEnhancer>{children}</StoryUxClarityEnhancer>;
}
