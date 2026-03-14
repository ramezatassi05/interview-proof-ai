import type {
  ExtractedResume,
  ExtractedJD,
  RoundType,
  LLMAnalysis,
  RiskBand,
  ScoreBreakdown,
  DiagnosticIntelligence,
  PrepPreferences,
  PersonalizedStudyPlan,
  PriorEmploymentSignal,
} from '@/types';
import { extractResumeData, extractJDData } from './rag/extraction';
import {
  retrieveContext,
  summarizeResumeForRetrieval,
  summarizeJDForRetrieval,
  inferDomain,
  type RetrievalResult,
} from './rag/retrieval';
import { performAnalysis } from './rag/analysis';
import { validateAnalysisQuality } from './rag/validation';
import {
  computeReadinessScore,
  computeConversionLikelihood,
  computeTechnicalFit,
  computeRiskBand,
  classifyArchetype,
  computeRoundForecasts,
  computeCognitiveRiskMap,
  computeTrajectoryProjection,
  buildRecruiterSimulation,
  computePracticeIntelligence,
  computeEvidenceContext,
  computeHireZoneAnalysis,
  computeCompanyDifficulty,
  detectPriorEmployment,
  computeCompetencyHeatmap,
  computePoolPercentile,
} from './scoring/engine';
import { generatePersonalizedStudyPlan } from './scoring/studyplan';
import { generateMoreQuestions } from './questions';

const TARGET_QUESTION_POOL = 50;

export interface PipelineInput {
  resumeText: string;
  jobDescriptionText: string;
  roundType: RoundType;
  prepPreferences?: PrepPreferences;
}

export interface PipelineOutput {
  extractedResume: ExtractedResume;
  extractedJD: ExtractedJD;
  retrievedContextIds: string[];
  llmAnalysis: LLMAnalysis;
  readinessScore: number;
  riskBand: RiskBand;
  scoreBreakdown: ReturnType<typeof computeReadinessScore>['breakdown'];
  diagnosticIntelligence: DiagnosticIntelligence;
  personalizedStudyPlan?: PersonalizedStudyPlan;
}

// ============================================
// Multi-Step Pipeline: Intermediate State Types
// ============================================

export interface PrepareStepOutput {
  extractedResume: ExtractedResume;
  extractedJD: ExtractedJD;
  retrievalResult: RetrievalResult;
  priorEmployment: PriorEmploymentSignal;
}

export interface LLMStepOutput {
  llmAnalysis: LLMAnalysis;
}

export type PipelineState =
  | {
      step: 'prepared';
      extractedResume: ExtractedResume;
      extractedJD: ExtractedJD;
      retrievalResult: RetrievalResult;
      priorEmployment: PriorEmploymentSignal;
    }
  | {
      step: 'analyzed';
      extractedResume: ExtractedResume;
      extractedJD: ExtractedJD;
      retrievalResult: RetrievalResult;
      priorEmployment: PriorEmploymentSignal;
      llmAnalysis: LLMAnalysis;
    };

// ============================================
// Multi-Step Pipeline: Individual Step Functions
// ============================================

/**
 * Step 1 — Prepare: Extract resume/JD, detect prior employment, retrieve RAG context.
 * Typically completes in ~8s.
 */
export async function pipelinePrepare(input: PipelineInput): Promise<PrepareStepOutput> {
  const { resumeText, jobDescriptionText, roundType } = input;

  const [extractedResume, extractedJD] = await Promise.all([
    extractResumeData(resumeText),
    extractJDData(jobDescriptionText),
  ]);

  const priorEmployment = detectPriorEmployment(extractedResume, extractedJD);

  const resumeSummary = summarizeResumeForRetrieval(
    extractedResume.skills,
    extractedResume.experiences,
    extractedResume.metrics
  );
  const jdSummary = summarizeJDForRetrieval(extractedJD.mustHave, extractedJD.keywords);

  const retrievalResult = await retrieveContext(
    resumeSummary,
    jdSummary,
    roundType,
    8,
    extractedJD.companyName ?? undefined,
    inferDomain(jdSummary)
  );

  return { extractedResume, extractedJD, retrievalResult, priorEmployment };
}

/**
 * Step 2 — LLM: Run Claude analysis + validation + fire-and-forget question backfill.
 * Typically completes in ~35-55s.
 */
export async function pipelineLLM(
  prepareOutput: PrepareStepOutput,
  roundType: RoundType,
  prepPreferences?: PrepPreferences
): Promise<LLMStepOutput> {
  const { extractedResume, extractedJD, retrievalResult, priorEmployment } = prepareOutput;

  const llmAnalysis = await performAnalysis(
    extractedResume,
    extractedJD,
    roundType,
    {
      rubricChunks: retrievalResult.rubricChunks,
      questionArchetypes: retrievalResult.questionArchetypes,
    },
    prepPreferences,
    0,
    priorEmployment.detected ? priorEmployment : undefined
  );

  const { warnings: validationWarnings } = validateAnalysisQuality(llmAnalysis, extractedJD, roundType);
  if (validationWarnings.length > 0) {
    console.warn(`[pipeline] Validation applied ${validationWarnings.length} fix(es)`);
  }

  // Fire-and-forget question backfill
  (async () => {
    try {
      while (llmAnalysis.interviewQuestions.length < TARGET_QUESTION_POOL) {
        const existingTexts = llmAnalysis.interviewQuestions.map((q) => q.question);
        const remaining = TARGET_QUESTION_POOL - llmAnalysis.interviewQuestions.length;
        const newQuestions = await generateMoreQuestions(
          extractedResume,
          extractedJD,
          roundType,
          existingTexts,
          Math.min(remaining, 50)
        );
        if (newQuestions.length === 0) break;
        llmAnalysis.interviewQuestions.push(...newQuestions);
      }
    } catch (err) {
      console.error('Question backfill failed, continuing with existing pool:', err);
    }
  })().catch(() => {});

  return { llmAnalysis };
}

/**
 * Step 3 — Complete: Run all deterministic scoring + diagnostic intelligence.
 * Typically completes in ~5s.
 */
export async function pipelineComplete(
  extractedResume: ExtractedResume,
  extractedJD: ExtractedJD,
  retrievedContextIds: string[],
  llmAnalysis: LLMAnalysis,
  roundType: RoundType,
  priorEmployment: PriorEmploymentSignal,
  prepPreferences?: PrepPreferences
): Promise<PipelineOutput> {
  const companyDifficulty = computeCompanyDifficulty(
    extractedJD.companyName,
    prepPreferences?.experienceLevel ?? 'mid',
    extractedJD,
    extractedResume
  );
  const { score: baseScore, breakdown } = computeReadinessScore(
    llmAnalysis,
    companyDifficulty.adjustmentFactor
  );
  const score = priorEmployment.detected
    ? Math.min(100, baseScore + priorEmployment.boosts.readinessBoost)
    : baseScore;
  const riskBand = computeRiskBand(score);
  const baseConversion = computeConversionLikelihood(
    score,
    llmAnalysis,
    companyDifficulty.adjustmentFactor
  );
  const conversionLikelihood = priorEmployment.detected
    ? Math.min(95, baseConversion + priorEmployment.boosts.conversionBoost)
    : baseConversion;
  const baseTechnicalFit = computeTechnicalFit(llmAnalysis, companyDifficulty.adjustmentFactor);
  const technicalFit = priorEmployment.detected
    ? Math.min(100, baseTechnicalFit + priorEmployment.boosts.technicalFitBoost)
    : baseTechnicalFit;

  const diagnosticIntelligence = await computeDiagnosticIntelligence(
    llmAnalysis,
    score,
    extractedResume,
    extractedJD,
    roundType,
    breakdown,
    prepPreferences,
    { conversionLikelihood, technicalFit },
    priorEmployment.detected ? priorEmployment : undefined
  );

  const personalizedStudyPlan = prepPreferences
    ? generatePersonalizedStudyPlan(
        llmAnalysis.studyPlan,
        prepPreferences,
        llmAnalysis.rankedRisks,
        roundType
      )
    : undefined;

  return {
    extractedResume,
    extractedJD,
    retrievedContextIds,
    llmAnalysis,
    readinessScore: score,
    riskBand,
    scoreBreakdown: breakdown,
    diagnosticIntelligence,
    personalizedStudyPlan,
  };
}

// ============================================
// Full Pipeline (convenience wrapper for rerun / local dev)
// ============================================

/**
 * Runs the full analysis pipeline:
 * 1. Extract structured data from resume and JD
 * 2. Retrieve relevant rubric chunks and questions
 * 3. Perform LLM analysis
 * 4. Compute deterministic score
 */
export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const { roundType, prepPreferences } = input;

  const prepareOutput = await pipelinePrepare(input);
  const { llmAnalysis } = await pipelineLLM(prepareOutput, roundType, prepPreferences);

  return pipelineComplete(
    prepareOutput.extractedResume,
    prepareOutput.extractedJD,
    prepareOutput.retrievalResult.contextIds,
    llmAnalysis,
    roundType,
    prepareOutput.priorEmployment,
    prepPreferences
  );
}

/**
 * Computes all diagnostic intelligence features from LLM analysis.
 * All computations are deterministic - same inputs always produce same outputs.
 */
async function computeDiagnosticIntelligence(
  llmAnalysis: LLMAnalysis,
  score: number,
  extractedResume: ExtractedResume,
  extractedJD: ExtractedJD,
  roundType: RoundType,
  scoreBreakdown: ScoreBreakdown,
  prepPreferences?: PrepPreferences,
  executiveScoresInput?: { conversionLikelihood: number; technicalFit: number },
  priorEmploymentSignal?: PriorEmploymentSignal
): Promise<DiagnosticIntelligence> {
  // Extract personalized coaching if available
  const coaching = llmAnalysis.personalizedCoaching;

  // Compute company difficulty first (other modules may depend on it)
  const companyDifficulty = computeCompanyDifficulty(
    extractedJD.companyName,
    prepPreferences?.experienceLevel ?? 'mid',
    extractedJD,
    extractedResume
  );

  // Compute evidence context (cross-references resume/JD data with scores)
  const evidenceContext = computeEvidenceContext(llmAnalysis, extractedResume, extractedJD);

  // Compute archetype profile (with personalized tips if available)
  const archetypeProfile = classifyArchetype(
    llmAnalysis,
    coaching?.archetypeTips,
    extractedResume,
    extractedJD
  );

  // Compute round forecasts (with personalized focus if available)
  const roundForecasts = computeRoundForecasts(
    llmAnalysis,
    coaching?.roundFocus,
    extractedResume,
    extractedJD,
    companyDifficulty
  );

  // Compute cognitive risk map
  const cognitiveRiskMap = computeCognitiveRiskMap(llmAnalysis);

  // Compute trajectory projection (use user's timeline if available)
  const trajectoryProjection = computeTrajectoryProjection(score, llmAnalysis, prepPreferences);

  // Build recruiter simulation (uses LLM signals if available, otherwise defaults)
  const recruiterSimulation = llmAnalysis.recruiterSignals
    ? buildRecruiterSimulation(llmAnalysis.recruiterSignals)
    : buildDefaultRecruiterSimulation(llmAnalysis, score);

  // Override LLM percentile with deterministic computation
  const poolPercentile = computePoolPercentile(
    llmAnalysis,
    score,
    scoreBreakdown,
    companyDifficulty
  );
  if (recruiterSimulation.candidatePositioning) {
    recruiterSimulation.candidatePositioning.estimatedPoolPercentile = poolPercentile;
  }

  // Compute practice intelligence (Phase 7c)
  const practiceIntelligence = computePracticeIntelligence(
    llmAnalysis,
    extractedResume,
    extractedJD
  );

  // Compute hire zone analysis
  const hireZoneAnalysis = computeHireZoneAnalysis(
    llmAnalysis,
    score,
    roundType,
    scoreBreakdown,
    companyDifficulty
  );

  // Compute competency heatmap (async — may fetch DB benchmarks)
  const competencyHeatmap = await computeCompetencyHeatmap(
    llmAnalysis,
    scoreBreakdown,
    extractedJD,
    extractedResume,
    roundType,
    companyDifficulty
  );

  return {
    archetypeProfile,
    roundForecasts,
    cognitiveRiskMap,
    trajectoryProjection,
    recruiterSimulation,
    practiceIntelligence,
    evidenceContext,
    hireZoneAnalysis,
    competencyHeatmap,
    companyDifficulty: companyDifficulty.tier !== 'STANDARD' ? companyDifficulty : undefined,
    priorEmploymentSignal,
    executiveScores: executiveScoresInput
      ? {
          readinessScore: score,
          conversionLikelihood: executiveScoresInput.conversionLikelihood,
          technicalFit: executiveScoresInput.technicalFit,
        }
      : undefined,
    generatedAt: new Date().toISOString(),
    version: 'v0.2',
  };
}

/**
 * Builds a default recruiter simulation when LLM signals are not available.
 * Used for backwards compatibility with older analyses.
 */
function buildDefaultRecruiterSimulation(
  llmAnalysis: LLMAnalysis,
  score: number
): DiagnosticIntelligence['recruiterSimulation'] {
  // Extract top risks as red flags
  const immediateRedFlags = llmAnalysis.rankedRisks
    .filter((r) => r.severity === 'critical' || r.severity === 'high')
    .slice(0, 4)
    .map((r) => r.title);

  // Infer hidden strengths from high category scores
  const hiddenStrengths: string[] = [];
  if (llmAnalysis.categoryScores.hardMatch >= 0.7) {
    hiddenStrengths.push('Strong technical skills alignment');
  }
  if (llmAnalysis.categoryScores.evidenceDepth >= 0.7) {
    hiddenStrengths.push('Well-documented impact and achievements');
  }
  if (llmAnalysis.categoryScores.clarity >= 0.7) {
    hiddenStrengths.push('Clear and professional communication');
  }

  // Estimate screen time based on clarity score
  const estimatedScreenTimeSeconds = Math.round(30 + llmAnalysis.categoryScores.clarity * 60);

  // Determine first impression based on overall score
  let firstImpression: 'proceed' | 'maybe' | 'reject';
  if (score >= 70) {
    firstImpression = 'proceed';
  } else if (score >= 45) {
    firstImpression = 'maybe';
  } else {
    firstImpression = 'reject';
  }

  // Build synthetic internal notes from available data
  const internalNotes = {
    firstGlanceReaction: score >= 70
      ? 'Solid profile at first glance — let me look closer at the details.'
      : score >= 45
        ? 'Decent on the surface but I need to dig deeper on a few things.'
        : 'This one might be a stretch — let me see if there\'s something I\'m missing.',
    starredItem: hiddenStrengths.length > 0
      ? hiddenStrengths[0]
      : 'No single standout item jumped off the page.',
    internalConcerns: immediateRedFlags.slice(0, 3).length > 0
      ? immediateRedFlags.slice(0, 3)
      : ['No major concerns noted, but depth needs verification.', 'Would want to confirm hands-on experience in a screen.'],
    phoneScreenQuestions: [
      'Walk me through your most technically challenging project.',
      'What drew you to this specific role?',
      ...immediateRedFlags.slice(0, 2).map(flag => `Can you address: ${flag}?`),
    ].slice(0, 4),
  };

  // Build synthetic debrief summary
  const impressionLabel = firstImpression === 'proceed'
    ? 'Worth advancing'
    : firstImpression === 'maybe'
      ? 'Borderline — depends on pool strength'
      : 'Likely a pass unless pool is thin';
  const debriefSummary = {
    oneLinerVerdict: `${impressionLabel} — readiness score at ${score}/100.`,
    advocateReasons: hiddenStrengths.slice(0, 2).length > 0
      ? hiddenStrengths.slice(0, 2)
      : ['Has relevant industry experience.', 'Resume is clearly structured.'],
    pushbackReasons: immediateRedFlags.slice(0, 2).length > 0
      ? immediateRedFlags.slice(0, 2)
      : ['Limited evidence of impact metrics.', 'Some key requirements not clearly addressed.'],
    recommendationParagraph: `Candidate scores ${score}/100 on readiness assessment. ${hiddenStrengths.length > 0 ? `Strengths include ${hiddenStrengths[0].toLowerCase()}.` : ''} ${immediateRedFlags.length > 0 ? `Primary concern: ${immediateRedFlags[0].toLowerCase()}.` : ''} ${firstImpression === 'proceed' ? 'Recommend advancing to phone screen.' : firstImpression === 'maybe' ? 'Consider for phone screen if pipeline allows.' : 'Suggest passing unless pool is thin.'}`,
    comparativeNote: score >= 70
      ? 'Above average relative to a typical applicant pool for this role.'
      : score >= 45
        ? 'In line with the middle of the pack for similar roles.'
        : 'Below the typical bar for competitive applicant pools.',
  };

  // Build synthetic candidate positioning
  const candidatePositioning = {
    estimatedPoolPercentile: 0, // Overridden by computePoolPercentile() in caller
    standoutDifferentiator: hiddenStrengths.length > 0
      ? hiddenStrengths[0]
      : 'No single standout differentiator identified.',
    biggestLiability: immediateRedFlags.length > 0
      ? immediateRedFlags[0]
      : 'No critical liabilities identified.',
    advanceRationale: firstImpression === 'proceed'
      ? 'Strong enough profile to warrant a phone screen and deeper evaluation.'
      : firstImpression === 'maybe'
        ? 'On the fence — advancing would depend on the strength of the current pipeline.'
        : 'Gaps are significant enough that advancing would be a stretch without stronger signal.',
  };

  return buildRecruiterSimulation({
    immediateRedFlags,
    hiddenStrengths,
    estimatedScreenTimeSeconds,
    firstImpression,
    internalNotes,
    debriefSummary,
    candidatePositioning,
  });
}

/**
 * Computes delta between two pipeline runs.
 */
export function computeDelta(
  previousRun: PipelineOutput,
  currentRun: PipelineOutput
): {
  scoreDelta: number;
  previousScore: number;
  currentScore: number;
  resolvedRisks: LLMAnalysis['rankedRisks'];
  remainingRisks: LLMAnalysis['rankedRisks'];
  newRisks: LLMAnalysis['rankedRisks'];
} {
  const previousRiskIds = new Set(previousRun.llmAnalysis.rankedRisks.map((r) => r.title));
  const currentRiskIds = new Set(currentRun.llmAnalysis.rankedRisks.map((r) => r.title));

  // Find resolved risks (in previous but not in current)
  const resolvedRisks = previousRun.llmAnalysis.rankedRisks.filter(
    (r) => !currentRiskIds.has(r.title)
  );

  // Find remaining risks (in both)
  const remainingRisks = currentRun.llmAnalysis.rankedRisks.filter((r) =>
    previousRiskIds.has(r.title)
  );

  // Find new risks (in current but not in previous)
  const newRisks = currentRun.llmAnalysis.rankedRisks.filter((r) => !previousRiskIds.has(r.title));

  return {
    scoreDelta: currentRun.readinessScore - previousRun.readinessScore,
    previousScore: previousRun.readinessScore,
    currentScore: currentRun.readinessScore,
    resolvedRisks,
    remainingRisks,
    newRisks,
  };
}
