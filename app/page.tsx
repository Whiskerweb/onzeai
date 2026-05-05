import { PromoBar } from "./_components/PromoBar";
import { Nav } from "./_components/Nav";
import { Hero } from "./_components/Hero";
import { SubHero } from "./_components/SubHero";
import { CoachesShowcase } from "./_components/CoachesShowcase";
import { CharlyWhatsapp } from "./_components/CharlyWhatsapp";
import { Capabilities } from "./_components/Capabilities";
import { Integrations } from "./_components/Integrations";
import { Steps } from "./_components/Steps";
import { Pricing } from "./_components/Pricing";
import { Testimonials } from "./_components/Testimonials";
import { Faq } from "./_components/Faq";
import { FinalCta } from "./_components/FinalCta";
import { Footer } from "./_components/Footer";
import { FreePickPopup } from "./_components/FreePickPopup";
import { FreeMatchBanner } from "./_components/FreeMatchBanner";
import { StickyFreeButton } from "./_components/StickyFreeButton";

export default function Home() {
  return (
    <>
      <PromoBar />
      <Nav />
      <Hero />
      <CoachesShowcase />
      <FreeMatchBanner />
      <SubHero />
      <CharlyWhatsapp />
      <Capabilities />
      <Integrations />
      <Steps />
      <FreeMatchBanner />
      <Pricing />
      <Testimonials />
      <Faq />
      <FinalCta />
      <Footer />
      <FreePickPopup />
      <StickyFreeButton />
    </>
  );
}
