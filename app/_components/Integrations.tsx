import { Send, MessageCircle, Smartphone } from "lucide-react";

const channels = [
  {
    name: "Telegram",
    color: "#229ED9",
    Icon: Send,
    desc: "Canal principal. Push instantané, chat 24/7, raisonnement détaillé sur demande.",
    plan: "Inclus dès Solo",
    primary: true,
  },
  {
    name: "WhatsApp",
    color: "#25D366",
    Icon: MessageCircle,
    desc: "Si tu préfères. Mêmes signaux, même chat, même latence — au choix au moment de l'inscription.",
    plan: "Inclus dès Solo",
  },
  {
    name: "iMessage / SMS",
    color: "#0082F3",
    Icon: Smartphone,
    desc: "Pour les notifs même sans data : signaux clés en SMS clean. Idéal en déplacement.",
    plan: "Inclus dès All Access",
  },
];

export function Integrations() {
  return (
    <section className="relative bg-onze-bg px-4 py-24">
      <div className="mx-auto mb-14 flex max-w-7xl flex-col items-center text-center">
        <span className="mb-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
          Canaux
        </span>
        <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
          Là où tu es. <span className="text-zinc-400">Pas une app de plus.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          Pas besoin d&apos;installer une énième application. Tes coachs vivent sur les
          messageries que tu utilises déjà. Une conv, un canal, c&apos;est tout.
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <div
            key={c.name}
            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/5 bg-onze-surface p-7 shadow-onze-btn transition-all duration-300 hover:-translate-y-1 hover:border-white/15"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100"
              style={{
                background: `linear-gradient(135deg, ${c.color}1a 0%, transparent 60%)`,
              }}
            />
            <div className="relative z-10">
              <div
                className="mb-5 flex size-12 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: `${c.color}1a`,
                  borderColor: `${c.color}33`,
                  color: c.color,
                }}
              >
                <c.Icon className="size-5" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Canal
              </div>
              <div className="mt-1 text-xl font-medium tracking-tight">{c.name}</div>
              <p className="mt-3 text-sm text-zinc-400">{c.desc}</p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-300">
                {c.plan}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-wrap items-center justify-center gap-3 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-zinc-300">
          Push avant chaque match
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-zinc-300">
          Alertes blessures J−1
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium text-zinc-300">
          5 fuseaux horaires
        </span>
      </div>
    </section>
  );
}
