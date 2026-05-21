export type AgentTaskStatus = "pending" | "running" | "completed" | "failed";

export interface AgentTask {
  id: string;
  userId: string;
  agentId: string;
  action: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: AgentTaskStatus;
  scheduledAt?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

const tasks = new Map<string, AgentTask>();

function uid() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createAgentTask(params: {
  userId: string;
  agentId: string;
  action: string;
  input: Record<string, unknown>;
  scheduledAt?: string;
}): AgentTask {
  const task: AgentTask = {
    id: uid(),
    userId: params.userId,
    agentId: params.agentId,
    action: params.action,
    input: params.input,
    status: "pending",
    scheduledAt: params.scheduledAt,
    createdAt: new Date().toISOString(),
  };
  tasks.set(task.id, task);
  return task;
}

export function updateAgentTask(
  id: string,
  patch: Partial<Pick<AgentTask, "status" | "output" | "error" | "completedAt">>
): AgentTask | undefined {
  const t = tasks.get(id);
  if (!t) return undefined;
  Object.assign(t, patch);
  tasks.set(id, t);
  return t;
}

export function listAgentTasks(userId: string, agentId?: string): AgentTask[] {
  return [...tasks.values()]
    .filter((t) => t.userId === userId && (!agentId || t.agentId === agentId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

export function getAgentTask(id: string): AgentTask | undefined {
  return tasks.get(id);
}

/** In-memory scheduled alarms (browser notifications triggered client-side). */
const alarms = new Map<string, { userId: string; at: number; label: string; recurring?: string }>();

export function createAlarm(params: {
  userId: string;
  at: string;
  label: string;
  recurring?: string;
}) {
  const id = uid();
  alarms.set(id, {
    userId: params.userId,
    at: new Date(params.at).getTime(),
    label: params.label,
    recurring: params.recurring,
  });
  return { id, ...params };
}

export function listAlarms(userId: string) {
  return [...alarms.entries()]
    .filter(([, a]) => a.userId === userId)
    .map(([id, a]) => ({ id, ...a, at: new Date(a.at).toISOString() }));
}
