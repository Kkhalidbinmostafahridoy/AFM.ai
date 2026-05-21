import type { VideoPlanResult } from "@/lib/gemini/generate-video-plan";
import type { VideoAnalysisResult } from "@/lib/gemini/analyze-video";

export type PipelineJobType = "video_plan" | "video_analysis_recap";

export interface PipelineSubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
  textBn?: string;
}

export interface PipelineSceneAsset {
  index: number;
  imageBase64?: string;
  imageMimeType: string;
  subtitle: string;
  subtitleBn?: string;
  durationMs: number;
  visualPrompt: string;
  videoPrompt?: string;
}

export interface PipelineOutput {
  jobType: PipelineJobType;
  status: "complete" | "partial";
  renderMode: "slideshow";
  voiceover: string;
  title: string;
  aspectRatio: "9:16" | "16:9";
  narrationAudioBase64?: string;
  narrationMimeType?: string;
  scenes: PipelineSceneAsset[];
  subtitles: PipelineSubtitleCue[];
  translations?: VideoPlanResult["translations"];
  warnings?: string[];
}

export interface VideoPlanPipelineInput {
  plan: VideoPlanResult;
  topic: string;
  maxScenes?: number;
}

export interface AnalysisRecapPipelineInput {
  analysis: VideoAnalysisResult;
  sourceUrl: string;
  maxScenes?: number;
}
