import { ArrowRight, Star } from "lucide-react";
import { coaches } from "../_data/coaches";

export function Hero() {
  return (
    <header className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-44 text-center md:pt-56">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern opacity-40" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-pitch-lines opacity-50" />

      <img
        src="/onze/hero/circle-1.avif"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute left-[-12%] top-[12%] -z-10 w-[55%] max-w-[680px] opacity-70 mix-blend-screen hue-rotate-[80deg]"
      />
      <img
        src="/onze/hero/circle-2.avif"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-12%] top-[22%] -z-10 w-[55%] max-w-[680px] opacity-70 mix-blend-screen hue-rotate-[80deg]"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center">
        <div className="mb-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-4 backdrop-blur-md glass-panel">
          <div className="flex -space-x-2">
            {coaches.map((c) => (
              <div
                key={c.id}
                className="relative size-8 overflow-hidden rounded-full border-2 border-onze-bg"
                style={{ backgroundColor: c.color }}
                title={`${c.name} · ${c.league}`}
              >
                {c.portrait ? (
                  <img
                    src={c.portrait}
                    alt={c.name}
                    className="absolute inset-0 size-full object-cover"
                    style={{
                      objectPosition: "50% 8%",
                      transform: "scale(1.5)",
                      transformOrigin: "50% 30%",
                    }}
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[11px] font-bold text-white">
                    {c.name.slice(0, 1)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mx-1 h-4 w-px bg-white/20" />
          <span className="text-xs font-semibold tracking-wide text-zinc-300">
            Saison 25–26 · 5 coachs · 5 championnats
          </span>
        </div>

        <h1 className="mb-6 text-balance text-5xl font-medium leading-[1.05] tracking-tighter text-white drop-shadow-2xl md:text-7xl">
          Cinq coachs IA. Cinq championnats.
          <br className="hidden md:block" />{" "}
          <span className="text-gradient-pitch">Plus jamais en aveugle.</span>
        </h1>

        <p className="mb-8 max-w-2xl text-balance text-base text-zinc-400 md:text-lg">
          Tu reçois leurs signaux sur Telegram. Tu peux leur parler comme à un pote
          qui aurait mémorisé Opta. xG, blessures, formes, météo — ils ont tout en tête.
        </p>

        <div className="mb-8 flex items-center gap-2 text-sm font-medium">
          <span className="rounded-full border border-onze-border bg-onze-surface px-3 py-1 shadow-onze-btn">
            Excellent
          </span>
          <span className="text-zinc-400">4,9 / 5 sur 1 870 avis</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <Star className="size-4 fill-current" />
            Trustpilot
          </span>
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:w-auto sm:flex-row">
          <a
            href="#tarifs"
            className="w-full rounded-lg bg-onze-pitch px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-onze-pitch-soft sm:w-auto"
          >
            Choisir mon coach
          </a>
          <a
            href="#coachs"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/5 bg-onze-surface px-8 py-4 text-[15px] font-medium text-white shadow-onze-btn transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 sm:w-auto"
          >
            Découvrir la squad
            <ArrowRight className="size-4 opacity-70" />
          </a>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          7 jours d&apos;essai · sans CB · annulation libre · 18+ joue responsable
        </p>

        <div className="mt-10 inline-flex items-center gap-3 rounded-2xl border border-onze-pitch/30 bg-onze-pitch/10 px-4 py-3 text-left text-sm font-medium text-white shadow-onze-btn">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-onze-pitch text-white">
            <span className="text-xs font-bold">D</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-widest text-onze-pitch-soft">
              Live · Dembefric · Ligue 1
            </div>
            <div className="text-[13px] text-zinc-200">
              PSG-OM · +2,5 buts cote 1,78 — Donnarumma fragile, Marquinhos out.
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
