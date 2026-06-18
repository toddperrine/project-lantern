"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Create", href: "/?view=create", isPlainLink: true },
  { label: "Story Library", href: "/stories" },
  { label: "Characters/Cast", href: "/characters" },
  { label: "Worlds", href: "/worlds" }
];

const NAV_SELECTED_CLASS = "shrink-0 whitespace-nowrap rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-sm font-semibold text-primary-dark transition";
const NAV_DEFAULT_CLASS = "shrink-0 whitespace-nowrap rounded-md border border-warm-paper/10 bg-deep-navy px-3 py-2 text-sm font-semibold text-muted-dark transition hover:border-aged-brass hover:text-primary-light";

export function ProjectLanternNav() {
  const pathname = usePathname() || "/";

  return (
    <nav aria-label="Project Lantern" className="max-w-full min-w-0 overflow-x-auto pb-1 md:pb-0">
      <div className="flex w-max max-w-none gap-2 pr-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : !item.isPlainLink && pathname.startsWith(item.href);

          if (item.isPlainLink) {
            return <a className={isActive ? NAV_SELECTED_CLASS : NAV_DEFAULT_CLASS} href={item.href} key={item.href}>{item.label}</a>;
          }

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
