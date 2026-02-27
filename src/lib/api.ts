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
  ExtractedResume,
  ExtractedJD,
  QuestionFeedbackResponse,
  BestAnswerResponse,
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
    // Extracted data for evidence-backed claims
    extractedResume?: ExtractedResume;
    extractedJD?: ExtractedJD;
    // Sharing
    shareEnabled?: boolean;
    shareUrl?: string;
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

export interface QuestionFeedbackAPIResponse {
  data: QuestionFeedbackResponse;
}

export interface BestAnswerAPIResponse {
  data: BestAnswerResponse;
}

export interface GenerateQuestionsResponse {
  data: {
    questions: LLMAnalysis['interviewQuestions'];
  };
}

export interface ShareResponse {
  data: {
    shareEnabled: boolean;
    shareUrl: string;
  };
}

// Routes that run the full LLM pipeline and need longer timeouts
const PIPELINE_ROUTES = ['/report/analyze', '/report/rerun'];

class APIClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const isPipeline = PIPELINE_ROUTES.some((r) => endpoint.startsWith(r));
    const timeoutMs = isPipeline ? 150_000 : 120_000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        signal: controller.signal,
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
    } catch (err) {
      if (err instanceof APIRequestError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(
          'The request is taking too long. Please check your connection and try again.'
        );
      }
      if (err instanceof TypeError && err.message.includes('fetch')) {
        throw new Error(
          'Connection lost — the server may be busy or your network dropped. Please try again.'
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
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

  async getAnswerFeedback(
    reportId: string,
    data: { questionIndex: number; questionText: string; userAnswer: string }
  ): Promise<QuestionFeedbackAPIResponse> {
    return this.request<QuestionFeedbackAPIResponse>(`/report/${reportId}/questions/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBestAnswer(
    reportId: string,
    data: { questionIndex: number; questionText: string; why: string }
  ): Promise<BestAnswerAPIResponse> {
    return this.request<BestAnswerAPIResponse>(`/report/${reportId}/questions/best-answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateMoreQuestions(
    reportId: string,
    data: { existingQuestions: string[] }
  ): Promise<GenerateQuestionsResponse> {
    return this.request<GenerateQuestionsResponse>(`/report/${reportId}/questions/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async toggleShare(reportId: string, enabled: boolean): Promise<ShareResponse> {
    return this.request<ShareResponse>(`/report/${reportId}/share`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
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
