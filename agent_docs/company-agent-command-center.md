# InterviewProof Company Agent Command Center

## Runtime Boundary

The internal CEO command center is Anthropic-only.

- Production company-agent calls use `@anthropic-ai/sdk`.
- Orchestration is code-driven and typed in `src/server/agents/company/`.
- The new company-agent modules must not import `src/lib/openai.ts`.
- Existing customer-facing OpenAI usage is unchanged.

## Admin Access

The command center lives at:

```text
/admin/command-center
```

Access is restricted by:

- Supabase auth
- `user.app_metadata.role === "admin" | "ceo"` or `INTERVIEWPROOF_CEO_EMAILS`
- API-level checks in `src/lib/admin.ts`
- User-owned RLS on company-agent tables

## API Contracts

### Send CEO Message

```text
POST /api/admin/company-agent/message
```

Request:

```json
{
  "message": "string",
  "sessionId": "optional uuid",
  "agentKind": "ceo_orchestrator | executive_assistant | director_marketing | director_finance | director_engineering"
}
```

Response:

```json
{
  "data": {
    "sessionId": "uuid",
    "output": {
      "agentKind": "director_engineering",
      "summary": "string",
      "priorities": ["string"],
      "proposedActions": []
    },
    "actions": []
  }
}
```

### Other Endpoints

```text
GET /api/admin/company-agent/brief
GET /api/admin/company-agent/metrics
GET /api/admin/company-agent/sessions
GET /api/admin/company-agent/actions
PATCH /api/admin/company-agent/actions/[id]
```

## Data Model

Migration:

```text
supabase/migrations/035_company_agent_command_center.sql
```

Tables:

- `company_agent_sessions`
- `company_agent_messages`
- `company_agent_actions`
- `company_tasks`
- `company_decisions`
- `company_metrics_snapshots`
- `company_weekly_briefs`

Action states:

```text
drafted -> awaiting_approval -> approved -> completed
drafted -> rejected
awaiting_approval -> rejected
approved -> failed
```

Launch mode persists model-proposed actions as `awaiting_approval`.

## Claude Code UI Handoff

Claude Code owns visual design and UX polish for `/admin/command-center`.

Primary files:

```text
src/app/admin/command-center/page.tsx
src/app/admin/command-center/CommandCenterClient.tsx
```

Claude Code may improve:

- Layout
- Component polish
- Responsive states
- Loading and error states
- Approval workflows
- Empty states

Claude Code should not change:

- Supabase schema
- Admin authorization
- Company-agent orchestration
- Anthropic runtime
- API response shapes

Local Claude subagent spec:

```text
.claude/agents/ceo-dashboard-designer.md
```

Note: `.claude/` is gitignored in this repo, so this tracked document is the durable source-of-truth handoff.
