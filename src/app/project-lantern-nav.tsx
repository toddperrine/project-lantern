"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const NAV_ITEMS = [
  { label: "Home", href: "/", view: "home" },
  { label: "Shelf", href: "/?view=library", view: "library" },
  { label: "Account", href: "/?view=account", view: "account" }
];

const NAV_SELECTED_CLASS = "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-bloodwick-red bg-bloodwick-red px-3 py-2 text-center text-sm font-semibold leading-5 text-bloodwick-white transition sm:basis-auto sm:flex-none";
const NAV_DEFAULT_CLASS = "flex min-w-0 flex-1 basis-[calc(50%-0.25rem)] items-center justify-center rounded-md border border-bloodwick-white/10 bg-bloodwick-panel/80 px-3 py-2 text-center text-sm font-semibold leading-5 text-bloodwick-white/70 transition hover:border-bloodwick-copper hover:text-bloodwick-white sm:basis-auto sm:flex-none";

export function ProjectLanternNav() {
  const searchParams = useSearchParams();
  const activeView = searchParams.get("view") ?? "home";

  const openMeetBloodWick = () => {
    window.dispatchEvent(new CustomEvent("lantern:open-meet-bloodwick"));
  };

  return (
    <nav aria-label="Bloodwick" className="w-full min-w-0 md:w-auto">
      <div className="flex min-w-0 flex-wrap gap-2 md:justify-end">
        <button
          className={NAV_DEFAULT_CLASS}
          onClick={openMeetBloodWick}
          type="button"
        >
          Meet BloodWick
        </button>
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
