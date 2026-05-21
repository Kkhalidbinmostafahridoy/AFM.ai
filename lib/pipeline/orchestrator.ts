import type { VideoPlanResult } from "@/lib/gemini/generate-video-plan";
import { sleep } from "@/lib/gemini/retry";
import { generateSceneImage } from "./engines/image-engine";
import { generatePipelineNarration } from "./engines/narration-engine";
import { sceneDurationMs } from "./parse-time";
import { routePipelineTasks } from "./task-router";
import type {
  AnalysisRecapPipelineInput,
  PipelineOutput,
  PipelineSceneAsset,
  PipelineSubtitleCue,
  VideoPlanPipelineInput,
} from "./types";

const DEFAULT_MAX_SCENES = Number(process.env.PIPELINE_MAX_SCENES ?? "2");
const SCENE_IMAGE_DELAY_MS = Number(process.env.PIPELINE_SCENE_DELAY_MS ?? "2000");

function buildSubtitlesFromScenes(
  scenes: Array<{
    t_start: string;
    t_end: string;
    subtitle: string;
    subtitle_bn?: string;
  }>
): PipelineSubtitleCue[] {
  let cursor = 0;
  return scenes.map((shot) => {
    const durationMs = sceneDurationMs(shot.t_start, shot.t_end);
    const cue: PipelineSubtitleCue = {
      startMs: cursor,
      endMs: cursor + durationMs,
      text: shot.subtitle,
      textBn: shot.subtitle_bn,
    };
    cursor += durationMs;
    return cue;
  });
}

async function generateSceneImages(
  shots: VideoPlanResult["shot_list"],
  aspectRatio: string,
  maxScenes: number,
  warnings: string[]
): Promise<PipelineSceneAsset[]> {
  const limited = shots.slice(0, maxScenes);
  const assets: PipelineSceneAsset[] = [];

  for (let i = 0; i < limited.length; i++) {
    const shot = limited[i];
    const prompt =
      shot.image_prompt?.trim() || shot.visual_prompt?.trim() || shot.subtitle;
    const durationMs = sceneDurationMs(shot.t_start, shot.t_end);

    try {
      if (i > 0) await sleep(SCENE_IMAGE_DELAY_MS);
      const imageBase64 = await generateSceneImage({
        prompt,
        aspectRatio,
      });
      assets.push({
        index: i,
        imageBase64,
        imageMimeType: "image/png",
        subtitle: shot.subtitle,
        subtitleBn: shot.subtitle_bn,
        durationMs,
        visualPrompt: shot.visual_prompt,
        videoPrompt: shot.video_prompt,
      });
    } catch (err) {
      warnings.push(
        `Scene ${i + 1} image failed: ${err instanceof Error ? err.message : "unknown"}`
      );
      assets.push({
        index: i,
        imageMimeType: "image/png",
        subtitle: shot.subtitle,
        subtitleBn: shot.subtitle_bn,
        durationMs,
        visualPrompt: shot.visual_prompt,
        videoPrompt: shot.video_prompt,
      });
    }
  }

  return assets;
}

export async function runVideoPlanPipeline(
  input: VideoPlanPipelineInput
): Promise<PipelineOutput> {
  const warnings: string[] = [];
  const maxScenes = input.maxScenes ?? DEFAULT_MAX_SCENES;
  const plan = input.plan;
  const aspectRatio = plan.aspect_ratio ?? "9:16";

  routePipelineTasks({
    includeImages: true,
    includeNarration: true,
    includeTranslations: Boolean(plan.translations),
  });

  const subtitles = buildSubtitlesFromScenes(plan.shot_list);
  const scenes = await generateSceneImages(
    plan.shot_list,
    aspectRatio,
    maxScenes,
    warnings
  );

  const voiceover =
    plan.voiceover?.trim() ||
    plan.narration_script?.trim() ||
    plan.shot_list.map((s) => s.subtitle).join(" ");

  let narrationAudioBase64: string | undefined;
  let narrationMimeType: string | undefined;

  const audio = await generatePipelineNarration({
    script: plan.narration_script || voiceover,
    languageCode: "en-US",
  });
  if (audio) {
    narrationAudioBase64 = audio.audioBase64;
    narrationMimeType = audio.mimeType;
  } else {
    warnings.push(
      "Voice narration unavailable — enable GEMINI_TTS_MODEL or check API billing."
    );
  }

  const hasImages = scenes.some((s) => s.imageBase64);
  const status =
    hasImages && (narrationAudioBase64 || scenes.length > 0)
      ? narrationAudioBase64
        ? "complete"
        : "partial"
      : hasImages
        ? "partial"
        : "partial";

  return {
    jobType: "video_plan",
    status,
    renderMode: "slideshow",
    voiceover,
    title: input.topic,
    aspectRatio,
    narrationAudioBase64,
    narrationMimeType,
    scenes,
    subtitles,
    translations: plan.translations,
    warnings: warnings.length ? warnings : undefined,
  };
}

export async function runAnalysisRecapPipeline(
  input: AnalysisRecapPipelineInput
): Promise<PipelineOutput> {
  const warnings: string[] = [];
  const maxScenes = input.maxScenes ?? Math.min(3, DEFAULT_MAX_SCENES);
  const analysis = input.analysis;

  const recapScenes = analysis.recap_scenes ?? [];
  const voiceover =
    analysis.narration_script?.trim() ||
    analysis.recap_summary?.trim() ||
    analysis.rewritten_script_outline?.slice(0, 500) ||
    "Video recap";

  const pseudoShots = recapScenes.map((s, i) => ({
    t_start: `0:${String(i * 3).padStart(2, "0")}`,
    t_end: `0:${String((i + 1) * 3).padStart(2, "0")}`,
    subtitle: s.subtitle,
    subtitle_bn: s.subtitle_bn,
    visual_prompt: s.visual_prompt,
    image_prompt: s.image_prompt ?? s.visual_prompt,
    video_prompt: s.video_prompt ?? s.visual_prompt,
    transition: "cut",
    music_cue: "",
  }));

  const subtitles = buildSubtitlesFromScenes(pseudoShots);
  const scenes = await generateSceneImages(
    pseudoShots as VideoPlanResult["shot_list"],
    "9:16",
    maxScenes,
    warnings
  );

  let narrationAudioBase64: string | undefined;
  let narrationMimeType: string | undefined;
  const audio = await generatePipelineNarration({
    script: voiceover,
    languageCode: "en-US",
  });
  if (audio) {
    narrationAudioBase64 = audio.audioBase64;
    narrationMimeType = audio.mimeType;
  } else {
    warnings.push("Recap narration audio could not be generated.");
  }

  return {
    jobType: "video_analysis_recap",
    status: scenes.some((s) => s.imageBase64) ? "partial" : "partial",
    renderMode: "slideshow",
    voiceover,
    title: analysis.recap_title ?? "Video recap",
    aspectRatio: "9:16",
    narrationAudioBase64,
    narrationMimeType,
    scenes,
    subtitles,
    warnings: warnings.length ? warnings : undefined,
  };
}
