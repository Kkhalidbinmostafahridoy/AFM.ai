"use client";

import { INTEGRATION_CHANNELS } from "@/lib/afm/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plug } from "lucide-react";

export function IntegrationsGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {INTEGRATION_CHANNELS.map((ch) => (
        <Card key={ch.id} className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Plug className="h-4 w-4 text-violet-500" />
              {ch.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              AI Connect — let AFM post, schedule, and act on your behalf (Phase 2).
            </p>
            <Button variant="outline" size="sm" disabled>
              Connect (soon)
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
