"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Globe,
  History,
  Download,
  Shield,
  Languages,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Sparkles,
    title: "AI Viral Hooks",
    description: "Scroll-stopping hooks engineered with curiosity gaps and emotional triggers.",
  },
  {
    icon: Zap,
    title: "Platform Optimized",
    description: "Scripts tailored for YouTube Shorts, TikTok, Instagram Reels, and Facebook.",
  },
  {
    icon: Languages,
    title: "Bangla ↔ English AI",
    description:
      "Professional translator with natural, formal, casual, and business modes — powered by Gemini.",
  },
  {
    icon: Globe,
    title: "10+ Script Languages",
    description: "Generate scripts in English, Spanish, French, Hindi, Arabic, and more.",
  },
  {
    icon: History,
    title: "Script History",
    description: "Save, search, edit, and revisit all your generated scripts anytime.",
  },
  {
    icon: Download,
    title: "Export Anywhere",
    description: "Copy, download JSON, or export professional PDF scripts instantly.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your scripts are encrypted and stored securely. Only you can access them.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">
            Everything you need to go viral
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From hook to hashtags — our AI generates complete video scripts
            optimized for maximum engagement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card h-full hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
