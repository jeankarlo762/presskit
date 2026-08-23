import { GrainOverlay } from "../components/landing/GrainOverlay";
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { PainPoints } from "../components/landing/PainPoints";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ProductDemo } from "../components/landing/ProductDemo";
import { Features } from "../components/landing/Features";
import { Audiences } from "../components/landing/Audiences";
import { Pricing } from "../components/landing/Pricing";
import { Security } from "../components/landing/Security";
import { SocialProof } from "../components/landing/SocialProof";
import { FAQ } from "../components/landing/FAQ";
import { FinalCTA } from "../components/landing/FinalCTA";
import { Footer } from "../components/landing/Footer";

export default function Home() {
  return (
    <>
      <GrainOverlay />
      <Header />
      <main>
        <Hero />
        <PainPoints />
        <HowItWorks />
        <ProductDemo />
        <Features />
        <Audiences />
        <Pricing />
        <Security />
        <SocialProof />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
