/**
 * Chat Agent prompts.
 *
 * The chat agent is the conversational counterpart to the structured
 * orchestrator. It produces free-form natural language (so it can stream),
 * answers questions about the user's diagnostic + prep state, and may
 * REFERENCE drafted actions but never drafts new ones itself. For action
 * proposals the user is routed to the orchestrator endpoint.
 */
import type { AgentContextBundle } from '../context-loader';

export const CHAT_SYSTEM_PROMPT = `You are an interview-prep coach embedded in InterviewProof. You are the conversational surface — the place a user comes to ASK questions, get explanations, or think out loud about their prep.

Your role:
- Explain the user's diagnostic, weaknesses, prep plan, opportunities, and progress in plain language.
- Help the user reason about what to focus on, why a risk matters, or how to interpret their score trajectory.
- Reference specific data points from the context bundle (risk ids, opportunity stages, prep plan day numbers) so your answers feel grounded.

Your boundaries — non-negotiable:
1. You DO NOT draft actions. You DO NOT send emails. You DO NOT modify resumes, prep plans, or opportunities. If the user wants a draft (recruiter reply, resume bullet, prep plan update), tell them you'll route the request to the appropriate specialist and ask them to confirm.
2. You DO NOT fabricate scores, dates, or metrics. If something is missing from the context, say "I don't have that yet" rather than guessing.
3. You DO NOT pretend to have run a tool or sent something. You only have the context bundle — that's it.
4. You stay concise. 2–4 short paragraphs by default. Bullet points when listing more than three items. Markdown is fine; the UI renders it.
5. You are warm but not saccharine. No "Great question!". No emoji unless the user uses one first.

When you cite evidence, prefer:
- Risk ids (e.g. "your top risk is \`scoping-ambiguity\`")
- Score numbers from \`readinessScore\`, \`weakestDimensions\`, \`practiceProgress\`
- Specific opportunity (\`Stripe — Senior PM\`) or prep plan (\`Day 3 task: behavioral STAR drill\`)

If the user asks "what should I do next" — give your best read in plain language, then tell them you can route to the orchestrator if they want a structured plan with approval-ready actions.`;

export function buildChatUserPrompt(
  context: AgentContextBundle,
  userMessage: string
): string {
  const cognitiveDims = context.diagnosticIntelligence?.cognitiveRiskMap?.dimensions ?? null;
  const sortedWeakest = cognitiveDims
    ? Object.entries(cognitiveDims)
        .sort(([, a], [, b]) => (a as number) - (b as number))
        .slice(0, 3)
        .map(([name, score]) => ({ name, score }))
    : [];

  const compact = {
    report: {
      id: context.report.id,
      role: context.report.roleTitle,
      company: context.report.companyName,
      readinessScore: context.report.readinessScore,
      riskBand: context.report.riskBand,
      roundType: context.report.roundType,
    },
    profile: context.userProfile
      ? {
          careerStage: context.userProfile.careerStage,
          targetRoles: context.userProfile.targetRoles,
          yearsExperience: context.userProfile.yearsExperience,
          prepUrgency: context.userProfile.prepUrgency,
          biggestConcern: context.userProfile.biggestConcern,
        }
      : null,
    archetype: context.diagnosticIntelligence?.archetypeProfile
      ? {
          label: context.diagnosticIntelligence.archetypeProfile.label,
          confidence: context.diagnosticIntelligence.archetypeProfile.confidence,
        }
      : null,
    weakestCognitiveDimensions: sortedWeakest,
    rankedRisks: (context.llmAnalysis?.rankedRisks ?? []).slice(0, 5).map((r) => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
    })),
    practiceProgress: {
      answersAttempted: context.practiceProgress.answersAttempted,
      avgScore: context.practiceProgress.avgScore,
      scoreTrend: context.practiceProgress.scoreTrend,
      weakestRiskIds: context.practiceProgress.weakestRiskIds,
      lastPracticedAt: context.practiceProgress.lastPracticedAt,
    },
    activePrepPlan: context.activePrepPlan
      ? {
          id: context.activePrepPlan.plan.id,
          targetDate: context.activePrepPlan.plan.targetDate,
          tasksDoneVsTotal: `${
            context.activePrepPlan.tasks.filter((t) => t.status === 'done').length
          } / ${context.activePrepPlan.tasks.length}`,
          nextPendingTask:
            context.activePrepPlan.tasks.find((t) => t.status === 'pending')?.title ?? null,
        }
      : null,
    opportunities: context.opportunities.slice(0, 5).map((o) => ({
      company: o.companyName,
      role: o.roleTitle,
      stage: o.stage,
      interviewDate: o.interviewDate,
    })),
    recentMemoryHighlights: context.recentMemory.slice(0, 6).map((m) => ({
      kind: m.kind,
      key: m.key,
    })),
  };

  return `Context (JSON):\n\n${JSON.stringify(compact, null, 2)}\n\n---\n\nUser message:\n${userMessage}`;
}
