"use client";

import { useState } from "react";
import { Plus, HelpCircle } from "lucide-react";

const tabs = ["Légalité", "Fonctionnement", "Stats & Sources"] as const;

const data: Record<(typeof tabs)[number], { q: string; a: string }[]> = {
  Légalité: [
    {
      q: "C'est légal ?",
      a: "Oui. Onze.ai te file de l'analyse et des paris à suivre. C'est de l'info, pas un opérateur. Tu places où tu veux : Winamax, Betclic, Unibet, peu importe.",
    },
    {
      q: "Vous garantissez que je vais gagner ?",
      a: "Non, et personne ne devrait. On affiche notre yield et notre ROI en toute transparence. On cherche les paris où la cote est sous-évaluée par les bookmakers. C'est pas magique, c'est de la stat.",
    },
    {
      q: "J'ai 18 ans, j'ai jamais parié. Je peux ?",
      a: "Oui. On te file un onboarding doux pour comprendre les cotes, les types de paris, le money management. Le but c'est de t'apprendre à parier mieux qu'à l'instinct, pas de te faire perdre ta thune.",
    },
    {
      q: "Je peux annuler quand je veux ?",
      a: "Oui. Tu coupes en 1 clic dans ton espace, effectif fin du mois en cours. Pas de relance, pas de questions.",
    },
  ],
  Fonctionnement: [
    {
      q: "Comment je discute avec mon coach ?",
      a: "Après ton inscription, tu reçois un lien Telegram. Tu cliques, tu démarres la conv, tu poses tes questions. Il te répond en quelques secondes.",
    },
    {
      q: "Combien de paris par jour ?",
      a: "Entre 2 et 6 paris par coach quand il y a des events. Match L1 + CL le mardi soir, NBA Playoffs cette nuit, demi-finale Roland Garros demain, UFC card samedi. Si rien à dire, ton coach la ferme. Zéro spam.",
    },
    {
      q: "Quelles ligues / compétitions sont couvertes ?",
      a: "Foot : Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Champions League, Europa League, Mondial, Euro. Basket : NBA, EuroLeague, WNBA, FIBA. Tennis : les 4 Grand Chelems + Masters 1000 ATP/WTA. UFC : PPV, Fight Nights, Bellator, PFL.",
    },
    {
      q: "Mon coach me parle en français ?",
      a: "Oui, tous en français. Dembefric a son accent gamin du bar, Curritique balance des termes NBA, Federace reste posé, McTriple punchy comme un MMA fan. 100% compréhensible.",
    },
    {
      q: "Pourquoi 4 sports ?",
      a: "Calendriers complémentaires. La saison foot se finit en mai, le tennis enchaîne sur Roland Garros, la NBA est en pleins Playoffs, l'UFC tourne 52 semaines par an. Aucun moment de l'année sans rien à parier.",
    },
  ],
  "Stats & Sources": [
    {
      q: "Vous prenez en compte les blessures / forfaits de dernière minute ?",
      a: "Oui. Tes coachs lisent les confs de presse, les comptes officiels (clubs, NBA, ATP, UFC), les sources locales. Si Mbappé sort à l'échauffement ou si Doncic passe en load management, tu le sais avant la diffusion télé.",
    },
    {
      q: "Et le mercato / draft / signings ?",
      a: "Inclus dans All Access. Alertes early sur les transferts foot, la draft NBA, les signings UFC. Utile pour anticiper les premiers events avec un nouveau joueur clé.",
    },
    {
      q: "C'est quoi un xG, un PER, un H2H surface ?",
      a: "xG (foot) : la proba qu'un tir devienne un but. PER (basket) : la note d'efficacité d'un joueur sur 40 minutes. H2H surface (tennis) : le bilan des confrontations directes par type de court. Tes coachs jouent les écarts entre ces stats et les cotes des bookmakers.",
    },
  ],
};

export function Faq() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Légalité");

  return (
    <section
      id="faq"
      className="relative mx-auto flex max-w-6xl flex-col gap-16 border-t border-white/5 px-4 py-24 md:flex-row"
    >
      <div className="md:w-1/3">
        <div className="sticky top-32 rounded-[2rem] border border-white/5 bg-gradient-to-b from-[#0d0c0b] to-[#060403] p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
          <div className="mb-6 flex size-16 items-center justify-center rounded-xl border border-onze-pitch/30 bg-onze-pitch/10 text-onze-pitch-soft">
            <HelpCircle className="size-7" />
          </div>
          <h3 className="mb-4 text-2xl font-medium">Les vraies questions.</h3>
          <p className="mb-2 text-sm text-zinc-400">Sans langue de bois.</p>
          <p className="mb-8 text-sm text-zinc-500">
            Légalité, fiabilité, comment ça marche, et toutes les questions qu&apos;on
            te poserait au comptoir un samedi soir.
          </p>
          <a
            href="#tarifs"
            className="inline-block w-full rounded-lg border border-white/10 bg-onze-surface px-6 py-3.5 text-center text-sm font-medium text-white shadow-onze-btn transition-all hover:border-white/30"
          >
            Démarrer mon essai
          </a>
        </div>
      </div>

      <div className="md:w-2/3">
        <div className="mb-8 inline-flex flex-wrap gap-2 rounded-lg border border-white/5 bg-white/5 p-1">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-[#1a1817] text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {data[tab].map((item, i) => (
            <details
              key={`${tab}-${i}`}
              className="group cursor-pointer border-b border-white/5 p-4"
              open={i === 0}
            >
              <summary className="flex items-center justify-between font-medium text-zinc-200 transition-colors group-hover:text-white">
                {item.q}
                <span className="text-zinc-500 transition-transform group-open:rotate-45">
                  <Plus className="size-5" />
                </span>
              </summary>
              <p className="mt-4 pr-8 text-sm leading-relaxed text-zinc-400">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
