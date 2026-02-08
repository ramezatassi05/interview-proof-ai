import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type { ExtractedResume, ExtractedJD } from '@/types';

// Zod schemas for validation
const ExtractedResumeSchema = z.object({
  skills: z.array(z.string()),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      dates: z.string(),
      achievements: z.array(z.string()),
    })
  ),
  metrics: z.array(z.string()),
  recencySignals: z.array(z.string()),
  projectEvidence: z.array(z.string()),
});

const ExtractedJDSchema = z.object({
  mustHave: z.array(z.string()),
  niceToHave: z.array(z.string()),
  keywords: z.array(z.string()),
  senioritySignals: z.array(z.string()),
  companyName: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});

const RESUME_EXTRACTION_PROMPT = `You are an expert resume parser. Extract structured information from the following resume text.

Return a JSON object with this exact structure:
{
  "skills": ["skill1", "skill2", ...],
  "experiences": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "dates": "Start - End",
      "achievements": ["achievement1", "achievement2", ...]
    }
  ],
  "metrics": ["metric1 with numbers", "metric2 with impact"],
  "recencySignals": ["recent technology", "current trends"],
  "projectEvidence": ["project description", "technical implementation"]
}

Guidelines:
- Extract ALL skills mentioned (technical, tools, frameworks, languages)
- ALSO infer standard industry skills that are obviously implied by the candidate's roles, seniority, and companies — even if not explicitly listed. For example:
  - A senior software engineer at any reputable tech company almost certainly uses version control (Git), pull requests, code reviews, CI/CD, agile methodologies, and unit testing daily — include these even if not spelled out.
  - A backend engineer working with microservices almost certainly has experience with REST APIs, logging, monitoring, and deployment pipelines.
  - A tech lead or staff engineer almost certainly has experience with architecture decisions, mentoring, and cross-team collaboration.
  - Only infer skills that are STANDARD PRACTICE for the role and seniority level. Do NOT infer specialized tools or frameworks (e.g., do not infer Kubernetes, Terraform, or specific cloud providers unless the resume provides direct evidence).
- For experiences, extract concrete achievements, not just responsibilities
- Metrics should include specific numbers, percentages, or quantified impact
- Recency signals indicate how current the candidate's experience is
- Project evidence shows hands-on technical work

Return ONLY valid JSON, no other text.

Resume Text:
`;

const JD_EXTRACTION_PROMPT = `You are an expert job description analyzer. Extract structured requirements from the following job description.

Return a JSON object with this exact structure:
{
  "mustHave": ["required skill/qualification 1", "required skill/qualification 2", ...],
  "niceToHave": ["preferred skill 1", "preferred skill 2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "senioritySignals": ["years of experience", "leadership indicators", ...],
  "companyName": "Company name if mentioned, or null"
}

Guidelines:
- mustHave: Requirements explicitly stated as required, mandatory, or essential
- niceToHave: Requirements stated as preferred, bonus, or nice-to-have
- keywords: Important technical terms, technologies, and domain concepts
- senioritySignals: Indicators of expected experience level (years, titles, leadership)
- companyName: The hiring company name if explicitly mentioned in the JD, otherwise null

Return ONLY valid JSON, no other text.

Job Description:
`;

/**
 * Extracts structured facts from resume text.
 * Uses LLM to parse into skills, experiences, metrics, etc.
 */
export async function extractResumeData(resumeText: string, retries = 2): Promise<ExtractedResume> {
  const openai = getOpenAIClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.extraction,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: RESUME_EXTRACTION_PROMPT + resumeText,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content);
      const validated = ExtractedResumeSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (attempt === retries) {
        console.error('Resume extraction failed after retries:', error);
        throw new Error(
          `Failed to extract resume data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      console.warn(`Resume extraction attempt ${attempt + 1} failed, retrying...`);
    }
  }

  // TypeScript needs this, but we'll never reach here
  throw new Error('Unexpected extraction failure');
}

/**
 * Extracts structured requirements from job description text.
 * Separates must-have vs nice-to-have requirements.
 */
export async function extractJDData(jdText: string, retries = 2): Promise<ExtractedJD> {
  const openai = getOpenAIClient();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: MODELS.extraction,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: JD_EXTRACTION_PROMPT + jdText,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content);
      const validated = ExtractedJDSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (attempt === retries) {
        console.error('JD extraction failed after retries:', error);
        throw new Error(
          `Failed to extract JD data: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      console.warn(`JD extraction attempt ${attempt + 1} failed, retrying...`);
    }
  }

  throw new Error('Unexpected extraction failure');
}

/**
 * Extracts text from a PDF buffer.
 * For MVP, we primarily support text input.
 * PDF extraction is a fallback that requires the pdf-parse library.
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer);
    return (data.text as string).trim();
  } catch (error) {
    console.error('PDF extraction failed:', error);
    throw new Error(
      `Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
