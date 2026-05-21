/** Client-side time buckets for session analytics. */

export interface TimeBuckets {
  activeMs: number;
  idleMs: number;
  aiInteractionMs: number;
  pageViewMs: number;
  workflowMs: number;
  websocketMs: number;
  workspaceMs: number;
  videoRenderMs: number;
  imageGenMs: number;
  researchMs: number;
  agentMs: number;
  backgroundMs: number;
}

export function createTimeBuckets(): TimeBuckets {
  return {
    activeMs: 0,
    idleMs: 0,
    aiInteractionMs: 0,
    pageViewMs: 0,
    workflowMs: 0,
    websocketMs: 0,
    workspaceMs: 0,
    videoRenderMs: 0,
    imageGenMs: 0,
    researchMs: 0,
    agentMs: 0,
    backgroundMs: 0,
  };
}

export type TimeBucketKey = keyof TimeBuckets;

const IDLE_THRESHOLD_MS = 60_000;
const HEARTBEAT_MS = 30_000;

export { IDLE_THRESHOLD_MS, HEARTBEAT_MS };
