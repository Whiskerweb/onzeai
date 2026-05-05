"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { coaches, type CoachId } from "../../_data/coaches";
import { PLAN_CONFIG, type PlanId } from "@/lib/plan-config";

type Props = {
  token: string;
  currentPlan: PlanId;
  currentCoachIds: CoachId[];
};

export function UpgradeWizard({ token, currentPlan, currentCoachIds }: Props) {
  const [plan, setPlan] = useState<PlanId>(currentPlan);
  const [selected, setSelected] = useState<Set<CoachId>>(() => {
    const max = PLAN_CONFIG[currentPlan].maxCoaches;
    return new Set(currentCoachIds.slice(0, max));
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const cfg = PLAN_CONFIG[plan];
  const max = cfg.maxCoaches;
  const remaining = useMemo(() => Math.max(0, max - selected.size), [max, selected.size]);

  const samePlan = plan === currentPlan;
  const sameCoaches =
    selected.size === currentCoachIds.length &&
    currentCoachIds.every((id) => selected.has(id));
  const noChange = samePlan && sameCoaches;

  const canSubmit = selected.size === max && !noChange;

  function changePlan(next: PlanId) {
    setPlan(next);
    const nextMax = PLAN_CONFIG[next].maxCoaches;
    if (selected.size > nextMax) {
      // keep insertion order
      setSelected(new Set(Array.from(selected).slice(0, nextMax)));
    }
  }

  function toggleCoach(id: CoachId) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else if (next.size < max) next.add(id);
    setSelected(next);
  }

  async function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/upgrade", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, plan, coachIds: Array.from(selected) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "Erreur lors du changement.");
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue");
      }
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-4 pb-24 pt-8">
        <div className="rounded-2xl border border-onze-pitch/40 bg-onze-surface p-8 shadow-onze-btn">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-onze-pitch-soft">
            ✓ Changement appliqué
          </div>
          <h1 className="text-2xl font-medium tracking-tight">Plan mis à jour.</h1>
          <p className="mt-3 text-sm text-zinc-400">
            Retourne dans <a href="https://t.me/OnziaBot" className="underline">@OnziaBot</a> sur
            Telegram pour continuer. Tes nouveaux coachs sont déjà actifs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-onze-pitch-soft">
        Plan actuel · {PLAN_CONFIG[currentPlan].name}
      </div>
      <h1 className="text-balance text-4xl font-medium tracking-tight md:text-5xl">
        Modifier ton plan ou tes coachs.
      </h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Le changement prend effet immédiatement. La différence de prix est calculée au prorata
        sur ta prochaine facture (proration Stripe).
      </p>

      {/* Plan picker */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Plan</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(["solo", "squad", "all"] as PlanId[]).map((id) => {
            const c = PLAN_CONFIG[id];
            const active = plan === id;
            const isCurrent = id === currentPlan;
            return (
              <button
                key={id}
                type="button"
                onClick={() => changePlan(id)}
                className={`relative rounded-2xl border p-5 text-left shadow-onze-btn transition-all ${
                  active
                    ? "border-onze-pitch bg-onze-pitch/10 ring-1 ring-onze-pitch/40"
                    : "border-white/5 bg-onze-surface hover:border-white/15"
                }`}
              >
                {isCurrent && (
                  <span className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-300">
                    Actuel
                  </span>
                )}
                <div className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  {c.name}
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

      {/* Coach picker */}
      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            Coachs <span className="ml-2 text-sm font-normal text-zinc-500">{selected.size} / {max}</span>
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
            const wasOriginal = currentCoachIds.includes(coach.id);
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
                {wasOriginal && (
                  <span className="absolute right-2 top-2 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-zinc-300">
                    Déjà suivi
                  </span>
                )}
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

      {/* Submit */}
      <section className="mt-10 rounded-2xl border border-white/5 bg-onze-surface p-6 shadow-onze-btn">
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit || isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-onze-pitch px-6 py-3 text-sm font-semibold text-white shadow-onze-btn transition-all hover:bg-onze-pitch-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Application…
            </>
          ) : noChange ? (
            "Aucun changement à appliquer"
          ) : (
            <>
              Confirmer le changement <ArrowRight className="size-4" />
            </>
          )}
        </button>
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </section>
    </div>
  );
}
