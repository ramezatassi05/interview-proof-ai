import type { ExtractedResume, ExtractedJD } from '@/types';

/**
 * Extracts structured facts from resume text.
 * Uses LLM to parse into skills, experiences, metrics, etc.
 */
export async function extractResumeData(resumeText: string): Promise<ExtractedResume> {
  // TODO: Implement LLM-based extraction with strict JSON output
  console.log('Extracting resume data from text of length:', resumeText.length);

  return {
    skills: [],
    experiences: [],
    metrics: [],
    recencySignals: [],
    projectEvidence: [],
  };
}

/**
 * Extracts structured requirements from job description text.
 * Separates must-have vs nice-to-have requirements.
 */
export async function extractJDData(jdText: string): Promise<ExtractedJD> {
  // TODO: Implement LLM-based extraction with strict JSON output
  console.log('Extracting JD data from text of length:', jdText.length);

  return {
    mustHave: [],
    niceToHave: [],
    keywords: [],
    senioritySignals: [],
  };
}

/**
 * Extracts text from a PDF file.
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  // TODO: Implement PDF text extraction
  console.log('Extracting text from PDF of size:', pdfBuffer.length);
  return '';
}
