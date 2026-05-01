/**
 * E2E test fixture seed.
 *
 * Idempotent: re-runs upsert into a deterministic test user + report + run.
 * Resets the test user's password every run so the literal in .env.local always works.
 *
 * Flags:
 *   --write   Merge E2E_* keys into .env.local (only those keys, leaves others alone).
 *   --reset   Delete the seeded report (cascades runs) + auth user. Implies no upsert.
 *
 * Run: npx tsx scripts/seed-e2e.ts            # print env lines, leave files alone
 *      npx tsx scripts/seed-e2e.ts -- --write # merge into .env.local
 *      npx tsx scripts/seed-e2e.ts -- --reset # tear down
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const EMAIL = 'e2e+test@interviewproof.local';
const PASSWORD = 'e2e-test-do-not-reuse-7c4d2e3a';
const REPORT_NAMESPACE = '7c4d2e3a-1b9f-4a8e-9d6c-3f5e2a8b1c4d';
const REPORT_ID = uuidv5(EMAIL, REPORT_NAMESPACE);

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const RESET = args.includes('--reset');

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function findUserByEmail(email: string): Promise<string | null> {
  let page = 1;
  while (true) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
    page += 1;
    if (page > 50) return null;
  }
}

async function getOrCreateUser(): Promise<string> {
  const existingId = await findUserByEmail(EMAIL);
  if (existingId) {
    const { error } = await sb.auth.admin.updateUserById(existingId, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    return existingId;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user.id;
}

async function deleteUserIfExists(): Promise<void> {
  const id = await findUserByEmail(EMAIL);
  if (!id) return;
  const { error } = await sb.auth.admin.deleteUser(id);
  if (error) throw error;
}

async function upsertProfile(userId: string): Promise<void> {
  const { error } = await sb.from('user_profiles').upsert(
    {
      user_id: userId,
      display_name: 'E2E Tester',
      career_stage: 'new_grad',
      target_domain: 'swe',
      target_role: 'Software Engineer',
      years_experience: 2,
      prep_urgency: 'active_search',
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      onboarding_step: 999,
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

async function upsertReport(userId: string): Promise<void> {
  const { error } = await sb.from('reports').upsert(
    {
      id: REPORT_ID,
      user_id: userId,
      round_type: 'technical',
      job_description_text:
        'E2E fixture JD — Senior Software Engineer at Acme. 3+ years backend experience required.',
      paid_unlocked: true,
    },
    { onConflict: 'id' }
  );
  if (error) throw error;
}

const llmAnalysisJson = {
  categoryScores: {
    hardMatch: 0.7,
    evidenceDepth: 0.6,
    roundReadiness: 0.65,
    clarity: 0.7,
    companyProxy: 0.6,
  },
  rankedRisks: [
    {
      id: 'risk-1',
      title: 'Limited system design depth',
      severity: 'high',
      rationale: 'JD calls for distributed systems experience; resume shows monolith only.',
      missingEvidence: 'Scale-out + sharding experience',
      rubricRefs: [],
      jdRefs: [],
    },
  ],
  interviewQuestions: [
    {
      question: 'Walk through a system you scaled to 10x traffic.',
      mappedRiskId: 'risk-1',
      why: 'Probes evidence depth on real-world scaling.',
    },
  ],
  studyPlan: [
    {
      task: 'Review consistent hashing tradeoffs',
      timeEstimateMinutes: 45,
      mappedRiskId: 'risk-1',
    },
  ],
  personalizedCoaching: {
    archetypeTips: [
      'Lead every story with metrics.',
      'Anchor stories in scale.',
      'Pre-empt depth probes with specifics.',
      'Close with measurable impact.',
    ],
    roundFocus: 'Drill 2 distributed-systems questions per day for the next 5 days.',
    priorityActions: [
      {
        action: 'Practice a system-design walkthrough end-to-end',
        rationale: 'Largest gap is in evidence depth on distributed systems.',
      },
      {
        action: 'Refresh hashing/consistency tradeoffs',
        rationale: 'Likely interviewer probe area for senior backend roles.',
      },
      {
        action: 'Rehearse 3 STAR stories tied to scale',
        rationale: 'Behavioral coverage for impact at scale.',
      },
    ],
  },
};

const scoreBreakdownJson = {
  hardRequirementMatch: 70,
  evidenceDepth: 60,
  roundReadiness: 65,
  resumeClarity: 70,
  companyProxy: 60,
  weights: {
    hardRequirementMatch: 0.3,
    evidenceDepth: 0.25,
    roundReadiness: 0.2,
    resumeClarity: 0.15,
    companyProxy: 0.1,
  },
  version: 'v1',
};

const rankedRisksJson = llmAnalysisJson.rankedRisks;

const diagnosticIntelligenceJson = {
  archetypeProfile: {
    archetype: 'balanced_but_unproven',
    confidence: 0.7,
    label: 'Balanced but Unproven',
    description: 'Solid breadth across technical and behavioral areas, but few standout signals.',
    coachingTips: ['Pick 1 area to go deep in.', 'Build 1 standout story.'],
    version: 'v1',
  },
  roundForecasts: {
    forecasts: [
      {
        roundType: 'technical',
        passProbability: 0.6,
        primaryStrength: 'Coding fundamentals',
        primaryRisk: 'Distributed systems depth',
      },
    ],
    recommendedFocus: 'system design',
    version: 'v1',
  },
  cognitiveRiskMap: {
    dimensions: {
      analyticalReasoning: 0.7,
      communicationClarity: 0.7,
      technicalDepth: 0.6,
      adaptability: 0.65,
      problemStructuring: 0.7,
    },
    lowestDimension: 'technicalDepth',
    highestDimension: 'analyticalReasoning',
    version: 'v1',
  },
  trajectoryProjection: {
    currentScore: 65,
    day3Projection: { score: 70, assumptions: ['1 hr/day focused practice'] },
    day7Projection: { score: 75, assumptions: ['1 hr/day focused practice'] },
    day14Projection: { score: 82, assumptions: ['1 hr/day focused practice'] },
    improvementPotential: 'medium',
    version: 'v1',
  },
  recruiterSimulation: {
    immediateRedFlags: [],
    hiddenStrengths: ['Strong educational pedigree', 'Recent shipping cadence'],
    estimatedScreenTimeSeconds: 45,
    firstImpression: 'maybe',
    recruiterNotes: 'Solid candidate; needs more system-design signal to advance to onsite.',
    version: 'v1',
  },
  generatedAt: new Date().toISOString(),
  version: 'v0.1',
};

const extractedResumeJson = {
  skills: ['TypeScript', 'Node.js', 'PostgreSQL'],
  experiences: [{ company: 'Acme', role: 'Software Engineer', years: 2 }],
  metrics: ['Reduced p95 latency by 30%'],
  recencySignals: ['Currently employed'],
  projectEvidence: [{ name: 'Internal payments service', impact: 'Saved $200k/yr' }],
};

const extractedJdJson = {
  mustHave: ['3+ years backend', 'Distributed systems'],
  niceToHave: ['Go', 'Kubernetes'],
  keywords: ['distributed systems', 'sharding', 'consistency'],
  senioritySignals: ['Senior'],
  companyName: 'Acme',
  jobTitle: 'Senior Software Engineer',
  companyContextKeywords: ['fintech', 'payments'],
};

async function upsertRun(): Promise<void> {
  const { error } = await sb.from('runs').upsert(
    {
      report_id: REPORT_ID,
      run_index: 0,
      extracted_resume_json: extractedResumeJson,
      extracted_jd_json: extractedJdJson,
      retrieved_context_ids: [],
      llm_analysis_json: llmAnalysisJson,
      score_breakdown_json: scoreBreakdownJson,
      readiness_score: 65,
      risk_band: 'Medium',
      ranked_risks_json: rankedRisksJson,
      diagnostic_intelligence_json: diagnosticIntelligenceJson,
    },
    { onConflict: 'report_id,run_index' }
  );
  if (error) throw error;
}

function ensureBootstrapSecret(): string {
  const existing = process.env.E2E_BOOTSTRAP_SECRET;
  if (existing) return existing;
  return randomBytes(16).toString('hex');
}

function mergeIntoEnvLocal(values: Record<string, string>): void {
  const envPath = path.resolve(process.cwd(), '.env.local');
  let body = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  if (body.length && !body.endsWith('\n')) body += '\n';

  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    if (re.test(body)) {
      body = body.replace(re, line);
    } else {
      body += `${line}\n`;
    }
  }
  writeFileSync(envPath, body, 'utf8');
}

async function main(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  if (RESET) {
    console.log('Resetting E2E fixture...');
    const { error: delReportErr } = await sb.from('reports').delete().eq('id', REPORT_ID);
    if (delReportErr) throw delReportErr;
    await deleteUserIfExists();
    console.log('Reset complete.');
    return;
  }

  console.log('Seeding E2E fixture...');
  const userId = await getOrCreateUser();
  console.log(`  user_id: ${userId}`);
  await upsertProfile(userId);
  console.log('  user_profiles: upserted (onboarding_completed=true)');
  await upsertReport(userId);
  console.log(`  reports: upserted (id=${REPORT_ID})`);
  await upsertRun();
  console.log('  runs: upserted (run_index=0)');

  const bootstrapSecret = ensureBootstrapSecret();

  const envLines: Record<string, string> = {
    E2E_TEST_EMAIL: EMAIL,
    E2E_TEST_PASSWORD: PASSWORD,
    E2E_TEST_REPORT_ID: REPORT_ID,
    E2E_BOOTSTRAP_SECRET: bootstrapSecret,
  };

  console.log('\n--- E2E env values ---');
  for (const [k, v] of Object.entries(envLines)) {
    console.log(`${k}=${v}`);
  }

  if (WRITE) {
    mergeIntoEnvLocal(envLines);
    console.log('\nMerged into .env.local');
  } else {
    console.log('\n(re-run with --write to merge into .env.local)');
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
