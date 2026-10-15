import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { HowItWorks } from "../components/landing/HowItWorks";
import { Comparison } from "../components/landing/Comparison";
import { Examples } from "../components/landing/Examples";
import { Pricing } from "../components/landing/Pricing";
import { FAQ } from "../components/landing/FAQ";
import { FinalCTA } from "../components/landing/FinalCTA";
import { Footer } from "../components/landing/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Comparison />
        <Examples />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
