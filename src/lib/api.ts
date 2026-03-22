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
  UserResume,
  CareerAdvisorMessage,
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

// Phase 9: Career Advisor
export interface ParseResumeResponse {
  data: {
    resume: UserResume;
    message: string;
  };
}

export interface GetResumeResponse {
  data: {
    resume: UserResume | null;
  };
}

export interface CareerAdvisorChatResponse {
  data: {
    response: string;
    requiresResume: boolean;
  };
}

// Routes that run the full LLM pipeline and need longer timeouts
const PIPELINE_ROUTES = ['/report/analyze', '/report/analyze/llm', '/report/rerun'];

class APIClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const isPipeline = PIPELINE_ROUTES.some((r) => endpoint.startsWith(r));
    const timeoutMs = isPipeline ? 330_000 : 120_000; // Pipeline: 5.5min (exceeds server 300s maxDuration)

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

      const text = await res.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        if (res.status === 504 || text.toLowerCase().includes('error occurred')) {
          throw new Error(
            'The analysis timed out. This can happen with complex resumes. Please try again.'
          );
        }
        throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
      }

      if (!res.ok) {
        const error = data as APIError;
        throw new APIRequestError(error.error || 'Request failed', res.status, error);
      }

      return data as T;
    } catch (err) {
      if (err instanceof APIRequestError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(
          isPipeline
            ? 'The analysis is taking longer than expected. This can happen with complex resumes — please try again.'
            : 'The request timed out. Please check your connection and try again.'
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

  /** Legacy: calls monolithic analyze endpoint. Used by rerun flow. */
  async analyzeReport(reportId: string): Promise<AnalyzeReportResponse> {
    return this.request<AnalyzeReportResponse>('/report/analyze', {
      method: 'POST',
      body: JSON.stringify({ reportId }),
    });
  }

  /** Step 1: Extract resume/JD + retrieve context (~8s) */
  async prepareAnalysis(reportId: string): Promise<{ data: { step: string } }> {
    return this.request('/report/analyze/prepare', {
      method: 'POST',
      body: JSON.stringify({ reportId }),
    });
  }

  /** Step 2: Run Claude LLM analysis (~35-55s). Uses streaming to avoid Vercel 60s timeout. */
  async runAnalysisLLM(reportId: string): Promise<{ data: { step: string } }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 330_000); // 5.5min — exceeds server 300s maxDuration

    try {
      const res = await fetch(`${API_BASE}/report/analyze/llm`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId }),
      });

      const text = await res.text();

      // Pre-stream errors (auth, validation) return normal JSON with non-200 status
      if (!res.ok) {
        let error: APIError;
        try {
          error = JSON.parse(text);
        } catch {
          throw new Error(
            res.status === 504
              ? 'The analysis timed out. This can happen with complex resumes. Please try again.'
              : `Server returned an invalid response (HTTP ${res.status})`
          );
        }
        throw new APIRequestError(error.error || 'Request failed', res.status, error);
      }

      // Streaming response: strip heartbeat spaces, parse final JSON
      const trimmed = text.trim();
      if (!trimmed) {
        throw new Error(
          'The analysis server closed the connection before completing. Please try again.'
        );
      }

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        throw new Error(
          'The analysis returned an incomplete response. This can happen under heavy load — please try again.'
        );
      }

      if (parsed.error) {
        throw new APIRequestError(parsed.error as string, 500, parsed as unknown as APIError);
      }

      return parsed as { data: { step: string } };
    } catch (err) {
      if (err instanceof APIRequestError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(
          'The analysis is taking longer than expected. This can happen with complex resumes — please try again.'
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

  /** Step 3: Deterministic scoring + store results (~5s) */
  async completeAnalysis(reportId: string): Promise<AnalyzeReportResponse> {
    return this.request<AnalyzeReportResponse>('/report/analyze/complete', {
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

  // Phase 9: Career Advisor

  async parseResume(file: File): Promise<ParseResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Bypass this.request() — FormData needs the browser to set Content-Type with boundary
    const res = await fetch(`${API_BASE}/resume/parse`, {
      method: 'POST',
      body: formData,
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server returned an invalid response (HTTP ${res.status})`);
    }

    if (!res.ok) {
      const error = data as APIError;
      throw new APIRequestError(error.error || 'Request failed', res.status, error);
    }

    return data as ParseResumeResponse;
  }

  async parseResumeText(text: string): Promise<ParseResumeResponse> {
    return this.request<ParseResumeResponse>('/resume/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getResume(): Promise<GetResumeResponse> {
    return this.request<GetResumeResponse>('/resume');
  }

  async deleteResume(): Promise<{ data: { message: string } }> {
    return this.request<{ data: { message: string } }>('/resume', {
      method: 'DELETE',
    });
  }

  async sendCareerAdvisorMessage(data: {
    message: string;
    conversationHistory?: CareerAdvisorMessage[];
  }): Promise<CareerAdvisorChatResponse> {
    return this.request<CareerAdvisorChatResponse>('/career-advisor/chat', {
      method: 'POST',
      body: JSON.stringify(data),
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
