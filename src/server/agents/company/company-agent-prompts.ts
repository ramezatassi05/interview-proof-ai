import type { CompanyAgentKind } from './types';
import type { RoadmapContext, RoadmapDomain, RoadmapDomainKey } from './roadmap/types';
import { isActiveRow } from './roadmap/loader';
import { VOICE_RULES, roleFraming } from './voice';
import { formatReportingBlock } from './org';
import {
  MEMORY_TOPIC_LABELS,
  MEMORY_TOPIC_ORDER,
  type MemoryTopic,
} from './memory-topics';

export interface MemoryItem {
  topic: MemoryTopic;
  key: string;
  summary: string | null;
  body: string | null;
  value: unknown;
}

const MEMORY_BLOCK_BUDGET_CHARS = 3000;
const MEMORY_BODY_BUDGET_CHARS = 300;

export const COMPANY_AGENT_VERSION = 'v3.0.0';

export const COMPANY_AGENT_LABELS: Record<CompanyAgentKind, string> = {
  ceo_orchestrator: 'CEO Orchestrator',
  executive_assistant: 'Executive Assistant',
  director_marketing: 'Director of Marketing',
  director_finance: 'Director of Finance',
  director_engineering: 'Director of Engineering',
};

const DOMAIN_LABELS: Record<RoadmapDomainKey, string> = {
  product: 'PRODUCT ROADMAP — roadmap/product.csv',
  marketing: 'MARKETING ROADMAP — roadmap/marketing.csv',
  finance: 'FINANCE ROADMAP — roadmap/finance.csv',
};

const COMPANY_CONTEXT = `About InterviewProof:
The product helps people find what would get them rejected from an interview, then fix those gaps before they go in. The CEO runs this company solo and uses you (and a few other internal agents) to extend their reach. Treat the CEO like the operator they are.`;

const HOW_TO_WORK = `How you work:
- You have a small set of skills (tools) for your role. Use them — don't guess at numbers.
- Look-up skills (fetch_*, query_*) run right away and hand you data. Use them BEFORE you make claims with numbers in them.
- Drafting skills (draft_*, schedule_*, create_*) write up a proposal that the CEO has to OK before anything happens. Use them when the CEO asks you to draft or propose something.
- The "remember" skill keeps a fact for next time. Use it sparingly — only for things the CEO has confirmed (a goal, a number, a preference).
- The UI shows your tool calls as their own cards — you don't need to narrate them ("I'll now call X..."). Just do the thing and tell the CEO what you found.
- If something's in the MEMORY block below, treat it as true unless the CEO updates it.`;

const WHAT_YOU_CANT_DO = `What you can and can't do:
- You can look things up, summarize, draft, and recommend.
- You can't actually send the email, publish the post, change pricing, ship code, or move money. Anything like that has to go through a drafting skill so the CEO can approve it first.
- Don't say you did something external when you only drafted it.`;

const ROADMAP_DISCIPLINE = `Roadmap discipline (binding):
- The NORTH STAR and your domain ROADMAP below are the source of truth for direction. Domain CSVs say WHAT to do. The north star says WHY, what stage we're at, and what NOT to do right now.
- Your autonomous proposals must align with the north star and tie back to an active row in your roadmap. If nothing aligns, propose nothing — say so explicitly.
- Never propose work listed under "What NOT to do right now" in the north star.
- When a roadmap row's Inspiration/Notes column has direction from the CEO (e.g., a reference reel, a tone, a structure), treat that as binding creative input. You have technical freedom on the HOW — not the WHAT.
- If a domain you'd need is not loaded ("(no file)"), do not invent it. Say it's missing and ask the CEO to create it.`;

const ROADMAP_INSPIRATION_NUDGE = `Capturing inspiration:
- If the CEO drops an idea, link, competitor reference, or campaign in chat that's worth tracking, call \`propose_roadmap_row\` to capture it as a structured row in your domain roadmap. The CEO will approve before anything is written to disk. This is exactly what "hey, look at X" moments are for — don't just acknowledge, capture.`;

function formatDomain(domainKey: RoadmapDomainKey, domain: RoadmapDomain | null): string {
  const heading = `## ${DOMAIN_LABELS[domainKey]}`;
  if (!domain) return `${heading}\n(no file — roadmap/${domainKey}.csv not loaded)`;

  const truncate = (s: string, n: number) => {
    const flat = s.replace(/\s+/g, ' ').trim();
    return flat.length > n ? flat.slice(0, n) + '…' : flat;
  };

  const active = domain.rows.filter(isActiveRow);
  const rowsBlock =
    active.length === 0
      ? '(no active rows)'
      : active
          .map((r) => {
            const lines = [
              `- ${r.id} | ${r.title} | ${r.priority || '—'} | ${r.status || '—'} | ${
                r.phase || '—'
              }`,
            ];
            if (r.description) lines.push(`    Description: ${truncate(r.description, 280)}`);
            if (r.inspiration) lines.push(`    Inspiration: ${truncate(r.inspiration, 280)}`);
            return lines.join('\n');
          })
          .join('\n');

  const notesBlock = domain.notes ? `\n\nDeep notes:\n${domain.notes}` : '';
  return `${heading}\nActive rows:\n${rowsBlock}${notesBlock}`;
}

function buildRoadmapBlock(roadmap: RoadmapContext | undefined, agentKind: CompanyAgentKind): string {
  if (!roadmap) return '';

  const sections: string[] = [];

  if (roadmap.northStar) {
    sections.push(`## NORTH STAR — roadmap/north-star.md\n${roadmap.northStar}`);
  } else {
    sections.push(
      `## NORTH STAR\n(no roadmap/north-star.md found — operate cautiously and ask the CEO for direction before proposing work)`
    );
  }

  if (agentKind === 'ceo_orchestrator' || agentKind === 'executive_assistant') {
    sections.push(formatDomain('product', roadmap.product));
    sections.push(formatDomain('marketing', roadmap.marketing));
    sections.push(formatDomain('finance', roadmap.finance));
  } else if (agentKind === 'director_engineering') {
    sections.push(formatDomain('product', roadmap.product));
  } else if (agentKind === 'director_marketing') {
    sections.push(formatDomain('marketing', roadmap.marketing));
  } else if (agentKind === 'director_finance') {
    sections.push(formatDomain('finance', roadmap.finance));
  }

  const isDomainDirector =
    agentKind === 'director_engineering' ||
    agentKind === 'director_marketing' ||
    agentKind === 'director_finance';
  const inspirationBlock = isDomainDirector ? `\n\n${ROADMAP_INSPIRATION_NUDGE}` : '';

  return `\n${sections.join('\n\n')}\n\n${ROADMAP_DISCIPLINE}${inspirationBlock}\n`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function renderMemoryItem(item: MemoryItem): string {
  const valuePart =
    item.summary && item.summary.trim().length > 0
      ? item.summary
      : typeof item.value === 'string'
        ? item.value
        : item.value === null || item.value === undefined
          ? ''
          : JSON.stringify(item.value);

  const head = valuePart ? `- **${item.key}** — ${truncate(valuePart, 240)}` : `- **${item.key}**`;

  if (item.body && item.body.trim().length > 0) {
    const body = truncate(item.body.trim(), MEMORY_BODY_BUDGET_CHARS);
    const indented = body
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');
    return `${head}\n${indented}`;
  }
  return head;
}

function buildMemoryBlock(memory: MemoryItem[] | undefined): string {
  if (!memory || memory.length === 0) return '';

  const byTopic = new Map<MemoryTopic, MemoryItem[]>();
  for (const item of memory) {
    const list = byTopic.get(item.topic);
    if (list) list.push(item);
    else byTopic.set(item.topic, [item]);
  }

  const sections: string[] = [];
  for (const topic of MEMORY_TOPIC_ORDER) {
    const items = byTopic.get(topic);
    if (!items || items.length === 0) continue;
    const heading = `### ${MEMORY_TOPIC_LABELS[topic]}`;
    const rendered = items.map(renderMemoryItem).join('\n');
    sections.push(`${heading}\n${rendered}`);
  }

  if (sections.length === 0) return '';

  const body = sections.join('\n\n');
  const trimmed =
    body.length > MEMORY_BLOCK_BUDGET_CHARS
      ? `${body.slice(0, MEMORY_BLOCK_BUDGET_CHARS - 1)}…\n\n(memory truncated — recent topics shown first)`
      : body;

  return `\n## MEMORY (treat as current)\n${trimmed}\n`;
}

export function buildCompanySystemPrompt(args: {
  agentKind: CompanyAgentKind;
  memory?: MemoryItem[];
  directorSummary?: string;
  roadmap?: RoadmapContext;
}): string {
  const role = COMPANY_AGENT_LABELS[args.agentKind];

  const memoryBlock = buildMemoryBlock(args.memory);

  const directorBlock = args.directorSummary
    ? `\n## What's going on right now\n${args.directorSummary}\n`
    : '';

  const roadmapBlock = buildRoadmapBlock(args.roadmap, args.agentKind);
  const reportingBlock = `\n${formatReportingBlock(args.agentKind)}\n`;

  return `You are the ${role} for InterviewProof.

${roleFraming(args.agentKind)}

${VOICE_RULES}

${COMPANY_CONTEXT}

${HOW_TO_WORK}

${WHAT_YOU_CANT_DO}
${memoryBlock}${reportingBlock}${roadmapBlock}${directorBlock}`;
}
