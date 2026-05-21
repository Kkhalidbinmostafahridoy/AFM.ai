"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";
import { AFM_AI_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useTrackAI } from "@/hooks/use-track-ai";
import { useAnalytics } from "@/hooks/use-analytics";
import type { ChatTurn, ProviderStatus } from "@/types/chat";
import { cn } from "@/lib/utils";

interface ModelOption {
  id: string;
  label: string;
  description: string;
}

interface AssistantMeta {
  modelStrategy: string;
  providersUsed: string[];
  fusionUsed?: boolean;
}

type ChatMode = "chat" | "swarm" | "research" | "debate" | "auto";

export function ChatInterface() {
  const { trackRequest, trackResponse } = useTrackAI();
  const { trackApiFailure } = useAnalytics();
  const [models, setModels] = useState<ModelOption[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [configuredCount, setConfiguredCount] = useState(0);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [fusionAvailable, setFusionAvailable] = useState(false);
  const [model, setModel] = useState("auto");
  const [chatMode, setChatMode] = useState<ChatMode>("chat");
  const [fusion, setFusion] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [voiceOut, setVoiceOut] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [metaByIndex, setMetaByIndex] = useState<Record<number, AssistantMeta>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const loadChatStatus = useCallback(async (attempt = 0) => {
    try {
      const r = await fetch("/api/chat/status", { cache: "no-store" });
      if (!r.ok) {
        if (r.status === 404 && attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
          return loadChatStatus(attempt + 1);
        }
        setStatusError(`Chat status unavailable (${r.status})`);
        return;
      }
      const data = (await r.json()) as {
        models?: ModelOption[];
        providers?: ProviderStatus[];
        configuredCount?: number;
        chatEnabled?: boolean;
        fusionAvailable?: boolean;
      };
      setStatusError(null);
      if (data.models?.length) {
        setModels(data.models);
        setModel((prev) =>
          data.models!.find((m) => m.id === prev) ? prev : data.models![0].id
        );
      }
      if (data.providers) {
        setProviders(data.providers);
        const count =
          data.configuredCount ??
          data.providers.filter((p) => p.configured).length;
        setConfiguredCount(count);
        setChatEnabled(
          Boolean(
            data.chatEnabled ??
              count > 0 ||
              data.providers.some((p) => p.configured)
          )
        );
      } else {
        setChatEnabled(Boolean(data.chatEnabled));
      }
      setFusionAvailable(Boolean(data.fusionAvailable));
    } catch {
      if (attempt < 4) {
        await new Promise((resolve) => setTimeout(resolve, 800 * (attempt + 1)));
        return loadChatStatus(attempt + 1);
      }
      setStatusError("Could not reach chat API — retrying…");
    }
  }, []);

  useEffect(() => {
    void loadChatStatus();
    const retry = setInterval(() => {
      if (!chatEnabled) void loadChatStatus();
    }, 12_000);
    return () => clearInterval(retry);
  }, [loadChatStatus, chatEnabled]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setSpeaking(true);
    try {
      const res = await fetch("/api/chat/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 2000) }),
      });
      const data = await res.json();
      if (data.audioBase64) {
        const mime = data.mimeType ?? "audio/wav";
        audioRef.current?.pause();
        const audio = new Audio(`data:${mime};base64,${data.audioBase64}`);
        audioRef.current = audio;
        await audio.play();
        return;
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.text ?? text);
        window.speechSynthesis.speak(u);
      }
    } catch {
      toast({ title: "Voice output failed", variant: "destructive" });
    } finally {
      setSpeaking(false);
    }
  }, []);

  const appendAssistant = useCallback(
    (content: string, meta?: AssistantMeta, index?: number) => {
      setMessages((prev) => [...prev, { role: "assistant", content }]);
      if (meta && index !== undefined) {
        setMetaByIndex((prev) => ({ ...prev, [index]: meta }));
      }
      if (voiceOut && content) void speakText(content);
    },
    [voiceOut, speakText]
  );

  const sendSwarm = useCallback(
    async (nextMessages: ChatTurn[], userIndex: number) => {
      const mode =
        chatMode === "debate"
          ? "debate"
          : chatMode === "research"
            ? "research"
            : chatMode === "swarm" || chatMode === "auto"
              ? "swarm"
              : "auto";
      const res = await fetch("/api/afm/swarm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? data.error ?? "Swarm failed");
      appendAssistant(data.reply as string, {
        modelStrategy: `Swarm mode: ${mode}`,
        providersUsed: data.providersUsed ?? [],
        fusionUsed: Boolean(data.consensus),
      }, userIndex + 1);
    },
    [chatMode, appendAssistant]
  );

  const sendStream = useCallback(
    async (nextMessages: ChatTurn[], userIndex: number) => {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          model,
          fusion: fusion && fusionAvailable,
          stream: true,
        }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? err.error ?? "Stream failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let full = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const ev = JSON.parse(payload) as {
              type: string;
              data?: string;
              reply?: string;
              meta?: AssistantMeta & { providersUsed?: string[] };
              message?: string;
            };
            if (ev.type === "token" && ev.data) {
              full += ev.data;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: full };
                return copy;
              });
            } else if (ev.type === "done") {
              full = ev.reply ?? full;
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: full };
                return copy;
              });
              if (ev.meta) {
                setMetaByIndex((prev) => ({
                  ...prev,
                  [userIndex + 1]: {
                    modelStrategy: ev.meta?.modelStrategy ?? "Stream",
                    providersUsed: ev.meta?.providersUsed ?? [],
                    fusionUsed: ev.meta?.fusionUsed,
                  },
                }));
              }
            } else if (ev.type === "error") {
              throw new Error(ev.message ?? "Stream error");
            }
          } catch {
            /* skip malformed SSE */
          }
        }
      }
      if (voiceOut && full) void speakText(full);
    },
    [model, fusion, fusionAvailable, voiceOut, speakText]
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading || !chatEnabled) return;

    const userTurn: ChatTurn = { role: "user", content: text };
    const nextMessages = [...messages, userTurn];
    const userIndex = nextMessages.length - 1;
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const t0 = Date.now();
      trackRequest({ model, taskType: fusion ? "fusion" : chatMode });

      if (chatMode !== "chat") {
        await sendSwarm(nextMessages, userIndex);
        trackResponse({ model, status: "success", latencyMs: Date.now() - t0 });
        return;
      }

      if (useStreaming) {
        try {
          await sendStream(nextMessages, userIndex);
          trackResponse({
            model,
            status: "success",
            latencyMs: Date.now() - t0,
          });
          return;
        } catch {
          /* fall through to non-stream */
        }
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          model,
          fusion: fusion && fusionAvailable,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        trackApiFailure("/api/chat", res.status);
        trackResponse({ model, status: "failed", latencyMs: Date.now() - t0 });
        toast({
          title: data.error ?? "Chat failed",
          description: data.message,
          variant: "destructive",
        });
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        return;
      }

      trackResponse({
        model,
        latencyMs: Date.now() - t0,
        provider: (data.providersUsed as string[])?.[0],
        status: "success",
      });
      appendAssistant(
        data.reply as string,
        {
          modelStrategy: data.modelStrategy ?? "",
          providersUsed: data.providersUsed ?? [],
          fusionUsed: data.fusionUsed,
        },
        userIndex + 1
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      toast({ title: msg, variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [
    input,
    loading,
    messages,
    model,
    fusion,
    fusionAvailable,
    chatEnabled,
    chatMode,
    useStreaming,
    trackRequest,
    trackResponse,
    trackApiFailure,
    sendSwarm,
    sendStream,
    appendAssistant,
  ]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        if (!base64) reject(new Error("Failed to encode audio"));
        else resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });

  const stopRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (recording || transcribing || loading) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 500) {
          toast({ title: "Recording too short", variant: "destructive" });
          return;
        }
        setTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch("/api/chat/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType }),
          });
          const data = await res.json();
          if (!res.ok) {
            toast({
              title: data.error ?? "Transcription failed",
              description: data.message,
              variant: "destructive",
            });
            return;
          }
          const transcript = String(data.transcript ?? "").trim();
          setInput((prev) => (prev ? `${prev.trim()} ${transcript}` : transcript));
        } catch {
          toast({ title: "Voice transcription failed", variant: "destructive" });
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast({
        title: "Microphone access denied",
        description: "Allow microphone access in browser settings.",
        variant: "destructive",
      });
    }
  }, [recording, transcribing, loading]);

  const toggleRecording = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card border-violet-500/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3 text-violet-500" />
            Connected providers ({configuredCount})
            {!chatEnabled && (
              <span className="text-amber-600 ml-2">
                — add GEMINI_API_KEY or OPENAI_API_KEY in .env.local and restart
                dev server
              </span>
            )}
            {statusError && (
              <span className="text-amber-600 ml-2">— {statusError}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <span
                key={p.id}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border",
                  p.configured
                    ? "bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-300"
                    : "bg-muted/50 text-muted-foreground opacity-60"
                )}
              >
                {p.label}
                {p.configured ? "" : " (add API key)"}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card flex flex-col h-[calc(100vh-16rem)] min-h-[420px]">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-3 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5 text-violet-500" />
            {AFM_AI_NAME} Chat
          </CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-xs">Mode</Label>
              <Select
                value={chatMode}
                onValueChange={(v) => setChatMode(v as ChatMode)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Standard chat</SelectItem>
                  <SelectItem value="auto">Auto AI (swarm)</SelectItem>
                  <SelectItem value="swarm">Swarm AI</SelectItem>
                  <SelectItem value="research">Research mode</SelectItem>
                  <SelectItem value="debate">Debate mode</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-xs">Model routing</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Auto orchestrator" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fusionAvailable && chatMode === "chat" && (
              <div className="flex items-center gap-2 pb-1">
                <Switch id="fusion" checked={fusion} onCheckedChange={setFusion} />
                <Label htmlFor="fusion" className="text-xs cursor-pointer">
                  Fusion
                </Label>
              </div>
            )}
            {chatMode === "chat" && (
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  id="stream"
                  checked={useStreaming}
                  onCheckedChange={setUseStreaming}
                />
                <Label htmlFor="stream" className="text-xs cursor-pointer">
                  Stream
                </Label>
              </div>
            )}
            <div className="flex items-center gap-2 pb-1">
              <Switch id="voiceOut" checked={voiceOut} onCheckedChange={setVoiceOut} />
              <Label htmlFor="voiceOut" className="text-xs cursor-pointer">
                Voice reply
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setMessages([]);
                setMetaByIndex({});
              }}
              disabled={!messages.length}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col flex-1 min-h-0 p-0">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          >
            {!messages.length && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Ask anything or use the mic. Enable <strong>Stream</strong> for
                live tokens, <strong>Research / Debate</strong> for multi-agent
                modes, and <strong>Voice reply</strong> for spoken answers.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={`${i}-${m.role}`} className="space-y-1">
                <div
                  className={cn(
                    "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted/80 border"
                  )}
                >
                  {m.content}
                  {m.role === "assistant" && m.content && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2 inline-flex align-middle"
                      onClick={() => speakText(m.content)}
                      disabled={speaking}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {m.role === "assistant" && metaByIndex[i] && (
                  <details className="mr-auto max-w-[92%] text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Model strategy
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-2 border text-[11px]">
                      {metaByIndex[i].modelStrategy}
                      {metaByIndex[i].providersUsed?.length
                        ? `\n\nAPI: ${metaByIndex[i].providersUsed.join(", ")}`
                        : ""}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {chatMode === "chat" ? "Generating…" : `Running ${chatMode}…`}
              </div>
            )}
          </div>

          <div className="border-t p-4 flex gap-2 items-end">
            <Button
              type="button"
              variant={recording ? "destructive" : "outline"}
              size="icon"
              className="shrink-0 h-11 w-11"
              onClick={toggleRecording}
              disabled={loading || transcribing || !chatEnabled}
              title={recording ? "Stop recording" : "Voice input"}
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : recording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                !chatEnabled
                  ? "Configure API keys in .env.local to enable chat…"
                  : transcribing
                    ? "Transcribing voice…"
                    : recording
                      ? "Recording… tap mic to stop"
                      : "Message… (Enter to send)"
              }
              rows={2}
              className="resize-none min-h-[52px]"
              disabled={loading || transcribing || !chatEnabled}
            />
            <Button
              type="button"
              variant="gradient"
              size="icon"
              className="shrink-0 h-11 w-11"
              onClick={sendMessage}
              disabled={
                loading ||
                transcribing ||
                recording ||
                !input.trim() ||
                !chatEnabled
              }
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
