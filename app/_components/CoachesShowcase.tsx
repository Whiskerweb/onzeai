"use client";

import { useState } from "react";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { coaches } from "../_data/coaches";

export function CoachesShowcase() {
  const [activeId, setActiveId] = useState<string>(coaches[0].id);
  const active = coaches.find((c) => c.id === activeId) ?? coaches[0];
  const { Icon } = active;

  return (
    <section id="coachs" className="relative z-10 px-4 py-16">
      {/* Heading */}
      <div className="mx-auto mb-10 max-w-4xl text-center">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
          La squad
        </div>
        <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
          Quatre coachs. Quatre sports.{" "}
          <span className="text-zinc-500">Clique sur ta tête.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-zinc-400">
          Chacun couvre toutes les compétitions majeures de son sport. Pas une ligue. Pas une coupe. Toutes.
        </p>
      </div>

      {/* Avatar strip */}
      <div className="mx-auto mb-12 flex max-w-3xl items-end justify-center gap-3 sm:gap-5">
        {coaches.map((c) => {
          const isActive = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className="group relative flex flex-col items-center transition-transform duration-300 focus:outline-none"
              aria-label={c.name}
              aria-pressed={isActive}
            >
              <div
                className={`relative overflow-hidden rounded-full bg-onze-surface transition-all duration-300 ${
                  isActive
                    ? "size-24 sm:size-28"
                    : "size-16 opacity-50 grayscale hover:opacity-90 hover:grayscale-0 sm:size-20"
                }`}
                style={
                  isActive
                    ? {
                        boxShadow: `0 0 0 3px ${c.color}, 0 12px 40px ${c.color}55`,
                      }
                    : { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }
                }
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
                  <div
                    className="flex size-full items-center justify-center text-2xl font-bold text-white"
                    style={{ background: c.color }}
                  >
                    {c.name.charAt(0)}
                  </div>
                )}
              </div>

              <div
                className={`mt-2 text-center text-[11px] font-semibold uppercase tracking-widest transition-colors ${
                  isActive ? "text-white" : "text-zinc-500"
                }`}
              >
                {c.name}
                <div
                  className={`mt-0.5 text-[9px] font-medium normal-case ${
                    isActive ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {c.flag} {c.sport}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active coach card */}
      <div className="relative mx-auto max-w-7xl">
        <div
          key={active.id}
          className="relative grid animate-[fadeIn_400ms_ease-out] grid-cols-1 overflow-hidden rounded-[2rem] border border-onze-border bg-onze-surface lg:grid-cols-12"
        >
          {/* LEFT — Portrait full bleed */}
          <div className="relative flex min-h-[560px] items-end justify-center overflow-hidden lg:col-span-7 lg:min-h-[640px]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 80% 70% at 50% 75%, ${active.color}66 0%, #060403 70%)`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-15" />

            {/* Glow behind character */}
            <div
              className="pointer-events-none absolute inset-x-12 bottom-0 h-2/3 rounded-[50%] opacity-70 blur-3xl"
              style={{ background: active.color }}
            />

            {/* Number watermark */}
            <div
              className="pointer-events-none absolute -right-4 top-2 select-none text-[14rem] font-bold leading-none tracking-tighter opacity-[0.06] md:text-[18rem]"
              style={{ color: active.color, fontStyle: "italic" }}
            >
              {active.number}
            </div>

            {/* THE big portrait */}
            {active.portrait ? (
              <img
                src={active.portrait}
                alt={active.name}
                className="relative z-10 h-[105%] w-auto max-w-none object-contain object-bottom drop-shadow-2xl"
              />
            ) : (
              <div
                className="relative z-10 mb-16 flex size-56 items-center justify-center rounded-3xl text-7xl font-bold text-white shadow-2xl md:size-72 md:text-8xl"
                style={{
                  background: `linear-gradient(135deg, ${active.color} 0%, ${active.color}aa 100%)`,
                }}
              >
                {active.name.charAt(0)}
              </div>
            )}

            {/* Slanted name tag — top-left */}
            <div className="absolute left-0 top-10 z-20 origin-top-left -rotate-[7deg]">
              <div
                className="relative border-l-[5px] bg-onze-bg/95 px-6 py-3 shadow-2xl backdrop-blur-xl"
                style={{
                  borderColor: active.color,
                  boxShadow: `0 12px 40px ${active.color}55, 0 0 0 1px rgba(255,255,255,0.05)`,
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
                  Nº {active.number} · {active.flag} {active.sport}
                </div>
                <div className="text-5xl font-bold leading-none tracking-tighter text-white md:text-7xl">
                  {active.name}
                </div>
              </div>
            </div>

            {/* City badge — bottom-left */}
            <div className="absolute bottom-5 left-5 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-onze-bg/80 px-3 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md">
              <MapPin className="size-3" />
              {active.city}
            </div>

            {/* Stats — bottom-right */}
            <div className="absolute bottom-5 right-5 z-20 flex gap-2">
              <div className="rounded-2xl border border-white/10 bg-onze-bg/85 px-4 py-2.5 backdrop-blur-xl">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Yield 12M
                </div>
                <div
                  className="text-2xl font-bold leading-none"
                  style={{ color: active.color }}
                >
                  {active.stats.yield}
                </div>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-onze-bg/85 px-4 py-2.5 backdrop-blur-xl sm:block">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Events
                </div>
                <div className="text-2xl font-bold leading-none text-white">
                  {active.stats.matches.toLocaleString("fr-FR")}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Bio + capabilities + sample */}
          <div className="relative flex flex-col justify-center p-8 md:p-10 lg:col-span-5 lg:p-12">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              <Icon className="size-4" style={{ color: active.color }} />
              Découvrez {active.name}
            </div>
            <h2 className="mb-5 text-balance text-3xl font-medium leading-tight tracking-tight md:text-4xl">
              {active.headline}
            </h2>
            <p className="mb-4 max-w-md text-zinc-400">{active.bio}</p>

            <div className="mb-6 flex flex-wrap gap-1.5">
              {active.competitions.map((comp) => (
                <span
                  key={comp}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-300"
                >
                  {comp}
                </span>
              ))}
            </div>

            <blockquote
              className="mb-8 rounded-xl border-l-2 px-4 py-3 text-sm italic text-zinc-200"
              style={{
                borderColor: active.color,
                background: `${active.color}11`,
              }}
            >
              “{active.signature}”
            </blockquote>

            <ul className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {active.capabilities.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium glass-panel"
                >
                  <Check
                    className="size-4 shrink-0"
                    style={{ color: active.color }}
                  />
                  {f}
                </li>
              ))}
            </ul>

            <div className="rounded-xl border border-white/5 bg-onze-bg p-5">
              <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                <span>Sample Telegram</span>
                <span>{active.sample.time}</span>
              </div>
              <p className="text-sm text-zinc-200">{active.sample.text}</p>
            </div>

            <a
              href="#tarifs"
              className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ backgroundColor: active.color }}
            >
              Choisir {active.name}
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
