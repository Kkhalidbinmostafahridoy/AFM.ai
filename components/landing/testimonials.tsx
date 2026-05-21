"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "TikTok Creator · 2.1M followers",
    content: "ViralForge cut my scripting and shot planning from hours to minutes. Shorts finally feel intentional, not random.",
    avatar: "SC",
  },
  {
    name: "Marcus Johnson",
    role: "YouTube Shorts Creator",
    content: "The hooks it generates are insane. I've had 3 videos hit 1M+ views using scripts from this tool. Game changer.",
    avatar: "MJ",
  },
  {
    name: "Priya Sharma",
    role: "Instagram Reels Creator",
    content: "Multi-language support is perfect for my global audience. I generate scripts in Hindi and English daily.",
    avatar: "PS",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Loved by creators</h2>
          <p className="mt-4 text-muted-foreground">
            Join thousands of content creators going viral with AI
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="glass-card h-full">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-6">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white text-sm font-medium">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
