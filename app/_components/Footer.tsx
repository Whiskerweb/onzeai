import { Mail, Phone, ChevronDown } from "lucide-react";
import { OnzeLogo } from "./OnzeLogo";

function Instagram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
function XLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2H21.5l-7.5 8.572L23 22h-7.05l-5.52-6.92L4.06 22H.804l8.05-9.196L1 2h7.224l5 6.32L18.244 2zm-1.235 18h1.83L7.066 4H5.1l11.91 16z" />
    </svg>
  );
}
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11.94 16.21l-.42 4.04c.6 0 .86-.26 1.17-.57l2.81-2.7 5.83 4.27c1.07.59 1.83.28 2.12-.99l3.84-17.97c.34-1.59-.58-2.21-1.62-1.83L1.34 9.5c-1.55.59-1.52 1.45-.27 1.84l5.78 1.8 13.4-8.45c.63-.42 1.21-.19.73.23l-9.04 11.29z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#0a0908] px-4 pb-8 pt-16">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-12 md:flex-row lg:gap-24">
        <div className="space-y-6 md:w-1/3">
          <OnzeLogo size={26} />

          <p className="max-w-xs text-sm text-zinc-400">
            4 coachs IA, 4 sports. Foot, basket, tennis, UFC — toutes les ligues majeures.
            Direct sur Telegram.
          </p>

          <div className="space-y-2 text-sm text-zinc-500">
            <p className="flex items-center gap-2">
              <Mail className="size-4" /> hey@onze.ai
            </p>
            <p className="flex items-center gap-2">
              <Phone className="size-4" /> Joueurs Info Service · 09 74 75 13 13
            </p>
          </div>

          <div className="flex items-center gap-3 text-zinc-400">
            <a
              href="#"
              className="flex size-10 items-center justify-center rounded-md border border-white/5 bg-white/5 transition-colors hover:text-white"
              aria-label="Telegram"
            >
              <TelegramIcon className="size-4" />
            </a>
            <a
              href="#"
              className="flex size-10 items-center justify-center rounded-md border border-white/5 bg-white/5 transition-colors hover:text-white"
              aria-label="X / Twitter"
            >
              <XLogo className="size-4" />
            </a>
            <a
              href="#"
              className="flex size-10 items-center justify-center rounded-md border border-white/5 bg-white/5 transition-colors hover:text-white"
              aria-label="Instagram"
            >
              <Instagram className="size-4" />
            </a>
          </div>

          <div className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm transition-colors hover:bg-white/10">
            <img
              src="/onze/flags/fr.svg"
              alt="FR"
              className="h-3 w-4 rounded-[2px] object-cover"
            />
            <span>Français</span>
            <ChevronDown className="size-3 text-zinc-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 md:w-2/3 lg:grid-cols-3">
          <FooterCol
            title="Produit"
            links={["Coachs", "Cerveau", "Telegram", "Tarifs", "Onboarding"]}
          />
          <FooterCol
            title="Squad"
            links={[
              "Dembefric · Football",
              "Curritique · Basket",
              "Federace · Tennis",
              "McTriple · UFC",
            ]}
          />
          <FooterCol
            title="Légal"
            links={[
              "CGU / CGV",
              "Politique de confidentialité",
              "Mentions légales & cookies",
              "18+ — joue responsable",
            ]}
          />
        </div>
      </div>

      <div className="mx-auto mt-16 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-600 md:flex-row">
        <p>© 2026 Onze.ai · Tous droits réservés.</p>
        <p>Made in Paris · Imprimé sur Telegram</p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h5 className="mb-4 text-sm font-medium text-white">{title}</h5>
      <ul className="space-y-3 text-sm text-zinc-400">
        {links.map((l) => (
          <li key={l}>
            <a href="#" className="transition-colors hover:text-white">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
