const metrics = [
  { value: "2 314", label: "Parieurs actifs", note: "Saison 25–26" },
  { value: "23 645", label: "Signaux émis", note: "12 derniers mois" },
  { value: "+9,3%", label: "Yield moyen", note: "Moyenne des 5 agents" },
  { value: "4,9 / 5", label: "Note moyenne", note: "Sur 1 870 avis" },
];

export function SubHero() {
  return (
    <section className="relative z-10 px-4 py-20 text-center">
      <h2 className="mx-auto max-w-4xl text-balance text-3xl font-medium leading-tight tracking-tight text-white md:text-5xl">
        Le tipster qui dort jamais.{" "}
        <span className="text-zinc-400">À partir de 14,90 €/mois.</span>
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-zinc-400">
        Onze.ai n&apos;est pas un opérateur de paris. C&apos;est de l&apos;analyse et des
        signaux. Tu places où tu veux : Winamax, Betclic, Unibet — peu importe.
      </p>

      <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-2xl border border-white/5 bg-onze-surface p-5 text-left shadow-onze-btn"
          >
            <div className="text-3xl font-medium tracking-tight text-white md:text-4xl">
              {m.value}
            </div>
            <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {m.label}
            </div>
            <div className="mt-1 text-xs text-zinc-500">{m.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
