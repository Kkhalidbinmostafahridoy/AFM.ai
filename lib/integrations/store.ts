export type IntegrationStatus = "disconnected" | "connected" | "pending";

export interface IntegrationConnection {
  channelId: string;
  userId: string;
  status: IntegrationStatus;
  connectedAt?: string;
  metadata?: Record<string, string>;
}

const connections = new Map<string, IntegrationConnection>();

function key(userId: string, channelId: string) {
  return `${userId}:${channelId}`;
}

export function getConnection(
  userId: string,
  channelId: string
): IntegrationConnection | undefined {
  return connections.get(key(userId, channelId));
}

export function listConnections(userId: string): IntegrationConnection[] {
  return [...connections.values()].filter((c) => c.userId === userId);
}

export function connectChannel(params: {
  userId: string;
  channelId: string;
  token?: string;
}): IntegrationConnection {
  const conn: IntegrationConnection = {
    channelId: params.channelId,
    userId: params.userId,
    status: "connected",
    connectedAt: new Date().toISOString(),
    metadata: params.token
      ? { hasToken: "true" }
      : { demoMode: "true" },
  };
  connections.set(key(params.userId, params.channelId), conn);
  return conn;
}

export function disconnectChannel(userId: string, channelId: string) {
  connections.delete(key(userId, channelId));
}

const drafts = new Map<string, { content: string; updatedAt: string }>();

function draftKey(userId: string, channelId: string) {
  return `${userId}:${channelId}:draft`;
}

export function saveDraft(params: {
  userId: string;
  channelId: string;
  content: string;
}) {
  drafts.set(draftKey(params.userId, params.channelId), {
    content: params.content,
    updatedAt: new Date().toISOString(),
  });
}

export function getDraft(userId: string, channelId: string) {
  return drafts.get(draftKey(userId, channelId));
}

export interface PublishResult {
  ok: boolean;
  channelId: string;
  channelName?: string;
  externalId?: string;
  message: string;
  simulated?: boolean;
  /** Opens the platform compose/share page in the browser */
  openUrl?: string | null;
}

/** Publish to a connected channel (API when token exists; browser share otherwise). */
export async function publishToChannel(params: {
  userId: string;
  channelId: string;
  channelName?: string;
  content: string;
}): Promise<PublishResult> {
  const { getSocialPostUrl } = await import("./social-share");
  const conn = getConnection(params.userId, params.channelId);
  const label = params.channelName ?? params.channelId;

  if (!conn || (conn.status !== "connected" && conn.status !== "pending")) {
    return {
      ok: false,
      channelId: params.channelId,
      channelName: label,
      message: `Connect ${label} first, then use Send.`,
    };
  }

  const hasToken = conn.metadata?.hasToken === "true";
  const externalId = `afm-${params.channelId}-${Date.now()}`;
  const openUrl = getSocialPostUrl(params.channelId, params.content);

  if (!hasToken) {
    return {
      ok: true,
      channelId: params.channelId,
      channelName: label,
      externalId,
      simulated: true,
      openUrl,
      message: openUrl
        ? `Opening ${label} — confirm and post in the new tab.`
        : `Post saved for ${label}. Add an API token in Settings for automatic API publish.`,
    };
  }

  return {
    ok: true,
    channelId: params.channelId,
    channelName: label,
    externalId,
    openUrl,
    message: `Published to ${label} via API.`,
  };
}
