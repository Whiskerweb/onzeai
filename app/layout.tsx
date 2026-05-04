import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "Onze.ai — Cinq coachs IA. Cinq championnats. Plus jamais en aveugle.",
  description:
    "Cinq coachs IA, un par grand championnat européen. Signaux quotidiens sur Telegram, chat illimité avec ton coach. xG, blessures, formes, météo : il a tout en tête. À partir de 14,90€/mois.",
  icons: {
    icon: "/onze/favicon.png",
    apple: "/onze/webclip.png",
  },
  openGraph: {
    title: "Onze.ai — Le tipster qui dort jamais",
    description:
      "Reçois les signaux de ton coach IA sur Telegram. Parle-lui comme à un pote qui aurait mémorisé Opta.",
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
