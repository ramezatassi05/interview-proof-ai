// Database enums
export type RoundType = 'technical' | 'behavioral' | 'case' | 'finance' | 'research';
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
  companyName?: string;
  jobTitle?: string;
  companyContextKeywords?: string[];
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
    // Enhanced fields (optional for backwards compatibility)
    description?: string;
    priority?: 'critical' | 'high' | 'medium' | 'low';
    category?: 'technical' | 'behavioral' | 'practice' | 'review';
  }[];
  recruiterSignals?: RecruiterSignals; // Optional for backwards compatibility
  personalizedCoaching?: PersonalizedCoaching; // LLM-generated specific advice
  roundCoaching?: RoundCoaching; // Round-specific coaching content
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
  prepPreferences?: PrepPreferences;
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
  personalizedStudyPlan?: PersonalizedStudyPlan;
}

export interface DeltaComparison {
  previousScore: number;
  currentScore: number;
  scoreDelta: number;
  resolvedRisks: RiskItem[];
  remainingRisks: RiskItem[];
  newRisks: RiskItem[];
}

// ============================================
// Interactive Practice Questions Types
// ============================================

export interface QuestionFeedbackResponse {
  feedback: string;
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  strengthQuotes?: string[]; // parallel to strengths — verbatim quote from the user's answer
  improvementQuotes?: string[]; // parallel to improvements — verbatim quote from the user's answer
  tips?: string[]; // actionable suggestions for the next attempt
}

export interface BestAnswerResponse {
  bestAnswer: string;
  keyPoints: string[];
}

export interface SavedAnswer {
  poolIndex: number;
  question: { question: string; mappedRiskId: string; why: string };
  answer: string;
  feedback?: QuestionFeedbackResponse;
  bestAnswer?: BestAnswerResponse;
  savedAt: string; // ISO timestamp
}

// ============================================
// Phase 7b: Diagnostic Intelligence Types
// ============================================

// Interview Archetype Classification
export type InterviewArchetypeType =
  | 'technical_potential_low_polish'
  | 'strong_theoretical_weak_execution'
  | 'resume_strong_system_weak'
  | 'balanced_but_unproven'
  | 'high_ceiling_low_volume_practice';

export interface ArchetypeProfile {
  archetype: InterviewArchetypeType;
  confidence: number; // 0-1
  label: string;
  description: string;
  coachingTips: string[];
  version: string;
}

// Interview Round Forecast
export interface RoundForecastItem {
  roundType: 'technical' | 'behavioral' | 'case' | 'research';
  passProbability: number; // 0-1
  primaryStrength: string;
  primaryRisk: string;
}

// Round-Specific Coaching (replaces forecast bars in UI)
export interface InterviewerQuestion {
  question: string;
  context: string;
}

export interface SampleResponse {
  scenario: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  whyItWorks: string;
}

export interface RoundCoaching {
  roundType: string;
  coachingRecommendations: string[];
  waysToStandOut: string[];
  questionsToAskInterviewer: InterviewerQuestion[];
  sampleResponses: SampleResponse[];
  passionSignals: string[];
}

export interface InterviewRoundForecasts {
  forecasts: RoundForecastItem[];
  recommendedFocus: string;
  roundCoaching?: RoundCoaching;
  version: string;
}

// Cognitive Risk Map (Spider Chart)
export interface CognitiveRiskMap {
  dimensions: {
    analyticalReasoning: number; // 0-1
    communicationClarity: number; // 0-1
    technicalDepth: number; // 0-1
    adaptability: number; // 0-1
    problemStructuring: number; // 0-1
  };
  lowestDimension: string;
  highestDimension: string;
  version: string;
}

// Career Trajectory Projection (days-based for interview prep window)
export interface TrajectoryProjection {
  currentScore: number;
  day3Projection: {
    score: number;
    assumptions: string[];
  };
  day7Projection: {
    score: number;
    assumptions: string[];
  };
  day14Projection: {
    score: number;
    assumptions: string[];
  };
  improvementPotential: 'low' | 'medium' | 'high';
  milestone1Day?: number; // actual day for first milestone (default 3)
  milestone2Day?: number; // actual day for second milestone (default 7)
  milestone3Day?: number; // actual day for third milestone (default 14)
  version: string;
}

// Recruiter Internal Notes (private recruiter notepad)
export interface RecruiterInternalNotes {
  firstGlanceReaction: string;
  starredItem: string;
  internalConcerns: string[];
  phoneScreenQuestions: string[];
}

// Recruiter Debrief Summary (what they'd tell the hiring manager)
export interface RecruiterDebriefSummary {
  oneLinerVerdict: string;
  advocateReasons: string[];
  pushbackReasons: string[];
  recommendationParagraph: string;
  comparativeNote: string;
}

// Candidate Positioning (where the candidate sits in the pool)
export interface CandidatePositioning {
  estimatedPoolPercentile: number;
  standoutDifferentiator: string;
  biggestLiability: string;
  advanceRationale: string;
}

// Recruiter Simulation
export type FirstImpression = 'proceed' | 'maybe' | 'reject';

export interface RecruiterSimulation {
  immediateRedFlags: string[];
  hiddenStrengths: string[];
  estimatedScreenTimeSeconds: number;
  firstImpression: FirstImpression;
  recruiterNotes: string;
  internalNotes?: RecruiterInternalNotes;
  debriefSummary?: RecruiterDebriefSummary;
  candidatePositioning?: CandidatePositioning;
  version: string;
}

// Evidence Context — maps categories/signals to specific resume/JD data points
export interface EvidenceContext {
  categoryEvidence: {
    hardMatch: string;
    evidenceDepth: string;
    roundReadiness: string;
    clarity: string;
    companyProxy: string;
  };
  matchedMustHaves: string[];
  unmatchedMustHaves: string[];
  matchedNiceToHaves: string[];
  strongestMetrics: string[];
}

// Hire Zone Analysis
export type HireZoneStatus = 'below' | 'in_zone' | 'above';

export interface HireZoneCategoryGap {
  category: string;
  label: string;
  currentScore: number;
  targetScore: number;
  gapPoints: number;
  priority: 'critical' | 'high' | 'medium';
}

export interface HireZoneAction {
  action: string;
  category: string;
  estimatedImpact: string;
}

export interface HireZoneAnalysis {
  hireZoneMin: number;
  hireZoneMax: number;
  currentScore: number;
  gap: number;
  percentile: number;
  status: HireZoneStatus;
  categoryGaps: HireZoneCategoryGap[];
  topActions: HireZoneAction[];
  roundType: string;
  industryAverage: number;
  version: string;
}

// Competency Heatmap
export type CompetencyLevel = 'Beginner' | 'Intermediate' | 'High' | 'Expert';
export type GapStatus = 'Critical' | 'Warning' | 'Pass';
export type InferredSeniority = 'Intern' | 'Junior' | 'Mid-Level' | 'Senior' | 'Staff+' | 'Unknown';

export interface CompetencyHeatmapEntry {
  domain: string;
  rawScore: number;               // 0-100
  yourLevel: CompetencyLevel;
  targetBenchmark: CompetencyLevel;
  targetScore: number;            // numeric target for gap math
  gapStatus: GapStatus;
  gapPoints: number;              // max(0, target - raw)
}

export interface CompetencyHeatmapData {
  entries: CompetencyHeatmapEntry[];
  inferredSeniority: InferredSeniority;
  seniorityLabel: string;         // e.g. "L6 / Senior Level"
  totalDomains: number;
  criticalGaps: number;
  warningGaps: number;
  passCount: number;
  version: string;
}

// Company Difficulty Context
export type CompanyTier =
  | 'FAANG_PLUS'
  | 'BIG_TECH'
  | 'TOP_FINANCE'
  | 'UNICORN'
  | 'GROWTH'
  | 'STANDARD';
export type CompetitionLevel = 'extreme' | 'very_high' | 'high' | 'moderate';

export interface CompanyDifficultyContext {
  companyName: string;
  tier: CompanyTier;
  difficultyScore: number; // 100-150 scale (100 = baseline)
  isIntern: boolean;
  acceptanceRateEstimate: string; // e.g., "1-3%"
  competitionLevel: CompetitionLevel;
  interviewBarDescription: string;
  adjustmentFactor: number; // 1.0-1.5 multiplier
  differentiationStrategies: string[];
  version: string;
}

// Prior Employment Detection
export interface PriorEmploymentStint {
  role: string;
  durationYears: number;
  yearsAgo: number; // 0 = currently employed
  isCurrent: boolean;
}

export interface PriorEmploymentSignal {
  detected: boolean;
  companyName: string;
  stints: PriorEmploymentStint[];
  totalYearsAtCompany: number;
  mostRecentDepartureYearsAgo: number; // 0 = currently employed (internal transfer)
  isInternalTransfer: boolean;
  boosts: {
    readinessBoost: number;
    conversionBoost: number;
    technicalFitBoost: number;
  };
  version: string;
}

// Combined Diagnostic Intelligence Output
export interface DiagnosticIntelligence {
  archetypeProfile: ArchetypeProfile;
  roundForecasts: InterviewRoundForecasts;
  cognitiveRiskMap: CognitiveRiskMap;
  trajectoryProjection: TrajectoryProjection;
  recruiterSimulation: RecruiterSimulation;
  practiceIntelligence?: PracticeIntelligence;
  evidenceContext?: EvidenceContext;
  hireZoneAnalysis?: HireZoneAnalysis;
  competencyHeatmap?: CompetencyHeatmapData;
  companyDifficulty?: CompanyDifficultyContext;
  priorEmploymentSignal?: PriorEmploymentSignal;
  executiveScores?: {
    readinessScore: number;
    conversionLikelihood: number;
    technicalFit: number;
  };
  generatedAt: string;
  version: string;
}

// ============================================
// Phase 7c: Practice Intelligence Types
// ============================================

// Practice Sync Intelligence — coding + mock readiness
export interface PracticeSyncIntelligence {
  codingExposure: {
    score: number; // 0-1
    level: 'low' | 'moderate' | 'high';
    signals: string[];
  };
  mockReadiness: {
    score: number; // 0-1
    level: 'low' | 'moderate' | 'high';
    signals: string[];
  };
  overallPracticeReadiness: number; // 0-100
  recommendation: string;
  version: string;
}

// Single practice prescription
export type PracticeType = 'coding' | 'mock_interview' | 'review' | 'drill' | 'project';

export interface PracticePrescription {
  id: string;
  title: string;
  targetGap: string;
  mappedRiskId: string;
  practiceType: PracticeType;
  estimatedSessions: number;
  estimatedMinutesPerSession: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: 'critical' | 'high' | 'medium';
  rationale: string;
}

// Precision Practice Rx — aggregated prescriptions
export interface PrecisionPracticeRx {
  prescriptions: PracticePrescription[];
  totalEstimatedHours: number;
  focusSummary: string;
  version: string;
}

// Pressure Handling Index
export type PressureBand = 'low' | 'moderate' | 'high' | 'elite';

export interface PressureHandlingIndex {
  score: number; // 0-100
  band: PressureBand;
  dimensions: {
    timeConstraintResilience: number; // 0-1
    ambiguityTolerance: number; // 0-1
    technicalConfidence: number; // 0-1
    communicationUnderStress: number; // 0-1
  };
  weakestDimension: string;
  strongestDimension: string;
  coachingNote: string;
  version: string;
}

// Consistency & Momentum Score
export type MomentumBand = 'stalled' | 'inconsistent' | 'steady' | 'strong_momentum';

export interface ConsistencyMomentumScore {
  score: number; // 0-100
  band: MomentumBand;
  signals: {
    skillBreadth: number; // 0-1
    evidenceRecency: number; // 0-1
    depthVsBreadth: number; // 0-1
    progressionClarity: number; // 0-1
  };
  insights: string[];
  recommendation: string;
  version: string;
}

// Combined Practice Intelligence Output
export interface PracticeIntelligence {
  practiceSync: PracticeSyncIntelligence;
  practiceRx: PrecisionPracticeRx;
  pressureIndex: PressureHandlingIndex;
  consistencyMomentum: ConsistencyMomentumScore;
  generatedAt: string;
  version: string;
}

// Extended LLM Analysis with Recruiter Signals
export interface RecruiterSignals {
  immediateRedFlags: string[];
  hiddenStrengths: string[];
  estimatedScreenTimeSeconds: number;
  firstImpression: FirstImpression;
  internalNotes?: RecruiterInternalNotes;
  debriefSummary?: RecruiterDebriefSummary;
  candidatePositioning?: CandidatePositioning;
}

// Personalized Coaching (LLM-generated specific advice)
export interface PriorityAction {
  action: string;
  rationale: string;
  resources?: string[];
}

export interface PersonalizedCoaching {
  archetypeTips: string[]; // 4 tips specific to this candidate
  roundFocus: string; // Specific focus advice for weakest round
  priorityActions: PriorityAction[]; // Top 3 immediate actions
}

// ============================================
// Personalized Study Plan Types
// ============================================

export type InterviewTimeline = '1day' | '3days' | '1week' | '2weeks' | '4weeks_plus';
export type ExperienceLevel = 'intern' | 'entry' | 'mid';
export type FocusArea =
  | 'technical_depth'
  | 'behavioral_stories'
  | 'system_design'
  | 'communication'
  | 'domain_knowledge';

export interface PrepPreferences {
  timeline: InterviewTimeline;
  dailyHours: number;
  experienceLevel: ExperienceLevel;
  focusAreas: FocusArea[];
  additionalContext?: string;
}

export interface DetailedTask {
  id: string;
  task: string;
  description: string;
  timeEstimateMinutes: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  mappedRiskId: string;
  category: 'technical' | 'behavioral' | 'practice' | 'review';
}

export interface DailyPlan {
  dayNumber: number;
  label: string;
  theme: string;
  totalMinutes: number;
  tasks: DetailedTask[];
}

export interface PersonalizedStudyPlan {
  preferences: PrepPreferences;
  totalDays: number;
  totalHours: number;
  dailyPlans: DailyPlan[];
  version: string;
}

// ============================================
// Interview Insights Types
// ============================================

// ============================================
// Waitlist Types
// ============================================

export type WaitlistStatus = 'pending' | 'confirmed' | 'launched';
export type WaitlistTier = 'top100' | 'top500' | 'standard';

export interface WaitlistEntry {
  id: string;
  email: string;
  status: WaitlistStatus;
  confirmationToken: string;
  confirmedAt: string | null;
  referralCode: string;
  referredBy: string | null;
  referralCount: number;
  position: number | null;
  createdAt: string;
}

export interface WaitlistJoinResponse {
  message: string;
  alreadyJoined?: boolean;
}

export interface WaitlistConfirmResponse {
  position: number;
  referralCode: string;
  tier: WaitlistTier;
  alreadyConfirmed?: boolean;
}

export interface WaitlistStatusResponse {
  status: WaitlistStatus;
  position: number | null;
  totalCount: number;
  referralCode: string;
  referralCount: number;
  tier: WaitlistTier | null;
}

export interface WaitlistCountResponse {
  count: number;
}

// ============================================
// Interview Insights Types
// ============================================

export interface AggregateInsightStats {
  totalAnalyses: number;
  avgReadinessScore: number;
  riskBandDistribution: { band: string; count: number; percentage: number }[];
  roundTypeDistribution: { roundType: string; count: number; percentage: number }[];
  avgScoreByRound: { roundType: string; avgScore: number }[];
}
