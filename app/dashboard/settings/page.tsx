"use client";

import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Zap, CreditCard, Loader2, Check } from "lucide-react";
import { FREE_DAILY_LIMIT, PREMIUM_PRICE } from "@/lib/constants";
import { PersonalitySettings } from "@/components/afm/personality-settings";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

export default function SettingsPage() {
  const [credits, setCredits] = useState<{
    plan: string;
    used: number;
    limit: number;
    remaining: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Welcome to Premium!", description: "You now have unlimited generations" });
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/credits")
      .then((r) => r.json())
      .then(setCredits)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Checkout failed", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManage = async () => {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast({ title: "Error", description: data.error, variant: "destructive" });
    } catch {
      toast({ title: "Error", description: "Portal failed", variant: "destructive" });
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your subscription and account
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              <PersonalitySettings />
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-violet-500" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>
                    {credits?.plan === "premium"
                      ? "You have unlimited script generations"
                      : `${FREE_DAILY_LIMIT} generations per day on the free plan`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold capitalize">
                      {credits?.plan || "Free"}
                    </span>
                    {credits?.plan === "premium" && (
                      <span className="inline-flex items-center gap-1 text-sm text-green-500">
                        <Check className="h-4 w-4" /> Active
                      </span>
                    )}
                  </div>

                  {credits?.plan !== "premium" && (
                    <div className="text-sm text-muted-foreground mb-4">
                      Used today: {credits?.used || 0} / {FREE_DAILY_LIMIT}
                    </div>
                  )}

                  <Separator className="my-4" />

                  {credits?.plan === "premium" ? (
                    <Button
                      variant="outline"
                      onClick={handleManage}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CreditCard className="h-4 w-4 mr-2" />
                      )}
                      Manage Subscription
                    </Button>
                  ) : (
                    <div>
                      <p className="text-sm mb-4">
                        Upgrade to Premium for ${PREMIUM_PRICE}/month and get unlimited
                        generations, PDF export, and priority processing.
                      </p>
                      <Button
                        variant="gradient"
                        onClick={handleUpgrade}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Upgrade to Premium
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
