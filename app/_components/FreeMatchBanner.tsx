"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, Flame, Clock } from "lucide-react";
import {
  fixtures,
  getNextFixture,
  formatRelativeKickoff,
  type Fixture,
} from "../_data/fixtures";

export function FreeMatchBanner() {
  const [match, setMatch] = useState<Fixture>(() => getNextFixture());
  const [relative, setRelative] = useState<string>(() =>
    formatRelativeKickoff(match.kickoffISO)
  );
  const [hoursLeft, setHoursLeft] = useState<number>(() => {
    const t = new Date(match.kickoffISO).getTime() - Date.now();
    return Math.max(0, Math.floor(t / 3_600_000));
  });

  // Re-pick + recalcule les compteurs toutes les 60s
  useEffect(() => {
    function tick() {
      const next = getNextFixture();
      setMatch(next);
      setRelative(formatRelativeKickoff(next.kickoffISO));
      const ms = new Date(next.kickoffISO).getTime() - Date.now();
      setHoursLeft(Math.max(0, Math.floor(ms / 3_600_000)));
    }
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Live counter — incrément aléatoire pour simuler les inscriptions
  const [unlocked, setUnlocked] = useState(match.unlockedToday);
  useEffect(() => {
    setUnlocked(match.unlockedToday);
  }, [match.id, match.unlockedToday]);
  useEffect(() => {
    const id = setInterval(() => {
      setUnlocked((n) => n + Math.floor(Math.random() * 2));
    }, 11_000);
    return () => clearInterval(id);
  }, []);

  const closingLabel =
    hoursLeft >= 24
      ? `${Math.floor(hoursLeft / 24)} jours restants`
      : hoursLeft > 0
      ? `Fermeture dans ${hoursLeft}h`
      : "Coup d'envoi imminent";

  return (
    <section className="relative z-10 px-4 py-12">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-onze-pitch/40 shadow-2xl">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(27,107,58,0.25) 0%, #0d0c0b 60%)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-onze-pitch/30 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-10" />

        <div className="relative grid grid-cols-1 gap-8 p-8 md:grid-cols-12 md:p-12">
          {/* LEFT — pitch */}
          <div className="md:col-span-7">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                Prochain match · {relative} · {match.kickoff}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
                <Clock className="size-3" />
                {closingLabel}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
                {match.flag} {match.league}
              </span>
            </div>

            <h3 className="mb-4 text-balance text-3xl font-medium leading-[1.1] tracking-tight md:text-5xl">
              <Flame className="mr-1 inline-block size-7 text-onze-pitch-soft md:size-9" />
              {match.home} – {match.away}, le pronostic est{" "}
              <span className="bg-gradient-to-r from-onze-pitch-soft to-emerald-300 bg-clip-text text-transparent">
                offert.
              </span>
            </h3>
            <p className="mb-6 max-w-lg text-balance text-zinc-400">
              Inscris-toi en 30 secondes — pas de CB. Tu reçois l&apos;analyse
              complète de{" "}
              <span className="font-semibold text-white">
                {match.coachName}
              </span>{" "}
              sur Telegram avant le coup d&apos;envoi : pari, cote,
              raisonnement, mise conseillée. Une seule fois. Pour ce match.
            </p>

            <a
              href={`/start?free=${match.id}`}
              className="group inline-flex items-center gap-2 rounded-lg bg-onze-pitch px-6 py-3.5 text-sm font-bold text-white shadow-2xl shadow-onze-pitch/40 transition-all hover:-translate-y-0.5 hover:bg-onze-pitch-soft"
            >
              Recevoir mon pronostic gratuit
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-zinc-500">
              <span className="flex items-center gap-1.5">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="font-bold text-emerald-400">{unlocked}</span>{" "}
                parieurs débloqués pour ce match
              </span>
              <span className="text-zinc-700">·</span>
              <span>Sans CB · 7 jours d&apos;essai · annulation libre</span>
            </div>
          </div>

          {/* RIGHT — locked card */}
          <div className="md:col-span-5">
            <div className="relative rounded-2xl border border-white/10 bg-onze-bg p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: `${match.coachColor}22`,
                    color: match.coachColor,
                  }}
                >
                  ◆ {match.coachName}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  {match.flag} {match.leagueShort} · {match.kickoff}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Pari
                  </div>
                  <div className="select-none text-2xl font-bold text-white blur-sm">
                    {match.pick}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Cote
                  </div>
                  <div className="select-none text-3xl font-bold text-onze-pitch-soft blur-sm">
                    {match.cote}
                  </div>
                </div>
                <div>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Raisonnement
                  </div>
                  <p className="select-none text-sm leading-relaxed text-zinc-300 blur-[3px]">
                    {match.reasoning}
                  </p>
                </div>
              </div>

              <div className="pointer-events-none absolute inset-0 flex items-end justify-center rounded-2xl bg-gradient-to-t from-onze-bg via-onze-bg/70 to-transparent p-5">
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-onze-pitch px-4 py-2 text-xs font-bold text-white shadow-2xl">
                  <Lock className="size-3.5" />
                  Inscris-toi pour révéler
                </div>
              </div>
            </div>

            {/* Mini-counter "fixtures à venir" */}
            <div className="mt-3 rounded-xl border border-white/5 bg-onze-surface/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              <span className="text-zinc-300">{fixtures.length}</span> matches à
              venir · prochain pronostic dans{" "}
              <span className="text-zinc-300">{Math.max(0, hoursLeft)}h</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
