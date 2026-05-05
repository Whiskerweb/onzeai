import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Onze.ai — 4 coachs IA. Foot, basket, tennis, UFC. Toutes les ligues majeures.",
  description:
    "4 coachs IA, un par sport. Foot (L1, PL, Liga, Serie A, Bundes, CL, EL), basket (NBA, EuroLeague, WNBA), tennis (les 4 Grand Chelems + Masters 1000), UFC (PPV, Fight Night, Bellator, PFL). Paris en push Telegram, chat avec ton coach. À partir de 14,90€/mois.",
  icons: {
    icon: "/onze/favicon.png",
    apple: "/onze/webclip.png",
  },
  openGraph: {
    title: "Onze.ai — Le tipster qui dort jamais",
    description:
      "Reçois les paris de ton coach IA direct sur Telegram. Foot, basket, tennis, UFC. Toutes les ligues majeures.",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geist.variable} scroll-smooth`}>
      <body className={geist.className}>{children}</body>
    </html>
  );
}
