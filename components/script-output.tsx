"use client";

import { motion } from "framer-motion";
import {
  Hash,
  Image,
  Megaphone,
  Music,
  Sparkles,
  Video,
  Camera,
  MessageSquare,
  Clapperboard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/copy-button";
import { TypingAnimation } from "@/components/typing-animation";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import type { GeneratedScript } from "@/types";
import { downloadJSON } from "@/lib/utils";
import { exportScriptToPDF } from "@/lib/export-pdf";

interface ScriptOutputProps {
  script: GeneratedScript;
  topic: string;
  animate?: boolean;
}

export function ScriptOutput({ script, topic, animate = true }: ScriptOutputProps) {
  const panels = [
    {
      icon: Sparkles,
      title: "Viral Hook",
      content: script.hook,
      color: "text-violet-500",
    },
    {
      icon: Video,
      title: "Full Script",
      content: null,
      scenes: script.script,
      color: "text-blue-500",
    },
    {
      icon: Camera,
      title: "Camera Angles",
      content: script.camera_angles?.join("\n") || script.script.map((s) => s.camera_angle).filter(Boolean).join("\n"),
      color: "text-cyan-500",
    },
    {
      icon: MessageSquare,
      title: "Caption",
      content: script.caption,
      color: "text-green-500",
    },
    {
      icon: Megaphone,
      title: "Call to Action",
      content: script.cta,
      color: "text-orange-500",
    },
    {
      icon: Hash,
      title: "Hashtags",
      content: script.hashtags.join(" "),
      color: "text-pink-500",
    },
    {
      icon: Image,
      title: "Thumbnail Idea",
      content: script.thumbnail_idea,
      color: "text-yellow-500",
    },
    {
      icon: Music,
      title: "Music Suggestion",
      content: script.music_suggestion,
      color: "text-purple-500",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadJSON(script, `viralforge-${topic.slice(0, 20)}.json`)}
        >
          <Download className="h-4 w-4 mr-1.5" />
          JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportScriptToPDF(script, topic)}
        >
          <FileText className="h-4 w-4 mr-1.5" />
          PDF
        </Button>
      </div>

      {script.sections && script.sections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="glass-card overflow-hidden border-violet-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clapperboard className="h-4 w-4 text-violet-500" />
                Cinematic 3-section spine
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {script.sections.map((sec, i) => (
                <div
                  key={`${sec.section}-${i}`}
                  className="rounded-xl bg-muted/50 p-4 space-y-2 border border-border/60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                      {sec.section}
                    </span>
                    <CopyButton
                      text={`${sec.scene}\n${sec.voiceover}\n${sec.camera}\n${sec.subtitle}\n${sec.music}\n${sec.transition}`}
                      label=""
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">{sec.scene}</p>
                  <p className="text-sm font-medium">&ldquo;{sec.voiceover}&rdquo;</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <p><span className="font-medium text-foreground">Camera:</span> {sec.camera}</p>
                    <p><span className="font-medium text-foreground">Subtitle:</span> {sec.subtitle}</p>
                    <p><span className="font-medium text-foreground">Music:</span> {sec.music}</p>
                    <p><span className="font-medium text-foreground">Transition:</span> {sec.transition}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {panels.map((section, index) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="glass-card overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <section.icon className={`h-4 w-4 ${section.color}`} />
                {section.title}
              </CardTitle>
              {section.content && (
                <CopyButton text={section.content} />
              )}
            </CardHeader>
            <CardContent>
              {section.scenes ? (
                <div className="space-y-4">
                  {section.scenes.map((scene, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-muted/50 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Scene {i + 1} · {scene.duration}
                        </span>
                        <CopyButton
                          text={`${scene.scene}\n"${scene.voiceover}"`}
                          label=""
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">{scene.scene}</p>
                      <p className="text-sm font-medium">
                        &ldquo;{scene.voiceover}&rdquo;
                      </p>
                      {scene.camera_angle && (
                        <p className="text-xs text-muted-foreground">
                          📷 {scene.camera_angle}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : section.content ? (
                animate ? (
                  <TypingAnimation
                    text={section.content}
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                )
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
