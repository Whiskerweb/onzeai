import { coaches } from "../_data/coaches";

export function AgentsGrid() {
  return (
    <section id="coachs" className="relative z-10 px-4 py-16">
      <div className="mx-auto mb-12 max-w-4xl text-center">
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
          La squad
        </div>
        <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
          Quatre personnalités. Quatre sports. Une seule équipe.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          Chacun couvre toutes les ligues majeures de son sport. Tu prends 1, 2, ou les 4.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        {coaches.map((c) => (
          <a
            key={c.id}
            href={`#coach-${c.id}`}
            className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border border-white/5 p-5 shadow-onze-btn transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
            style={{
              background: `linear-gradient(180deg, ${c.color}40 0%, #0d0c0b 80%)`,
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-20" />
            <div
              className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full opacity-50 blur-3xl transition-opacity group-hover:opacity-80"
              style={{ backgroundColor: c.color }}
            />

            {c.portrait && (
              <img
                src={c.portrait}
                alt={c.name}
                className={`pointer-events-none absolute z-0 h-auto max-w-none object-contain object-bottom drop-shadow-2xl transition-transform duration-500 group-hover:scale-[1.04] ${
                  c.id === "foot"
                    ? "-inset-x-[20%] -bottom-2 w-[140%]"
                    : "-inset-x-[8%] bottom-0 w-[116%]"
                }`}
              />
            )}

            <div className="relative z-10 flex items-start justify-between">
              <span className="rounded-full bg-black/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/80">
                Nº {c.number}
              </span>
              <span className="text-2xl">{c.flag}</span>
            </div>

            <div className="relative z-10">
              <c.Icon className="mb-3 size-6 text-white/70" />
              <div className="text-2xl font-medium tracking-tight text-white md:text-3xl">
                {c.name}
              </div>
              <div className="mt-1 text-xs font-medium uppercase tracking-widest text-white/70">
                {c.sport}
              </div>
              <div className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-white/60">
                {c.competitionsShort}
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/90">
                <span
                  className="rounded-md px-2 py-0.5 font-bold text-white"
                  style={{ backgroundColor: c.color }}
                >
                  {c.stats.yield}
                </span>
                <span className="text-zinc-400">yield 12 mois</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
