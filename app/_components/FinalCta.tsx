import { Star } from "lucide-react";

export function FinalCta() {
  return (
    <section id="start" className="relative overflow-hidden px-4 py-32 text-center">
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[400px] w-full max-w-4xl -translate-x-1/2 rounded-full bg-onze-pitch/20 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern opacity-25" />

      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-zinc-300">
          <span className="flex items-center gap-0.5 text-emerald-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-current" />
            ))}
          </span>
          <span>Excellent · 4,9 / 5</span>
          <span className="text-zinc-500">— 2 314 parieurs actifs</span>
        </div>

        <h2 className="mb-6 text-balance text-5xl font-medium leading-[1.05] tracking-tighter md:text-7xl">
          On y est presque.
        </h2>

        <p className="mb-10 max-w-2xl text-balance text-zinc-400 md:text-lg">
          Laisse-nous ton email et ton handle Telegram. On crée ton accès, on
          t&apos;envoie le lien de la conv avec ton coach, et on lance ton essai
          de 7 jours.
        </p>

        <div className="flex w-full max-w-md flex-col gap-3">
          <input
            type="email"
            placeholder="ton@email.fr"
            className="w-full rounded-lg border border-white/10 bg-onze-surface px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-onze-pitch focus:outline-none"
          />
          <input
            type="text"
            placeholder="@ton_handle_telegram"
            className="w-full rounded-lg border border-white/10 bg-onze-surface px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-onze-pitch focus:outline-none"
          />
          <button
            type="button"
            className="rounded-lg bg-onze-pitch px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-onze-pitch-soft"
          >
            Démarrer mon essai gratuit
          </button>
        </div>

        <p className="mt-6 text-xs text-zinc-500">
          7 jours gratuits · annulation libre · 18+ · joue responsable
        </p>
      </div>
    </section>
  );
}
