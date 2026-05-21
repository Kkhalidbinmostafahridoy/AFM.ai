"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const demoScript = {
  hook: "Stop scrolling. This one habit made me $10K in 30 days...",
  scenes: [
    { time: "0-3s", text: "Close-up shot, direct eye contact" },
    { time: "3-10s", text: "Show the problem everyone faces" },
    { time: "10-25s", text: "Reveal the 3-step solution" },
    { time: "25-30s", text: "Strong CTA with urgency" },
  ],
  hashtags: "#viral #shorts #contentcreator #growth",
};

export function DemoPreview() {
  return (
    <section id="demo" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">See it in action</h2>
          <p className="mt-4 text-muted-foreground">
            AI-generated script preview for a 30-second TikTok
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Card className="glass-card overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-white text-sm font-medium">
              Generated Script · TikTok · 30s · Energetic
            </div>
            <CardContent className="p-6 space-y-6">
              <div>
                <span className="text-xs font-medium text-violet-500 uppercase tracking-wider">
                  Viral Hook
                </span>
                <p className="mt-1 text-lg font-semibold">{demoScript.hook}</p>
              </div>

              <div>
                <span className="text-xs font-medium text-blue-500 uppercase tracking-wider">
                  Scene Breakdown
                </span>
                <div className="mt-2 space-y-2">
                  {demoScript.scenes.map((scene, i) => (
                    <div
                      key={i}
                      className="flex gap-3 rounded-lg bg-muted/50 p-3 text-sm"
                    >
                      <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {scene.time}
                      </span>
                      <span>{scene.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-pink-500 uppercase tracking-wider">
                  Hashtags
                </span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {demoScript.hashtags}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
