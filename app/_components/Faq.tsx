"use client";

import { useState } from "react";
import { Plus, HelpCircle } from "lucide-react";

const tabs = ["Légalité", "Fonctionnement", "Stats & Sources"] as const;

const data: Record<(typeof tabs)[number], { q: string; a: string }[]> = {
  Légalité: [
    {
      q: "C'est légal ?",
      a: "Oui. Onze.ai t'aide à analyser les matchs et te file des signaux. C'est de l'info, pas un opérateur de paris. Tu places tes paris où tu veux : Winamax, Betclic, Unibet, peu importe.",
    },
    {
      q: "Vous garantissez que je vais gagner ?",
      a: "Non, et personne ne devrait. On affiche notre yield et notre ROI cumulé en toute transparence. Sur le long terme, on cherche des value bets où la cote est sous-évaluée. C'est pas magique, c'est de la stat.",
    },
    {
      q: "J'ai 18 ans, j'ai jamais parié. Je peux ?",
      a: "Oui, et on te file un onboarding doux pour comprendre les cotes, les types de paris, le money management. Le but n'est pas de te faire perdre ton argent, c'est de t'apprendre à parier mieux que sur un coup de tête.",
    },
    {
      q: "Je peux annuler quand je veux ?",
      a: "Oui. Tu coupes en un clic dans ton espace, c'est effectif à la fin du mois en cours. Pas de relance commerciale, pas de questions.",
    },
  ],
  Fonctionnement: [
    {
      q: "Comment je discute avec mon agent ?",
      a: "Après ton inscription, tu reçois un lien Telegram (ou WhatsApp). Tu cliques, tu démarres la conv avec ton agent, tu poses tes questions. Il te répond en quelques secondes.",
    },
    {
      q: "Combien de signaux par jour ?",
      a: "Entre 2 et 6 signaux par agent par jour les jours de match. Zéro spam : si y'a rien d'intéressant, ton agent reste muet.",
    },
    {
      q: "Mon agent me parle en français ?",
      a: "Oui, tous les agents sont en français. Dembefric a son accent, Belligagne glisse de l'espagnol, Vlachance deux mots d'italien. Ça reste compréhensible pour tous.",
    },
  ],
  "Stats & Sources": [
    {
      q: "Vous prenez en compte les blessures de dernière minute ?",
      a: "Oui. Tes agents lisent les confs de presse, les comptes officiels des clubs, les sources locales. Si Mbappé sort à l'échauffement, tu le sais avant la diffusion télé.",
    },
    {
      q: "Et le mercato ?",
      a: "Inclus dans le plan All Access. Alertes early sur les transferts qui changent une équipe. Utile pour anticiper les premiers matchs avec un nouveau joueur clé.",
    },
    {
      q: "C'est quoi un xG, en deux mots ?",
      a: "Expected Goals : la probabilité qu'un tir devienne un but selon sa position, son angle, son contexte. Si une équipe produit 2.5 xG par match mais marque 0.8, elle sous-performe — et statistiquement, elle va se rattraper. Tes agents jouent ces déséquilibres.",
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
