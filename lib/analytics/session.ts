const SESSION_KEY = "afm_analytics_session";
const DEVICE_KEY = "afm_analytics_device";
const TAB_KEY = "afm_analytics_tab";

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = randomId();
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export function getOrCreateTabId(): string {
  if (typeof window === "undefined") return "server-tab";
  let id = sessionStorage.getItem(TAB_KEY);
  if (!id) {
    id = randomId();
    sessionStorage.setItem(TAB_KEY, id);
  }
  return id;
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function setStoredSessionId(id: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, id);
}

export function clearStoredSessionId() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function createClientSessionId(): string {
  const id = `sess_${randomId()}`;
  setStoredSessionId(id);
  return id;
}
