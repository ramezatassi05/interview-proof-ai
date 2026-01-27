import type {
  RoundType,
  RiskItem,
  LLMAnalysis,
  ScoreBreakdown,
  DeltaComparison,
  DiagnosticIntelligence,
  PrepPreferences,
  PersonalizedStudyPlan,
  PersonalizedCoaching,
} from '@/types';

const API_BASE = '/api';

// Error response type
interface APIError {
  error: string;
  details?: unknown;
  currentBalance?: number;
  requiredCredits?: number;
}

// Response types
export interface CreateReportResponse {
  data: {
    reportId: string;
    createdAt: string;
    message: string;
  };
}

export interface AnalyzeReportResponse {
  data: {
    reportId: string;
    readinessScore: number;
    riskBand: 'Low' | 'Medium' | 'High';
    top3Risks: RiskItem[];
    totalRisks: number;
    paywallState: 'free' | 'unlocked';
    message: string;
  };
}

export interface GetReportResponse {
  data: {
    reportId: string;
    roundType: RoundType;
    createdAt: string;
    paidUnlocked: boolean;
    analyzed: boolean;
    readinessScore?: number;
    riskBand?: 'Low' | 'Medium' | 'High';
    runCount?: number;
    // Free tier
    top3Risks?: RiskItem[];
    totalRisks?: number;
    paywallMessage?: string;
    // Paid tier
    allRisks?: RiskItem[];
    interviewQuestions?: LLMAnalysis['interviewQuestions'];
    studyPlan?: LLMAnalysis['studyPlan'];
    scoreBreakdown?: ScoreBreakdown;
    // Phase 7b: Diagnostic Intelligence
    diagnosticIntelligence?: DiagnosticIntelligence;
    // Personalized Study Plan
    prepPreferences?: PrepPreferences;
    personalizedStudyPlan?: PersonalizedStudyPlan;
    // Personalized Coaching (LLM-generated specific advice)
    personalizedCoaching?: PersonalizedCoaching;
  };
}

export interface UnlockReportResponse {
  data: {
    reportId: string;
    unlocked?: boolean;
    alreadyUnlocked?: boolean;
    creditsRemaining?: number;
    message: string;
  };
}

export interface RerunReportResponse {
  data: {
    reportId: string;
    runIndex: number;
    readinessScore: number;
    riskBand: 'Low' | 'Medium' | 'High';
    allRisks: RiskItem[];
    interviewQuestions: LLMAnalysis['interviewQuestions'];
    studyPlan: LLMAnalysis['studyPlan'];
    delta: DeltaComparison;
    message: string;
  };
}

export interface CheckoutResponse {
  data: {
    sessionId: string;
    url: string;
  };
}

class APIClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      const error = data as APIError;
      throw new APIRequestError(error.error || 'Request failed', res.status, error);
    }

    return data as T;
  }

  async createReport(input: {
    resumeText: string;
    jobDescriptionText: string;
    roundType: RoundType;
    prepPreferences?: PrepPreferences;
  }): Promise<CreateReportResponse> {
    return this.request<CreateReportResponse>('/report/create', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async analyzeReport(reportId: string): Promise<AnalyzeReportResponse> {
    return this.request<AnalyzeReportResponse>('/report/analyze', {
      method: 'POST',
      body: JSON.stringify({ reportId }),
    });
  }

  async getReport(reportId: string): Promise<GetReportResponse> {
    return this.request<GetReportResponse>(`/report/${reportId}`);
  }

  async unlockReport(reportId: string): Promise<UnlockReportResponse> {
    return this.request<UnlockReportResponse>('/report/unlock', {
      method: 'POST',
      body: JSON.stringify({ reportId }),
    });
  }

  async rerunReport(
    reportId: string,
    updates?: {
      updatedResumeText?: string;
      updatedJobDescriptionText?: string;
    }
  ): Promise<RerunReportResponse> {
    return this.request<RerunReportResponse>('/report/rerun', {
      method: 'POST',
      body: JSON.stringify({ reportId, ...updates }),
    });
  }

  async createCheckoutSession(reportId: string): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>('/checkout', {
      method: 'POST',
      body: JSON.stringify({ reportId }),
    });
  }
}

export class APIRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: APIError
  ) {
    super(message);
    this.name = 'APIRequestError';
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isPaymentRequired() {
    return this.status === 402;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }
}

export const api = new APIClient();
