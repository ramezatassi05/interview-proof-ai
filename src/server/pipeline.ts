import type {
  ExtractedResume,
  ExtractedJD,
  RoundType,
  LLMAnalysis,
  RiskBand,
  DiagnosticIntelligence,
  PrepPreferences,
  PersonalizedStudyPlan,
} from '@/types';
import { extractResumeData, extractJDData } from './rag/extraction';
import {
  retrieveContext,
  summarizeResumeForRetrieval,
  summarizeJDForRetrieval,
} from './rag/retrieval';
import { performAnalysis } from './rag/analysis';
import {
  computeReadinessScore,
  computeRiskBand,
  classifyArchetype,
  computeRoundForecasts,
  computeCognitiveRiskMap,
  computeTrajectoryProjection,
  buildRecruiterSimulation,
  computePracticeIntelligence,
  computeEvidenceContext,
} from './scoring/engine';
import { generatePersonalizedStudyPlan } from './scoring/studyplan';

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

/**
 * Runs the full analysis pipeline:
 * 1. Extract structured data from resume and JD
 * 2. Retrieve relevant rubric chunks and questions
 * 3. Perform LLM analysis
 * 4. Compute deterministic score
 */
export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const { resumeText, jobDescriptionText, roundType, prepPreferences } = input;

  // Step 1: Extract structured data (parallel)
  const [extractedResume, extractedJD] = await Promise.all([
    extractResumeData(resumeText),
    extractJDData(jobDescriptionText),
  ]);

  // Step 2: Build summaries for retrieval
  const resumeSummary = summarizeResumeForRetrieval(
    extractedResume.skills,
    extractedResume.experiences,
    extractedResume.metrics
  );
  const jdSummary = summarizeJDForRetrieval(extractedJD.mustHave, extractedJD.keywords);

  // Step 3: Retrieve relevant context
  const retrievalResult = await retrieveContext(resumeSummary, jdSummary, roundType);

  // Step 4: Perform LLM analysis
  const llmAnalysis = await performAnalysis(
    extractedResume,
    extractedJD,
    roundType,
    {
      rubricChunks: retrievalResult.rubricChunks,
      questionArchetypes: retrievalResult.questionArchetypes,
    },
    prepPreferences
  );

  // Step 5: Compute deterministic score
  const { score, breakdown } = computeReadinessScore(llmAnalysis);
  const riskBand = computeRiskBand(score);

  // Step 6: Compute diagnostic intelligence (Phase 7b)
  const diagnosticIntelligence = computeDiagnosticIntelligence(
    llmAnalysis,
    score,
    extractedResume,
    extractedJD,
    prepPreferences
  );

  // Step 7: Generate personalized study plan if preferences provided
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
    retrievedContextIds: retrievalResult.contextIds,
    llmAnalysis,
    readinessScore: score,
    riskBand,
    scoreBreakdown: breakdown,
    diagnosticIntelligence,
    personalizedStudyPlan,
  };
}

/**
 * Computes all diagnostic intelligence features from LLM analysis.
 * All computations are deterministic - same inputs always produce same outputs.
 */
function computeDiagnosticIntelligence(
  llmAnalysis: LLMAnalysis,
  score: number,
  extractedResume: ExtractedResume,
  extractedJD: ExtractedJD,
  prepPreferences?: PrepPreferences
): DiagnosticIntelligence {
  // Extract personalized coaching if available
  const coaching = llmAnalysis.personalizedCoaching;

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
    extractedJD
  );

  // Compute cognitive risk map
  const cognitiveRiskMap = computeCognitiveRiskMap(llmAnalysis);

  // Compute trajectory projection (use user's timeline if available)
  const trajectoryProjection = computeTrajectoryProjection(score, llmAnalysis, prepPreferences);

  // Build recruiter simulation (uses LLM signals if available, otherwise defaults)
  const recruiterSimulation = llmAnalysis.recruiterSignals
    ? buildRecruiterSimulation(llmAnalysis.recruiterSignals)
    : buildDefaultRecruiterSimulation(llmAnalysis, score);

  // Compute practice intelligence (Phase 7c)
  const practiceIntelligence = computePracticeIntelligence(
    llmAnalysis,
    extractedResume,
    extractedJD
  );

  return {
    archetypeProfile,
    roundForecasts,
    cognitiveRiskMap,
    trajectoryProjection,
    recruiterSimulation,
    practiceIntelligence,
    evidenceContext,
    generatedAt: new Date().toISOString(),
    version: 'v0.1',
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

  return buildRecruiterSimulation({
    immediateRedFlags,
    hiddenStrengths,
    estimatedScreenTimeSeconds,
    firstImpression,
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
