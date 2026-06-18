"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Story Library", href: "/stories" },
  { label: "Worlds", href: "/worlds" },
  { label: "Create", href: "/?view=create", isPlainLink: true },
  { label: "Characters/Cast", href: "/characters" }
];

const NAV_SELECTED_CLASS = "flex min-w-fit flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-lantern-gold bg-lantern-gold px-3 py-2 text-center text-sm font-semibold text-primary-dark transition sm:basis-auto sm:flex-none";
const NAV_DEFAULT_CLASS = "flex min-w-fit flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-warm-paper/10 bg-deep-navy px-3 py-2 text-center text-sm font-semibold text-muted-dark transition hover:border-aged-brass hover:text-primary-light sm:basis-auto sm:flex-none";

export function ProjectLanternNav() {
  const pathname = usePathname() || "/";

  return (
    <nav aria-label="Project Lantern" className="w-full min-w-0 md:w-auto">
      <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
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
