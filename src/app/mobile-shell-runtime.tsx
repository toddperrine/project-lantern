"use client";

import { useEffect } from "react";

const MOBILE_QUERY = "(max-width: 767px)";
const NAV_ORDER = ["Home", "Story Library", "Characters", "Worlds", "Create"];
const TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/Characters\s*\/\s*Cast/g, "Characters"],
  [/\bCAST\b/g, "CHARACTERS"],
  [/\bCast\b/g, "Characters"],
  [/\bcast\b/g, "characters"],
  [/world, characters, spark/g, "world, characters, story idea"],
  [/Story Spark/g, "Story Idea"],
  [/-cast\.txt/g, "-characters.txt"]
];

function currentView() {
  return new URLSearchParams(window.location.search).get("view") ?? "home";
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function replaceText(value: string) {
  return TEXT_REPLACEMENTS.reduce((nextValue, [pattern, replacement]) => nextValue.replace(pattern, replacement), value);
}

function normalizeTextNodes(root: ParentNode) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  nodes.forEach((node) => {
    const nextValue = replaceText(node.nodeValue ?? "");
    if (nextValue !== node.nodeValue) node.nodeValue = nextValue;
  });
}

function normalizeAttributes(root: ParentNode) {
  Array.from(root.querySelectorAll<HTMLElement>("[aria-label], [placeholder], [title]")).forEach((element) => {
    ["aria-label", "placeholder", "title"].forEach((attribute) => {
      const value = element.getAttribute(attribute);
      if (!value) return;
      const nextValue = replaceText(value);
      if (nextValue !== value) element.setAttribute(attribute, nextValue);
    });
  });
}

function normalizeMobileNav() {
  const nav = document.querySelector<HTMLElement>('nav[aria-label="Mobile primary"]');
  const row = nav?.firstElementChild;
  if (!nav || !row) return;

  nav.dataset.mobileShellReady = "true";
  const buttons = Array.from(row.querySelectorAll<HTMLButtonElement>("button"));
  const byLabel = new Map<string, HTMLButtonElement>();

  buttons.forEach((button) => {
    const label = replaceText(cleanText(button.textContent ?? ""));
    button.textContent = label;
    byLabel.set(label, button);
  });

  NAV_ORDER.map((label) => byLabel.get(label)).filter((button): button is HTMLButtonElement => Boolean(button)).forEach((button) => row.appendChild(button));
}

function markActiveMobileView() {
  const main = document.querySelector<HTMLElement>(".project-lantern-shell main");
  if (!main) return;
  main.dataset.mobileActiveView = currentView();
}

function hideCrossRouteDemoMessages() {
  const view = currentView();
  Array.from(document.querySelectorAll<HTMLElement>(".project-lantern-shell main > section > div")).forEach((element) => {
    const text = cleanText(element.textContent ?? "");
    const isDemoStatus = /Demo story|Demo Story|demo story/.test(text);
    if (isDemoStatus && view !== "home") element.dataset.mobileHiddenStatus = "true";
    else delete element.dataset.mobileHiddenStatus;
  });
}

function applyMobileShell(mobileQuery: MediaQueryList) {
  if (!mobileQuery.matches) return;
  const root = document.querySelector(".project-lantern-shell");
  if (!root) return;

  normalizeTextNodes(root);
  normalizeAttributes(root);
  normalizeMobileNav();
  markActiveMobileView();
  hideCrossRouteDemoMessages();
}

export function MobileShellRuntime() {
  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY);
    let frame = 0;
    const apply = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => applyMobileShell(mobileQuery));
    };

    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });
    window.addEventListener("popstate", apply);

    if (typeof mobileQuery.addEventListener === "function") mobileQuery.addEventListener("change", apply);
    else if (typeof mobileQuery.addListener === "function") mobileQuery.addListener(apply);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", apply);
      if (typeof mobileQuery.removeEventListener === "function") mobileQuery.removeEventListener("change", apply);
      else if (typeof mobileQuery.removeListener === "function") mobileQuery.removeListener(apply);
    };
  }, []);

  return null;
}
