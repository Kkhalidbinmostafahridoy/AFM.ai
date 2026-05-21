"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Loader2, Star, Trash2 } from "lucide-react";
import type { SavedTranslation } from "@/types/translation";

const DIR_LABEL: Record<string, string> = {
  bn_en: "বাংলা → EN",
  en_bn: "EN → বাংলা",
};

export function TranslationHistoryList() {
  const [items, setItems] = useState<SavedTranslation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedTranslation | null>(null);

  const fetchItems = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/translations?search=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setItems(data.translations || []);
    } catch {
      toast({ title: "Error", description: "Failed to load translations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const toggleFavorite = async (item: SavedTranslation) => {
    const res = await fetch(`/api/translations/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: !item.is_favorite }),
    });
    if (res.ok) {
      fetchItems(search);
      toast({ title: item.is_favorite ? "Removed from favorites" : "Saved to favorites" });
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/translations/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems((prev) => prev.filter((t) => t.id !== id));
      if (selected?.id === id) setSelected(null);
      toast({ title: "Deleted" });
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchItems(search);
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Search translations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="outline">
            Search
          </Button>
        </form>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No translations yet. Use the Translator to create one.
          </p>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              className={`glass-card cursor-pointer transition-colors ${
                selected?.id === item.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelected(item)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground mb-1">
                      {DIR_LABEL[item.direction] ?? item.direction} · {item.style} ·{" "}
                      {formatDate(item.created_at)}
                    </p>
                    <p className="text-sm line-clamp-2">{item.source_text}</p>
                  </div>
                  <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleFavorite(item)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          item.is_favorite ? "fill-amber-400 text-amber-400" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card className="glass-card min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Source</p>
                <p className="text-sm whitespace-pre-wrap">{selected.source_text}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-violet-600">Translation</p>
                  <CopyButton text={selected.translated_text} label="" />
                </div>
                <p className="text-sm whitespace-pre-wrap">{selected.translated_text}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">
              Select a translation to preview
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
