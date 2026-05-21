"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Trash2, Eye, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TranslationHistoryList } from "@/components/forge/translation-history-list";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { ScriptOutput } from "@/components/script-output";
import type { GeneratedScript } from "@/types";

interface ScriptRecord {
  id: string;
  topic: string;
  platform: string;
  hook: string;
  script_data: GeneratedScript;
  created_at: string;
}

export default function HistoryPage() {
  const [scripts, setScripts] = useState<ScriptRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ScriptRecord | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchScripts = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/scripts?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setScripts(data.scripts || []);
    } catch {
      toast({ title: "Error", description: "Failed to load scripts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchScripts(search);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setScripts((prev) => prev.filter((s) => s.id !== id));
        if (selected?.id === id) setSelected(null);
        toast({ title: "Deleted", description: "Script removed from history" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <DashboardSidebar />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 md:p-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">History</h1>
            <p className="text-muted-foreground mt-1">
              Scripts, translations, and saved AI outputs
            </p>
          </div>

          <Tabs defaultValue="scripts" className="space-y-6">
            <TabsList>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
              <TabsTrigger value="translations">Translations</TabsTrigger>
            </TabsList>

            <TabsContent value="translations">
              <TranslationHistoryList />
            </TabsContent>

            <TabsContent value="scripts">
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scripts by topic..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : scripts.length === 0 ? (
                <Card className="glass-card">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No scripts found. Generate your first script!
                  </CardContent>
                </Card>
              ) : (
                scripts.map((script) => (
                  <Card
                    key={script.id}
                    className={`glass-card cursor-pointer transition-all hover:shadow-md ${
                      selected?.id === script.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelected(script)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{script.topic}</p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {script.hook}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
                              {script.platform.replace("_", " ")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(script.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(script);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            disabled={deleting === script.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(script.id);
                            }}
                          >
                            {deleting === script.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            <div>
              {selected ? (
                <ScriptOutput
                  script={selected.script_data}
                  topic={selected.topic}
                  animate={false}
                />
              ) : (
                <Card className="glass-card h-full min-h-[400px] flex items-center justify-center">
                  <CardHeader className="text-center text-muted-foreground">
                    <CardTitle className="text-base font-normal">
                      Select a script to view details
                    </CardTitle>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
