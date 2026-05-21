"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-32">
      <motion.div className="absolute inset-0 bg-hero-glow" />
      <div className="container relative mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm mb-6">
            <Sparkles className="h-4 w-4 text-violet-500" />
            All-in-One AI Creator Platform
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto">
            All-in-One{" "}
            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
              AI Creator
            </span>{" "}
            Platform
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate videos, scripts, images, translations, and viral content using Gemini AI.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <Button variant="gradient" size="lg" asChild>
                <Link href="/sign-up">
                  Start Creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="#demo">
                  <Play className="h-4 w-4" />
                  See Demo
                </Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button variant="gradient" size="lg" asChild>
                <Link href="/dashboard">
                  Start Creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Free plan · 5 generations/day · Bangla ↔ English translator included
          </p>
        </motion.div>
      </div>
    </section>
  );
}
