"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Lock, ArrowRight, AlertCircle } from "lucide-react";
import { coaches, type CoachId } from "../../_data/coaches";
import type { Fixture } from "../../_data/fixtures";
import { PLAN_CONFIG, type PlanId } from "@/lib/plan-config";

type Props = {
  initialPlan: PlanId;
  initialCoachIds: CoachId[];
  freeFixture: Fixture | null;
};

export function Wizard({ initialPlan, initialCoachIds, freeFixture }: Props) {
  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [selected, setSelected] = useState<Set<CoachId>>(() => {
    const max = PLAN_CONFIG[initialPlan].maxCoaches;
    return new Set(initialCoachIds.slice(0, max));
  });
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cfg = PLAN_CONFIG[plan];
  const max = cfg.maxCoaches;

  const remaining = useMemo(() => Math.max(0, max - selected.size), [max, selected.size]);
  const canSubmit = selected.size === max && /.+@.+\..+/.test(email);

  function changePlan(next: PlanId) {
    setPlan(next);
    const nextMax = PLAN_CONFIG[next].maxCoaches;
    if (selected.size > nextMax) {
      // Trim down preserving insertion order
      setSelected(new Set(Array.from(selected).slice(0, nextMax)));
    }
  }

  function toggleCoach(id: CoachId) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= max) return; // hard cap
      next.add(id);
    }
    setSelected(next);
  }

  async function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            coachIds: Array.from(selected),
            email,
            freeFixtureId: freeFixture?.id ?? null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) {
          throw new Error(data?.error ?? "Impossible de démarrer le paiement.");
        }
        window.location.href = data.url as string;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-onze-pitch-soft">
        Démarre ton essai · 7 jours offerts
      </div>
      <h1 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
        Choisis ton plan,{" "}
        <span className="text-gradient-pitch">choisis tes coachs.</span>
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Carte demandée pour activer l&apos;essai, rien n&apos;est débité avant le 8ᵉ jour.
        Annulation libre, en un clic, depuis le bot.
      </p>

      {freeFixture && <FreePickBanner fixture={freeFixture} />}

      {/* Step 1 — Plan */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">1. Ton plan</h2>
          <span className="text-xs uppercase tracking-widest text-zinc-500">
            Tu peux changer plus tard
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(["solo", "squad", "all"] as PlanId[]).map((id) => {
            const c = PLAN_CONFIG[id];
            const active = plan === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => changePlan(id)}
                className={`rounded-2xl border p-5 text-left shadow-onze-btn transition-all ${
                  active
                    ? "border-onze-pitch bg-onze-pitch/10 ring-1 ring-onze-pitch/40"
                    : "border-white/5 bg-onze-surface hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    {c.name}
                  </span>
                  {active && (
                    <span className="grid size-5 place-items-center rounded-full bg-onze-pitch text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-medium tracking-tight">
                    {c.monthlyEUR.toString().replace(".", ",")} €
                  </span>
                  <span className="text-xs text-zinc-500">/mois</span>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {c.maxCoaches} {c.maxCoaches > 1 ? "coachs" : "coach"} ·{" "}
                  {c.monthlyMessages === Infinity
                    ? "chat illimité"
                    : `${c.monthlyMessages} messages chat / jour`}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 2 — Coaches */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            2. Tes coachs{" "}
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {selected.size} / {max} sélectionné{max > 1 ? "s" : ""}
            </span>
          </h2>
          {remaining > 0 && (
            <span className="text-xs font-semibold uppercase tracking-widest text-onze-pitch-soft">
              Encore {remaining} à choisir
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((coach) => {
            const isSelected = selected.has(coach.id);
            const disabled = !isSelected && selected.size >= max;
            return (
              <button
                key={coach.id}
                type="button"
                onClick={() => toggleCoach(coach.id)}
                disabled={disabled}
                aria-pressed={isSelected}
                className={`group relative overflow-hidden rounded-2xl border p-4 text-left shadow-onze-btn transition-all ${
                  isSelected
                    ? "border-onze-pitch bg-onze-pitch/10"
                    : disabled
                    ? "cursor-not-allowed border-white/5 bg-onze-surface/50 opacity-50"
                    : "border-white/5 bg-onze-surface hover:border-white/15"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10"
                    style={{ backgroundColor: `${coach.color}30` }}
                  >
                    {coach.portrait ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coach.portrait}
                        alt={coach.name}
                        className="absolute inset-0 size-full object-cover"
                        style={{ objectPosition: "50% 8%", transform: "scale(1.5)" }}
                      />
                    ) : (
                      <coach.Icon className="size-6 text-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold tracking-tight">
                        {coach.name}
                      </span>
                      {isSelected && (
                        <span className="grid size-5 shrink-0 place-items-center rounded-full bg-onze-pitch text-white">
                          <Check className="size-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {coach.flag} {coach.sport}
                    </div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-zinc-400">{coach.vibe}</p>
                <p className="mt-2 line-clamp-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                  {coach.competitionsShort}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Step 3 — Email + submit */}
      <section className="mt-10 rounded-2xl border border-white/5 bg-onze-surface p-6 shadow-onze-btn">
        <h2 className="text-lg font-semibold tracking-tight">3. Ton email</h2>
        <p className="mt-1 text-xs text-zinc-400">
          Pour ton reçu et la facturation. Tu pourras te connecter au bot avec ton compte
          Telegram juste après.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="email"
            inputMode="email"
            required
            placeholder="ton@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-onze-bg px-4 py-3 text-sm placeholder:text-zinc-600 focus:border-onze-pitch focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-onze-pitch px-6 py-3 text-sm font-semibold text-white shadow-onze-btn transition-all hover:bg-onze-pitch-soft disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Préparation…
              </>
            ) : (
              <>
                Démarrer mon essai 7 jours <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <ul className="mt-5 grid gap-2 text-xs text-zinc-500 sm:grid-cols-3">
          <li className="flex items-center gap-1.5">
            <Lock className="size-3" /> Paiement Stripe sécurisé
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="size-3 text-onze-pitch-soft" /> 7 jours gratuits, rien débité avant
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="size-3 text-onze-pitch-soft" /> Annulation libre, en un clic
          </li>
        </ul>
      </section>
    </div>
  );
}

function FreePickBanner({ fixture }: { fixture: Fixture }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-2xl border border-onze-pitch/30 bg-onze-pitch/10 p-4 shadow-onze-btn">
      <div
        className="grid size-10 shrink-0 place-items-center rounded-lg text-white"
        style={{ backgroundColor: fixture.coachColor }}
      >
        ◆
      </div>
      <div className="text-sm">
        <div className="font-semibold tracking-tight">
          Ton pronostic offert pour <span className="text-onze-pitch-soft">{fixture.home}</span> –{" "}
          <span className="text-onze-pitch-soft">{fixture.away}</span> est prêt.
        </div>
        <div className="text-xs text-zinc-400">
          {fixture.flag} {fixture.league} · Coup d&apos;envoi {fixture.kickoff} · Coach :{" "}
          {fixture.coachName} · Combiné cote ×{fixture.cote}. Tu le déverrouilles dès la fin de
          l&apos;activation.
        </div>
      </div>
    </div>
  );
}
