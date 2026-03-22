import { z } from 'zod';
import { getOpenAIClient, MODELS } from '@/lib/openai';
import type { ParsedResume, CareerStage } from '@/types';

// ============================================
// Zod schema for LLM output validation
// ============================================

const ParsedResumeSchema = z.object({
  name: z.string().optional().default(''),
  email: z.string().optional().default(''),
  location: z.string().optional().default(''),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        graduationDate: z.string().optional(),
        gpa: z.string().optional(),
        relevantCourses: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string(),
        title: z.string(),
        dates: z.string(),
        durationMonths: z.number().optional(),
        skills: z.array(z.string()).optional().default([]),
        description: z.string().optional().default(''),
      })
    )
    .optional()
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        skills: z.array(z.string()).optional().default([]),
        url: z.string().optional(),
      })
    )
    .optional()
    .default([]),
  skills: z
    .object({
      languages: z.array(z.string()).optional().default([]),
      frameworks: z.array(z.string()).optional().default([]),
      tools: z.array(z.string()).optional().default([]),
      databases: z.array(z.string()).optional().default([]),
      concepts: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({
      languages: [],
      frameworks: [],
      tools: [],
      databases: [],
      concepts: [],
    }),
  certifications: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  targetRole: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
  yearsOfExperience: z
    .number()
    .nullable()
    .optional()
    .transform((v) => v ?? undefined),
});

// ============================================
// System prompt for resume parsing
// ============================================

const RESUME_PARSE_PROMPT = `You are an expert resume parser. Extract structured information from the following resume text.

Return a JSON object with this exact structure:
{
  "name": "Full Name",
  "email": "email@example.com or empty string",
  "location": "City, State or empty string",
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree Type and Major",
      "graduationDate": "Month Year or empty string",
      "gpa": "GPA if listed or empty string",
      "relevantCourses": ["Course 1", "Course 2"]
    }
  ],
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "dates": "Start Date - End Date",
      "durationMonths": 12,
      "skills": ["skill1", "skill2"],
      "description": "Brief summary of key responsibilities and achievements"
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "What the project does and what was built",
      "skills": ["skill1", "skill2"],
      "url": "URL if listed"
    }
  ],
  "skills": {
    "languages": ["Python", "JavaScript"],
    "frameworks": ["React", "Django"],
    "tools": ["Docker", "Git"],
    "databases": ["PostgreSQL", "Redis"],
    "concepts": ["Machine Learning", "System Design"]
  },
  "certifications": ["Cert Name"],
  "interests": ["Interest 1"],
  "targetRole": "Inferred target role based on experience and skills",
  "yearsOfExperience": 3.5
}

Guidelines:
- Extract ALL skills mentioned anywhere (technical, tools, frameworks, languages, databases)
- Categorize skills into languages, frameworks, tools, databases, and concepts
- Also infer standard skills implied by roles and seniority (e.g., Git, CI/CD, code reviews for any senior engineer)
- For experience: extract concrete achievements, calculate durationMonths from dates
- For projects: capture technical details and skills used
- Infer targetRole from the most recent roles and overall career trajectory
- Calculate yearsOfExperience by summing all job/internship durations (in years, with decimals)
- If education lists relevant courses, include them
- If no data for a field, use empty string, empty array, or null as appropriate

Return ONLY valid JSON, no other text.

Resume Text:
`;

// ============================================
// Core parsing function
// ============================================

/**
 * Parses raw resume text into structured data using LLM.
 * Uses gpt-4o-mini for cost efficiency — same pattern as extractResumeData in rag/extraction.ts.
 */
export async function parseResumeText(rawText: string, retries = 2): Promise<ParsedResume> {
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
            content: RESUME_PARSE_PROMPT + rawText,
          },
        ],
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from LLM');
      }

      const parsed = JSON.parse(content);
      const validated = ParsedResumeSchema.parse(parsed);
      return validated;
    } catch (error) {
      if (attempt === retries) {
        console.error('Resume parsing failed after retries:', error);
        throw new Error(
          `Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      console.warn(`Resume parsing attempt ${attempt + 1} failed, retrying...`);
    }
  }

  // TypeScript needs this, but we'll never reach here
  throw new Error('Unexpected resume parsing failure');
}

// ============================================
// Helper utilities
// ============================================

/**
 * Flattens all skills from a parsed resume into a single deduplicated array.
 * Collects from skills categories, experience skills, and project skills.
 */
export function flattenSkills(parsed: ParsedResume): string[] {
  const allSkills = new Set<string>();

  // From categorized skills
  const categories = parsed.skills;
  if (categories) {
    for (const arr of Object.values(categories)) {
      if (Array.isArray(arr)) {
        for (const skill of arr) {
          allSkills.add(skill.toLowerCase().trim());
        }
      }
    }
  }

  // From experience
  for (const exp of parsed.experience) {
    for (const skill of exp.skills) {
      allSkills.add(skill.toLowerCase().trim());
    }
  }

  // From projects
  for (const proj of parsed.projects) {
    for (const skill of proj.skills) {
      allSkills.add(skill.toLowerCase().trim());
    }
  }

  return Array.from(allSkills).filter(Boolean).sort();
}

/**
 * Infers experience level from parsed resume data.
 * Uses years of experience as primary signal, falls back to education.
 */
export function inferExperienceLevel(parsed: ParsedResume): CareerStage {
  const years = parsed.yearsOfExperience ?? 0;

  if (years === 0) {
    // Check if they have any experience entries at all
    const hasExperience = parsed.experience.length > 0;
    if (!hasExperience) {
      return 'student';
    }
    return 'new_grad';
  }

  if (years <= 1) return 'new_grad';
  if (years <= 3) return 'junior';
  return 'mid';
}
