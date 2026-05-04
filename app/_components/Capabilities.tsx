import {
  Database,
  LineChart,
  ClipboardList,
  Activity,
  Mic,
  CloudRain,
  Calendar,
  Home,
} from "lucide-react";

const capabilities = [
  {
    Icon: Database,
    title: "Saison entière en mémoire",
    desc: "Chaque match, chaque but, chaque carton. Pas juste les highlights.",
  },
  {
    Icon: LineChart,
    title: "xG, xA, ratios par minute",
    desc: "Les vraies stats que les pros utilisent. La donnée qui prédit.",
  },
  {
    Icon: ClipboardList,
    title: "Compos probables",
    desc: "Médias locaux, confs, rumeurs vestiaire. Il sait qui joue avant la feuille de match.",
  },
  {
    Icon: Activity,
    title: "Blessures et suspensions",
    desc: "Mis à jour en temps réel. Un titulaire boite à l'échauffement ? Push immédiat.",
  },
  {
    Icon: Mic,
    title: "Confs de presse décortiquées",
    desc: "Chaque mot du coach analysé : turnover, gestion des cadres, mind state.",
  },
  {
    Icon: CloudRain,
    title: "Conditions du stade",
    desc: "Météo, pelouse, ambiance. Saint-Étienne en hiver ≠ San Siro un mardi.",
  },
  {
    Icon: Calendar,
    title: "5 ans de H2H",
    desc: "L'historique réel des confrontations. La mémoire des contextes, pas la moyenne.",
  },
  {
    Icon: Home,
    title: "Forme dom/ext séparée",
    desc: "Lille à domicile et Lille en déplacement, c'est pas la même équipe.",
  },
];

export function Capabilities() {
  return (
    <section id="cerveau" className="relative px-4 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-pattern opacity-30" />
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 max-w-3xl">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
            Le cerveau
          </div>
          <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
            Ton coach connaît tout. <span className="text-gradient-pitch">Vraiment.</span>
          </h2>
          <p className="mt-4 text-zinc-400">
            Si t&apos;y as pensé, il l&apos;a déjà calculé. Si t&apos;y as pas pensé,
            il l&apos;a calculé aussi. Il croise des dizaines de signaux pour chaque
            match : la donnée brute, le contexte, l&apos;humain.
          </p>
        </div>

        <blockquote className="mb-10 max-w-3xl rounded-2xl border-l-2 border-onze-pitch bg-onze-surface px-5 py-4 text-base italic text-zinc-200 shadow-onze-btn md:text-lg">
          “Si Mbappé sort à l&apos;échauffement, tu le sais avant que TF1 mette son
          bandeau.”
        </blockquote>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="rounded-2xl border border-white/5 bg-onze-surface p-5 shadow-onze-btn transition-colors hover:border-white/15"
            >
              <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-onze-pitch/20 bg-onze-pitch/10 text-onze-pitch-soft">
                <c.Icon className="size-4" />
              </div>
              <h3 className="text-base font-medium tracking-tight">{c.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
