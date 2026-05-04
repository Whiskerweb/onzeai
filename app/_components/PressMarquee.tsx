const logos = [
  { src: "/onze/press/tf1.svg", alt: "TF1" },
  { src: "/onze/press/le-figaro.svg", alt: "Le Figaro" },
  { src: "/onze/press/canal-news.svg", alt: "CNews" },
  { src: "/onze/press/bfm.svg", alt: "BFM" },
  { src: "/onze/press/bfm-business.svg", alt: "BFM Business" },
  { src: "/onze/press/lci.svg", alt: "LCI" },
  { src: "/onze/press/w9.svg", alt: "W9" },
  { src: "/onze/press/bpifrance.svg", alt: "Bpifrance" },
];

export function PressMarquee() {
  const row = [...logos, ...logos];
  return (
    <section className="relative z-10 mx-auto -mt-10 w-full max-w-6xl overflow-hidden px-4">
      <div
        className="flex w-[200%] opacity-70 grayscale transition duration-500 hover:opacity-100"
        style={{ animation: "var(--animate-marquee)" }}
      >
        <div className="flex w-1/2 items-center justify-around gap-12 px-4">
          {row.slice(0, logos.length).map((l, i) => (
            <img
              key={`a-${i}`}
              src={l.src}
              alt={l.alt}
              className="h-7 w-auto object-contain opacity-90 invert md:h-9"
            />
          ))}
        </div>
        <div className="flex w-1/2 items-center justify-around gap-12 px-4">
          {row.slice(logos.length).map((l, i) => (
            <img
              key={`b-${i}`}
              src={l.src}
              alt={l.alt}
              className="h-7 w-auto object-contain opacity-90 invert md:h-9"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
