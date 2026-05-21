"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  Download,
  Loader2,
  Languages,
  Star,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/copy-button";
import { TypingAnimation } from "@/components/typing-animation";
import { toast } from "@/hooks/use-toast";
import { downloadText } from "@/lib/utils";
import type {
  TranslationDirection,
  TranslationResult,
  TranslationStyle,
} from "@/types/translation";

const STYLES: { value: TranslationStyle; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "formal", label: "Formal" },
  { value: "casual", label: "Casual" },
  { value: "business", label: "Business" },
];

interface TranslatorPanelProps {
  supabaseReady?: boolean;
}

export function TranslatorPanel({ supabaseReady = true }: TranslatorPanelProps) {
  const [direction, setDirection] = useState<TranslationDirection>("bn_en");
  const [style, setStyle] = useState<TranslationStyle>("natural");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notes, setNotes] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  const sourceLabel = direction === "bn_en" ? "বাংলা (Bangla)" : "English";
  const targetLabel = direction === "bn_en" ? "English" : "বাংলা (Bangla)";

  const swapDirection = () => {
    setDirection((d) => (d === "bn_en" ? "en_bn" : "bn_en"));
    if (output) {
      setInput(output);
      setOutput("");
      setNotes(undefined);
    }
  };

  const speak = (text: string, lang: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast({
        title: "Speech not supported",
        description: "Your browser does not support text-to-speech.",
        variant: "destructive",
      });
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    window.speechSynthesis.speak(u);
  };

  const handleTranslate = useCallback(async () => {
    if (!supabaseReady) {
      toast({
        title: "Supabase not configured",
        variant: "destructive",
      });
      return;
    }
    if (!input.trim()) {
      toast({ title: "Enter text to translate", variant: "destructive" });
      return;
    }

    setLoading(true);
    setOutput("");
    setNotes(undefined);
    setAnimateOut(false);

    try {
      const res = await fetch("/api/forge/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.trim(),
          direction,
          style,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast({
          title: data.error ?? "Translation failed",
          description:
            data.message ??
            (res.status === 502
              ? "Gemini rejected the request — check GEMINI_API_KEY in .env.local and restart the dev server."
              : undefined),
          variant: "destructive",
        });
        return;
      }

      const t = data.translation as TranslationResult;
      setOutput(t.translated_text);
      setNotes(t.notes);
      setAnimateOut(true);
      toast({ title: "Translation complete" });
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [input, direction, style, supabaseReady]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="glass-card border-violet-500/10">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Languages className="h-5 w-5 text-violet-500" />
              Bangla ↔ English AI Translator
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={direction}
                onValueChange={(v) => setDirection(v as TranslationDirection)}
              >
                <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                  <TabsTrigger value="bn_en" className="text-xs sm:text-sm">
                    বাংলা → EN
                  </TabsTrigger>
                  <TabsTrigger value="en_bn" className="text-xs sm:text-sm">
                    EN → বাংলা
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={swapDirection}
                title="Swap direction"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="space-y-2 flex-1 min-w-[140px]">
            <Label>Style</Label>
            <Select
              value={style}
              onValueChange={(v) => setStyle(v as TranslationStyle)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="gradient"
            className="w-full sm:w-auto"
            onClick={handleTranslate}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Translating…
              </>
            ) : (
              <>
                <Languages className="h-4 w-4" />
                Translate
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <motion.div
        layout
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card className="glass-card flex flex-col min-h-[320px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {sourceLabel}
            </CardTitle>
            {input && (
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    speak(input, direction === "bn_en" ? "bn-BD" : "en-US")
                  }
                  title="Listen"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <CopyButton text={input} label="" />
              </div>
            )}
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                direction === "bn_en"
                  ? "বাংলায় লিখুন…"
                  : "Type in English…"
              }
              className="flex-1 min-h-[240px] resize-none text-base"
              dir={direction === "bn_en" ? "auto" : "ltr"}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {input.length} / 8000 characters
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card flex flex-col min-h-[320px] border-violet-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-600 dark:text-violet-400">
              {targetLabel}
            </CardTitle>
            {output && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-1"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    speak(output, direction === "bn_en" ? "en-US" : "bn-BD")
                  }
                  title="Listen"
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
                <CopyButton text={output} label="" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    downloadText(
                      output,
                      `viralforge-translation-${Date.now()}.txt`
                    )
                  }
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </CardHeader>
          <CardContent className="flex-1">
            {loading ? (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0.5 }}
                animate={{ opacity: 1 }}
              >
                <div className="h-4 bg-muted rounded-lg animate-pulse w-full" />
                <div className="h-4 bg-muted rounded-lg animate-pulse w-5/6" />
                <div className="h-4 bg-muted rounded-lg animate-pulse w-4/6" />
              </motion.div>
            ) : output ? (
              <div className="space-y-3">
                {animateOut ? (
                  <TypingAnimation
                    text={output}
                    className="text-base leading-relaxed whitespace-pre-wrap block"
                    speed={8}
                  />
                ) : (
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {output}
                  </p>
                )}
                {notes && (
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    <Star className="inline h-3 w-3 mr-1" />
                    {notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-12 text-center">
                Translation will appear here
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

