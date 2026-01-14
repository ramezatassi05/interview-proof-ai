// Database enums
export type RoundType = 'technical' | 'behavioral' | 'case' | 'finance';
export type RiskBand = 'Low' | 'Medium' | 'High';
export type CreditType = 'purchase' | 'spend' | 'refund' | 'grant';

// Extracted data structures
export interface ExtractedResume {
  skills: string[];
  experiences: {
    company: string;
    role: string;
    dates: string;
    achievements: string[];
  }[];
  metrics: string[];
  recencySignals: string[];
  projectEvidence: string[];
}

export interface ExtractedJD {
  mustHave: string[];
  niceToHave: string[];
  keywords: string[];
  senioritySignals: string[];
}

// LLM Analysis output (strict JSON schema)
export interface LLMAnalysis {
  categoryScores: {
    hardMatch: number; // 0-1
    evidenceDepth: number; // 0-1
    roundReadiness: number; // 0-1
    clarity: number; // 0-1
    companyProxy: number; // 0-1
  };
  rankedRisks: RiskItem[];
  interviewQuestions: {
    question: string;
    mappedRiskId: string;
    why: string;
  }[];
  studyPlan: {
    task: string;
    timeEstimateMinutes: number;
    mappedRiskId: string;
  }[];
}

export interface RiskItem {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  missingEvidence: string;
  rubricRefs: string[];
  jdRefs: string[];
}

// Score breakdown for deterministic scoring
export interface ScoreBreakdown {
  hardRequirementMatch: number;
  evidenceDepth: number;
  roundReadiness: number;
  resumeClarity: number;
  companyProxy: number;
  weights: {
    hardRequirementMatch: number;
    evidenceDepth: number;
    roundReadiness: number;
    resumeClarity: number;
    companyProxy: number;
  };
  version: string;
}

// Database models
export interface Report {
  id: string;
  userId: string;
  roundType: RoundType;
  resumeFilePath?: string;
  resumeText?: string;
  jobDescriptionText: string;
  createdAt: string;
  paidUnlocked: boolean;
  creditSpendLedgerId?: string;
}

export interface Run {
  id: string;
  reportId: string;
  runIndex: number;
  extractedResumeJson: ExtractedResume;
  extractedJdJson: ExtractedJD;
  retrievedContextIds: string[];
  llmAnalysisJson: LLMAnalysis;
  scoreBreakdownJson: ScoreBreakdown;
  readinessScore: number;
  riskBand: RiskBand;
  rankedRisksJson: RiskItem[];
  createdAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: CreditType;
  amount: number;
  stripeEventId?: string;
  createdAt: string;
}

export interface RubricChunk {
  id: string;
  domain: 'swe' | 'ds' | 'finance' | 'general';
  roundType: RoundType;
  chunkText: string;
  sourceName: string;
  version: string;
  metadata: Record<string, unknown>;
}

export interface QuestionArchetype {
  id: string;
  domain: 'swe' | 'ds' | 'finance' | 'general';
  roundType: RoundType;
  questionTemplate: string;
  tags: string[];
}

// API request/response types
export interface CreateReportRequest {
  resumeText?: string;
  resumeFile?: File;
  jobDescriptionText: string;
  roundType: RoundType;
}

export interface AnalyzeReportResponse {
  readinessScore: number;
  riskBand: RiskBand;
  top3Risks: RiskItem[];
  paywallState: 'free' | 'unlocked';
}

export interface FullDiagnosticResponse extends AnalyzeReportResponse {
  allRisks: RiskItem[];
  interviewQuestions: LLMAnalysis['interviewQuestions'];
  studyPlan: LLMAnalysis['studyPlan'];
  scoreBreakdown: ScoreBreakdown;
}

export interface DeltaComparison {
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  resolvedRisks: RiskItem[];
  remainingRisks: RiskItem[];
  newRisks: RiskItem[];
}
