"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PipelineOutput } from "@/lib/pipeline/types";

interface SlideshowPlayerProps {
  pipeline: PipelineOutput;
}

export function SlideshowPlayer({ pipeline }: SlideshowPlayerProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scenes = pipeline.scenes.filter((s) => s.imageBase64);
  const hasVisuals = scenes.length > 0;
  const current = hasVisuals
    ? scenes[sceneIndex] ?? scenes[0]
    : pipeline.scenes[0];
  const activeSubtitle =
    pipeline.subtitles[sceneIndex]?.text ?? current?.subtitle ?? "";

  const audioSrc =
    pipeline.narrationAudioBase64 && pipeline.narrationMimeType
      ? `data:${pipeline.narrationMimeType};base64,${pipeline.narrationAudioBase64}`
      : null;

  const advance = useCallback(() => {
    if (scenes.length <= 1) return;
    setSceneIndex((i) => (i + 1) % scenes.length);
  }, [scenes.length]);

  useEffect(() => {
    if (!playing || !current) return;
    const ms = current.durationMs || 3000;
    const t = window.setTimeout(advance, ms);
    return () => window.clearTimeout(t);
  }, [playing, sceneIndex, current, advance]);

  useEffect(() => {
    if (!playing || !audioRef.current) return;
    audioRef.current.play().catch(() => undefined);
  }, [playing, audioSrc]);

  const togglePlay = () => {
    if (!playing && audioRef.current) {
      audioRef.current.currentTime = 0;
      setSceneIndex(0);
    }
    if (playing && audioRef.current) {
      audioRef.current.pause();
    }
    setPlaying((p) => !p);
  };

  const imageSrc =
    current?.imageBase64 && current.imageMimeType
      ? `data:${current.imageMimeType};base64,${current.imageBase64}`
      : null;

  return (
    <div className="space-y-3">
      <div className="relative mx-auto w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-xl ring-1 ring-border">
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={activeSubtitle || pipeline.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-muted-foreground text-sm p-6 text-center gap-2">
            <p>
              {pipeline.warnings?.length
                ? "Scene images could not be generated."
                : "No scene images in this preview."}
            </p>
            {pipeline.warnings?.[0] && (
              <p className="text-xs opacity-80">{pipeline.warnings[0]}</p>
            )}
            <p className="text-xs">Try again in a minute if Gemini was busy (503).</p>
          </div>
        )}
        {activeSubtitle && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-6 pt-12">
            <p className="text-center text-white text-sm font-medium leading-snug drop-shadow">
              {activeSubtitle}
            </p>
          </div>
        )}
      </div>

      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} preload="auto" className="hidden" />
      )}

      <div className="flex items-center justify-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={togglePlay}>
          {playing ? (
            <>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Play preview
            </>
          )}
        </Button>
        {audioSrc && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Volume2 className="h-3 w-3" />
            AI narration
          </span>
        )}
      </div>

      {scenes.length > 1 && (
        <p className="text-center text-xs text-muted-foreground">
          Scene {sceneIndex + 1} of {scenes.length}
          {pipeline.renderMode === "slideshow" &&
            " · Full MP4 export runs on a render worker (see docs)"}
        </p>
      )}
    </div>
  );
}
