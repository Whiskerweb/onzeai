import { Send, Clock, Infinity as InfinityIcon, BarChart3 } from "lucide-react";

const messages: { from: "user" | "coach"; text: string; time: string }[] = [
  { from: "user", text: "Hey, PSG-OM ce soir, t'en penses quoi ?", time: "20:12" },
  {
    from: "coach",
    text: "Compo PSG sans Marquinhos (suspendu). Donnarumma fragile sur sa gauche depuis 3 matchs (xGA 1.8). OM en confiance, vient d'enchaîner 4 victoires.",
    time: "20:13",
  },
  {
    from: "coach",
    text: "Mon pari : +2,5 buts cote 1.78 sur Winamax. Value claire selon mon modèle (vraie cote ~1,55). Mise conseillée : 2% de ta bankroll.",
    time: "20:14",
  },
  { from: "user", text: "Et un combiné avec un buteur ?", time: "20:14" },
  {
    from: "coach",
    text: "Dembélé est en feu (3 buts en 2 matchs, xG +1,4). Combi : +2,5 buts + buteur Dembélé, cote 5,20. C'est mon coup du soir.",
    time: "20:15",
  },
];

const kpis = [
  { Icon: Clock, label: "Latence", value: "8s" },
  { Icon: InfinityIcon, label: "Mémoire", value: "∞" },
  { Icon: BarChart3, label: "Dispo", value: "24/7" },
];

export function CharlyWhatsapp() {
  return (
    <section id="telegram" className="relative z-10 overflow-hidden px-4 py-32">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[60vw] max-w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-onze-pitch/15 blur-[160px]" />

      <div className="mx-auto max-w-6xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
          <Send className="size-3 text-onze-pitch-soft" />
          Telegram
        </div>
        <h2 className="mx-auto max-w-3xl text-balance text-4xl font-medium tracking-tight md:text-6xl">
          Sur Telegram. <span className="text-gradient-pitch">Comme avec un pote.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          Pas de menu, pas de boutons à cliquer. Du langage naturel, en français,
          à toute heure. Tu poses une question, il répond.
        </p>
      </div>

      <div className="relative mx-auto mt-16 grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative mx-auto w-full max-w-md">
          <div className="rounded-[3rem] border border-white/10 bg-gradient-to-b from-[#1a1817] to-[#0a0908] p-3 shadow-2xl shadow-black/60">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/5 bg-onze-bg">
              <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0908] px-5 py-3 text-xs text-zinc-400">
                <span>20:15</span>
                <span className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-onze-pitch text-[9px] font-bold text-white">
                    D
                  </span>
                  Dembefric · en ligne
                </span>
                <span>•••</span>
              </div>
              <div className="space-y-3 bg-[radial-gradient(circle_at_top,_rgba(27,107,58,0.16),_transparent_60%)] p-5">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed ${
                        m.from === "user"
                          ? "rounded-br-sm bg-onze-pitch text-white"
                          : "rounded-bl-sm border border-white/5 bg-onze-surface text-zinc-200"
                      }`}
                    >
                      {m.text}
                      <div
                        className={`mt-1 text-[10px] ${
                          m.from === "user" ? "text-white/70" : "text-zinc-500"
                        }`}
                      >
                        {m.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-white/5 bg-[#0a0908] px-4 py-3">
                <div className="flex-1 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-xs text-zinc-500">
                  Tapez votre message à Dembefric...
                </div>
                <div className="flex size-9 items-center justify-center rounded-full bg-onze-pitch">
                  <Send className="size-4 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
              Conv 24/7 avec ton coach
            </div>
            <h3 className="text-2xl font-medium tracking-tight md:text-3xl">
              Tu lui poses la question. Il répond le raisonnement.
            </h3>
            <p className="mt-3 text-zinc-400">
              Tu veux savoir si Vinicius joue ce soir ? Il check et te répond avant
              que tu termines ton café. Tu veux le détail derrière un signal ? Il te
              le déroule, étape par étape.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="rounded-2xl border border-white/5 bg-onze-surface p-4 text-center shadow-onze-btn"
              >
                <k.Icon className="mx-auto mb-2 size-4 text-onze-pitch-soft" />
                <div className="text-2xl font-medium tracking-tight text-white">
                  {k.value}
                </div>
                <div className="mt-1 text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                  {k.label}
                </div>
              </div>
            ))}
          </div>

          <a
            href="#tarifs"
            className="inline-flex items-center gap-2 rounded-lg bg-onze-pitch px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-onze-pitch-soft"
          >
            Démarrer mon essai gratuit
          </a>
        </div>
      </div>
    </section>
  );
}
