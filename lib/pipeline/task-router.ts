export type PipelineTask =
  | "generate_images"
  | "generate_narration"
  | "build_subtitles"
  | "apply_translations";

export interface RoutedPipelineTasks {
  tasks: PipelineTask[];
}

/** Decide which media engines run for a job. */
export function routePipelineTasks(options: {
  includeImages: boolean;
  includeNarration: boolean;
  includeTranslations: boolean;
}): RoutedPipelineTasks {
  const tasks: PipelineTask[] = ["build_subtitles"];

  if (options.includeImages) tasks.unshift("generate_images");
  if (options.includeNarration) tasks.push("generate_narration");
  if (options.includeTranslations) tasks.push("apply_translations");

  return { tasks };
}
