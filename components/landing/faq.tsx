"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "What platforms does ViralForge AI support?",
    a: "We support YouTube Shorts, TikTok, Instagram Reels, and Facebook Videos. Each script is optimized for the specific platform's algorithm and audience behavior.",
  },
  {
    q: "How many scripts can I generate on the free plan?",
    a: "The free plan includes 5 script generations per day. Credits reset at midnight UTC. Upgrade to Premium for unlimited generations.",
  },
  {
    q: "What languages are supported?",
    a: "We support 10+ languages including English, Spanish, French, German, Portuguese, Hindi, Arabic, Japanese, Korean, and Chinese.",
  },
  {
    q: "Can I edit generated scripts?",
    a: "Yes! All scripts are saved to your history where you can view, edit, copy, export as PDF/JSON, or delete them.",
  },
  {
    q: "What AI model powers the script generation?",
    a: "We use Google Gemini (text + JSON) and Imagen-class models through the official @google/genai SDK, with prompts tuned for viral short-form.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. You can cancel your Premium subscription anytime from your dashboard settings. You'll retain access until the end of your billing period.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 md:py-32">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent>{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
