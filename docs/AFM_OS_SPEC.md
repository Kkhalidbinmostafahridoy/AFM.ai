# AFM.ai — AI Operating System (Product Spec)

Aligned with the master product document. Implementation status in parentheses.

## Sidebar (implemented)

| Module | Route | Status |
|--------|-------|--------|
| Dashboard | `/dashboard` | Live |
| AI Chat | `/dashboard/chat` | Live |
| AI Swarm | `/dashboard/swarm` | Live |
| Scripts | `/dashboard/generate` | Live |
| AI Video Studio | `/dashboard/forge/video` | Live |
| Image Studio | `/dashboard/forge/images` | Live |
| Img → Img | `/dashboard/forge/image-edit` | Live |
| 3D Generator | `/dashboard/studio/3d` | Phase 3 |
| Translator | `/dashboard/forge/translate` | Live |
| AI Analyze | `/dashboard/forge/analyze` | Live |
| Workflow Automation | `/dashboard/automation/workflows` | Live |
| AI Agents | `/dashboard/agents` | Phase 2 |
| Memory Engine | `/dashboard/memory/*` | Phase 2 (local) |
| AI Research | `/dashboard/research` | Phase 2 |
| AI Website Builder | `/dashboard/builders/website` | Phase 3 |
| AI Business Builder | `/dashboard/builders/business` | Phase 3 |
| Integrations | `/dashboard/integrations` | Phase 2 UI |
| Live AI Monitor | `/dashboard/monitor` | Live |
| History | `/dashboard/history` | Live |
| Settings | `/dashboard/settings` | Live |
| Admin Panel | `/dashboard/admin` | Phase 4 |

## Architecture (target)

```
Next.js → Gateway API → Orchestration Engine → Models → Memory/Workflow → Agents → Output
```

## Roadmap mapping

- **Phase 1** — Chat, images, video plan, translate, scripts (done)
- **Phase 2** — Swarm, memory, workflows, monitor (partial)
- **Phase 3** — Adaptive OS, autonomous agents, 3D, builders
- **Phase 4** — Marketplace, admin, enterprise

See `lib/afm/modules.ts` for the canonical module registry.
