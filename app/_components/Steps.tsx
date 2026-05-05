import { UserCheck, MessageSquare, Sparkles } from "lucide-react";

const steps = [
  {
    n: "01",
    Icon: UserCheck,
    title: "Tu choisis ton coach.",
    desc: "Solo (1 agent), Squad (3) ou les 5 d'un coup. Tu paies au mois, tu changes quand tu veux. Pas d'engagement de fou.",
    label: "Setup · 1 minute",
  },
  {
    n: "02",
    Icon: Sparkles,
    title: "Il t'envoie ses signaux.",
    desc: "Sur Telegram (ou WhatsApp). 2 à 6 signaux par jour les jours de match. Une analyse, une cote, un raisonnement. Zéro spam.",
    label: "Push automatique",
  },
  {
    n: "03",
    Icon: MessageSquare,
    title: "Tu lui parles comme à un pote.",
    desc: "Une question sur un joueur, un combiné à valider, un détail tactique ? Tu écris en français normal. Il répond en quelques secondes — 3 à 20 questions / jour selon ton plan, ou illimité en All Access.",
    label: "3 / 20 / ∞ msg/jour",
  },
];

export function Steps() {
  return (
    <section className="relative px-4 py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-2xl">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
            Méthode
          </div>
          <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
            Trois étapes. <span className="text-gradient-pitch">Pas une de plus.</span>
          </h2>
          <p className="mt-4 max-w-xl text-zinc-400">
            Pas de cours en ligne, pas de tutoriels de 40 minutes. Tu choisis ton agent.
            Il t&apos;envoie ses signaux. Tu lui parles. C&apos;est tout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="group relative overflow-hidden rounded-3xl border border-white/5 bg-onze-surface p-8 shadow-onze-btn"
            >
              <div className="pointer-events-none absolute right-0 top-0 size-32 bg-onze-pitch/15 blur-3xl" />
              <div className="relative">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Étape {s.n}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-lg border border-onze-pitch/30 bg-onze-pitch/10 text-onze-pitch-soft">
                    <s.Icon className="size-5" />
                  </div>
                </div>
                <div className="mb-3 inline-flex rounded-full border border-white/5 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
                  {s.label}
                </div>
                <h3 className="mb-3 text-xl font-medium tracking-tight">{s.title}</h3>
                <p className="text-sm text-zinc-400">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
