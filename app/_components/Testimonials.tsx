import { Star } from "lucide-react";

const testimonials = [
  {
    plan: "Dembefric · Foot · Solo · 4 mois",
    title: "+12% ROI sur 4 mois",
    body: "Avant je mettais 50 balles sur tout le PSG. Maintenant je mise 5€ sur trois paris value que Dembefric me file. C'est pas un miracle, c'est juste plus malin.",
    name: "Yanis",
    role: "22 · Paris",
  },
  {
    plan: "Squad · Foot + Basket · 6 mois",
    title: "Le combiné Curritique + Dembefric m'a sauvé",
    body: "J'ai compris que le vrai sport c'est les stats, pas l'instinct. Les premiers mois j'ai picolé avec mes potes ce que j'aurais perdu sinon.",
    name: "Sébastien",
    role: "28 · Lyon",
  },
  {
    plan: "Dembefric · Foot · Solo · 8 mois",
    title: "Comme un consultant",
    body: "Je lui demande si je dois miser sur l'OM. Il me dit 'non, attends le derby'. Il a raison une fois sur deux. Sur ce sport, ça suffit largement.",
    name: "Mehdi",
    role: "25 · Marseille",
  },
  {
    plan: "All Access · 4 sports · 3 mois",
    title: "Quatre sports, zéro temps mort",
    body: "Je décide en ayant tous les angles. Je gagne pas tout le temps mais je perds bien moins souvent. Et l'été j'ai du basket et de l'UFC qui tournent.",
    name: "Théo",
    role: "24 · Lille",
  },
  {
    plan: "McTriple · UFC · Solo · 5 mois",
    title: "McTriple me parle MMA comme un coach de gym",
    body: "Je suis le seul de mes potes qui gagne sur l'UFC. Le fait de pouvoir lui poser des questions sur le matchup juste avant la pesée, ça change tout.",
    name: "Camille",
    role: "27 · Bordeaux",
  },
  {
    plan: "Squad · Foot + Tennis · 9 mois",
    title: "Réappris à parier moins, et mieux",
    body: "Je voulais arrêter de parier après une mauvaise année. Onze.ai m'a remis dans le rythme. Mises plus petites, raisonnement clair. C'est devenu un loisir, plus une fuite.",
    name: "Rachid",
    role: "31 · Saint-Étienne",
  },
];

export function Testimonials() {
  return (
    <section id="reviews" className="relative px-4 py-32">
      <div className="pointer-events-none absolute inset-0 bg-dot-pattern opacity-25" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[60vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-onze-pitch/10 blur-[140px]" />

      <div className="relative mx-auto mb-14 flex max-w-7xl flex-col items-end justify-between gap-8 md:flex-row">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
            Avis
          </div>
          <h2 className="mb-4 text-balance text-4xl font-medium tracking-tight md:text-5xl">
            Ils parient mieux. <span className="text-zinc-400">Pas plus.</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-0.5 text-emerald-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </span>
            <span className="text-sm font-medium">4,9 / 5 sur 1 870 avis</span>
          </div>
        </div>
        <a
          href="#tarifs"
          className="shrink-0 rounded-lg bg-onze-pitch px-8 py-4 text-[15px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-onze-pitch-soft"
        >
          Choisir mon coach
        </a>
      </div>

      <div className="relative mx-auto max-w-7xl columns-1 gap-6 space-y-6 md:columns-2 lg:columns-3">
        {testimonials.map((t, i) => (
          <article
            key={i}
            className="break-inside-avoid rounded-2xl border border-white/5 bg-[#0d0c0b]/85 p-6 shadow-onze-btn backdrop-blur-md transition-colors hover:border-white/15"
          >
            <div className="mb-3 inline-flex rounded-full border border-onze-pitch/30 bg-onze-pitch/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-onze-pitch-soft">
              {t.plan}
            </div>
            <h4 className="mb-2 text-lg font-bold leading-snug">{t.title}</h4>
            <p className="mb-6 text-sm leading-relaxed text-zinc-400">“{t.body}”</p>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-onze-pitch/20 text-xs font-bold text-white">
                {t.name.slice(0, 1)}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{t.name}</div>
                <div className="text-xs text-zinc-500">{t.role}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
