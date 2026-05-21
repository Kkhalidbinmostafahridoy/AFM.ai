"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Trash2,
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

export function ChatInterface() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [fusionAvailable, setFusionAvailable] = useState(false);
  const [model, setModel] = useState("auto");
  const [fusion, setFusion] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [metaByIndex, setMetaByIndex] = useState<Record<number, AssistantMeta>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then(
        (data: {
          models?: ModelOption[];
          providers?: ProviderStatus[];
          fusionAvailable?: boolean;
        }) => {
          if (data.models?.length) {
            setModels(data.models);
            setModel(data.models[0].id);
          }
          if (data.providers) setProviders(data.providers);
          setFusionAvailable(Boolean(data.fusionAvailable));
        }
      )
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userTurn: ChatTurn = { role: "user", content: text };
    const nextMessages = [...messages, userTurn];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
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
        toast({
          title: data.error ?? "Chat failed",
          description:
            data.message ??
            (res.status === 503
              ? "Provider busy — try Auto + Flash Lite or wait 30s."
              : undefined),
          variant: "destructive",
        });
        setMessages((prev) => prev.slice(0, -1));
        setInput(text);
        return;
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply as string },
      ]);
      setMetaByIndex((prev) => ({
        ...prev,
        [nextMessages.length]: {
          modelStrategy: data.modelStrategy ?? "",
          providersUsed: data.providersUsed ?? [],
          fusionUsed: data.fusionUsed,
        },
      }));
    } catch {
      toast({ title: "Network error", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, model, fusion, fusionAvailable]);

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
          toast({
            title: "Recording too short",
            variant: "destructive",
          });
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
          setInput((prev) =>
            prev ? `${prev.trim()} ${data.transcript}` : data.transcript
          );
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
        description: "Allow microphone access to send voice messages.",
        variant: "destructive",
      });
    }
  }, [recording, transcribing, loading]);

  const toggleRecording = () => {
    if (recording) stopRecording();
    else void startRecording();
  };

  const configuredCount = providers.filter((p) => p.configured).length;

  return (
    <div className="space-y-4">
      <Card className="glass-card border-violet-500/10">
        <CardContent className="pt-4 pb-3">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Zap className="h-3 w-3 text-violet-500" />
            Connected providers ({configuredCount})
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
            <div className="space-y-1 min-w-[220px]">
              <Label className="text-xs">Routing</Label>
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
            {fusionAvailable && (
              <div className="flex items-center gap-2 pb-1">
                <Switch
                  id="fusion"
                  checked={fusion}
                  onCheckedChange={setFusion}
                />
                <Label htmlFor="fusion" className="text-xs cursor-pointer">
                  Multi-model fusion
                </Label>
              </div>
            )}
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
                Ask anything or use the mic for a voice message. <strong>Auto</strong>{" "}
                routes to OpenAI, DeepSeek, Grok, Gemini, OpenCode, or Cloud AI —
                answers use the ✅ Final Answer / References format.
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
                </div>
                {m.role === "assistant" && metaByIndex[i] && (
                  <details className="mr-auto max-w-[92%] text-xs text-muted-foreground">
                    <summary className="cursor-pointer hover:text-foreground">
                      Model strategy used
                    </summary>
                    <pre className="mt-1 whitespace-pre-wrap rounded-lg bg-muted/40 p-2 border text-[11px]">
                      {metaByIndex[i].modelStrategy}
                      {metaByIndex[i].providersUsed?.length
                        ? `\n\nAPI: ${metaByIndex[i].providersUsed.join(", ")}`
                        : ""}
                      {metaByIndex[i].fusionUsed ? "\n\n(Fusion merge)" : ""}
                    </pre>
                  </details>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Routing to best model…
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
              disabled={
                loading || transcribing || configuredCount === 0
              }
              title={recording ? "Stop recording" : "Voice message"}
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
                transcribing
                  ? "Transcribing voice…"
                  : recording
                    ? "Recording… tap mic to stop"
                    : "Message… (Enter to send)"
              }
              rows={2}
              className="resize-none min-h-[52px]"
              disabled={
                loading || transcribing || configuredCount === 0
              }
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
                configuredCount === 0
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
