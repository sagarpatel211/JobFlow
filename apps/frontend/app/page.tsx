import Hero from "@/components/landing/hero";
import { LampComponent } from "@/components/ui/lamp";
import NavBar from "@/components/landing/navbar";
import { Parallax } from "@/components/landing/parallax";
import { features } from "@/lib/constants";
import Footer from "@/components/landing/footer";
import Pricing from "@/components/landing/pricing";
import { BentoGridDisplay } from "@/components/landing/bentodisplay";

export default function Home() {
  return (
    <main>
      <NavBar />
      <Hero />
      <section id="products">
        <Parallax features={features}></Parallax>
      </section>
      <section id="features">
        <BentoGridDisplay />
      </section>
      <section id="pricing" className="mb-36">
        <LampComponent />
        <Pricing />
      </section>
      <Footer />
    </main>
  );
}
