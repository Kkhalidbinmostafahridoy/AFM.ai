"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadMemoryCategory,
  saveMemoryEntry,
} from "@/lib/afm/memory-store";
import type { MemoryEntry } from "@/lib/afm/types";

export function MemoryPanel({ category, title }: { category: string; title: string }) {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    setEntries(loadMemoryCategory(category));
  }, [category]);

  const add = () => {
    if (!key.trim() || !value.trim()) return;
    const row = saveMemoryEntry(category, {
      category,
      key: key.trim(),
      value: value.trim(),
    });
    setEntries((e) => [row, ...e]);
    setKey("");
    setValue("");
  };

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">{title} — stored locally in AFM Memory Engine (Phase 1).</p>
          <Input placeholder="Key" value={key} onChange={(e) => setKey(e.target.value)} />
          <Input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
          <Button variant="gradient" onClick={add}>
            Save memory
          </Button>
        </CardContent>
      </Card>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded-lg border bg-muted/30 px-3 py-2 text-sm"
          >
            <span className="font-medium">{e.key}</span>
            <p className="text-muted-foreground mt-1">{e.value}</p>
          </li>
        ))}
        {!entries.length && (
          <p className="text-sm text-muted-foreground">No memories yet.</p>
        )}
      </ul>
    </div>
  );
}
