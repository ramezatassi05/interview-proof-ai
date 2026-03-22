import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { extractTextFromPDF } from '@/server/rag/extraction';
import { parseResumeText, flattenSkills, inferExperienceLevel } from '@/server/resume-parser';

const TextBodySchema = z.object({
  text: z.string().min(50, 'Resume text too short (minimum 50 characters)'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await checkRateLimit({
      prefix: 'resume-parse',
      identifier: `user:${user.id}`,
      maxRequests: 10,
      windowSeconds: 3600,
    });
    if (!allowed) return rateLimitResponse(3600);

    let rawText: string;
    let fileName: string | undefined;
    let fileType: string | undefined;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      // File upload path
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are supported. Please upload a PDF.' },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size must be less than 5MB' },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate PDF magic bytes (MIME type alone is client-spoofable)
      if (!buffer.toString('utf8', 0, 5).startsWith('%PDF-')) {
        return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
      }

      rawText = await extractTextFromPDF(buffer);

      if (!rawText) {
        return NextResponse.json(
          {
            error:
              'No readable text found in this PDF. It may be a scanned image. Try pasting your resume text instead.',
          },
          { status: 400 }
        );
      }

      fileName = file.name;
      fileType = 'pdf';
    } else {
      // Text paste path
      const body = await request.json();
      const validation = TextBodySchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid input', details: validation.error.flatten() },
          { status: 400 }
        );
      }

      rawText = validation.data.text;
      fileType = 'text';
    }

    // Parse resume with LLM
    const parsedData = await parseResumeText(rawText);
    const skills = flattenSkills(parsedData);
    const experienceLevel = inferExperienceLevel(parsedData);

    // Upsert into user_resumes (UNIQUE constraint on user_id means replace)
    const { data: resume, error: upsertError } = await supabase
      .from('user_resumes')
      .upsert(
        {
          user_id: user.id,
          raw_text: rawText,
          file_name: fileName,
          file_type: fileType,
          parsed_data: parsedData,
          skills,
          skill_ids: [],
          target_role: parsedData.targetRole || null,
          experience_level: experienceLevel,
          graduation_date:
            parsedData.education?.[0]?.graduationDate || null,
          updated_at: new Date().toISOString(),
          last_parsed_at: new Date().toISOString(),
          parse_version: 'v1.0',
        },
        { onConflict: 'user_id' }
      )
      .select('*')
      .single();

    if (upsertError) {
      console.error('Resume upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to save resume' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        resume: {
          id: resume.id,
          userId: resume.user_id,
          rawText: resume.raw_text,
          fileName: resume.file_name,
          fileType: resume.file_type,
          parsedData: resume.parsed_data,
          skills: resume.skills,
          skillIds: resume.skill_ids,
          targetRole: resume.target_role,
          targetIndustry: resume.target_industry,
          experienceLevel: resume.experience_level,
          graduationDate: resume.graduation_date,
          createdAt: resume.created_at,
          updatedAt: resume.updated_at,
          lastParsedAt: resume.last_parsed_at,
          parseVersion: resume.parse_version,
        },
        message: 'Resume parsed successfully',
      },
    });
  } catch (error) {
    console.error('Resume parse error:', error);

    const message = error instanceof Error ? error.message : '';

    if (message.includes('encrypt') || message.includes('password')) {
      return NextResponse.json(
        {
          error:
            'This PDF is password-protected. Please remove the password and re-upload, or paste your resume text instead.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to parse resume. Please try again.' },
      { status: 500 }
    );
  }
}
