"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FREE_DAILY_LIMIT, PREMIUM_PRICE } from "@/lib/constants";

const plans = [
  {
    name: "Free",
    price: 0,
    description: "Perfect for getting started",
    features: [
      `${FREE_DAILY_LIMIT} script generations per day`,
      "All platforms supported",
      "Basic script output",
      "Script history",
      "Copy to clipboard",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Premium",
    price: PREMIUM_PRICE,
    description: "For serious content creators",
    features: [
      "Unlimited script generations",
      "All platforms supported",
      "Full script output + extras",
      "Unlimited script history",
      "Export PDF & JSON",
      "Priority AI processing",
      "Multi-language support",
    ],
    cta: "Upgrade to Premium",
    href: "/sign-up",
    popular: true,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 md:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold">Simple, transparent pricing</h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you&apos;re ready to scale
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={`glass-card h-full relative ${
                  plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white">
                      <Zap className="h-3 w-3" /> Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "gradient" : "outline"}
                    className="w-full"
                    asChild
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
