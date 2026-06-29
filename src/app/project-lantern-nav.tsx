"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/", view: "home" },
  { label: "Story Library", href: "/?view=library", view: "library" },
  { label: "Characters", href: "/?view=characters", view: "characters" },
  { label: "Worlds", href: "/?view=worlds", view: "worlds" },
  { label: "Create", href: "/?view=create", view: "create" },
  { label: "Account", href: "/?view=account", view: "account" }
];

const NAV_SELECTED_CLASS = "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-center text-sm font-semibold leading-5 text-primary-dark transition sm:basis-auto sm:flex-none";
const NAV_DEFAULT_CLASS = "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-warm-paper/10 bg-deep-navy px-3 py-2 text-center text-sm font-semibold leading-5 text-muted-dark transition hover:border-aged-brass hover:text-primary-light sm:basis-auto sm:flex-none";

export function ProjectLanternNav() {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "home";

  return (
    <nav aria-label="Project Lantern" className="w-full min-w-0 md:w-auto">
      <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
        {NAV_ITEMS.map((item) => {
          const isActive = item.view === activeView;

          return (
            <Link aria-current={isActive ? "page" : undefined} className={isActive ? NAV_SELECTED_CLASS : NAV_DEFAULT_CLASS} href={item.href} key={item.href}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
