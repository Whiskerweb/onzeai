"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { OnzeLogo } from "./OnzeLogo";

const links = [
  { label: "Coachs", href: "#coachs" },
  { label: "Cerveau", href: "#cerveau" },
  { label: "Telegram", href: "#telegram" },
  { label: "Tarifs", href: "#tarifs" },
  { label: "F.A.Q", href: "#faq" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-1/2 top-8 z-50 flex w-[95%] max-w-7xl -translate-x-1/2 items-center justify-between rounded-2xl px-4 py-3 transition-all duration-300 glass-panel ${
        scrolled
          ? "bg-[#0d0c0b]/85 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent"
      }`}
    >
      <a href="#" aria-label="Onze.ai home">
        <OnzeLogo size={26} />
      </a>

      <div className="hidden items-center gap-7 text-sm font-medium text-zinc-300 lg:flex">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="transition-colors hover:text-white">
            {l.label}
          </a>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <a
          href="#login"
          className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white md:inline"
        >
          Se connecter
        </a>
        <a
          href="#trial"
          className="hidden rounded-lg bg-onze-pitch px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[0.98] active:scale-95 md:inline-block"
        >
          Choisir mon coach
        </a>
        <button className="text-white lg:hidden" aria-label="Menu">
          <Menu className="size-6" />
        </button>
      </div>
    </nav>
  );
}
