"use client";

import { useEffect, useState } from "react";
import { Gift, ArrowRight } from "lucide-react";

const STORAGE_KEY = "onze.freePickDismissed";

export function StickyFreeButton() {
  // Show only AFTER the popup has been dismissed (so they don't overlap).
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function check() {
      const dismissed = window.sessionStorage.getItem(STORAGE_KEY);
      setShow(Boolean(dismissed));
    }
    check();
    // Light polling — popup writes to sessionStorage on dismiss
    const id = setInterval(check, 1500);
    return () => clearInterval(id);
  }, []);

  if (!show) return null;

  return (
    <a
      href="/start?free=match-du-jour"
      className="group fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-onze-pitch py-3 pl-3 pr-4 text-sm font-bold text-white shadow-2xl shadow-onze-pitch/50 transition-all hover:-translate-y-0.5 hover:bg-onze-pitch-soft sm:bottom-5 sm:right-5"
      aria-label="Débloquer mon pronostic gratuit"
    >
      <span className="relative flex size-7 items-center justify-center rounded-full bg-onze-pitch-soft/30">
        <Gift className="size-4 text-white" />
        <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative size-2.5 rounded-full bg-emerald-400" />
        </span>
      </span>
      <span className="hidden sm:inline">Pronostic gratuit</span>
      <span className="sm:hidden">Gratuit</span>
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </a>
  );
}
