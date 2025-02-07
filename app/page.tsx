import Hero from "@/components/landing/hero";
import { LampComponent } from "@/components/ui/lamp";
import NavBar from "@/components/landing/navbar";
import { Parallax } from "@/components/landing/parallax";
import { features } from "@/lib/constants";
import Footer from "@/components/landing/footer";
import Pricing from "@/components/landing/pricing";

export default function Home() {
  return (
    <main>
      <NavBar />
      <Hero />
      <Parallax features={features}></Parallax>
      <section className="mt-[-500px]">
        <LampComponent />
        <Pricing />
        <Footer />
      </section>
    </main>
  );
}
