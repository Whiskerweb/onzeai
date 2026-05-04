import { ArrowRight, Check, MapPin } from "lucide-react";
import type { Coach } from "../_data/coaches";

type Props = { coach: Coach; reverse?: boolean };

export function AgentDeepDive({ coach, reverse = false }: Props) {
  const { Icon } = coach;
  return (
    <section id={`coach-${coach.id}`} className="relative z-10 px-4 py-16">
      <div
        className={`relative mx-auto flex max-w-7xl overflow-hidden rounded-[2rem] border border-onze-border bg-onze-surface lg:flex-row ${
          reverse ? "flex-col-reverse lg:flex-row-reverse" : "flex-col"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(135deg, ${coach.color}30 0%, transparent 60%)`,
          }}
        />

        <div className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden p-8 lg:w-1/2">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at center, ${coach.color}55 0%, #060403 70%)`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />

          <div className="relative z-10 text-center">
            {coach.portrait ? (
              <div className="relative mx-auto mb-5 flex size-56 items-end justify-center md:size-72">
                <div
                  className="absolute inset-x-4 bottom-0 h-3/4 rounded-[40%] opacity-80 blur-2xl"
                  style={{ background: coach.color }}
                />
                <img
                  src={coach.portrait}
                  alt={coach.name}
                  className="relative z-10 h-full w-auto object-contain drop-shadow-2xl"
                />
              </div>
            ) : (
              <div
                className="mx-auto mb-5 flex size-32 items-center justify-center rounded-3xl text-5xl font-bold text-white shadow-2xl md:size-44 md:text-7xl"
                style={{
                  background: `linear-gradient(135deg, ${coach.color} 0%, ${coach.color}aa 100%)`,
                }}
              >
                {coach.name.charAt(0)}
              </div>
            )}
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Nº {coach.number}
            </div>
            <div className="mt-1 text-3xl font-medium tracking-tight text-white">
              {coach.name}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
              <MapPin className="size-3" /> {coach.city} · {coach.flag} {coach.league}
            </div>
          </div>

          <div className="absolute inset-x-8 bottom-8 z-20 flex items-center justify-between rounded-2xl border border-white/10 bg-onze-bg/80 p-4 backdrop-blur-xl">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                Yield 12 mois
              </div>
              <div className="text-xl font-medium" style={{ color: coach.color }}>
                {coach.stats.yield}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                Matchs analysés
              </div>
              <div className="text-xl font-medium text-white">
                {coach.stats.matches.toLocaleString("fr-FR")}
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-center p-10 md:p-14 lg:w-1/2">
          <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            <Icon className="size-4" style={{ color: coach.color }} />
            Découvrez {coach.name}
          </div>
          <h2 className="mb-5 text-balance text-3xl font-medium leading-tight tracking-tight md:text-4xl">
            {coach.headline}
          </h2>
          <p className="mb-6 max-w-md text-zinc-400">{coach.bio}</p>

          <blockquote
            className="mb-8 rounded-xl border-l-2 px-4 py-3 text-sm italic text-zinc-200"
            style={{ borderColor: coach.color, background: `${coach.color}11` }}
          >
            “{coach.signature}”
          </blockquote>

          <ul className="mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {coach.capabilities.map((f) => (
              <li
                key={f}
                className="flex items-center gap-3 rounded-lg p-3 text-sm font-medium glass-panel"
              >
                <Check className="size-4 shrink-0" style={{ color: coach.color }} />
                {f}
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-white/5 bg-onze-bg p-5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              <span>Sample Telegram</span>
              <span>{coach.sample.time}</span>
            </div>
            <p className="text-sm text-zinc-200">{coach.sample.text}</p>
          </div>

          <a
            href="#tarifs"
            className="mt-6 inline-flex w-fit items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
            style={{ backgroundColor: coach.color }}
          >
            Choisir {coach.name}
            <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
