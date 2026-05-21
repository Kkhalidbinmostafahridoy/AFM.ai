import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { PricingSection } from "@/components/landing/pricing-section";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for ViralScript AI",
};

export default function PricingPage() {
  return (
    <main>
      <Navbar />
      <div className="pt-24">
        <PricingSection />
        <FAQ />
      </div>
      <Footer />
    </main>
  );
}
