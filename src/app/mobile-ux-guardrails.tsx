"use client";

import { useEffect } from "react";

const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function replaceCastLabels(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || ["SCRIPT", "STYLE", "TEXTAREA", "OPTION"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return node.textContent?.includes("Cast") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    node.textContent = node.textContent?.replace(/Characters\s*\/\s*Cast/g, "Characters").replace(/\bCast\b/g, "Characters") ?? "";
  });
}

function normalizePrimaryNav() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Primary"]');
  const row = nav?.firstElementChild;
  if (!nav || !row) return;

  nav.dataset.mobileUx = "ready";
  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button"));
  const byLabel = new Map<string, HTMLButtonElement>();

  buttons.forEach((button) => {
    const label = cleanText(button.textContent ?? "");
    if (label === "Cast") button.textContent = "Characters";
    byLabel.set(cleanText(button.textContent ?? ""), button);
  });

  const orderedButtons = NAV_ORDER.map((label) => byLabel.get(label)).filter((button): button is HTMLButtonElement => Boolean(button));
  const currentOrder = buttons.map((button) => cleanText(button.textContent ?? "")).join("|");
  const nextOrder = orderedButtons.map((button) => cleanText(button.textContent ?? "")).join("|");

  if (currentOrder !== nextOrder || buttons.length !== orderedButtons.length) {
    orderedButtons.forEach((button) => row.appendChild(button));
  }
}

export function MobileUxGuardrails() {
  useEffect(() => {
    const apply = () => {
      normalizePrimaryNav();
      replaceCastLabels(document.body);
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
