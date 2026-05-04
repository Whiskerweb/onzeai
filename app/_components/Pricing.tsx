"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Plan = {
  id: "solo" | "squad" | "all";
  name: string;
  monthly: string;
  annual: string;
  tagline: string;
  features: string[];
  cta: string;
  featured?: boolean;
};

const plans: Plan[] = [
  {
    id: "solo",
    name: "Solo",
    monthly: "14,90 €",
    annual: "11,90 €",
    tagline: "Un coach, ton championnat préféré.",
    features: [
      "1 agent au choix parmi les 5",
      "Signaux quotidiens sur Telegram",
      "Chat illimité avec ton agent",
      "Alertes 1h avant chaque match",
      "Annulation libre, sans embrouille",
    ],
    cta: "Démarrer Solo",
  },
  {
    id: "squad",
    name: "Squad",
    monthly: "29,90 €",
    annual: "23,90 €",
    tagline: "Trois coachs, trois championnats, combinés multi-leagues.",
    features: [
      "3 agents au choix",
      "Combinés inter-championnats analysés",
      "Priorité sur les matchs Champions League",
      "Récap stats hebdo",
      "Alertes blessures et compos en push",
    ],
    cta: "Démarrer Squad",
    featured: true,
  },
  {
    id: "all",
    name: "All Access",
    monthly: "49,90 €",
    annual: "39,90 €",
    tagline: "Toute la squad. Aucun match qui t'échappe.",
    features: [
      "Les 5 agents inclus",
      "Alertes mercato en avant-première",
      "Stats xG brutes téléchargeables",
      "Early access aux nouveaux agents",
      "Sessions Q&A live mensuelles",
    ],
    cta: "Démarrer All Access",
  },
];

export function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <section id="tarifs" className="relative px-4 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-dot-pattern opacity-25" />

      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest shadow-onze-btn">
            Tarifs
          </div>
          <h2 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
            Choisis ton format.{" "}
            <span className="text-gradient-pitch">Pars quand tu veux.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
            Sept jours d&apos;essai gratuits. Annulation libre, en un clic. Pas de relance
            commerciale, pas de petits caractères.
          </p>

          <div className="mx-auto mt-8 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 shadow-onze-btn">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                billing === "monthly"
                  ? "bg-onze-pitch text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                billing === "annual"
                  ? "bg-onze-pitch text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Annuel
              <span className="rounded-full bg-onze-pitch-soft/20 px-2 py-0.5 text-[10px] font-bold text-onze-pitch-soft">
                −20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col rounded-3xl border p-7 shadow-onze-btn ${
                p.featured
                  ? "border-onze-pitch/40 bg-gradient-to-b from-onze-pitch/15 to-onze-surface"
                  : "border-white/5 bg-onze-surface"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-onze-pitch px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
                  ★ Le plus pris
                </div>
              )}

              <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                {p.name}
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-5xl font-medium tracking-tight">
                  {billing === "monthly" ? p.monthly : p.annual}
                </span>
                <span className="text-sm text-zinc-500">/mois</span>
              </div>
              {billing === "annual" && (
                <div className="mt-1 text-[11px] font-medium text-onze-pitch-soft">
                  Soit {p.monthly} économisé chaque mois
                </div>
              )}
              <p className="mt-4 text-sm text-zinc-400">{p.tagline}</p>

              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-zinc-200">
                    <Check className="mt-0.5 size-4 shrink-0 text-onze-pitch-soft" />
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#start"
                className={`mt-8 inline-block rounded-lg px-5 py-3 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  p.featured
                    ? "bg-onze-pitch text-white hover:bg-onze-pitch-soft"
                    : "border border-white/10 bg-white/5 text-white hover:border-white/30"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-zinc-500">
          Onze.ai n&apos;est pas un opérateur de paris. On file de l&apos;analyse et des
          signaux. Tu places tes paris où tu veux. 18+ — joue responsable. Joueurs Info
          Service&nbsp;: 09 74 75 13 13.
        </p>
      </div>
    </section>
  );
}
