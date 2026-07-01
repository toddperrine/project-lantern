"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";

const BLOODWICK_LORE = `Over the centuries, wick has meant the hidden thread that drinks fuel and feeds a flame, a village or dwelling place, something alive and quick with life, and, in older forms, something wicked, strange, or threatening.

BloodWick is the immortal, hungry black thread that catches fire. BloodWick is the place at the end of the road where every evil thing lurks and you are moments away from a painful death. BloodWick is a story’s wicked driving force, the thing that keeps you reading and needing more.

Welcome to BloodWick.`;

export function BloodwickHomeHero() {
  const [isLoreOpen, setIsLoreOpen] = useState(false);
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const loreParagraphs = BLOODWICK_LORE.split("\n\n");

  useEffect(() => {
    if (!isLoreOpen) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsLoreOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoreOpen]);

  return (
    <section className="bloodwick-home-hero" aria-label="Bloodwick">
      <Image
        src="/artwork/Welcome to BloodWick.png"
        alt="Welcome to BloodWick town artwork"
        className="bloodwick-home-hero-image"
        fill
        priority
        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 90vw, 1216px"
      />
      <button
        type="button"
        className="bloodwick-home-hero-lore-trigger"
        aria-label="Open BloodWick lore"
        onClick={() => setIsLoreOpen(true)}
      >
        <span aria-hidden="true">i</span>
      </button>

      {isLoreOpen ? (
        <div className="bloodwick-home-hero-lore-backdrop" onClick={() => setIsLoreOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="bloodwick-home-hero-lore-dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="bloodwick-home-hero-lore-kicker">BLOODWICK</p>
            <h2 id={titleId} className="bloodwick-home-hero-lore-title">
              Welcome to BloodWick
            </h2>
            <div className="bloodwick-home-hero-lore-body">
              {loreParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <button
              type="button"
              className="bloodwick-home-hero-lore-close"
              onClick={() => setIsLoreOpen(false)}
              ref={closeButtonRef}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
