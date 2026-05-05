"use client";

import { useEffect, useState } from "react";
import { X, Lock, ArrowRight, Gift } from "lucide-react";
import {
  getNextFixture,
  formatRelativeKickoff,
  type Fixture,
} from "../_data/fixtures";

const DELAY_MS = 3500;
const STORAGE_KEY = "onze.freePickDismissed";

export function FreePickPopup() {
  const [show, setShow] = useState(false);
  const [match, setMatch] = useState<Fixture>(() => getNextFixture());
  const [relative, setRelative] = useState<string>(() =>
    formatRelativeKickoff(match.kickoffISO)
  );
  const [unlocked, setUnlocked] = useState(match.unlockedToday);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissedAt = window.sessionStorage.getItem(STORAGE_KEY);
    if (dismissedAt) return;
    const t = setTimeout(() => setShow(true), DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // Re-pick le prochain match toutes les 60s (au cas où la page reste ouverte longtemps)
  useEffect(() => {
    const id = setInterval(() => {
      const next = getNextFixture();
      setMatch(next);
      setRelative(formatRelativeKickoff(next.kickoffISO));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Reset compteur si le match change
  useEffect(() => {
    setUnlocked(match.unlockedToday);
  }, [match.id, match.unlockedToday]);

  // Compteur live
  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      setUnlocked((n) => n + Math.floor(Math.random() * 2));
    }, 9000);
    return () => clearInterval(id);
  }, [show]);

  function dismiss() {
    setShow(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-3 left-3 right-3 z-50 sm:bottom-5 sm:left-auto sm:right-5 sm:max-w-sm">
      <div className="relative animate-[slideUp_500ms_cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden rounded-2xl border border-onze-pitch/40 bg-onze-surface/95 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-onze-pitch/40 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />

        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-3.5" />
        </button>

        <div className="relative p-5">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Prochain match · {relative}
          </div>

          <h3 className="mb-1 flex items-center gap-1.5 text-base font-bold leading-tight text-white">
            <Gift className="size-4 text-onze-pitch-soft" />
            Ton pronostic gratuit t&apos;attend
          </h3>
          <p className="mb-4 text-xs leading-relaxed text-zinc-400">
            <span className="font-bold text-white">
              {match.home} – {match.away}
            </span>{" "}
            · {match.kickoff}, {match.flag} {match.league}. L&apos;analyse
            complète de {match.coachName}, offerte pour ton premier match.
          </p>

          {/* Locked preview — cote dévoilée, le reste flouté */}
          <div className="mb-4 rounded-xl border border-white/10 bg-onze-bg p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
              <span style={{ color: match.coachColor }}>
                ◆ {match.coachName}
              </span>
              <Lock className="size-3 text-zinc-500" />
            </div>

            {/* Cote — TEASER visible */}
            <div className="mb-3 flex items-end justify-between rounded-lg border border-onze-pitch/30 bg-onze-pitch/10 px-3 py-2">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Cote du combiné
                </div>
                <div className="text-3xl font-bold leading-none text-onze-pitch-soft">
                  ×{match.cote}
                </div>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-300">
                🔥 Value
              </div>
            </div>

            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Pari
            </div>
            <div className="select-none text-sm font-bold text-white blur-sm">
              {match.pick}
            </div>
            <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Raisonnement
            </div>
            <p className="select-none text-[11px] leading-relaxed text-zinc-400 blur-[3px]">
              {match.reasoning}
            </p>
          </div>

          <a
            href={`/start?free=${match.id}`}
            className="group flex items-center justify-between rounded-lg bg-onze-pitch px-4 py-3 text-sm font-bold text-white transition-all hover:bg-onze-pitch-soft"
          >
            Débloquer maintenant
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span>
              <span className="font-bold text-emerald-400">{unlocked}</span>{" "}
              parieurs débloqués pour ce match
            </span>
          </div>
          <p className="mt-1 text-center text-[10px] text-zinc-600">
            Sans CB · 7 jours d&apos;essai · annulation libre
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(80px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
