"use client";

import { useCallback, useEffect, useState } from "react";
import { INTEGRATION_CHANNELS } from "@/lib/afm/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, Loader2, Check, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ChannelState = {
  id: string;
  name: string;
  status: string;
  connectedAt?: string;
};

export function IntegrationsGrid() {
  const [channels, setChannels] = useState<ChannelState[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [topic, setTopic] = useState("AFM.ai product update");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const refresh = useCallback(() => {
    fetch("/api/integrations")
      .then((r) => r.json())
      .then((d: { channels?: ChannelState[] }) => {
        if (d.channels?.length) setChannels(d.channels);
        else
          setChannels(
            INTEGRATION_CHANNELS.map((c) => ({
              id: c.id,
              name: c.name,
              status: "disconnected",
            }))
          );
      })
      .catch(() =>
        setChannels(
          INTEGRATION_CHANNELS.map((c) => ({
            id: c.id,
            name: c.name,
            status: "disconnected",
          }))
        )
      );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connect = async (channelId: string, action: "connect" | "disconnect") => {
    setLoading(channelId);
    try {
      const res = await fetch("/api/integrations/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Failed", variant: "destructive" });
        return;
      }
      toast({ title: data.message ?? (action === "connect" ? "Connected" : "Disconnected") });
      refresh();
    } finally {
      setLoading(null);
    }
  };

  const generatePost = async (channelId: string): Promise<string | null> => {
    setLoading(`gen-${channelId}`);
    try {
      const res = await fetch("/api/integrations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error ?? "Generate failed", variant: "destructive" });
        return null;
      }
      const content = String(data.content ?? "");
      setDrafts((prev) => ({ ...prev, [channelId]: content }));
      return content;
    } finally {
      setLoading(null);
    }
  };

  const sendPost = async (
    channelId: string,
    channelName: string,
    contentOverride?: string
  ) => {
    const content = (contentOverride ?? drafts[channelId])?.trim();
    if (!content) {
      toast({
        title: "No post to send",
        description: "Tap AI post or Generate & send first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(`send-${channelId}`);
    try {
      const res = await fetch("/api/integrations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, content }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          title: data.error ?? "Send failed",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      const name = String(data.channelName ?? channelName);
      toast({
        title: `Sending to ${name}`,
        description: data.message,
      });

      if (data.openUrl && typeof window !== "undefined") {
        window.open(data.openUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoading(null);
    }
  };

  const generateAndSend = async (channelId: string, channelName: string) => {
    setLoading(`gs-${channelId}`);
    try {
      const genRes = await fetch("/api/integrations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, topic }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) {
        toast({
          title: genData.error ?? "Generate failed",
          variant: "destructive",
        });
        return;
      }
      const content = String(genData.content ?? "");
      setDrafts((prev) => ({ ...prev, [channelId]: content }));

      const sendRes = await fetch("/api/integrations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, content }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        toast({
          title: sendData.error ?? "Send failed",
          description: sendData.message,
          variant: "destructive",
        });
        return;
      }
      toast({
        title: `Published to ${sendData.channelName ?? channelName}`,
        description: sendData.message,
      });
      if (sendData.openUrl && typeof window !== "undefined") {
        window.open(sendData.openUrl, "_blank", "noopener,noreferrer");
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-foreground">How Send works:</strong> Each card is one
        platform. Connect → generate a post for that platform →{" "}
        <strong>Send to [platform]</strong> opens that network (X, Facebook, LinkedIn,
        etc.) with your text pre-filled so you can publish in one click.
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground">AI post topic</label>
          <Input value={topic} onChange={(e) => setTopic(e.target.value)} className="mt-1" />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.map((ch) => {
          const connected = ch.status === "connected" || ch.status === "pending";
          const busy =
            loading === ch.id ||
            loading === `gen-${ch.id}` ||
            loading === `send-${ch.id}` ||
            loading === `gs-${ch.id}`;
          return (
            <Card key={ch.id} className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plug className="h-4 w-4 text-violet-500" />
                  {ch.name}
                  {connected && (
                    <Check className="h-3 w-3 text-green-600 ml-auto" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {connected
                    ? `Posts from this card go to ${ch.name} only.`
                    : "Connect to enable AI post and Send."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={connected ? "outline" : "gradient"}
                    size="sm"
                    disabled={busy}
                    onClick={() =>
                      connect(ch.id, connected ? "disconnect" : "connect")
                    }
                  >
                    {loading === ch.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : connected ? (
                      "Disconnect"
                    ) : (
                      "Connect"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!connected || busy}
                    onClick={() => void generatePost(ch.id)}
                  >
                    {loading === `gen-${ch.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "AI post"
                    )}
                  </Button>
                  <Button
                    variant="gradient"
                    size="sm"
                    disabled={!connected || busy || !drafts[ch.id]?.trim()}
                    onClick={() => void sendPost(ch.id, ch.name)}
                    title={
                      connected
                        ? `Open ${ch.name} and publish this post`
                        : "Connect first"
                    }
                  >
                    {loading === `send-${ch.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Send to {ch.name.split(" ")[0]}
                      </>
                    )}
                  </Button>
                </div>
                {connected && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void generateAndSend(ch.id, ch.name)}
                  >
                    {loading === `gs-${ch.id}` ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                    ) : null}
                    Generate &amp; send to {ch.name}
                  </Button>
                )}
                {drafts[ch.id] && (
                  <p className="text-xs text-muted-foreground border rounded-md p-2 max-h-24 overflow-y-auto whitespace-pre-wrap">
                    <span className="font-medium text-foreground">
                      Draft for {ch.name}:{" "}
                    </span>
                    {drafts[ch.id].slice(0, 280)}
                    {drafts[ch.id].length > 280 ? "…" : ""}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
