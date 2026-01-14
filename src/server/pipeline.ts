import type { ExtractedResume, ExtractedJD, RoundType, LLMAnalysis, RiskBand } from '@/types';
import { extractResumeData, extractJDData } from './rag/extraction';
import {
  retrieveContext,
  summarizeResumeForRetrieval,
  summarizeJDForRetrieval,
} from './rag/retrieval';
import { performAnalysis } from './rag/analysis';
import { computeReadinessScore, computeRiskBand } from './scoring/engine';

export interface PipelineInput {
  resumeText: string;
  jobDescriptionText: string;
  roundType: RoundType;
}

export interface PipelineOutput {
  extractedResume: ExtractedResume;
  extractedJD: ExtractedJD;
  retrievedContextIds: string[];
  llmAnalysis: LLMAnalysis;
  readinessScore: number;
  riskBand: RiskBand;
  scoreBreakdown: ReturnType<typeof computeReadinessScore>['breakdown'];
}

/**
 * Runs the full analysis pipeline:
 * 1. Extract structured data from resume and JD
 * 2. Retrieve relevant rubric chunks and questions
 * 3. Perform LLM analysis
 * 4. Compute deterministic score
 */
export async function runAnalysisPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const { resumeText, jobDescriptionText, roundType } = input;

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
  const llmAnalysis = await performAnalysis(extractedResume, extractedJD, roundType, {
    rubricChunks: retrievalResult.rubricChunks,
    questionArchetypes: retrievalResult.questionArchetypes,
  });

  // Step 5: Compute deterministic score
  const { score, breakdown } = computeReadinessScore(llmAnalysis);
  const riskBand = computeRiskBand(score);

  return {
    extractedResume,
    extractedJD,
    retrievedContextIds: retrievalResult.contextIds,
    llmAnalysis,
    readinessScore: score,
    riskBand,
    scoreBreakdown: breakdown,
  };
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
